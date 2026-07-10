-- Adiciona coluna de tema na tabela profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS public_theme text DEFAULT 'dark';

-- Garante que valores inválidos não sejam inseridos
ALTER TABLE public.profiles
ADD CONSTRAINT check_valid_theme CHECK (public_theme IN ('light', 'dark'));
