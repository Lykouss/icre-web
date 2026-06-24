'use server'

import { createClient } from '@/lib/supabase/server';
import type { ActionResult } from '@/features/support/types';

// ─────────────────────────────────────────────────────────────────────────────
// submitFeedback — envia sugestão ou relato de bug (limite: 1/24h por usuário)
// ─────────────────────────────────────────────────────────────────────────────

export async function submitFeedback(
  type: 'bug' | 'suggestion',
  content: string
): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Você precisa estar logado para enviar feedback.' };

  const cleanContent = content.trim();

  if (cleanContent.length < 20) {
    return { error: 'O feedback deve ter pelo menos 20 caracteres.' };
  }
  if (cleanContent.length > 500) {
    return { error: 'O feedback não pode ultrapassar 500 caracteres.' };
  }
  if (type !== 'bug' && type !== 'suggestion') {
    return { error: 'Tipo de feedback inválido.' };
  }

  // Rate limit: 1 feedback por 24 horas usando o RPC existente do projeto
  const { data: allowed, error: rateLimitError } = await supabase.rpc(
    'rpc_check_and_record_rate_limit',
    {
      p_identifier:    user.id,
      p_action:        'submit_feedback',
      p_max_attempts:  1,
      p_window_minutes: 60 * 24, // 24 horas
    }
  );

  if (rateLimitError) {
    console.error('[submitFeedback:rateLimit]', rateLimitError.message);
    return { error: 'Erro interno. Tente novamente em breve.' };
  }

  if (!allowed) {
    return { error: 'Você já enviou um feedback nas últimas 24 horas. Aguarde antes de enviar novamente.' };
  }

  const { error: insertError } = await supabase
    .from('feedback')
    .insert({
      user_id: user.id,
      content: cleanContent,
      type,
    });

  if (insertError) {
    console.error('[submitFeedback]', insertError.message);
    return { error: 'Erro ao enviar feedback. Tente novamente.' };
  }

  return {};
}

// ─────────────────────────────────────────────────────────────────────────────
// checkFeedbackRateLimit — verifica se o usuário pode enviar feedback agora
// (usado para mostrar o aviso na UI sem precisar de uma action de submit)
// ─────────────────────────────────────────────────────────────────────────────

export async function checkFeedbackRateLimit(): Promise<ActionResult<{ canSubmit: boolean; nextAvailableAt: string | null }>> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: { canSubmit: false, nextAvailableAt: null } };

  const windowStart = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const { data: lastFeedback } = await supabase
    .from('feedback')
    .select('created_at')
    .eq('user_id', user.id)
    .gte('created_at', windowStart)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!lastFeedback) {
    return { data: { canSubmit: true, nextAvailableAt: null } };
  }

  const nextAt = new Date(new Date(lastFeedback.created_at).getTime() + 24 * 60 * 60 * 1000);
  return {
    data: {
      canSubmit: false,
      nextAvailableAt: nextAt.toISOString(),
    },
  };
}
