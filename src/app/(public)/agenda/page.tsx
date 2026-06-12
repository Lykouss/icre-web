import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/server';
import { getNextEventOccurrence } from '@/lib/event-utils';
import { getCurrentUser } from '@/features/core/api/get-current-user';

export const revalidate = 60;

const MONTHS_SHORT = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
const WEEKDAYS_SHORT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

interface PublicEvent {
  id: string;
  title: string;
  date: string | null;
  time: string | null;
  location: string | null;
  description: string | null;
  type: string;
  banner_url: string | null;
  ticket_price: number | null;
  requires_registration: boolean;
  requires_payment: boolean;
  capacity: number | null;
  is_recurring?: boolean;
  recurrence_rules?: any;
  cancelled_dates?: string[];
  isCancelled?: boolean;
}

export default async function PublicEventsPage() {
  const supabase = await createClient();

  const { data: rawEvents } = await supabase
    .from('events')
    .select('id, title, date, time, location, description, type, banner_url, ticket_price, requires_registration, requires_payment, capacity, is_recurring, recurrence_rules, cancelled_dates')
    .eq('is_public', true)
    .eq('status', 'publicado')
    .returns<PublicEvent[]>();

  const events = (rawEvents || []).map(ev => {
    const { nextDate, isCancelled } = getNextEventOccurrence(ev as any);
    return { ...ev, date: nextDate, isCancelled };
  }).filter(ev => ev.date !== null)
    .sort((a, b) => (a.date as string).localeCompare(b.date as string))
    .slice(0, 24);

  const user = await getCurrentUser();
  let registeredEventIds = new Set<string>();

  if (user) {
    const { data: regs } = await supabase
      .from('event_registrations')
      .select('event_id')
      .eq('member_id', user.id)
      .eq('status', 'confirmado');

    if (regs) {
      regs.forEach(r => registeredEventIds.add(r.event_id));
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-blue-100/50 dark:bg-blue-900/20 rounded-full blur-[130px]" />
      </div>

      <div className="relative max-w-6xl mx-auto px-4 pt-28 pb-16">
        <div className="text-center mb-14">
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mb-6">
            <div className="inline-flex items-center gap-2 bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-900/50 text-blue-600 dark:text-blue-400 text-xs font-bold tracking-widest uppercase px-4 py-2 rounded-full">
              Agenda
            </div>
            <Link href="/minhas-inscricoes" className="inline-flex items-center gap-2 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold px-4 py-2 rounded-full transition-all border border-slate-200 dark:border-slate-700 shadow-sm">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" /></svg>
              Minhas Inscrições
            </Link>
          </div>
          <h1 className="text-4xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight mb-4">
            Próximos Eventos
          </h1>
          <p className="text-slate-500 dark:text-slate-400 max-w-lg mx-auto">
            Confira os próximos eventos da nossa comunidade e garanta sua participação.
          </p>
        </div>

        {(!events || events.length === 0) ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 border-dashed rounded-3xl shadow-sm">
            <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-900/50 rounded-2xl flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-slate-700 dark:text-slate-300 font-bold mb-2">Nenhum evento programado</p>
            <p className="text-slate-500 dark:text-slate-400 text-sm">Os próximos eventos aparecerão aqui assim que forem publicados.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map(event => {
              const date = event.date ? new Date(event.date + 'T12:00:00') : null;
              const isPaid = event.requires_payment && (event.ticket_price ?? 0) > 0;
              const isRegistered = registeredEventIds.has(event.id);

              return (
                <Link
                  key={event.id}
                  href={`/agenda/${event.id}`}
                  className="group relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-md hover:-translate-y-1.5 transition-all duration-300 ease-out"
                >
                  <div className="absolute inset-0 rounded-3xl bg-blue-50/0 group-hover:bg-blue-50/50 dark:group-hover:bg-blue-900/10 transition-colors duration-300 pointer-events-none z-10" />

                  {/* Imagem */}
                  <div className="relative h-44 bg-slate-100 dark:bg-slate-800 overflow-hidden border-b border-slate-100 dark:border-slate-800">
                    {event.banner_url ? (
                      <Image
                         src={event.banner_url}
                        alt={event.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-12 h-12 bg-blue-50 border border-blue-100 rounded-2xl flex items-center justify-center">
                          <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      </div>
                    )}
                    {event.banner_url && <div className="absolute inset-0 bg-linear-to-t from-gray-900/60 via-transparent to-transparent" />}

                    {/* Data flutuante */}
                    {date && (
                      <div className="absolute bottom-3 left-3 flex gap-2">
                        <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-center shadow-sm">
                          <p className="text-lg font-black text-slate-900 dark:text-white leading-none">{date.getDate().toString().padStart(2, '0')}</p>
                          <p className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase">{MONTHS_SHORT[date.getMonth()]}</p>
                        </div>
                        {event.isCancelled && (
                          <div className="bg-red-500/95 backdrop-blur-md border border-red-600 rounded-xl px-3 py-2 flex items-center shadow-sm">
                            <p className="text-xs font-black text-white uppercase tracking-widest">Cancelado</p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Badges */}
                    <div className="absolute top-3 right-3 flex flex-col gap-1.5 items-end">
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border shadow-sm bg-white dark:bg-slate-900 ${
                        event.type === 'culto'
                          ? 'border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400'
                          : 'border-violet-200 dark:border-violet-800 text-violet-700 dark:text-violet-400'
                      }`}>
                        {event.type === 'culto' ? 'Culto' : 'Especial'}
                      </span>
                      {isPaid && (
                        <span className="text-[10px] font-bold px-2.5 py-1 rounded-lg border shadow-sm bg-white dark:bg-slate-900 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400">
                          R$ {Number(event.ticket_price).toFixed(2)}
                        </span>
                      )}
                      {isRegistered && (
                        <span className="text-[10px] font-bold px-2.5 py-1 rounded-lg border shadow-sm bg-white dark:bg-slate-900 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                          Inscrito
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Conteúdo */}
                  <div className="p-5">
                    <h2 className="font-bold text-slate-900 dark:text-white text-base leading-snug mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2">
                      {event.title}
                    </h2>

                    {event.description && (
                      <p className="text-sm text-slate-500 dark:text-slate-400 mb-3 line-clamp-2">{event.description}</p>
                    )}

                    <div className="space-y-1.5 mb-4">
                      {date && (
                        <div className={`flex items-center gap-2 text-xs ${event.isCancelled ? 'text-red-500 line-through' : 'text-slate-500 dark:text-slate-400'}`}>
                          <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span className="font-medium">{WEEKDAYS_SHORT[date.getDay()]}, {date.getDate()} {MONTHS_SHORT[date.getMonth()]}{event.time ? ` · ${event.time.slice(0, 5)}` : ''}</span>
                        </div>
                      )}
                      {event.location && (
                        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                          <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          </svg>
                          <span className="truncate font-medium">{event.location}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${
                        event.requires_registration
                          ? isPaid
                            ? 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border border-amber-100 dark:border-amber-800/50'
                            : 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border border-blue-100 dark:border-blue-900/50'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                      }`}>
                        {event.requires_registration
                          ? isPaid ? 'Inscrição + pagamento' : 'Inscrição obrigatória'
                          : 'Entrada livre'
                        }
                      </span>
                      <span className="text-blue-600 dark:text-blue-400 group-hover:text-blue-700 dark:group-hover:text-blue-300 flex items-center gap-1 text-xs font-bold transition-colors">
                        Ver mais
                        <svg className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
                        </svg>
                      </span>
                    </div>
                  </div>

                  {/* Linha decorativa */}
                  <div className="absolute inset-x-0 bottom-0 h-0.5 bg-linear-to-r from-transparent via-blue-500 to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-400 origin-left" />
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}