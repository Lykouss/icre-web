-- =============================================================================
-- ICRE Migration — Adicionar opções de agendamento e pausa de inscrições
-- =============================================================================

-- 1. Adicionar colunas na tabela de eventos
ALTER TABLE public.events 
  ADD COLUMN IF NOT EXISTS registration_opens_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS is_paused BOOLEAN DEFAULT false;

-- 2. Atualizar a RPC de inserção para respeitar as novas regras
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
  SELECT id, capacity, requires_payment, ticket_price, status, publish_at, is_paused, registration_opens_at
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

  -- ⚠️ NOVAS REGRAS DE CONTROLE: Pausa e Agendamento
  IF v_event.is_paused THEN
    RETURN QUERY SELECT NULL::UUID, 'As inscrições para este evento estão temporariamente pausadas.'::TEXT;
    RETURN;
  END IF;

  IF v_event.registration_opens_at IS NOT NULL AND v_event.registration_opens_at > now() THEN
    RETURN QUERY SELECT NULL::UUID, 'As inscrições para este evento ainda não começaram.'::TEXT;
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
