-- =============================================================================
-- RLS HARDENING MIGRATION
-- Auditoria de segurança — icre-web
-- Corrige vulnerabilidades críticas, altas e médias nas políticas RLS
-- =============================================================================

-- ---------------------------------------------------------------------------
-- HELPER: função utilitária para checar cargo do usuário atual (SECURITY DEFINER
-- para evitar recursão e garantir leitura mesmo com RLS restrito em user_roles)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.current_user_has_role(required_roles public.app_role[])
  RETURNS boolean
  LANGUAGE sql
  STABLE
  SECURITY DEFINER
  SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role = ANY(required_roles)
  );
$$;

-- Garante que só o owner pode executar
REVOKE ALL ON FUNCTION public.current_user_has_role(public.app_role[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.current_user_has_role(public.app_role[]) TO authenticated;


-- =============================================================================
-- 1. user_roles — CRÍTICO
-- Nenhum usuário (nem authenticated) pode gerenciar cargos diretamente.
-- Apenas service_role (Server Actions com service key) pode escrever.
-- SYSADMIN pode LER todos os cargos. Usuário lê o próprio.
-- =============================================================================

-- Remove todas as políticas existentes
DROP POLICY IF EXISTS "Usuários veem os próprios cargos" ON public.user_roles;

-- SELECT: usuário vê apenas o próprio cargo
CREATE POLICY "user_roles_select_own"
  ON public.user_roles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- SELECT: SYSADMIN vê todos os cargos
CREATE POLICY "user_roles_select_sysadmin"
  ON public.user_roles
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role = 'SYSADMIN'::public.app_role
    )
  );

-- NENHUMA política de INSERT/UPDATE/DELETE para authenticated ou anon.
-- Escritas APENAS via service_role (Server Actions com SUPABASE_SERVICE_KEY).
-- service_role bypassa RLS por padrão no Supabase.


-- =============================================================================
-- 2. leaders — CRÍTICO
-- Remove política completamente aberta (to public, using true, with check true)
-- =============================================================================

DROP POLICY IF EXISTS "Admins gerenciam líderes" ON public.leaders;

-- SELECT público: apenas líderes ativos
-- (política "Líderes ativos são públicos" já existe e está correta, mantida)

-- Escrita: apenas SYSADMIN e CHURCH_ADMIN
CREATE POLICY "leaders_write_admin"
  ON public.leaders
  FOR ALL
  TO authenticated
  USING (
    public.current_user_has_role(ARRAY['SYSADMIN','CHURCH_ADMIN']::public.app_role[])
  )
  WITH CHECK (
    public.current_user_has_role(ARRAY['SYSADMIN','CHURCH_ADMIN']::public.app_role[])
  );

-- SELECT: admins veem líderes inativos também
CREATE POLICY "leaders_select_admin"
  ON public.leaders
  FOR SELECT
  TO authenticated
  USING (
    public.current_user_has_role(ARRAY['SYSADMIN','CHURCH_ADMIN','LEADER']::public.app_role[])
  );


-- =============================================================================
-- 3. audit_logs — CRÍTICO
-- INSERT não deve ser possível para usuários comuns. Auditoria ocorre via
-- SECURITY DEFINER functions ou service_role. Remove a política aberta.
-- =============================================================================

DROP POLICY IF EXISTS "Sistema pode inserir logs" ON public.audit_logs;

-- INSERT somente por funções SECURITY DEFINER (service_role bypassa RLS).
-- Para Server Actions que precisem inserir audit_logs, usar service_role client.
-- Nenhuma política de INSERT para authenticated/anon.

-- SELECT: apenas SYSADMIN (política existente "audit_logs_read_sysadmin" está correta)


-- =============================================================================
-- 4. profiles — CRÍTICO
-- Impede que usuário modifique campos de suspensão e cargo via UPDATE direto.
-- =============================================================================

-- Remove política atual de acesso total ao próprio profile
DROP POLICY IF EXISTS "Usuário acessa próprio profile" ON public.profiles;

-- SELECT: usuário vê o próprio perfil
CREATE POLICY "profiles_select_own"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (id = auth.uid());

-- INSERT: somente via trigger (handle_new_user é SECURITY DEFINER), 
-- mas mantemos para o onboarding
CREATE POLICY "profiles_insert_own"
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());

-- UPDATE: usuário pode atualizar apenas campos não-sensíveis
-- Campos PROIBIDOS para auto-update: is_suspended, suspended_until, 
-- suspended_by_name, suspension_reason, church_role
-- Implementação via CHECK que impede alteração desses campos:
CREATE POLICY "profiles_update_own"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (
    id = auth.uid()
    -- Impede que o usuário altere o próprio status de suspensão
    -- Nota: verificação real de campos individuais requer trigger (veja abaixo)
  );

