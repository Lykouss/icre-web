'use client'

import React from 'react';
import Image from 'next/image';
import { ChurchEvent } from '../types';

interface EventCardProps {
  event: ChurchEvent;
  onClick: (event: ChurchEvent) => void;
}

const WEEKDAYS = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];
const MONTHS   = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];

type StatusKey = 'publicado' | 'rascunho' | 'encerrado' | 'cancelado' | 'agendado';

const STATUS_CONFIG: Record<StatusKey, { label: string; color: string; bg: string; dot: string }> = {
  publicado: { label: 'Publicado', color: '#34d399', bg: 'rgba(16,185,129,0.12)', dot: '#10b981' },
  rascunho:  { label: 'Rascunho',  color: '#fcd34d', bg: 'rgba(245,158,11,0.12)', dot: '#f59e0b' },
  encerrado: { label: 'Encerrado', color: '#94a3b8', bg: 'rgba(100,116,139,0.12)', dot: '#64748b' },
  cancelado: { label: 'Cancelado', color: '#f87171', bg: 'rgba(239,68,68,0.12)', dot: '#ef4444' },
  agendado:  { label: 'Agendado',  color: '#c4b5fd', bg: 'rgba(139,92,246,0.12)', dot: '#8b5cf6' },
};

function getStatusKey(event: ChurchEvent): StatusKey {
  const now = new Date();
  if (event.status === 'cancelado') return 'cancelado';
  if (event.status === 'encerrado' || (event.expires_at && new Date(event.expires_at) < now)) return 'encerrado';
  if (event.status === 'rascunho') return 'rascunho';
  if (event.publish_at && new Date(event.publish_at) > now) return 'agendado';
  return 'publicado';
}

export function EventCard({ event, onClick }: EventCardProps) {
  const statusKey = getStatusKey(event);
  const status = STATUS_CONFIG[statusKey];
  const date = event.date ? new Date(event.date + 'T12:00:00') : null;
  const isPaid = event.requires_payment && (event.ticket_price ?? 0) > 0;
  const isEncerrado = statusKey === 'encerrado' || statusKey === 'cancelado';

  return (
    <div
      onClick={() => onClick(event)}
      className="group relative rounded-2xl overflow-hidden cursor-pointer transition-all duration-200 hover:-translate-y-1"
      style={{
        background: 'var(--admin-surface)',
        border: '1px solid var(--admin-border)',
        boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = 'rgba(37,99,235,0.35)';
        e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.4), 0 0 0 1px rgba(37,99,235,0.2)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = 'var(--admin-border)';
        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.3)';
      }}
    >
      {/* Banner */}
      <div className="relative h-36 overflow-hidden" style={{ background: 'var(--admin-surface-alt)' }}>
        {event.banner_url ? (
          <Image
            src={event.banner_url}
            alt={event.title}
            fill
            className={`object-cover transition-transform duration-500 group-hover:scale-105 ${isEncerrado ? 'opacity-50 grayscale' : ''}`}
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
            {/* Calendar SVG illustration */}
            <svg className="w-10 h-10" viewBox="0 0 48 48" fill="none">
              <rect x="6" y="10" width="36" height="30" rx="5" fill="rgba(37,99,235,0.12)" stroke="rgba(37,99,235,0.3)" strokeWidth="1.5"/>
              <rect x="6" y="10" width="36" height="10" rx="5" fill="rgba(37,99,235,0.2)" />
              <line x1="6" y1="20" x2="42" y2="20" stroke="rgba(37,99,235,0.3)" strokeWidth="1.5"/>
              <line x1="16" y1="6" x2="16" y2="14" stroke="rgba(37,99,235,0.4)" strokeWidth="2" strokeLinecap="round"/>
              <line x1="32" y1="6" x2="32" y2="14" stroke="rgba(37,99,235,0.4)" strokeWidth="2" strokeLinecap="round"/>
              {[0,1,2].map(r => [0,1,2].map(c => (
                <rect key={`${r}-${c}`} x={13+c*10} y={26+r*8} width="6" height="4" rx="1" fill="rgba(37,99,235,0.15)" />
              )))}
            </svg>
            <span className="text-[11px] font-medium" style={{ color: 'var(--admin-text-muted)' }}>Sem banner</span>
          </div>
        )}

        {/* Dark overlay at bottom for date badge readability */}
        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/70 to-transparent pointer-events-none" />

        {/* Date badge */}
        {date && (
          <div className="absolute bottom-2.5 left-3 flex items-center gap-1.5">
            <div className="bg-black/60 backdrop-blur-sm rounded-xl px-2.5 py-1.5 text-center border border-white/10">
              <p className="text-lg font-black text-white leading-none">{date.getDate().toString().padStart(2,'0')}</p>
              <p className="text-[9px] font-bold text-blue-400 uppercase tracking-wide">{MONTHS[date.getMonth()]}</p>
            </div>
          </div>
        )}

        {/* Status badge */}
        <div className="absolute top-2.5 right-2.5 flex flex-col gap-1.5 items-end">
          <span
            className="flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full"
            style={{ background: status.bg, color: status.color }}
          >
            <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: status.dot }} />
            {status.label}
          </span>
          {isPaid && (
            <span className="text-[10px] font-bold px-2.5 py-1 rounded-full" style={{ background: 'rgba(16,185,129,0.15)', color: '#34d399' }}>
              R$ {Number(event.ticket_price).toFixed(2)}
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Type chips */}
        <div className="flex items-center gap-1.5 mb-2.5 flex-wrap">
          <span
            className="text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide"
            style={event.type === 'culto'
              ? { background: 'rgba(37,99,235,0.15)', color: '#93c5fd' }
              : { background: 'rgba(139,92,246,0.15)', color: '#c4b5fd' }
            }
          >
            {event.type === 'culto' ? 'Culto' : 'Especial'}
          </span>
          {event.is_public && (
            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide" style={{ background: 'rgba(100,116,139,0.15)', color: '#94a3b8' }}>
              Público
            </span>
          )}
          {event.requires_registration && (
            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide" style={{ background: 'rgba(245,158,11,0.15)', color: '#fcd34d' }}>
              Inscrição
            </span>
          )}
        </div>

        <h3
          className="font-bold text-[13px] leading-snug mb-3 line-clamp-2 transition-colors duration-150"
          style={{ color: isEncerrado ? 'var(--admin-text-secondary)' : 'var(--admin-text-primary)' }}
        >
          {event.title}
        </h3>

        <div className="space-y-1.5">
          {date && (
            <div className="flex items-center gap-2 text-[11px]" style={{ color: 'var(--admin-text-secondary)' }}>
              <svg className="w-3 h-3 shrink-0 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {WEEKDAYS[date.getDay()]}, {date.getDate()} {MONTHS[date.getMonth()]}
              {event.time ? ` · ${event.time.slice(0,5)}` : ''}
            </div>
          )}
          {event.location && (
            <div className="flex items-center gap-2 text-[11px]" style={{ color: 'var(--admin-text-secondary)' }}>
              <svg className="w-3 h-3 shrink-0 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              </svg>
              <span className="truncate">{event.location}</span>
            </div>
          )}
          {event.capacity && (
            <div className="flex items-center gap-2 text-[11px]" style={{ color: 'var(--admin-text-secondary)' }}>
              <svg className="w-3 h-3 shrink-0 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {event.capacity} vagas
            </div>
          )}
        </div>
      </div>

      {/* Bottom accent on hover */}
      <div
        className="absolute bottom-0 left-0 right-0 h-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
        style={{ background: 'linear-gradient(90deg, var(--admin-accent), transparent)' }}
      />
    </div>
  );
}