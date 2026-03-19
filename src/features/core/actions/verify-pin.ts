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

  if (!user) return { error: 'Sessão expirada. Faça login novamente.' };

  const rateLimit = await checkPinRateLimit(supabase, user.id);
  if (!rateLimit.allowed) {
    return {
      error: `Muitas tentativas incorretas. Aguarde ${rateLimit.retryAfterMinutes} minutos.`,
    };
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('security_pin_hash')
    .eq('id', user.id)
    .single();

  if (!profile?.security_pin_hash) {
    return { error: 'PIN não configurado. Entre em contato com a liderança.' };
  }

  const bcrypt = await import('bcryptjs');
  const isCorrect = await bcrypt.compare(pin, profile.security_pin_hash);

  await recordPinAttempt(supabase, user.id, isCorrect);

  if (!isCorrect) {
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