'use server'

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';
import { getCurrentUser } from '@/features/core/api/get-current-user';
import { canWriteMembers, isValidUuid } from '@/lib/action-validators';

export async function updateMemberMinistries(memberId: string, ministries: string[]) {
  const user = await getCurrentUser();
  if (!user) return { error: 'Não autorizado.' };

  if (!canWriteMembers(user.roles)) {
    return { error: 'Acesso negado. Você não tem permissão para editar ministérios.' };
  }

  if (!isValidUuid(memberId)) {
    return { error: 'Identificador de membro inválido.' };
  }

  if (!Array.isArray(ministries) || ministries.some(m => typeof m !== 'string' || m.length > 100)) {
    return { error: 'Lista de ministérios inválida.' };
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
      ministries,
      updated_at: new Date().toISOString(),
    })
    .eq('id', memberId)
    .select()
    .single();

  if (error) {
    console.error('Erro ao atualizar ministérios:', error.message);
    return { error: 'Falha ao salvar os ministérios.' };
  }

  const admin = await createAdminClient();
  await admin.from('audit_logs').insert({
    entity_name: 'members',
    entity_id: memberId,
    action: 'UPDATE_MINISTRIES',
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