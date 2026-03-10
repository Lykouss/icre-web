import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { isValidUuid } from '@/lib/action-validators';
import { PublicRegistrationForm } from '@/features/portal/components/PublicRegistrationForm';

export const revalidate = 30;

export default async function PublicEventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isValidUuid(id)) notFound();

  const supabase = await createClient();

  const { data: event, error } = await supabase
    .from('events')
    .select('id, title, date, time, location, description, type, capacity, is_public, status')
    .eq('id', id)
    .eq('is_public', true)
    .eq('status', 'publicado')
    .single();

  if (error || !event) notFound();

  const { count } = await supabase
    .from('event_registrations')
    .select('id', { count: 'exact', head: true })
    .eq('event_id', id)
    .eq('status', 'confirmado');

  const spotsLeft = event.capacity ? event.capacity - (count ?? 0) : null;
  const isFull = spotsLeft !== null && spotsLeft <= 0;

  return (
    <main className="py-16 px-6">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="bg-gradient-to-br from-blue-600 to-blue-800 px-8 py-10 text-white">
            <span className="text-xs font-bold bg-white/20 px-3 py-1 rounded-full uppercase tracking-wide">
              {event.type === 'culto' ? 'Culto' : 'Evento Especial'}
            </span>
            <h1 className="text-3xl font-bold mt-4 mb-2">{event.title}</h1>
            {event.description && <p className="text-blue-100 text-sm">{event.description}</p>}

            <div className="mt-6 flex flex-wrap gap-4 text-sm text-blue-100">
              {event.date && (
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  {new Date(event.date + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
                  {event.time && ` · ${event.time.slice(0, 5)}`}
                </div>
              )}
              {event.location && (
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  </svg>
                  {event.location}
                </div>
              )}
              {spotsLeft !== null && (
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {isFull ? 'Evento lotado' : `${spotsLeft} vaga${spotsLeft !== 1 ? 's' : ''} disponível`}
                </div>
              )}
            </div>
          </div>

          <div className="p-8">
            {isFull ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-3">😔</div>
                <p className="font-bold text-slate-800 text-lg">Este evento está lotado</p>
                <p className="text-slate-500 text-sm mt-1">Fique atento aos próximos eventos da nossa agenda.</p>
              </div>
            ) : (
              <PublicRegistrationForm eventId={event.id} />
            )}
          </div>
        </div>
      </div>
    </main>
  );
}