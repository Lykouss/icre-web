'use client'

import React, { useState, useTransition } from 'react';
import { FinanceLog } from '@/features/finance/types';

const ACTION_META: Record<string, { label: string; color: string; bg: string }> = {
  CREATE_TRANSACTION: { label: 'Novo Lançamento', color: '#34d399', bg: 'rgba(16,185,129,0.12)'  },
  DELETE_TRANSACTION: { label: 'Exclusão',         color: '#f87171', bg: 'rgba(239,68,68,0.12)'  },
  CLOSE_MONTH:        { label: 'Fechamento',        color: '#93c5fd', bg: 'rgba(37,99,235,0.12)'  },
};

const MONTHS = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
const fmt = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

function describeLog(log: FinanceLog): string {
  const data = log.new_data ?? log.old_data;
  if (!data) return '—';
  if (log.action === 'CREATE_TRANSACTION') return `${data.type === 'entrada' ? 'Entrada' : 'Saída'} — ${data.category} — ${fmt(Number(data.amount))}`;
  if (log.action === 'DELETE_TRANSACTION') return `Excluído: ${data.category} — ${fmt(Number(data.amount))}`;
  if (log.action === 'CLOSE_MONTH') return `${MONTHS[(Number(data.month) - 1)] ?? data.month}/${data.year} — Saldo: ${fmt(Number(data.balance))}`;
  return '—';
}

const inputStyle = { background: 'var(--admin-surface-alt)', border: '1px solid var(--admin-border)' } as const;

export function FinanceLogsPanel({ logs }: { logs: FinanceLog[] }) {
  const [search, setSearch] = useState('');
  const [filterAction, setFilterAction] = useState('ALL');
  const [limit, setLimit] = useState(10);
  const [, startTransition] = useTransition();

  const filtered = logs.filter(log => {
    const matchAction = filterAction === 'ALL' || log.action === filterAction;
    const term = search.toLowerCase();
    const matchSearch = !term || log.actor_name.toLowerCase().includes(term) || log.action.toLowerCase().includes(term) || log.actor_role.toLowerCase().includes(term);
    return matchAction && matchSearch;
  });

  const displayed = filtered.slice(0, limit);

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--admin-surface)', border: '1px solid var(--admin-border)' }}>
      {/* Header */}
      <div className="px-5 py-4" style={{ borderBottom: '1px solid var(--admin-border)' }}>
        <h2 className="text-[15px] font-bold text-slate-100">Audit Trail</h2>
        <p className="text-[12px] mt-0.5" style={{ color: 'var(--admin-text-secondary)' }}>Rastreio completo de todas as ações no módulo financeiro.</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 p-4" style={{ borderBottom: '1px solid var(--admin-border)', background: 'rgba(0,0,0,0.1)' }}>
        <div className="relative flex-1">
          <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input type="text" placeholder="Pesquisar por nome ou ação…" value={search} onChange={e => setSearch(e.target.value)}
            className="w-full h-9 pl-9 pr-4 rounded-xl text-sm text-slate-200 placeholder-slate-600 outline-none transition-all"
            style={inputStyle}
            onFocus={e => { e.target.style.borderColor = 'rgba(37,99,235,0.5)'; e.target.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.1)'; }}
            onBlur={e => { e.target.style.borderColor = 'var(--admin-border)'; e.target.style.boxShadow = 'none'; }}
          />
        </div>
        <select value={filterAction} onChange={e => setFilterAction(e.target.value)}
          className="h-9 px-3 rounded-xl text-sm text-slate-200 outline-none cursor-pointer transition-all"
          style={inputStyle}
          onFocus={e => (e.target.style.borderColor = 'rgba(37,99,235,0.5)')}
          onBlur={e => (e.target.style.borderColor = 'var(--admin-border)')}>
          <option value="ALL" style={{ background: '#111d35' }}>Todas as ações</option>
          <option value="CREATE_TRANSACTION" style={{ background: '#111d35' }}>Novo Lançamento</option>
          <option value="DELETE_TRANSACTION" style={{ background: '#111d35' }}>Exclusão</option>
          <option value="CLOSE_MONTH" style={{ background: '#111d35' }}>Fechamento de Caixa</option>
        </select>
      </div>

      {/* Log list */}
      {displayed.length === 0 ? (
        <div className="py-16 text-center text-sm font-medium" style={{ color: 'var(--admin-text-muted)' }}>
          Nenhum log encontrado.
        </div>
      ) : (
        <>
          <div>
            {displayed.map((log, i) => {
              const meta = ACTION_META[log.action] ?? { label: log.action, color: 'var(--admin-text-secondary)', bg: 'var(--admin-surface-alt)' };
              return (
                <div key={log.id} className="px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-3"
                  style={i > 0 ? { borderTop: '1px solid var(--admin-border)' } : undefined}>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-[10px] font-bold" style={{ background: meta.bg, color: meta.color }}>
                        {meta.label}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg" style={{ background: 'var(--admin-surface-alt)', border: '1px solid var(--admin-border)', color: 'var(--admin-text-muted)' }}>
                        {log.actor_role}
                      </span>
                    </div>
                    <p className="text-[13px] font-semibold text-slate-300">{log.actor_name}</p>
                    <p className="text-[11px] mt-0.5" style={{ color: 'var(--admin-text-secondary)' }}>{describeLog(log)}</p>
                  </div>
                  <div className="text-[11px] font-mono whitespace-nowrap shrink-0" style={{ color: 'var(--admin-text-muted)' }}>
                    {new Date(log.created_at).toLocaleString('pt-BR')}
                  </div>
                </div>
              );
            })}
          </div>

          {filtered.length > limit && (
            <div className="px-5 py-4 text-center" style={{ borderTop: '1px solid var(--admin-border)' }}>
              <button onClick={() => startTransition(() => setLimit(l => l + 10))}
                className="text-sm font-semibold transition-colors"
                style={{ color: 'var(--admin-accent)' }}
                onMouseEnter={e => (e.currentTarget.style.opacity = '0.7')}
                onMouseLeave={e => (e.currentTarget.style.opacity = '1')}>
                Ver mais ({filtered.length - limit} restantes)
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}