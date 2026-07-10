import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { generateTicketSignature } from '@/features/events/utils/signature';
import { timingSafeEqual } from 'crypto';

const ASAAS_WEBHOOK_SECRET = process.env.ASAAS_WEBHOOK_SECRET;
const ASAAS_ALLOWED_IPS = process.env.ASAAS_ALLOWED_IPS?.split(',').map(ip => ip.trim()) || [];

export async function POST(request: Request) {
  try {
    // ── 0. IP Whitelisting ─────────────────────────────────────────────────
    if (ASAAS_ALLOWED_IPS.length > 0) {
      const forwardedFor = request.headers.get('x-forwarded-for');
      const realIp = request.headers.get('x-real-ip');
      const clientIp = forwardedFor?.split(',')[0].trim() || realIp || '';

      if (!ASAAS_ALLOWED_IPS.includes(clientIp)) {
        console.warn(`[Webhook Asaas] Origem não autorizada bloqueada. IP: ${clientIp}`);
        return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 });
      }
    }

    // ── 1. Token validation (Timing Safe) ──────────────────────────────────
    if (!ASAAS_WEBHOOK_SECRET) {
      console.error('[Webhook Asaas] ASAAS_WEBHOOK_SECRET não está configurado!');
      return NextResponse.json({ error: 'Servidor mal configurado.' }, { status: 500 });
    }

    const asaasToken = request.headers.get('asaas-access-token');

    if (!asaasToken) {
      console.warn('[Webhook Asaas] Token ausente.');
      return NextResponse.json({ error: 'Acesso não autorizado.' }, { status: 401 });
    }

    const secretBuffer = Buffer.from(ASAAS_WEBHOOK_SECRET);
    const tokenBuffer = Buffer.from(asaasToken);

    if (secretBuffer.length !== tokenBuffer.length || !timingSafeEqual(secretBuffer, tokenBuffer)) {
      console.warn('[Webhook Asaas] Token inválido (falha na comparação segura).');
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
      .select('id, event_id, status, payment_status, ticket_signature, member_id, email')
      .eq('asaas_payment_id', payment.id)
      .single();

    if (fetchError || !registration) {
      console.warn(`[Webhook Asaas] Pagamento ${payment.id} sem inscrição associada.`);
      return NextResponse.json({ error: 'Inscrição não encontrada.' }, { status: 404 });
    }

    // ── 3.5 Resolve User ID for Notifications ───────────────────────────────
    let userId: string | null = null;
    if (registration.member_id) {
      const { data: member } = await supabase.from('members').select('user_id').eq('id', registration.member_id).single();
      userId = member?.user_id;
    }
    if (!userId && registration.email) {
      const { data: profile } = await supabase.from('profiles').select('id').eq('email', registration.email).maybeSingle();
      userId = profile?.id;
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

      if (userId) {
        const { data: ev } = await supabase.from('events').select('title').eq('id', registration.event_id).single();
        const eventTitle = ev?.title || 'o evento';
        await sendSystemNotification(
          supabase,
          userId,
          'INFO',
          'Pagamento Confirmado! 🎉',
          `Sua inscrição para ${eventTitle} foi confirmada com sucesso. Você já pode acessar seu ingresso virtual.`
        );
      }
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

      if (userId && eventType === 'PAYMENT_OVERDUE') {
        const { data: ev } = await supabase.from('events').select('title').eq('id', registration.event_id).single();
        const eventTitle = ev?.title || 'o evento';
        await sendSystemNotification(
          supabase,
          userId,
          'WARNING',
          'Tempo de Pagamento Expirado ⏰',
          `O tempo limite para pagamento da inscrição em ${eventTitle} expirou. Sua inscrição foi cancelada automaticamente.`
        );
      }
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

async function sendSystemNotification(supabaseAdmin: any, userId: string, type: string, title: string, message: string) {
  try {
    const { data: comm } = await supabaseAdmin
      .from('communications')
      .insert({
        type,
        title,
        message,
        lock_duration_seconds: 0,
        audience_filter: { type: 'MANUAL', userIds: [userId] },
      })
      .select('id')
      .single();

    if (comm?.id) {
      await supabaseAdmin.from('user_notifications').insert({
        user_id: userId,
        communication_id: comm.id,
        is_read: false,
      });
    }
  } catch (err) {
    console.error('[Webhook Asaas] Erro ao enviar notificação:', err);
  }
}