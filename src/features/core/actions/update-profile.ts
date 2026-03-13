'use server'

import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/features/core/api/get-current-user';
import { revalidatePath } from 'next/cache';

interface UpdateProfilePayload {
  fullName: string;
}

export async function updateProfile(
  userId: string,
  payload: UpdateProfilePayload
): Promise<{ error: string } | { success: true }> {
  const user = await getCurrentUser();
  if (!user || user.id !== userId) return { error: 'Não autorizado.' };

  const fullName = payload.fullName.trim();
  if (!fullName || fullName.length < 3) {
    return { error: 'O nome precisa ter pelo menos 3 letras.' };
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from('profiles')
    .update({ full_name: fullName })
    .eq('id', userId);

  if (error) {
    return { error: 'Falha ao atualizar os dados.' };
  }

  revalidatePath('/minha-conta');
  return { success: true };
}