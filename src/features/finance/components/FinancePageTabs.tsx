'use client'

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { TransactionList } from '@/features/finance/components/TransactionList';
import { MonthlyClosingPanel } from '@/features/finance/components/MonthlyClosingPanel';
import { RecurringPanel } from '@/features/finance/components/RecurringPanel';
import { FinanceLogsPanel } from '@/features/finance/components/FinanceLogsPanel';
import {
  FinancialTransaction, FinancialRecurring, FinanceLog,
  MonthSummary, TransactionCategory,
} from '@/features/finance/types';

type Tab = 'lancamentos' | 'recorrentes' | 'fechamento' | 'logs';

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  {
    id: 'lancamentos', label: 'Lançamentos',
    icon: <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>,
  },
  {
    id: 'recorrentes', label: 'Recorrentes',
    icon: <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>,
  },
  {
    id: 'fechamento', label: 'Fechamento',
    icon: <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>,
  },
  {
    id: 'logs', label: 'Logs',
    icon: <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>,
  },
];

interface Props {
  transactions: FinancialTransaction[];
  monthlySummaries: MonthSummary[];
  recurring: FinancialRecurring[];
  logs: FinanceLog[];
  categories: TransactionCategory[];
  isSysAdmin: boolean;
}

export function FinancePageTabs({ transactions, monthlySummaries, recurring, logs, categories, isSysAdmin }: Props) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>('lancamentos');

  useEffect(() => {
    const supabase = createClient();
    const ch = supabase
      .channel('realtime_finance_all')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'financial_transactions' }, () => router.refresh())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'financial_closings' }, () => router.refresh())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'financial_recurring' }, () => router.refresh())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'finance_logs' }, () => router.refresh())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [router]);

  return (
    <div>
      {/* Tab bar */}
      <div
        className="flex items-center gap-1 p-1 rounded-xl w-fit mb-6"
        style={{ background: 'var(--admin-surface)', border: '1px solid var(--admin-border)' }}
      >
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-medium transition-all duration-150 whitespace-nowrap"
            style={activeTab === tab.id
              ? { background: 'var(--admin-accent)', color: '#fff', boxShadow: '0 1px 4px rgba(37,99,235,0.4)' }
              : { color: 'var(--admin-text-secondary)' }
            }
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'lancamentos'  && <TransactionList transactions={transactions} isSysAdmin={isSysAdmin} />}
      {activeTab === 'recorrentes'  && <RecurringPanel items={recurring} categories={categories} />}
      {activeTab === 'fechamento'   && <MonthlyClosingPanel summaries={monthlySummaries} transactions={transactions} />}
      {activeTab === 'logs'         && <FinanceLogsPanel logs={logs} />}
    </div>
  );
}