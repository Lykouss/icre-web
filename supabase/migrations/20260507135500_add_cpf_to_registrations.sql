ALTER TABLE public.event_registrations ADD COLUMN IF NOT EXISTS cpf TEXT;

-- Garantir que as políticas de RLS cubram a nova coluna (embora SELECT * já cubra, é bom reforçar que a segurança se mantém)
-- Não são necessárias novas políticas, pois as existentes em event_registrations já protegem a tabela toda.
