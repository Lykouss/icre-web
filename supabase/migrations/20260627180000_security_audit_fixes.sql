-- =============================================================================
-- ICRE — Auditoria de Segurança Completa de RLS
-- 2026-06-27
-- Correções de vulnerabilidades identificadas após análise de todas as
-- 36 tabelas e suas respectivas políticas RLS.
-- =============================================================================

-- =============================================================================
-- VULNERABILIDADES CRÍTICAS
-- =============================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- [CRÍTICO-1] transactions: políticas financeiras usam TO public
-- O papel `public` inclui `anon`. Qualquer pessoa não autenticada pode
-- tentar operações financeiras. Deve ser TO authenticated.
-- ─────────────────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "finance_read"   ON public.transactions;
DROP POLICY IF EXISTS "finance_insert" ON public.transactions;
DROP POLICY IF EXISTS "finance_delete" ON public.transactions;

CREATE POLICY "transactions_select_finance"
  ON public.transactions FOR SELECT
  TO authenticated
  USING (
    public.current_user_has_role(ARRAY[
      'SYSADMIN','CHURCH_ADMIN','FINANCE_ADMIN','REPORT_VIEWER'
    ]::public.app_role[])
  );

CREATE POLICY "transactions_insert_finance"
  ON public.transactions FOR INSERT
  TO authenticated
  WITH CHECK (
    public.current_user_has_role(ARRAY[
      'SYSADMIN','CHURCH_ADMIN','FINANCE_ADMIN'
    ]::public.app_role[])
  );

CREATE POLICY "transactions_update_finance"
  ON public.transactions FOR UPDATE
  TO authenticated
  USING (
    public.current_user_has_role(ARRAY[
      'SYSADMIN','CHURCH_ADMIN','FINANCE_ADMIN'
    ]::public.app_role[])
  )
  WITH CHECK (
    public.current_user_has_role(ARRAY[
      'SYSADMIN','CHURCH_ADMIN','FINANCE_ADMIN'
    ]::public.app_role[])
  );

