'use client'

import React, { useState, useTransition } from 'react';
import { FinancialRecurring, TransactionCategory } from '@/features/finance/types';
import { createRecurring, toggleRecurring, deleteRecurring } from '@/features/finance/actions/recurring-actions';

interface RecurringPanelProps { items: FinancialRecurring[]; categories: TransactionCategory[] }

const inputCls = 'w-full h-9 px-3 rounded-xl text-sm text-slate-200 placeholder-slate-600 outline-none transition-all';
const inputStyle = { background: 'var(--admin-surface-alt)', border: '1px solid var(--admin-border)' } as const;
const focusFns = {
  onFocus: (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
    e.target.style.borderColor = 'rgba(37,99,235,0.5)'; e.target.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.1)';
  },
  onBlur: (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
    e.target.style.borderColor = 'var(--admin-border)'; e.target.style.boxShadow = 'none';
  },
};

const fmt = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

export function RecurringPanel({ items, categories }: RecurringPanelProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [type, setType] = useState<'entrada' | 'saida'>('saida');
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const filtered = categories.filter(c => c.type === type);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setError(null);
    const formData = new FormData(e.currentTarget);
    formData.set('type', type);
    startTransition(async () => {
      const result = await createRecurring(formData);
      if (result.error) { setError(result.error); return; }
      setIsAdding(false); setType('saida');
    });
  }

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--admin-surface)', border: '1px solid var(--admin-border)' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid var(--admin-border)' }}>
        <div>
          <h2 className="text-[15px] font-bold text-slate-100">Lançamentos Recorrentes</h2>
          <p className="text-[12px] mt-0.5" style={{ color: 'var(--admin-text-secondary)' }}>Entradas e saídas que se repetem mensalmente.</p>
        </div>
        {!isAdding && (
          <button onClick={() => setIsAdding(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[12px] font-bold text-white transition-all"
            style={{ background: 'var(--admin-accent)' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--admin-accent-hover)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'var(--admin-accent)')}>
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
            Adicionar
          </button>
        )}
      </div>

      {/* Form */}
      {isAdding && (
        <form onSubmit={handleSubmit} className="p-5 space-y-4" style={{ borderBottom: '1px solid var(--admin-border)', background: 'rgba(0,0,0,0.15)' }}>
          <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: 'var(--admin-text-muted)' }}>Novo Recorrente</p>

          <div className="grid grid-cols-2 gap-3">
            {([
              { id: 'saida',   label: 'Saída',   ac: { bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.4)', color: '#f87171' } },
              { id: 'entrada', label: 'Entrada', ac: { bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.4)', color: '#34d399' } },
            ] as const).map(t => (
              <button key={t.id} type="button" onClick={() => setType(t.id)}
                className="py-2.5 rounded-xl font-bold text-[12px] border-2 transition-all"
                style={type === t.id
                  ? { background: t.ac.bg, borderColor: t.ac.border, color: t.ac.color }
                  : { background: 'var(--admin-surface-alt)', borderColor: 'var(--admin-border)', color: 'var(--admin-text-secondary)' }}>
                {t.id === 'saida' ? '↓' : '↑'} {t.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold mb-1.5" style={{ color: 'var(--admin-text-secondary)' }}>Título <span className="text-red-400">*</span></label>
              <input name="title" required placeholder="Ex: Aluguel do salão" className={inputCls} style={inputStyle} {...focusFns} />
            </div>
            <div>
              <label className="block text-[11px] font-semibold mb-1.5" style={{ color: 'var(--admin-text-secondary)' }}>Categoria <span className="text-red-400">*</span></label>
              <select name="category" required className={`${inputCls} cursor-pointer`} style={inputStyle} {...focusFns}>
                <option value="">Selecione</option>
                {filtered.map(c => <option key={c.id} value={c.name} style={{ background: '#111d35' }}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold mb-1.5" style={{ color: 'var(--admin-text-secondary)' }}>Valor (R$) <span className="text-red-400">*</span></label>
              <input name="amount" type="number" step="0.01" min="0.01" required placeholder="0,00" className={inputCls} style={inputStyle} {...focusFns} />
            </div>
            <div>
              <label className="block text-[11px] font-semibold mb-1.5" style={{ color: 'var(--admin-text-secondary)' }}>Dia do mês <span className="text-red-400">*</span></label>
              <input name="day_of_month" type="number" min="1" max="31" required placeholder="Ex: 10" className={inputCls} style={inputStyle} {...focusFns} />
            </div>
          </div>

          {error && (
            <div className="px-4 py-2.5 rounded-xl text-sm text-red-300" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <button type="button" onClick={() => setIsAdding(false)}
              className="flex-1 py-2 rounded-xl text-sm font-semibold transition-all"
              style={{ background: 'var(--admin-surface-alt)', border: '1px solid var(--admin-border)', color: 'var(--admin-text-secondary)' }}
              onMouseEnter={e => (e.currentTarget.style.color = 'var(--admin-text-primary)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'var(--admin-text-secondary)')}>
              Cancelar
            </button>
            <button type="submit" disabled={isPending}
              className="flex-1 py-2 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-50"
              style={{ background: 'var(--admin-accent)' }}>
              {isPending ? 'Salvando…' : 'Salvar'}
            </button>
          </div>
        </form>
      )}

      {/* List */}
      {items.length === 0 && !isAdding ? (
        <div className="py-16 text-center text-sm font-medium" style={{ color: 'var(--admin-text-muted)' }}>
          Nenhum lançamento recorrente cadastrado.
        </div>
      ) : (
        <div>
          {items.map((item, i) => (
            <div key={item.id}
              className={`flex items-center justify-between px-5 py-4 gap-4 transition-opacity ${!item.active ? 'opacity-40' : ''}`}
              style={i > 0 ? { borderTop: '1px solid var(--admin-border)' } : undefined}>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap mb-0.5">
                  <span className="text-[13px] font-semibold text-slate-200">{item.title}</span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-bold"
                    style={item.type === 'entrada'
                      ? { background: 'rgba(16,185,129,0.12)', color: '#34d399' }
                      : { background: 'rgba(239,68,68,0.12)', color: '#f87171' }}>
                    {item.type === 'entrada' ? '↑' : '↓'} {item.category}
                  </span>
                  {!item.active && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg" style={{ background: 'var(--admin-surface-alt)', color: 'var(--admin-text-muted)' }}>Inativo</span>
                  )}
                </div>
                <p className="text-[12px]" style={{ color: 'var(--admin-text-secondary)' }}>
                  Todo dia <strong className="text-slate-300">{item.day_of_month}</strong> — <span className="font-semibold">{fmt(item.amount)}</span>
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button onClick={() => startTransition(async () => { await toggleRecurring(item.id, !item.active); })}
                  disabled={isPending}
                  className="px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all disabled:opacity-50"
                  style={item.active
                    ? { background: 'var(--admin-surface-alt)', border: '1px solid var(--admin-border)', color: 'var(--admin-text-secondary)' }
                    : { background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', color: '#34d399' }}>
                  {item.active ? 'Desativar' : 'Ativar'}
                </button>
                <button
                  onClick={() => { if (!confirm(`Excluir "${item.title}"?`)) return; startTransition(async () => { await deleteRecurring(item.id); }); }}
                  disabled={isPending}
                  className="p-1.5 rounded-lg transition-all disabled:opacity-50"
                  style={{ color: 'var(--admin-text-muted)' }}
                  onMouseEnter={e => { e.currentTarget.style.color = '#f87171'; e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; }}
                  onMouseLeave={e => { e.currentTarget.style.color = 'var(--admin-text-muted)'; e.currentTarget.style.background = 'transparent'; }}>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}