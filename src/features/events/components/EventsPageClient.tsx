'use client'

import React, { useState, useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/features/core/components/ToastContext';
import { deleteEvent, updateEventStatus, generateRecurringOccurrences } from '@/features/events/actions/events';
import { EventForm } from '@/features/events/components/EventForm';
import type { ChurchEvent, EventType, EventStatus } from '@/features/events/types';

const WEEK_DAYS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

const TYPE_STYLES: Record<EventType, string> = {
  culto:    'bg-blue-100 text-blue-700',
  especial: 'bg-purple-100 text-purple-700',
};

const TYPE_LABELS: Record<EventType, string> = {
  culto:    'Culto',
  especial: 'Especial',
};

const STATUS_STYLES: Record<EventStatus, string> = {
  rascunho:  'bg-slate-100 text-slate-500',
  publicado: 'bg-green-100 text-green-700',
  encerrado: 'bg-orange-100 text-orange-700',
  cancelado: 'bg-red-100 text-red-500',
};

const STATUS_LABELS: Record<EventStatus, string> = {
  rascunho:  'Rascunho',
  publicado: 'Publicado',
  encerrado: 'Encerrado',
  cancelado: 'Cancelado',
};

const STATUS_TRANSITIONS: Record<EventStatus, EventStatus[]> = {
  rascunho:  ['publicado', 'cancelado'],
  publicado: ['encerrado', 'cancelado'],
  encerrado: [],
  cancelado: [],
};

interface EventsPageClientProps {
  initialEvents: ChurchEvent[];
  canManage: boolean;
  isSysAdmin: boolean;
}

export function EventsPageClient({ initialEvents, canManage, isSysAdmin }: EventsPageClientProps) {
  const router = useRouter();
  const { toast, dismiss } = useToast();

  const [tab, setTab] = useState<EventType | 'todos'>('todos');
  const [search, setSearch] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<ChurchEvent | null>(null);
  const [generateTarget, setGenerateTarget] = useState<ChurchEvent | null>(null);
  const [weeksAhead, setWeeksAhead] = useState(4);

  const [isPending, startTransition] = useTransition();
  const [isPendingGenerate, startTransitionGenerate] = useTransition();

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel('realtime_events')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'events' }, () => router.refresh())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [router]);

  const filtered = initialEvents.filter(e => {
    const matchesTab = tab === 'todos' || e.type === tab;
    const term = search.toLowerCase();
    const matchesSearch = !term || e.title.toLowerCase().includes(term) || e.location?.toLowerCase().includes(term);
    return matchesTab && matchesSearch;
  });

  const handleStatusChange = (eventId: string, status: EventStatus) => {
    startTransition(async () => {
      const loadingId = toast('loading', 'Atualizando status...');
      const result = await updateEventStatus(eventId, status);
      dismiss(loadingId);
      if (result.error) toast('error', result.error);
      else toast('success', `Status atualizado para "${STATUS_LABELS[status]}".`);
    });
  };

  const handleDelete = (eventId: string) => {
    startTransition(async () => {
      const loadingId = toast('loading', 'Excluindo evento...');
      const result = await deleteEvent(eventId);
      dismiss(loadingId);
      if (result.error) toast('error', result.error);
      else toast('success', 'Evento excluído.');
    });
  };

  const handleGenerate = () => {
    if (!generateTarget) return;
    startTransitionGenerate(async () => {
      const loadingId = toast('loading', 'Gerando ocorrências...');
      const result = await generateRecurringOccurrences(generateTarget.id, weeksAhead);
      dismiss(loadingId);
      if (result.error) toast('error', result.error);
      else {
        toast('success', `${result.count} cultos gerados!`);
        setGenerateTarget(null);
      }
    });
  };

  return (
    <div>
      {/* Toolbar */}
      <div className="bg-white p-4 rounded-t-2xl border border-slate-200 border-b-0 flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <svg className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Pesquisar por título ou local..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
        </div>

        <div className="flex gap-2">
          {(['todos', 'culto', 'especial'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${tab === t ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            >
              {t === 'todos' ? 'Todos' : TYPE_LABELS[t]}
            </button>
          ))}
        </div>

        {canManage && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-xl font-semibold hover:bg-blue-700 transition-colors text-sm shrink-0"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
            Novo Evento
          </button>
        )}
      </div>

      {/* Tabela */}
      <div className="bg-white border border-slate-200 rounded-b-2xl overflow-hidden shadow-sm">
        <div className="px-6 py-3 border-b border-slate-100">
          <p className="text-xs text-slate-400 font-medium">
            {filtered.length === initialEvents.length
              ? `${initialEvents.length} eventos`
              : `${filtered.length} de ${initialEvents.length} eventos`}
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                <th className="px-6 py-4">Evento</th>
                <th className="px-6 py-4">Tipo</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Data</th>
                <th className="px-6 py-4">Local</th>
                <th className="px-6 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center text-slate-400">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-14 h-14 bg-slate-50 rounded-full flex items-center justify-center border border-slate-100">
                        <svg className="w-7 h-7 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <p className="font-semibold text-slate-600">Nenhum evento encontrado</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map(event => {
                  const safeStatus: EventStatus = STATUS_TRANSITIONS[event.status] ? event.status : 'rascunho';
                  const transitions = STATUS_TRANSITIONS[safeStatus];
                  return (
                    <tr key={event.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-semibold text-slate-900">{event.title}</p>
                          {event.is_recurring && (
                            <p className="text-xs text-blue-600 font-medium mt-0.5">
                              Recorrente · {WEEK_DAYS[event.recurrence_day ?? 0]}s
                            </p>
                          )}
                          {event.publish_at && event.status === 'rascunho' && (
                            <p className="text-xs text-amber-600 mt-0.5">
                              Publica em {new Date(event.publish_at).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${TYPE_STYLES[event.type]}`}>
                          {TYPE_LABELS[event.type]}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {canManage && transitions.length > 0 ? (
                          <select
                            value={safeStatus}
                            onChange={e => handleStatusChange(event.id, e.target.value as EventStatus)}
                            disabled={isPending}
                            className={`text-xs font-bold px-2.5 py-1 rounded-full border-0 cursor-pointer focus:ring-2 focus:ring-blue-500 outline-none ${STATUS_STYLES[safeStatus]}`}
                          >
                            <option value={safeStatus}>{STATUS_LABELS[safeStatus]}</option>
                            {transitions.map(s => (
                              <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                            ))}
                          </select>
                        ) : (
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${STATUS_STYLES[safeStatus]}`}>
                            {STATUS_LABELS[safeStatus]}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-slate-500">
                        {event.date
                          ? new Date(event.date + 'T12:00:00').toLocaleDateString('pt-BR')
                          : <span className="text-slate-300 italic">—</span>}
                        {event.time && <span className="ml-1 text-slate-400">· {event.time.slice(0, 5)}</span>}
                      </td>
                      <td className="px-6 py-4 text-slate-500">{event.location ?? '—'}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          {event.is_recurring && canManage && (
                            <button
                              onClick={() => setGenerateTarget(event)}
                              className="text-xs text-emerald-600 hover:text-emerald-800 font-semibold"
                            >
                              Gerar datas
                            </button>
                          )}
                          {canManage && (
                            <button
                              onClick={() => setEditingEvent(event)}
                              className="text-xs text-slate-500 hover:text-slate-800 font-semibold"
                            >
                              Editar
                            </button>
                          )}
                          <Link href={`/eventos/${event.id}`} className="text-blue-600 hover:text-blue-800 font-semibold text-sm">
                            Ver
                          </Link>
                          {isSysAdmin && (
                            <button
                              onClick={() => handleDelete(event.id)}
                              disabled={isPending}
                              className="text-red-400 hover:text-red-600 disabled:opacity-50"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Criar evento */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-900">Novo Evento</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 max-h-[75vh] overflow-y-auto">
              <EventForm onSuccess={() => setShowCreateModal(false)} onCancel={() => setShowCreateModal(false)} />
            </div>
          </div>
        </div>
      )}

      {/* Modal: Editar evento */}
      {editingEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-900">Editar Evento</h3>
              <button onClick={() => setEditingEvent(null)} className="text-slate-400 hover:text-slate-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 max-h-[75vh] overflow-y-auto">
              <EventForm event={editingEvent} onSuccess={() => setEditingEvent(null)} onCancel={() => setEditingEvent(null)} />
            </div>
          </div>
        </div>
      )}

      {/* Modal: Gerar ocorrências */}
      {generateTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-1">Gerar ocorrências</h3>
            <p className="text-sm text-slate-500 mb-4">
              Template: <strong>{generateTarget.title}</strong>
            </p>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Quantas semanas à frente?</label>
            <input
              type="number"
              min={1}
              max={52}
              value={weeksAhead}
              onChange={e => setWeeksAhead(parseInt(e.target.value, 10))}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm mb-4"
            />
            <div className="flex justify-end gap-3">
              <button onClick={() => setGenerateTarget(null)} className="px-4 py-2 font-medium text-slate-600 hover:bg-slate-100 rounded-xl">
                Cancelar
              </button>
              <button
                onClick={handleGenerate}
                disabled={isPendingGenerate}
                className="px-4 py-2 font-semibold bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-2"
              >
                {isPendingGenerate && (
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                  </svg>
                )}
                {isPendingGenerate ? 'Gerando...' : 'Gerar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}