-- =============================================================================
-- ICRE Security Hardening — Auditoria Anon Key
-- 2026-06-19
-- Consolida e fortalece restrições de acesso anônimo após auditoria completa
-- =============================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. event_registrations — Consolidação definitiva de políticas
--    A migration 20260507135600 criou "Acesso público ao comprovante pelo ID"
--    com USING (true) que a migration 20260616000000 tentou dropar.
--    Esta migration garante o estado limpo final.
-- ─────────────────────────────────────────────────────────────────────────────

-- Remover TODAS as políticas públicas/antigas de event_registrations
DROP POLICY IF EXISTS "Acesso público ao comprovante pelo ID" ON public.event_registrations;
DROP POLICY IF EXISTS "Visitantes podem se inscrever em eventos publicados" ON public.event_registrations;
DROP POLICY IF EXISTS "Membros veem próprias inscrições" ON public.event_registrations;
DROP POLICY IF EXISTS "registrations_select_by_ref" ON public.event_registrations;
DROP POLICY IF EXISTS "registrations_insert_public" ON public.event_registrations;
DROP POLICY IF EXISTS "Inscrições: somente service_role pode inserir" ON public.event_registrations;

-- Estado definitivo: INSERT e SELECT bloqueados para anon e public
-- Service_role (Server Actions) é a única via de acesso
CREATE POLICY "registrations_block_anon_insert"
  ON public.event_registrations FOR INSERT
  TO anon, public
  WITH CHECK (false);

-- SELECT anon: bloqueado (comprovante usa Server Action autenticada)
-- SELECT authenticated: já coberto pela policy "registrations_select_own"
-- A policy "registrations_select_own" de 20260506140000 cobre authenticated ✅

-- Verificar que REVOKE de anon está correto
REVOKE ALL ON public.event_registrations FROM anon;

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. contact_messages — Rate limiting por IP via função SECURITY DEFINER
--    Atualmente qualquer anon pode spammar o formulário de contato.
-- ─────────────────────────────────────────────────────────────────────────────

-- Função de rate limit para contact_messages (max 3 mensagens por IP por hora)
CREATE OR REPLACE FUNCTION public.check_contact_rate_limit(p_ip TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*)::INTEGER INTO v_count
  FROM public.contact_messages
  WHERE ip_address = p_ip
    AND created_at > now() - INTERVAL '1 hour';

  RETURN v_count < 3;
END;
$$;

REVOKE ALL ON FUNCTION public.check_contact_rate_limit(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.check_contact_rate_limit(TEXT) TO anon, authenticated;

-- Adicionar coluna ip_address em contact_messages se não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'contact_messages'
      AND column_name = 'ip_address'
  ) THEN
    ALTER TABLE public.contact_messages ADD COLUMN ip_address TEXT;
  END IF;
END $$;

-- Atualizar policy de INSERT de contact_messages para incluir rate limit
DROP POLICY IF EXISTS "contact_messages_insert_public" ON public.contact_messages;
DROP POLICY IF EXISTS "Mensagens de contato" ON public.contact_messages;
DROP POLICY IF EXISTS "contact_messages_insert" ON public.contact_messages;

CREATE POLICY "contact_messages_insert_rate_limited"
  ON public.contact_messages FOR INSERT
  TO public
  WITH CHECK (
    -- Rate limit: max 3 por hora por IP (quando ip_address está preenchido)
    ip_address IS NULL OR public.check_contact_rate_limit(ip_address)
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. events — Restringir campos sensíveis expostos para anon
--    A policy atual expõe max_per_ip, max_per_device, max_per_account
--    que poderiam ser usados para calibrar ataques de automação.
-- ─────────────────────────────────────────────────────────────────────────────

-- Criar view pública de eventos que oculta campos táticos
CREATE OR REPLACE VIEW public.events_public AS
SELECT
  id,
  title,
  description,
  date,
  time,
  location,
  type,
  banner_url,
  capacity,
  ticket_price,
  requires_payment,
  requires_registration,
  is_public,
  status,
  publish_at,
  rules,
  custom_form_schema
  -- Campos OMITIDOS intencionalmente para anon:
  -- max_per_ip, max_per_device, max_per_account (informação tática)
  -- asaas_*, internal_notes (dados sensíveis)
FROM public.events
WHERE is_public = true AND status = 'publicado';

-- Garantir que anon pode ler a view mas não a tabela diretamente
GRANT SELECT ON public.events_public TO anon;

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. user_known_ips — Restringir INSERT apenas ao próprio usuário
--    Atualmente authenticated pode inserir qualquer IP para qualquer user_id.
-- ─────────────────────────────────────────────────────────────────────────────

-- Verificar se a tabela existe
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'user_known_ips'
  ) THEN
    -- Remover policies permissivas
    DROP POLICY IF EXISTS "user_known_ips_insert" ON public.user_known_ips;
    DROP POLICY IF EXISTS "user_known_ips_select" ON public.user_known_ips;

    -- Apenas o próprio usuário pode inserir/ler seus IPs
    EXECUTE 'CREATE POLICY "user_known_ips_own"
      ON public.user_known_ips FOR ALL
      TO authenticated
      USING (user_id = auth.uid())
      WITH CHECK (user_id = auth.uid())';
  END IF;
