'use client'

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { TransactionList } from '@/features/finance/components/TransactionList';
import { MonthlyClosingPanel } from '@/features/finance/components/MonthlyClosingPanel';
import { RecurringPanel } from '@/features/finance/components/RecurringPanel';
import { FinanceLogsPanel } from '@/features/finance/components/FinanceLogsPanel';
import {
  FinancialTransaction,
  FinancialRecurring,
  FinanceLog,
  MonthSummary,
  TransactionCategory,
} from '@/features/finance/types';

type Tab = 'lancamentos' | 'recorrentes' | 'fechamento' | 'logs';

interface FinancePageTabsProps {
  transactions: FinancialTransaction[];
  monthlySummaries: MonthSummary[];
  recurring: FinancialRecurring[];
  logs: FinanceLog[];
  categories: TransactionCategory[];
  isSysAdmin: boolean;
}

export function FinancePageTabs({
  transactions,
  monthlySummaries,
  recurring,
  logs,
  categories,
  isSysAdmin,
}: FinancePageTabsProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>('lancamentos');

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel('realtime_finance_all')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'financial_transactions' }, () => router.refresh())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'financial_closings' }, () => router.refresh())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'financial_recurring' }, () => router.refresh())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'finance_logs' }, () => router.refresh())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [router]);

  const tabs: { id: Tab; label: string }[] = [
    { id: 'lancamentos',  label: 'Lançamentos' },
    { id: 'recorrentes',  label: 'Recorrentes' },
    { id: 'fechamento',   label: 'Fechamento de Caixa' },
    { id: 'logs',         label: 'Logs' },
  ];

  return (
    <div>
      <div className="flex gap-1 border-b border-slate-200 mb-6 overflow-x-auto">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-5 py-2.5 text-sm font-semibold rounded-t-lg transition-colors border-b-2 -mb-px whitespace-nowrap ${
              activeTab === tab.id
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'lancamentos' && (
        <TransactionList transactions={transactions} isSysAdmin={isSysAdmin} />
      )}
      {activeTab === 'recorrentes' && (
        <RecurringPanel items={recurring} categories={categories} />
      )}
      {activeTab === 'fechamento' && (
        <MonthlyClosingPanel summaries={monthlySummaries} transactions={transactions} />
      )}
      {activeTab === 'logs' && (
        <FinanceLogsPanel logs={logs} />
      )}
    </div>
  );
}