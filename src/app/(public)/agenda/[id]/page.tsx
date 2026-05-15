import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { isValidUuid } from '@/lib/action-validators';
import { getCurrentUser } from '@/features/core/api/get-current-user';
import { EventDetailsClient } from '@/features/portal/components/EventDetailsClient';

export const revalidate = 0;

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

  // Fetch the event
  const query = supabase
    .from('events')
    .select('id, title, date, time, location, description, rules, type, capacity, is_public, status, ticket_price, requires_registration, requires_payment, banner_url, publish_at, custom_form_schema, max_per_account')
    .eq('id', id);

  if (!user?.isSysAdmin) {
    query.eq('status', 'publicado').eq('is_public', true);
  }

  const { data: event, error } = await query.single();

  if (error || !event) notFound();
  if (event.status !== 'publicado' && !user?.isSysAdmin) notFound();

  // Contagem de vagas
  const { count } = await supabase
    .from('event_registrations')
    .select('id', { count: 'exact', head: true })
    .eq('event_id', id)
    .in('status', ['confirmado', 'pendente_pagamento']);

  const spotsLeft = event.capacity ? event.capacity - (count ?? 0) : null;
  const isFull = spotsLeft !== null && spotsLeft <= 0;
  const isAdminPreview = user?.isSysAdmin && event.status !== 'publicado';

  // Buscar inscrições existentes do usuário logado
  let existingRegistrations: Array<{
    id: string;
    status: string;
    payment_status: string;
    ticket_signature: string | null;
    event_id: string;
  }> = [];

  if (user) {
    // Buscar member_id via user_id
    const { data: memberData } = await supabase
      .from('members')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (memberData) {
      const { data: regs } = await supabase
        .from('event_registrations')
        .select('id, status, payment_status, ticket_signature, event_id')
        .eq('event_id', id)
        .eq('member_id', memberData.id)
        .in('status', ['confirmado', 'pendente_pagamento', 'cancelado']);

      existingRegistrations = (regs ?? []).filter(
        r => r.status === 'confirmado' || r.status === 'pendente_pagamento'
      );
    }
  }

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
      <EventDetailsClient
        event={event}
        spotsLeft={spotsLeft}
        isFull={isFull}
        isAdminPreview={isAdminPreview}
        existingRegistrations={existingRegistrations}
      />
    </>
  );
}