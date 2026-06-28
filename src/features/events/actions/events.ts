'use server'

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { getCurrentUser } from '@/features/core/api/get-current-user';
import { isValidUuid, isValidDate } from '@/lib/action-validators';
import type { EventType, EventStatus } from '@/features/events/types';

const VALID_EVENT_TYPES: EventType[] = ['culto', 'especial'];
const VALID_EVENT_STATUSES: EventStatus[] = ['rascunho', 'publicado', 'encerrado', 'cancelado'];
const VALID_RECURRENCE_DAYS = [0, 1, 2, 3, 4, 5, 6];

function canManageEvents(roles: string[], isSysAdmin: boolean = false): boolean {
  return isSysAdmin || roles.some(r => ['SYSADMIN', 'CHURCH_ADMIN'].includes(r));
}

function extractEventFields(formData: FormData) {
  const title        = (formData.get('title')          as string)?.trim();
  const type         = (formData.get('type')           as string)?.trim() as EventType;
  const description  = (formData.get('description')    as string)?.trim();
  const date         = (formData.get('date')           as string)?.trim();
  const time         = (formData.get('time')           as string)?.trim();
  const location     = (formData.get('location')       as string)?.trim();
  const bannerUrl    = (formData.get('banner_url')     as string)?.trim();
  const publishAt    = (formData.get('publish_at')     as string)?.trim();
  const isPublic     = formData.get('is_public')    === 'on';
  const isRecurring  = formData.get('is_recurring') === 'on';
  const recurrenceRules = JSON.parse((formData.get('recurrence_rules') as string) || 'null');
  const cancelledDates = JSON.parse((formData.get('cancelled_dates') as string) || 'null');
  const capacity     = parseInt(formData.get('capacity') as string, 10);
  const maxPerAccount = parseInt(formData.get('max_per_account') as string, 10);
  const maxPerIp      = parseInt(formData.get('max_per_ip') as string, 10);
  const maxPerDevice  = parseInt(formData.get('max_per_device') as string, 10);
  const paymentMethods = JSON.parse((formData.get('payment_methods') as string) || '["pix"]');
  const termsText     = (formData.get('terms_text') as string)?.trim() || null;
  const acceptsPix    = formData.get('accepts_pix') === 'on';
  const acceptsBoleto = formData.get('accepts_boleto') === 'on';

  return { title, type, description, date, time, location, bannerUrl, publishAt, isPublic, isRecurring, recurrenceRules, cancelledDates, capacity, maxPerAccount, maxPerIp, maxPerDevice, paymentMethods, termsText, acceptsPix, acceptsBoleto };
}

function validateEventFields(fields: ReturnType<typeof extractEventFields>): string | null {
  const { title, type, date, isRecurring, recurrenceRules } = fields;

  if (!title || title.length < 3)          return 'Título precisa ter ao menos 3 caracteres.';
  if (!VALID_EVENT_TYPES.includes(type))   return 'Tipo de evento inválido.';
  if (!isRecurring && (!date || !isValidDate(date))) return 'Data inválida.';
  if (isRecurring && !recurrenceRules) return 'Regras de recorrência inválidas.';

  return null;
}

function buildEventPayload(fields: ReturnType<typeof extractEventFields>, createdBy?: string) {
  const { title, type, description, date, time, location, bannerUrl, publishAt, isPublic, isRecurring, recurrenceRules, cancelledDates, capacity, maxPerAccount, maxPerIp, maxPerDevice, paymentMethods, termsText, acceptsPix, acceptsBoleto } = fields;

  return {
    title,
    type,
    description:    description   || null,
    date:           isRecurring   ? null : (date || null),
    time:           time          || null,
    location:       location      || null,
    banner_url:     bannerUrl     || null,
    publish_at:     publishAt     || null,
    is_public:      isPublic,
    is_recurring:   isRecurring,
    recurrence_rules: isRecurring ? recurrenceRules : null,
    cancelled_dates: cancelledDates || [],
    capacity:       !isNaN(capacity) && capacity > 0 ? capacity : null,
    max_per_account: !isNaN(maxPerAccount) && maxPerAccount > 0 ? maxPerAccount : 1,
    max_per_ip:     !isNaN(maxPerIp) && maxPerIp > 0 ? maxPerIp : 2,
    max_per_device: !isNaN(maxPerDevice) && maxPerDevice > 0 ? maxPerDevice : 2,
    payment_methods: paymentMethods,
    terms_text:     termsText,
    accepts_pix:    acceptsPix,
    accepts_boleto: acceptsBoleto,
    ...(createdBy ? { created_by: createdBy } : {}),
  };
}

export async function createEvent(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) return { error: 'Não autorizado.' };
  if (!canManageEvents(user.roles, user.isSysAdmin)) return { error: 'Acesso negado.' };

  const fields = extractEventFields(formData);
  const validationError = validateEventFields(fields);
  if (validationError) return { error: validationError };

  const supabase = await createClient();

  const { data, error } = await supabase
    .from('events')
    .insert({ ...buildEventPayload(fields, user.id), status: 'rascunho' })
    .select()
    .single();

  if (error) {
    console.error('Erro ao criar evento:', error.message);
    return { error: 'Falha ao salvar o evento.' };
  }

  revalidatePath('/eventos');
  return { success: true, id: data.id };
}

