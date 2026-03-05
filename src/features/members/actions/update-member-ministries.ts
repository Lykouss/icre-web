'use server'

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { getCurrentUser } from '@/features/core/api/get-current-user';

export async function updateMemberMinistries(memberId: string, ministries: string[]) {
  const user = await getCurrentUser();
  if (!user) return { error: 'Não autorizado' };

  const supabase = await createClient();

  // 1. Busca a ficha ANTIGA para o Log
  const { data: oldData } = await supabase.from('members').select('*').eq('id', memberId).single();

  // 2. Atualiza a lista de ministérios
  const { data: newMember, error } = await supabase
    .from('members')
    .update({ 
      ministries: ministries,
      updated_at: new Date().toISOString() 
    })
    .eq('id', memberId)
    .select()
    .single();

  if (error) {
    console.error('Erro ao atualizar ministérios:', error);
    return { error: 'Falha ao salvar os ministérios.' };
  }

  // 3. Salva a "Fofoca" no Audit Trail
  await supabase.from('audit_logs').insert({
    entity_name: 'members',
    entity_id: memberId,
    action: 'UPDATE_MINISTRIES', // Ação exclusiva
    actor_id: user.id,
    actor_name: user.fullName,
    actor_email: (user as { email?: string | null }).email || 'Sem e-mail',
    actor_role: user.isSysAdmin ? 'SysAdmin' : (user.isAdmin ? 'Administrador' : 'Usuário'),
    old_data: oldData,
    new_data: newMember 
  });

  // 4. Atualiza os dados no servidor para todo mundo
  revalidatePath(`/membros/${memberId}`);
  revalidatePath('/membros');
  
  return { success: true };
}