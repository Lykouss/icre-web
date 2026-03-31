import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { isValidUuid } from '@/lib/action-validators';
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

  const { data: event, error } = await supabase
    .from('events')
    .select('id, title, date, time, location, description, type, capacity, is_public, status, ticket_price, requires_registration, requires_payment, banner_url')
    .eq('id', id)
    .eq('is_public', true)
    .eq('status', 'publicado')
    .single();

  if (error || !event) notFound();

  const { count } = await supabase
    .from('event_registrations')
    .select('id', { count: 'exact', head: true })
    .eq('event_id', id)
    .in('status', ['confirmado', 'pendente_pagamento']);

  const spotsLeft = event.capacity ? event.capacity - (count ?? 0) : null;
  const isFull = spotsLeft !== null && spotsLeft <= 0;

  return (
    <PublicEventClient
      event={event}
      spotsLeft={spotsLeft}
      isFull={isFull}
    />
  );
}