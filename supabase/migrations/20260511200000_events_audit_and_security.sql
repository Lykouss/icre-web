-- =============================================================================
-- ICRE Events & Payments — Security & Audit Migration
-- 2026-05-11: event_audit_logs, webhook_processed_events, user_known_ips,
--             pdf_download_logs, dynamic form columns, RPC lock, RLS hardening
-- =============================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. DYNAMIC FORM COLUMNS
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS custom_form_schema JSONB DEFAULT NULL;

ALTER TABLE public.event_registrations
  ADD COLUMN IF NOT EXISTS custom_form_responses JSONB DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS is_gift BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS gifted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS amount_paid NUMERIC(10,2) DEFAULT NULL;

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. WEBHOOK IDEMPOTENCY TABLE
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.webhook_processed_events (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asaas_event_id  TEXT NOT NULL UNIQUE,
  event_type      TEXT,
  processed_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.webhook_processed_events ENABLE ROW LEVEL SECURITY;

-- Somente service_role pode inserir; ninguém via API pública pode ler/alterar
DROP POLICY IF EXISTS "Webhook: somente service_role insere" ON public.webhook_processed_events;
CREATE POLICY "Webhook: somente service_role insere"
  ON public.webhook_processed_events FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. USER KNOWN IPS TABLE
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.user_known_ips (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ip_address    TEXT NOT NULL,
  last_seen_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, ip_address)
);

CREATE INDEX IF NOT EXISTS idx_user_known_ips_user ON public.user_known_ips(user_id);

ALTER TABLE public.user_known_ips ENABLE ROW LEVEL SECURITY;

-- SysAdmins podem ler para exibir no painel; usuário comum vê apenas os próprios
DROP POLICY IF EXISTS "IPs: admins veem todos" ON public.user_known_ips;
CREATE POLICY "IPs: admins veem todos"
  ON public.user_known_ips FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR public.current_user_has_role(ARRAY['SYSADMIN', 'CHURCH_ADMIN']::public.app_role[])
  );

-- INSERT e UPDATE somente via service_role (Server Actions com service key)
DROP POLICY IF EXISTS "IPs: somente service_role modifica" ON public.user_known_ips;
CREATE POLICY "IPs: somente service_role modifica"
  ON public.user_known_ips FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. PDF DOWNLOAD LOGS TABLE (rate limiting)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.pdf_download_logs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  registration_id UUID REFERENCES public.event_registrations(id) ON DELETE SET NULL,
  downloaded_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Critical index for the rate limit query
CREATE INDEX IF NOT EXISTS idx_pdf_logs_user_time
  ON public.pdf_download_logs(user_id, downloaded_at DESC);

ALTER TABLE public.pdf_download_logs ENABLE ROW LEVEL SECURITY;

-- Ninguém via API pode fazer UPDATE ou DELETE nesta tabela (imutabilidade)
DROP POLICY IF EXISTS "PDF logs: leitura apenas por admins" ON public.pdf_download_logs;
CREATE POLICY "PDF logs: leitura apenas por admins"
  ON public.pdf_download_logs FOR SELECT
  TO authenticated
  USING (public.current_user_has_role(ARRAY['SYSADMIN']::public.app_role[]));

DROP POLICY IF EXISTS "PDF logs: somente service_role insere" ON public.pdf_download_logs;
CREATE POLICY "PDF logs: somente service_role insere"
  ON public.pdf_download_logs FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Nenhuma policy de UPDATE/DELETE = bloqueado para todos via API

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. IMMUTABLE AUDIT LOG TABLE
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.event_audit_logs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name    TEXT NOT NULL,
  operation     TEXT NOT NULL,     -- INSERT | UPDATE | DELETE
  record_id     UUID,
  old_data      JSONB,
  new_data      JSONB,
  changed_by    UUID,              -- auth.uid() at the time
  changed_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_record ON public.event_audit_logs(table_name, record_id);
