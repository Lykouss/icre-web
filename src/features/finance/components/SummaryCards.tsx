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
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
        <p className="text-sm font-medium text-slate-500">Total de Entradas</p>
        <p className="text-2xl font-bold text-emerald-600 mt-1">{formatCurrency(totalIncome)}</p>
      </div>
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
        <p className="text-sm font-medium text-slate-500">Total de Saídas</p>
        <p className="text-2xl font-bold text-red-600 mt-1">{formatCurrency(totalExpense)}</p>
      </div>
      <div className={`rounded-2xl border p-5 shadow-sm ${
        balance >= 0
          ? 'bg-blue-50 border-blue-200'
          : 'bg-red-50 border-red-200'
      }`}>
        <p className="text-sm font-medium text-slate-500">Saldo do Período</p>
        <p className={`text-2xl font-bold mt-1 ${balance >= 0 ? 'text-blue-700' : 'text-red-700'}`}>
          {formatCurrency(balance)}
        </p>
      </div>
    </div>
  );
}