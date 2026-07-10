-- Restaurar permissão de SELECT no user_roles para anon
-- Isso resolve o erro 'permission denied' ao carregar pastores e eventos na home.
-- O RLS do user_roles já garante que o anon verá 0 linhas, sendo perfeitamente seguro.

GRANT SELECT ON public.user_roles TO anon;
