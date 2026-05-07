import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { generateTicketSignature } from '@/features/events/utils/signature';

const ASAAS_WEBHOOK_SECRET = process.env.ASAAS_WEBHOOK_SECRET;

export async function POST(request: Request) {
  try {
    const asaasToken = request.headers.get('asaas-access-token');

    if (ASAAS_WEBHOOK_SECRET && asaasToken !== ASAAS_WEBHOOK_SECRET) {
      console.warn('[Webhook Asaas] Tentativa de acesso com token inválido:', asaasToken);
      return NextResponse.json({ error: 'Acesso não autorizado.' }, { status: 401 });
    }

    const payload = await request.json();
    const event = payload.event;
    const payment = payload.payment;

    if (!payment || !payment.id) {
      return NextResponse.json({ error: 'Payload malformado.' }, { status: 400 });
    }

    const validEvents = ['PAYMENT_RECEIVED', 'PAYMENT_CONFIRMED', 'PAYMENT_DELETED', 'PAYMENT_REFUNDED', 'PAYMENT_OVERDUE'];
    if (!validEvents.includes(event)) {
      return NextResponse.json({ received: true, ignored: true, reason: 'Evento não processado no momento.' });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } }
    );

    const { data: registration, error: fetchError } = await supabase
      .from('event_registrations')
      .select('id, event_id, status, payment_status, ticket_signature')
      .eq('asaas_payment_id', payment.id)
      .single();

    if (fetchError || !registration) {
      console.warn(`[Webhook Asaas] Pagamento ${payment.id} recebido, mas nenhuma inscrição encontrada.`);
      return NextResponse.json({ error: 'Inscrição não encontrada para este pagamento.' }, { status: 404 });
    }

    if (event === 'PAYMENT_RECEIVED' || event === 'PAYMENT_CONFIRMED') {
      if (registration.payment_status === 'pago') {
        return NextResponse.json({ received: true, alreadyProcessed: true });
      }

      const signature = registration.ticket_signature || generateTicketSignature(registration.id, registration.event_id);
      
      const { error: updError } = await supabase
        .from('event_registrations')
        .update({
          status: 'confirmado',
          payment_status: 'pago',
          paid_at: new Date().toISOString(),
          receipt_url: `/comprovante/${registration.id}`,
          ticket_signature: signature
        })
        .eq('id', registration.id);

      if (updError) throw new Error(`Falha ao atualizar inscrição: ${updError.message}`);

      await supabase.from('event_history').insert({
        event_id: registration.event_id,
        action_type: 'webhook_pagamento_confirmado',
        details: { registration_id: registration.id, payment_id: payment.id }
      });

      console.log(`[Webhook Asaas] Pagamento confirmado para inscrição ${registration.id}`);
      
    } else if (event === 'PAYMENT_DELETED' || event === 'PAYMENT_REFUNDED' || event === 'PAYMENT_OVERDUE') {
      const newPaymentStatus = event === 'PAYMENT_REFUNDED' ? 'reembolsado' : (event === 'PAYMENT_OVERDUE' ? 'expirado' : 'cancelado');
      
      const { error: updError } = await supabase
        .from('event_registrations')
        .update({
          status: 'cancelado',
          payment_status: newPaymentStatus
        })
        .eq('id', registration.id);

      if (updError) throw new Error(`Falha ao atualizar inscrição: ${updError.message}`);

      await supabase.from('event_history').insert({
        event_id: registration.event_id,
        action_type: `webhook_pagamento_${newPaymentStatus}`,
        details: { registration_id: registration.id, payment_id: payment.id }
      });

      console.log(`[Webhook Asaas] Pagamento ${newPaymentStatus} para inscrição ${registration.id}`);
    }

    return NextResponse.json({ received: true, processed: true });

  } catch (err: any) {
    console.error('[Webhook Asaas] Erro fatal:', err);
    return NextResponse.json({ error: 'Erro interno no servidor.', details: err.message }, { status: 500 });
  }
}