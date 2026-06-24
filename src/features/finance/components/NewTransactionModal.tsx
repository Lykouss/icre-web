'use client'

import React, { useState, useTransition } from 'react';
import { createTransaction } from '@/features/finance/actions/create-transaction';
import { TransactionCategory } from '@/features/finance/types';
import { useToast } from '@/features/core/components/ToastContext';
import { AdminModal, AdminButton, AdminField } from '@/features/core/components/AdminUI';

interface Member { id: string; full_name: string }
interface NewTransactionModalProps { categories: TransactionCategory[]; members: Member[] }

const inputCls = 'w-full h-9 px-3 rounded-xl text-sm text-slate-200 placeholder-slate-600 outline-none transition-all';
const inputStyle = { background: 'var(--admin-surface-alt)', border: '1px solid var(--admin-border)' } as const;
const focusProps = {
  onFocus: (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => { e.target.style.borderColor = 'rgba(37,99,235,0.5)'; e.target.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.1)'; },
  onBlur:  (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => { e.target.style.borderColor = 'var(--admin-border)'; e.target.style.boxShadow = 'none'; },
};

export function NewTransactionModal({ categories, members }: NewTransactionModalProps) {
  const { toast, dismiss } = useToast();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [type, setType] = useState<'entrada' | 'saida'>('entrada');

  const filtered = categories.filter(c => c.type === type);
  const today = new Date().toISOString().split('T')[0];

  function handleClose() { if (isPending) return; setOpen(false); setType('entrada'); }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    formData.set('type', type);
    const form = e.currentTarget;
    startTransition(async () => {
      const loadingId = toast('loading', 'Salvando lançamento…');
      const result = await createTransaction(formData);
      dismiss(loadingId);
      if (result.error) { toast('error', result.error); return; }
      toast('success', 'Lançamento registrado!');
      form.reset();
      setOpen(false);
      setType('entrada');
    });
  }

  const FinanceIcon = (
    <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );

  return (
    <>
      <AdminButton
        variant="primary"
        icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>}
        onClick={() => setOpen(true)}
      >
        Novo Lançamento
      </AdminButton>

      <AdminModal open={open} onClose={handleClose} title="Novo Lançamento" description="Registre uma entrada ou saída financeira." icon={FinanceIcon} maxWidth="max-w-lg">
        <form onSubmit={handleSubmit} className="p-6 space-y-5">

          {/* Type toggle */}
          <div className="grid grid-cols-2 gap-3">
            {([
              {
                id: 'entrada' as const,
                label: 'Entrada',
                icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 11l5-5m0 0l5 5m-5-5v12" /></svg>,
                active: { bg: 'rgba(16,185,129,0.15)', border: 'rgba(16,185,129,0.5)', color: '#34d399' },
              },
              {
                id: 'saida' as const,
                label: 'Saída',
                icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 13l-5 5m0 0l-5-5m5 5V6" /></svg>,
                active: { bg: 'rgba(239,68,68,0.15)', border: 'rgba(239,68,68,0.5)', color: '#f87171' },
              },
            ] as const).map(t => (
              <button
                key={t.id}
                type="button"
                onClick={() => setType(t.id)}
                className="flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all duration-150"
                style={type === t.id
                  ? { background: t.active.bg, border: `2px solid ${t.active.border}`, color: t.active.color }
                  : { background: 'var(--admin-surface-alt)', border: '2px solid var(--admin-border)', color: 'var(--admin-text-secondary)' }
                }
              >
                {t.icon}
                {t.label}
              </button>
            ))}
          </div>

          {/* Category */}
          <AdminField label="Categoria" required>
            {filtered.length === 0 ? (
              <div className="px-4 py-2.5 rounded-xl text-sm font-medium text-amber-400" style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)' }}>
                Nenhuma categoria cadastrada para este tipo.
              </div>
            ) : (
              <select name="category" required className={`${inputCls} cursor-pointer w-full h-9 px-3`} style={inputStyle} {...focusProps}>
                <option value="">Selecione uma categoria</option>
                {filtered.map(c => <option key={c.id} value={c.name} style={{ background: '#111d35' }}>{c.name}</option>)}
              </select>
            )}
          </AdminField>

          {/* Amount + Date */}
          <div className="grid grid-cols-2 gap-4">
            <AdminField label="Valor (R$)" required>
              <input type="number" name="amount" step="0.01" min="0.01" required placeholder="0,00" className={inputCls} style={inputStyle} {...focusProps} />
            </AdminField>
            <AdminField label="Data" required>
              <input type="date" name="date" required defaultValue={today} className={inputCls} style={inputStyle} {...focusProps} />
            </AdminField>
          </div>

          {/* Member (entries only) */}
          {type === 'entrada' && (
            <AdminField label="Membro" hint="Opcional — deixe em branco para anônimo">
              <select name="memberId" className={`${inputCls} cursor-pointer w-full h-9 px-3`} style={inputStyle} {...focusProps}>
                <option value="">Anônimo / Não identificado</option>
                {members.map(m => <option key={m.id} value={m.id} style={{ background: '#111d35' }}>{m.full_name}</option>)}
              </select>
            </AdminField>
          )}

          {/* Description */}
          <AdminField label="Descrição" hint="Opcional">
            <input
              type="text"
              name="description"
              placeholder={type === 'saida' ? 'Ex: Conta de luz de janeiro' : 'Ex: Oferta campanha de construção'}
              className={inputCls}
              style={inputStyle}
              {...focusProps}
            />
          </AdminField>

          {/* Actions */}
          <div className="flex gap-3 pt-2" style={{ borderTop: '1px solid var(--admin-border)', marginTop: '1.5rem', paddingTop: '1.25rem' }}>
            <AdminButton type="button" variant="ghost" onClick={handleClose} disabled={isPending} className="flex-1">
              Cancelar
            </AdminButton>
            <AdminButton type="submit" variant="primary" loading={isPending} className="flex-1">
              {isPending ? 'Salvando…' : 'Salvar lançamento'}
            </AdminButton>
          </div>
        </form>
      </AdminModal>
    </>
  );
}