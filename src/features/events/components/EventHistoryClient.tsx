'use client'

import React, { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface HistoryRecord {
  id: string;
  event_id: string | null;
  action_type: string;
  details: any;
  created_at: string;
  events?: { title: string } | null;
  actor?: { full_name: string | null } | null;
  target?: { full_name: string | null } | null;
}

export function EventHistoryClient({ initialHistory }: { initialHistory: HistoryRecord[] }) {
  const [filter, setFilter] = useState('');

  const filtered = initialHistory.filter(h => {
    if (!filter) return true;
    const term = filter.toLowerCase();
    return (
      h.events?.title?.toLowerCase().includes(term) ||
      h.action_type.toLowerCase().includes(term) ||
      (h.actor?.full_name ?? '').toLowerCase().includes(term) ||
      (h.target?.full_name ?? '').toLowerCase().includes(term)
    );
  });

  const getActionLabel = (action: string) => {
    const labels: Record<string, string> = {
      'inscrição_gratuita': 'Inscrição Gratuita',
      'inscrição_aguardando_pagamento': 'Aguardando Pagamento',
      'inscrição_presenteada': 'Inscrição Cortesia (Presente)',
      'checkin_realizado': 'Check-in Realizado',
      'webhook_pagamento_confirmado': 'Pagamento Confirmado (Asaas)',
      'webhook_pagamento_cancelado': 'Pagamento Cancelado',
      'webhook_pagamento_expirado': 'Pagamento Expirado',
      'webhook_pagamento_reembolsado': 'Pagamento Reembolsado',
    };
    return labels[action] || action;
  };

  const getActionColor = (action: string) => {
    if (action.includes('confirmado') || action.includes('checkin') || action.includes('gratuita')) return 'bg-emerald-500/10 text-emerald-400';
    if (action.includes('cancelado') || action.includes('expirado') || action.includes('reembolsado')) return 'bg-red-500/10 text-red-400';
    if (action.includes('aguardando')) return 'bg-amber-500/10 text-amber-400';
    if (action.includes('presente')) return 'bg-purple-500/10 text-purple-400';
    return 'bg-slate-500/10 text-slate-400';
  };

  return (
    <div className="rounded-2xl border shadow-sm overflow-hidden" style={{ background: 'var(--admin-surface)', borderColor: 'var(--admin-border)' }}>
      <div className="p-4 border-b flex flex-col sm:flex-row gap-4 items-center justify-between" style={{ background: 'var(--admin-surface-alt)', borderColor: 'var(--admin-border)' }}>
        <input
          type="text"
          placeholder="Buscar no histórico..."
          value={filter}
          onChange={e => setFilter(e.target.value)}
          className="w-full sm:max-w-md px-4 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm transition-all bg-[var(--admin-surface)] border-[var(--admin-border)] text-[var(--admin-text-primary)]"
        />
        <div className="text-sm font-medium" style={{ color: 'var(--admin-text-muted)' }}>
          {filtered.length} registro(s) encontrado(s)
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="border-b font-semibold uppercase text-xs tracking-wider" style={{ background: 'var(--admin-surface)', borderColor: 'var(--admin-border)', color: 'var(--admin-text-secondary)' }}>
            <tr>
              <th className="px-6 py-4">Data/Hora</th>
              <th className="px-6 py-4">Ação</th>
              <th className="px-6 py-4">Evento</th>
              <th className="px-6 py-4">Autor</th>
              <th className="px-6 py-4">Detalhes Adicionais</th>
            </tr>
          </thead>
          <tbody className="divide-y" style={{ borderColor: 'var(--admin-border)', color: 'var(--admin-text-primary)' }}>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center" style={{ color: 'var(--admin-text-muted)' }}>
                  Nenhum registro encontrado.
                </td>
              </tr>
            ) : (
              filtered.map(record => (
                <tr key={record.id} className="transition-colors hover:bg-white/5">
                  <td className="px-6 py-4 whitespace-nowrap font-medium" style={{ color: 'var(--admin-text-secondary)' }}>
                    {format(new Date(record.created_at), "dd/MM/yyyy HH:mm:ss", { locale: ptBR })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold tracking-wide uppercase ${getActionColor(record.action_type)}`}>
                      {getActionLabel(record.action_type)}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-semibold" style={{ color: 'var(--admin-text-primary)' }}>
                    {record.events?.title || 'Desconhecido'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {record.actor?.full_name ? (
                      <span style={{ color: 'var(--admin-text-secondary)' }}>{record.actor.full_name}</span>
                    ) : (
                      <span className="italic" style={{ color: 'var(--admin-text-muted)' }}>Sistema/Webhook</span>
                    )}
                  </td>
                  <td className="px-6 py-4 max-w-xs truncate font-mono text-xs" style={{ color: 'var(--admin-text-muted)' }}>
                    {record.details ? JSON.stringify(record.details) : '-'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
