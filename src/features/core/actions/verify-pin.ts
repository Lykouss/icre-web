'use server'

import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export async function verifyPin(
  prevState: { error: string } | null,
  formData: FormData
) {
  const pin = formData.get('pin') as string;

  if (!pin || pin.length !== 4) {
    return { error: 'O PIN deve ter exatamente 4 dígitos.' };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Sessão expirada. Faça login novamente.' };
  }

  // Busca o PIN real do usuário no banco (Leitura segura via servidor)
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('security_pin')
    .eq('id', user.id)
    .single();

  if (error || !profile || profile.security_pin !== pin) {
    return { error: 'PIN incorreto. Tente novamente.' };
  }

  // Se acertou o PIN, criamos o "carimbo" (Cookie seguro válido por 2 horas)
  const cookieStore = await cookies();
  cookieStore.set('admin_unlocked', 'true', {
    maxAge: 60 * 60 * 2, // 2 horas em segundos
    httpOnly: true,      // Impede que o JavaScript do navegador leia isso (anti-hack)
    secure: process.env.NODE_ENV === 'production',
    path: '/',
  });

  // Redireciona para o painel
  redirect('/dashboard');
}