'use server'

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

// O TypeScript agora exige que saibamos o formato do estado (State)
export async function login(
  prevState: { error: string } | null, 
  formData: FormData
) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: 'E-mail ou senha inválidos.' };
  }

  // Se o login der certo, vai para a home
  redirect('/');
}