import React from 'react';
import { TransactionSummary } from '@/features/finance/types';

interface SummaryCardsProps {
  summary: TransactionSummary;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

export function SummaryCards({ summary }: SummaryCardsProps) {
  const { totalIncome, totalExpense, balance } = summary;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 p-5 shadow-sm">
        <p className="text-sm font-medium text-slate-500">Total de Entradas</p>
        <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">{formatCurrency(totalIncome)}</p>
      </div>
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 p-5 shadow-sm">
        <p className="text-sm font-medium text-slate-500">Total de Saídas</p>
        <p className="text-2xl font-bold text-red-600 dark:text-red-400 mt-1">{formatCurrency(totalExpense)}</p>
      </div>
      <div className={`rounded-2xl border p-5 shadow-sm ${
        balance >= 0
          ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-900/40'
          : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-900/30'
      }`}>
        <p className="text-sm font-medium text-slate-500">Saldo do Período</p>
        <p className={`text-2xl font-bold mt-1 ${balance >= 0 ? 'text-blue-700 dark:text-blue-300' : 'text-red-700 dark:text-red-300'}`}>
          {formatCurrency(balance)}
        </p>
      </div>
    </div>
  );
}