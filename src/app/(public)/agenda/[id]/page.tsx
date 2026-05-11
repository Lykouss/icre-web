import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { isValidUuid } from '@/lib/action-validators';
import { getCurrentUser } from '@/features/core/api/get-current-user';
import { PublicEventClient } from '@/features/portal/components/PublicEventClient';

export const revalidate = 30;

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isValidUuid(id)) return { title: 'Evento' };

  const supabase = await createClient();
  const { data: event } = await supabase
    .from('events')
    .select('title, description')
    .eq('id', id)
    .single();

  return {
    title: event?.title ? `${event.title} — ICRE` : 'Evento — ICRE',
    description: event?.description ?? undefined,
  };
}

export default async function PublicEventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isValidUuid(id)) notFound();

  const supabase = await createClient();
  const user = await getCurrentUser();

  // Fetch the event — admins can see all statuses
  const query = supabase
    .from('events')
    .select('id, title, date, time, location, description, type, capacity, is_public, status, ticket_price, requires_registration, requires_payment, banner_url, publish_at, custom_form_schema')
    .eq('id', id);

  // Non-admins can only see published events
  if (!user?.isSysAdmin) {
    query.eq('status', 'publicado').eq('is_public', true);
  }

  const { data: event, error } = await query.single();

  if (error || !event) notFound();

  // Draft check: if draft and not SysAdmin → 404
  if (event.status !== 'publicado' && !user?.isSysAdmin) notFound();

  const { count } = await supabase
    .from('event_registrations')
    .select('id', { count: 'exact', head: true })
    .eq('event_id', id)
    .in('status', ['confirmado', 'pendente_pagamento']);

  const spotsLeft = event.capacity ? event.capacity - (count ?? 0) : null;
  const isFull = spotsLeft !== null && spotsLeft <= 0;
  const isAdminPreview = user?.isSysAdmin && event.status !== 'publicado';

  return (
    <>
      {isAdminPreview && (
        <div className="fixed top-0 left-0 right-0 z-[100] bg-amber-400 text-amber-900 text-center text-sm font-bold py-2 px-4 flex items-center justify-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
          Modo de Visualização Admin · Este evento não está visível para o público ({event.status})
        </div>
      )}
      <PublicEventClient
        event={event}
        spotsLeft={spotsLeft}
        isFull={isFull}
        isAdminPreview={isAdminPreview}
      />
    </>
  );
}