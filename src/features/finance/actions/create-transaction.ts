'use server'

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { getCurrentUser } from '@/features/core/api/get-current-user';
import { saveFinanceLog } from '@/features/finance/utils/finance-log-helper';

function hasFinanceAccess(user: Awaited<ReturnType<typeof getCurrentUser>>) {
  if (!user) return false;
  return user.isSysAdmin || user.roles.some(r =>
    ['FINANCE_ADMIN', 'CHURCH_ADMIN'].includes(r)
  );
}

function resolveRole(user: NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>) {
  if (user.isSysAdmin) return 'SYSADMIN';
  if (user.roles.includes('CHURCH_ADMIN')) return 'CHURCH_ADMIN';
  if (user.roles.includes('FINANCE_ADMIN')) return 'FINANCE_ADMIN';
  return 'MEMBER';
}

export async function createTransaction(formData: FormData) {
  const user = await getCurrentUser();
  if (!hasFinanceAccess(user)) return { error: 'Acesso negado.' };

  const type = formData.get('type') as string;
  const category = formData.get('category') as string;
  const amountRaw = formData.get('amount') as string;
  const description = formData.get('description') as string;
  const memberId = formData.get('memberId') as string;
  const date = formData.get('date') as string;

  if (!type || !category || !amountRaw || !date) {
    return { error: 'Preencha todos os campos obrigatórios.' };
  }

  const amount = parseFloat(amountRaw.replace(',', '.'));
  if (isNaN(amount) || amount <= 0) return { error: 'Valor inválido.' };

  const parsedDate = new Date(date);
  const month = parsedDate.getMonth() + 1;
  const year = parsedDate.getFullYear();

  const supabase = await createClient();

  const { data: closing } = await supabase
    .from('financial_closings')
    .select('id')
    .eq('month', month)
    .eq('year', year)
    .single();

  if (closing) {
    return { error: `O caixa de ${String(month).padStart(2, '0')}/${year} já está fechado.` };
  }

  const payload = {
    type,
    category,
    description: description || null,
    amount,
    member_id: memberId || null,
    date: parsedDate.toISOString(),
    created_by: user!.id,
    status: 'pago',
  };

  const { data: newTx, error } = await supabase
    .from('financial_transactions')
    .insert(payload)
    .select()
    .single();

  if (error) {
    console.error('Erro ao criar transação:', JSON.stringify(error, null, 2));
    return { error: 'Falha ao salvar no banco de dados.' };
  }

  await saveFinanceLog({
    supabase,
    action: 'CREATE_TRANSACTION',
    actorId: user!.id,
    actorName: user!.fullName,
    actorRole: resolveRole(user!),
    entityName: 'financial_transactions',
    entityId: newTx.id,
    newData: newTx as Record<string, unknown>,
  });

  revalidatePath('/financeiro');
  return { success: true };
}

export async function deleteTransaction(id: string) {
  const user = await getCurrentUser();
  if (!user?.isSysAdmin) return { error: 'Apenas SysAdmin pode excluir lançamentos.' };

  const supabase = await createClient();

  const { data: oldTx } = await supabase
    .from('financial_transactions')
    .select('*')
    .eq('id', id)
    .single();

  const { error } = await supabase
    .from('financial_transactions')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Erro ao deletar transação:', JSON.stringify(error, null, 2));
    return { error: 'Falha ao excluir.' };
  }

  await saveFinanceLog({
    supabase,
    action: 'DELETE_TRANSACTION',
    actorId: user.id,
    actorName: user.fullName,
    actorRole: 'SYSADMIN',
    entityName: 'financial_transactions',
    entityId: id,
    oldData: oldTx as Record<string, unknown>,
  });

  revalidatePath('/financeiro');
  return { success: true };
}