'use server'

import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { checkPinRateLimit, recordPinAttempt } from '@/features/core/utils/pin-rate-limit';

export async function verifyPin(
  prevState: { error: string } | null,
  formData: FormData
) {
  const pin = formData.get('pin') as string;

  if (!pin || !/^\d{4}$/.test(pin)) {
    return { error: 'O PIN deve ter exatamente 4 dígitos numéricos.' };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Sessão expirada. Faça login novamente.' };
  }

  const rateLimit = await checkPinRateLimit(supabase, user.id);
  if (!rateLimit.allowed) {
    return {
      error: `Muitas tentativas incorretas. Aguarde ${rateLimit.retryAfterMinutes} minutos antes de tentar novamente.`,
    };
  }

  const { data: isCorrect, error: rpcError } = await supabase
    .rpc('verify_pin', { user_id: user.id, pin_input: pin });

  await recordPinAttempt(supabase, user.id, !!isCorrect && !rpcError);

  if (rpcError || !isCorrect) {
    const remaining = rateLimit.remainingAttempts;
    const suffix = remaining > 0
      ? ` Você ainda tem ${remaining} tentativa${remaining !== 1 ? 's' : ''}.`
      : ' Você atingiu o limite de tentativas.';
    return { error: `PIN incorreto.${suffix}` };
  }

  const cookieStore = await cookies();
  cookieStore.set('admin_unlocked', 'true', {
    maxAge: 60 * 60 * 2,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  });

  redirect('/dashboard');
}