'use server'

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { getCurrentUser } from '@/features/core/api/get-current-user';
import { canManageConfidentialNotes } from '@/lib/rbac';
import { isValidUuid } from '@/lib/action-validators';

export async function updateMemberNotes(memberId: string, notes: string) {
  const user = await getCurrentUser();
  if (!user) return { error: 'Não autorizado.' };

  if (!isValidUuid(memberId)) return { error: 'Identificador de membro inválido.' };

  if (!canManageConfidentialNotes(user.roles)) {
    return { error: 'Acesso negado. Apenas a alta liderança pode alterar anotações confidenciais.' };
  }

  if (typeof notes !== 'string' || notes.length > 5000) {
    return { error: 'Conteúdo das anotações inválido.' };
  }

  const supabase = await createClient();

  const { data: oldData } = await supabase
    .from('members')
    .select('*')
    .eq('id', memberId)
    .single();

  const { data: newMember, error } = await supabase
    .from('members')
    .update({ notes: notes || null, updated_at: new Date().toISOString() })
    .eq('id', memberId)
    .select()
    .single();

  if (error) {
    console.error('Erro ao atualizar anotações:', error.message);
    return { error: 'Falha ao guardar as anotações.' };
  }

  await supabase.from('audit_logs').insert({
    entity_name: 'members',
    entity_id: memberId,
    action: 'UPDATE_NOTES',
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