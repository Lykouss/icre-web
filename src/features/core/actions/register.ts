'use server'

import { createClient } from '@/lib/supabase/server';

type RegisterState = { error: string; success?: never } | { success: true; error?: never } | null;

export async function register(
  prevState: RegisterState,
  formData: FormData
): Promise<RegisterState> {
  const fullName = (formData.get('fullName') as string)?.trim();
  const email = (formData.get('email') as string)?.trim();
  const password = formData.get('password') as string;
  const confirmPassword = formData.get('confirmPassword') as string;

  if (!fullName || fullName.length < 3) {
    return { error: 'O nome precisa ter pelo menos 3 letras.' };
  }

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: 'Informe um e-mail válido.' };
  }

  if (!password || password.length < 8) {
    return { error: 'A senha deve ter pelo menos 8 caracteres.' };
  }

  if (password !== confirmPassword) {
    return { error: 'As senhas não coincidem.' };
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName },
    },
  });

  if (error) {
    if (error.message.includes('already registered')) {
      return { error: 'Este e-mail já está cadastrado.' };
    }
    return { error: 'Não foi possível criar a conta. Tente novamente.' };
  }

  return { success: true };
}