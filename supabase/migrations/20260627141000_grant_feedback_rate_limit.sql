-- =============================================================================
-- Fix: Grant permissão de execução para rpc_check_and_record_rate_limit
-- Necessário para que usuários logados consigam submeter feedbacks
-- =============================================================================

GRANT EXECUTE ON FUNCTION public.rpc_check_and_record_rate_limit(TEXT, TEXT, INTEGER, INTEGER) TO authenticated;
