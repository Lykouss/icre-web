-- =============================================================================
-- ICRE — Support Module: Help Desk, Suporte e Feedback
-- 2026-06-24
-- Criação das tabelas, Storage buckets, RLS policies, RPCs e índices para o
-- módulo completo de suporte ao usuário.
-- =============================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. ENUM Types
-- ─────────────────────────────────────────────────────────────────────────────

DO $$ BEGIN
  CREATE TYPE public.ticket_status AS ENUM ('open', 'in_progress', 'waiting_user', 'closed');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.ticket_urgency AS ENUM ('low', 'medium', 'high');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.feedback_type AS ENUM ('bug', 'suggestion');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. Tabela: support_tickets
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.support_tickets (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject      TEXT NOT NULL CHECK (char_length(subject) BETWEEN 5 AND 120),
  description  TEXT NOT NULL CHECK (char_length(description) BETWEEN 10 AND 2000),
  status       public.ticket_status NOT NULL DEFAULT 'open',
  urgency      public.ticket_urgency NOT NULL DEFAULT 'low',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  closed_at    TIMESTAMPTZ
);

ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

-- Índices
CREATE INDEX IF NOT EXISTS idx_support_tickets_user_id     ON public.support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status      ON public.support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_urgency_upd ON public.support_tickets(urgency, updated_at DESC);

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. Tabela: support_ticket_messages
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.support_ticket_messages (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id        UUID NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  sender_id        UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_admin         BOOLEAN NOT NULL DEFAULT false,
  content          TEXT NOT NULL CHECK (char_length(content) BETWEEN 1 AND 4000),
  attachment_urls  TEXT[] NOT NULL DEFAULT '{}',
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  read_at          TIMESTAMPTZ
);

ALTER TABLE public.support_ticket_messages ENABLE ROW LEVEL SECURITY;

