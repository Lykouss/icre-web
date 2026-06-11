import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { TicketIcon, CalendarIcon, MapPinIcon, ClockIcon } from 'lucide-react';

export const revalidate = 0;
export const metadata = { title: 'Minhas Inscrições — ICRE' };

export default async function MinhasInscricoesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?returnTo=/minhas-inscricoes');
  }

  // ─── Buscar inscrições do usuário ────────────────────────────────────────────
  // Precisamos buscar o member_id da tabela members que corresponde a este usuário
  const { data: memberData } = await supabase
    .from('members')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle();

  const memberId = memberData?.id;

  const { data: registrationsByMemberId } = memberId ? await supabase
    .from('event_registrations')
    .select(`
      id,
      status,
      payment_status,
      payment_method,
      ticket_signature,
      event_id,
      events (
        id,
        title,
        date,
        time,
        location,
        banner_url
      )
    `)
    .eq('member_id', memberId)
    .order('created_at', { ascending: false }) : { data: [] };

  // Fallback: buscar por email (para inscrições onde o usuário não estava logado)
  const { data: registrationsByEmail } = user.email
    ? await supabase
        .from('event_registrations')
        .select(`
          id,
          status,
          payment_status,
          payment_method,
          ticket_signature,
          event_id,
          events (
            id,
            title,
            date,
            time,
            location,
            banner_url
          )
        `)
        .eq('email', user.email)
        .is('member_id', null)
        .order('created_at', { ascending: false })
    : { data: [] };

  // Combinar e desduplicar por id
  const allRegs = [...(registrationsByMemberId ?? []), ...(registrationsByEmail ?? [])];
  const seen = new Set<string>();
  const registrations = allRegs.filter(r => { if (seen.has(r.id)) return false; seen.add(r.id); return true; });


  const confirmed = registrations.filter(r => r.status === 'confirmado');
  const pending = registrations.filter(r => r.status === 'pendente_pagamento');
  const cancelled = registrations.filter(r => r.status === 'cancelado');
  const hasAny = registrations.length > 0;

  return (
    <div className="min-h-screen bg-gray-50 pt-28 pb-16 px-4">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-blue-50/80 rounded-full blur-[120px]" />
      </div>

      <div className="relative max-w-4xl mx-auto">
        <div className="mb-10">
          <h1 className="text-3xl font-black text-gray-900 mb-2">Minhas Inscrições</h1>
          <p className="text-gray-500 font-medium">Acompanhe seus ingressos e histórico de participação em eventos.</p>
        </div>

        {!hasAny ? (
          <div className="bg-white border border-gray-200 rounded-3xl p-12 text-center shadow-sm">
            <TicketIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">Nenhuma inscrição encontrada</h2>
            <p className="text-gray-500 font-medium mb-6">Você ainda não se inscreveu em nenhum evento.</p>
            <Link href="/agenda" className="inline-flex bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-3 rounded-xl transition-all shadow-md shadow-blue-500/20">
              Ver agenda de eventos
            </Link>
          </div>
        ) : (
          <div className="space-y-8">

            {/* Pendentes de pagamento */}
            {pending.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                  <h2 className="text-sm font-bold text-amber-700 uppercase tracking-widest">Aguardando pagamento</h2>
                  <span className="bg-amber-50 text-amber-700 text-xs font-bold px-2 py-0.5 rounded-full border border-amber-200">{pending.length}</span>
                </div>
                <div className="grid gap-3">
                  {pending.map((reg) => {
                    const event = reg.events as any;
                    if (!event) return null;
                    return (
                      <div key={reg.id} className="bg-white border border-amber-200 rounded-2xl p-5 flex flex-col md:flex-row gap-4 items-start md:items-center shadow-sm">
                        <div className="flex-1">
                          <h3 className="text-base font-bold text-gray-900 mb-2">{event.title}</h3>
                          <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                            {event.date && (
                              <div className="flex items-center gap-1.5">
                                <CalendarIcon className="w-3.5 h-3.5 text-gray-400" />
                                {format(new Date(event.date + 'T12:00:00'), "dd 'de' MMMM", { locale: ptBR })}
                                {event.time && ` às ${event.time.slice(0, 5)}`}
                              </div>
                            )}
                            {event.location && (
                              <div className="flex items-center gap-1.5">
                                <MapPinIcon className="w-3.5 h-3.5 text-gray-400" />
                                {event.location}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-3 w-full md:w-auto flex-shrink-0">
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-50 text-amber-700 text-xs font-bold border border-amber-200">
                            <ClockIcon className="w-3 h-3" />
                            Aguardando Pagamento
                          </span>
                          <Link
                            href={`/agenda/${reg.event_id}/pagamento/${reg.id}`}
                            className="bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold px-4 py-2 rounded-xl transition-all whitespace-nowrap shadow-sm"
                          >
                            Pagar agora
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Confirmadas */}
            {confirmed.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  <h2 className="text-sm font-bold text-emerald-700 uppercase tracking-widest">Confirmadas</h2>
                  <span className="bg-emerald-50 text-emerald-700 text-xs font-bold px-2 py-0.5 rounded-full border border-emerald-200">{confirmed.length}</span>
                </div>
                <div className="grid gap-3">
                  {confirmed.map((reg) => {
                    const event = reg.events as any;
                    if (!event) return null;
                    return (
                      <div key={reg.id} className="bg-white border border-gray-200 rounded-2xl p-5 flex flex-col md:flex-row gap-4 items-start md:items-center hover:border-blue-200 hover:shadow-sm transition-all">
                        <div className="flex-1">
                          <h3 className="text-base font-bold text-gray-900 mb-2">{event.title}</h3>
                          <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                            {event.date && (
                              <div className="flex items-center gap-1.5">
                                <CalendarIcon className="w-3.5 h-3.5 text-gray-400" />
                                {format(new Date(event.date + 'T12:00:00'), "dd 'de' MMMM", { locale: ptBR })}
                                {event.time && ` às ${event.time.slice(0, 5)}`}
                              </div>
                            )}
                            {event.location && (
                              <div className="flex items-center gap-1.5">
                                <MapPinIcon className="w-3.5 h-3.5 text-gray-400" />
                                {event.location}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-3 w-full md:w-auto flex-shrink-0">
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
                            ✓ Confirmado
                          </span>
                          {reg.ticket_signature && (
                            <Link
                              href={`/comprovante/${reg.id}`}
                              className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold px-4 py-2 rounded-xl transition-all whitespace-nowrap shadow-sm"
                            >
                              Ver ingresso
                            </Link>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Canceladas */}
            {cancelled.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-2 h-2 rounded-full bg-gray-400" />
                  <h2 className="text-sm font-bold text-gray-500 uppercase tracking-widest">Canceladas</h2>
                  <span className="bg-gray-100 text-gray-500 text-xs font-bold px-2 py-0.5 rounded-full border border-gray-200">{cancelled.length}</span>
                </div>
                <div className="grid gap-3">
                  {cancelled.map((reg) => {
                    const event = reg.events as any;
                    if (!event) return null;
                    return (
                      <div key={reg.id} className="bg-white border border-gray-200 rounded-2xl p-5 flex flex-col md:flex-row gap-4 items-start md:items-center opacity-60">
                        <div className="flex-1">
                          <h3 className="text-base font-bold text-gray-400 mb-1 line-through">{event.title}</h3>
                        </div>
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-gray-100 text-gray-500 text-xs font-bold border border-gray-200">
                          Cancelada
                        </span>
                      </div>
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
