import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { isValidUuid } from '@/lib/action-validators';
import { PaymentPageClient } from '@/features/portal/components/PaymentPageClient';
import {
  getAsaasPixQrCode,
  getAsaasBoletoDetails,
} from '@/lib/asaas-server';

export const revalidate = 0;

export async function generateMetadata({ params }: { params: Promise<{ id: string; registrationId: string }> }) {
  const { registrationId } = await params;
  if (!isValidUuid(registrationId)) return { title: 'Pagamento' };

  const supabase = await createClient();
  const { data } = await supabase
    .from('event_registrations')
    .select('events ( title )')
    .eq('id', registrationId)
    .single();

  const eventData = Array.isArray(data?.events) ? data.events[0] : data?.events;
  return {
    title: eventData?.title ? `Pagamento — ${eventData.title} — ICRE` : 'Pagamento — ICRE',
  };
}

export default async function PagamentoPage({
  params,
}: {
  params: Promise<{ id: string; registrationId: string }>;
}) {
  const { id, registrationId } = await params;

  if (!isValidUuid(id) || !isValidUuid(registrationId)) notFound();

  const supabase = await createClient();

  const { data: raw, error } = await supabase
    .from('event_registrations')
    .select(`
      id,
      status,
      payment_status,
      payment_method,
      asaas_payment_id,
      asaas_invoice_url,
      events!inner ( id, title, ticket_price, date )
    `)
    .eq('id', registrationId)
    .eq('event_id', id)
    .single();

  if (error || !raw) notFound();

  // Se já está confirmado, redirecionar para o comprovante
  if (raw.status === 'confirmado') {
    const { redirect } = await import('next/navigation');
    redirect(`/comprovante/${registrationId}`);
  }

  // Só mostra a página para inscrições pendentes de pagamento
  if (raw.status !== 'pendente_pagamento') notFound();

  const eventData = Array.isArray(raw.events) ? raw.events[0] : raw.events;
  if (!eventData) notFound();

  // Buscar dados do Asaas
  let pixQrCode: string | null = null;
  let pixCopyPaste: string | null = null;
  let pixExpirationDate: string | null = null;
  let boletoUrl: string | null = null;
  let boletoBarCode: string | null = null;
  let value = Number(eventData.ticket_price ?? 0);
  let dueDate: string | null = null;

  if (raw.asaas_payment_id) {
    try {
      if (raw.payment_method === 'asaas_pix' || raw.payment_method === 'pix') {
        const pixData = await getAsaasPixQrCode(raw.asaas_payment_id);
        pixQrCode = pixData.encodedImage ?? null;
        pixCopyPaste = pixData.payload ?? null;
        pixExpirationDate = pixData.expirationDate ?? null;
      } else if (raw.payment_method === 'asaas_boleto' || raw.payment_method === 'boleto') {
        const boletoData = await getAsaasBoletoDetails(raw.asaas_payment_id);
        boletoUrl = boletoData.bankSlipUrl ?? raw.asaas_invoice_url ?? null;
        boletoBarCode = boletoData.identificationField ?? null;
        value = boletoData.value ?? value;
        dueDate = boletoData.dueDate ?? null;
      }
    } catch (e) {
      console.error('[PagamentoPage] Asaas fetch error:', e);
    }
  }

  return (
    <PaymentPageClient
      payment={{
        registrationId,
        eventId: id,
        eventTitle: eventData.title,
        paymentMethod: raw.payment_method,
        asaasPaymentId: raw.asaas_payment_id,
        asaasInvoiceUrl: raw.asaas_invoice_url,
        pixQrCode,
        pixCopyPaste,
        pixExpirationDate,
        boletoUrl,
        boletoBarCode,
        value,
        dueDate,
        status: raw.payment_status,
      }}
    />
  );
}
