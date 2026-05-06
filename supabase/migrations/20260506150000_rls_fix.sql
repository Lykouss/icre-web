-- =============================================================================
-- RLS FIX: Corrige bugs críticos da migration de hardening
-- 20260506150000_rls_fix.sql
-- =============================================================================

-- =============================================================================
-- FIX 1 (CRÍTICO): Recursão infinita em user_roles_select_sysadmin
--
-- PROBLEMA: A policy consultava a própria tabela user_roles via subquery direta,
-- causando recursão infinita em qualquer SELECT autenticado na tabela.
-- Todo o sistema de RBAC ficou bloqueado, incluindo login.
--
-- SOLUÇÃO: Usar a função SECURITY DEFINER current_user_has_role() que já existe
-- e que, por rodar como owner (superuser), ignora o RLS da tabela user_roles,
-- quebrando o ciclo de recursão.
-- =============================================================================

DROP POLICY IF EXISTS "user_roles_select_sysadmin" ON public.user_roles;

CREATE POLICY "user_roles_select_sysadmin"
  ON public.user_roles
  FOR SELECT
  TO authenticated
  USING (
    public.current_user_has_role(ARRAY['SYSADMIN']::public.app_role[])
  );


-- =============================================================================
-- FIX 2 (CRÍTICO): Trigger protect_profile_sensitive_fields bloqueia service_role
--
-- PROBLEMA: Quando service_role atualiza profiles (ex: suspendAdmin, resetAdminPin
-- no admin-access.ts), auth.uid() retorna NULL. A função current_user_has_role()
-- retorna FALSE para NULL, então o trigger bloqueava qualquer update de campo
-- sensível mesmo quando feito por service_role (que deveria ter acesso total).
--
-- SOLUÇÃO: Se auth.uid() IS NULL, significa que é service_role ou trigger interno —
-- permitir a operação diretamente.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.protect_profile_sensitive_fields()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = public
AS $$
BEGIN
  -- service_role e funções internas (SECURITY DEFINER triggers) têm auth.uid() = NULL
  -- Nesses casos, o acesso é legítimo — permitir sem restrições
  IF auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;

  -- Apenas SYSADMIN e CHURCH_ADMIN podem alterar campos de suspensão
  IF NOT public.current_user_has_role(ARRAY['SYSADMIN','CHURCH_ADMIN']::public.app_role[]) THEN

    IF (NEW.is_suspended      IS DISTINCT FROM OLD.is_suspended)      OR
       (NEW.suspended_until   IS DISTINCT FROM OLD.suspended_until)   OR
       (NEW.suspension_reason IS DISTINCT FROM OLD.suspension_reason) OR
       (NEW.suspended_by_name IS DISTINCT FROM OLD.suspended_by_name) THEN
      RAISE EXCEPTION 'Não autorizado: você não pode alterar o status de suspensão.';
    END IF;

    -- church_role só pode ser alterada por admins
    IF NEW.church_role IS DISTINCT FROM OLD.church_role THEN
      RAISE EXCEPTION 'Não autorizado: você não pode alterar o cargo da igreja.';
    END IF;

  END IF;

  RETURN NEW;
END;
$$;


-- =============================================================================
-- FIX 3 (ALTA): Campos de onboarding/PIN bloqueados pelo trigger para o próprio usuário
--
-- PROBLEMA: Durante o onboarding, o usuário precisa gravar:
--   - security_pin_hash  (saveAdminPin em auth.ts linha 341)
--   - onboarding_step    (completeAdminOnboarding, acceptAdminTerms)
--   - admin_terms_accepted_at (acceptAdminTerms)
--   - admin_profile_completed_at (admin-onboarding actions)
--
-- O campo security_pin_hash NÃO está na lista de campos protegidos do trigger
-- (a lista protege is_suspended, suspended_until, suspension_reason,
-- suspended_by_name, church_role). Então o trigger não bloqueia o PIN.
--
-- MAS o campo onboarding_step também não está na lista de protegidos, então
-- updates como completeAdminOnboarding() e acceptAdminTerms() via client
-- autenticado devem passar sem problemas.
--
-- CONCLUSÃO: O trigger está correto para esses campos. Nenhuma alteração
-- necessária além do Fix 2 acima.
-- =============================================================================
-- (sem ação necessária aqui)


