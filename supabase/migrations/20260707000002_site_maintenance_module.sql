-- 20260707000002_site_maintenance_module.sql

CREATE TABLE IF NOT EXISTS public.site_maintenance (
    id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1), -- Singleton, apenas id=1 é permitido
    is_active BOOLEAN NOT NULL DEFAULT false,
    block_signups BOOLEAN NOT NULL DEFAULT false,
    block_logins BOOLEAN NOT NULL DEFAULT false,
    scheduled_at TIMESTAMP WITH TIME ZONE,
    message TEXT NOT NULL DEFAULT 'O site está em manutenção. Voltaremos em breve.',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);

-- Garantir que sempre exista a linha 1
INSERT INTO public.site_maintenance (id, is_active) VALUES (1, false) ON CONFLICT (id) DO NOTHING;

-- Habilitar RLS
ALTER TABLE public.site_maintenance ENABLE ROW LEVEL SECURITY;

-- Adicionar a tabela à replicação do Supabase (Realtime)
-- (No Supabase, usamos pgbouncer ou alteramos o publication se necessário, 
-- mas a forma padrão nativa para Realtime é adicionar a tabela no publication supabase_realtime)
BEGIN;
  DROP PUBLICATION IF EXISTS supabase_realtime;
  CREATE PUBLICATION supabase_realtime;
COMMIT;
ALTER PUBLICATION supabase_realtime ADD TABLE public.site_maintenance;

-- Políticas de segurança
-- Leitura liberada para todos (anon e authenticated), necessário para checagem em tempo real
CREATE POLICY "Public pode ler status de manutenção" ON public.site_maintenance
    FOR SELECT USING (true);

-- Atualização restrita a administradores
CREATE POLICY "Admins podem atualizar manutenção" ON public.site_maintenance
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = auth.uid() AND role IN ('SYSADMIN', 'CHURCH_ADMIN')
        )
    );
