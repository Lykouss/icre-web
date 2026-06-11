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
    if (action.includes('confirmado') || action.includes('checkin') || action.includes('gratuita')) return 'bg-emerald-100 text-emerald-800';
    if (action.includes('cancelado') || action.includes('expirado') || action.includes('reembolsado')) return 'bg-red-100 text-red-800';
    if (action.includes('aguardando')) return 'bg-amber-100 text-amber-800';
    if (action.includes('presente')) return 'bg-purple-100 text-purple-800';
    return 'bg-slate-100 text-slate-800';
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-4 border-b border-slate-100 bg-slate-50 flex flex-col sm:flex-row gap-4 items-center justify-between">
        <input
          type="text"
          placeholder="Buscar no histórico..."
          value={filter}
          onChange={e => setFilter(e.target.value)}
          className="w-full sm:max-w-md px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm"
        />
        <div className="text-sm font-medium text-slate-500">
          {filtered.length} registro(s) encontrado(s)
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-white dark:bg-slate-800 border-b border-slate-200 text-slate-500 font-semibold uppercase text-xs tracking-wider">
            <tr>
              <th className="px-6 py-4">Data/Hora</th>
              <th className="px-6 py-4">Ação</th>
              <th className="px-6 py-4">Evento</th>
              <th className="px-6 py-4">Autor</th>
              <th className="px-6 py-4">Detalhes Adicionais</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-slate-400">
                  Nenhum registro encontrado.
                </td>
              </tr>
            ) : (
              filtered.map(record => (
                <tr key={record.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-slate-500 font-medium">
                    {format(new Date(record.created_at), "dd/MM/yyyy HH:mm:ss", { locale: ptBR })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold tracking-wide uppercase ${getActionColor(record.action_type)}`}>
                      {getActionLabel(record.action_type)}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-semibold text-slate-800">
                    {record.events?.title || 'Desconhecido'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {record.actor?.full_name ? (
                      <span className="text-slate-700">{record.actor.full_name}</span>
                    ) : (
                      <span className="text-slate-400 italic">Sistema/Webhook</span>
                    )}
                  </td>
                  <td className="px-6 py-4 max-w-xs truncate text-slate-500 font-mono text-xs">
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
