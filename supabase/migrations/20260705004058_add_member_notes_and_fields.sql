-- Adicionando novos campos no perfil
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS birth_date DATE,
ADD COLUMN IF NOT EXISTS gender TEXT CHECK (gender IN ('M', 'F', 'OTHER', 'PREFER_NOT_TO_SAY')),
ADD COLUMN IF NOT EXISTS marital_status TEXT CHECK (marital_status IN ('SINGLE', 'MARRIED', 'DIVORCED', 'WIDOWED', 'OTHER'));

-- Tabela de Anotações do CRM (Member Notes)
CREATE TABLE IF NOT EXISTS public.member_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    target_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    admin_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    note_text TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitando RLS para member_notes
ALTER TABLE public.member_notes ENABLE ROW LEVEL SECURITY;

-- Políticas de segurança
-- Apenas admins podem ler notas de CRM
CREATE POLICY "Admins can read member notes" ON public.member_notes
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = auth.uid() AND role IN ('SYSADMIN', 'CHURCH_ADMIN')
        )
    );

-- Apenas admins podem inserir notas de CRM
CREATE POLICY "Admins can insert member notes" ON public.member_notes
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = auth.uid() AND role IN ('SYSADMIN', 'CHURCH_ADMIN')
        )
    );

-- Atualizando a view de leitura para admins
DROP VIEW IF EXISTS public.admin_users_view;
CREATE OR REPLACE VIEW public.admin_users_view AS
SELECT 
    p.id,
    p.full_name,
    p.email,
    p.phone,
    p.photo_url,
    p.address,
    p.cell_group,
    p.created_at,
    p.banned_until,
    p.ban_reason,
    p.requires_password_change,
    p.force_logout,
    p.banned_modules,
    p.birth_date,
    p.gender,
    p.marital_status,
    COALESCE(
        (SELECT array_agg(ur.role) FROM public.user_roles ur WHERE ur.user_id = p.id),
        ARRAY[]::app_role[]
    ) as roles
FROM public.profiles p;

GRANT SELECT ON public.admin_users_view TO authenticated;
