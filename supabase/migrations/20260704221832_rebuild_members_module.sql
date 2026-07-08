-- Adicionar colunas necessárias na profiles para evitar consultar auth.users em views
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS banned_until timestamp with time zone;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS ban_reason text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS requires_password_change boolean default false;

-- Função para sincronizar email do auth.users
CREATE OR REPLACE FUNCTION public.sync_user_email()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.profiles SET email = NEW.email WHERE id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para sincronizar email na atualização
DROP TRIGGER IF EXISTS on_auth_user_email_updated ON auth.users;
CREATE TRIGGER on_auth_user_email_updated
  AFTER UPDATE OF email ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_user_email();

-- Backfill dos emails atuais
DO $$
DECLARE
    r record;
BEGIN
    FOR r IN SELECT id, email FROM auth.users LOOP
        UPDATE public.profiles SET email = r.email WHERE id = r.id;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Substituir members_with_admins (se houver, a gente ignora ou substitui, mas vamos criar a admin_users_view)
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
    COALESCE(
        (SELECT json_agg(role) FROM public.user_roles ur WHERE ur.user_id = p.id),
        '[]'::json
    ) AS roles
FROM public.profiles p
WHERE NOT EXISTS (
    SELECT 1 FROM public.user_roles ur2 WHERE ur2.user_id = p.id AND ur2.role = 'SYSADMIN'
);

-- Garantir acesso aos admins
GRANT SELECT ON public.admin_users_view TO authenticated;
