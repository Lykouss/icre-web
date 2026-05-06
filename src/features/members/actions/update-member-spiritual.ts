'use server'

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';
import { getCurrentUser } from '@/features/core/api/get-current-user';
import { canWriteMembers, isValidUuid, isValidDate } from '@/lib/action-validators';

export async function updateMemberSpiritual(memberId: string, formData: FormData) {
  const user = await getCurrentUser();
  if (!user) return { error: 'Não autorizado.' };

  if (!canWriteMembers(user.roles)) {
    return { error: 'Acesso negado. Você não tem permissão para editar dados espirituais.' };
  }

  if (!isValidUuid(memberId)) {
    return { error: 'Identificador de membro inválido.' };
  }

  const baptismDate = (formData.get('baptismDate') as string)?.trim();
  const encounterCompleted = formData.get('encounterCompleted') === 'on';
  const discipleshipCompleted = formData.get('discipleshipCompleted') === 'on';

  if (baptismDate && !isValidDate(baptismDate)) {
    return { error: 'Data de batismo inválida.' };
  }

  const supabase = await createClient();

  const { data: oldData } = await supabase
    .from('members')
    .select('*')
    .eq('id', memberId)
    .single();

  const { data: newMember, error } = await supabase
    .from('members')
    .update({
      baptism_date: baptismDate || null,
      encounter_completed: encounterCompleted,
      discipleship_completed: discipleshipCompleted,
      updated_at: new Date().toISOString(),
    })
    .eq('id', memberId)
    .select()
    .single();

  if (error) {
    console.error('Erro ao atualizar trilha espiritual:', error.message);
    return { error: 'Falha ao salvar os dados espirituais.' };
  }

  const admin = await createAdminClient();
  await admin.from('audit_logs').insert({
    entity_name: 'members',
    entity_id: memberId,
    action: 'UPDATE_SPIRITUAL',
    actor_id: user.id,
    actor_name: user.fullName,
    actor_role: user.roles[0],
    old_data: oldData,
    new_data: newMember,
  });

  revalidatePath(`/membros/${memberId}`);
  revalidatePath('/membros');
  return { success: true };
}