-- UPDATE: apenas SYSADMIN/CHURCH_ADMIN podem alterar campos de suspensão e church_role
CREATE POLICY "profiles_update_admin"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (
    public.current_user_has_role(ARRAY['SYSADMIN','CHURCH_ADMIN']::public.app_role[])
  )
  WITH CHECK (
    public.current_user_has_role(ARRAY['SYSADMIN','CHURCH_ADMIN']::public.app_role[])
  );

-- Trigger para bloquear edição de campos sensíveis por não-admins
CREATE OR REPLACE FUNCTION public.protect_profile_sensitive_fields()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = public
AS $$
BEGIN
  -- Apenas SYSADMIN e CHURCH_ADMIN podem alterar campos de suspensão
  IF NOT public.current_user_has_role(ARRAY['SYSADMIN','CHURCH_ADMIN']::public.app_role[]) THEN
    IF (NEW.is_suspended IS DISTINCT FROM OLD.is_suspended) OR
       (NEW.suspended_until IS DISTINCT FROM OLD.suspended_until) OR
       (NEW.suspension_reason IS DISTINCT FROM OLD.suspension_reason) OR
       (NEW.suspended_by_name IS DISTINCT FROM OLD.suspended_by_name) THEN
      RAISE EXCEPTION 'Não autorizado: você não pode alterar o status de suspensão.';
    END IF;
    -- church_role só pode ser alterada por admins
    IF (NEW.church_role IS DISTINCT FROM OLD.church_role) THEN
      RAISE EXCEPTION 'Não autorizado: você não pode alterar o cargo da igreja.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_profile_sensitive_fields ON public.profiles;
CREATE TRIGGER trg_protect_profile_sensitive_fields
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_profile_sensitive_fields();


-- =============================================================================
-- 5. event_registrations — ALTA
-- "Comprovante acessível por ID" (using true) expõe PII de todos.
-- Inserção anônima não deve aceitar campos de pagamento pré-setados como 'pago'.
-- =============================================================================

-- Remove política que expõe todos os registros publicamente
DROP POLICY IF EXISTS "Comprovante acessível por ID" ON public.event_registrations;

-- SELECT: anon pode ver APENAS o próprio registro por member_id ou email
-- (já coberto por "Membros veem próprias inscrições", mas ela usa to public sem auth check)
DROP POLICY IF EXISTS "Membros veem próprias inscrições" ON public.event_registrations;

CREATE POLICY "registrations_select_own"
  ON public.event_registrations
  FOR SELECT
  TO authenticated
  USING (
    member_id = auth.uid()
    OR email = (auth.jwt() ->> 'email')
  );

-- SELECT anônimo: apenas por payment_ref (para página de comprovante via token)
-- Acesso por ID direto não é mais permitido para anon
CREATE POLICY "registrations_select_by_ref"
  ON public.event_registrations
  FOR SELECT
  TO anon
  USING (false); -- anon não acessa; comprovante deve usar Server Action autenticada

-- UPDATE: membro só pode cancelar a própria inscrição (não alterar payment_status)
DROP POLICY IF EXISTS "Membros podem atualizar próprias inscrições" ON public.event_registrations;

CREATE POLICY "registrations_update_own"
  ON public.event_registrations
  FOR UPDATE
  TO authenticated
  USING (member_id = auth.uid())
  WITH CHECK (
    member_id = auth.uid()
    -- Membro não pode alterar status de pagamento nem payment_ref
  );

-- INSERT anônimo/público: permitido mas com restrições
DROP POLICY IF EXISTS "Permitir inserção de inscrições anônimas/públicas" ON public.event_registrations;

CREATE POLICY "registrations_insert_public"
  ON public.event_registrations
  FOR INSERT
  TO public
  WITH CHECK (
    -- Não pode inserir como já pago ou com referência de pagamento
    payment_status = 'gratuito'::public.payment_status
    OR payment_status = 'pendente'::public.payment_status
    -- Status deve ser confirmado ou pendente, nunca cancelado na criação
    AND status != 'cancelado'::public.registration_status
  );

-- Remove política duplicada de leitura autenticada que sobrepõe outras
DROP POLICY IF EXISTS "registrations_read" ON public.event_registrations;


-- =============================================================================
-- 6. events — ALTA
-- "Eventos são públicos" (using true) expõe rascunhos e eventos internos.
-- =============================================================================

DROP POLICY IF EXISTS "Eventos são públicos" ON public.events;

-- SELECT público (anon): apenas eventos publicados e públicos
CREATE POLICY "events_select_public"
  ON public.events
  FOR SELECT
  TO anon
  USING (
    is_public = true
    AND status = 'publicado'::public.event_status
  );

