-- =============================================================================
-- Fix: Habilitar Realtime corretamente com RLS (usando role correto)
-- =============================================================================

-- 1. GRANT SELECT para supabase_realtime_admin
GRANT SELECT ON public.support_tickets         TO supabase_realtime_admin;
GRANT SELECT ON public.support_ticket_messages TO supabase_realtime_admin;
GRANT SELECT ON public.profiles                TO supabase_realtime_admin;

-- 2. Políticas SELECT para supabase_realtime_admin
DROP POLICY IF EXISTS "tickets_select_realtime"  ON public.support_tickets;
DROP POLICY IF EXISTS "msgs_select_realtime"     ON public.support_ticket_messages;

CREATE POLICY "tickets_select_realtime"
  ON public.support_tickets FOR SELECT
  TO supabase_realtime_admin
  USING (true);

CREATE POLICY "msgs_select_realtime"
  ON public.support_ticket_messages FOR SELECT
  TO supabase_realtime_admin
  USING (true);

-- 3. Corrigir políticas de UPDATE de read_at
DROP POLICY IF EXISTS "msgs_update_read_user"  ON public.support_ticket_messages;
DROP POLICY IF EXISTS "msgs_update_read_admin" ON public.support_ticket_messages;

-- Usuário pode atualizar read_at em mensagens do admin dentro do seu ticket
CREATE POLICY "msgs_update_read_user"
  ON public.support_ticket_messages FOR UPDATE
  TO authenticated
  USING (
    is_admin = true
    AND EXISTS (
      SELECT 1 FROM public.support_tickets t
      WHERE t.id = ticket_id AND t.user_id = auth.uid()
    )
  )
  WITH CHECK (
    is_admin = true
    AND EXISTS (
      SELECT 1 FROM public.support_tickets t
      WHERE t.id = ticket_id AND t.user_id = auth.uid()
    )
  );

-- Admin pode atualizar qualquer mensagem (ler/marcar)
CREATE POLICY "msgs_update_read_admin"
  ON public.support_ticket_messages FOR UPDATE
  TO authenticated
  USING (
    public.current_user_has_role(ARRAY['SYSADMIN','CHURCH_ADMIN','LEADER','FINANCE_ADMIN']::public.app_role[])
  )
  WITH CHECK (
    public.current_user_has_role(ARRAY['SYSADMIN','CHURCH_ADMIN','LEADER','FINANCE_ADMIN']::public.app_role[])
  );
