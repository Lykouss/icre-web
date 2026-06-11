'use client'

import React, { useState, useTransition, useRef } from 'react';
import { useToast } from '@/features/core/components/ToastContext';
import {
  createRegistration,
  cancelRegistration,
  updateRegistrationPayment,
  giftRegistration,
} from '@/features/events/actions/registrations';
import type { EventRegistration, PaymentStatus, PaymentMethod, CustomFormResponses } from '@/features/events/types';
import { XIcon, GiftIcon, ChevronRightIcon, UserIcon } from 'lucide-react';

// ─── Constants ───────────────────────────────────────────────────────────────

const PAYMENT_STATUS_STYLES: Record<PaymentStatus, string> = {
  gratuito:   'bg-slate-100 text-slate-500',
  pendente:   'bg-amber-100 text-amber-700',
  pago:       'bg-green-100 text-green-700',
  reembolsado:'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300',
  expirado:   'bg-red-100 text-red-700 dark:text-red-300',
  cortesia:   'bg-purple-100 text-purple-700',
};

const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  gratuito:   'Gratuito',
  pendente:   'Pendente',
  pago:       'Pago',
  reembolsado:'Reembolsado',
  expirado:   'Expirado',
  cortesia:   'Cortesia',
};

const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  pix:         'PIX',
  cartao:      'Cartão',
  dinheiro:    'Dinheiro',
  cortesia:    'Cortesia',
  gift:        'Presente',
  asaas_pix:   'Asaas PIX',
  asaas_boleto:'Asaas Boleto',
};

interface Member { id: string; full_name: string; }

interface RegistrationsPanelProps {
  eventId: string;
  registrations: EventRegistration[];
  members: Member[];
  capacity: number | null;
  canManage: boolean;
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function exportToCSV(registrations: EventRegistration[]) {
  const header = ['Nome','E-mail','CPF','Telefone','Status','Pagamento','Método','Data'];
  const rows = registrations.map(r => [
    r.name, r.email ?? '', r.cpf ?? '', r.phone ?? '',
    r.status, PAYMENT_STATUS_LABELS[r.payment_status],
    r.payment_method ? PAYMENT_METHOD_LABELS[r.payment_method] : '',
    new Date(r.created_at).toLocaleString('pt-BR'),
  ]);
  const csv = [header, ...rows].map(row => row.map(v => `"${v}"`).join(',')).join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'inscritos.csv'; a.click();
  URL.revokeObjectURL(url);
}

// ─── Registration Detail Sheet ────────────────────────────────────────────────

function RegistrationSheet({
  reg,
  onClose,
  canManage,
  onCancel,
}: {
  reg: EventRegistration;
  onClose: () => void;
  canManage: boolean;
  onCancel: (id: string) => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white dark:bg-slate-800 shadow-2xl overflow-y-auto animate-in slide-in-from-right duration-300">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 sticky top-0 bg-white dark:bg-slate-800 z-10">
          <div>
            <h3 className="font-bold text-slate-900">{reg.name}</h3>
            <p className="text-xs text-slate-400">Detalhes da inscrição</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 transition-colors">
            <XIcon className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Status badges */}
          <div className="flex flex-wrap gap-2">
            <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${reg.status === 'confirmado' ? 'bg-green-100 text-green-700' : reg.status === 'cancelado' ? 'bg-red-100 text-red-500' : 'bg-amber-100 text-amber-700'}`}>
              {reg.status === 'confirmado' ? 'Confirmado' : reg.status === 'cancelado' ? 'Cancelado' : 'Aguardando pagamento'}
            </span>
            <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${PAYMENT_STATUS_STYLES[reg.payment_status]}`}>
              {PAYMENT_STATUS_LABELS[reg.payment_status]}
              {reg.payment_method && ` · ${PAYMENT_METHOD_LABELS[reg.payment_method]}`}
            </span>
            {reg.is_gift && (
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-pink-100 text-pink-700 flex items-center gap-1">
                <GiftIcon className="w-3 h-3" /> Presente
              </span>
            )}
          </div>

