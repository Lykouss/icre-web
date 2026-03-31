import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const ASAAS_WEBHOOK_TOKEN = process.env.ASAAS_WEBHOOK_TOKEN;

const PAID_STATUSES = new Set(['RECEIVED', 'CONFIRMED', 'RECEIVED_IN_CASH']);

export async function POST(request: NextRequest) {
  const token = request.headers.get('asaas-access-token');
  if (ASAAS_WEBHOOK_TOKEN && token !== ASAAS_WEBHOOK_TOKEN) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const event = body.event as string;
  const payment = body.payment as Record<string, unknown> | undefined;

  if (!payment?.id || !event) {
    return NextResponse.json({ received: true });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );

  const { data: registration } = await supabase
    .from('event_registrations')
    .select('id, event_id')
    .eq('asaas_payment_id', payment.id as string)
    .single();

  if (!registration) {
    return NextResponse.json({ received: true });
  }

  if (PAID_STATUSES.has(event.replace('PAYMENT_', ''))) {
    await supabase
      .from('event_registrations')
      .update({
        status:         'confirmado',
        payment_status: 'pago',
        paid_at:        new Date().toISOString(),
        receipt_url:    `/comprovante/${registration.id}`,
      })
      .eq('id', registration.id);
  } else if (event === 'PAYMENT_OVERDUE' || event === 'PAYMENT_DELETED') {
    await supabase
      .from('event_registrations')
      .update({ payment_status: 'expirado', status: 'cancelado' })
      .eq('id', registration.id);
  }

  return NextResponse.json({ received: true });
}