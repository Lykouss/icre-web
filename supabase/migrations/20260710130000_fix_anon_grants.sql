-- Fix: Ensure the anon role has table-level SELECT privileges on public tables.
-- Previous security hardening scripts or missing grants prevented anon from accessing the tables entirely,
-- bypassing RLS policies that were already correctly configured.

GRANT SELECT ON public.pastors TO anon;
GRANT SELECT ON public.events TO anon;
GRANT SELECT ON public.cells TO anon;
