'use server'

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { getCurrentUser } from '@/features/core/api/get-current-user';
import { isValidUuid, isValidPhone, isValidEmail } from '@/lib/action-validators';
import {
  createOrFindAsaasCustomer,
  createAsaasPixPayment,
  createAsaasBoletoPayment,
  getAsaasPixQrCode,
  getAsaasPaymentStatus,
} from '@/lib/asaas-server';
import type { PaymentStatus, PaymentMethod, AsaasPaymentInfo } from '@/features/events/types';
import { generateTicketSignature, verifyTicketSignature } from '../utils/signature';

const VALID_PAYMENT_STATUSES: PaymentStatus[] = ['gratuito', 'pendente', 'pago', 'reembolsado', 'expirado'];
const VALID_PAYMENT_METHODS: PaymentMethod[] = ['pix', 'cartao', 'dinheiro', 'cortesia', 'asaas_pix', 'asaas_boleto'];

export async function createPublicRegistration(
  eventId: string,
  formData: FormData,
  ipAddress?: string,
  deviceId?: string
): Promise<{ error?: string; registrationId?: string; paymentInfo?: AsaasPaymentInfo }> {
  if (!isValidUuid(eventId)) return { error: 'Evento inválido.' };

  const name      = (formData.get('name')     as string)?.trim();
  const email     = (formData.get('email')    as string)?.trim();
  const phone     = (formData.get('phone')    as string)?.trim();
  const payMethod = (formData.get('payment_method') as string)?.trim() as 'pix' | 'boleto' | null;

  if (!name || name.length < 3) return { error: 'Nome precisa ter ao menos 3 caracteres.' };
  if (!email || !isValidEmail(email)) return { error: 'E-mail inválido.' };
  if (phone && !isValidPhone(phone)) return { error: 'Telefone inválido.' };

  const supabase = await createClient();
  const user = await getCurrentUser();

  const { data: event } = await supabase
    .from('events')
    .select('id, title, capacity, ticket_price, requires_payment, requires_registration, status, is_public, max_per_account, max_per_ip, max_per_device')
    .eq('id', eventId)
    .single();

  if (!event) return { error: 'Evento não encontrado.' };

  // SysAdmin can register before event is public
  if (event.status !== 'publicado' && !user?.isSysAdmin) {
     return { error: 'Evento não está disponível para inscrições.' };
  }

  // Verificações de limites
  if (event.capacity) {
    const { count } = await supabase
      .from('event_registrations')
      .select('id', { count: 'exact', head: true })
      .eq('event_id', eventId)
      .in('status', ['confirmado', 'pendente_pagamento']);
    if ((count ?? 0) >= event.capacity) return { error: 'Evento lotado. Não há vagas disponíveis.' };
  }

  if (ipAddress && event.max_per_ip) {
     const { count } = await supabase.from('event_registrations').select('id', { count: 'exact', head: true }).eq('event_id', eventId).eq('ip_address', ipAddress).in('status', ['confirmado', 'pendente_pagamento']);
     if ((count ?? 0) >= event.max_per_ip) return { error: 'Limite de inscrições por IP atingido.' };
  }

  if (deviceId && event.max_per_device) {
     const { count } = await supabase.from('event_registrations').select('id', { count: 'exact', head: true }).eq('event_id', eventId).eq('device_id', deviceId).in('status', ['confirmado', 'pendente_pagamento']);
     if ((count ?? 0) >= event.max_per_device) return { error: 'Limite de inscrições por dispositivo atingido.' };
  }

  const { data: duplicate } = await supabase
    .from('event_registrations')
    .select('id')
    .eq('event_id', eventId)
    .eq('email', email)
    .in('status', ['confirmado', 'pendente_pagamento'])
    .maybeSingle();

  if (duplicate) return { error: 'Este e-mail já está inscrito neste evento.' };

  const needsPayment = event.requires_payment && (event.ticket_price ?? 0) > 0;
  const initialStatus = needsPayment ? 'pendente_pagamento' : 'confirmado';
  const initialPaymentStatus: PaymentStatus = needsPayment ? 'pendente' : 'gratuito';

  // Registrar IP conhecido se usuário estiver logado
  if (user && ipAddress) {
      await supabase.from('user_known_ips').upsert({
          user_id: user.id,
          ip_address: ipAddress,
          last_seen: new Date().toISOString()
      }, { onConflict: 'user_id, ip_address' });
  }

  const { data: registration, error: insertError } = await supabase
    .from('event_registrations')
    .insert({
      event_id:       eventId,
      name,
      email:          email || null,
      phone:          phone || null,
      status:         initialStatus,
      payment_status: initialPaymentStatus,
      ip_address:     ipAddress || null,
      device_id:      deviceId || null,
      member_id:      user?.id || null // Associa a conta se logado
    })
    .select()
    .single();

  if (insertError || !registration) {
    console.error('[createPublicRegistration]', insertError?.message);
    return { error: 'Falha ao registrar a inscrição.' };
  }

  if (!needsPayment) {
    const signature = generateTicketSignature(registration.id, eventId);
    await supabase.from('event_registrations').update({ ticket_signature: signature }).eq('id', registration.id);
    await logEventHistory(eventId, 'inscrição_gratuita', user?.id, null, { registration_id: registration.id });
    revalidatePath(`/agenda/${eventId}`);
    return { registrationId: registration.id };
  }

  try {
    const customerId = await createOrFindAsaasCustomer(name, email, phone);
    const description = `Ingresso: ${event.title}`;
    const value = Number(event.ticket_price);

    let payment;
    let pixInfo: { qrCode?: string; copyPaste?: string } = {};

    if (payMethod === 'boleto') {
      payment = await createAsaasBoletoPayment(customerId, value, description, registration.id);
    } else {
      payment = await createAsaasPixPayment(customerId, value, description, registration.id);
      try {
        const pix = await getAsaasPixQrCode(payment.id);
        pixInfo = { qrCode: pix.encodedImage, copyPaste: pix.payload };
      } catch {}
    }

    await supabase
      .from('event_registrations')
      .update({
        asaas_payment_id:  payment.id,
        asaas_invoice_url: payment.invoiceUrl,
        payment_method:    payMethod === 'boleto' ? 'asaas_boleto' : 'asaas_pix',
      })
      .eq('id', registration.id);

    await logEventHistory(eventId, 'inscrição_aguardando_pagamento', user?.id, null, { registration_id: registration.id, payment_id: payment.id });
    revalidatePath(`/agenda/${eventId}`);

    return {
      registrationId: registration.id,
      paymentInfo: {
        paymentId:    payment.id,
        invoiceUrl:   payment.invoiceUrl,
        pixQrCode:    pixInfo.qrCode,
        pixCopyPaste: pixInfo.copyPaste,
        boletoUrl:    payment.bankSlipUrl,
        status:       payment.status,
        value:        payment.value,
        dueDate:      payment.dueDate,
      },
    };
  } catch (e) {
    console.error('[createPublicRegistration] Asaas error:', e);
    await supabase.from('event_registrations').delete().eq('id', registration.id);
    return { error: 'Falha ao gerar o pagamento. Tente novamente.' };
  }
}