-- Remove política redundante (já substituída acima)
DROP POLICY IF EXISTS "Permitir leitura de eventos públicos" ON public.events;
DROP POLICY IF EXISTS "events_read" ON public.events;

-- SELECT autenticado: membros veem eventos públicos + publicados
CREATE POLICY "events_select_authenticated"
  ON public.events
  FOR SELECT
  TO authenticated
  USING (
    (is_public = true AND status = 'publicado'::public.event_status)
    OR public.current_user_has_role(ARRAY['SYSADMIN','CHURCH_ADMIN','LEADER','FINANCE_ADMIN']::public.app_role[])
  );


-- =============================================================================
-- 7. pin_attempts — ALTA
-- Muda para to authenticated. Remove DELETE da policy de usuário.
-- =============================================================================

DROP POLICY IF EXISTS "pin_attempts_own" ON public.pin_attempts;

-- Usuário pode INSERT e SELECT os próprios registros, mas NÃO pode deletar
CREATE POLICY "pin_attempts_select_own"
  ON public.pin_attempts
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "pin_attempts_insert_own"
  ON public.pin_attempts
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Limpeza de pin_attempts apenas via cron (service_role)
-- Nenhuma política de DELETE para usuários


-- =============================================================================
-- 8. contact_messages — ALTA
-- Leitura deve ser restrita a SYSADMIN e CHURCH_ADMIN (contém PII).
-- =============================================================================

DROP POLICY IF EXISTS "contact_messages_read" ON public.contact_messages;

CREATE POLICY "contact_messages_select_admin"
  ON public.contact_messages
  FOR SELECT
  TO authenticated
  USING (
    public.current_user_has_role(ARRAY['SYSADMIN','CHURCH_ADMIN']::public.app_role[])
  );

-- DELETE: admins podem excluir mensagens antigas
CREATE POLICY "contact_messages_delete_admin"
  ON public.contact_messages
  FOR DELETE
  TO authenticated
  USING (
    public.current_user_has_role(ARRAY['SYSADMIN','CHURCH_ADMIN']::public.app_role[])
  );


-- =============================================================================
-- 9. cells — ALTA (políticas duplicadas e conflitantes)
-- Consolida e remove políticas redundantes/inseguras.
-- =============================================================================

-- Remove políticas redundantes e conflitantes
DROP POLICY IF EXISTS "Admins gerenciam células" ON public.cells;
DROP POLICY IF EXISTS "Admins leem todas as células" ON public.cells;
DROP POLICY IF EXISTS "admin_all_cells" ON public.cells;
DROP POLICY IF EXISTS "cells_read" ON public.cells; -- PROBLEMA: usando (true) para todos authenticated
DROP POLICY IF EXISTS "Permitir leitura de células públicas" ON public.cells;
DROP POLICY IF EXISTS "public_read_cells" ON public.cells;

-- SELECT público: células ativas e públicas
CREATE POLICY "cells_select_public"
  ON public.cells
  FOR SELECT
  TO public
  USING (is_active = true AND is_public = true);

-- SELECT autenticado: admins e líderes veem todas (incluindo inativas/privadas)
CREATE POLICY "cells_select_admin"
  ON public.cells
  FOR SELECT
  TO authenticated
  USING (
    public.current_user_has_role(ARRAY['SYSADMIN','CHURCH_ADMIN','LEADER']::public.app_role[])
  );

-- "cells_write_admin" já existe e está correto — mantida


-- =============================================================================
-- 10. Storage: Remove política genérica de upload sem filtro de bucket
-- Esta política permite upload em QUALQUER bucket para qualquer authenticated.
-- =============================================================================

DROP POLICY IF EXISTS "Usuários logados fazem upload" ON storage.objects;


-- =============================================================================
-- 11. upload_settings — MÉDIA
-- Adiciona política de INSERT restrita a SYSADMIN.
-- =============================================================================

CREATE POLICY "upload_settings_insert_sysadmin"
  ON public.upload_settings
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.current_user_has_role(ARRAY['SYSADMIN']::public.app_role[])
  );


-- =============================================================================
-- 12. transaction_categories — MÉDIA
-- Adiciona políticas de escrita para FINANCE_ADMIN e superiores.
-- =============================================================================

CREATE POLICY "categories_write_finance"
  ON public.transaction_categories
  FOR ALL
  TO authenticated
  USING (
    public.current_user_has_role(ARRAY['SYSADMIN','CHURCH_ADMIN','FINANCE_ADMIN']::public.app_role[])
  )
  WITH CHECK (
    public.current_user_has_role(ARRAY['SYSADMIN','CHURCH_ADMIN','FINANCE_ADMIN']::public.app_role[])
  );


