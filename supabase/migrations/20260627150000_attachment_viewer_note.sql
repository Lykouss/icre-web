-- =============================================================================
-- Server Action: URL assinada para anexos de suporte
-- =============================================================================
-- Esta migration não contém alterações de banco.
-- A Server Action getAttachmentSignedUrl() é implementada no código TypeScript
-- e usa supabase.storage.from('support_attachments').createSignedUrl(path, 60).
-- O bucket 'support_attachments' já existe e possui as RLS corretas.
-- =============================================================================
SELECT 1; -- placeholder para manter numeração de migrations
