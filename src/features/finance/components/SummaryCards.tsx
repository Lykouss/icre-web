import React from 'react';
import { TransactionSummary } from '@/features/finance/types';
import { AdminStatCard } from '@/features/core/components/AdminCard';

interface SummaryCardsProps { summary: TransactionSummary }

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

const ArrowUpIcon = (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M7 11l5-5m0 0l5 5m-5-5v12" />
  </svg>
);

const ArrowDownIcon = (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M17 13l-5 5m0 0l-5-5m5 5V6" />
  </svg>
);

const ScaleIcon = (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
  </svg>
);

export function SummaryCards({ summary }: SummaryCardsProps) {
  const { totalIncome, totalExpense, balance } = summary;
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <AdminStatCard
        label="Total de Entradas"
        value={formatCurrency(totalIncome)}
        icon={ArrowUpIcon}
        accentColor="#10b981"
      />
      <AdminStatCard
        label="Total de Saídas"
        value={formatCurrency(totalExpense)}
        icon={ArrowDownIcon}
        accentColor="#ef4444"
      />
      <AdminStatCard
        label="Saldo do Período"
        value={formatCurrency(balance)}
        icon={ScaleIcon}
        accentColor={balance >= 0 ? '#3b82f6' : '#ef4444'}
      />
    </div>
  );
}