export async function giftRegistration(eventId: string, targetEmail: string, targetName: string) {
    const user = await getCurrentUser();
    if (!user || !user.isSysAdmin) return { error: 'Acesso negado.' };

    const supabase = await createClient();
    const { data: event } = await supabase.from('events').select('id, title').eq('id', eventId).single();
    if (!event) return { error: 'Evento não encontrado.' };

    const { data: registration, error } = await supabase.from('event_registrations').insert({
        event_id: eventId,
        name: targetName,
        email: targetEmail,
        status: 'confirmado',
        payment_status: 'cortesia',
        gifted_by: user.id
    }).select().single();

    if (error || !registration) return { error: 'Falha ao criar cortesia.' };

    const signature = generateTicketSignature(registration.id, eventId);
    await supabase.from('event_registrations').update({ ticket_signature: signature }).eq('id', registration.id);

    await logEventHistory(eventId, 'inscrição_presenteada', user.id, null, { registration_id: registration.id, target_email: targetEmail });
    revalidatePath(`/eventos/${eventId}`);
    return { success: true, registrationId: registration.id };
}

export async function processCheckin(qrCodeData: string) {
    const user = await getCurrentUser();
    if (!user || !user.isSysAdmin) return { error: 'Acesso negado.' };

    // qrCodeData assumed format: registration_id:event_id:signature
    const parts = qrCodeData.split(':');
    if (parts.length !== 3) return { error: 'QR Code inválido.' };

    const [registrationId, eventId, signature] = parts;

    if (!isValidUuid(registrationId) || !isValidUuid(eventId)) return { error: 'Formato de QR Code inválido.' };

    if (!verifyTicketSignature(registrationId, eventId, signature)) {
        return { error: 'Assinatura inválida! Possível QR Code falsificado.' };
    }

    const supabase = await createClient();
    const { data: reg, error } = await supabase.from('event_registrations').select('id, status, checkin_status').eq('id', registrationId).eq('event_id', eventId).single();

    if (error || !reg) return { error: 'Inscrição não encontrada.' };
    if (reg.status !== 'confirmado') return { error: 'Inscrição não confirmada/paga.' };
    if (reg.checkin_status) return { error: 'Check-in já realizado.' };

    const { error: updError } = await supabase.from('event_registrations').update({
        checkin_status: true,
        checkin_time: new Date().toISOString(),
        checkin_by: user.id
    }).eq('id', registrationId);

    if (updError) return { error: 'Falha ao salvar check-in.' };

    await logEventHistory(eventId, 'checkin_realizado', user.id, null, { registration_id: registrationId });
    revalidatePath(`/eventos/${eventId}`);
    return { success: true };
}

