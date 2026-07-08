'use server';

import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/features/core/api/get-current-user';

export async function updateOwnPassword(password: string) {
  const user = await getCurrentUser();
  if (!user) return { error: 'Não autorizado' };

  const supabase = await createClient();

  // 1. Atualizar a senha no auth
  const { error: authError } = await supabase.auth.updateUser({ password });
  if (authError) {
    return { error: authError.message };
  }

  // 2. Remover a flag requires_password_change do perfil
  const { error: profileError } = await supabase
    .from('profiles')
    .update({ requires_password_change: false })
    .eq('id', user.id);

  if (profileError) {
    console.error('Erro ao atualizar requires_password_change:', profileError);
    // Mesmo falhando aqui, a senha foi alterada, mas é melhor garantir.
  }

  return { success: true };
}
