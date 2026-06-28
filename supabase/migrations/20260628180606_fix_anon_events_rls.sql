-- 1. Corrige o linter error do Supabase (SECURITY DEFINER VIEW)
-- Adiciona WITH (security_invoker = true) para que a view respeite as permissões do usuário consultante
DROP VIEW IF EXISTS public.events_public;

CREATE VIEW public.events_public WITH (security_invoker = true) AS
SELECT
  id,
  title,
  description,
  date,
  time,
  location,
  type,
  banner_url,
  capacity,
  ticket_price,
  requires_payment,
  requires_registration,
  is_public,
  status,
  publish_at,
  rules,
  custom_form_schema
FROM public.events
WHERE is_public = true AND status = 'publicado';

GRANT SELECT ON public.events_public TO anon;


-- 2. Corrige o bug onde usuários não logados (anon) não conseguiam ver eventos.
-- O problema ocorria porque a policy unificada chamava a função current_user_has_role(),
-- a qual o role 'anon' não tinha permissão de execução (REVOKE ALL FROM PUBLIC),
-- gerando um erro interno e retornando 0 linhas.
-- Solução: Separar a policy de SELECT em duas (anon e authenticated) para evitar a chamada da função pelo anon.

DROP POLICY IF EXISTS "Usuários podem ver eventos publicados" ON public.events;

-- Policy exclusiva para anon (visitantes não logados)
CREATE POLICY "Anon pode ver eventos publicados"
ON public.events FOR SELECT
TO anon
USING (status = 'publicado');

-- Policy para usuários autenticados (podem ver os publicados, os que criaram, ou todos se forem admins)
CREATE POLICY "Authenticated pode ver eventos publicados ou gerenciar"
ON public.events FOR SELECT
TO authenticated
USING (
  status = 'publicado' 
  OR auth.uid() = created_by 
  OR public.current_user_has_role(ARRAY['SYSADMIN', 'CHURCH_ADMIN']::public.app_role[])
);
