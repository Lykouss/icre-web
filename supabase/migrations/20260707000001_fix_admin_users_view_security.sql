-- Correção do alerta de lint do Supabase (0010_security_definer_view)
-- Define a view para executar com os privilégios do usuário invocador (security_invoker)
-- ao invés dos privilégios do criador da view (security_definer).

ALTER VIEW public.admin_users_view SET (security_invoker = true);
