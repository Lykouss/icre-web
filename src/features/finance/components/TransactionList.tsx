'use client'

import React, { useState, useTransition } from 'react';
import { FinancialTransaction } from '@/features/finance/types';
import { deleteTransaction } from '@/features/finance/actions/create-transaction';
import { useToast } from '@/features/core/components/ToastContext';

const MONTH_NAMES = [
  'Janeiro','Fevereiro','Março','Abril','Maio','Junho',
  'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro',
];

interface TransactionListProps {
  transactions: FinancialTransaction[];
  isSysAdmin: boolean;
}

export function TransactionList({ transactions, isSysAdmin }: TransactionListProps) {
  const { toast, dismiss } = useToast();
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'entrada' | 'saida'>('ALL');
  const [search, setSearch] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('ALL');
  const [isPending, startTransition] = useTransition();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const monthOptions = Array.from(
    new Set(transactions.map(t => {
      const d = new Date(t.date);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    }))
  ).sort((a, b) => b.localeCompare(a));

  const filtered = transactions.filter(t => {
    const matchesType = typeFilter === 'ALL' || t.type === typeFilter;
    const term = search.toLowerCase();
    const matchesSearch =
      !term ||
      t.category.toLowerCase().includes(term) ||
      t.members?.full_name.toLowerCase().includes(term) ||
      t.description?.toLowerCase().includes(term);

    let matchesPeriod = true;
    if (selectedMonth !== 'ALL') {
      const d = new Date(t.date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      matchesPeriod = key === selectedMonth;
    }

    return matchesType && matchesSearch && matchesPeriod;
  });

  function handleDelete(id: string) {
    if (!confirm('Tem certeza? Esta ação não pode ser desfeita.')) return;
    setDeletingId(id);

    startTransition(async () => {
      const loadingId = toast('loading', 'Excluindo lançamento...');
      const result = await deleteTransaction(id);
      dismiss(loadingId);
      setDeletingId(null);

      if (result.error) {
        toast('error', result.error);
        return;
      }
      toast('success', 'Lançamento excluído.');
    });
  }

  function exportCSV() {
    const headers = ['Data', 'Tipo', 'Categoria', 'Descrição', 'Membro', 'Lançado por', 'Valor'];
    const rows = filtered.map(t => [
      new Date(t.date).toLocaleDateString('pt-BR'),
      t.type === 'entrada' ? 'Entrada' : 'Saída',
      t.category,
      t.description ?? '',
      t.members?.full_name ?? '',
      t.profiles?.full_name ?? '',
      Number(t.amount).toFixed(2).replace('.', ','),
    ]);

    const csv = [headers, ...rows]
      .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(';'))
      .join('\n');

    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `lancamentos${selectedMonth !== 'ALL' ? `-${selectedMonth}` : ''}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast('success', 'CSV exportado com sucesso!');
  }

  function formatCurrency(value: number) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('pt-BR');
  }

  function formatMonthOption(key: string) {
    const [year, month] = key.split('-');
    return `${MONTH_NAMES[parseInt(month) - 1]} / ${year}`;
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 shadow-sm">
      <div className="p-4 border-b border-slate-100 flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            placeholder="Pesquisar por categoria, membro ou descrição..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button onClick={exportCSV}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 transition-colors whitespace-nowrap">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Exportar CSV
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          {(['ALL', 'entrada', 'saida'] as const).map(f => (
            <button key={f} onClick={() => setTypeFilter(f)}
              className={`px-4 py-1.5 rounded-xl text-sm font-semibold transition-colors ${
                typeFilter === f ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}>
              {f === 'ALL' ? 'Todos' : f === 'entrada' ? 'Entradas' : 'Saídas'}
            </button>
          ))}
          <select value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)}
            className="ml-auto px-4 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="ALL">Todos os períodos</option>
            {monthOptions.map(key => (
              <option key={key} value={key}>{formatMonthOption(key)}</option>
            ))}
          </select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <p className="font-medium">Nenhum lançamento encontrado.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-slate-500">
                <th className="px-5 py-3 font-medium">Data</th>
                <th className="px-5 py-3 font-medium">Categoria</th>
                <th className="px-5 py-3 font-medium">Descrição / Membro</th>
                <th className="px-5 py-3 font-medium">Lançado por</th>
                <th className="px-5 py-3 font-medium text-right">Valor</th>
                {isSysAdmin && <th className="px-5 py-3 w-10"></th>}
              </tr>
            </thead>
            <tbody>
              {filtered.map(t => (
                <tr key={t.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors last:border-0">
                  <td className="px-5 py-3.5 text-slate-500 whitespace-nowrap">{formatDate(t.date)}</td>
                  <td className="px-5 py-3.5">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold ${
                      t.type === 'entrada' ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300' : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'
                    }`}>
                      {t.type === 'entrada' ? '↑' : '↓'} {t.category}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <p className="text-slate-700">{t.description || '—'}</p>
                    {t.members && <p className="text-xs text-slate-400 mt-0.5">{t.members.full_name}</p>}
                  </td>
                  <td className="px-5 py-3.5 text-slate-500 text-xs whitespace-nowrap">
                    {t.profiles?.full_name ?? (
                      <span className="text-slate-300">—</span>
                    )}
                  </td>
                  <td className={`px-5 py-3.5 text-right font-semibold whitespace-nowrap ${
                    t.type === 'entrada' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
                  }`}>
                    {t.type === 'entrada' ? '+' : '-'} {formatCurrency(t.amount)}
                  </td>
                  {isSysAdmin && (
                    <td className="px-5 py-3.5">
                      <button
                        onClick={() => handleDelete(t.id)}
                        disabled={isPending && deletingId === t.id}
                        className="text-slate-300 hover:text-red-500 transition-colors disabled:opacity-50"
                        title="Excluir lançamento"
                      >
                        {isPending && deletingId === t.id ? (
                          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                          </svg>
                        ) : (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        )}
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}