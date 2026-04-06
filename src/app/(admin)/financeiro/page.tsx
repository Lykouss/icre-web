import { getFeatureFlag } from '@/features/core/api/get-feature-flag';
import { getCurrentUser } from '@/features/core/api/get-current-user';
import { MaintenanceScreen } from '@/features/core/components/MaintenanceScreen';
import { FirstAccessTracker } from '@/features/core/components/FirstAccessTracker';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { NewTransactionModal } from '@/features/finance/components/NewTransactionModal';
import { SummaryCards } from '@/features/finance/components/SummaryCards';
import { FinancePageTabs } from '@/features/finance/components/FinancePageTabs';
import {
  FinancialTransaction,
  FinancialClosing,
  FinancialRecurring,
  FinanceLog,
  TransactionCategory,
  MonthSummary,
} from '@/features/finance/types';

export default async function FinanceiroPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const flag = await getFeatureFlag('module_finance', user);
  if (!flag.isActive || flag.status === 'manutencao') {
    return <MaintenanceScreen featureName="Financeiro" />;
  }

  const hasFinanceAccess = user.isSysAdmin || user.roles.some(r =>
    ['FINANCE_ADMIN', 'CHURCH_ADMIN'].includes(r)
  );
  if (!hasFinanceAccess) redirect('/dashboard');

  const supabase = await createClient();

  const [
    { data: transactionsData, error: txError },
    { data: categoriesData },
    { data: membersData },
    { data: closingsData },
    { data: recurringData },
    { data: logsData },
  ] = await Promise.all([
    supabase
      .from('financial_transactions')
      .select(`
        id, type, category, description, amount, status,
        member_id, date, created_by, created_at, receipt_url, tags, payment_id,
        members ( full_name ),
        profiles ( full_name )
      `)
      .order('date', { ascending: false })
      .order('created_at', { ascending: false }),
    supabase
      .from('transaction_categories')
      .select('id, name, type')
      .order('name'),
    supabase
      .from('members')
      .select('id, full_name')
      .order('full_name'),
    supabase
      .from('financial_closings')
      .select('id, month, year, closed_at, closed_by, balance_at_closing, profiles ( full_name )')
      .order('year', { ascending: false })
      .order('month', { ascending: false }),
    supabase
      .from('financial_recurring')
      .select('*')
      .order('created_at', { ascending: false }),
    supabase
      .from('finance_logs')
      .select('*')
      .order('created_at', { ascending: false }),
  ]);

  if (txError) {
    console.error('Erro ao buscar transações:', JSON.stringify(txError, null, 2));
  }

  const transactions = (transactionsData as unknown as FinancialTransaction[]) || [];
  const categories   = (categoriesData as TransactionCategory[]) || [];
  const members      = membersData || [];
  const closings     = (closingsData as unknown as FinancialClosing[]) || [];
  const recurring    = (recurringData as FinancialRecurring[]) || [];
  const logs         = (logsData as FinanceLog[]) || [];

  const totalIncome = transactions
    .filter(t => t.type === 'entrada')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const totalExpense = transactions
    .filter(t => t.type === 'saida')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const monthMap = new Map<string, MonthSummary>();

  for (const t of transactions) {
    const d = new Date(t.date);
    const month = d.getMonth() + 1;
    const year = d.getFullYear();
    const key = `${year}-${String(month).padStart(2, '0')}`;

    if (!monthMap.has(key)) {
      monthMap.set(key, { month, year, totalIncome: 0, totalExpense: 0, balance: 0, isClosed: false });
    }

    const entry = monthMap.get(key)!;
    if (t.type === 'entrada') entry.totalIncome += Number(t.amount);
    else entry.totalExpense += Number(t.amount);
    entry.balance = entry.totalIncome - entry.totalExpense;
  }

  for (const closing of closings) {
    const key = `${closing.year}-${String(closing.month).padStart(2, '0')}`;
    if (monthMap.has(key)) {
      const entry = monthMap.get(key)!;
      entry.isClosed = true;
      entry.closing = closing;
    }
  }

  const monthlySummaries = Array.from(monthMap.values()).sort((a, b) =>
    b.year !== a.year ? b.year - a.year : b.month - a.month
  );

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <FirstAccessTracker flagSlug="module_finance" userId={user?.id} />
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Financeiro</h1>
          <p className="text-slate-500 mt-1">Gestão de dízimos, ofertas e despesas da tesouraria.</p>
        </div>
        <NewTransactionModal categories={categories} members={members} />
      </div>

      <SummaryCards
        summary={{ totalIncome, totalExpense, balance: totalIncome - totalExpense }}
      />

      <FinancePageTabs
        transactions={transactions}
        monthlySummaries={monthlySummaries}
        recurring={recurring}
        logs={logs}
        categories={categories}
        isSysAdmin={user.isSysAdmin}
      />
    </div>
  );
}