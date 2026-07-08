ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS force_logout boolean default false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS banned_modules text[] default '{}'::text[];

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
    COALESCE(
        (SELECT json_agg(role) FROM public.user_roles ur WHERE ur.user_id = p.id),
        '[]'::json
    ) AS roles
FROM public.profiles p
WHERE NOT EXISTS (
    SELECT 1 FROM public.user_roles ur2 WHERE ur2.user_id = p.id AND ur2.role = 'SYSADMIN'
);
