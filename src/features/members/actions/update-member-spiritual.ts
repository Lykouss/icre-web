'use server'

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { getCurrentUser } from '@/features/core/api/get-current-user';

export async function updateMemberSpiritual(memberId: string, formData: FormData) {
  const user = await getCurrentUser();
  if (!user) return { error: 'Não autorizado' };

  // Pegamos os dados do formulário
  const baptismDate = formData.get('baptismDate') as string;
  // Checkboxes no FormData retornam 'on' quando marcados, ou null quando desmarcados
  const encounterCompleted = formData.get('encounterCompleted') === 'on';
  const discipleshipCompleted = formData.get('discipleshipCompleted') === 'on';

  const supabase = await createClient();

  // 1. Busca a ficha ANTIGA para o Log
  const { data: oldData } = await supabase.from('members').select('*').eq('id', memberId).single();

  // 2. Atualiza a trilha espiritual
  const { data: newMember, error } = await supabase
    .from('members')
    .update({ 
      baptism_date: baptismDate || null,
      encounter_completed: encounterCompleted,
      discipleship_completed: discipleshipCompleted,
      updated_at: new Date().toISOString() 
    })
    .eq('id', memberId)
    .select()
    .single();

  if (error) {
    console.error('Erro ao atualizar trilha espiritual:', error);
    return { error: 'Falha ao salvar os dados espirituais.' };
  }

  // 3. Salva a "Fofoca" no Audit Trail com uma ação específica
  await supabase.from('audit_logs').insert({
    entity_name: 'members',
    entity_id: memberId,
    action: 'UPDATE_SPIRITUAL', // Ação exclusiva
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