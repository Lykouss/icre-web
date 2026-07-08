-- 20260707000004_advanced_maintenance.sql

ALTER TABLE public.site_maintenance
  ADD COLUMN scheduled_portal BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN scheduled_sige BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN auto_activate_scheduled BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN auto_deactivate_expected BOOLEAN NOT NULL DEFAULT false;