export async function updateEvent(eventId: string, formData: FormData) {
  const user = await getCurrentUser();
  if (!user) return { error: 'Não autorizado.' };
  if (!canManageEvents(user.roles, user.isSysAdmin)) return { error: 'Acesso negado.' };
  if (!isValidUuid(eventId)) return { error: 'Identificador de evento inválido.' };

  const fields = extractEventFields(formData);
  const validationError = validateEventFields(fields);
  if (validationError) return { error: validationError };

  const supabase = await createClient();

  const { error } = await supabase
    .from('events')
    .update(buildEventPayload(fields))
    .eq('id', eventId);

  if (error) {
    console.error('Erro ao atualizar evento:', error.message);
    return { error: 'Falha ao atualizar o evento.' };
  }

  revalidatePath('/eventos');
  revalidatePath(`/eventos/${eventId}`);
  return { success: true };
}

export async function updateEventStatus(eventId: string, status: EventStatus) {
  const user = await getCurrentUser();
  if (!user) return { error: 'Não autorizado.' };
  if (!canManageEvents(user.roles, user.isSysAdmin)) return { error: 'Acesso negado.' };
  if (!isValidUuid(eventId)) return { error: 'Identificador inválido.' };
  if (!VALID_EVENT_STATUSES.includes(status)) return { error: 'Status inválido.' };

  const supabase = await createClient();

  const { error } = await supabase
    .from('events')
    .update({ status })
    .eq('id', eventId);

  if (error) {
    console.error('Erro ao atualizar status:', error.message);
    return { error: 'Falha ao atualizar o status.' };
  }

  revalidatePath('/eventos');
  revalidatePath(`/eventos/${eventId}`);
  return { success: true };
}

export async function deleteEvent(eventId: string) {
  const user = await getCurrentUser();
  if (!user) return { error: 'Não autorizado.' };
  if (!user.isSysAdmin) return { error: 'Apenas SYSADMIN pode excluir eventos.' };
  if (!isValidUuid(eventId)) return { error: 'Identificador inválido.' };

  const supabase = await createClient();
  const { error } = await supabase.from('events').delete().eq('id', eventId);

  if (error) {
    console.error('Erro ao excluir evento:', error.message);
    return { error: 'Falha ao excluir o evento.' };
  }

  revalidatePath('/eventos');
  return { success: true };
}

export async function generateRecurringOccurrences(templateId: string, weeksAhead: number) {
  const user = await getCurrentUser();
  if (!user) return { error: 'Não autorizado.' };
  if (!canManageEvents(user.roles, user.isSysAdmin)) return { error: 'Acesso negado.' };
  if (!isValidUuid(templateId)) return { error: 'Identificador inválido.' };
  if (!Number.isInteger(weeksAhead) || weeksAhead < 1 || weeksAhead > 52) {
    return { error: 'Número de semanas deve ser entre 1 e 52.' };
  }

  const supabase = await createClient();

  const { data: template, error: fetchError } = await supabase
    .from('events')
    .select('*')
    .eq('id', templateId)
    .eq('is_recurring', true)
    .single();

  if (fetchError || !template) return { error: 'Template de culto não encontrado.' };

  const targetDay: number = template.recurrence_day;
  const occurrences = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let w = 1; w <= weeksAhead; w++) {
    const d = new Date(today);
    const daysUntilTarget = (targetDay - today.getDay() + 7) % 7 || 7;
    d.setDate(today.getDate() + daysUntilTarget + (w - 1) * 7);

    occurrences.push({
      title:        template.title,
      type:         template.type,
      description:  template.description,
      date:         d.toISOString().split('T')[0],
      time:         template.time,
      location:     template.location,
      banner_url:   template.banner_url,
      is_recurring: false,
      is_public:    template.is_public,
      status:       'rascunho' as EventStatus,
      created_by:   user.id,
    });
  }

  const { error: insertError } = await supabase.from('events').insert(occurrences);

  if (insertError) {
    console.error('Erro ao gerar ocorrências:', insertError.message);
    return { error: 'Falha ao gerar as ocorrências.' };
  }

  revalidatePath('/eventos');
  return { success: true, count: occurrences.length };
}

export async function cancelEventOccurrence(eventId: string, dateStr: string) {
  const user = await getCurrentUser();
  if (!user) return { error: 'Não autorizado.' };
  if (!canManageEvents(user.roles, user.isSysAdmin)) return { error: 'Acesso negado.' };
  if (!isValidUuid(eventId)) return { error: 'Identificador de evento inválido.' };

  const supabase = await createClient();
  
  const { data, error: fetchErr } = await supabase.from('events').select('cancelled_dates').eq('id', eventId).single();
  if (fetchErr || !data) return { error: 'Evento não encontrado: ' + fetchErr?.message };
  
  const currentDates = Array.isArray(data.cancelled_dates) ? data.cancelled_dates : [];
  if (!currentDates.includes(dateStr)) {
    currentDates.push(dateStr);
    const { error: updErr } = await supabase.from('events').update({ cancelled_dates: currentDates }).eq('id', eventId);
    if (updErr) return { error: 'Falha ao salvar no banco: ' + updErr.message };
  }

  revalidatePath('/eventos');
  revalidatePath(`/eventos/${eventId}`);
  revalidatePath('/');
  return { success: true, cancelled_dates: currentDates };
}