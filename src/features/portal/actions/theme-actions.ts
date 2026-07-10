'use server'

import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/features/core/api/get-current-user';
import { cookies } from 'next/headers';

export async function updatePublicTheme(theme: 'light' | 'dark') {
  if (theme !== 'light' && theme !== 'dark') return { error: 'Tema inválido' };

  // Set the cookie for immediate availability across the site (both anon and logged in)
  const cookieStore = await cookies();
  cookieStore.set('public-theme', theme, { maxAge: 60 * 60 * 24 * 365, path: '/' });

  const user = await getCurrentUser();
  if (!user) return { success: true }; 

  const supabase = await createClient();
  const { error } = await supabase
    .from('profiles')
    .update({ public_theme: theme })
    .eq('id', user.id);

  if (error) {
    console.error('Falha ao salvar tema no banco:', error);
    return { error: 'Falha ao salvar a preferência de tema no banco.' };
  }

  return { success: true };
}