-- Índices
CREATE INDEX IF NOT EXISTS idx_support_msgs_ticket_id  ON public.support_ticket_messages(ticket_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_support_msgs_sender_id  ON public.support_ticket_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_support_msgs_unread     ON public.support_ticket_messages(ticket_id, read_at) WHERE read_at IS NULL;

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. Tabela: feedback
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.feedback (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content    TEXT NOT NULL CHECK (char_length(content) BETWEEN 20 AND 500),
  type       public.feedback_type NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_feedback_user_id    ON public.feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_feedback_created_at ON public.feedback(created_at DESC);

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. Trigger: atualizar updated_at em support_tickets
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.update_support_ticket_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_support_ticket_updated_at ON public.support_tickets;
CREATE TRIGGER trg_support_ticket_updated_at
  BEFORE UPDATE ON public.support_tickets
  FOR EACH ROW EXECUTE FUNCTION public.update_support_ticket_updated_at();

-- Trigger: ao receber mensagem, atualiza updated_at do ticket
CREATE OR REPLACE FUNCTION public.update_ticket_on_message()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.support_tickets
  SET updated_at = now()
  WHERE id = NEW.ticket_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_update_ticket_on_message ON public.support_ticket_messages;
CREATE TRIGGER trg_update_ticket_on_message
  AFTER INSERT ON public.support_ticket_messages
  FOR EACH ROW EXECUTE FUNCTION public.update_ticket_on_message();

-- ─────────────────────────────────────────────────────────────────────────────
-- 6. RPC: Verificar rate limit de mensagens no chat (5/minuto por usuário/ticket)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.rpc_check_chat_rate_limit(
  p_ticket_id  UUID,
  p_sender_id  UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*)::INTEGER INTO v_count
  FROM public.support_ticket_messages
  WHERE ticket_id  = p_ticket_id
    AND sender_id  = p_sender_id
    AND created_at > now() - INTERVAL '1 minute';

  RETURN v_count < 5;
END;
$$;

REVOKE ALL ON FUNCTION public.rpc_check_chat_rate_limit(UUID, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.rpc_check_chat_rate_limit(UUID, UUID) TO authenticated;

-- ─────────────────────────────────────────────────────────────────────────────
-- 7. RPC: Auto-encerrar tickets inativos há 15 dias (status = waiting_user)
-- Deve ser chamado via cron (Supabase Scheduled Functions ou pg_cron)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.rpc_auto_close_inactive_tickets()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  UPDATE public.support_tickets
  SET
    status    = 'closed',
    closed_at = now(),
    updated_at = now()
  WHERE status     = 'waiting_user'
    AND updated_at < now() - INTERVAL '15 days';

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

REVOKE ALL ON FUNCTION public.rpc_auto_close_inactive_tickets() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.rpc_auto_close_inactive_tickets() TO service_role;

-- ─────────────────────────────────────────────────────────────────────────────
-- 8. RPC: Listar tickets fechados há > 30 dias para limpeza de Storage
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.rpc_get_tickets_for_archive_cleanup()
RETURNS TABLE(ticket_id UUID, attachment_urls TEXT[])
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    m.ticket_id,
    array_agg(DISTINCT url) FILTER (WHERE url IS NOT NULL) AS attachment_urls
  FROM public.support_ticket_messages m
  CROSS JOIN LATERAL unnest(m.attachment_urls) AS url
  WHERE EXISTS (
    SELECT 1 FROM public.support_tickets t
    WHERE t.id = m.ticket_id
      AND t.status = 'closed'
      AND t.closed_at < now() - INTERVAL '30 days'
  )
  GROUP BY m.ticket_id;
END;
$$;

REVOKE ALL ON FUNCTION public.rpc_get_tickets_for_archive_cleanup() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.rpc_get_tickets_for_archive_cleanup() TO service_role;

-- ─────────────────────────────────────────────────────────────────────────────
-- 9. RLS Policies — support_tickets
-- ─────────────────────────────────────────────────────────────────────────────

-- Usuário lê apenas os seus próprios tickets
CREATE POLICY "tickets_select_own"
  ON public.support_tickets FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Admin lê todos
CREATE POLICY "tickets_select_admin"
  ON public.support_tickets FOR SELECT
  TO authenticated
  USING (
    public.current_user_has_role(ARRAY['SYSADMIN','CHURCH_ADMIN','LEADER','FINANCE_ADMIN']::public.app_role[])
  );

-- Usuário cria apenas para si mesmo
CREATE POLICY "tickets_insert_own"
  ON public.support_tickets FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Usuário pode atualizar apenas seu ticket (fechar)
CREATE POLICY "tickets_update_own"
  ON public.support_tickets FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Admin pode atualizar qualquer ticket (urgência, status)
CREATE POLICY "tickets_update_admin"
  ON public.support_tickets FOR UPDATE
  TO authenticated
  USING (
    public.current_user_has_role(ARRAY['SYSADMIN','CHURCH_ADMIN','LEADER','FINANCE_ADMIN']::public.app_role[])
  );

-- Bloquear DELETE para todos (soft delete via status)
CREATE POLICY "tickets_no_delete"
  ON public.support_tickets FOR DELETE
  TO authenticated
  USING (false);

-- Bloquear anon completamente
REVOKE ALL ON public.support_tickets FROM anon;

-- ─────────────────────────────────────────────────────────────────────────────
-- 10. RLS Policies — support_ticket_messages
-- ─────────────────────────────────────────────────────────────────────────────

-- Usuário lê mensagens do seu ticket
CREATE POLICY "msgs_select_own_ticket"
  ON public.support_ticket_messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.support_tickets t
      WHERE t.id = ticket_id AND t.user_id = auth.uid()
    )
  );

-- Admin lê todas as mensagens
CREATE POLICY "msgs_select_admin"
  ON public.support_ticket_messages FOR SELECT
  TO authenticated
  USING (
    public.current_user_has_role(ARRAY['SYSADMIN','CHURCH_ADMIN','LEADER','FINANCE_ADMIN']::public.app_role[])
  );

-- Usuário insere mensagem em seu ticket (ticket não pode estar fechado)
CREATE POLICY "msgs_insert_own"
  ON public.support_ticket_messages FOR INSERT
  TO authenticated
  WITH CHECK (
    sender_id = auth.uid()
    AND is_admin = false
    AND EXISTS (
      SELECT 1 FROM public.support_tickets t
      WHERE t.id = ticket_id
        AND t.user_id = auth.uid()
        AND t.status != 'closed'
    )
  );

-- Admin insere mensagem (is_admin = true obrigatório)
CREATE POLICY "msgs_insert_admin"
  ON public.support_ticket_messages FOR INSERT
  TO authenticated
  WITH CHECK (
    sender_id = auth.uid()
    AND is_admin = true
    AND public.current_user_has_role(ARRAY['SYSADMIN','CHURCH_ADMIN','LEADER','FINANCE_ADMIN']::public.app_role[])
  );

-- Admin pode marcar read_at (UPDATE apenas esse campo)
CREATE POLICY "msgs_update_read_admin"
  ON public.support_ticket_messages FOR UPDATE
  TO authenticated
  USING (
    public.current_user_has_role(ARRAY['SYSADMIN','CHURCH_ADMIN','LEADER','FINANCE_ADMIN']::public.app_role[])
  )
  WITH CHECK (
    public.current_user_has_role(ARRAY['SYSADMIN','CHURCH_ADMIN','LEADER','FINANCE_ADMIN']::public.app_role[])
  );

-- Bloquear DELETE e anon
CREATE POLICY "msgs_no_delete" ON public.support_ticket_messages FOR DELETE TO authenticated USING (false);
REVOKE ALL ON public.support_ticket_messages FROM anon;

-- ─────────────────────────────────────────────────────────────────────────────
-- 11. RLS Policies — feedback
-- ─────────────────────────────────────────────────────────────────────────────

-- Usuário insere apenas para si mesmo
CREATE POLICY "feedback_insert_own"
  ON public.feedback FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Usuário não lê feedbacks (anônimo ao admin)
-- Admin lê todos
CREATE POLICY "feedback_select_admin"
  ON public.feedback FOR SELECT
  TO authenticated
  USING (
    public.current_user_has_role(ARRAY['SYSADMIN','CHURCH_ADMIN']::public.app_role[])
  );

-- Bloquear anon e delete
REVOKE ALL ON public.feedback FROM anon;
CREATE POLICY "feedback_no_delete" ON public.feedback FOR DELETE TO authenticated USING (false);

-- ─────────────────────────────────────────────────────────────────────────────
-- 12. Storage Buckets
-- ─────────────────────────────────────────────────────────────────────────────

-- Bucket para anexos ativos de chamados
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'support_attachments',
  'support_attachments',
  false,
  5242880, -- 5MB em bytes
  ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'application/pdf']
)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit     = EXCLUDED.file_size_limit,
  allowed_mime_types  = EXCLUDED.allowed_mime_types;

