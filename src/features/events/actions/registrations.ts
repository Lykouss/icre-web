'use server'

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { getCurrentUser } from '@/features/core/api/get-current-user';
import { isValidUuid, isValidPhone } from '@/lib/action-validators';
import type { PaymentStatus, PaymentMethod } from '@/features/events/types';

const VALID_PAYMENT_STATUSES: PaymentStatus[] = ['gratuito', 'pendente', 'pago', 'reembolsado'];
const VALID_PAYMENT_METHODS: PaymentMethod[]  = ['pix', 'cartao', 'dinheiro', 'cortesia'];

export async function createRegistration(eventId: string, formData: FormData) {
  const user = await getCurrentUser();
  if (!user) return { error: 'Não autorizado.' };
  if (!isValidUuid(eventId)) return { error: 'Evento inválido.' };

  const name     = (formData.get('name')      as string)?.trim();
  const phone    = (formData.get('phone')     as string)?.trim();
  const memberId = (formData.get('member_id') as string)?.trim();

  if (!name || name.length < 3)             return { error: 'Nome precisa ter ao menos 3 caracteres.' };
  if (phone && !isValidPhone(phone))        return { error: 'Telefone inválido.' };
  if (memberId && !isValidUuid(memberId))   return { error: 'Membro inválido.' };

  const supabase = await createClient();

  if (memberId) {
    const { data: duplicate } = await supabase
      .from('event_registrations')
      .select('id')
      .eq('event_id', eventId)
      .eq('member_id', memberId)
      .eq('status', 'confirmado')
      .maybeSingle();

    if (duplicate) return { error: 'Este membro já está inscrito neste evento.' };
  }

  const { data: event } = await supabase
    .from('events')
    .select('capacity')
    .eq('id', eventId)
    .single();

  if (event?.capacity) {
    const { count } = await supabase
      .from('event_registrations')
      .select('id', { count: 'exact', head: true })
      .eq('event_id', eventId)
      .eq('status', 'confirmado');

    if ((count ?? 0) >= event.capacity) {
      return { error: 'Evento lotado. Não há vagas disponíveis.' };
    }
  }

  const { error } = await supabase.from('event_registrations').insert({
    event_id:       eventId,
    name,
    phone:          phone    || null,
    member_id:      memberId || null,
    status:         'confirmado',
    payment_status: 'gratuito',
  });

  if (error) {
    console.error('Erro ao criar inscrição:', error.message);
    return { error: 'Falha ao registrar a inscrição.' };
  }

  revalidatePath(`/eventos/${eventId}`);
  return { success: true };
}

export async function updateRegistrationPayment(
  registrationId: string,
  eventId: string,
  paymentStatus: PaymentStatus,
  paymentMethod: PaymentMethod | null,
  paymentAmount: number | null,
  paymentRef: string,
) {
  const user = await getCurrentUser();
  if (!user) return { error: 'Não autorizado.' };
  if (!user.roles.some(r => ['SYSADMIN', 'CHURCH_ADMIN'].includes(r))) {
    return { error: 'Acesso negado.' };
  }
  if (!isValidUuid(registrationId)) return { error: 'Inscrição inválida.' };
  if (!VALID_PAYMENT_STATUSES.includes(paymentStatus)) return { error: 'Status de pagamento inválido.' };
  if (paymentMethod && !VALID_PAYMENT_METHODS.includes(paymentMethod)) return { error: 'Método de pagamento inválido.' };
  if (paymentAmount !== null && (isNaN(paymentAmount) || paymentAmount < 0)) return { error: 'Valor inválido.' };

  const supabase = await createClient();

  const { error } = await supabase
    .from('event_registrations')
    .update({
      payment_status: paymentStatus,
      payment_method: paymentMethod  || null,
      payment_amount: paymentAmount  ?? null,
      payment_ref:    paymentRef.trim() || null,
      paid_at:        paymentStatus === 'pago' ? new Date().toISOString() : null,
    })
    .eq('id', registrationId);

  if (error) {
    console.error('Erro ao atualizar pagamento:', error.message);
    return { error: 'Falha ao atualizar o pagamento.' };
  }

  revalidatePath(`/eventos/${eventId}`);
  return { success: true };
}

export async function cancelRegistration(registrationId: string, eventId: string) {
  const user = await getCurrentUser();
  if (!user) return { error: 'Não autorizado.' };
  if (!isValidUuid(registrationId)) return { error: 'Inscrição inválida.' };

  const supabase = await createClient();
  const { error } = await supabase
    .from('event_registrations')
    .update({ status: 'cancelado' })
    .eq('id', registrationId);

  if (error) {
    console.error('Erro ao cancelar inscrição:', error.message);
    return { error: 'Falha ao cancelar a inscrição.' };
  }

  revalidatePath(`/eventos/${eventId}`);
  return { success: true };
}

export async function checkInAttendance(eventId: string, name: string, memberId?: string) {
  const user = await getCurrentUser();
  if (!user) return { error: 'Não autorizado.' };
  if (!isValidUuid(eventId)) return { error: 'Evento inválido.' };

  const trimmedName = name?.trim();
  if (!trimmedName || trimmedName.length < 2) return { error: 'Nome inválido.' };
  if (memberId && !isValidUuid(memberId)) return { error: 'Membro inválido.' };

  const supabase = await createClient();

  if (memberId) {
    const { data: existing } = await supabase
      .from('event_attendance')
      .select('id')
      .eq('event_id', eventId)
      .eq('member_id', memberId)
      .maybeSingle();

    if (existing) return { error: 'Este membro já fez check-in.' };
  }

  const { error } = await supabase.from('event_attendance').insert({
    event_id:  eventId,
    name:      trimmedName,
    member_id: memberId || null,
  });

  if (error) {
    console.error('Erro ao registrar presença:', error.message);
    return { error: 'Falha ao registrar a presença.' };
  }

  revalidatePath(`/eventos/${eventId}`);
  return { success: true };
}