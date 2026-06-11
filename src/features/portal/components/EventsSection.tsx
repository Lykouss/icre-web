'use client'

import { useState } from 'react';
import Link from 'next/link';
import { useScrollReveal } from '@/features/core/hooks/use-scroll-reveal';
import type { EventsContent } from '@/features/portal/types';

export interface PublicEvent {
  id: string;
  title: string;
  date: string | null;
  time: string | null;
  location: string | null;
  description?: string | null;
  type?: 'culto' | 'especial';
  banner_url?: string | null;
  isCancelled?: boolean;
}

const MONTH_SHORT = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
const WEEKDAY     = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];

function parseDate(dateStr: string | null) {
  if (!dateStr) return null;
  const d = new Date(dateStr + 'T00:00:00');
  return {
    day:     d.getDate().toString().padStart(2, '0'),
    month:   MONTH_SHORT[d.getMonth()],
    weekday: WEEKDAY[d.getDay()],
    full:    d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }),
  };
}

/* ─── Alert Banner ─────────────────────────────────────────── */
function AlertBanner({ events }: { events: PublicEvent[] }) {
  const cancelledCount = events.filter(e => e.isCancelled).length;
  const specialSoon    = events.find(e => e.type === 'especial' && !e.isCancelled);

  if (!cancelledCount && !specialSoon) return null;

  if (cancelledCount > 0) {
    return (
      <div className="mb-6 flex items-center gap-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/30 rounded-xl px-5 py-4">
        <div className="shrink-0 w-8 h-8 bg-red-100 border border-red-200 dark:border-red-900/30 rounded-lg flex items-center justify-center">
          <svg className="w-4 h-4 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
          </svg>
        </div>
        <div className="flex-1">
          <p className="text-red-700 dark:text-red-300 font-bold text-sm">
            {cancelledCount === 1 ? 'Um evento foi cancelado' : `${cancelledCount} eventos foram cancelados`}
          </p>
          <p className="text-red-500 text-xs mt-0.5">Verifique os detalhes abaixo</p>
        </div>
        <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse shrink-0" />
      </div>
    );
  }

  if (specialSoon) {
    return (
      <div className="mb-6 flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-5 py-4">
        <div className="shrink-0 w-8 h-8 bg-amber-100 border border-amber-200 rounded-lg flex items-center justify-center">
          <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/>
          </svg>
        </div>
        <div className="flex-1">
          <p className="text-amber-700 font-bold text-sm">Evento Especial em destaque</p>
          <p className="text-amber-600 text-xs mt-0.5">{specialSoon.title}</p>
        </div>
        <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse shrink-0" />
      </div>
    );
  }
  return null;
}

