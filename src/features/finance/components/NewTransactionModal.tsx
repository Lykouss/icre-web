'use client'

import React, { useState, useTransition } from 'react';
import { createTransaction } from '@/features/finance/actions/create-transaction';
import { TransactionCategory } from '@/features/finance/types';
import { useToast } from '@/features/core/components/ToastContext';

interface Member {
  id: string;
  full_name: string;
}

interface NewTransactionModalProps {
  categories: TransactionCategory[];
  members: Member[];
}

export function NewTransactionModal({ categories, members }: NewTransactionModalProps) {
  const { toast, dismiss } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [selectedType, setSelectedType] = useState<'entrada' | 'saida'>('entrada');

  const filteredCategories = categories.filter(c => c.type === selectedType);
  const today = new Date().toISOString().split('T')[0];

  function handleClose() {
    if (isPending) return;
    setIsOpen(false);
    setSelectedType('entrada');
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    formData.set('type', selectedType);
    const form = e.currentTarget;

    startTransition(async () => {
      const loadingId = toast('loading', 'Salvando lançamento...');
      const result = await createTransaction(formData);
      dismiss(loadingId);

      if (result.error) {
        toast('error', result.error);
        return;
      }

      toast('success', 'Lançamento registrado com sucesso!');
      form.reset();
      setIsOpen(false);
      setSelectedType('entrada');
    });
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-blue-700 transition-colors shadow-sm"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
        </svg>
        Novo Lançamento
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-slate-100 sticky top-0 bg-white dark:bg-slate-800 rounded-t-2xl z-10">
          <h2 className="text-xl font-bold text-slate-900">Novo Lançamento</h2>
          <button
            onClick={handleClose}
            disabled={isPending}
            className="text-slate-400 hover:text-slate-700 transition-colors disabled:opacity-50"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="grid grid-cols-2 gap-3">
            <button type="button" onClick={() => setSelectedType('entrada')}
              className={`py-3 rounded-xl font-semibold border-2 transition-all ${
                selectedType === 'entrada'
                  ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-500 text-emerald-700 dark:text-emerald-300'
                  : 'border-slate-200 text-slate-500 hover:border-slate-300'
              }`}>
              ↑ Entrada
            </button>
            <button type="button" onClick={() => setSelectedType('saida')}
              className={`py-3 rounded-xl font-semibold border-2 transition-all ${
                selectedType === 'saida'
                  ? 'bg-red-50 dark:bg-red-900/20 border-red-500 text-red-700 dark:text-red-300'
                  : 'border-slate-200 text-slate-500 hover:border-slate-300'
              }`}>
              ↓ Saída
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Categoria *</label>
            {filteredCategories.length === 0 ? (
              <p className="text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5">
                Nenhuma categoria cadastrada para este tipo.
              </p>
            ) : (
              <select name="category" required
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Selecione uma categoria</option>
                {filteredCategories.map(c => (
                  <option key={c.id} value={c.name}>{c.name}</option>
                ))}
              </select>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Valor (R$) *</label>
              <input type="number" name="amount" step="0.01" min="0.01" required placeholder="0,00"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Data *</label>
              <input type="date" name="date" required defaultValue={today}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>

          {selectedType === 'entrada' && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Membro <span className="text-slate-400 font-normal">(opcional)</span>
              </label>
              <select name="memberId"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Anônimo / Não identificado</option>
                {members.map(m => (
                  <option key={m.id} value={m.id}>{m.full_name}</option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Descrição <span className="text-slate-400 font-normal">(opcional)</span>
            </label>
            <input type="text" name="description"
              placeholder={selectedType === 'saida' ? 'Ex: Conta de luz de janeiro' : 'Ex: Oferta campanha de construção'}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={handleClose} disabled={isPending}
              className="flex-1 py-2.5 rounded-xl border border-slate-200 font-semibold text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50">
              Cancelar
            </button>
            <button type="submit" disabled={isPending}
              className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
              {isPending && (
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                </svg>
              )}
              {isPending ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}