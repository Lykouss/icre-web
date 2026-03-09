'use client'

import React, { useState, useTransition } from 'react';
import { useToast } from '@/features/core/components/ToastContext';
import {
  createRegistration,
  cancelRegistration,
  updateRegistrationPayment,
} from '@/features/events/actions/registrations';
import type { EventRegistration, PaymentStatus, PaymentMethod } from '@/features/events/types';

const PAYMENT_STATUS_STYLES: Record<PaymentStatus, string> = {
  gratuito:   'bg-slate-100 text-slate-500',
  pendente:   'bg-amber-100 text-amber-700',
  pago:       'bg-green-100 text-green-700',
  reembolsado:'bg-blue-100 text-blue-700',
};

const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  gratuito:   'Gratuito',
  pendente:   'Pendente',
  pago:       'Pago',
  reembolsado:'Reembolsado',
};

const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  pix:       'PIX',
  cartao:    'Cartão',
  dinheiro:  'Dinheiro',
  cortesia:  'Cortesia',
};

interface Member {
  id: string;
  full_name: string;
}

interface RegistrationsPanelProps {
  eventId: string;
  registrations: EventRegistration[];
  members: Member[];
  capacity: number | null;
  canManage: boolean;
}

interface PaymentEditState {
  registrationId: string;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod | null;
  paymentAmount: string;
  paymentRef: string;
}