/* ─── Modal ─────────────────────────────────────────────────── */
function EventModal({ event, onClose }: { event: PublicEvent; onClose: () => void }) {
  const date = parseDate(event.date);
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" />
      <div
        className="relative bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-t-3xl sm:rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-modal-in"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="relative h-52 sm:h-60 bg-cover bg-center overflow-hidden"
          style={event.banner_url ? { backgroundImage: `url(${event.banner_url})` } : {}}
        >
          {!event.banner_url && (
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center">
              <svg className="w-20 h-20 text-white/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
              </svg>
            </div>
          )}
          {event.banner_url && <div className="absolute inset-0 bg-gradient-to-t from-gray-900/70 via-transparent to-transparent" />}

          {/* Fechar */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 w-9 h-9 bg-white dark:bg-slate-800/90 hover:bg-white dark:hover:bg-slate-800 text-gray-700 dark:text-slate-300 rounded-xl flex items-center justify-center transition-all duration-200 shadow-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>

          {/* Badges */}
          <div className="absolute top-4 left-4 flex gap-2 flex-wrap">
            {event.type === 'especial' && (
              <span className="flex items-center gap-1 bg-amber-500 text-white text-[10px] font-black tracking-widest uppercase px-2.5 py-1 rounded-lg">
                ★ Especial
              </span>
            )}
            {event.isCancelled && (
              <span className="flex items-center gap-1 bg-red-500 text-white text-[10px] font-black tracking-widest uppercase px-2.5 py-1 rounded-lg">
                Cancelado
              </span>
            )}
          </div>

          <div className="absolute bottom-0 left-0 right-0 p-6">
            {date && (
              <p className="text-xs text-white/80 font-semibold uppercase tracking-widest mb-1.5">
                {date.weekday} · {date.full}
              </p>
            )}
            <h3 className="text-2xl font-black text-white leading-tight">{event.title}</h3>
          </div>
        </div>

        {/* Corpo */}
        <div className="p-6 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            {event.time && (
              <div className="flex items-center gap-3 bg-gray-50 dark:bg-slate-900/80 border border-gray-200 dark:border-slate-700 rounded-xl p-3.5">
                <div className="w-8 h-8 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/30 rounded-lg flex items-center justify-center shrink-0">
                  <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 dark:text-slate-500 font-bold uppercase tracking-wide">Horário</p>
                  <p className="text-gray-800 dark:text-slate-200 font-semibold text-sm">{event.time}</p>
                </div>
              </div>
            )}
            {event.location && (
              <div className="flex items-center gap-3 bg-gray-50 dark:bg-slate-900/80 border border-gray-200 dark:border-slate-700 rounded-xl p-3.5">
                <div className="w-8 h-8 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-900/30 rounded-lg flex items-center justify-center shrink-0">
                  <svg className="w-4 h-4 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] text-gray-400 dark:text-slate-500 font-bold uppercase tracking-wide">Local</p>
                  <p className="text-gray-800 dark:text-slate-200 font-semibold text-sm truncate">{event.location}</p>
                </div>
              </div>
            )}
          </div>

          {event.description && (
            <p className="text-gray-500 dark:text-slate-400 text-sm leading-relaxed px-1">{event.description}</p>
          )}

          <Link
            href={`/agenda/${event.id}`}
            className="flex items-center justify-center gap-2 w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-sm transition-all duration-200 hover:shadow-lg hover:shadow-blue-500/25"
          >
            <span>Tenho interesse</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
          </Link>
        </div>
      </div>
    </div>
  );
}

