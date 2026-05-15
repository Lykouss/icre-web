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

  // ─── Buscar member_id correto via user_id ───────────────────────────────────
  // member_id em event_registrations referencia members.id, não auth.uid()
  const { data: memberData } = await supabase
    .from('members')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle();

  let registrations: any[] = [];

  if (memberData) {
    const { data } = await supabase
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
      .eq('member_id', memberData.id)
      .order('created_at', { ascending: false });

    registrations = data ?? [];
  }

  const confirmed = registrations.filter(r => r.status === 'confirmado');
  const pending = registrations.filter(r => r.status === 'pendente_pagamento');
  const cancelled = registrations.filter(r => r.status === 'cancelado');
  const hasAny = registrations.length > 0;

  return (
    <div className="min-h-screen bg-slate-950 pt-28 pb-16 px-4">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-blue-600/5 rounded-full blur-[120px]" />
      </div>

      <div className="relative max-w-4xl mx-auto">
        <div className="mb-10">
          <h1 className="text-3xl font-black text-white mb-2">Meus Comprovantes</h1>
          <p className="text-slate-400">Acompanhe seus ingressos e histórico de participação em eventos.</p>
        </div>

        {!hasAny ? (
          <div className="bg-slate-900/50 border border-white/10 rounded-3xl p-12 text-center">
            <TicketIcon className="w-16 h-16 text-slate-700 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">Nenhuma inscrição encontrada</h2>
            <p className="text-slate-400 mb-6">Você ainda não se inscreveu em nenhum evento.</p>
            <Link href="/agenda" className="inline-flex bg-blue-600 hover:bg-blue-500 text-white font-bold px-6 py-3 rounded-xl transition-all">
              Ver agenda de eventos
            </Link>
          </div>
        ) : (
          <div className="space-y-8">

            {/* Pendentes de pagamento */}
            {pending.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                  <h2 className="text-sm font-bold text-amber-400 uppercase tracking-widest">Aguardando pagamento</h2>
                  <span className="bg-amber-500/10 text-amber-400 text-xs font-bold px-2 py-0.5 rounded-full border border-amber-500/20">{pending.length}</span>
                </div>
                <div className="grid gap-3">
                  {pending.map((reg) => {
                    const event = reg.events as any;
                    if (!event) return null;
                    return (
                      <div key={reg.id} className="bg-amber-500/5 border border-amber-500/15 rounded-2xl p-5 flex flex-col md:flex-row gap-4 items-start md:items-center">
                        <div className="flex-1">
                          <h3 className="text-base font-bold text-white mb-2">{event.title}</h3>
                          <div className="flex flex-wrap gap-4 text-sm text-slate-400">
                            {event.date && (
                              <div className="flex items-center gap-1.5">
                                <CalendarIcon className="w-3.5 h-3.5 text-slate-500" />
                                {format(new Date(event.date + 'T12:00:00'), "dd 'de' MMMM", { locale: ptBR })}
                                {event.time && ` às ${event.time.slice(0, 5)}`}
                              </div>
                            )}
                            {event.location && (
                              <div className="flex items-center gap-1.5">
                                <MapPinIcon className="w-3.5 h-3.5 text-slate-500" />
                                {event.location}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-3 w-full md:w-auto flex-shrink-0">
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-500/10 text-amber-400 text-xs font-bold border border-amber-500/20">
                            <ClockIcon className="w-3 h-3" />
                            Aguardando Pagamento
                          </span>
                          <Link
                            href={`/agenda/${reg.event_id}/pagamento/${reg.id}`}
                            className="bg-amber-500 hover:bg-amber-400 text-white text-sm font-bold px-4 py-2 rounded-xl transition-all whitespace-nowrap"
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
                  <div className="w-2 h-2 rounded-full bg-emerald-400" />
                  <h2 className="text-sm font-bold text-emerald-400 uppercase tracking-widest">Confirmadas</h2>
                  <span className="bg-emerald-500/10 text-emerald-400 text-xs font-bold px-2 py-0.5 rounded-full border border-emerald-500/20">{confirmed.length}</span>
                </div>
                <div className="grid gap-3">
                  {confirmed.map((reg) => {
                    const event = reg.events as any;
                    if (!event) return null;
                    return (
                      <div key={reg.id} className="bg-slate-900/60 border border-white/8 rounded-2xl p-5 flex flex-col md:flex-row gap-4 items-start md:items-center hover:border-white/15 transition-colors">
                        <div className="flex-1">
                          <h3 className="text-base font-bold text-white mb-2">{event.title}</h3>
                          <div className="flex flex-wrap gap-4 text-sm text-slate-400">
                            {event.date && (
                              <div className="flex items-center gap-1.5">
                                <CalendarIcon className="w-3.5 h-3.5 text-slate-500" />
                                {format(new Date(event.date + 'T12:00:00'), "dd 'de' MMMM", { locale: ptBR })}
                                {event.time && ` às ${event.time.slice(0, 5)}`}
                              </div>
                            )}
                            {event.location && (
                              <div className="flex items-center gap-1.5">
                                <MapPinIcon className="w-3.5 h-3.5 text-slate-500" />
                                {event.location}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-3 w-full md:w-auto flex-shrink-0">
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 text-xs font-bold border border-emerald-500/20">
                            ✓ Confirmado
                          </span>
                          {reg.ticket_signature && (
                            <Link
                              href={`/comprovante/${reg.id}`}
                              className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold px-4 py-2 rounded-xl transition-all whitespace-nowrap"
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
                  <div className="w-2 h-2 rounded-full bg-slate-600" />
                  <h2 className="text-sm font-bold text-slate-500 uppercase tracking-widest">Canceladas</h2>
                  <span className="bg-slate-800 text-slate-500 text-xs font-bold px-2 py-0.5 rounded-full">{cancelled.length}</span>
                </div>
                <div className="grid gap-3">
                  {cancelled.map((reg) => {
                    const event = reg.events as any;
                    if (!event) return null;
                    return (
                      <div key={reg.id} className="bg-slate-900/30 border border-white/5 rounded-2xl p-5 flex flex-col md:flex-row gap-4 items-start md:items-center opacity-60">
                        <div className="flex-1">
                          <h3 className="text-base font-bold text-slate-400 mb-1 line-through">{event.title}</h3>
                        </div>
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-800 text-slate-500 text-xs font-bold border border-white/5">
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
