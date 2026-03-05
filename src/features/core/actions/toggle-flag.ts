'use server'

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { getCurrentUser } from '@/features/core/api/get-current-user';

export async function toggleFeatureFlag(slug: string, newStatus: boolean) {
  // 1. O Leão de Chácara: Verifica se quem chamou a ação é SysAdmin mesmo
  const user = await getCurrentUser();
  if (!user?.isSysAdmin) {
    return { error: 'Acesso negado. Apenas SysAdmins podem alterar módulos.' };
  }

  const supabase = await createClient();

  // 2. Atualiza o banco de dados (Mutação Segura no Servidor)
  const { error } = await supabase
    .from('feature_flags')
    .update({ is_active: newStatus })
    .eq('slug', slug);

  if (error) {
    console.error('Erro ao atualizar a flag:', error.message);
    return { error: 'Falha ao atualizar o banco de dados.' };
  }

  // 3. A Mágica do Next.js: Força o layout inteiro (incluindo a Sidebar) a buscar os dados novos no banco!
  revalidatePath('/', 'layout');
  
  return { success: true };
}