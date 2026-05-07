-- Nova tabela para rastrear IPs conhecidos dos usuários (Antifraude)
CREATE TABLE public.user_known_ips (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    ip_address TEXT NOT NULL,
    first_seen TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    last_seen TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    UNIQUE (user_id, ip_address)
);
ALTER TABLE public.user_known_ips ENABLE ROW LEVEL SECURITY;

-- Nova tabela para histórico imutável de eventos (Auditoria)
CREATE TABLE public.event_history (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    action_type TEXT NOT NULL,
    actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    target_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);
ALTER TABLE public.event_history ENABLE ROW LEVEL SECURITY;

-- Modificações na tabela events
ALTER TABLE public.events
ADD COLUMN max_per_account INTEGER DEFAULT 1,
ADD COLUMN max_per_ip INTEGER DEFAULT 2,
ADD COLUMN max_per_device INTEGER DEFAULT 2,
ADD COLUMN payment_methods JSONB DEFAULT '["pix"]'::jsonb;

-- Modificações na tabela event_registrations
ALTER TABLE public.event_registrations
ADD COLUMN ip_address TEXT,
ADD COLUMN device_id TEXT,
ADD COLUMN gifted_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
ADD COLUMN ticket_signature TEXT,
ADD COLUMN checkin_status BOOLEAN DEFAULT false,
ADD COLUMN checkin_time TIMESTAMP WITH TIME ZONE,
ADD COLUMN checkin_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

-- Criando índices para performance
CREATE INDEX idx_user_known_ips_user_id ON public.user_known_ips(user_id);
CREATE INDEX idx_event_history_event_id ON public.event_history(event_id);
CREATE INDEX idx_event_registrations_ticket_signature ON public.event_registrations(ticket_signature) WHERE ticket_signature IS NOT NULL;

-- ==========================================
-- POLÍTICAS RLS (ROW LEVEL SECURITY)
-- ==========================================

-- 1. user_known_ips
CREATE POLICY "Usuários podem ver seus próprios IPs"
ON public.user_known_ips FOR SELECT
TO authenticated
USING (user_id = auth.uid() OR public.current_user_has_role(ARRAY['SYSADMIN']::public.app_role[]));

-- 2. event_history (Log Imutável)
CREATE POLICY "Somente leitura para SysAdmins"
ON public.event_history FOR SELECT
TO authenticated
USING (public.current_user_has_role(ARRAY['SYSADMIN', 'CHURCH_ADMIN']::public.app_role[]));

CREATE POLICY "Inserção pelo sistema/admins"
ON public.event_history FOR INSERT
TO authenticated
WITH CHECK (true); -- Controle real feito pelas Server Actions, mas liberamos INSERT para auth users pois as actions rodam no contexto do admin.

-- 3. events
-- Correção crítica: Usuários normais SÓ PODEM ver eventos publicados
DROP POLICY IF EXISTS "Todos podem visualizar eventos públicos" ON public.events;
DROP POLICY IF EXISTS "Qualquer pessoa pode ver eventos públicos." ON public.events;
DROP POLICY IF EXISTS "Membros podem ver eventos" ON public.events;

CREATE POLICY "Usuários podem ver eventos publicados"
ON public.events FOR SELECT
TO public
USING (status = 'publicado' OR auth.uid() = created_by OR public.current_user_has_role(ARRAY['SYSADMIN', 'CHURCH_ADMIN']::public.app_role[]));

-- 4. event_registrations
-- Apenas usuários podem se inscrever (INSERT) em eventos publicados
DROP POLICY IF EXISTS "Membros podem se inscrever em eventos" ON public.event_registrations;
DROP POLICY IF EXISTS "Usuários podem se inscrever" ON public.event_registrations;
DROP POLICY IF EXISTS "Membros podem ver suas próprias inscrições" ON public.event_registrations;

CREATE POLICY "Usuários podem se inscrever em eventos publicados"
ON public.event_registrations FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.events
    WHERE id = event_id AND status = 'publicado'
  )
  OR public.current_user_has_role(ARRAY['SYSADMIN']::public.app_role[])
);

CREATE POLICY "Usuários podem ver suas próprias inscrições e de dependentes"
ON public.event_registrations FOR SELECT
TO authenticated
USING (member_id IN (SELECT id FROM public.members WHERE user_id = auth.uid()) OR public.current_user_has_role(ARRAY['SYSADMIN', 'CHURCH_ADMIN']::public.app_role[]));

CREATE POLICY "SysAdmins podem atualizar inscrições (Checkin)"
ON public.event_registrations FOR UPDATE
TO authenticated
USING (public.current_user_has_role(ARRAY['SYSADMIN', 'CHURCH_ADMIN']::public.app_role[]));

