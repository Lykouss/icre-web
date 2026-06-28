'use client'

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

const WEEKDAYS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
const MONTHS = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T12:00:00');
  return `${WEEKDAYS[d.getDay()]}, ${d.getDate()} de ${MONTHS[d.getMonth()]} de ${d.getFullYear()}`;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

interface EventData {
  id: string;
  title: string;
  date: string | null;
  time: string | null;
  location: string | null;
  description: string | null;
  rules?: string | null;
  type: string;
  capacity: number | null;
  is_public: boolean;
  status: string;
  ticket_price: number | null;
  requires_registration: boolean;
  requires_payment: boolean;
  banner_url: string | null;
  max_per_account: number | null;
}

interface ExistingRegistration {
  id: string;
  status: string;
  payment_status: string;
  ticket_signature: string | null;
  event_id: string;
}

interface Props {
  event: EventData;
  spotsLeft: number | null;
  isFull: boolean;
  isAdminPreview?: boolean;
  existingRegistrations: ExistingRegistration[];
}

export function EventDetailsClient({
  event,
  spotsLeft,
  isFull,
  isAdminPreview,
  existingRegistrations,
}: Props) {
  const [rulesExpanded, setRulesExpanded] = useState(false);

  const isPaid = event.requires_payment && (event.ticket_price ?? 0) > 0;
  const needsRegistration = event.requires_registration || isPaid;
  const maxPerAccount = event.max_per_account;

  // Inscrições confirmadas ou pendentes de pagamento
  const confirmedRegistrations = existingRegistrations.filter(
    r => r.status === 'confirmado'
  );
  const pendingPaymentRegistration = existingRegistrations.find(
    r => r.status === 'pendente_pagamento'
  );
  const hasConfirmed = confirmedRegistrations.length > 0;
  const hasPendingPayment = !!pendingPaymentRegistration;

  // Atingiu o limite?
  const totalActive = existingRegistrations.filter(
    r => r.status === 'confirmado' || r.status === 'pendente_pagamento'
  ).length;
  const limitReached = maxPerAccount !== null && totalActive >= maxPerAccount;
  const canRegisterAgain = maxPerAccount === null || maxPerAccount > 1;

  return (
    <div className={`min-h-screen bg-slate-950 ${isAdminPreview ? 'pt-10' : ''}`}>
      {/* Background blobs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-blue-600/8 rounded-full blur-[140px]" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-indigo-600/6 rounded-full blur-[100px]" />
      </div>

      <div className="relative max-w-3xl mx-auto px-4 pt-28 pb-16">
        {/* Back */}
        <Link
          href="/agenda"
          className="inline-flex items-center gap-2 text-slate-400 hover:text-white text-sm font-medium transition-colors mb-8"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Voltar à agenda
        </Link>

        {/* Banner */}
        {event.banner_url && (
          <div className="relative w-full aspect-video rounded-3xl overflow-hidden mb-8 border border-white/8">
            <Image src={event.banner_url} alt={event.title} fill className="object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 to-transparent" />
          </div>
        )}

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4 flex-wrap">
            <span className={`text-xs font-bold px-3 py-1.5 rounded-full border ${
              event.type === 'culto'
                ? 'bg-blue-500/10 border-blue-500/20 text-blue-400'
                : 'bg-violet-500/10 border-violet-500/20 text-violet-400'
            }`}>
              {event.type === 'culto' ? 'Culto' : 'Evento Especial'}
            </span>
            {isPaid && (
              <span className="text-xs font-bold px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                {formatCurrency(event.ticket_price!)}
              </span>
            )}
            {isFull && needsRegistration && (
              <span className="text-xs font-bold px-3 py-1.5 rounded-full bg-red-500/10 border border-red-500/20 text-red-400">
                Lotado
              </span>
            )}
          </div>

          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight mb-4">
            {event.title}
          </h1>

          {event.description && (
            <p className="text-slate-400 leading-relaxed text-base">{event.description}</p>
          )}

          {/* Meta info */}
          <div className="flex flex-wrap gap-5 mt-6">
            {event.date && (
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <div className="w-8 h-8 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-center justify-center shrink-0">
                  <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <span className="font-medium text-slate-200">{formatDate(event.date)}{event.time && ` · ${event.time.slice(0, 5)}`}</span>
              </div>
            )}
            {event.location && (
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <div className="w-8 h-8 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-center justify-center shrink-0">
                  <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  </svg>
                </div>
                <span className="font-medium text-slate-200">{event.location}</span>
              </div>
            )}
            {spotsLeft !== null && (
              <div className="flex items-center gap-2 text-sm">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                  isFull ? 'bg-red-500/10 border border-red-500/20' : 'bg-emerald-500/10 border border-emerald-500/20'
                }`}>
                  <svg className={`w-4 h-4 ${isFull ? 'text-red-400' : 'text-emerald-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <span className={`font-semibold ${isFull ? 'text-red-400' : 'text-slate-200'}`}>
                  {isFull ? 'Evento lotado' : `${spotsLeft} vaga${spotsLeft !== 1 ? 's' : ''} disponível`}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Regras */}
        {(event.rules || event.description) && needsRegistration && (
          <div className="bg-slate-900/60 border border-white/8 rounded-2xl overflow-hidden mb-6">
            <button
              onClick={() => setRulesExpanded(v => !v)}
              className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-white/4 transition-colors"
            >
              <span className="text-sm font-bold text-slate-300 flex items-center gap-2">
                <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Regras e Termos do Evento
              </span>
              <svg className={`w-4 h-4 text-slate-500 transition-transform duration-200 ${rulesExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {rulesExpanded && (
              <div className="px-6 pb-5 text-sm text-slate-400 leading-relaxed border-t border-white/6 pt-4">
                {event.rules || event.description}
              </div>
            )}
          </div>
        )}

        {/* Card de ação */}
        <div className="bg-slate-900/60 backdrop-blur-xl border border-white/8 rounded-3xl p-8 shadow-2xl space-y-4">

          {/* --- Evento sem inscrição necessária --- */}
          {!needsRegistration && (
            <div className="text-center py-4">
              <div className="w-14 h-14 bg-blue-500/10 border border-blue-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h2 className="text-lg font-bold text-white mb-1">Evento aberto ao público</h2>
              <p className="text-slate-400 text-sm">Não é necessário fazer inscrição. Venha participar!</p>
            </div>
          )}

          {/* --- Evento lotado --- */}
          {needsRegistration && isFull && !hasConfirmed && !hasPendingPayment && (
            <div className="text-center py-4">
              <div className="w-14 h-14 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                </svg>
              </div>
              <h2 className="text-lg font-bold text-white mb-1">Evento lotado</h2>
              <p className="text-slate-400 text-sm">Fique de olho nos próximos eventos da nossa agenda.</p>
            </div>
          )}

          {/* --- Pagamento pendente --- */}
          {hasPendingPayment && (
            <div className="flex flex-col gap-3">
              <div className="flex items-start gap-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4">
                <svg className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="text-sm font-bold text-amber-300">Pagamento pendente</p>
                  <p className="text-xs text-amber-400/70 mt-0.5">Você já tem uma inscrição aguardando confirmação de pagamento.</p>
                </div>
              </div>
              <Link
                href={`/agenda/${event.id}/pagamento/${pendingPaymentRegistration!.id}`}
                className="w-full flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 text-white font-bold py-4 rounded-2xl transition-all shadow-lg shadow-amber-500/20"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
                Continuar pagamento
              </Link>
              <Link
                href="/suporte?title=Erro+no+Pagamento&description=Não+consegui+finalizar+o+pagamento+da+minha+inscrição."
                className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold py-3.5 rounded-2xl transition-all border border-white/10"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zM12 9v2m0 4h.01" />
                </svg>
                Reportar Problema
              </Link>
            </div>
          )}

          {/* --- Inscrito confirmado --- */}
          {hasConfirmed && !hasPendingPayment && (
            <div className="flex flex-col gap-3">
              <div className="flex items-start gap-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4">
                <svg className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="text-sm font-bold text-emerald-300">Você já está inscrito!</p>
                  <p className="text-xs text-emerald-400/70 mt-0.5">
                    {confirmedRegistrations.length === 1 ? 'Sua inscrição foi confirmada.' : `Você tem ${confirmedRegistrations.length} inscrições confirmadas.`}
                  </p>
                </div>
              </div>

              {/* Botão ver comprovante */}
              {confirmedRegistrations[0]?.ticket_signature && (
                <Link
                  href={`/comprovante/${confirmedRegistrations[0].id}`}
                  className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold py-3.5 rounded-2xl transition-all shadow-lg shadow-blue-500/20"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                  </svg>
                  Ver comprovante
                </Link>
              )}

              {/* Múltiplos comprovantes */}
              {confirmedRegistrations.length > 1 && (
                <Link
                  href="/minhas-inscricoes"
                  className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-white text-sm font-semibold py-3 rounded-2xl transition-all border border-white/10"
                >
                  Ver todos os comprovantes ({confirmedRegistrations.length})
                </Link>
              )}

              {/* Inscrever-se novamente (se permitido) */}
              {canRegisterAgain && !limitReached && !isFull && (
                <Link
                  href={`/agenda/${event.id}/inscrever`}
                  className="w-full flex items-center justify-center gap-2 bg-white/6 hover:bg-white/10 text-slate-300 text-sm font-semibold py-3 rounded-2xl transition-all border border-white/10"
                >
                  Inscrever-se novamente
                </Link>
              )}
            </div>
          )}

          {/* --- Sem inscrição, pode se inscrever --- */}
          {needsRegistration && !isFull && !hasConfirmed && !hasPendingPayment && (
            <Link
              href={`/agenda/${event.id}/inscrever`}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-2xl transition-all shadow-lg shadow-blue-500/20 hover:scale-[1.01]"
            >
              {isPaid ? (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                  </svg>
                  Garantir ingresso — {formatCurrency(event.ticket_price!)}
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                  Inscrever-se
                </>
              )}
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
