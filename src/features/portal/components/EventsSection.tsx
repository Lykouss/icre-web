'use client'

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
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

const MONTH_SHORT = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
const WEEKDAY = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

function parseDate(dateStr: string | null) {
  if (!dateStr) return null;
  const d = new Date(dateStr + 'T00:00:00');
  return {
    day: d.getDate().toString().padStart(2, '0'),
    month: MONTH_SHORT[d.getMonth()],
    weekday: WEEKDAY[d.getDay()],
    full: d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }),
  };
}

/* ─── Alert Banner ─────────────────────────────────────────── */
function AlertBanner({ events }: { events: PublicEvent[] }) {
  const cancelledCount = events.filter(e => e.isCancelled).length;
  const specialSoon = events.find(e => e.type === 'especial' && !e.isCancelled);

  if (!cancelledCount && !specialSoon) return null;

  if (cancelledCount > 0) {
    return (
      <div className="mb-8 flex items-center gap-3 bg-red-500/10 border border-red-500/25 rounded-2xl px-5 py-4 animate-glow-red">
        <div className="shrink-0 w-8 h-8 bg-red-500/15 border border-red-500/30 rounded-xl flex items-center justify-center">
          <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <div className="flex-1">
          <p className="text-red-300 font-bold text-sm">
            {cancelledCount === 1 ? 'Um evento foi cancelado' : `${cancelledCount} eventos foram cancelados`}
          </p>
          <p className="text-red-400/70 text-xs mt-0.5">Verifique os detalhes abaixo</p>
        </div>
        <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse shrink-0" />
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
      <div className="absolute inset-0 bg-slate-900/40 dark:bg-slate-950/90 backdrop-blur-md" />
      <div
        className="relative bg-slate-50 dark:bg-slate-900 border border-black/10 dark:border-white/10 rounded-t-3xl sm:rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-modal-in"
        onClick={e => e.stopPropagation()}
      >
        {/* Header com imagem */}
        <div
          className="relative h-52 sm:h-60 bg-cover bg-center overflow-hidden"
          style={event.banner_url ? { backgroundImage: `url(${event.banner_url})` } : {}}
        >
          {/* Fundo padrão quando sem imagem */}
          {!event.banner_url && (
            <div className="absolute inset-0 bg-gradient-to-br from-blue-900 via-indigo-900 to-slate-50 dark:to-slate-900">
              <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 30% 40%, white 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
              <div className="absolute inset-0 flex items-center justify-center">
                <svg className="w-24 h-24 text-slate-900 dark:text-white/10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
          )}
          {event.banner_url && <div className="absolute inset-0 bg-gradient-to-t from-slate-50 dark:from-slate-900 via-slate-50/40 dark:via-slate-900/40 to-transparent" />}

          {/* Fechar */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 w-9 h-9 bg-black/40 hover:bg-black/70 text-white rounded-xl flex items-center justify-center transition-all duration-200 hover:scale-110 border border-white/10 backdrop-blur-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>

          {/* Badges */}
          <div className="absolute top-4 left-4 flex gap-2 flex-wrap">
            {event.type === 'especial' && (
              <span className="flex items-center gap-1 bg-amber-500/20 text-amber-600 dark:text-amber-300 border border-amber-600/30 dark:border-amber-500/40 text-[10px] font-black tracking-widest uppercase px-2.5 py-1 rounded-lg backdrop-blur-md">
                ★ Especial
              </span>
            )}
            {event.isCancelled && (
              <span className="flex items-center gap-1 bg-red-500/20 text-red-600 dark:text-red-300 border border-red-600/30 dark:border-red-500/40 text-[10px] font-black tracking-widest uppercase px-2.5 py-1 rounded-lg backdrop-blur-md">
                Cancelado
              </span>
            )}
          </div>

          {/* Título sobre a imagem */}
          <div className="absolute bottom-0 left-0 right-0 p-6">
            {date && (
              <p className="text-xs text-slate-900 dark:text-white/60 font-semibold uppercase tracking-widest mb-1.5">
                {date.weekday} · {date.full}
              </p>
            )}
            <h3 className="text-2xl font-black text-slate-900 dark:text-white leading-tight">{event.title}</h3>
          </div>
        </div>

        {/* Corpo */}
        <div className="p-6 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            {event.time && (
              <div className="flex items-center gap-3 bg-white/80 backdrop-blur-md dark:backdrop-blur-none border border-slate-200/50 dark:border-transparent dark:bg-slate-800/60 border-black/6 dark:border-white/6 rounded-2xl p-3.5">
                <div className="w-8 h-8 bg-blue-500/10 rounded-xl flex items-center justify-center shrink-0">
                  <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wide">Horário</p>
                  <p className="text-slate-600 dark:text-slate-200 font-semibold text-sm">{event.time}</p>
                </div>
              </div>
            )}
            {event.location && (
              <div className="flex items-center gap-3 bg-white/80 backdrop-blur-md dark:backdrop-blur-none border border-slate-200/50 dark:border-transparent dark:bg-slate-800/60 border-black/6 dark:border-white/6 rounded-2xl p-3.5">
                <div className="w-8 h-8 bg-emerald-500/10 rounded-xl flex items-center justify-center shrink-0">
                  <svg className="w-4 h-4 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wide">Local</p>
                  <p className="text-slate-600 dark:text-slate-200 font-semibold text-sm truncate">{event.location}</p>
                </div>
              </div>
            )}
          </div>

          {event.description && (
            <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed px-1">{event.description}</p>
          )}

          <Link
            href={`/agenda/${event.id}`}
            className="group relative flex items-center justify-center gap-2 w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-slate-900 dark:text-white font-bold rounded-2xl text-sm transition-all duration-200 hover:shadow-xl hover:shadow-blue-500/30 overflow-hidden"
          >
            <span className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 shimmer-bg" />
            <span className="relative">Tenho interesse</span>
            <svg className="relative w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
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
        className={`group relative overflow-hidden rounded-3xl cursor-pointer transition-all duration-500 ease-out border border-amber-500/20 hover:border-amber-400/50 hover:shadow-[0_0_40px_rgba(245,158,11,0.15)] hover:-translate-y-1 ${event.isCancelled ? 'opacity-60 grayscale-[40%]' : ''}`}
        style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(28px)', transitionDelay: `${index * 70}ms` }}
      >
        {/* Fundo */}
        <div className="absolute inset-0 bg-white dark:bg-slate-950" />
        <div
          className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105 will-change-transform"
          style={event.banner_url
            ? { backgroundImage: `url(${event.banner_url})` }
            : { background: 'radial-gradient(ellipse at 50% 0%, #92400e 0%, #1c1917 70%)' }
          }
        />
        <div className="absolute inset-0 bg-gradient-to-t from-white dark:from-slate-950 via-slate-50/75 dark:via-slate-950/75 to-white/10 dark:to-slate-950/10" />
        {/* Shimmer no hover */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 shimmer-bg" />

        <div className="relative p-7 sm:p-8 pt-44 flex flex-col gap-3">
          <div className="flex flex-wrap justify-between w-full items-start gap-2">
            <span className="flex items-center gap-1.5 text-xs font-black uppercase tracking-widest text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-600/30 dark:border-amber-500/25 px-3 py-1.5 rounded-full backdrop-blur-md">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>
              Evento Especial
            </span>
            {event.isCancelled && (
              <span className="flex items-center gap-1.5 text-xs font-black uppercase tracking-widest text-red-600 dark:text-red-400 bg-red-500/10 border border-red-600/30 dark:border-red-500/20 px-3 py-1.5 rounded-full backdrop-blur-md">
                Cancelado
              </span>
            )}
          </div>

          <div>
            {date && <p className="text-sm text-slate-600 dark:text-slate-300/80 font-semibold mb-1.5">{date.weekday}, {date.full}</p>}
            <h3 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-300 transition-colors duration-300 leading-tight">{event.title}</h3>
          </div>

          <div className="flex items-center gap-3 flex-wrap mt-1">
            {event.time && (
              <span className="flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-300 font-medium bg-black/25 px-3 py-1.5 rounded-xl border border-black/10 dark:border-white/10 backdrop-blur-sm">
                <svg className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                {event.time}
              </span>
            )}
            {event.location && (
              <span className="flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-300 font-medium bg-black/25 px-3 py-1.5 rounded-xl border border-black/10 dark:border-white/10 backdrop-blur-sm">
                <svg className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /></svg>
                <span className="truncate max-w-[200px]">{event.location}</span>
              </span>
            )}
          </div>

          {/* CTA inline */}
          <div className="flex items-center gap-2 mt-2 text-amber-600/70 dark:text-amber-400/70 group-hover:text-amber-600 dark:group-hover:text-amber-300 text-xs font-bold uppercase tracking-widest transition-colors duration-200">
            <span>Ver detalhes</span>
            <svg className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" /></svg>
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
        className={`group relative flex overflow-hidden rounded-2xl cursor-pointer transition-all duration-300 ease-out bg-slate-50 dark:bg-slate-900/60 border border-black/5 dark:border-white/8 hover:border-blue-500/30 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-blue-500/5 ${event.isCancelled ? 'opacity-60 grayscale-[40%]' : ''}`}
        style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(20px)', transitionDelay: `${index * 60}ms` }}
      >
        {/* Área de imagem / data */}
        <div className="relative shrink-0 w-20 sm:w-24 bg-white/80 backdrop-blur-md dark:backdrop-blur-none border border-slate-200/50 dark:border-transparent dark:bg-slate-800/80 border-r border-black/6 dark:border-white/6 flex flex-col items-center justify-center overflow-hidden">
          {event.banner_url ? (
            <>
              <Image src={event.banner_url} alt="Capa do Evento" fill sizes="96px" className="object-cover group-hover:scale-105 transition-transform duration-500 will-change-transform" />
              <div className="absolute inset-0 bg-gradient-to-r from-slate-50/50 dark:from-slate-900/50 to-slate-50/20 dark:to-slate-900/20" />
              {date && (
                <div className="relative z-10 text-center">
                  <span className="block text-2xl font-black text-slate-900 dark:text-white leading-none">{date.day}</span>
                  <span className="block text-xs font-bold text-blue-600 dark:text-blue-300 uppercase tracking-wider mt-0.5">{date.month}</span>
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center gap-1 w-full h-full">
              {date ? (
                <>
                  <span className="text-2xl font-black text-slate-900 dark:text-white leading-none">{date.day}</span>
                  <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">{date.month}</span>
                </>
              ) : (
                <svg className="w-6 h-6 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              )}
            </div>
          )}
        </div>

        {/* Conteúdo */}
        <div className="flex-1 flex items-center gap-4 px-5 py-4 min-w-0">
          <div className="flex-1 min-w-0">
            {date && <p className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider mb-1">{date.weekday}</p>}
            <h3 className="font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-300 transition-colors duration-200 truncate text-base leading-tight">{event.title}</h3>
            <div className="flex items-center gap-3 mt-1.5 flex-wrap">
              {event.isCancelled && (
                <span className="flex items-center gap-1 text-[10px] uppercase tracking-wider font-bold text-red-600 dark:text-red-400 bg-red-500/10 border border-red-600/30 dark:border-red-500/20 px-2 py-0.5 rounded-md">Cancelado</span>
              )}
              {event.time && (
                <span className="flex items-center gap-1 text-xs text-slate-500">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  {event.time}
                </span>
              )}
              {event.location && (
                <span className="flex items-center gap-1 text-xs text-slate-500 truncate">
                  <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /></svg>
                  <span className="truncate">{event.location}</span>
                </span>
              )}
            </div>
          </div>

          <svg className="w-4 h-4 text-slate-600 group-hover:text-blue-400 group-hover:translate-x-1 transition-all duration-200 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
          </svg>
        </div>

        {/* Linha de destaque no hover */}
        <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-blue-500 scale-y-0 group-hover:scale-y-100 transition-transform duration-300 origin-center" />
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
  const specialEvents = events.filter(e => e.type === 'especial');
  const regularEvents = events.filter(e => e.type !== 'especial');

  return (
    <section id="eventos" className="relative py-32 px-6 bg-white dark:bg-slate-950 overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/5 rounded-full blur-[110px]" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-indigo-600/4 rounded-full blur-[90px]" />
      </div>

      <div className="relative max-w-3xl mx-auto">
        {/* Header */}
        <div
          ref={ref}
          className="text-center mb-16 transition-all duration-700 ease-out"
          style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(24px)' }}
        >
          <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold tracking-widest uppercase px-4 py-2 rounded-full mb-6">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Agenda
          </div>
          <h2 className="text-4xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
            {content.title || 'Próximos Eventos'}
          </h2>
          {content.subtitle && <p className="mt-4 text-lg text-slate-500 dark:text-slate-400 max-w-xl mx-auto leading-relaxed">{content.subtitle}</p>}
          <p className="mt-3 text-xs text-slate-600">Clique em um evento para ver mais detalhes</p>
        </div>

        {events.length > 0 ? (
          <>
            {/* Banner de alerta */}
            <AlertBanner events={events} />

            {/* Eventos Especiais em destaque */}
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
                <div className="flex-1 h-px bg-black/5 dark:bg-white/6" />
                <span className="text-xs text-slate-600 font-semibold uppercase tracking-widest">Cultos regulares</span>
                <div className="flex-1 h-px bg-black/5 dark:bg-white/6" />
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
              style={{ opacity: visible ? 1 : 0, transitionDelay: '400ms' }}
            >
              <Link
                href="/agenda"
                className="inline-flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:text-white text-sm font-semibold border border-black/10 dark:border-white/10 hover:border-black/25 dark:hover:border-white/25 px-6 py-3 rounded-2xl hover:bg-black/5 dark:bg-white/5 transition-all duration-200"
              >
                Ver agenda completa
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
              </Link>
            </div>
          </>
        ) : (
          <div className="bg-slate-50 dark:bg-slate-900/40 border border-black/6 dark:border-white/6 border-dashed rounded-3xl p-14 text-center">
            <div className="w-16 h-16 bg-blue-500/8 border border-blue-500/15 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <svg className="w-8 h-8 text-blue-400/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-slate-500 dark:text-slate-400 font-semibold mb-2">Nenhum evento programado</p>
            <p className="text-slate-600 text-sm mb-6">Os próximos eventos aparecerão aqui assim que forem publicados no painel.</p>
            <Link
              href="/agenda"
              className="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm font-semibold border border-blue-600/30 dark:border-blue-500/20 hover:border-blue-600/50 dark:hover:border-blue-400/40 px-5 py-2.5 rounded-2xl hover:bg-blue-500/8 transition-all duration-200"
            >
              Ver agenda completa
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}