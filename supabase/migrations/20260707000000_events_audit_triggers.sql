-- Criar função genérica de auditoria para o módulo de eventos
CREATE OR REPLACE FUNCTION public.fn_events_audit_trigger()
RETURNS TRIGGER AS $$
DECLARE
    v_event_id UUID;
    v_action_type TEXT;
    v_actor_id UUID;
    v_details JSONB;
BEGIN
    -- Capturar o usuário logado no contexto (se houver, no caso do Supabase Client)
    v_actor_id := auth.uid();

    -- Determinar o event_id baseado na tabela
    IF TG_TABLE_NAME = 'events' THEN
        IF TG_OP = 'DELETE' THEN
            v_event_id := OLD.id;
        ELSE
            v_event_id := NEW.id;
        END IF;
    ELSE
        IF TG_OP = 'DELETE' THEN
            v_event_id := OLD.event_id;
        ELSE
            v_event_id := NEW.event_id;
        END IF;
    END IF;

    -- Construir o tipo da ação (ex: event_registrations_insert)
    v_action_type := TG_TABLE_NAME || '_' || lower(TG_OP);

    -- Construir os detalhes (old_record e new_record)
    IF TG_OP = 'INSERT' THEN
        v_details := jsonb_build_object('new_record', row_to_json(NEW));
    ELSIF TG_OP = 'UPDATE' THEN
        v_details := jsonb_build_object('old_record', row_to_json(OLD), 'new_record', row_to_json(NEW));
    ELSIF TG_OP = 'DELETE' THEN
        v_details := jsonb_build_object('old_record', row_to_json(OLD));
    END IF;

    -- Inserir no histórico
    INSERT INTO public.event_history (
        event_id,
        action_type,
        actor_id,
        details
    ) VALUES (
        v_event_id,
        v_action_type,
        v_actor_id,
        v_details
    );

    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Aplicar o trigger na tabela events
DROP TRIGGER IF EXISTS trg_audit_events ON public.events;
CREATE TRIGGER trg_audit_events
AFTER INSERT OR UPDATE OR DELETE ON public.events
FOR EACH ROW EXECUTE FUNCTION public.fn_events_audit_trigger();

-- Aplicar o trigger na tabela event_registrations
DROP TRIGGER IF EXISTS trg_audit_event_registrations ON public.event_registrations;
CREATE TRIGGER trg_audit_event_registrations
AFTER INSERT OR UPDATE OR DELETE ON public.event_registrations
FOR EACH ROW EXECUTE FUNCTION public.fn_events_audit_trigger();

-- Aplicar o trigger na tabela event_attendance
DROP TRIGGER IF EXISTS trg_audit_event_attendance ON public.event_attendance;
CREATE TRIGGER trg_audit_event_attendance
AFTER INSERT OR UPDATE OR DELETE ON public.event_attendance
FOR EACH ROW EXECUTE FUNCTION public.fn_events_audit_trigger();

-- Aplicar o trigger na tabela event_schedules
DROP TRIGGER IF EXISTS trg_audit_event_schedules ON public.event_schedules;
CREATE TRIGGER trg_audit_event_schedules
AFTER INSERT OR UPDATE OR DELETE ON public.event_schedules
FOR EACH ROW EXECUTE FUNCTION public.fn_events_audit_trigger();

-- Adicionar índice GIN na coluna details para melhor performance de busca
CREATE INDEX IF NOT EXISTS idx_event_history_details_gin ON public.event_history USING GIN (details);
