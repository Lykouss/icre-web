import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { isValidUuid } from '@/lib/action-validators';
import { getCurrentUser } from '@/features/core/api/get-current-user';
import { RegistrationWizard } from '@/features/portal/components/RegistrationWizard';

export const revalidate = 0;

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isValidUuid(id)) return { title: 'Inscrição' };

  const supabase = await createClient();
  const { data: event } = await supabase
    .from('events')
    .select('title')
    .eq('id', id)
    .single();

  return {
    title: event?.title ? `Inscrição — ${event.title} — ICRE` : 'Inscrição — ICRE',
  };
}

export default async function InscricaoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isValidUuid(id)) notFound();

  const supabase = await createClient();
  const user = await getCurrentUser();

  // Buscar evento
  const { data: event, error } = await supabase
    .from('events')
    .select('id, title, date, time, location, description, rules, type, capacity, is_public, status, ticket_price, requires_registration, requires_payment, banner_url, publish_at, custom_form_schema, max_per_account, terms_text, accepts_pix, accepts_boleto')
    .eq('id', id)
    .eq('status', 'publicado')
    .eq('is_public', true)
    .single();

  // SysAdmin pode ver qualquer evento (sem filtro de status)
  if ((error || !event) && user?.isSysAdmin) {
    const { data: adminEvent } = await supabase
      .from('events')
      .select('id, title, date, time, location, description, rules, type, capacity, is_public, status, ticket_price, requires_registration, requires_payment, banner_url, publish_at, custom_form_schema, max_per_account, terms_text, accepts_pix, accepts_boleto')
      .eq('id', id)
      .single();
    if (!adminEvent) notFound();

    return renderPage(adminEvent, null, 0);
  }

  if (error || !event) notFound();

  // Se o evento não exige inscrição, não permite acessar esta página
  if (!event.requires_registration) {
    redirect(`/agenda/${id}`);
  }

  // ─── Proteção server-side: verificar limite de inscrições por conta ───
  if (user && event.max_per_account) {
    const { data: memberData } = await supabase
      .from('members')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (memberData) {
      const { count } = await supabase
        .from('event_registrations')
        .select('id', { count: 'exact', head: true })
        .eq('event_id', id)
        .eq('member_id', memberData.id)
        .in('status', ['confirmado', 'pendente_pagamento']);

      if ((count ?? 0) >= event.max_per_account) {
        // Limite atingido — redirecionar para detalhes do evento
        redirect(`/agenda/${id}`);
      }
    }
  }

  // Contagem de vagas
  const { count: filledCount } = await supabase
    .from('event_registrations')
    .select('id', { count: 'exact', head: true })
    .eq('event_id', id)
    .in('status', ['confirmado', 'pendente_pagamento']);

  const spotsLeft = event.capacity ? event.capacity - (filledCount ?? 0) : null;
  const isFull = spotsLeft !== null && spotsLeft <= 0;

  // Evento lotado — redirecionar de volta
  if (isFull) {
    redirect(`/agenda/${id}`);
  }

  return renderPage(event, spotsLeft, filledCount ?? 0);
}

function renderPage(
  event: any,
  spotsLeft: number | null,
  filledCount: number
) {
  const computedSpotsLeft = event.capacity ? event.capacity - filledCount : null;
  const isFull = computedSpotsLeft !== null && computedSpotsLeft <= 0;

  return (
    <RegistrationWizard
      event={event}
      spotsLeft={spotsLeft}
      isFull={isFull}
    />
  );
}
