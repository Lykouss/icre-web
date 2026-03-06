'use server'

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { getCurrentUser } from '@/features/core/api/get-current-user';
import { canCreateMembers, isValidMemberStatus, isValidPhone } from '@/lib/action-validators';

export async function createMember(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) return { error: 'Não autorizado.' };

  if (!canCreateMembers(user.roles)) {
    return { error: 'Acesso negado. Você não tem permissão para cadastrar membros.' };
  }

  const fullName = (formData.get('fullName') as string)?.trim();
  const phone = (formData.get('phone') as string)?.trim();
  const status = (formData.get('status') as string)?.trim();
  const cellId = (formData.get('cellId') as string)?.trim();

  if (!fullName || fullName.length < 3) {
    return { error: 'O nome precisa ter pelo menos 3 letras.' };
  }

  if (phone && !isValidPhone(phone)) {
    return { error: 'Formato de telefone inválido.' };
  }

  const resolvedStatus = status && isValidMemberStatus(status) ? status : 'Visitante';

  const supabase = await createClient();

  const { data: newMember, error } = await supabase
    .from('members')
    .insert({
      full_name: fullName,
      phone: phone || null,
      status: resolvedStatus,
      cell_id: cellId || null,
    })
    .select()
    .single();

  if (error) {
    console.error('Erro ao criar membro:', error.message);
    return { error: 'Falha ao salvar no banco de dados.' };
  }

  await supabase.from('audit_logs').insert({
    entity_name: 'members',
    entity_id: newMember.id,
    action: 'CREATE',
    actor_id: user.id,
    actor_name: user.fullName,
    actor_role: user.roles[0],
    old_data: null,
    new_data: newMember,
  });

  revalidatePath('/membros');
  return { success: true };
}