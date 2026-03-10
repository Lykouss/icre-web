import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';

export const revalidate = 60;

export default async function PublicEventsPage() {
  const supabase = await createClient();

  const { data: events } = await supabase
    .from('events')
    .select('id, title, date, time, location, description, type')
    .eq('is_public', true)
    .eq('status', 'publicado')
    .gte('date', new Date().toISOString().split('T')[0])
    .order('date')
    .limit(24);

  return (
    <main className="py-16 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="mb-10">
          <h1 className="text-4xl font-bold text-slate-900">Agenda de Eventos</h1>
          <p className="text-slate-500 mt-2">Confira os próximos eventos da nossa comunidade.</p>
        </div>

        {(!events || events.length === 0) ? (
          <div className="text-center py-24 text-slate-400">
            <p className="text-2xl font-semibold mb-2">Nenhum evento disponível</p>
            <p className="text-sm">Novos eventos serão anunciados em breve.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map(event => (
              <Link
                key={event.id}
                href={`/agenda/${event.id}`}
                className="group bg-white rounded-3xl border border-slate-200 p-6 hover:border-blue-300 hover:shadow-lg transition-all"
              >
                <div className="flex items-center gap-2 mb-3">
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${event.type === 'culto' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                    {event.type === 'culto' ? 'Culto' : 'Especial'}
                  </span>
                </div>

                <h2 className="font-bold text-slate-900 text-lg mb-2 group-hover:text-blue-700 transition-colors">
                  {event.title}
                </h2>

                {event.description && (
                  <p className="text-sm text-slate-500 mb-4 line-clamp-2">{event.description}</p>
                )}

                <div className="space-y-1.5 text-sm text-slate-500">
                  {event.date && (
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-slate-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span>
                        {new Date(event.date + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
                        {event.time && ` · ${event.time.slice(0, 5)}`}
                      </span>
                    </div>
                  )}
                  {event.location && (
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-slate-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      </svg>
                      <span>{event.location}</span>
                    </div>
                  )}
                </div>

                <div className="mt-5 text-sm font-semibold text-blue-600 flex items-center gap-1">
                  Saiba mais
                  <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}