async function logEventHistory(eventId: string, actionType: string, actorId?: string | null, targetUserId?: string | null, details?: any) {
    const supabase = await createClient();
    await supabase.from('event_history').insert({
        event_id: eventId,
        action_type: actionType,
        actor_id: actorId,
        target_user_id: targetUserId,
        details: details
    });
}

// Check and update payment status logic remains similar, but now creates HMAC signature
export async function checkAndUpdatePaymentStatus(registrationId: string) {
  if (!isValidUuid(registrationId)) return { error: 'Inscrição inválida.' };

  const supabase = await createClient();
  const { data: reg } = await supabase
    .from('event_registrations')
    .select('asaas_payment_id, event_id, name, email, ticket_signature, status')
    .eq('id', registrationId)
    .single();

  if (!reg?.asaas_payment_id) return { error: 'Nenhum pagamento associado.' };

  const asaasStatus = await getAsaasPaymentStatus(reg.asaas_payment_id);
  const PAID_STATUSES = ['RECEIVED', 'CONFIRMED', 'RECEIVED_IN_CASH'];
  const paid = PAID_STATUSES.includes(asaasStatus);

  if (paid && reg.status !== 'confirmado') {
    const signature = reg.ticket_signature || generateTicketSignature(registrationId, reg.event_id);
    const receiptUrl = `/comprovante/${registrationId}`;

    await supabase
      .from('event_registrations')
      .update({
        status:         'confirmado',
        payment_status: 'pago',
        paid_at:        new Date().toISOString(),
        receipt_url:    receiptUrl,
        ticket_signature: signature
      })
      .eq('id', registrationId);

    await logEventHistory(reg.event_id, 'pagamento_confirmado', null, null, { registration_id: registrationId });
    revalidatePath(`/agenda/${reg.event_id}`);
    revalidatePath(`/comprovante/${registrationId}`);
  }

  return { status: asaasStatus, paid };
}