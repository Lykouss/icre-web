'use client'

import React from 'react';
import Image from 'next/image';
import { ChurchEvent } from '../types';

interface EventCardProps {
  event: ChurchEvent;
  onClick: (event: ChurchEvent) => void;
}

const WEEKDAYS_SHORT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const MONTHS_SHORT = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

function getStatusConfig(event: ChurchEvent): { label: string; cls: string } {
  const now = new Date();
  const isExpired = event.expires_at ? new Date(event.expires_at) < now : false;

  if (event.status === 'cancelado') return { label: 'Cancelado', cls: 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-red-200 dark:border-red-900/30' };
  if (event.status === 'encerrado' || isExpired) return { label: 'Encerrado', cls: 'bg-slate-100 text-slate-500 border-slate-200' };
  if (event.status === 'rascunho') return { label: 'Rascunho', cls: 'bg-amber-50 text-amber-600 border-amber-200' };
  if (event.publish_at && new Date(event.publish_at) > now) return { label: 'Agendado', cls: 'bg-violet-50 text-violet-600 border-violet-200' };
  return { label: 'Publicado', cls: 'bg-green-50 text-green-600 border-green-200' };
}

export function EventCard({ event, onClick }: EventCardProps) {
  const status = getStatusConfig(event);
  const date = event.date ? new Date(event.date + 'T12:00:00') : null;
  const isPaid = event.requires_payment && (event.ticket_price ?? 0) > 0;

  return (
    <div
      onClick={() => onClick(event)}
      className="group bg-white dark:bg-slate-800 border border-slate-200 rounded-2xl overflow-hidden cursor-pointer hover:border-blue-300 hover:shadow-lg hover:shadow-slate-200/80 transition-all duration-200"
    >
      {/* Banner */}
      <div className="relative h-40 bg-slate-50 border-b border-slate-100 overflow-hidden">
        {event.banner_url ? (
          <Image
            src={event.banner_url}
            alt={event.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
            <svg className="w-10 h-10 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="text-xs font-medium text-slate-400">Sem banner</span>
          </div>
        )}

        {/* Data flutuante */}
        {date && (
          <div className="absolute bottom-3 left-3">
            <div className="bg-white dark:bg-slate-800/90 backdrop-blur-sm border border-slate-200 rounded-xl px-3 py-1.5 text-center shadow-sm">
              <p className="text-base font-black text-slate-900 leading-none">{date.getDate().toString().padStart(2, '0')}</p>
              <p className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase">{MONTHS_SHORT[date.getMonth()]}</p>
            </div>
          </div>
        )}

        {/* Badges */}
        <div className="absolute top-2 right-2 flex flex-col gap-1.5 items-end">
          <span className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border ${status.cls}`}>
            {status.label}
          </span>
          {isPaid && (
            <span className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-900/40 text-emerald-700 dark:text-emerald-300">
              R$ {Number(event.ticket_price).toFixed(2)}
            </span>
          )}
        </div>
      </div>

      {/* Conteúdo */}
      <div className="p-4">
        <div className="flex items-center gap-1.5 mb-2 flex-wrap">
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
            event.type === 'culto' ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300' : 'bg-purple-100 text-purple-700'
          }`}>
            {event.type === 'culto' ? 'Culto' : 'Especial'}
          </span>
          {event.is_public && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-500">
              Público
            </span>
          )}
          {event.requires_registration && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-500">
              Inscrição
            </span>
          )}
        </div>

        <h3 className="font-bold text-slate-900 text-sm leading-snug mb-3 group-hover:text-blue-700 dark:group-hover:text-blue-300 transition-colors line-clamp-2">
          {event.title}
        </h3>

        <div className="space-y-1.5">
          {date && (
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <svg className="w-3 h-3 shrink-0 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>{WEEKDAYS_SHORT[date.getDay()]}, {date.getDate()} {MONTHS_SHORT[date.getMonth()]}{event.time ? ` · ${event.time.slice(0, 5)}` : ''}</span>
            </div>
          )}
          {event.location && (
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <svg className="w-3 h-3 shrink-0 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              </svg>
              <span className="truncate">{event.location}</span>
            </div>
          )}
          {event.capacity && (
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <svg className="w-3 h-3 shrink-0 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>{event.capacity} vagas</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}