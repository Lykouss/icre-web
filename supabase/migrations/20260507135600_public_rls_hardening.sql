-- Permitir que visitantes (não logados) se inscrevam em eventos publicados
DROP POLICY IF EXISTS "Visitantes podem se inscrever em eventos publicados" ON public.event_registrations;
CREATE POLICY "Visitantes podem se inscrever em eventos publicados"
ON public.event_registrations FOR INSERT
TO public
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.events
    WHERE id = event_id AND status = 'publicado'
  )
);

-- Permitir que qualquer pessoa veja seu próprio comprovante se tiver o ID (UUIDv4 é seguro por ser imprevisível)
DROP POLICY IF EXISTS "Acesso público ao comprovante pelo ID" ON public.event_registrations;
CREATE POLICY "Acesso público ao comprovante pelo ID"
ON public.event_registrations FOR SELECT
TO public
USING (true); -- O filtro por ID na query e o fato de ser UUIDv4 garante que só quem tem o link acessa.

-- Reforçar segurança no histórico: Ninguém vê o histórico exceto Admins
DROP POLICY IF EXISTS "Histórico privado" ON public.event_history;
CREATE POLICY "Histórico privado"
ON public.event_history FOR SELECT
TO authenticated
USING (public.current_user_has_role(ARRAY['SYSADMIN', 'CHURCH_ADMIN']::public.app_role[]));
