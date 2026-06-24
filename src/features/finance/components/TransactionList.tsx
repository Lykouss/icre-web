'use client'

import React, { useState, useTransition } from 'react';
import { FinancialTransaction } from '@/features/finance/types';
import { deleteTransaction } from '@/features/finance/actions/create-transaction';
import { useToast } from '@/features/core/components/ToastContext';
import { AdminEmptyState } from '@/features/core/components/AdminEmptyState';
import { AdminBadge } from '@/features/core/components/AdminUI';

const MONTH_NAMES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

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

const inputStyle = { background: 'var(--admin-surface-alt)', border: '1px solid var(--admin-border)' } as const;

interface TransactionListProps { transactions: FinancialTransaction[]; isSysAdmin: boolean }

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
    const matchesSearch = !term || t.category.toLowerCase().includes(term) || t.members?.full_name.toLowerCase().includes(term) || t.description?.toLowerCase().includes(term);
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
      const loadingId = toast('loading', 'Excluindo lançamento…');
      const result = await deleteTransaction(id);
      dismiss(loadingId);
      setDeletingId(null);
      if (result.error) toast('error', result.error);
      else toast('success', 'Lançamento excluído.');
    });
  }

  function exportCSV() {
    const headers = ['Data', 'Tipo', 'Categoria', 'Descrição', 'Membro', 'Lançado por', 'Valor'];
    const rows = filtered.map(t => [
      formatDate(t.date),
      t.type === 'entrada' ? 'Entrada' : 'Saída',
      t.category,
      t.description ?? '',
      t.members?.full_name ?? '',
      t.profiles?.full_name ?? '',
      Number(t.amount).toFixed(2).replace('.', ','),
    ]);
    const csv = [headers, ...rows].map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(';')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `lancamentos${selectedMonth !== 'ALL' ? `-${selectedMonth}` : ''}.csv`; a.click();
    URL.revokeObjectURL(url);
    toast('success', 'CSV exportado!');
  }

  const TYPE_FILTERS: { id: 'ALL' | 'entrada' | 'saida'; label: string }[] = [
    { id: 'ALL',    label: 'Todos'    },
    { id: 'entrada',label: 'Entradas' },
    { id: 'saida',  label: 'Saídas'   },
  ];

  return (
    <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid var(--admin-border)', background: 'var(--admin-surface)' }}>
      {/* Toolbar */}
      <div className="p-4 space-y-3" style={{ borderBottom: '1px solid var(--admin-border)' }}>
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-600 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Buscar por categoria, membro ou descrição…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full h-9 pl-9 pr-4 rounded-xl text-sm text-slate-200 placeholder-slate-600 outline-none transition-all"
              style={inputStyle}
              onFocus={e => { e.target.style.borderColor = 'rgba(37,99,235,0.5)'; e.target.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.1)'; }}
              onBlur={e => { e.target.style.borderColor = 'var(--admin-border)'; e.target.style.boxShadow = 'none'; }}
            />
          </div>
          {/* Export */}
          <button
            onClick={exportCSV}
            className="inline-flex items-center gap-2 h-9 px-4 rounded-xl text-[13px] font-semibold transition-all duration-150 shrink-0"
            style={{ background: 'var(--admin-surface-alt)', border: '1px solid var(--admin-border)', color: 'var(--admin-text-primary)' }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Exportar CSV
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Type filters */}
          {TYPE_FILTERS.map(f => (
            <button
              key={f.id}
              onClick={() => setTypeFilter(f.id)}
              className="h-8 px-3 rounded-xl text-[12px] font-semibold transition-all duration-150"
              style={typeFilter === f.id
                ? { background: 'var(--admin-accent)', color: '#fff' }
                : { background: 'var(--admin-surface-alt)', color: 'var(--admin-text-secondary)', border: '1px solid var(--admin-border)' }
              }
            >
              {f.label}
            </button>
          ))}
          {/* Month select */}
          <select
            value={selectedMonth}
            onChange={e => setSelectedMonth(e.target.value)}
            className="h-8 px-3 rounded-xl text-[12px] text-slate-300 outline-none cursor-pointer ml-auto transition-all"
            style={inputStyle}
          >
            <option value="ALL">Todos os períodos</option>
            {monthOptions.map(key => (
              <option key={key} value={key} style={{ background: '#111d35' }}>{formatMonthOption(key)}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Count */}
      <div className="px-5 py-2.5" style={{ borderBottom: '1px solid var(--admin-border)', background: 'var(--admin-surface-alt)' }}>
        <p className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: 'var(--admin-text-secondary)' }}>
          {filtered.length} lançamento{filtered.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Table / empty */}
      {filtered.length === 0 ? (
        <AdminEmptyState
          icon="search"
          title="Nenhum lançamento encontrado"
          description="Tente ajustar os filtros ou o período selecionado."
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--admin-border)', background: 'var(--admin-surface-alt)' }}>
                {['Data', 'Categoria', 'Descrição / Membro', 'Lançado por', 'Valor', ...(isSysAdmin ? [''] : [])].map(h => (
                  <th key={h} className={`px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-left ${h === 'Valor' ? 'text-right' : ''}`}
                    style={{ color: 'var(--admin-text-muted)' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((t, idx) => (
                <tr
                  key={t.id}
                  style={{ borderBottom: idx < filtered.length - 1 ? '1px solid var(--admin-border)' : 'none' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--admin-surface-hover)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  className="transition-colors duration-100"
                >
                  <td className="px-5 py-3.5 whitespace-nowrap text-[12px]" style={{ color: 'var(--admin-text-secondary)' }}>
                    {formatDate(t.date)}
                  </td>
                  <td className="px-5 py-3.5">
                    <AdminBadge color={t.type === 'entrada' ? 'emerald' : 'red'} dot>
                      {t.category}
                    </AdminBadge>
                  </td>
                  <td className="px-5 py-3.5 max-w-[200px]">
                    <p className="text-slate-300 text-[13px] truncate">{t.description || '—'}</p>
                    {t.members && (
                      <p className="text-[11px] mt-0.5" style={{ color: 'var(--admin-text-secondary)' }}>{t.members.full_name}</p>
                    )}
                  </td>
                  <td className="px-5 py-3.5 whitespace-nowrap text-[12px]" style={{ color: 'var(--admin-text-secondary)' }}>
                    {t.profiles?.full_name ?? <span style={{ color: 'var(--admin-text-muted)' }}>—</span>}
                  </td>
                  <td className={`px-5 py-3.5 text-right font-bold whitespace-nowrap text-[13px] ${t.type === 'entrada' ? 'text-emerald-400' : 'text-red-400'}`}>
                    {t.type === 'entrada' ? '+' : '-'} {formatCurrency(t.amount)}
                  </td>
                  {isSysAdmin && (
                    <td className="px-5 py-3.5 text-center">
                      <button
                        onClick={() => handleDelete(t.id)}
                        disabled={isPending && deletingId === t.id}
                        className="p-1.5 rounded-lg transition-all duration-150 disabled:opacity-40"
                        style={{ color: 'var(--admin-text-muted)' }}
                        title="Excluir"
                        onMouseEnter={e => { e.currentTarget.style.color = '#f87171'; e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; }}
                        onMouseLeave={e => { e.currentTarget.style.color = 'var(--admin-text-muted)'; e.currentTarget.style.background = 'transparent'; }}
                      >
                        {isPending && deletingId === t.id ? (
                          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                          </svg>
                        ) : (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
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