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
import { AdminEmptyState } from '@/features/core/components/AdminEmptyState';
import { AdminButton, AdminBadge } from '@/features/core/components/AdminUI';

interface EventsPageClientProps {
  initialEvents: ChurchEvent[];
  canManage: boolean;
  isSysAdmin: boolean;
}

type View = 'list' | 'detail';
type Filter = 'todos' | 'publicado' | 'rascunho' | 'encerrado';

const FILTER_LABELS: Record<Filter, string> = {
  todos: 'Todos', publicado: 'Publicados', rascunho: 'Rascunhos', encerrado: 'Encerrados',
};

const inputStyle = { background: 'var(--admin-surface-alt)', border: '1px solid var(--admin-border)' } as const;

function Spinner() {
  return (
    <div className="flex items-center justify-center py-24">
      <div className="relative w-10 h-10">
        <svg className="w-10 h-10 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-10" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
          <path className="opacity-60" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" style={{ color: 'var(--admin-accent)' }} />
        </svg>
      </div>
    </div>
  );
}

export function EventsPageClient({ initialEvents, canManage, isSysAdmin: _isSysAdmin }: EventsPageClientProps) {
  const router = useRouter();
  const [events, setEvents] = useState<ChurchEvent[]>(initialEvents);

  useEffect(() => {
    setEvents(initialEvents);
    setSelectedEvent(prev => prev ? (initialEvents.find(e => e.id === prev.id) || prev) : null);
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
  const [members, setMembers] = useState<{ id: string; full_name: string; photo_url: string | null }[]>([]);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    const ch = supabase.channel('realtime_events_page')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'events' }, () => router.refresh())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [router]);

  const filtered = events.filter(e => {
    const matchSearch = !search || e.title.toLowerCase().includes(search.toLowerCase());
    if (filter === 'todos') return matchSearch;
    if (filter === 'encerrado') return matchSearch && (e.status === 'encerrado' || e.status === 'cancelado');
    return matchSearch && e.status === filter;
  });

  const handleOpenDetail = async (event: ChurchEvent) => {
    setSelectedEvent(event); setIsLoadingDetail(true); setView('detail');
    const supabase = createClient();
    const [schedulesRes, regRes, attendRes, membersRes] = await Promise.all([
      supabase.from('event_schedules').select('*, members(full_name)').eq('event_id', event.id),
      supabase.from('event_registrations').select('*, checkin_admin:profiles!event_registrations_checkin_by_fkey(full_name, photo_url)').eq('event_id', event.id).order('created_at'),
      supabase.from('event_attendance').select('*').eq('event_id', event.id).order('checked_in_at'),
      supabase.from('members').select('id, full_name, photo_url').order('full_name'),
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
    if (!confirm('Excluir este evento? Esta ação não pode ser desfeita.')) return;
    startTransition(async () => {
      const result = await deleteEvent(selectedEvent.id);
      if (result.error) toast('error', result.error);
      else { toast('success', 'Evento excluído.'); setEvents(prev => prev.filter(e => e.id !== selectedEvent.id)); setView('list'); }
    });
  };

  // ── Detail View ─────────────────────────────────────────────────
  if (view === 'detail' && selectedEvent) {
    return (
      <div>
        {/* Back button */}
        <button
          onClick={() => setView('list')}
          className="inline-flex items-center gap-2 text-[13px] font-semibold mb-6 transition-colors duration-150"
          style={{ color: 'var(--admin-text-secondary)' }}
          onMouseEnter={e => (e.currentTarget.style.color = 'var(--admin-text-primary)')}
          onMouseLeave={e => (e.currentTarget.style.color = 'var(--admin-text-secondary)')}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Voltar para lista
        </button>

        {isLoadingDetail ? <Spinner /> : (
          <>
            {/* Event header card */}
            <div
              className="rounded-2xl p-6 md:p-8 mb-6"
              style={{ background: 'var(--admin-surface)', border: '1px solid var(--admin-border)' }}
            >
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-3 flex-wrap">
                    <AdminBadge color={selectedEvent.type === 'culto' ? 'blue' : 'purple'}>
                      {selectedEvent.type === 'culto' ? 'Culto' : 'Evento Especial'}
                    </AdminBadge>
                    {selectedEvent.is_public && <AdminBadge color="slate">Público</AdminBadge>}
                    {selectedEvent.requires_payment && (
                      <AdminBadge color="amber">
                        R$ {Number(selectedEvent.ticket_price).toFixed(2)}
                      </AdminBadge>
                    )}
                  </div>
                  <h1 className="text-2xl md:text-3xl font-bold text-slate-100 tracking-tight leading-tight mb-2">
                    {selectedEvent.title}
                  </h1>
                  {selectedEvent.description && (
                    <p className="text-sm mb-4" style={{ color: 'var(--admin-text-secondary)' }}>{selectedEvent.description}</p>
                  )}
                  <div className="flex flex-wrap gap-4 text-sm" style={{ color: 'var(--admin-text-secondary)' }}>
                    {selectedEvent.date && (
                      <span className="flex items-center gap-1.5">
                        <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        {new Date(selectedEvent.date + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                        {selectedEvent.time && ` · ${selectedEvent.time.slice(0,5)}`}
                      </span>
                    )}
                    {selectedEvent.location && (
                      <span className="flex items-center gap-1.5">
                        <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        </svg>
                        {selectedEvent.location}
                      </span>
                    )}
                  </div>
                </div>

                {canManage && (
                  <div className="flex flex-col gap-2 shrink-0">
                    <AdminButton
                      variant="secondary"
                      icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>}
                      onClick={() => { setEditingEvent(selectedEvent); setIsFormOpen(true); }}
                    >
                      Editar
                    </AdminButton>
                    {_isSysAdmin && (
                      <AdminButton
                        variant="danger"
                        loading={isPending}
                        icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>}
                        onClick={handleDelete}
                      >
                        Excluir
                      </AdminButton>
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
              onEventUpdate={updated => {
                const newData = { ...selectedEvent, ...updated };
                setSelectedEvent(newData as ChurchEvent);
                setEvents(prev => prev.map(e => e.id === newData.id ? (newData as ChurchEvent) : e));
              }}
            />
          </>
        )}

        <Sheet open={isFormOpen} onOpenChange={setIsFormOpen}>
          <SheetContent
            side="right"
            className="w-full sm:max-w-2xl overflow-y-auto p-6 sm:p-8"
            style={{ background: 'var(--admin-surface)', borderLeft: '1px solid var(--admin-border)' }}
            data-admin="true"
          >
            <SheetHeader className="mb-6 pb-4" style={{ borderBottom: '1px solid var(--admin-border)' }}>
              <SheetTitle className="text-xl font-bold text-slate-100">Editar Evento</SheetTitle>
            </SheetHeader>
            {isFormOpen && editingEvent && (
              <EventForm initialData={editingEvent} onSaved={handleSaved} onCancel={() => setIsFormOpen(false)} />
            )}
          </SheetContent>
        </Sheet>
      </div>
    );
  }

  // ── List View ────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div
        className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-4 rounded-2xl"
        style={{ background: 'var(--admin-surface)', border: '1px solid var(--admin-border)' }}
      >
        <div className="relative flex-1 w-full">
          <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-600 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Buscar evento pelo título…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full h-9 pl-9 pr-4 rounded-xl text-sm text-slate-200 placeholder-slate-600 outline-none transition-all"
            style={inputStyle}
            onFocus={e => { e.target.style.borderColor = 'rgba(37,99,235,0.5)'; e.target.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.1)'; }}
            onBlur={e => { e.target.style.borderColor = 'var(--admin-border)'; e.target.style.boxShadow = 'none'; }}
          />
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          {(Object.keys(FILTER_LABELS) as Filter[]).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className="h-8 px-3 rounded-xl text-[12px] font-semibold transition-all duration-150"
              style={filter === f
                ? { background: 'var(--admin-accent)', color: '#fff' }
                : { background: 'var(--admin-surface-alt)', color: 'var(--admin-text-secondary)', border: '1px solid var(--admin-border)' }
              }
            >
              {FILTER_LABELS[f]}
            </button>
          ))}
        </div>

        {canManage && (
          <AdminButton
            variant="primary"
            icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>}
            onClick={() => { setEditingEvent(null); setIsFormOpen(true); }}
            className="shrink-0"
          >
            Novo Evento
          </AdminButton>
        )}
      </div>

      {/* Count */}
      <p className="text-[11px] font-semibold uppercase tracking-wide px-1" style={{ color: 'var(--admin-text-secondary)' }}>
        {filtered.length} evento{filtered.length !== 1 ? 's' : ''}
        {search && ` · "${search}"`}
      </p>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div
          className="rounded-2xl"
          style={{ border: '1px dashed var(--admin-border-strong)', background: 'var(--admin-surface)' }}
        >
          <AdminEmptyState
            icon="events"
            title="Nenhum evento encontrado"
            description={search ? 'Tente outros termos de busca.' : 'Crie o primeiro evento clicando no botão acima.'}
            action={canManage && !search ? (
              <AdminButton
                variant="primary"
                icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>}
                onClick={() => { setEditingEvent(null); setIsFormOpen(true); }}
              >
                Criar evento
              </AdminButton>
            ) : undefined}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filtered.map(event => (
            <EventCard key={event.id} event={event} onClick={handleOpenDetail} />
          ))}
        </div>
      )}

      {/* Sheet */}
      <Sheet open={isFormOpen} onOpenChange={setIsFormOpen}>
        <SheetContent
          side="right"
          className="w-full sm:max-w-2xl overflow-y-auto p-6 sm:p-8"
          style={{ background: 'var(--admin-surface)', borderLeft: '1px solid var(--admin-border)' }}
          data-admin="true"
        >
          <SheetHeader className="mb-6 pb-4" style={{ borderBottom: '1px solid var(--admin-border)' }}>
            <SheetTitle className="text-xl font-bold text-slate-100">
              {editingEvent ? 'Editar Evento' : 'Novo Evento'}
            </SheetTitle>
            <p className="text-sm" style={{ color: 'var(--admin-text-secondary)' }}>Preencha as informações do evento.</p>
          </SheetHeader>
          {isFormOpen && (
            <EventForm initialData={editingEvent} onSaved={handleSaved} onCancel={() => setIsFormOpen(false)} />
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}