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

function EventModal({ event, onClose }: { event: PublicEvent; onClose: () => void }) {
  const date = parseDate(event.date);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-md" />
      <div
        className="relative bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl max-w-md w-full overflow-hidden"
        style={{ animation: 'modalIn 0.22s ease-out' }}
        onClick={e => e.stopPropagation()}
      >
        <style>{`@keyframes modalIn{from{opacity:0;transform:scale(.92) translateY(12px)}to{opacity:1;transform:scale(1) translateY(0)}}`}</style>

        {/* Header colorido */}
        <div className="relative bg-linear-to-br from-blue-600 to-indigo-700 p-8 pb-6">
          <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 70% 20%, white 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
          <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 bg-white/10 hover:bg-white/20 text-white rounded-xl flex items-center justify-center transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
          {date && (
            <div className="inline-flex items-center gap-2 bg-white/20 border border-white/25 text-white text-xs font-bold tracking-widest uppercase px-3 py-1.5 rounded-full mb-4">
              {date.weekday}, {date.full}
            </div>
          )}
          <h3 className="text-2xl font-black text-white leading-tight">{event.title}</h3>
        </div>

        <div className="p-6 space-y-4">
          {event.time && (
            <div className="flex items-center gap-3 text-sm">
              <div className="w-9 h-9 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-center justify-center shrink-0">
                <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <div>
                <p className="text-xs text-slate-500 font-semibold uppercase tracking-wide">Horário</p>
                <p className="text-slate-200 font-medium">{event.time}</p>
              </div>
            </div>
          )}
          {event.location && (
            <div className="flex items-center gap-3 text-sm">
              <div className="w-9 h-9 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-center justify-center shrink-0">
                <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              </div>
              <div>
                <p className="text-xs text-slate-500 font-semibold uppercase tracking-wide">Local</p>
                <p className="text-slate-200 font-medium">{event.location}</p>
              </div>
            </div>
          )}
          {event.description && (
            <p className="text-slate-400 text-sm leading-relaxed pt-2 border-t border-white/6">{event.description}</p>
          )}
          <div className="pt-2">
            <Link href="/contato"
              className="flex items-center justify-center gap-2 w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-2xl text-sm transition-all duration-200 hover:shadow-lg hover:shadow-blue-500/25">
              Tenho interesse
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function EventCard({ event, index }: { event: PublicEvent; index: number }) {
  const { ref, visible } = useScrollReveal<HTMLDivElement>({ threshold: 0.08 });
  const [open, setOpen] = useState(false);
  const date = parseDate(event.date);

  return (
    <>
      <div
        ref={ref}
        onClick={() => setOpen(true)}
        className="group flex items-start gap-5 bg-slate-900/60 backdrop-blur-sm border border-white/8 rounded-2xl p-5 cursor-pointer hover:border-blue-500/30 hover:-translate-y-1 transition-all duration-300 ease-out"
        style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(24px)', transitionDelay: `${index * 70}ms` }}
      >
        {/* Calendário */}
        {date ? (
          <div className="shrink-0 w-14 h-14 bg-blue-500/10 border border-blue-500/20 rounded-2xl flex flex-col items-center justify-center group-hover:bg-blue-600/20 group-hover:border-blue-500/40 transition-all duration-200">
            <span className="text-xl font-black text-white leading-none">{date.day}</span>
            <span className="text-xs font-bold text-blue-400 uppercase tracking-wide mt-0.5">{date.month}</span>
          </div>
        ) : (
          <div className="shrink-0 w-14 h-14 bg-slate-800/60 border border-white/8 rounded-2xl flex items-center justify-center">
            <svg className="w-6 h-6 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}

        <div className="flex-1 min-w-0">
          {date && <p className="text-xs text-slate-500 font-semibold mb-1">{date.weekday}</p>}
          <h3 className="font-bold text-white group-hover:text-blue-300 transition-colors duration-200 truncate">{event.title}</h3>
          <div className="flex items-center gap-3 mt-1.5 flex-wrap">
            {event.time && (
              <span className="flex items-center gap-1 text-xs text-slate-500">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                {event.time}
              </span>
            )}
            {event.location && (
              <span className="flex items-center gap-1 text-xs text-slate-500 truncate">
                <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /></svg>
                {event.location}
              </span>
            )}
          </div>
        </div>

        <svg className="w-4 h-4 text-slate-600 group-hover:text-blue-400 group-hover:translate-x-1 transition-all duration-200 shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
        </svg>
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

  return (
    <section id="eventos" className="relative py-32 px-6 bg-slate-950 overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-blue-600/5 rounded-full blur-[110px]" />
      </div>

      <div className="relative max-w-3xl mx-auto">
        <div ref={ref} className="text-center mb-16 transition-all duration-700 ease-out"
          style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(24px)' }}>
          <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold tracking-widest uppercase px-4 py-2 rounded-full mb-6">
            Agenda
          </div>
          <h2 className="text-4xl sm:text-5xl font-black text-white tracking-tight">
            {content.title || 'Próximos Eventos'}
          </h2>
          {content.subtitle && <p className="mt-4 text-lg text-slate-400 max-w-xl mx-auto">{content.subtitle}</p>}
          <p className="mt-3 text-xs text-slate-600">Clique em um evento para ver mais detalhes</p>
        </div>

        {events.length > 0 ? (
          <>
            <div className="space-y-3">
              {events.map((event, i) => <EventCard key={event.id} event={event} index={i} />)}
            </div>
            <div className="text-center mt-10 transition-all duration-700 ease-out"
              style={{ opacity: visible ? 1 : 0, transitionDelay: '400ms' }}>
              <Link href="/agenda"
                className="inline-flex items-center gap-2 text-slate-400 hover:text-white text-sm font-semibold border border-white/10 hover:border-white/25 px-6 py-3 rounded-2xl hover:bg-white/5 transition-all duration-200">
                Ver agenda completa
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
              </Link>
            </div>
          </>
        ) : (
          <div className="bg-slate-900/40 border border-white/6 border-dashed rounded-3xl p-12 text-center">
            <div className="w-16 h-16 bg-blue-500/10 border border-blue-500/15 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <svg className="w-8 h-8 text-blue-400/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-slate-400 font-semibold mb-2">Nenhum evento programado</p>
            <p className="text-slate-600 text-sm">Os próximos eventos aparecerão aqui assim que forem publicados no painel.</p>
            <div className="mt-6">
              <Link href="/agenda"
                className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 text-sm font-semibold border border-blue-500/20 hover:border-blue-400/40 px-5 py-2.5 rounded-2xl hover:bg-blue-500/8 transition-all duration-200">
                Ver agenda completa
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
              </Link>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}