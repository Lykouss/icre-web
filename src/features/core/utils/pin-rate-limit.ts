import { SupabaseClient } from '@supabase/supabase-js';

const MAX_ATTEMPTS = 5;
const WINDOW_MINUTES = 15;

interface RateLimitResult {
  allowed: boolean;
  remainingAttempts: number;
  retryAfterMinutes?: number;
}

export async function checkPinRateLimit(
  supabase: SupabaseClient,
  userId: string
): Promise<RateLimitResult> {
  const windowStart = new Date(Date.now() - WINDOW_MINUTES * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from('pin_attempts')
    .select('id, success')
    .eq('user_id', userId)
    .eq('success', false)
    .gte('attempted_at', windowStart);

  if (error) {
    // Em caso de erro na tabela de rate limit, nega por segurança
    console.error('Erro ao verificar rate limit:', error.message);
    return { allowed: false, remainingAttempts: 0 };
  }

  const failedAttempts = data?.length ?? 0;

  if (failedAttempts >= MAX_ATTEMPTS) {
    return {
      allowed: false,
      remainingAttempts: 0,
      retryAfterMinutes: WINDOW_MINUTES,
    };
  }

  return {
    allowed: true,
    remainingAttempts: MAX_ATTEMPTS - failedAttempts - 1,
  };
}

export async function recordPinAttempt(
  supabase: SupabaseClient,
  userId: string,
  success: boolean
) {
  await supabase.from('pin_attempts').insert({ user_id: userId, success });
}