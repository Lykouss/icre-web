'use client'

import React, { useState } from 'react';
import { FinanceLog } from '@/features/finance/types';

const ACTION_LABELS: Record<string, { label: string; color: string }> = {
  CREATE_TRANSACTION: { label: 'Novo Lançamento', color: 'bg-emerald-50 text-emerald-700' },
  DELETE_TRANSACTION: { label: 'Exclusão', color: 'bg-red-50 text-red-700' },
  CLOSE_MONTH: { label: 'Fechamento de Caixa', color: 'bg-blue-50 text-blue-700' },
};

interface FinanceLogsPanelProps {
  logs: FinanceLog[];
}

export function FinanceLogsPanel({ logs }: FinanceLogsPanelProps) {
  const [search, setSearch] = useState('');
  const [filterAction, setFilterAction] = useState('ALL');
  const [limit, setLimit] = useState(10);

  const filtered = logs.filter(log => {
    const matchesAction = filterAction === 'ALL' || log.action === filterAction;
    const term = search.toLowerCase();
    const matchesSearch =
      !term ||
      log.actor_name.toLowerCase().includes(term) ||
      log.action.toLowerCase().includes(term) ||
      log.actor_role.toLowerCase().includes(term);
    return matchesAction && matchesSearch;
  });

  const displayed = filtered.slice(0, limit);

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleString('pt-BR');
  }

  function describeLog(log: FinanceLog): string {
    const data = log.new_data ?? log.old_data;
    if (!data) return '—';

    if (log.action === 'CREATE_TRANSACTION') {
      const amount = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
        .format(Number(data.amount));
      return `${data.type === 'entrada' ? 'Entrada' : 'Saída'} — ${data.category} — ${amount}`;
    }

    if (log.action === 'DELETE_TRANSACTION') {
      const amount = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
        .format(Number(data.amount));
      return `Excluído: ${data.category} — ${amount}`;
    }

    if (log.action === 'CLOSE_MONTH') {
      const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
      const monthName = MONTHS[(Number(data.month) - 1)] ?? data.month;
      const balance = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
        .format(Number(data.balance));
      return `${monthName}/${data.year} — Saldo: ${balance}`;
    }

    return '—';
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
      <div className="p-5 border-b border-slate-100">
        <h2 className="text-lg font-bold text-slate-800">Audit Trail</h2>
        <p className="text-sm text-slate-500 mt-0.5">
          Rastreio completo de todas as ações realizadas no módulo financeiro.
        </p>
      </div>

      {/* Filtros */}
      <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          placeholder="Pesquisar por nome ou ação..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <select
          value={filterAction}
          onChange={e => setFilterAction(e.target.value)}
          className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="ALL">Todas as ações</option>
          <option value="CREATE_TRANSACTION">Novo Lançamento</option>
          <option value="DELETE_TRANSACTION">Exclusão</option>
          <option value="CLOSE_MONTH">Fechamento de Caixa</option>
        </select>
      </div>

      {displayed.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <p className="font-medium">Nenhum log encontrado.</p>
        </div>
      ) : (
        <>
          <div className="divide-y divide-slate-50">
            {displayed.map(log => {
              const actionMeta = ACTION_LABELS[log.action] ?? {
                label: log.action,
                color: 'bg-slate-100 text-slate-600',
              };

              return (
                <div key={log.id} className="px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-semibold ${actionMeta.color}`}>
                        {actionMeta.label}
                      </span>
                      <span className="text-xs text-slate-400 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-md">
                        {log.actor_role}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-slate-700">{log.actor_name}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{describeLog(log)}</p>
                  </div>
                  <div className="text-xs text-slate-400 whitespace-nowrap shrink-0">
                    {formatDate(log.created_at)}
                  </div>
                </div>
              );
            })}
          </div>

          {filtered.length > limit && (
            <div className="p-4 text-center border-t border-slate-100">
              <button
                onClick={() => setLimit(l => l + 10)}
                className="text-sm font-semibold text-blue-600 hover:text-blue-800 transition-colors"
              >
                Ver mais ({filtered.length - limit} restantes)
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}