          {/* Personal data */}
          <section>
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Dados Pessoais</h4>
            <div className="space-y-2 text-sm">
              {reg.email && <p><span className="font-semibold text-slate-500">E-mail:</span> {reg.email}</p>}
              {reg.cpf && <p><span className="font-semibold text-slate-500">CPF:</span> {reg.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')}</p>}
              {reg.phone && <p><span className="font-semibold text-slate-500">Telefone:</span> {reg.phone}</p>}
              <p><span className="font-semibold text-slate-500">Inscrito em:</span> {formatDateTime(reg.created_at)}</p>
            </div>
          </section>

          {/* Dynamic form responses */}
          {reg.custom_form_responses && Object.keys(reg.custom_form_responses).length > 0 && (
            <section>
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Respostas do Formulário</h4>
              <div className="space-y-3">
                {Object.entries(reg.custom_form_responses as CustomFormResponses).map(([key, value]) => (
                  <div key={key} className="bg-slate-50 rounded-xl px-4 py-3">
                    <p className="text-xs font-semibold text-slate-500 mb-1">{key}</p>
                    <p className="text-sm text-slate-800">{Array.isArray(value) ? value.join(', ') : value}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Asaas payment info */}
          {reg.asaas_payment_id && (
            <section>
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Status Asaas</h4>
              <div className="bg-slate-50 rounded-xl px-4 py-3 space-y-1 text-sm">
                <p><span className="font-semibold text-slate-500">ID Transação:</span> <code className="text-xs">{reg.asaas_payment_id}</code></p>
                {reg.paid_at && <p><span className="font-semibold text-slate-500">Pago em:</span> {formatDateTime(reg.paid_at)}</p>}
                {reg.asaas_invoice_url && (
                  <a href={reg.asaas_invoice_url} target="_blank" rel="noopener noreferrer"
                    className="text-blue-600 dark:text-blue-400 hover:underline text-xs">Ver fatura ↗</a>
                )}
              </div>
            </section>
          )}

          {/* IP tracking */}
          {reg.ip_address && (
            <section>
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Rastreamento</h4>
              <div className="bg-slate-50 rounded-xl px-4 py-3 text-sm space-y-1">
                <p><span className="font-semibold text-slate-500">IP:</span> {reg.ip_address}</p>
                {reg.device_id && <p><span className="font-semibold text-slate-500">Device ID:</span> <code className="text-xs break-all">{reg.device_id.slice(0, 16)}…</code></p>}
              </div>
            </section>
          )}

          {/* Check-in status */}
          <section>
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Check-in</h4>
            <div className={`rounded-xl px-4 py-3 text-sm ${reg.checkin_status ? 'bg-green-50' : 'bg-slate-50'}`}>
              {reg.checkin_status ? (
                <div className="text-green-700">
                  <p className="font-bold">✓ Realizado</p>
                  {reg.checkin_time && <p className="text-xs mt-1">{formatDateTime(reg.checkin_time)}</p>}
                </div>
              ) : (
                <p className="text-slate-400">Pendente</p>
              )}
            </div>
          </section>

          {/* Actions */}
          {canManage && reg.status === 'confirmado' && (
            <button
              onClick={() => { onCancel(reg.id); onClose(); }}
              className="w-full py-2.5 rounded-xl border border-red-200 dark:border-red-900/30 text-red-500 text-sm font-semibold hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
              Cancelar inscrição
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Gift Modal ───────────────────────────────────────────────────────────────

function GiftModal({ eventId, onClose }: { eventId: string; onClose: () => void }) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [cpf, setCpf] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { toast('error', 'Nome obrigatório.'); return; }
    startTransition(async () => {
      const result = await giftRegistration(eventId, name.trim(), email.trim(), phone.trim(), cpf.trim());
      if (result.error) toast('error', result.error);
      else { toast('success', 'Inscrição presenteada! E-mail enviado.'); onClose(); }
    });
  };

  const inputCls = 'w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-sm p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 bg-pink-100 rounded-xl flex items-center justify-center">
            <GiftIcon className="w-5 h-5 text-pink-500" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900">Presentear Inscrição</h3>
            <p className="text-xs text-slate-400">Cortesia — sem cobrança</p>
          </div>
          <button onClick={onClose} className="ml-auto p-1.5 rounded-lg hover:bg-slate-100"><XIcon className="w-4 h-4" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div><label className="block text-xs font-semibold text-slate-600 mb-1">Nome *</label><input className={inputCls} value={name} onChange={e => setName(e.target.value)} placeholder="Nome completo" required /></div>
          <div><label className="block text-xs font-semibold text-slate-600 mb-1">E-mail</label><input type="email" className={inputCls} value={email} onChange={e => setEmail(e.target.value)} placeholder="email@exemplo.com" /></div>
          <div><label className="block text-xs font-semibold text-slate-600 mb-1">Telefone</label><input type="tel" className={inputCls} value={phone} onChange={e => setPhone(e.target.value)} placeholder="(00) 00000-0000" /></div>
          <div><label className="block text-xs font-semibold text-slate-600 mb-1">CPF</label><input className={inputCls} value={cpf} onChange={e => setCpf(e.target.value)} placeholder="000.000.000-00" /></div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50">Cancelar</button>
            <button type="submit" disabled={isPending} className="flex-1 py-2.5 rounded-xl bg-pink-600 hover:bg-pink-700 text-white text-sm font-bold disabled:opacity-50 flex items-center justify-center gap-2">
              {isPending ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <GiftIcon className="w-4 h-4" />}
              Presentear
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Main Panel ───────────────────────────────────────────────────────────────

export function RegistrationsPanel({ eventId, registrations, members, capacity, canManage }: RegistrationsPanelProps) {
  const { toast, dismiss } = useToast();
  const [isPending, startTransition] = useTransition();
  const [selectedReg, setSelectedReg] = useState<EventRegistration | null>(null);
  const [showGiftModal, setShowGiftModal] = useState(false);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<PaymentStatus | 'todos'>('todos');

  const confirmed = registrations.filter(r => r.status === 'confirmado');
  const occupancy = capacity ? `${confirmed.length} / ${capacity}` : `${confirmed.length}`;

  const filtered = registrations.filter(r => {
    const term = search.toLowerCase();
    const matchesSearch = !term || r.name.toLowerCase().includes(term) || r.phone?.includes(term) || r.email?.toLowerCase().includes(term);
    const matchesFilter = filterStatus === 'todos' || r.payment_status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const handleCancel = (registrationId: string) => {
    startTransition(async () => {
      const loadingId = toast('loading', 'Cancelando inscrição...');
      const result = await cancelRegistration(registrationId, eventId);
      dismiss(loadingId);
      if (result.error) toast('error', result.error);
      else toast('success', 'Inscrição cancelada.');
    });
  };

  const inputClass = 'px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm';

  return (
    <div className="animate-in fade-in duration-300 max-w-4xl">
      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {([
          { label: 'Inscritos',  value: confirmed.length,                                                  color: 'text-slate-800' },
          { label: 'Vagas',      value: capacity ? capacity - confirmed.length : '∞',                      color: 'text-slate-800' },
          { label: 'Pagos',      value: registrations.filter(r => r.payment_status === 'pago').length,     color: 'text-green-700' },
          { label: 'Pendentes',  value: registrations.filter(r => r.payment_status === 'pendente').length, color: 'text-amber-700' },
        ] as const).map(card => (
          <div key={card.label} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 px-4 py-3 shadow-sm">
            <p className="text-xs text-slate-400 font-medium">{card.label}</p>
            <p className={`text-2xl font-bold mt-1 ${card.color}`}>{card.value}</p>
          </div>
        ))}
      </div>

      {/* Action bar */}
      {canManage && (
        <div className="flex gap-3 mb-4">
          <button
            onClick={() => setShowGiftModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-pink-50 dark:bg-pink-900/20 border border-pink-200 text-pink-700 text-sm font-semibold hover:bg-pink-100 transition-colors"
          >
            <GiftIcon className="w-4 h-4" /> Presentear Inscrição
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <input
          type="text" value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Pesquisar por nome, e-mail ou telefone..."
          className={`flex-1 ${inputClass}`}
        />
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value as PaymentStatus | 'todos')} className={inputClass}>
          <option value="todos">Todos</option>
          {(Object.keys(PAYMENT_STATUS_LABELS) as PaymentStatus[]).map(s => (
            <option key={s} value={s}>{PAYMENT_STATUS_LABELS[s]}</option>
          ))}
        </select>
        <button onClick={() => exportToCSV(filtered)} className="px-4 py-2 font-semibold bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-colors text-sm shrink-0">
          Exportar CSV
        </button>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="px-4 py-3 border-b border-slate-100">
          <p className="text-xs text-slate-400 font-medium">{filtered.length} inscrições · {occupancy} confirmadas</p>
        </div>

        {filtered.length === 0 ? (
          <div className="py-12 text-center">
            <UserIcon className="w-10 h-10 text-slate-200 mx-auto mb-3" />
            <p className="text-sm text-slate-400">Nenhuma inscrição encontrada.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filtered.map(r => (
              <div
                key={r.id}
                onClick={() => setSelectedReg(r)}
                className="px-4 py-3 flex items-center gap-4 hover:bg-slate-50 cursor-pointer transition-colors"
              >
                {/* Name */}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-800 text-sm truncate">{r.name}</p>
                  {r.email && <p className="text-xs text-slate-400 truncate">{r.email}</p>}
                </div>

                {/* Status */}
                <span className={`text-xs font-bold px-2 py-1 rounded-full shrink-0 ${r.status === 'confirmado' ? 'bg-green-100 text-green-700' : r.status === 'cancelado' ? 'bg-red-100 text-red-500' : 'bg-amber-100 text-amber-700'}`}>
                  {r.status === 'confirmado' ? 'Confirmado' : r.status === 'cancelado' ? 'Cancelado' : 'Pendente'}
                </span>

                {/* Type */}
                <span className={`text-xs font-bold px-2 py-1 rounded-full shrink-0 ${PAYMENT_STATUS_STYLES[r.payment_status]}`}>
                  {r.is_gift ? '🎁 Presente' : PAYMENT_STATUS_LABELS[r.payment_status]}
                </span>

                {/* Date */}
                <span className="text-xs text-slate-400 shrink-0 hidden sm:block">
                  {new Date(r.created_at).toLocaleDateString('pt-BR')}
                </span>

                <ChevronRightIcon className="w-4 h-4 text-slate-300 shrink-0" />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Sheets & Modals */}
      {selectedReg && (
        <RegistrationSheet
          reg={selectedReg}
          onClose={() => setSelectedReg(null)}
          canManage={canManage}
          onCancel={handleCancel}
        />
      )}
      {showGiftModal && (
        <GiftModal eventId={eventId} onClose={() => setShowGiftModal(false)} />
      )}
    </div>
  );
}