CREATE INDEX IF NOT EXISTS idx_audit_time   ON public.event_audit_logs(changed_at DESC);

ALTER TABLE public.event_audit_logs ENABLE ROW LEVEL SECURITY;

-- Somente leitura para SysAdmins; nenhuma escrita via API (triggers fazem o INSERT)
DROP POLICY IF EXISTS "Auditoria: somente leitura por SysAdmin" ON public.event_audit_logs;
CREATE POLICY "Auditoria: somente leitura por SysAdmin"
  ON public.event_audit_logs FOR SELECT
  TO authenticated
  USING (public.current_user_has_role(ARRAY['SYSADMIN']::public.app_role[]));

-- Nenhuma policy INSERT/UPDATE/DELETE via anon ou authenticated

-- ─────────────────────────────────────────────────────────────────────────────
-- 6. AUDIT TRIGGER FUNCTION
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.fn_audit_log()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _record_id UUID;
  _old_data  JSONB;
  _new_data  JSONB;
BEGIN
  IF TG_OP = 'INSERT' THEN
    _record_id := NEW.id;
    _new_data  := to_jsonb(NEW);
    _old_data  := NULL;
  ELSIF TG_OP = 'UPDATE' THEN
    _record_id := NEW.id;
    _old_data  := to_jsonb(OLD);
    _new_data  := to_jsonb(NEW);
  ELSIF TG_OP = 'DELETE' THEN
    _record_id := OLD.id;
    _old_data  := to_jsonb(OLD);
    _new_data  := NULL;
  END IF;

  INSERT INTO public.event_audit_logs (table_name, operation, record_id, old_data, new_data, changed_by)
  VALUES (TG_TABLE_NAME, TG_OP, _record_id, _old_data, _new_data, auth.uid());

  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Trigger para tabela events
DROP TRIGGER IF EXISTS trg_events_audit ON public.events;
CREATE TRIGGER trg_events_audit
  AFTER INSERT OR UPDATE OR DELETE ON public.events
  FOR EACH ROW EXECUTE FUNCTION public.fn_audit_log();

-- Trigger para tabela event_registrations
DROP TRIGGER IF EXISTS trg_registrations_audit ON public.event_registrations;
CREATE TRIGGER trg_registrations_audit
  AFTER INSERT OR UPDATE OR DELETE ON public.event_registrations
  FOR EACH ROW EXECUTE FUNCTION public.fn_audit_log();

