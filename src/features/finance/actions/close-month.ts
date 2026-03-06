'use server'

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { getCurrentUser } from '@/features/core/api/get-current-user';
import { saveFinanceLog } from '@/features/finance/utils/finance-log-helper';

function resolveRole(user: NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>) {
  if (user.isSysAdmin) return 'SYSADMIN';
  if (user.roles.includes('CHURCH_ADMIN')) return 'CHURCH_ADMIN';
  if (user.roles.includes('FINANCE_ADMIN')) return 'FINANCE_ADMIN';
  return 'MEMBER';
}

export async function closeMonth(month: number, year: number) {
  const user = await getCurrentUser();
  if (!user) return { error: 'Não autorizado.' };

  const hasAccess = user.isSysAdmin || user.roles.some(r =>
    ['FINANCE_ADMIN', 'CHURCH_ADMIN'].includes(r)
  );
  if (!hasAccess) return { error: 'Acesso negado.' };

  if (!Number.isInteger(month) || month < 1 || month > 12) return { error: 'Mês inválido.' };
  if (!Number.isInteger(year) || year < 2000 || year > 2100) return { error: 'Ano inválido.' };

  const supabase = await createClient();

  const { data: existing } = await supabase
    .from('financial_closings')
    .select('id')
    .eq('month', month)
    .eq('year', year)
    .single();

  if (existing) return { error: 'Este mês já foi fechado.' };

  const startDate = new Date(year, month - 1, 1).toISOString();
  const endDate = new Date(year, month, 1).toISOString();

  const { data: transactions, error: txError } = await supabase
    .from('financial_transactions')
    .select('type, amount')
    .gte('date', startDate)
    .lt('date', endDate);

  if (txError) {
    console.error('Erro ao buscar transações:', JSON.stringify(txError, null, 2));
    return { error: 'Falha ao calcular o saldo.' };
  }

  const totalIncome = (transactions ?? [])
    .filter(t => t.type === 'entrada')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const totalExpense = (transactions ?? [])
    .filter(t => t.type === 'saida')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const balance = totalIncome - totalExpense;

  const closingPayload = {
    month,
    year,
    balance_at_closing: balance,
    closed_by: user.id,
    closed_at: new Date().toISOString(),
  };

  const { data: newClosing, error } = await supabase
    .from('financial_closings')
    .insert(closingPayload)
    .select()
    .single();

  if (error) {
    console.error('Erro ao fechar caixa:', JSON.stringify(error, null, 2));
    return { error: 'Falha ao registrar o fechamento.' };
  }

  await saveFinanceLog({
    supabase,
    action: 'CLOSE_MONTH',
    actorId: user.id,
    actorName: user.fullName,
    actorRole: resolveRole(user),
    entityName: 'financial_closings',
    entityId: newClosing.id,
    newData: { month, year, balance, total_income: totalIncome, total_expense: totalExpense },
  });

  revalidatePath('/financeiro');
  return { success: true, balance };
}