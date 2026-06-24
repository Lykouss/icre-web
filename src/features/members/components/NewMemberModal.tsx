'use client'

import React, { useState, useTransition } from 'react';
import { createMember } from '@/features/members/actions/create-member';
import { AdminModal, AdminButton, AdminField } from '@/features/core/components/AdminUI';

interface Cell { id: string; name: string; }
interface NewMemberModalProps { cells: Cell[]; }

const inputCls = `
  w-full h-9 px-3 rounded-xl text-sm text-slate-200 placeholder-slate-600 outline-none transition-all
`;
const inputStyle = { background: 'var(--admin-surface-alt)', border: '1px solid var(--admin-border)' } as const;

function maskPhone(raw: string): string {
  let v = raw.replace(/\D/g, '').slice(0, 11);
  v = v.replace(/^(\d{2})(\d)/, '($1) $2');
  v = v.replace(/(\d)(\ d{4})$/, '$1-$2');
  // manual split for 9-digit mobile
  if (v.replace(/\D/g,'').length === 11) {
    const d = v.replace(/\D/g,'');
    return `(${d.slice(0,2)}) ${d.slice(2,7)}-${d.slice(7)}`;
  }
  if (v.replace(/\D/g,'').length >= 10) {
    const d = v.replace(/\D/g,'');
    return `(${d.slice(0,2)}) ${d.slice(2,6)}-${d.slice(6)}`;
  }
  return v;
}

export function NewMemberModal({ cells }: NewMemberModalProps) {
  const [open, setOpen] = useState(false);
  const [phone, setPhone] = useState('');
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (phone && phone.replace(/\D/g,'').length < 10) {
      return;
    }
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await createMember(formData);
      if (!result.error) {
        setOpen(false);
        setPhone('');
      }
    });
  };

  const PersonIcon = (
    <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
    </svg>
  );

  return (
    <>
      <AdminButton variant="primary" icon={
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
        </svg>
      } onClick={() => setOpen(true)}>
        Novo Registro
      </AdminButton>

      <AdminModal
        open={open}
        onClose={() => setOpen(false)}
        title="Adicionar Pessoa"
        description="Preencha os dados para registrar uma nova pessoa."
        icon={PersonIcon}
      >
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <AdminField label="Nome Completo" required>
            <input
              type="text"
              name="fullName"
              required
              placeholder="Ex: João da Silva"
              className={inputCls}
              style={inputStyle}
              onFocus={e => { e.target.style.borderColor = 'rgba(37,99,235,0.5)'; e.target.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.1)'; }}
              onBlur={e => { e.target.style.borderColor = 'var(--admin-border)'; e.target.style.boxShadow = 'none'; }}
            />
          </AdminField>

          <AdminField label="WhatsApp" hint="Formato: (61) 99999-9999">
            <input
              type="text"
              name="phone"
              value={phone}
              onChange={e => setPhone(maskPhone(e.target.value))}
              placeholder="(61) 99999-9999"
              inputMode="numeric"
              className={inputCls}
              style={inputStyle}
              onFocus={e => { e.target.style.borderColor = 'rgba(37,99,235,0.5)'; e.target.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.1)'; }}
              onBlur={e => { e.target.style.borderColor = 'var(--admin-border)'; e.target.style.boxShadow = 'none'; }}
            />
          </AdminField>

          <div className="grid grid-cols-2 gap-4">
            <AdminField label="Status">
              <select
                name="status"
                className={`${inputCls} cursor-pointer`}
                style={inputStyle}
              >
                <option value="Visitante">Visitante</option>
                <option value="Congregante">Congregante</option>
                <option value="Membro">Membro</option>
              </select>
            </AdminField>

            <AdminField label="Célula">
              <select
                name="cellId"
                className={`${inputCls} cursor-pointer`}
                style={inputStyle}
              >
                <option value="">Nenhuma</option>
                {cells.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </AdminField>
          </div>

          <div
            className="flex items-center justify-end gap-3 pt-2"
            style={{ borderTop: '1px solid var(--admin-border)', marginTop: '1.5rem', paddingTop: '1.25rem' }}
          >
            <AdminButton type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancelar
            </AdminButton>
            <AdminButton type="submit" variant="primary" loading={isPending}>
              {isPending ? 'Salvando…' : 'Salvar pessoa'}
            </AdminButton>
          </div>
        </form>
      </AdminModal>
    </>
  );
}