'use server'

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { getCurrentUser } from '@/features/core/api/get-current-user';
import { saveFinanceLog } from '@/features/finance/utils/finance-log-helper';
import { isValidUuid } from '@/lib/action-validators';

const VALID_TYPES = ['entrada', 'saida'] as const;
type ValidType = (typeof VALID_TYPES)[number];

function resolveRole(user: NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>) {
  if (user.isSysAdmin) return 'SYSADMIN';
  if (user.roles.includes('CHURCH_ADMIN')) return 'CHURCH_ADMIN';
  if (user.roles.includes('FINANCE_ADMIN')) return 'FINANCE_ADMIN';
  return 'MEMBER';
}

function hasFinanceAccess(user: Awaited<ReturnType<typeof getCurrentUser>>) {
  if (!user) return false;
  return user.isSysAdmin || user.roles.some(r =>
    ['FINANCE_ADMIN', 'CHURCH_ADMIN'].includes(r)
  );
}

export async function createRecurring(formData: FormData) {
  const user = await getCurrentUser();
  if (!hasFinanceAccess(user)) return { error: 'Acesso negado.' };

  const title = formData.get('title') as string;
  const category = formData.get('category') as string;
  const type = formData.get('type') as string;
  const amountRaw = formData.get('amount') as string;
  const dayRaw = formData.get('day_of_month') as string;

  if (!title?.trim()) return { error: 'Título obrigatório.' };
  if (!category?.trim()) return { error: 'Categoria obrigatória.' };
  if (!VALID_TYPES.includes(type as ValidType)) return { error: 'Tipo inválido.' };
  if (!amountRaw || !dayRaw) return { error: 'Preencha todos os campos.' };

  const amount = parseFloat(amountRaw.replace(',', '.'));
  const day = parseInt(dayRaw, 10);

  if (isNaN(amount) || amount <= 0) return { error: 'Valor inválido.' };
  if (isNaN(day) || day < 1 || day > 31) return { error: 'Dia inválido (1–31).' };

  const supabase = await createClient();

  const { data: newItem, error } = await supabase
    .from('financial_recurring')
    .insert({
      title: title.trim(),
      category: category.trim(),
      type,
      amount,
      day_of_month: day,
      active: true,
      created_by: user!.id,
    })
    .select()
    .single();

  if (error) {
    console.error('Erro ao criar recorrente:', error instanceof Error ? error.message : String(error));
    return { error: 'Falha ao salvar.' };
  }

  await saveFinanceLog({
    supabase,
    action: 'CREATE_RECURRING',
    actorId: user!.id,
    actorName: user!.fullName,
    actorRole: resolveRole(user!),
    entityName: 'financial_recurring',
    entityId: newItem.id,
    newData: newItem as Record<string, unknown>,
  });

  revalidatePath('/financeiro');
  return { success: true };
}

export async function toggleRecurring(id: string, active: boolean) {
  const user = await getCurrentUser();
  if (!hasFinanceAccess(user)) return { error: 'Acesso negado.' };

  if (!isValidUuid(id)) return { error: 'ID inválido.' };

  const supabase = await createClient();

  const { data: old } = await supabase
    .from('financial_recurring')
    .select('*')
    .eq('id', id)
    .single();

  const { error } = await supabase
    .from('financial_recurring')
    .update({ active })
    .eq('id', id);

  if (error) {
    console.error('Erro ao atualizar recorrente:', error instanceof Error ? error.message : String(error));
    return { error: 'Falha ao atualizar.' };
  }

  await saveFinanceLog({
    supabase,
    action: active ? 'ACTIVATE_RECURRING' : 'DEACTIVATE_RECURRING',
    actorId: user!.id,
    actorName: user!.fullName,
    actorRole: resolveRole(user!),
    entityName: 'financial_recurring',
    entityId: id,
    oldData: old as Record<string, unknown>,
    newData: { active } as Record<string, unknown>,
  });

  revalidatePath('/financeiro');
  return { success: true };
}

export async function deleteRecurring(id: string) {
  const user = await getCurrentUser();
  if (!user?.isSysAdmin) return { error: 'Apenas SysAdmin pode excluir recorrentes.' };

  if (!isValidUuid(id)) return { error: 'ID inválido.' };

  const supabase = await createClient();

  const { data: old } = await supabase
    .from('financial_recurring')
    .select('*')
    .eq('id', id)
    .single();

  const { error } = await supabase
    .from('financial_recurring')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Erro ao deletar recorrente:', error instanceof Error ? error.message : String(error));
    return { error: 'Falha ao excluir.' };
  }

  await saveFinanceLog({
    supabase,
    action: 'DELETE_RECURRING',
    actorId: user.id,
    actorName: user.fullName,
    actorRole: 'SYSADMIN',
    entityName: 'financial_recurring',
    entityId: id,
    oldData: old as Record<string, unknown>,
  });

  revalidatePath('/financeiro');
  return { success: true };
}