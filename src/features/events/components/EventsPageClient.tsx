'use client'

import React, { useState, useEffect } from 'react';
import { ChurchEvent } from '../types';
import { EventCard } from './EventCard';
import { EventForm } from './EventForm';
import { EventDetailClient } from './EventDetailClient';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import type { EventSchedule, EventRegistration, EventAttendance } from '../types';
import { deleteEvent } from '../actions/events';
import { useToast } from '@/features/core/components/ToastContext';
import { useTransition } from 'react';

interface EventsPageClientProps {
  initialEvents: ChurchEvent[];
  canManage: boolean;
  isSysAdmin: boolean;
}

type View = 'list' | 'detail';
type Filter = 'todos' | 'publicado' | 'rascunho' | 'encerrado';

const FILTER_LABELS: Record<Filter, string> = {
  todos:     'Todos',
  publicado: 'Publicados',
  rascunho:  'Rascunhos',
  encerrado: 'Encerrados',
};

export function EventsPageClient({ initialEvents, canManage, isSysAdmin: _isSysAdmin }: EventsPageClientProps) {
  const router = useRouter();
  const [events, setEvents] = useState<ChurchEvent[]>(initialEvents);
  
  useEffect(() => {
    setEvents(initialEvents);
    setSelectedEvent(prev => {
      if (!prev) return null;
      return initialEvents.find(e => e.id === prev.id) || prev;
    });
  }, [initialEvents]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<Filter>('todos');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<ChurchEvent | null>(null);
  
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  const [view, setView] = useState<View>('list');
  const [selectedEvent, setSelectedEvent] = useState<ChurchEvent | null>(null);
  const [schedules, setSchedules] = useState<EventSchedule[]>([]);
  const [registrations, setRegistrations] = useState<EventRegistration[]>([]);
  const [attendance, setAttendance] = useState<EventAttendance[]>([]);
  const [members, setMembers] = useState<{ id: string; full_name: string }[]>([]);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel('realtime_events_page')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'events' }, () => router.refresh())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [router]);

  const filtered = events.filter(e => {
    const matchSearch = !search || e.title.toLowerCase().includes(search.toLowerCase());
    if (filter === 'todos') return matchSearch;
    if (filter === 'encerrado') return matchSearch && (e.status === 'encerrado' || e.status === 'cancelado');
    return matchSearch && e.status === filter;
  });

  const handleOpenDetail = async (event: ChurchEvent) => {
    setSelectedEvent(event);
    setIsLoadingDetail(true);
    setView('detail');

    const supabase = createClient();
    const [schedulesRes, regRes, attendRes, membersRes] = await Promise.all([
      supabase.from('event_schedules').select('*, members(full_name)').eq('event_id', event.id),
      supabase.from('event_registrations').select('*').eq('event_id', event.id).order('created_at'),
      supabase.from('event_attendance').select('*').eq('event_id', event.id).order('checked_in_at'),
      supabase.from('members').select('id, full_name').eq('status', 'Membro').order('full_name'),
    ]);

    setSchedules((schedulesRes.data ?? []) as EventSchedule[]);
    setRegistrations((regRes.data ?? []) as EventRegistration[]);
    setAttendance((attendRes.data ?? []) as EventAttendance[]);
    setMembers(membersRes.data ?? []);
    setIsLoadingDetail(false);
  };

  const handleSaved = (saved: ChurchEvent) => {
    setEvents(prev => {
      const exists = prev.find(e => e.id === saved.id);
      return exists ? prev.map(e => e.id === saved.id ? saved : e) : [saved, ...prev];
    });
    if (selectedEvent?.id === saved.id) setSelectedEvent(saved);
    setIsFormOpen(false);
  };

  const handleDelete = () => {
    if (!selectedEvent) return;
    if (!confirm('Você tem certeza que deseja excluir este evento? Esta ação não pode ser desfeita.')) return;
    
    startTransition(async () => {
      const result = await deleteEvent(selectedEvent.id);
      if (result.error) toast('error', result.error);
      else {
        toast('success', 'Evento excluído com sucesso.');
        setEvents(prev => prev.filter(e => e.id !== selectedEvent.id));
        setView('list');
      }
    });
  };

  // ── VISÃO DETALHE ─────────────────────────────────────────────

  if (view === 'detail' && selectedEvent) {
    return (
      <div>
        <button
          onClick={() => setView('list')}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-900 mb-6 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Voltar para lista
        </button>

        {isLoadingDetail ? (
          <div className="flex items-center justify-center py-20">
            <svg className="w-6 h-6 animate-spin text-blue-500" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
            </svg>
          </div>
        ) : (
          <>
            {/* Header do evento */}
            <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-sm mb-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
                      selectedEvent.type === 'culto' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                    }`}>
                      {selectedEvent.type === 'culto' ? 'Culto' : 'Evento Especial'}
                    </span>
                    {selectedEvent.is_public && (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700">
                        Público
                      </span>
                    )}
                    {selectedEvent.requires_payment && (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700">
                        Pago · R$ {Number(selectedEvent.ticket_price).toFixed(2)}
                      </span>
                    )}
                  </div>
                  <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">{selectedEvent.title}</h1>
                  {selectedEvent.description && (
                    <p className="text-slate-500 mt-2 text-sm">{selectedEvent.description}</p>
                  )}
                  <div className="flex flex-wrap gap-4 mt-4 text-sm text-slate-600">
                    {selectedEvent.date && (
                      <span className="flex items-center gap-1.5">
                        <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        {new Date(selectedEvent.date + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                        {selectedEvent.time && ` · ${selectedEvent.time.slice(0, 5)}`}
                      </span>
                    )}
                    {selectedEvent.location && (
                      <span className="flex items-center gap-1.5">
                        <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        </svg>
                        {selectedEvent.location}
                      </span>
                    )}
                  </div>
                </div>
                {canManage && (
                  <div className="flex flex-col gap-2 shrink-0">
                    <button
                      onClick={() => { setEditingEvent(selectedEvent); setIsFormOpen(true); }}
                      className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 text-sm font-semibold rounded-xl transition-all shadow-sm"
                    >
                      <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Editar
                    </button>
                    {_isSysAdmin && (
                      <button
                        onClick={handleDelete}
                        disabled={isPending}
                        className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 text-sm font-semibold rounded-xl transition-all disabled:opacity-50"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Excluir
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

            <EventDetailClient
              event={selectedEvent}
              schedules={schedules}
              registrations={registrations}
              attendance={attendance}
              members={members}
              canManage={canManage}
              onEdit={() => { setEditingEvent(selectedEvent); setIsFormOpen(true); }}
              onEventUpdate={(updated) => {
                const newData = { ...selectedEvent, ...updated };
                setSelectedEvent(newData as ChurchEvent);
                setEvents(prev => prev.map(e => e.id === newData.id ? (newData as ChurchEvent) : e));
              }}
            />
          </>
        )}

        <Sheet open={isFormOpen} onOpenChange={setIsFormOpen}>
          <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto bg-white border-l border-slate-100 p-6 sm:p-8">
            <SheetHeader className="mb-6 border-b border-slate-100 pb-4">
              <SheetTitle className="text-xl font-bold text-slate-900">Editar Evento</SheetTitle>
            </SheetHeader>
            {isFormOpen && editingEvent && (
              <EventForm initialData={editingEvent} onSaved={handleSaved} onCancel={() => setIsFormOpen(false)} />
            )}
          </SheetContent>
        </Sheet>
      </div>
    );
  }

  // ── VISÃO LISTA ───────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="relative flex-1 w-full">
          <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Buscar evento pelo título..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm placeholder-slate-400 transition-all"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {(Object.keys(FILTER_LABELS) as Filter[]).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
                filter === f
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {FILTER_LABELS[f]}
            </button>
          ))}
        </div>

        {canManage && (
          <button
            onClick={() => { setEditingEvent(null); setIsFormOpen(true); }}
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-blue-700 transition-colors shadow-sm text-sm shrink-0"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
            Novo Evento
          </button>
        )}
      </div>

      {/* Contagem */}
      <p className="text-xs text-slate-400 font-medium px-1">
        {filtered.length} evento{filtered.length !== 1 ? 's' : ''}
        {search && ` · buscando por "${search}"`}
      </p>

      {/* Grid */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filtered.map(event => (
            <EventCard key={event.id} event={event} onClick={handleOpenDetail} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 bg-slate-50 rounded-2xl border border-slate-200 border-dashed">
          <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center border border-slate-200 shadow-sm mb-4">
            <svg className="w-7 h-7 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <p className="font-semibold text-slate-600 mb-1">Nenhum evento encontrado</p>
          <p className="text-slate-400 text-sm text-center max-w-xs">
            {search ? 'Tente outros termos de busca.' : 'Crie o primeiro evento clicando no botão acima.'}
          </p>
        </div>
      )}

      {/* Sheet de criação/edição */}
      <Sheet open={isFormOpen} onOpenChange={setIsFormOpen}>
        <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto bg-white border-l border-slate-100 p-6 sm:p-8">
          <SheetHeader className="mb-6 border-b border-slate-100 pb-4">
            <SheetTitle className="text-xl font-bold text-slate-900">
              {editingEvent ? 'Editar Evento' : 'Novo Evento'}
            </SheetTitle>
            <p className="text-sm text-slate-500 mt-1">Preencha as informações do evento.</p>
          </SheetHeader>
          {isFormOpen && (
            <EventForm initialData={editingEvent} onSaved={handleSaved} onCancel={() => setIsFormOpen(false)} />
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}