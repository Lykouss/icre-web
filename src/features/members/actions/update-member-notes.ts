'use server'

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { getCurrentUser } from '@/features/core/api/get-current-user';
import { canManageConfidentialNotes } from '@/lib/rbac'; // <-- Importamos o nosso cérebro!

export async function updateMemberNotes(memberId: string, notes: string) {
  const user = await getCurrentUser();
  if (!user) return { error: 'Não autorizado.' };

  const supabase = await createClient();

  // 1. O Leão de Chácara Inteligente: Descobre o cargo real no banco
  const { data: roleData } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .single();

  const currentUserRole = roleData?.role || (user.isSysAdmin ? 'SYSADMIN' : 'MEMBER');

  // 2. Pergunta ao cérebro de segurança se este cargo pode salvar notas
  if (!canManageConfidentialNotes(currentUserRole)) {
    return { error: 'Acesso negado. Apenas a alta liderança pode alterar anotações confidenciais.' };
  }

  // 3. Busca a ficha ANTIGA para o Log
  const { data: oldData } = await supabase
    .from('members')
    .select('*')
    .eq('id', memberId)
    .single();

  // 4. Atualiza apenas as anotações no banco
  const { data: newMember, error } = await supabase
    .from('members')
    .update({ 
      notes: notes || null, 
      updated_at: new Date().toISOString() 
    })
    .eq('id', memberId)
    .select()
    .single();

  if (error) {
    console.error('Erro ao atualizar anotações:', error);
    return { error: 'Falha ao guardar as anotações.' };
  }

  // 5. Salva a "Fofoca" no Audit Trail (Agora salvando o cargo correto!)
  await supabase.from('audit_logs').insert({
    entity_name: 'members',
    entity_id: memberId,
    action: 'UPDATE_NOTES',
    actor_id: user.id,
    actor_name: user.fullName,
    actor_email: (user as { email?: string | null }).email || 'Sem e-mail',
    actor_role: currentUserRole, // <-- Salva se foi o CHURCH_ADMIN ou SYSADMIN
    old_data: oldData,
    new_data: newMember 
  });

  // 6. Atualiza os dados no servidor
  revalidatePath(`/membros/${memberId}`);
  revalidatePath('/membros');
  
  return { success: true };
}