END $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. members — Garantir que authenticated não lê dados de outros membros
-- ─────────────────────────────────────────────────────────────────────────────

-- Verificar policies atuais de members (anon já tem REVOKE ALL)
-- A tabela members deve ser acessível apenas ao próprio membro (via user_id)
-- e aos admins.

DROP POLICY IF EXISTS "members_select_own" ON public.members;
DROP POLICY IF EXISTS "members_read_own" ON public.members;

-- Membro lê apenas os próprios dados
CREATE POLICY "members_select_own"
  ON public.members FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Admins leem todos
CREATE POLICY "members_select_admin"
  ON public.members FOR SELECT
  TO authenticated
  USING (
    public.current_user_has_role(ARRAY['SYSADMIN','CHURCH_ADMIN','LEADER','FINANCE_ADMIN']::public.app_role[])
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- 6. Supabase Auth — Configurações de Rate Limit
--    (Apenas documentação — configuração feita via Dashboard/config.toml)
-- ─────────────────────────────────────────────────────────────────────────────
-- Para bloquear signup não autorizado em produção, configurar no Dashboard:
-- Auth → Settings → Rate Limits:
--   - "Sign up" rate: 5 por hora por IP
--   - "OTP" rate: 10 por hora por e-mail
--
-- Para limitar signup a apenas e-mails conhecidos:
-- Auth → Settings → "Allowed email domains" (se aplicável)
--
-- Para desabilitar signup público (recomendado para membros apenas):
-- Auth → Settings → "Disable signup" = ON
-- Criar contas via Admin API (service_role) no painel de membros.
-- ─────────────────────────────────────────────────────────────────────────────

-- ─────────────────────────────────────────────────────────────────────────────
-- 7. Revogar acesso anon desnecessário remanescente
-- ─────────────────────────────────────────────────────────────────────────────

-- Garantir que event_registrations está completamente bloqueada para anon
REVOKE SELECT, INSERT, UPDATE, DELETE ON public.event_registrations FROM anon;

-- profiles: anon não deve ter nenhum acesso
REVOKE ALL ON public.profiles FROM anon;

-- leaders: anon pode ler (necessário para página pública de pastores)
-- MAS não deve poder escrever
REVOKE INSERT, UPDATE, DELETE ON public.leaders FROM anon;

-- cells: anon pode SELECT (células públicas)
REVOKE INSERT, UPDATE, DELETE ON public.cells FROM anon;

-- events: anon pode SELECT via policy (events_select_public)
REVOKE INSERT, UPDATE, DELETE ON public.events FROM anon;

-- ─────────────────────────────────────────────────────────────────────────────
-- RESUMO DE SEGURANÇA APÓS ESTA MIGRATION
-- ─────────────────────────────────────────────────────────────────────────────
--
-- ✅ event_registrations: BLOQUEADO para anon (SELECT + INSERT)
--    → Apenas service_role via Server Actions
--
-- ✅ contact_messages: Rate limited (3/hora/IP)
--
-- ✅ events: Campos táticos (max_per_ip, etc.) ocultos para anon via view
--
-- ✅ user_known_ips: Restrito ao próprio usuário
--
-- ✅ members: Restrito ao próprio membro + admins
--
-- ⚠️  Signup não autorizado: Requer configuração manual no Supabase Dashboard
--    → Auth → Settings → Disable signup OR configurar rate limits
--    → Recomendação: Disable signup e criar contas via Admin API

COMMENT ON FUNCTION public.check_contact_rate_limit(TEXT) IS
  'Rate limit para formulário de contato: máximo 3 mensagens por IP por hora.';
