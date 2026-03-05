'use server'

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { getCurrentUser } from '@/features/core/api/get-current-user';

export async function createMember(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) return { error: 'Não autorizado' };

  const fullName = formData.get('fullName') as string;
  const phone = formData.get('phone') as string;
  const status = formData.get('status') as string;
  const cellId = formData.get('cellId') as string; // Pode ser vazio

  if (!fullName || fullName.trim().length < 3) {
    return { error: 'O nome precisa ter pelo menos 3 letras.' };
  }

  const supabase = await createClient();

  // 1. Salva o novo membro no banco
  const { data: newMember, error } = await supabase
    .from('members')
    .insert({
      full_name: fullName,
      phone: phone || null,
      status: status || 'Visitante',
      cell_id: cellId || null,
    })
    .select()
    .single();

  if (error) {
    console.error('Erro ao criar membro:', error);
    return { error: 'Falha ao salvar no banco de dados.' };
  }

  // 2. O Audit Trail (O Log)! Vamos registrar quem fez isso.
  await supabase.from('audit_logs').insert({
    entity_name: 'members',
    entity_id: newMember.id,
    action: 'CREATE',
    actor_id: user.id,
    actor_name: user.fullName,
    old_data: null, // Como é criação, não existia dado antigo
    new_data: newMember // Salvamos a ficha completa de como ficou
  });

  // 3. Atualiza a tela de membros em tempo real
  revalidatePath('/membros');
  
  return { success: true };
}