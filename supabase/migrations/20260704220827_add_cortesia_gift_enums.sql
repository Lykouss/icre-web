-- Adiciona os valores nos enums se eles não existirem (forma segura no Postgres)
ALTER TYPE public.payment_status ADD VALUE IF NOT EXISTS 'cortesia';
ALTER TYPE public.payment_method ADD VALUE IF NOT EXISTS 'gift';
