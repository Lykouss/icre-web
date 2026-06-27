-- =============================================================================
-- ICRE — Adicionar novos valores ao ENUM app_role
-- 2026-06-27 (deve rodar ANTES de qualquer migration que USE esses novos valores)
-- O PostgreSQL exige que ALTER TYPE ADD VALUE seja commitado antes de ser usado.
-- =============================================================================

ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'SUPPORT_ADMIN';   -- Atendente de Suporte
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'EVENT_ADMIN';     -- Coordenador de Eventos
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'MEDIA_ADMIN';     -- Gerente de Conteúdo/Mídia
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'MEMBER_ADMIN';    -- Gestor de Membros
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'REPORT_VIEWER';   -- Analista (Somente Leitura)
