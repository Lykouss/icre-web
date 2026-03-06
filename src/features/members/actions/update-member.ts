'use server'

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { getCurrentUser } from '@/features/core/api/get-current-user';
import {
  canWriteMembers,
  isValidUuid,
  isValidMemberStatus,
  isValidGender,
  isValidMaritalStatus,
  isValidEmail,
  isValidPhone,
  isValidDate,
} from '@/lib/action-validators';

export async function updateMemberGeneral(memberId: string, formData: FormData) {
  const user = await getCurrentUser();
  if (!user) return { error: 'Não autorizado.' };

  if (!canWriteMembers(user.roles)) {
    return { error: 'Acesso negado. Você não tem permissão para editar membros.' };
  }

  if (!isValidUuid(memberId)) return { error: 'Identificador de membro inválido.' };

  const fullName     = (formData.get('fullName')     as string)?.trim();
  const email        = (formData.get('email')        as string)?.trim();
  const phone        = (formData.get('phone')        as string)?.trim();
  const birthDate    = (formData.get('birthDate')    as string)?.trim();
  const gender       = (formData.get('gender')       as string)?.trim();
  const maritalStatus= (formData.get('maritalStatus')as string)?.trim();
  const status       = (formData.get('status')       as string)?.trim();
  const cellId       = (formData.get('cellId')       as string)?.trim();
  const address      = (formData.get('address')      as string)?.trim();

  if (!fullName || fullName.length < 3) return { error: 'O nome precisa ter pelo menos 3 letras.' };
  if (email && !isValidEmail(email))          return { error: 'Formato de e-mail inválido.' };
  if (phone && !isValidPhone(phone))          return { error: 'Formato de telefone inválido.' };
  if (birthDate && !isValidDate(birthDate))   return { error: 'Data de nascimento inválida.' };
  if (gender && !isValidGender(gender))       return { error: 'Gênero inválido.' };
  if (maritalStatus && !isValidMaritalStatus(maritalStatus)) return { error: 'Estado civil inválido.' };

  const resolvedStatus = status && isValidMemberStatus(status) ? status : 'Visitante';

  const supabase = await createClient();

  const { data: oldData } = await supabase
    .from('members')
    .select('*')
    .eq('id', memberId)
    .single();

  const { data: newMember, error } = await supabase
    .from('members')
    .update({
      full_name:      fullName,
      email:          email || null,
      phone:          phone || null,
      birth_date:     birthDate || null,
      gender:         gender || null,
      marital_status: maritalStatus || null,
      status:         resolvedStatus,
      cell_id:        cellId || null,
      address:        address || null,
      updated_at:     new Date().toISOString(),
    })
    .eq('id', memberId)
    .select()
    .single();

  if (error) {
    console.error('Erro ao atualizar membro:', error.message);
    return { error: 'Falha ao atualizar o banco de dados.' };
  }

  await supabase.from('audit_logs').insert({
    entity_name: 'members',
    entity_id:   memberId,
    action:      'UPDATE',
    actor_id:    user.id,
    actor_name:  user.fullName,
    actor_role:  user.roles[0],
    old_data:    oldData,
    new_data:    newMember,
  });

  revalidatePath(`/membros/${memberId}`);
  revalidatePath('/membros');
  return { success: true };
}