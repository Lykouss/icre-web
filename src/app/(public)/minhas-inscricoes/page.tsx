import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import React from 'react';

export const revalidate = 0;
export const metadata = { title: 'Minhas Inscrições — ICRE' };

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  asaas_pix: 'PIX',
  asaas_boleto: 'Boleto',
  pix: 'PIX',
  cartao: 'Cartão',
  dinheiro: 'Dinheiro',
  cortesia: 'Cortesia',
  gift: 'Cortesia',
};

export default async function MinhasInscricoesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?returnTo=/minhas-inscricoes');
  }

  const { data: memberData } = await supabase
    .from('members')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle();

  const memberId = memberData?.id;

  const { data: registrationsByMemberId } = memberId ? await supabase
    .from('event_registrations')
    .select(`
      id, status, payment_status, payment_method, ticket_signature, event_id,
      events ( id, title, date, time, location, banner_url, type )
    `)
    .eq('member_id', memberId)
    .order('created_at', { ascending: false }) : { data: [] };

  const { data: registrationsByEmail } = user.email
    ? await supabase
        .from('event_registrations')
        .select(`
          id, status, payment_status, payment_method, ticket_signature, event_id,
          events ( id, title, date, time, location, banner_url, type )
        `)
        .eq('email', user.email)
        .is('member_id', null)
        .order('created_at', { ascending: false })
    : { data: [] };

  const allRegs = [...(registrationsByMemberId ?? []), ...(registrationsByEmail ?? [])];
  const seen = new Set<string>();
  const registrations = allRegs.filter(r => { if (seen.has(r.id)) return false; seen.add(r.id); return true; });

  const confirmed = registrations.filter(r => r.status === 'confirmado');
  const pending   = registrations.filter(r => r.status === 'pendente_pagamento');
  const cancelled = registrations.filter(r => r.status === 'cancelado');
  const hasAny    = registrations.length > 0;

  return (
    <div className="min-h-screen bg-slate-950 pt-28 pb-20 px-4">
      {/* Background glows */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-blue-700/5 rounded-full blur-[140px]" />
        <div className="absolute bottom-1/3 right-0 w-[400px] h-[300px] bg-indigo-700/4 rounded-full blur-[100px]" />
      </div>

      <div className="relative max-w-4xl mx-auto">

        {/* ── Cabeçalho da seção ── */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-1 h-6 bg-blue-500 rounded-full" />
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-[0.18em]">Portal ICRE</p>
          </div>
          <h1 className="text-3xl font-black text-white mb-2">Minhas Inscrições</h1>
          <p className="text-slate-400 text-sm">Seus ingressos e histórico de participação em eventos da ICRE.</p>
        </div>

        {/* ── Stats bar (quando há inscrições) ── */}
        {hasAny && (
          <div className="grid grid-cols-3 gap-3 mb-10">
            <StatCard
              value={confirmed.length}
              label="Confirmadas"
              color="emerald"
              icon={
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                </svg>
              }
            />
            <StatCard
              value={pending.length}
              label="Aguardando"
              color="amber"
              icon={
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
            />
            <StatCard
              value={cancelled.length}
              label="Canceladas"
              color="slate"
              icon={
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              }
            />
          </div>
        )}

        {/* ── Estado vazio ── */}
        {!hasAny && (
          <div className="bg-slate-900/50 border border-white/6 rounded-2xl p-16 text-center">
            <div className="w-16 h-16 bg-slate-800/80 border border-white/8 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <svg className="w-8 h-8 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
              </svg>
            </div>
            <h2 className="text-lg font-bold text-white mb-2">Nenhuma inscrição encontrada</h2>
            <p className="text-slate-500 text-sm mb-8 max-w-sm mx-auto">
              Você ainda não se inscreveu em nenhum evento. Confira nossa agenda e garanta sua vaga!
            </p>
            <Link
              href="/agenda"
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold px-6 py-3 rounded-xl transition-all shadow-lg shadow-blue-500/20"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Ver agenda de eventos
            </Link>
          </div>
        )}

        {hasAny && (
          <div className="space-y-10">

            {/* ── Pendentes de pagamento ── */}
            {pending.length > 0 && (
              <section>
                <SectionHeader
                  color="amber"
                  label="Aguardando Pagamento"
                  count={pending.length}
                  dot
                />
                <div className="grid gap-3">
                  {pending.map(reg => {
                    const event = reg.events as unknown as EventShape | null;
                    if (!event) return null;
                    return (
                      <RegistrationCard
                        key={reg.id}
                        reg={reg}
                        event={event}
                        variant="pending"
                      />
                    );
                  })}
                </div>
              </section>
            )}

            {/* ── Confirmadas ── */}
            {confirmed.length > 0 && (
              <section>
                <SectionHeader
                  color="emerald"
                  label="Confirmadas"
                  count={confirmed.length}
                />
                <div className="grid gap-3">
                  {confirmed.map(reg => {
                    const event = reg.events as unknown as EventShape | null;
                    if (!event) return null;
                    return (
                      <RegistrationCard
                        key={reg.id}
                        reg={reg}
                        event={event}
                        variant="confirmed"
                      />
                    );
                  })}
                </div>
              </section>
            )}

            {/* ── Canceladas ── */}
            {cancelled.length > 0 && (
              <section>
                <SectionHeader
                  color="slate"
                  label="Canceladas"
                  count={cancelled.length}
                />
                <div className="grid gap-3">
                  {cancelled.map(reg => {
                    const event = reg.events as unknown as EventShape | null;
                    if (!event) return null;
                    return (
                      <RegistrationCard
                        key={reg.id}
                        reg={reg}
                        event={event}
                        variant="cancelled"
                      />
                    );
                  })}
                </div>
              </section>
            )}

          </div>
        )}
      </div>
    </div>
  );
}

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface EventShape {
  id: string;
  title: string;
  date: string | null;
  time: string | null;
  location: string | null;
  banner_url: string | null;
  type: string | null;
}

interface RegShape {
  id: string;
  status: string;
  payment_status: string;
  payment_method: string | null;
  ticket_signature: string | null;
  event_id: string;
}

// ─── Componente: StatCard ─────────────────────────────────────────────────────

function StatCard({
  value, label, color, icon,
}: {
  value: number;
  label: string;
  color: 'emerald' | 'amber' | 'slate';
  icon: React.ReactNode;
}) {
  const colors = {
    emerald: 'bg-emerald-500/8 border-emerald-500/15 text-emerald-400',
    amber:   'bg-amber-500/8 border-amber-500/15 text-amber-400',
    slate:   'bg-slate-800/60 border-white/6 text-slate-500',
  };
  const numColors = {
    emerald: 'text-emerald-300',
    amber:   'text-amber-300',
    slate:   'text-slate-400',
  };
  return (
    <div className={`rounded-xl border px-4 py-4 ${colors[color]}`}>
      <div className="flex items-center gap-2 mb-2 opacity-70">
        {icon}
        <p className="text-[10px] font-bold uppercase tracking-widest">{label}</p>
      </div>
      <p className={`text-2xl font-black ${numColors[color]}`}>{value}</p>
    </div>
  );
}

// ─── Componente: SectionHeader ───────────────────────────────────────────────

function SectionHeader({
  color, label, count, dot,
}: {
  color: 'emerald' | 'amber' | 'slate';
  label: string;
  count: number;
  dot?: boolean;
}) {
  const dotColors = { emerald: 'bg-emerald-400', amber: 'bg-amber-400 animate-pulse', slate: 'bg-slate-600' };
  const textColors = { emerald: 'text-emerald-400', amber: 'text-amber-400', slate: 'text-slate-500' };
  const badgeColors = {
    emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    amber:   'bg-amber-500/10 text-amber-400 border-amber-500/20',
    slate:   'bg-slate-800 text-slate-500 border-white/6',
  };
  return (
    <div className="flex items-center gap-2.5 mb-4">
      <div className={`w-2 h-2 rounded-full ${dotColors[color]}`} />
      <h2 className={`text-xs font-black uppercase tracking-[0.15em] ${textColors[color]}`}>{label}</h2>
      <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${badgeColors[color]}`}>{count}</span>
    </div>
  );
}

// ─── Componente: RegistrationCard ────────────────────────────────────────────

function RegistrationCard({
  reg, event, variant,
}: {
  reg: RegShape;
  event: EventShape;
  variant: 'confirmed' | 'pending' | 'cancelled';
}) {
  const formattedDate = event.date
    ? format(new Date(event.date + 'T12:00:00'), "dd 'de' MMMM", { locale: ptBR })
    : null;

  const isCancelled = variant === 'cancelled';

  const cardStyles = {
    confirmed: 'bg-slate-900/60 border-white/8 hover:border-white/14 hover:bg-slate-900/80',
    pending:   'bg-amber-500/4 border-amber-500/12 hover:border-amber-500/20',
    cancelled: 'bg-slate-900/30 border-white/5 opacity-55',
  };

  return (
    <div className={`border rounded-xl transition-all duration-200 ${cardStyles[variant]}`}>
      <div className="p-5 flex flex-col md:flex-row gap-4 items-start md:items-center">

        {/* Ícone do evento */}
        <EventTypeIcon type={event.type ?? ''} variant={variant} />

        {/* Informações */}
        <div className="flex-1 min-w-0">
          <h3 className={`text-sm font-bold mb-1.5 truncate ${isCancelled ? 'text-slate-500 line-through' : 'text-white'}`}>
            {event.title}
          </h3>
          <div className="flex flex-wrap gap-3">
            {formattedDate && !isCancelled && (
              <span className="flex items-center gap-1.5 text-xs text-slate-500">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {formattedDate}{event.time ? ` · ${event.time.slice(0, 5)}` : ''}
              </span>
            )}
            {event.location && !isCancelled && (
              <span className="flex items-center gap-1.5 text-xs text-slate-500">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                </svg>
                {event.location}
              </span>
            )}
            {reg.payment_method && !isCancelled && (
              <span className="flex items-center gap-1.5 text-xs text-slate-600">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
                {PAYMENT_METHOD_LABELS[reg.payment_method] ?? reg.payment_method}
              </span>
            )}
          </div>
        </div>

        {/* Ações e status */}
        <div className="flex items-center gap-2.5 w-full md:w-auto shrink-0 flex-wrap">
          {variant === 'confirmed' && (
            <>
              <StatusBadge color="emerald" label="✓ Confirmado" />
              {reg.ticket_signature && (
                <Link
                  href={`/comprovante/${reg.id}`}
                  className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-3.5 py-2 rounded-lg transition-all shadow-md shadow-blue-500/15 whitespace-nowrap"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                  </svg>
                  Ver ingresso
                </Link>
              )}
            </>
          )}

          {variant === 'pending' && (
            <>
              <StatusBadge color="amber" label="Aguardando" />
              <Link
                href={`/agenda/${reg.event_id}/pagamento/${reg.id}`}
                className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 text-white text-xs font-bold px-3.5 py-2 rounded-lg transition-all shadow-md shadow-amber-500/20 whitespace-nowrap"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                </svg>
                Pagar agora
              </Link>
            </>
          )}

          {variant === 'cancelled' && (
            <div className="flex flex-col md:items-end gap-1">
              <StatusBadge color="slate" label={reg.payment_status === 'expirado' ? 'Cancelada (Expirou)' : 'Cancelada'} />
              {reg.payment_status === 'expirado' && (
                <p className="text-[10px] text-slate-500 font-medium">Tempo limite de pagamento esgotado.</p>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

// ─── Componente: EventTypeIcon ──────────────────────────────────────────────

function EventTypeIcon({
  type,
  variant,
}: {
  type: string;
  variant: 'confirmed' | 'pending' | 'cancelled';
}) {
  const bgStyles = {
    confirmed: 'bg-slate-800/80 border border-white/8',
    pending:   'bg-amber-500/10 border border-amber-500/15',
    cancelled: 'bg-slate-800/40 border border-white/5',
  };

  const isCulto = type === 'culto' || type === 'culto_especial';

  return (
    <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${bgStyles[variant]}`}>
      {isCulto ? (
        // Ilustração: cruz/culto
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <rect x="10" y="2" width="4" height="20" rx="1.5" fill={variant === 'pending' ? '#f59e0b' : variant === 'cancelled' ? '#475569' : '#60a5fa'} opacity="0.9"/>
          <rect x="4" y="8" width="16" height="4" rx="1.5" fill={variant === 'pending' ? '#f59e0b' : variant === 'cancelled' ? '#475569' : '#60a5fa'} opacity="0.9"/>
        </svg>
      ) : (
        // Ilustração: ingresso/evento
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <path
            d="M4 8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v1a2 2 0 0 0 0 4v1a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-1a2 2 0 0 0 0-4V8z"
            fill={variant === 'pending' ? '#f59e0b' : variant === 'cancelled' ? '#475569' : '#818cf8'}
            opacity="0.85"
          />
          <line x1="9" y1="6" x2="9" y2="18" stroke={variant === 'cancelled' ? '#334155' : '#0f172a'} strokeWidth="1.5" strokeDasharray="2 2"/>
        </svg>
      )}
    </div>
  );
}

// ─── Componente: StatusBadge ──────────────────────────────────────────────────

function StatusBadge({
  color, label,
}: {
  color: 'emerald' | 'amber' | 'slate';
  label: string;
}) {
  const styles = {
    emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    amber:   'bg-amber-500/10 text-amber-400 border-amber-500/20',
    slate:   'bg-slate-800 text-slate-500 border-white/6',
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold border whitespace-nowrap ${styles[color]}`}>
      {label}
    </span>
  );
}
