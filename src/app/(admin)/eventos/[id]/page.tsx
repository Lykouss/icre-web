import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/features/core/api/get-current-user';
import { getFeatureFlag } from '@/features/core/api/get-feature-flag';
import { FeatureMaintenance } from '@/features/core/components/FeatureMaintenance';
import { isValidUuid } from '@/lib/action-validators';
import { EventDetailClient } from '@/features/events/components/EventDetailClient';
import type { ChurchEvent, EventSchedule, EventRegistration, EventAttendance } from '@/features/events/types';

const WEEK_DAYS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

export default async function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const isActive = await getFeatureFlag('module_events', user);
  if (!isActive) return <FeatureMaintenance featureName="Eventos e Calendário" />;

  const { id } = await params;
  if (!isValidUuid(id)) notFound();

  const supabase = await createClient();

  const [
    { data: event, error },
    { data: schedules },
    { data: registrations },
    { data: attendance },
    { data: members },
  ] = await Promise.all([
    supabase.from('events').select('*').eq('id', id).single(),
    supabase
      .from('event_schedules')
      .select('*, members(full_name)')
      .eq('event_id', id)
      .returns<EventSchedule[]>(),
    supabase
      .from('event_registrations')
      .select('*')
      .eq('event_id', id)
      .order('created_at')
      .returns<EventRegistration[]>(),
    supabase
      .from('event_attendance')
      .select('*')
      .eq('event_id', id)
      .order('checked_in_at')
      .returns<EventAttendance[]>(),
    supabase
      .from('members')
      .select('id, full_name')
      .eq('status', 'Membro')
      .order('full_name'),
  ]);

  if (error || !event) notFound();

  const typedEvent = event as ChurchEvent;
  const canManage = user.roles.some(r => ['SYSADMIN', 'CHURCH_ADMIN', 'LEADER'].includes(r));

  return (
    <div className="max-w-5xl mx-auto pb-12">
      <Link
        href="/eventos"
        className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-slate-900 mb-6 transition-colors"
      >
        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Voltar para Eventos
      </Link>

      <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-sm mb-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${typedEvent.type === 'culto' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                {typedEvent.type === 'culto' ? 'Culto' : 'Evento Especial'}
              </span>
              {typedEvent.is_public && (
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700">
                  Público
                </span>
              )}
            </div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">{typedEvent.title}</h1>
            {typedEvent.description && (
              <p className="text-slate-500 mt-2 max-w-xl">{typedEvent.description}</p>
            )}
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-4 text-sm text-slate-600">
          {typedEvent.date && (
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>
                {new Date(typedEvent.date + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                {typedEvent.time && ` · ${typedEvent.time.slice(0, 5)}`}
              </span>
            </div>
          )}
          {typedEvent.location && (
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>{typedEvent.location}</span>
            </div>
          )}
          {typedEvent.capacity && (
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>Capacidade: {typedEvent.capacity}</span>
            </div>
          )}
          {typedEvent.is_recurring && (
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>Toda {WEEK_DAYS[typedEvent.recurrence_day ?? 0]}</span>
            </div>
          )}
        </div>
      </div>

      <EventDetailClient
        event={typedEvent}
        schedules={schedules ?? []}
        registrations={registrations ?? []}
        attendance={attendance ?? []}
        members={members ?? []}
        canManage={canManage}
      />
    </div>
  );
}