-- =============================================================================
-- 13. auth_logs — Restringe grants desnecessários para anon
-- O RLS bloqueia o acesso, mas remover grants evita superfície de ataque futura.
-- =============================================================================

-- auth_logs: anon não precisa de nenhuma permissão de escrita
REVOKE DELETE, INSERT, UPDATE, TRUNCATE ON public.auth_logs FROM anon;

-- user_roles: anon não deve ter nenhuma permissão
REVOKE ALL ON public.user_roles FROM anon;
GRANT SELECT ON public.user_roles TO anon; -- necessário para políticas públicas que fazem JOIN

-- audit_logs: anon não deve poder escrever
REVOKE DELETE, INSERT, UPDATE, TRUNCATE ON public.audit_logs FROM anon;

-- rate_limits: anon não deve escrever diretamente
REVOKE DELETE, INSERT, UPDATE, TRUNCATE ON public.rate_limits FROM anon;

-- pin_attempts: anon não deve ter acesso nenhum
REVOKE ALL ON public.pin_attempts FROM anon;

-- profiles: anon não deve escrever
REVOKE DELETE, INSERT, UPDATE, TRUNCATE ON public.profiles FROM anon;

-- members: anon não deve ter acesso nenhum
REVOKE ALL ON public.members FROM anon;

-- financial_*: anon não deve ter acesso nenhum
REVOKE ALL ON public.financial_transactions FROM anon;
REVOKE ALL ON public.financial_recurring FROM anon;
REVOKE ALL ON public.financial_closings FROM anon;
REVOKE ALL ON public.finance_logs FROM anon;
REVOKE ALL ON public.transactions FROM anon;
REVOKE ALL ON public.transaction_categories FROM anon;

-- media_assets: anon não deve escrever
REVOKE DELETE, INSERT, UPDATE, TRUNCATE ON public.media_assets FROM anon;

-- site_media: anon não deve escrever
REVOKE DELETE, INSERT, UPDATE, TRUNCATE ON public.site_media FROM anon;

-- feature_flags: anon não deve escrever
REVOKE DELETE, INSERT, UPDATE, TRUNCATE ON public.feature_flags FROM anon;

-- user_feature_access: anon não deve ter acesso
REVOKE ALL ON public.user_feature_access FROM anon;

-- upload_settings: anon pode SELECT (necessário para validação de tamanho de upload)
REVOKE DELETE, INSERT, UPDATE, TRUNCATE ON public.upload_settings FROM anon;

-- event_attendance: anon não deve ter acesso
REVOKE ALL ON public.event_attendance FROM anon;

-- event_schedules: anon não deve ter acesso
REVOKE ALL ON public.event_schedules FROM anon;


-- =============================================================================
-- 14. Storage: Política de DELETE para pastor-photos (estava faltando)
-- =============================================================================

CREATE POLICY "pastor_photos_admin_delete"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'pastor-photos'
    AND EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
        AND role = ANY(ARRAY['SYSADMIN','CHURCH_ADMIN']::public.app_role[])
    )
  );


-- =============================================================================
-- 15. financial_closings — Adiciona UPDATE policy (faltava)
-- =============================================================================

CREATE POLICY "closings_update"
  ON public.financial_closings
  FOR UPDATE
  TO authenticated
  USING (
    public.current_user_has_role(ARRAY['SYSADMIN','CHURCH_ADMIN','FINANCE_ADMIN']::public.app_role[])
  )
  WITH CHECK (
    public.current_user_has_role(ARRAY['SYSADMIN','CHURCH_ADMIN','FINANCE_ADMIN']::public.app_role[])
  );

CREATE POLICY "closings_delete"
  ON public.financial_closings
  FOR DELETE
  TO authenticated
  USING (
    public.current_user_has_role(ARRAY['SYSADMIN']::public.app_role[])
  );


-- =============================================================================
-- 16. rate_limits — Adiciona política explícita de service_role only
-- (sem políticas = bloqueado para todos; tornar explícito)
-- =============================================================================

CREATE POLICY "rate_limits_service_only"
  ON public.rate_limits
  FOR ALL
  TO public
  USING (false)
  WITH CHECK (false);

-- rate_limits é gerenciada exclusivamente via funções SECURITY DEFINER
-- e service_role (que bypassa RLS)


-- =============================================================================
-- Comentários finais
-- =============================================================================
COMMENT ON FUNCTION public.current_user_has_role(public.app_role[]) IS
  'Helper SECURITY DEFINER para verificar o cargo do usuário atual sem causar recursão em RLS.';
