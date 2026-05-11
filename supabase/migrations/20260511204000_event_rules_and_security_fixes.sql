-- =============================================================================
-- ICRE UX and Security Fixes
-- 2026-05-11: Event rules column, profile trigger fix, TOCTOU rate limit RPC
-- =============================================================================

-- 1. Add rules column to events
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS rules TEXT;

-- 2. Protect profile trigger bypass (from 1_Fixes)
DROP TRIGGER IF EXISTS trg_protect_profile_sensitive_fields ON public.profiles;
CREATE TRIGGER trg_protect_profile_sensitive_fields
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_profile_sensitive_fields();

-- 3. Rate Limit RPC to prevent TOCTOU
CREATE OR REPLACE FUNCTION public.rpc_check_and_record_rate_limit(
  p_identifier TEXT,
  p_action TEXT,
  p_max_attempts INT,
  p_window_minutes INT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INT;
  v_window_start TIMESTAMPTZ;
BEGIN
  v_window_start := now() - (p_window_minutes || ' minutes')::interval;

  -- Clean old logs to keep table light
  DELETE FROM public.auth_rate_limits
  WHERE attempted_at < v_window_start;

  -- Wait/Lock on existing rows for this identifier/action
  PERFORM 1
  FROM public.auth_rate_limits
  WHERE identifier = p_identifier AND action = p_action
  FOR UPDATE;

  -- Count attempts in the window
  SELECT count(*)
  INTO v_count
  FROM public.auth_rate_limits
  WHERE identifier = p_identifier
    AND action = p_action
    AND attempted_at >= v_window_start;

  IF v_count >= p_max_attempts THEN
    RETURN FALSE;
  END IF;

  -- Record the new attempt
  INSERT INTO public.auth_rate_limits (identifier, action, attempted_at)
  VALUES (p_identifier, p_action, now());

  RETURN TRUE;
END;
$$;

-- Somente service_role chama essa function (Server Actions)
REVOKE EXECUTE ON FUNCTION public.rpc_check_and_record_rate_limit(TEXT, TEXT, INT, INT) FROM public;
REVOKE EXECUTE ON FUNCTION public.rpc_check_and_record_rate_limit(TEXT, TEXT, INT, INT) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.rpc_check_and_record_rate_limit(TEXT, TEXT, INT, INT) FROM anon;
GRANT EXECUTE ON FUNCTION public.rpc_check_and_record_rate_limit(TEXT, TEXT, INT, INT) TO service_role;
