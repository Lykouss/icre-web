-- =============================================================================
-- ICRE — Novos Cargos Administrativos — Políticas RLS
-- 2026-06-27
-- Ajusta todas as RLS para que cada novo cargo tenha acesso estritamente
-- ao que lhe compete. Os valores do ENUM foram adicionados em 20260627165000.
-- =============================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. profiles — MEMBER_ADMIN pode ler todos; REPORT_VIEWER pode ler básico
-- ─────────────────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "profiles_select_admin_extended" ON public.profiles;
CREATE POLICY "profiles_select_admin_extended"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (
    public.current_user_has_role(ARRAY[
      'SYSADMIN','CHURCH_ADMIN','LEADER','FINANCE_ADMIN',
      'MEMBER_ADMIN','REPORT_VIEWER','SUPPORT_ADMIN'
    ]::public.app_role[])
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. profiles — MEMBER_ADMIN pode editar perfis de outros membros
-- (exceto campos sensíveis — trigger já protege esses campos)
-- ─────────────────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "profiles_update_member_admin" ON public.profiles;
CREATE POLICY "profiles_update_member_admin"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (
    public.current_user_has_role(ARRAY['MEMBER_ADMIN']::public.app_role[])
  )
  WITH CHECK (
    public.current_user_has_role(ARRAY['MEMBER_ADMIN']::public.app_role[])
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. members — MEMBER_ADMIN lê e edita; REPORT_VIEWER lê
-- ─────────────────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "members_select_admin" ON public.members;
CREATE POLICY "members_select_admin"
  ON public.members FOR SELECT
  TO authenticated
  USING (
    public.current_user_has_role(ARRAY[
      'SYSADMIN','CHURCH_ADMIN','LEADER','FINANCE_ADMIN',
      'MEMBER_ADMIN','REPORT_VIEWER'
    ]::public.app_role[])
  );

DROP POLICY IF EXISTS "members_update_member_admin" ON public.members;
CREATE POLICY "members_update_member_admin"
  ON public.members FOR ALL
  TO authenticated
  USING (
    public.current_user_has_role(ARRAY['MEMBER_ADMIN','SYSADMIN','CHURCH_ADMIN']::public.app_role[])
  )
  WITH CHECK (
    public.current_user_has_role(ARRAY['MEMBER_ADMIN','SYSADMIN','CHURCH_ADMIN']::public.app_role[])
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. user_roles — CHURCH_ADMIN e MEMBER_ADMIN podem visualizar cargos
-- (necessário para gerenciar membros)
-- ─────────────────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "user_roles_select_sysadmin" ON public.user_roles;
CREATE POLICY "user_roles_select_admin"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (
    public.current_user_has_role(ARRAY[
      'SYSADMIN','CHURCH_ADMIN','MEMBER_ADMIN'
    ]::public.app_role[])
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- 6. support_tickets + support_ticket_messages — SUPPORT_ADMIN gerencia
-- ─────────────────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "tickets_select_admin" ON public.support_tickets;
CREATE POLICY "tickets_select_admin"
  ON public.support_tickets FOR SELECT
  TO authenticated
  USING (
    public.current_user_has_role(ARRAY[
      'SYSADMIN','CHURCH_ADMIN','LEADER','FINANCE_ADMIN','SUPPORT_ADMIN'
    ]::public.app_role[])
  );

DROP POLICY IF EXISTS "tickets_update_admin" ON public.support_tickets;
CREATE POLICY "tickets_update_admin"
  ON public.support_tickets FOR UPDATE
  TO authenticated
  USING (
    public.current_user_has_role(ARRAY[
      'SYSADMIN','CHURCH_ADMIN','LEADER','FINANCE_ADMIN','SUPPORT_ADMIN'
    ]::public.app_role[])
  )
  WITH CHECK (
    public.current_user_has_role(ARRAY[
      'SYSADMIN','CHURCH_ADMIN','LEADER','FINANCE_ADMIN','SUPPORT_ADMIN'
    ]::public.app_role[])
  );

DROP POLICY IF EXISTS "msgs_select_admin" ON public.support_ticket_messages;
CREATE POLICY "msgs_select_admin"
  ON public.support_ticket_messages FOR SELECT
  TO authenticated
  USING (
    public.current_user_has_role(ARRAY[
      'SYSADMIN','CHURCH_ADMIN','LEADER','FINANCE_ADMIN','SUPPORT_ADMIN'
    ]::public.app_role[])
  );

DROP POLICY IF EXISTS "msgs_insert_admin" ON public.support_ticket_messages;
CREATE POLICY "msgs_insert_admin"
  ON public.support_ticket_messages FOR INSERT
  TO authenticated
  WITH CHECK (
    sender_id = auth.uid()
    AND is_admin = true
    AND public.current_user_has_role(ARRAY[
      'SYSADMIN','CHURCH_ADMIN','LEADER','FINANCE_ADMIN','SUPPORT_ADMIN'
    ]::public.app_role[])
  );

DROP POLICY IF EXISTS "msgs_update_read_admin" ON public.support_ticket_messages;
CREATE POLICY "msgs_update_read_admin"
  ON public.support_ticket_messages FOR UPDATE
  TO authenticated
  USING (
    public.current_user_has_role(ARRAY[
      'SYSADMIN','CHURCH_ADMIN','LEADER','FINANCE_ADMIN','SUPPORT_ADMIN'
    ]::public.app_role[])
  )
  WITH CHECK (
    public.current_user_has_role(ARRAY[
      'SYSADMIN','CHURCH_ADMIN','LEADER','FINANCE_ADMIN','SUPPORT_ADMIN'
    ]::public.app_role[])
  );

-- Storage: SUPPORT_ADMIN pode baixar anexos
DROP POLICY IF EXISTS "support_attach_download" ON storage.objects;
CREATE POLICY "support_attach_download"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'support_attachments'
    AND (
      (storage.foldername(name))[1] = auth.uid()::TEXT
      OR public.current_user_has_role(ARRAY[
        'SYSADMIN','CHURCH_ADMIN','LEADER','SUPPORT_ADMIN'
      ]::public.app_role[])
    )
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- 7. feedback — SUPPORT_ADMIN pode ler e gerenciar
-- ─────────────────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "feedback_select_admin" ON public.feedback;
CREATE POLICY "feedback_select_admin"
  ON public.feedback FOR SELECT
  TO authenticated
  USING (
    public.current_user_has_role(ARRAY[
      'SYSADMIN','CHURCH_ADMIN','SUPPORT_ADMIN'
    ]::public.app_role[])
  );

DROP POLICY IF EXISTS "feedback_update_admin" ON public.feedback;
CREATE POLICY "feedback_update_admin"
  ON public.feedback FOR UPDATE
  TO authenticated
  USING (
    public.current_user_has_role(ARRAY[
      'SYSADMIN','CHURCH_ADMIN','SUPPORT_ADMIN'
    ]::public.app_role[])
  )
  WITH CHECK (
    public.current_user_has_role(ARRAY[
      'SYSADMIN','CHURCH_ADMIN','SUPPORT_ADMIN'
    ]::public.app_role[])
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- 8. events + event_registrations + event_attendance — EVENT_ADMIN gerencia
-- ─────────────────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "events_select_authenticated" ON public.events;
CREATE POLICY "events_select_authenticated"
  ON public.events FOR SELECT
  TO authenticated
  USING (
    (is_public = true AND status = 'publicado'::public.event_status)
    OR public.current_user_has_role(ARRAY[
      'SYSADMIN','CHURCH_ADMIN','LEADER','FINANCE_ADMIN','EVENT_ADMIN','REPORT_VIEWER'
    ]::public.app_role[])
  );

-- Escrita de eventos: EVENT_ADMIN pode criar e editar
DROP POLICY IF EXISTS "events_write_event_admin" ON public.events;
CREATE POLICY "events_write_event_admin"
  ON public.events FOR ALL
  TO authenticated
  USING (
    public.current_user_has_role(ARRAY[
      'SYSADMIN','CHURCH_ADMIN','EVENT_ADMIN'
    ]::public.app_role[])
  )
  WITH CHECK (
    public.current_user_has_role(ARRAY[
      'SYSADMIN','CHURCH_ADMIN','EVENT_ADMIN'
    ]::public.app_role[])
  );

-- event_registrations: EVENT_ADMIN pode ler para gerenciar inscrições
DROP POLICY IF EXISTS "registrations_admin_read" ON public.event_registrations;
CREATE POLICY "registrations_admin_read"
  ON public.event_registrations FOR SELECT
  TO authenticated
  USING (
    public.current_user_has_role(ARRAY[
      'SYSADMIN','CHURCH_ADMIN','LEADER','FINANCE_ADMIN','EVENT_ADMIN','REPORT_VIEWER'
    ]::public.app_role[])
  );

-- event_attendance: EVENT_ADMIN gerencia presença
DROP POLICY IF EXISTS "attendance_event_admin" ON public.event_attendance;
CREATE POLICY "attendance_event_admin"
  ON public.event_attendance FOR ALL
  TO authenticated
  USING (
    public.current_user_has_role(ARRAY[
      'SYSADMIN','CHURCH_ADMIN','LEADER','EVENT_ADMIN'
    ]::public.app_role[])
  )
  WITH CHECK (
    public.current_user_has_role(ARRAY[
      'SYSADMIN','CHURCH_ADMIN','LEADER','EVENT_ADMIN'
    ]::public.app_role[])
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- 9. site_blocks / site_media / media_assets — MEDIA_ADMIN gerencia
-- ─────────────────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "site_blocks_write_media_admin" ON public.site_blocks;
CREATE POLICY "site_blocks_write_media_admin"
  ON public.site_blocks FOR ALL
  TO authenticated
  USING (
    public.current_user_has_role(ARRAY[
      'SYSADMIN','CHURCH_ADMIN','MEDIA_ADMIN'
    ]::public.app_role[])
  )
  WITH CHECK (
    public.current_user_has_role(ARRAY[
      'SYSADMIN','CHURCH_ADMIN','MEDIA_ADMIN'
    ]::public.app_role[])
  );

DROP POLICY IF EXISTS "site_media_write_media_admin" ON public.site_media;
CREATE POLICY "site_media_write_media_admin"
  ON public.site_media FOR ALL
  TO authenticated
  USING (
    public.current_user_has_role(ARRAY[
      'SYSADMIN','CHURCH_ADMIN','MEDIA_ADMIN'
    ]::public.app_role[])
  )
  WITH CHECK (
    public.current_user_has_role(ARRAY[
      'SYSADMIN','CHURCH_ADMIN','MEDIA_ADMIN'
    ]::public.app_role[])
  );

DROP POLICY IF EXISTS "media_assets_write_media_admin" ON public.media_assets;
CREATE POLICY "media_assets_write_media_admin"
  ON public.media_assets FOR ALL
  TO authenticated
  USING (
    public.current_user_has_role(ARRAY[
      'SYSADMIN','CHURCH_ADMIN','MEDIA_ADMIN'
    ]::public.app_role[])
  )
  WITH CHECK (
    public.current_user_has_role(ARRAY[
      'SYSADMIN','CHURCH_ADMIN','MEDIA_ADMIN'
    ]::public.app_role[])
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- 10. Financeiro — REPORT_VIEWER pode apenas ler
-- ─────────────────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "report_viewer_finance_read" ON public.financial_transactions;
CREATE POLICY "report_viewer_finance_read"
  ON public.financial_transactions FOR SELECT
  TO authenticated
  USING (
    public.current_user_has_role(ARRAY[
      'SYSADMIN','CHURCH_ADMIN','FINANCE_ADMIN','REPORT_VIEWER'
    ]::public.app_role[])
  );

DROP POLICY IF EXISTS "report_viewer_transactions_read" ON public.transactions;
CREATE POLICY "report_viewer_transactions_read"
  ON public.transactions FOR SELECT
  TO authenticated
  USING (
    public.current_user_has_role(ARRAY[
      'SYSADMIN','CHURCH_ADMIN','FINANCE_ADMIN','REPORT_VIEWER'
    ]::public.app_role[])
  );

DROP POLICY IF EXISTS "report_viewer_closings_read" ON public.financial_closings;
CREATE POLICY "report_viewer_closings_read"
  ON public.financial_closings FOR SELECT
  TO authenticated
  USING (
    public.current_user_has_role(ARRAY[
      'SYSADMIN','CHURCH_ADMIN','FINANCE_ADMIN','REPORT_VIEWER'
    ]::public.app_role[])
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- 11. Atualizar função current_user_has_role para incluir todos os cargos
-- (a função já é genérica, mas garantimos que o ENUM está atualizado)
-- ─────────────────────────────────────────────────────────────────────────────

-- Recriar a função para garantir que considera todos os cargos novos
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

COMMENT ON TYPE public.app_role IS
  'Cargos de usuários do SIGE. MEMBER=membro comum. LEADER=líder de célula. FINANCE_ADMIN=gestor financeiro. CHURCH_ADMIN=administrador geral. SYSADMIN=superadmin. SUPPORT_ADMIN=atendente de suporte. EVENT_ADMIN=coordenador de eventos. MEDIA_ADMIN=gerente de conteúdo. MEMBER_ADMIN=gestor de membros. REPORT_VIEWER=analista somente leitura.';
