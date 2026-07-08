-- Adiciona flag de troca de senha na tabela profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS force_password_change BOOLEAN DEFAULT false;

-- Tabela para gerenciar punições/banimentos
CREATE TABLE IF NOT EXISTS public.user_bans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL CHECK (type IN ('permanent', 'temporary', 'feature_specific')),
    feature_name VARCHAR(100), -- ex: 'change_avatar', 'change_name', NULL if it's an account ban
    expires_at TIMESTAMP WITH TIME ZONE, -- NULL if permanent
    reason TEXT NOT NULL,
    issued_by UUID NOT NULL REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE public.user_bans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_bans_admin_all" ON public.user_bans FOR ALL TO authenticated
USING (public.current_user_has_role(ARRAY['SYSADMIN', 'CHURCH_ADMIN']::public.app_role[]))
WITH CHECK (public.current_user_has_role(ARRAY['SYSADMIN', 'CHURCH_ADMIN']::public.app_role[]));

-- Os membros precisam conseguir ver se estão banidos em alguma feature (apenas SELECT para o user_id)
CREATE POLICY "user_bans_own_select" ON public.user_bans FOR SELECT TO authenticated
USING (user_id = auth.uid());

-- Tabela para dispositivos conhecidos do usuário (fingerprint)
CREATE TABLE IF NOT EXISTS public.user_known_devices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    device_id VARCHAR(255) NOT NULL,
    user_agent TEXT,
    last_seen_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, device_id)
);

ALTER TABLE public.user_known_devices ENABLE ROW LEVEL SECURITY;

-- Admins podem ver todos os dispositivos
CREATE POLICY "user_known_devices_admin_select" ON public.user_known_devices FOR SELECT TO authenticated
USING (public.current_user_has_role(ARRAY['SYSADMIN', 'CHURCH_ADMIN']::public.app_role[]));

-- O middleware/API (service_role) fará o insert ou authenticated fará
CREATE POLICY "user_known_devices_own_insert" ON public.user_known_devices FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "user_known_devices_own_select" ON public.user_known_devices FOR SELECT TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "user_known_devices_own_update" ON public.user_known_devices FOR UPDATE TO authenticated
USING (user_id = auth.uid());

-- Tabela global de IPs banidos
CREATE TABLE IF NOT EXISTS public.banned_ips (
    ip_address INET PRIMARY KEY,
    reason TEXT,
    issued_by UUID NOT NULL REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.banned_ips ENABLE ROW LEVEL SECURITY;

CREATE POLICY "banned_ips_admin_all" ON public.banned_ips FOR ALL TO authenticated
USING (public.current_user_has_role(ARRAY['SYSADMIN', 'CHURCH_ADMIN']::public.app_role[]))
WITH CHECK (public.current_user_has_role(ARRAY['SYSADMIN', 'CHURCH_ADMIN']::public.app_role[]));

-- Tabela de logs de auditoria imutáveis
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    target_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- Se o user for deletado, o log permanece (NULL ou keep ID se não usar FK restrita, mas SET NULL é melhor)
    admin_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    action_type VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    message_sent_to_user TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Select apenas para admins
CREATE POLICY "audit_logs_admin_select" ON public.audit_logs FOR SELECT TO authenticated
USING (public.current_user_has_role(ARRAY['SYSADMIN', 'CHURCH_ADMIN']::public.app_role[]));

-- Insert apenas para admins
CREATE POLICY "audit_logs_admin_insert" ON public.audit_logs FOR INSERT TO authenticated
WITH CHECK (public.current_user_has_role(ARRAY['SYSADMIN', 'CHURCH_ADMIN']::public.app_role[]));

-- Criar trigger para bloquear UPDATE e DELETE na tabela audit_logs (TORNAR IMUTÁVEL)
CREATE OR REPLACE FUNCTION public.prevent_audit_log_modification()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'A tabela audit_logs é estritamente de inserção (append-only) e os registros não podem ser modificados ou deletados.';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_prevent_audit_log_update
BEFORE UPDATE ON public.audit_logs
FOR EACH ROW EXECUTE FUNCTION public.prevent_audit_log_modification();

CREATE TRIGGER trg_prevent_audit_log_delete
BEFORE DELETE ON public.audit_logs
FOR EACH ROW EXECUTE FUNCTION public.prevent_audit_log_modification();

-- Também permitir que o service_role manipule inserts livremente (para actions)
CREATE POLICY "audit_logs_service_role_all" ON public.audit_logs FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "banned_ips_service_role_all" ON public.banned_ips FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "user_bans_service_role_all" ON public.user_bans FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "user_known_devices_service_role_all" ON public.user_known_devices FOR ALL TO service_role USING (true) WITH CHECK (true);