-- ─────────────────────────────────────────────────────────────────────────────
-- 7. RACE CONDITION PREVENTION — RPC WITH ROW-LEVEL LOCK
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.insert_registration_with_lock(
  p_event_id              UUID,
  p_name                  TEXT,
  p_email                 TEXT,
  p_phone                 TEXT,
  p_cpf                   TEXT,
  p_status                TEXT,
  p_payment_status        TEXT,
  p_ip_address            TEXT,
  p_device_id             TEXT,
  p_member_id             UUID,
  p_custom_form_responses JSONB DEFAULT NULL
)
RETURNS TABLE(registration_id UUID, error_message TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_event       RECORD;
  v_count       INTEGER;
  v_reg_id      UUID;
BEGIN
  -- Lock the event row to prevent concurrent capacity checks
  SELECT id, capacity
  INTO v_event
  FROM public.events
  WHERE id = p_event_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN QUERY SELECT NULL::UUID, 'Evento não encontrado.'::TEXT;
    RETURN;
  END IF;

  -- Check capacity if limited
  IF v_event.capacity IS NOT NULL AND v_event.capacity > 0 THEN
    SELECT COUNT(*)::INTEGER INTO v_count
    FROM public.event_registrations
    WHERE event_id = p_event_id
      AND status IN ('confirmado', 'pendente_pagamento');

    IF v_count >= v_event.capacity THEN
      RETURN QUERY SELECT NULL::UUID, 'Evento lotado. Não há vagas disponíveis.'::TEXT;
      RETURN;
    END IF;
  END IF;

  -- Insert the registration
  INSERT INTO public.event_registrations (
    event_id, name, email, phone, cpf, status, payment_status,
    ip_address, device_id, member_id, custom_form_responses
  )
  VALUES (
    p_event_id, p_name, p_email, p_phone, p_cpf, p_status, p_payment_status,
    p_ip_address, p_device_id, p_member_id, p_custom_form_responses
  )
  RETURNING id INTO v_reg_id;

  RETURN QUERY SELECT v_reg_id, NULL::TEXT;
END;
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 8. RLS HARDENING — events table
-- ─────────────────────────────────────────────────────────────────────────────

-- Public SELECT: apenas publicados E com publish_at <= now()
DROP POLICY IF EXISTS "Eventos públicos visíveis" ON public.events;
CREATE POLICY "Eventos públicos visíveis"
  ON public.events FOR SELECT
  TO public
  USING (
    status = 'publicado'
    AND (publish_at IS NULL OR publish_at <= now())
  );

-- SysAdmin e Church Admin veem tudo
DROP POLICY IF EXISTS "Admins veem todos os eventos" ON public.events;
CREATE POLICY "Admins veem todos os eventos"
  ON public.events FOR SELECT
  TO authenticated
  USING (
    public.current_user_has_role(ARRAY['SYSADMIN', 'CHURCH_ADMIN']::public.app_role[])
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- 9. RLS HARDENING — event_registrations table
-- ─────────────────────────────────────────────────────────────────────────────

-- Remover política aberta de comprovante (era USING (true))
DROP POLICY IF EXISTS "Acesso público ao comprovante pelo ID" ON public.event_registrations;

-- Leitura: usuário vê apenas as próprias; admins veem todas
DROP POLICY IF EXISTS "Inscrições: usuário vê as próprias" ON public.event_registrations;
CREATE POLICY "Inscrições: usuário vê as próprias"
  ON public.event_registrations FOR SELECT
  TO authenticated
  USING (
    member_id = auth.uid()
    OR public.current_user_has_role(ARRAY['SYSADMIN', 'CHURCH_ADMIN']::public.app_role[])
  );

-- Service role (usado nas Server Actions) pode ler tudo
DROP POLICY IF EXISTS "Inscrições: service_role acesso total" ON public.event_registrations;
CREATE POLICY "Inscrições: service_role acesso total"
  ON public.event_registrations FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);

-- INSERT público: força status e payment_status seguros (evita bypass)
DROP POLICY IF EXISTS "Visitantes podem se inscrever em eventos publicados" ON public.event_registrations;
CREATE POLICY "Visitantes podem se inscrever em eventos publicados"
  ON public.event_registrations FOR INSERT
  TO public
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.events
      WHERE id = event_id
        AND status = 'publicado'
        AND (publish_at IS NULL OR publish_at <= now())
    )
    AND status IN ('confirmado', 'pendente_pagamento')
    AND payment_status IN ('gratuito', 'pendente')
  );

-- DELETE: usuário só pode cancelar se status for pendente_pagamento
DROP POLICY IF EXISTS "Inscrições: usuário pode cancelar pendente" ON public.event_registrations;
CREATE POLICY "Inscrições: usuário pode cancelar pendente"
  ON public.event_registrations FOR DELETE
  TO authenticated
  USING (
    member_id = auth.uid()
    AND payment_status = 'pendente'
  );

-- UPDATE: bloqueado para usuários comuns (somente service_role e admins)
-- A policy de service_role acima já cobre isso.

-- ─────────────────────────────────────────────────────────────────────────────
-- 10. GRANT EXECUTE on RPC to authenticated and anon
-- ─────────────────────────────────────────────────────────────────────────────

GRANT EXECUTE ON FUNCTION public.insert_registration_with_lock(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, UUID, JSONB)
  TO authenticated, anon;
