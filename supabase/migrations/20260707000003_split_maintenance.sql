-- 20260707000003_split_maintenance.sql

ALTER TABLE public.site_maintenance 
  RENAME COLUMN is_active TO is_portal_maintenance;

ALTER TABLE public.site_maintenance
  ADD COLUMN is_sige_maintenance BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN expected_end_at TIMESTAMP WITH TIME ZONE;
