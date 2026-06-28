-- 1. Tabela para rastreio de uploads para rate limit (20 por dia)
CREATE TABLE IF NOT EXISTS public.support_upload_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS da nova tabela (apenas inserção pelo service_role no backend, e select para validação)
ALTER TABLE public.support_upload_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all upload logs" 
    ON public.support_upload_logs FOR SELECT 
    USING (public.current_user_has_role(ARRAY['SYSADMIN','CHURCH_ADMIN']::public.app_role[]));

-- 2. Restrição de Tamanho (5MB) e Tipos no Storage
-- O bucket support_attachments já existe. Vamos atualizar as configs se possível
UPDATE storage.buckets
SET file_size_limit = 5242880, -- 5MB
    allowed_mime_types = ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'application/pdf']
WHERE id = 'support_attachments';

-- Caso as constraints acima não sejam ativas por padrão, adicionamos uma policy restritiva para o INSERT:
DROP POLICY IF EXISTS "Users can upload their own attachments" ON storage.objects;
CREATE POLICY "Users can upload their own attachments"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'support_attachments' AND 
  (storage.foldername(name))[1] = auth.uid()::text AND
  (storage.extension(name) IN ('png', 'jpeg', 'jpg', 'webp', 'pdf'))
  -- Note: Supabase Storage RLS não suporta checar tamanho dinamicamente aqui ainda, o limite no bucket é quem faz o serviço.
);

-- 3. Índice para acelerar a busca de limites no backend
CREATE INDEX IF NOT EXISTS support_upload_logs_user_id_created_at_idx 
    ON public.support_upload_logs (user_id, created_at);
