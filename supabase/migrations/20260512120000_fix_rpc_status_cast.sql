-- =============================================================================
-- Fix: insert_registration_with_lock — explicit enum casts
-- 2026-05-12: p_status (TEXT) and p_payment_status (TEXT) were being inserted
--             directly into enum columns without an explicit cast, causing:
--             "column status is of type registration_status but expression is of type text"
-- =============================================================================

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
      AND status IN ('confirmado'::public.registration_status, 'pendente_pagamento'::public.registration_status);

    IF v_count >= v_event.capacity THEN
      RETURN QUERY SELECT NULL::UUID, 'Evento lotado. Não há vagas disponíveis.'::TEXT;
      RETURN;
    END IF;
  END IF;

  -- Insert the registration with explicit enum casts
  INSERT INTO public.event_registrations (
    event_id, name, email, phone, cpf, status, payment_status,
    ip_address, device_id, member_id, custom_form_responses
  )
  VALUES (
    p_event_id,
    p_name,
    p_email,
    p_phone,
    p_cpf,
    p_status::public.registration_status,
    p_payment_status::public.payment_status,
    p_ip_address,
    p_device_id,
    p_member_id,
    p_custom_form_responses
  )
  RETURNING id INTO v_reg_id;

  RETURN QUERY SELECT v_reg_id, NULL::TEXT;
END;
$$;

-- Re-grant execute (idempotent)
GRANT EXECUTE ON FUNCTION public.insert_registration_with_lock(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, UUID, JSONB)
  TO authenticated, anon;