/* ─── Evento Especial Card ──────────────────────────────────── */
function SpecialEventCard({ event, index }: { event: PublicEvent; index: number }) {
  const { ref, visible } = useScrollReveal<HTMLDivElement>({ threshold: 0.06 });
  const [open, setOpen] = useState(false);
  const date = parseDate(event.date);

  return (
    <>
      <div
        ref={ref}
        onClick={() => setOpen(true)}
        className={`group relative overflow-hidden rounded-2xl cursor-pointer transition-all duration-300 ease-out border border-amber-200 hover:border-amber-300 hover:shadow-lg hover:-translate-y-0.5 ${event.isCancelled ? 'opacity-60' : ''}`}
        style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(20px)', transitionDelay: `${index * 60}ms` }}
      >
        {/* Fundo */}
        <div className="absolute inset-0 bg-amber-50" />
        <div
          className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-103"
          style={event.banner_url
            ? { backgroundImage: `url(${event.banner_url})` }
            : { background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)' }
          }
        />
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 via-gray-900/40 to-transparent" />

        <div className="relative p-7 pt-40 flex flex-col gap-2">
          <div className="flex flex-wrap justify-between w-full items-start gap-2">
            <span className="flex items-center gap-1.5 text-xs font-black uppercase tracking-widest text-amber-800 bg-amber-100 border border-amber-300 px-3 py-1.5 rounded-full">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/></svg>
              Evento Especial
            </span>
            {event.isCancelled && (
              <span className="flex items-center gap-1.5 text-xs font-black uppercase tracking-widest text-red-700 dark:text-red-300 bg-red-100 border border-red-200 dark:border-red-900/30 px-3 py-1.5 rounded-full">
                Cancelado
              </span>
            )}
          </div>

          <div>
            {date && <p className="text-sm text-white/80 font-semibold mb-1">{date.weekday}, {date.full}</p>}
            <h3 className="text-2xl sm:text-3xl font-black text-white group-hover:text-amber-200 transition-colors duration-200 leading-tight">{event.title}</h3>
          </div>

          <div className="flex items-center gap-3 flex-wrap mt-1">
            {event.time && (
              <span className="flex items-center gap-1.5 text-sm text-white/80 font-medium bg-black/30 px-3 py-1.5 rounded-lg">
                <svg className="w-3.5 h-3.5 text-amber-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                {event.time}
              </span>
            )}
            {event.location && (
              <span className="flex items-center gap-1.5 text-sm text-white/80 font-medium bg-black/30 px-3 py-1.5 rounded-lg">
                <svg className="w-3.5 h-3.5 text-amber-300 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/></svg>
                <span className="truncate max-w-[200px]">{event.location}</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 mt-1 text-amber-200 group-hover:text-white text-xs font-bold uppercase tracking-widest transition-colors duration-200">
            <span>Ver detalhes</span>
            <svg className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7"/></svg>
          </div>
        </div>
      </div>

      {open && <EventModal event={event} onClose={() => setOpen(false)} />}
    </>
  );
}

/* ─── Culto Regular Card ────────────────────────────────────── */
function EventCard({ event, index }: { event: PublicEvent; index: number }) {
  const { ref, visible } = useScrollReveal<HTMLDivElement>({ threshold: 0.06 });
  const [open, setOpen] = useState(false);
  const date = parseDate(event.date);

  return (
    <>
      <div
        ref={ref}
        onClick={() => setOpen(true)}
        className={`group relative flex overflow-hidden rounded-xl cursor-pointer transition-all duration-200 ease-out bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 hover:border-blue-300 hover:shadow-md ${event.isCancelled ? 'opacity-60' : ''}`}
        style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(16px)', transitionDelay: `${index * 50}ms` }}
      >
        {/* Barra de data */}
        <div className="relative shrink-0 w-20 sm:w-24 bg-gray-50 dark:bg-slate-900/80 border-r border-gray-200 dark:border-slate-700 flex flex-col items-center justify-center overflow-hidden">
          {event.banner_url ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={event.banner_url} alt="" className="absolute inset-0 w-full h-full object-cover" />
              <div className="absolute inset-0 bg-blue-900/60" />
              {date && (
                <div className="relative z-10 text-center">
                  <span className="block text-2xl font-black text-white leading-none">{date.day}</span>
                  <span className="block text-xs font-bold text-blue-200 uppercase tracking-wider mt-0.5">{date.month}</span>
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center gap-1 w-full h-full py-4">
              {date ? (
                <>
                  <span className="text-2xl font-black text-gray-800 dark:text-slate-200 leading-none">{date.day}</span>
                  <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">{date.month}</span>
                </>
              ) : (
                <svg className="w-5 h-5 text-gray-300 dark:text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                </svg>
              )}
            </div>
          )}
        </div>

        {/* Conteúdo */}
        <div className="flex-1 flex items-center gap-4 px-5 py-4 min-w-0">
          <div className="flex-1 min-w-0">
            {date && <p className="text-[11px] text-gray-400 dark:text-slate-500 font-semibold uppercase tracking-wider mb-1">{date.weekday}</p>}
            <h3 className="font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200 truncate text-base leading-tight">{event.title}</h3>
            <div className="flex items-center gap-3 mt-1.5 flex-wrap">
              {event.isCancelled && (
                <span className="flex items-center gap-1 text-[10px] uppercase tracking-wider font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/30 px-2 py-0.5 rounded-md">Cancelado</span>
              )}
              {event.time && (
                <span className="flex items-center gap-1 text-xs text-gray-400 dark:text-slate-500">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                  {event.time}
                </span>
              )}
              {event.location && (
                <span className="flex items-center gap-1 text-xs text-gray-400 dark:text-slate-500 truncate">
                  <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/></svg>
                  <span className="truncate">{event.location}</span>
                </span>
              )}
            </div>
          </div>

          <svg className="w-4 h-4 text-gray-300 dark:text-slate-600 group-hover:text-blue-500 group-hover:translate-x-1 transition-all duration-200 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"/>
          </svg>
        </div>

        {/* Linha de destaque azul */}
        <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-blue-600 scale-y-0 group-hover:scale-y-100 transition-transform duration-300 origin-center" />
      </div>

      {open && <EventModal event={event} onClose={() => setOpen(false)} />}
    </>
  );
}

interface Props {
  content: EventsContent;
  events: PublicEvent[];
}

export function EventsSection({ content, events }: Props) {
  const { ref, visible } = useScrollReveal({ threshold: 0.1 });
  const specialEvents  = events.filter(e => e.type === 'especial');
  const regularEvents  = events.filter(e => e.type !== 'especial');

  return (
    <section id="eventos" className="relative py-24 px-6 bg-white dark:bg-slate-800 overflow-hidden" data-theme="light">
      <div className="relative max-w-3xl mx-auto">

        {/* Header */}
        <div
          ref={ref}
          className="text-center mb-14 transition-all duration-700 ease-out"
          style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(20px)' }}
        >
          <span className="inline-block text-xs font-bold text-blue-600 dark:text-blue-400 tracking-widest uppercase bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/30 px-3 py-1.5 rounded-full mb-5">
            Agenda
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-gray-900 dark:text-white tracking-tight">
            {content.title || 'Próximos Eventos'}
          </h2>
          {content.subtitle && <p className="mt-4 text-lg text-gray-500 dark:text-slate-400 max-w-xl mx-auto leading-relaxed">{content.subtitle}</p>}
          <p className="mt-3 text-sm text-gray-400 dark:text-slate-500">Clique em um evento para ver mais detalhes</p>
        </div>

        {events.length > 0 ? (
          <>
            <AlertBanner events={events} />

            {/* Eventos Especiais */}
            {specialEvents.length > 0 && (
              <div className="space-y-4 mb-8">
                {specialEvents.map((event, i) => (
                  <SpecialEventCard key={event.id} event={event} index={i} />
                ))}
              </div>
            )}

            {/* Divisor */}
            {specialEvents.length > 0 && regularEvents.length > 0 && (
              <div className="flex items-center gap-4 mb-6">
                <div className="flex-1 h-px bg-gray-200" />
                <span className="text-xs text-gray-400 dark:text-slate-500 font-semibold uppercase tracking-widest">Cultos regulares</span>
                <div className="flex-1 h-px bg-gray-200" />
              </div>
            )}

            {/* Cultos regulares */}
            {regularEvents.length > 0 && (
              <div className="space-y-3">
                {regularEvents.map((event, i) => (
                  <EventCard key={event.id} event={event} index={i} />
                ))}
              </div>
            )}

            <div
              className="text-center mt-10 transition-all duration-700 ease-out"
              style={{ opacity: visible ? 1 : 0, transitionDelay: '350ms' }}
            >
              <Link
                href="/agenda"
                className="inline-flex items-center gap-2 text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white text-sm font-semibold border border-gray-300 dark:border-slate-600 hover:border-gray-400 px-6 py-3 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-900/80 transition-all duration-200"
              >
                Ver agenda completa
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"/></svg>
              </Link>
            </div>
          </>
        ) : (
          <div className="bg-gray-50 dark:bg-slate-900/80 border border-dashed border-gray-300 dark:border-slate-600 rounded-2xl p-14 text-center">
            <div className="w-14 h-14 bg-gray-100 dark:bg-slate-800 rounded-xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-gray-300 dark:text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
              </svg>
            </div>
            <p className="text-gray-600 dark:text-slate-400 font-semibold mb-1">Nenhum evento programado</p>
            <p className="text-gray-400 dark:text-slate-500 text-sm mb-6">Os próximos eventos aparecerão aqui assim que forem publicados no painel.</p>
            <Link
              href="/agenda"
              className="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm font-semibold border border-blue-200 dark:border-blue-900/40 hover:border-blue-300 px-5 py-2.5 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-200"
            >
              Ver agenda completa
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"/></svg>
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}