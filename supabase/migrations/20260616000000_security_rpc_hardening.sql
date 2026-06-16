-- =============================================================================
-- ICRE Security Hardening — 2026-06-16
-- Corrige bypass de inscrição em eventos pagos via RPC direta ao Supabase
-- =============================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. REVOGAR EXECUTE DA RPC DE ANON/AUTHENTICATED
--    A RPC deve ser chamada APENAS via service_role (Server Actions)
-- ─────────────────────────────────────────────────────────────────────────────

REVOKE EXECUTE ON FUNCTION public.insert_registration_with_lock(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, UUID, JSONB)
  FROM anon, authenticated, public;

GRANT EXECUTE ON FUNCTION public.insert_registration_with_lock(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, UUID, JSONB)
  TO service_role;

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. RECRIAR A RPC COM VALIDAÇÃO INTERNA DE PAGAMENTO
--    O servidor calcula o status correto — ignora o que o cliente passa
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.insert_registration_with_lock(
  p_event_id              UUID,
  p_name                  TEXT,
  p_email                 TEXT,
  p_phone                 TEXT,
  p_cpf                   TEXT,
  p_status                TEXT,       -- valor do cliente é IGNORADO; calculado internamente
  p_payment_status        TEXT,       -- valor do cliente é IGNORADO; calculado internamente
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
  v_event             RECORD;
  v_count             INTEGER;
  v_reg_id            UUID;
  v_needs_payment     BOOLEAN;
  v_actual_status     TEXT;
  v_actual_pay_status TEXT;
BEGIN
  -- Lock the event row to prevent concurrent capacity checks
  SELECT id, capacity, requires_payment, ticket_price, status, publish_at
  INTO v_event
  FROM public.events
  WHERE id = p_event_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN QUERY SELECT NULL::UUID, 'Evento não encontrado.'::TEXT;
    RETURN;
  END IF;

  -- Validar que o evento está publicado e disponível
  IF v_event.status <> 'publicado' THEN
    RETURN QUERY SELECT NULL::UUID, 'Evento não está disponível para inscrições.'::TEXT;
    RETURN;
  END IF;

  IF v_event.publish_at IS NOT NULL AND v_event.publish_at > now() THEN
    RETURN QUERY SELECT NULL::UUID, 'As inscrições para este evento ainda não estão abertas.'::TEXT;
    RETURN;
  END IF;

  -- ⚠️ SEGURANÇA CRÍTICA: calcular status internamente com base nos dados do EVENTO
  -- Nunca confiar nos valores passados pelo cliente (p_status / p_payment_status)
  v_needs_payment := v_event.requires_payment AND COALESCE(v_event.ticket_price, 0) > 0;

  IF v_needs_payment THEN
    -- CPF obrigatório para eventos pagos (validação já feita na Server Action, mas reforçar aqui)
    IF p_cpf IS NULL OR trim(p_cpf) = '' THEN
      RETURN QUERY SELECT NULL::UUID, 'CPF é obrigatório para eventos pagos.'::TEXT;
      RETURN;
    END IF;
    v_actual_status     := 'pendente_pagamento';
    v_actual_pay_status := 'pendente';
  ELSE
    v_actual_status     := 'confirmado';
    v_actual_pay_status := 'gratuito';
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

  -- Insert the registration com status calculado pelo servidor
  INSERT INTO public.event_registrations (
    event_id, name, email, phone, cpf, status, payment_status,
    ip_address, device_id, member_id, custom_form_responses
  )
  VALUES (
    p_event_id, p_name, p_email, p_phone, p_cpf,
    v_actual_status,     -- ← status seguro calculado internamente
    v_actual_pay_status, -- ← payment_status seguro calculado internamente
    p_ip_address, p_device_id, p_member_id, p_custom_form_responses
  )
  RETURNING id INTO v_reg_id;

  RETURN QUERY SELECT v_reg_id, NULL::TEXT;
END;
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. ENDURECER A RLS POLICY DE INSERT PÚBLICO
--    Adicionar validação de requires_payment/ticket_price para bloquear
--    tentativas diretas via API REST (mesmo sem usar a RPC)
-- ─────────────────────────────────────────────────────────────────────────────

-- Remover a policy permissiva existente
DROP POLICY IF EXISTS "Visitantes podem se inscrever em eventos publicados" ON public.event_registrations;

-- Nova policy: bloqueia completamente INSERT direto pela API pública
-- Apenas service_role (via Server Actions) pode inserir
CREATE POLICY "Inscrições: somente service_role pode inserir"
  ON public.event_registrations FOR INSERT
  TO public
  WITH CHECK (false);

-- A policy de service_role existente já permite INSERT para service_role

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. BLOQUEAR UPDATE DIRETO DE payment_status VIA API PÚBLICA
--    (reforço — a policy de service_role já cobre, mas explicitamos)
-- ─────────────────────────────────────────────────────────────────────────────

-- Garantir que não existe policy que permita UPDATE de authenticated em payment_status
DROP POLICY IF EXISTS "Inscrições: usuário pode atualizar pagamento" ON public.event_registrations;
DROP POLICY IF EXISTS "Inscrições: usuário pode confirmar pagamento" ON public.event_registrations;

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. BLOQUEAR ACESSO DE LEITURA ANON A event_registrations
--    Nenhum dado de inscrição deve ser público sem autenticação
-- ─────────────────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Acesso público ao comprovante pelo ID" ON public.event_registrations;
DROP POLICY IF EXISTS "Anon pode ler inscrições" ON public.event_registrations;

-- ─────────────────────────────────────────────────────────────────────────────
-- 6. AUDITORIA — registrar tentativas de acesso não autorizado
-- ─────────────────────────────────────────────────────────────────────────────

-- Nota: O audit trigger existente (trg_registrations_audit) já cobre INSERT/UPDATE/DELETE.
-- Qualquer tentativa de manipulação será registrada em event_audit_logs.

-- ─────────────────────────────────────────────────────────────────────────────
-- COMENTÁRIO DE SEGURANÇA
-- ─────────────────────────────────────────────────────────────────────────────
-- Resumo das proteções após esta migration:
--
-- ✅ RPC insert_registration_with_lock: REVOKE para anon/authenticated
--    → Só pode ser chamada via service_role (Server Actions com service key)
--
-- ✅ RPC agora calcula status internamente com base nos dados do EVENTO
--    → Ignorados os valores p_status e p_payment_status passados pelo cliente
--    → Evento pago SEMPRE gera pendente_pagamento/pendente
--    → Evento gratuito SEMPRE gera confirmado/gratuito
--
-- ✅ RLS INSERT bloqueada para public/anon/authenticated
--    → Só service_role pode inserir em event_registrations
--
-- ✅ UPDATE de payment_status bloqueado para usuários comuns
--    → Apenas server actions com service_role podem alterar status de pagamento
