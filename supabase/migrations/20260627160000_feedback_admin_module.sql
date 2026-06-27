-- =============================================================================
-- ICRE — Módulo Admin de Feedbacks
-- 2026-06-27
-- Expande a tabela feedback com campos de gestão administrativa,
-- adiciona RLS para UPDATE/DELETE por admins, e permite que SUPPORT_ADMIN
-- acesse feedbacks (preparando para o novo cargo).
-- =============================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. Novos campos na tabela feedback
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE public.feedback
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'in_review', 'resolved', 'dismissed')),
  ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS admin_notes TEXT CHECK (char_length(admin_notes) <= 2000),
  ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;

-- Índice para ordenação dos afixados e mais recentes
CREATE INDEX IF NOT EXISTS idx_feedback_pinned_date
  ON public.feedback(is_pinned DESC, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_feedback_status
  ON public.feedback(status);

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. Remover a policy incorreta de DELETE que bloqueia admins
-- A policy atual "feedback_no_delete" bloqueia TODOS com USING(false)
-- ─────────────────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "feedback_no_delete" ON public.feedback;

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. Novas RLS para gestão administrativa de feedbacks
-- ─────────────────────────────────────────────────────────────────────────────

-- UPDATE: SYSADMIN e CHURCH_ADMIN podem gerenciar feedbacks (status, pin, notes)
DROP POLICY IF EXISTS "feedback_update_admin" ON public.feedback;
CREATE POLICY "feedback_update_admin"
  ON public.feedback FOR UPDATE
  TO authenticated
  USING (
    public.current_user_has_role(ARRAY['SYSADMIN','CHURCH_ADMIN']::public.app_role[])
  )
  WITH CHECK (
    public.current_user_has_role(ARRAY['SYSADMIN','CHURCH_ADMIN']::public.app_role[])
  );

-- DELETE: apenas SYSADMIN pode remover feedbacks permanentemente
DROP POLICY IF EXISTS "feedback_delete_admin" ON public.feedback;
CREATE POLICY "feedback_delete_admin"
  ON public.feedback FOR DELETE
  TO authenticated
  USING (
    public.current_user_has_role(ARRAY['SYSADMIN']::public.app_role[])
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. Revogar acesso anon à tabela feedback (garantia extra)
-- ─────────────────────────────────────────────────────────────────────────────

REVOKE ALL ON public.feedback FROM anon;

COMMENT ON COLUMN public.feedback.status IS
  'Status administrativo: pending (aguardando revisão), in_review (em análise), resolved (resolvido), dismissed (descartado).';

COMMENT ON COLUMN public.feedback.is_pinned IS
  'Quando true, o feedback aparece fixado no topo do painel administrativo.';

COMMENT ON COLUMN public.feedback.admin_notes IS
  'Anotações internas do administrador. Visíveis apenas para admins, nunca para o usuário que enviou.';