-- Bucket para arquivos arquivados (chamados fechados > 30 dias)
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES (
  'support_archives',
  'support_archives',
  false,
  52428800 -- 50MB (arquivos compactados)
)
ON CONFLICT (id) DO NOTHING;

-- ─────────────────────────────────────────────────────────────────────────────
-- 13. Storage RLS Policies — support_attachments
-- ─────────────────────────────────────────────────────────────────────────────

-- Upload: usuário autenticado pode fazer upload para pasta própria
CREATE POLICY "support_attach_upload"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'support_attachments'
    AND (storage.foldername(name))[1] = auth.uid()::TEXT
  );

-- Download: usuário pode baixar apenas arquivos do seu ticket;
-- Admin pode baixar todos
CREATE POLICY "support_attach_download"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'support_attachments'
    AND (
      (storage.foldername(name))[1] = auth.uid()::TEXT
      OR public.current_user_has_role(ARRAY['SYSADMIN','CHURCH_ADMIN','LEADER','FINANCE_ADMIN']::public.app_role[])
    )
  );

-- Delete: apenas service_role (limpeza automática)
CREATE POLICY "support_attach_no_delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (false);

-- ─────────────────────────────────────────────────────────────────────────────
-- COMENTÁRIOS DE DOCUMENTAÇÃO
-- ─────────────────────────────────────────────────────────────────────────────

COMMENT ON TABLE public.support_tickets IS
  'Chamados de suporte. Máximo 1 aberto por usuário. Auto-fechamento após 15 dias sem interação do usuário (status waiting_user). Executar rpc_auto_close_inactive_tickets() periodicamente via cron.';

COMMENT ON TABLE public.support_ticket_messages IS
  'Mensagens dos chamados. Rate limit: 5 por minuto por usuário (via rpc_check_chat_rate_limit). Máximo 3 anexos por mensagem e 15 no total por chamado (enforced na aplicação). Arquivos de chamados fechados há > 30 dias devem ser movidos para support_archives e deletados (rpc_get_tickets_for_archive_cleanup).';

COMMENT ON TABLE public.feedback IS
  'Sugestões e relatos de bugs. Limite: 1 envio por usuário a cada 24 horas (enforced via rpc_check_and_record_rate_limit na aplicação).';
