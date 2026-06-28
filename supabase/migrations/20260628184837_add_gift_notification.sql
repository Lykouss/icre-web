-- Adicionar coluna para controlar a notificação de cortesias
ALTER TABLE public.event_registrations ADD COLUMN IF NOT EXISTS gift_notified_at TIMESTAMP WITH TIME ZONE;
