'use client'

import React, { useState, useTransition } from 'react';
import { FinancialRecurring, TransactionCategory } from '@/features/finance/types';
import { createRecurring, toggleRecurring, deleteRecurring } from '@/features/finance/actions/recurring-actions';

interface RecurringPanelProps {
  items: FinancialRecurring[];
  categories: TransactionCategory[];
}

export function RecurringPanel({ items, categories }: RecurringPanelProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [selectedType, setSelectedType] = useState<'entrada' | 'saida'>('saida');
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const filteredCategories = categories.filter(c => c.type === selectedType);

  function formatCurrency(value: number) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    formData.set('type', selectedType);

    startTransition(async () => {
      const result = await createRecurring(formData);
      if (result.error) { setError(result.error); return; }
      setIsAdding(false);
      setSelectedType('saida');
    });
  }

  function handleToggle(id: string, current: boolean) {
    startTransition(async () => { await toggleRecurring(id, !current); });
  }

  function handleDelete(id: string, title: string) {
    if (!confirm(`Excluir "${title}"? Esta ação não pode ser desfeita.`)) return;
    startTransition(async () => { await deleteRecurring(id); });
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
      <div className="p-5 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-800">Lançamentos Recorrentes</h2>
          <p className="text-sm text-slate-500 mt-0.5">Entradas e saídas que se repetem todo mês.</p>
        </div>
        {!isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
            Adicionar
          </button>
        )}
      </div>

      {/* Formulário de adição */}
      {isAdding && (
        <form onSubmit={handleSubmit} className="p-5 border-b border-slate-100 bg-slate-50 space-y-4">
          <h3 className="font-semibold text-slate-700">Novo Recorrente</h3>

          <div className="grid grid-cols-2 gap-3">
            <button type="button" onClick={() => setSelectedType('entrada')}
              className={`py-2.5 rounded-xl font-semibold border-2 text-sm transition-all ${
                selectedType === 'entrada' ? 'bg-emerald-50 border-emerald-500 text-emerald-700' : 'border-slate-200 text-slate-500'
              }`}>↑ Entrada</button>
            <button type="button" onClick={() => setSelectedType('saida')}
              className={`py-2.5 rounded-xl font-semibold border-2 text-sm transition-all ${
                selectedType === 'saida' ? 'bg-red-50 border-red-500 text-red-700' : 'border-slate-200 text-slate-500'
              }`}>↓ Saída</button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Título *</label>
              <input name="title" required placeholder="Ex: Aluguel do salão"
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Categoria *</label>
              <select name="category" required
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Selecione</option>
                {filteredCategories.map(c => (
                  <option key={c.id} value={c.name}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Valor (R$) *</label>
              <input name="amount" type="number" step="0.01" min="0.01" required placeholder="0,00"
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Dia do mês *</label>
              <input name="day_of_month" type="number" min="1" max="31" required placeholder="Ex: 10"
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-2">{error}</p>
          )}

          <div className="flex gap-3">
            <button type="button" onClick={() => setIsAdding(false)}
              className="flex-1 py-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors">
              Cancelar
            </button>
            <button type="submit" disabled={isPending}
              className="flex-1 py-2 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50">
              {isPending ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      )}

      {/* Lista */}
      {items.length === 0 && !isAdding ? (
        <div className="text-center py-16 text-slate-400">
          <p className="font-medium">Nenhum lançamento recorrente cadastrado.</p>
        </div>
      ) : (
        <div className="divide-y divide-slate-50">
          {items.map(item => (
            <div key={item.id} className={`flex items-center justify-between px-5 py-4 gap-4 transition-opacity ${
              !item.active ? 'opacity-50' : ''
            }`}>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-slate-800">{item.title}</span>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-semibold ${
                    item.type === 'entrada' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                  }`}>
                    {item.type === 'entrada' ? '↑' : '↓'} {item.category}
                  </span>
                  {!item.active && (
                    <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">Inativo</span>
                  )}
                </div>
                <p className="text-sm text-slate-500 mt-0.5">
                  Todo dia <strong>{item.day_of_month}</strong> — {formatCurrency(item.amount)}
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => handleToggle(item.id, item.active ?? true)}
                  disabled={isPending}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    item.active
                      ? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                  }`}
                >
                  {item.active ? 'Desativar' : 'Ativar'}
                </button>
                <button
                  onClick={() => handleDelete(item.id, item.title)}
                  disabled={isPending}
                  className="text-slate-300 hover:text-red-500 transition-colors disabled:opacity-50"
                  title="Excluir"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
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