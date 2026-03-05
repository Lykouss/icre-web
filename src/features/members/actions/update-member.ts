'use server'

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { getCurrentUser } from '@/features/core/api/get-current-user';

export async function updateMemberGeneral(memberId: string, formData: FormData) {
  const user = await getCurrentUser();
  if (!user) return { error: 'Não autorizado' };

  // Pegamos todos os campos do formulário
  const fullName = formData.get('fullName') as string;
  const email = formData.get('email') as string;
  const phone = formData.get('phone') as string;
  const birthDate = formData.get('birthDate') as string;
  const gender = formData.get('gender') as string;
  const maritalStatus = formData.get('maritalStatus') as string;
  const status = formData.get('status') as string;
  const cellId = formData.get('cellId') as string;

  if (!fullName || fullName.trim().length < 3) {
    return { error: 'O nome precisa ter pelo menos 3 letras.' };
  }

  const supabase = await createClient();

  // 1. Busca a ficha ANTIGA antes de alterar (Crucial para o Log de Auditoria)
  const { data: oldData } = await supabase
    .from('members')
    .select('*')
    .eq('id', memberId)
    .single();

  // 2. Prepara a ficha NOVA
  const updatePayload = {
    full_name: fullName,
    email: email || null,
    phone: phone || null,
    birth_date: birthDate || null,
    gender: gender || null,
    marital_status: maritalStatus || null,
    status: status || 'Visitante',
    cell_id: cellId || null,
    updated_at: new Date().toISOString(),
  };

  // 3. Salva no banco de dados
  const { data: newMember, error } = await supabase
    .from('members')
    .update(updatePayload)
    .eq('id', memberId)
    .select()
    .single();

  if (error) {
    console.error('Erro ao atualizar membro:', error);
    return { error: 'Falha ao atualizar o banco de dados.' };
  }

  // 4. Salva o Rastro (Audit Trail) com E-mail e Cargo
  await supabase.from('audit_logs').insert({
    entity_name: 'members',
    entity_id: memberId,
    action: 'UPDATE',
    actor_id: user.id,
    actor_name: user.fullName,
    actor_email: (user as { email?: string | null }).email || 'Sem e-mail',// Captura o e-mail
    actor_role: user.isSysAdmin ? 'SysAdmin' : (user.isAdmin ? 'Administrador' : 'Utilizador'), // Captura o cargo
    old_data: oldData,
    new_data: newMember 
  });

  // 5. Atualiza a página do perfil e a lista de membros instantaneamente no servidor
  revalidatePath(`/membros/${memberId}`);
  revalidatePath('/membros');
  
  return { success: true };
}