CREATE POLICY "transactions_delete_sysadmin"
  ON public.transactions FOR DELETE
  TO authenticated
  USING (
    public.current_user_has_role(ARRAY['SYSADMIN']::public.app_role[])
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- [CRÍTICO-2] transaction_categories: leitura TO public (inclui anon)
-- Categorias financeiras não devem ser visíveis para anônimos.
-- ─────────────────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "categories_read"                    ON public.transaction_categories;
DROP POLICY IF EXISTS "Leitura de categorias permitida"    ON public.transaction_categories;

CREATE POLICY "transaction_categories_select"
  ON public.transaction_categories FOR SELECT
  TO authenticated
  USING (true); -- qualquer autenticado pode ver categorias (para formulários)

-- Garante que anon não acessa
REVOKE ALL ON public.transaction_categories FROM anon;

-- ─────────────────────────────────────────────────────────────────────────────
-- [CRÍTICO-3] user_feature_access: políticas TO public (inclui anon)
-- Acesso a features de usuário não deve estar disponível para anon.
-- ─────────────────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Users can insert their own access" ON public.user_feature_access;
DROP POLICY IF EXISTS "Users can view their own access"   ON public.user_feature_access;

CREATE POLICY "user_feature_access_select_own"
  ON public.user_feature_access FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "user_feature_access_insert_own"
  ON public.user_feature_access FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

REVOKE ALL ON public.user_feature_access FROM anon;

-- =============================================================================
-- VULNERABILIDADES ALTAS
-- =============================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- [ALTA-1] upload_settings UPDATE sem WITH CHECK
-- A política "Apenas SysAdmins editam upload_settings" tem WITH CHECK vazio,
-- o que significa que um SYSADMIN pode atualizar uma linha para que o
-- WITH CHECK de outra política permita acesso indevido.
-- ─────────────────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Apenas SysAdmins editam upload_settings" ON public.upload_settings;

CREATE POLICY "upload_settings_update_sysadmin"
  ON public.upload_settings FOR UPDATE
  TO authenticated
  USING (
    public.current_user_has_role(ARRAY['SYSADMIN']::public.app_role[])
  )
  WITH CHECK (
    public.current_user_has_role(ARRAY['SYSADMIN']::public.app_role[])
  );

-- DELETE: faltava policy de DELETE para upload_settings
DROP POLICY IF EXISTS "upload_settings_delete_sysadmin" ON public.upload_settings;
CREATE POLICY "upload_settings_delete_sysadmin"
  ON public.upload_settings FOR DELETE
  TO authenticated
  USING (
    public.current_user_has_role(ARRAY['SYSADMIN']::public.app_role[])
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- [ALTA-2] tickets_update_admin sem WITH CHECK
-- Um LEADER ou FINANCE_ADMIN poderia atribuir o ticket para outro usuário
-- ou modificar campos arbitrariamente sem restrição no WITH CHECK.
-- ─────────────────────────────────────────────────────────────────────────────
-- Já corrigido na migration de novos cargos (20260627170000) com WITH CHECK.
-- ─────────────────────────────────────────────────────────────────────────────

-- ─────────────────────────────────────────────────────────────────────────────
-- [ALTA-3] support_attach_download: FINANCE_ADMIN com acesso excessivo
-- FINANCE_ADMIN não deveria ter acesso a arquivos de suporte de usuários.
-- Já corrigido na migration 20260627170000.
-- ─────────────────────────────────────────────────────────────────────────────

-- ─────────────────────────────────────────────────────────────────────────────
-- [ALTA-4] members: sem política de DELETE
-- Atualmente ninguém pode deletar membros. SYSADMIN deveria poder.
-- ─────────────────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "members_delete_sysadmin" ON public.members;
CREATE POLICY "members_delete_sysadmin"
  ON public.members FOR DELETE
  TO authenticated
  USING (
    public.current_user_has_role(ARRAY['SYSADMIN']::public.app_role[])
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- [ALTA-5] pdf_download_logs: sem política verificada
-- Logs de download de PDFs contêm PII do usuário.
-- ─────────────────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "pdf_logs_select_admin"  ON public.pdf_download_logs;
DROP POLICY IF EXISTS "pdf_logs_insert_own"    ON public.pdf_download_logs;

CREATE POLICY "pdf_logs_insert_own"
  ON public.pdf_download_logs FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "pdf_logs_select_admin"
  ON public.pdf_download_logs FOR SELECT
  TO authenticated
  USING (
    public.current_user_has_role(ARRAY['SYSADMIN','CHURCH_ADMIN']::public.app_role[])
  );

REVOKE ALL ON public.pdf_download_logs FROM anon;

-- ─────────────────────────────────────────────────────────────────────────────
-- [ALTA-6] pastors: verificar políticas de escrita
-- A tabela pastors provavelmente só tem SELECT público, mas falta política de
-- escrita explícita se não existir.
-- ─────────────────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "pastors_write_admin" ON public.pastors;
CREATE POLICY "pastors_write_admin"
  ON public.pastors FOR ALL
  TO authenticated
  USING (
    public.current_user_has_role(ARRAY['SYSADMIN','CHURCH_ADMIN']::public.app_role[])
  )
  WITH CHECK (
    public.current_user_has_role(ARRAY['SYSADMIN','CHURCH_ADMIN']::public.app_role[])
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- [ALTA-7] event_schedules e event_history: sem políticas explícitas verificadas
-- ─────────────────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "event_schedules_write_admin"  ON public.event_schedules;
DROP POLICY IF EXISTS "event_schedules_select_admin" ON public.event_schedules;

CREATE POLICY "event_schedules_select"
  ON public.event_schedules FOR SELECT
  TO authenticated
  USING (true); -- todo autenticado pode ver cronogramas de eventos

CREATE POLICY "event_schedules_write_admin"
  ON public.event_schedules FOR ALL
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

REVOKE ALL ON public.event_schedules FROM anon;
REVOKE ALL ON public.event_history FROM anon;
REVOKE ALL ON public.event_audit_logs FROM anon;

-- =============================================================================
-- VULNERABILIDADES MÉDIAS
-- =============================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- [MÉDIA-1] webhook_processed_events: falta política de leitura para admins
-- Atualmente só service_role acessa. SYSADMIN deveria poder auditar.
-- ─────────────────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "webhook_events_read_sysadmin" ON public.webhook_processed_events;
CREATE POLICY "webhook_events_read_sysadmin"
  ON public.webhook_processed_events FOR SELECT
  TO authenticated
  USING (
    public.current_user_has_role(ARRAY['SYSADMIN']::public.app_role[])
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- [MÉDIA-2] finance_logs: garantir que REPORT_VIEWER pode ler
-- ─────────────────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "finance_logs_select_report"   ON public.finance_logs;
CREATE POLICY "finance_logs_select_report"
  ON public.finance_logs FOR SELECT
  TO authenticated
  USING (
    public.current_user_has_role(ARRAY[
      'SYSADMIN','CHURCH_ADMIN','FINANCE_ADMIN','REPORT_VIEWER'
    ]::public.app_role[])
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- [MÉDIA-3] auth_rate_limits: garantir que apenas service_role e SYSADMIN acessam
-- ─────────────────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "auth_rate_limits_sysadmin" ON public.auth_rate_limits;
CREATE POLICY "auth_rate_limits_sysadmin"
  ON public.auth_rate_limits FOR SELECT
  TO authenticated
  USING (
    public.current_user_has_role(ARRAY['SYSADMIN']::public.app_role[])
  );

REVOKE INSERT, UPDATE, DELETE ON public.auth_rate_limits FROM authenticated;
REVOKE ALL ON public.auth_rate_limits FROM anon;

-- ─────────────────────────────────────────────────────────────────────────────
-- [MÉDIA-4] auth_logs: garantir que apenas SYSADMIN lê
-- ─────────────────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "auth_logs_read_sysadmin" ON public.auth_logs;
CREATE POLICY "auth_logs_read_sysadmin"
  ON public.auth_logs FOR SELECT
  TO authenticated
  USING (
    public.current_user_has_role(ARRAY['SYSADMIN']::public.app_role[])
  );

REVOKE INSERT, UPDATE, DELETE ON public.auth_logs FROM authenticated;
REVOKE ALL ON public.auth_logs FROM anon;

-- ─────────────────────────────────────────────────────────────────────────────
-- [MÉDIA-5] cells: LEADER não pode criar células, apenas administradores
-- Verificar se há política de escrita que permita LEADER criar células.
-- ─────────────────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "cells_write_admin" ON public.cells;
CREATE POLICY "cells_write_admin"
  ON public.cells FOR ALL
  TO authenticated
  USING (
    public.current_user_has_role(ARRAY[
      'SYSADMIN','CHURCH_ADMIN','MEMBER_ADMIN'
    ]::public.app_role[])
  )
  WITH CHECK (
    public.current_user_has_role(ARRAY[
      'SYSADMIN','CHURCH_ADMIN','MEMBER_ADMIN'
    ]::public.app_role[])
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- [MÉDIA-6] feature_flags: sem política de leitura para admins (apenas SYSADMIN)
-- CHURCH_ADMIN deveria poder ler flags para tomar decisões operacionais.
-- ─────────────────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "feature_flags_read_admin"  ON public.feature_flags;
DROP POLICY IF EXISTS "feature_flags_write_admin" ON public.feature_flags;
DROP POLICY IF EXISTS "feature_flags_write_sysadmin" ON public.feature_flags;

CREATE POLICY "feature_flags_read_admin"
  ON public.feature_flags FOR SELECT
  TO authenticated
  USING (
    public.current_user_has_role(ARRAY[
      'SYSADMIN','CHURCH_ADMIN'
    ]::public.app_role[])
  );

CREATE POLICY "feature_flags_write_sysadmin"
  ON public.feature_flags FOR ALL
  TO authenticated
  USING (
    public.current_user_has_role(ARRAY['SYSADMIN']::public.app_role[])
  )
  WITH CHECK (
    public.current_user_has_role(ARRAY['SYSADMIN']::public.app_role[])
  );

REVOKE ALL ON public.feature_flags FROM anon;

-- =============================================================================
-- MELHORIAS DE SUPERFÍCIE DE ATAQUE
-- =============================================================================

-- Garantir REVOKE de anon em todas as tabelas sensíveis (consolidação final)
REVOKE ALL ON public.financial_transactions   FROM anon;
REVOKE ALL ON public.financial_recurring      FROM anon;
REVOKE ALL ON public.financial_closings       FROM anon;
REVOKE ALL ON public.finance_logs             FROM anon;
REVOKE ALL ON public.transactions             FROM anon;
REVOKE ALL ON public.transaction_categories   FROM anon;
REVOKE ALL ON public.members                  FROM anon;
REVOKE ALL ON public.profiles                 FROM anon;
REVOKE ALL ON public.user_roles               FROM anon;
REVOKE ALL ON public.pin_attempts             FROM anon;
REVOKE ALL ON public.rate_limits              FROM anon;
REVOKE ALL ON public.support_tickets          FROM anon;
REVOKE ALL ON public.support_ticket_messages  FROM anon;
REVOKE ALL ON public.feedback                 FROM anon;
REVOKE ALL ON public.media_assets             FROM anon;
REVOKE ALL ON public.site_media               FROM anon;
REVOKE ALL ON public.upload_settings          FROM anon; -- anon SELECT para validação é feito via Server Action
REVOKE ALL ON public.user_feature_access      FROM anon;
REVOKE ALL ON public.event_attendance         FROM anon;
REVOKE ALL ON public.event_schedules          FROM anon;
REVOKE ALL ON public.pdf_download_logs        FROM anon;
REVOKE ALL ON public.webhook_processed_events FROM anon;
REVOKE ALL ON public.auth_logs                FROM anon;
REVOKE ALL ON public.auth_rate_limits         FROM anon;
REVOKE ALL ON public.audit_logs               FROM anon;

-- =============================================================================
-- RESUMO DE SEGURANÇA APÓS ESTA MIGRATION
-- =============================================================================
--
-- ✅ [CRÍTICO-1] transactions: TO public → TO authenticated
-- ✅ [CRÍTICO-2] transaction_categories: anon bloqueado
-- ✅ [CRÍTICO-3] user_feature_access: TO public → TO authenticated
-- ✅ [ALTA-1]    upload_settings UPDATE com WITH CHECK adicionado
-- ✅ [ALTA-2]    tickets_update_admin WITH CHECK (na migration de roles)
-- ✅ [ALTA-3]    support_attach_download: FINANCE_ADMIN removido (na migration de roles)
-- ✅ [ALTA-4]    members DELETE: SYSADMIN pode deletar
-- ✅ [ALTA-5]    pdf_download_logs: RLS explícitas
-- ✅ [ALTA-6]    pastors: política de escrita explícita
-- ✅ [ALTA-7]    event_schedules/history/audit_logs: anon bloqueado
-- ✅ [MÉDIA-1]   webhook_processed_events: SYSADMIN pode auditar
-- ✅ [MÉDIA-2]   finance_logs: REPORT_VIEWER pode ler
-- ✅ [MÉDIA-3]   auth_rate_limits: somente SYSADMIN
-- ✅ [MÉDIA-4]   auth_logs: somente SYSADMIN
-- ✅ [MÉDIA-5]   cells: LEADER removido da escrita
-- ✅ [MÉDIA-6]   feature_flags: CHURCH_ADMIN pode ler
-- ✅ REVOKE anon consolidado em todas as tabelas sensíveis