-- =============================================================================
-- FIX 4 (ALTA): Middleware faz UPDATE de is_suspended via client autenticado
--
-- PROBLEMA: Em middleware.ts linha 57, quando a suspensão expira, o código faz:
--   await supabase.from('profiles').update({ is_suspended: false, ... }).eq('id', user.id)
-- usando o client autenticado (não o admin). Com o Fix 2 acima, isso ainda
-- seria bloqueado pois o usuário não é SYSADMIN/CHURCH_ADMIN.
--
-- SOLUÇÃO: Criar uma função SECURITY DEFINER que pode ser chamada via RPC
-- para limpar suspensão expirada, OU mover a limpeza para o admin client
-- no middleware.
--
-- Como não podemos alterar o middleware via migration, resolvemos criando
-- uma função RPC que o middleware pode chamar com o client autenticado.
-- A função verifica internamente se a suspensão realmente expirou.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.clear_expired_suspension(p_user_id uuid)
  RETURNS void
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = public
AS $$
DECLARE
  v_suspended_until timestamptz;
  v_is_suspended    boolean;
BEGIN
  -- Só limpa se realmente expirou — o usuário só pode chamar para si mesmo
  IF auth.uid() IS NULL OR auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'Não autorizado.';
  END IF;

  SELECT is_suspended, suspended_until
    INTO v_is_suspended, v_suspended_until
    FROM public.profiles
   WHERE id = p_user_id;

  -- Só age se estiver suspenso E a suspensão já tiver passado
  IF v_is_suspended AND v_suspended_until IS NOT NULL AND v_suspended_until < now() THEN
    UPDATE public.profiles
       SET is_suspended      = false,
           suspended_until   = NULL,
           suspension_reason = NULL,
           suspended_by_name = NULL
     WHERE id = p_user_id;
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.clear_expired_suspension(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.clear_expired_suspension(uuid) TO authenticated;

COMMENT ON FUNCTION public.clear_expired_suspension(uuid) IS
  'Remove suspensão expirada do próprio usuário. SECURITY DEFINER para contornar proteção de campo.';


-- =============================================================================
-- FIX 5 (ALTA): cells — membros autenticados sem cargo não veem nenhuma célula
--
-- PROBLEMA: Após a consolidação das políticas de cells, ficou apenas:
--   - cells_select_public  (public, is_active AND is_public)
--   - cells_select_admin   (authenticated, apenas para admins/líderes)
-- Um membro autenticado comum (sem cargo admin) que quer ver a própria célula
-- na página de perfil público precisaria passar pela cells_select_public.
-- Isso funciona se a célula for is_public=true, mas pode falhar se for privada.
-- Adicionamos uma policy para membros verem sua própria célula via members join.
--
-- NOTA: A cells_select_public (TO public) já cobre anon e authenticated, então
-- membros autenticados JÁ veem células públicas e ativas. Esta policy adicional
-- permite que um membro veja a célula a qual pertence mesmo que seja privada.
-- =============================================================================

CREATE POLICY "cells_select_own_member"
  ON public.cells
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.members
       WHERE members.cell_id = cells.id
         AND members.user_id = auth.uid()
    )
  );


-- =============================================================================
-- FIX 6 (MÉDIA): Restabelecer SELECT mínimo de profiles para anon
--
-- PROBLEMA: A migration original tinha grants de SELECT para anon em profiles,
-- mas nunca havia uma RLS policy pública de SELECT. Com o hardening, removemos
-- a policy "Usuário acessa próprio profile" (que era for all, to authenticated).
-- Isso não quebra acesso anon direto (que nunca existiu por RLS), MAS algumas
-- queries públicas que fazem JOIN com profiles (ex: members_with_admins view,
-- site_blocks com updated_by join) podem falhar se executadas como anon.
--
-- A view members_with_admins já usa JOIN com user_roles, que agora tem policy
-- correta. Para o site público, profiles é acessado apenas quando logado.
-- Não é necessária nenhuma policy pública de SELECT em profiles.
-- =============================================================================
-- (sem ação necessária)


-- =============================================================================
-- FIX 7 (MÉDIA): Garantir que a policy profiles_update_own não conflite com
-- a política de admins ao ler/escrever campos de outros usuários
--
-- A policy profiles_update_admin (USING: current_user_has_role SYSADMIN/CHURCH_ADMIN)
-- já existe e permite que admins atualizem qualquer profile. O trigger Fix 2
-- agora permite essas atualizações via service_role.
--
-- Para atualizações feitas via client AUTENTICADO por um SYSADMIN/CHURCH_ADMIN
-- (ex: suspendAdmin com client não-admin erroneamente), o trigger vai checar a
-- função e permitir. Para atualizações via service_role (comportamento correto),
-- o Fix 2 permite diretamente.
-- =============================================================================
-- (sem ação necessária)


-- =============================================================================
-- Verificação de sanidade: garante que as funções SECURITY DEFINER existem
-- =============================================================================

DO $$
BEGIN
  -- Verifica current_user_has_role
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'current_user_has_role'
  ) THEN
    RAISE EXCEPTION 'ERRO: função current_user_has_role não encontrada. Execute a migration 20260506140000 primeiro.';
  END IF;
END $$;
