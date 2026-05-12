import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { generateTicketSignature } from '@/features/events/utils/signature';

const ASAAS_WEBHOOK_SECRET = process.env.ASAAS_WEBHOOK_SECRET;

export async function POST(request: Request) {
  try {
    // ── 1. Token validation ────────────────────────────────────────────────
    if (!ASAAS_WEBHOOK_SECRET) {
      console.error('[Webhook Asaas] ASAAS_WEBHOOK_SECRET não está configurado!');
      return NextResponse.json({ error: 'Servidor mal configurado.' }, { status: 500 });
    }

    const asaasToken = request.headers.get('asaas-access-token');

    if (asaasToken !== ASAAS_WEBHOOK_SECRET) {
      console.warn('[Webhook Asaas] Token inválido:', asaasToken?.slice(0, 8));
      return NextResponse.json({ error: 'Acesso não autorizado.' }, { status: 401 });
    }

    const body = await request.json();
    const eventType: string = body.event;
    const payment = body.payment;

    if (!payment?.id) {
      return NextResponse.json({ error: 'Payload malformado.' }, { status: 400 });
    }

    const validEvents = [
      'PAYMENT_RECEIVED',
      'PAYMENT_CONFIRMED',
      'PAYMENT_DELETED',
      'PAYMENT_REFUNDED',
      'PAYMENT_OVERDUE',
    ];

    if (!validEvents.includes(eventType)) {
      return NextResponse.json({ received: true, ignored: true, reason: 'Evento não processado.' });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } }
    );

    // ── 2. Idempotency check ───────────────────────────────────────────────
    // Build a unique event ID: asaas_payment_id + event_type
    const asaasEventId = `${payment.id}:${eventType}`;

    const { error: idempotencyError } = await supabase
      .from('webhook_processed_events')
      .insert({ asaas_event_id: asaasEventId, event_type: eventType });

    if (idempotencyError) {
      // Unique constraint violation = already processed
      if (idempotencyError.code === '23505') {
        console.log(`[Webhook Asaas] Idempotência: ${asaasEventId} já processado. Ignorando.`);
        return NextResponse.json({ received: true, alreadyProcessed: true }, { status: 200 });
      }
      // Other DB error — log but continue processing
      console.error('[Webhook Asaas] Erro ao gravar idempotência:', idempotencyError.message);
    }

    // ── 3. Find registration ───────────────────────────────────────────────
    const { data: registration, error: fetchError } = await supabase
      .from('event_registrations')
      .select('id, event_id, status, payment_status, ticket_signature')
      .eq('asaas_payment_id', payment.id)
      .single();

    if (fetchError || !registration) {
      console.warn(`[Webhook Asaas] Pagamento ${payment.id} sem inscrição associada.`);
      return NextResponse.json({ error: 'Inscrição não encontrada.' }, { status: 404 });
    }

    // ── 4. Process event ───────────────────────────────────────────────────
    if (eventType === 'PAYMENT_RECEIVED' || eventType === 'PAYMENT_CONFIRMED') {
      if (registration.payment_status === 'pago') {
        return NextResponse.json({ received: true, alreadyPaid: true });
      }

      const signature =
        registration.ticket_signature || generateTicketSignature(registration.id);

      const { error: updError } = await supabase
        .from('event_registrations')
        .update({
          status: 'confirmado',
          payment_status: 'pago',
          paid_at: new Date().toISOString(),
          receipt_url: `/comprovante/${registration.id}`,
          ticket_signature: signature,
        })
        .eq('id', registration.id);

      if (updError) throw new Error(`Falha ao atualizar inscrição: ${updError.message}`);

      await supabase.from('event_history').insert({
        event_id: registration.event_id,
        action_type: 'webhook_pagamento_confirmado',
        details: { registration_id: registration.id, payment_id: payment.id },
      });

      console.log(`[Webhook Asaas] ✓ Pagamento confirmado para inscrição ${registration.id}`);
    } else if (
      eventType === 'PAYMENT_DELETED' ||
      eventType === 'PAYMENT_REFUNDED' ||
      eventType === 'PAYMENT_OVERDUE'
    ) {
      const newPaymentStatus =
        eventType === 'PAYMENT_REFUNDED'
          ? 'reembolsado'
          : eventType === 'PAYMENT_OVERDUE'
          ? 'expirado'
          : 'cancelado';

      const { error: updError } = await supabase
        .from('event_registrations')
        .update({
          status: 'cancelado',
          payment_status: newPaymentStatus,
        })
        .eq('id', registration.id);

      if (updError) throw new Error(`Falha ao atualizar inscrição: ${updError.message}`);

      await supabase.from('event_history').insert({
        event_id: registration.event_id,
        action_type: `webhook_pagamento_${newPaymentStatus}`,
        details: { registration_id: registration.id, payment_id: payment.id },
      });

      console.log(`[Webhook Asaas] ✓ Pagamento ${newPaymentStatus} para inscrição ${registration.id}`);
    }

    return NextResponse.json({ received: true, processed: true });
  } catch (err: unknown) {
    console.error('[Webhook Asaas] Erro fatal:', err);
    return NextResponse.json(
      { error: 'Erro interno no servidor.' },
      { status: 500 }
    );
  }
}