function exportToCSV(registrations: EventRegistration[]) {
  const header = ['Nome', 'Telefone', 'Status Inscrição', 'Pagamento', 'Método', 'Valor', 'Ref. Pagamento', 'Data Inscrição'];
  const rows = registrations.map(r => [
    r.name,
    r.phone ?? '',
    r.status,
    PAYMENT_STATUS_LABELS[r.payment_status],
    r.payment_method ? PAYMENT_METHOD_LABELS[r.payment_method] : '',
    r.payment_amount != null ? r.payment_amount.toFixed(2) : '',
    r.payment_ref ?? '',
    new Date(r.created_at).toLocaleString('pt-BR'),
  ]);

  const csv = [header, ...rows].map(row => row.map(v => `"${v}"`).join(',')).join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `inscritos.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function RegistrationsPanel({ eventId, registrations, members, capacity, canManage }: RegistrationsPanelProps) {
  const { toast, dismiss } = useToast();
  const [isPending, startTransition] = useTransition();

  const [regName, setRegName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regMemberId, setRegMemberId] = useState('');

  const [paymentEdit, setPaymentEdit] = useState<PaymentEditState | null>(null);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<PaymentStatus | 'todos'>('todos');

  const confirmed = registrations.filter(r => r.status === 'confirmado');
  const occupancy = capacity ? `${confirmed.length} / ${capacity}` : `${confirmed.length}`;

  const filtered = registrations.filter(r => {
    const term = search.toLowerCase();
    const matchesSearch = !term || r.name.toLowerCase().includes(term) || r.phone?.includes(term);
    const matchesFilter = filterStatus === 'todos' || r.payment_status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData();
    formData.set('name', regName);
    formData.set('phone', regPhone);
    formData.set('member_id', regMemberId);
    startTransition(async () => {
      const loadingId = toast('loading', 'Registrando inscrição...');
      const result = await createRegistration(eventId, formData);
      dismiss(loadingId);
      if (result.error) toast('error', result.error);
      else {
        toast('success', 'Inscrição realizada!');
        setRegName('');
        setRegPhone('');
        setRegMemberId('');
      }
    });
  };

  const handleCancel = (registrationId: string) => {
    startTransition(async () => {
      const loadingId = toast('loading', 'Cancelando inscrição...');
      const result = await cancelRegistration(registrationId, eventId);
      dismiss(loadingId);
      if (result.error) toast('error', result.error);
      else toast('success', 'Inscrição cancelada.');
    });
  };

  const openPaymentEdit = (r: EventRegistration) => {
    setPaymentEdit({
      registrationId: r.id,
      paymentStatus:  r.payment_status,
      paymentMethod:  r.payment_method,
      paymentAmount:  r.payment_amount != null ? r.payment_amount.toString() : '',
      paymentRef:     r.payment_ref ?? '',
    });
  };

  const handleSavePayment = () => {
    if (!paymentEdit) return;
    const amount = paymentEdit.paymentAmount ? parseFloat(paymentEdit.paymentAmount) : null;
    startTransition(async () => {
      const loadingId = toast('loading', 'Salvando pagamento...');
      const result = await updateRegistrationPayment(
        paymentEdit.registrationId,
        eventId,
        paymentEdit.paymentStatus,
        paymentEdit.paymentMethod,
        amount,
        paymentEdit.paymentRef,
      );
      dismiss(loadingId);
      if (result.error) toast('error', result.error);
      else {
        toast('success', 'Pagamento atualizado!');
        setPaymentEdit(null);
      }
    });
  };

  const inputClass = 'w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm';

  return (
    <div className="animate-in fade-in duration-300 max-w-4xl">

      {/* Sumário */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {([
          { label: 'Inscritos',   value: confirmed.length,                                     color: 'text-slate-800' },
          { label: 'Vagas',       value: capacity ? capacity - confirmed.length : '∞',          color: 'text-slate-800' },
          { label: 'Pagos',       value: registrations.filter(r => r.payment_status === 'pago').length,     color: 'text-green-700' },
          { label: 'Pendentes',   value: registrations.filter(r => r.payment_status === 'pendente').length, color: 'text-amber-700' },
        ] as const).map(card => (
          <div key={card.label} className="bg-white rounded-2xl border border-slate-200 px-4 py-3 shadow-sm">
            <p className="text-xs text-slate-400 font-medium">{card.label}</p>
            <p className={`text-2xl font-bold mt-1 ${card.color}`}>{card.value}</p>
          </div>
        ))}
      </div>

      {/* Formulário nova inscrição */}
      {canManage && (
        <form onSubmit={handleRegister} className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm mb-4">
          <p className="text-sm font-bold text-slate-700 mb-3">Nova inscrição</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input type="text" value={regName} onChange={e => setRegName(e.target.value)} placeholder="Nome *" required className={inputClass} />
            <input type="text" value={regPhone} onChange={e => setRegPhone(e.target.value)} placeholder="Telefone" className={inputClass} />
            <select value={regMemberId} onChange={e => setRegMemberId(e.target.value)} className={inputClass}>
              <option value="">Visitante / externo</option>
              {members.map(m => <option key={m.id} value={m.id}>{m.full_name}</option>)}
            </select>
          </div>
          <div className="flex justify-end mt-3">
            <button type="submit" disabled={isPending} className="px-4 py-2 font-semibold bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 text-sm flex items-center gap-2">
              {isPending && <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" /></svg>}
              Adicionar
            </button>
          </div>
        </form>
      )}

      {/* Filtros e exportação */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Pesquisar por nome ou telefone..."
          className="flex-1 px-4 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
        />
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value as PaymentStatus | 'todos')}
          className="px-4 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
        >
          <option value="todos">Todos os pagamentos</option>
          {(Object.keys(PAYMENT_STATUS_LABELS) as PaymentStatus[]).map(s => (
            <option key={s} value={s}>{PAYMENT_STATUS_LABELS[s]}</option>
          ))}
        </select>
        <button
          onClick={() => exportToCSV(filtered)}
          className="px-4 py-2 font-semibold bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-colors text-sm flex items-center gap-2 shrink-0"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Exportar CSV
        </button>
      </div>

      {/* Lista */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
          <p className="text-xs text-slate-400 font-medium">{filtered.length} inscrições · {occupancy} confirmadas</p>
        </div>

        {filtered.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-12">Nenhuma inscrição encontrada.</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {filtered.map(r => (
              <div key={r.id} className="px-4 py-3 flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-800 text-sm truncate">{r.name}</p>
                  {r.phone && <p className="text-xs text-slate-400">{r.phone}</p>}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-xs font-bold px-2 py-1 rounded-full ${r.status === 'confirmado' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-500'}`}>
                    {r.status}
                  </span>
                  <span className={`text-xs font-bold px-2 py-1 rounded-full ${PAYMENT_STATUS_STYLES[r.payment_status]}`}>
                    {PAYMENT_STATUS_LABELS[r.payment_status]}
                    {r.payment_method && ` · ${PAYMENT_METHOD_LABELS[r.payment_method]}`}
                    {r.payment_amount != null && ` · R$ ${r.payment_amount.toFixed(2)}`}
                  </span>

                  {canManage && r.status === 'confirmado' && (
                    <button onClick={() => openPaymentEdit(r)} className="text-xs text-blue-600 hover:text-blue-800 font-semibold">
                      Pagamento
                    </button>
                  )}
                  {canManage && r.status === 'confirmado' && (
                    <button onClick={() => handleCancel(r.id)} disabled={isPending} className="text-xs text-red-400 hover:text-red-600 font-semibold disabled:opacity-50">
                      Cancelar
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal: Editar pagamento */}
      {paymentEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Registrar Pagamento</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Status</label>
                <select
                  value={paymentEdit.paymentStatus}
                  onChange={e => setPaymentEdit(p => p ? { ...p, paymentStatus: e.target.value as PaymentStatus } : p)}
                  className={inputClass}
                >
                  {(Object.keys(PAYMENT_STATUS_LABELS) as PaymentStatus[]).map(s => (
                    <option key={s} value={s}>{PAYMENT_STATUS_LABELS[s]}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Método</label>
                <select
                  value={paymentEdit.paymentMethod ?? ''}
                  onChange={e => setPaymentEdit(p => p ? { ...p, paymentMethod: (e.target.value as PaymentMethod) || null } : p)}
                  className={inputClass}
                >
                  <option value="">Não informado</option>
                  {(Object.keys(PAYMENT_METHOD_LABELS) as PaymentMethod[]).map(m => (
                    <option key={m} value={m}>{PAYMENT_METHOD_LABELS[m]}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Valor (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={paymentEdit.paymentAmount}
                  onChange={e => setPaymentEdit(p => p ? { ...p, paymentAmount: e.target.value } : p)}
                  placeholder="0,00"
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Referência / Comprovante</label>
                <input
                  type="text"
                  value={paymentEdit.paymentRef}
                  onChange={e => setPaymentEdit(p => p ? { ...p, paymentRef: e.target.value } : p)}
                  placeholder="ID da transação, nº do comprovante..."
                  className={inputClass}
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-4">
              <button onClick={() => setPaymentEdit(null)} className="px-4 py-2 font-medium text-slate-600 hover:bg-slate-100 rounded-xl">
                Cancelar
              </button>
              <button
                onClick={handleSavePayment}
                disabled={isPending}
                className="px-4 py-2 font-semibold bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
              >
                {isPending && <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" /></svg>}
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}