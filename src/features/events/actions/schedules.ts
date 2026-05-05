'use server'

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { getCurrentUser } from '@/features/core/api/get-current-user';
import { isValidUuid } from '@/lib/action-validators';
import type { ScheduleRole } from '@/features/events/types';

const VALID_ROLES: ScheduleRole[] = ['louvor', 'pregador', 'recepcao', 'tecnica'];

function canManageSchedules(roles: string[], isSysAdmin: boolean = false): boolean {
  return isSysAdmin || roles.some(r => ['SYSADMIN', 'CHURCH_ADMIN', 'LEADER'].includes(r));
}

export async function upsertScheduleSlot(
  eventId: string,
  role: ScheduleRole,
  memberId: string,
  notes: string,
) {
  const user = await getCurrentUser();
  if (!user) return { error: 'Não autorizado.' };
  if (!canManageSchedules(user.roles, user.isSysAdmin)) return { error: 'Acesso negado.' };
  if (!isValidUuid(eventId)) return { error: 'Evento inválido.' };
  if (!VALID_ROLES.includes(role)) return { error: 'Função inválida.' };
  if (memberId && !isValidUuid(memberId)) return { error: 'Membro inválido.' };

  const supabase = await createClient();

  const { data: existing } = await supabase
    .from('event_schedules')
    .select('id')
    .eq('event_id', eventId)
    .eq('role', role)
    .maybeSingle();

  let error;

  if (existing) {
    ({ error } = await supabase
      .from('event_schedules')
      .update({ member_id: memberId || null, notes: notes.trim() || null })
      .eq('id', existing.id));
  } else {
    ({ error } = await supabase
      .from('event_schedules')
      .insert({
        event_id:  eventId,
        role,
        member_id: memberId || null,
        notes:     notes.trim() || null,
      }));
  }

  if (error) {
    console.error('Erro ao salvar escala:', error.message);
    return { error: 'Falha ao salvar a escala.' };
  }

  revalidatePath(`/eventos/${eventId}`);
  return { success: true };
}

export async function removeScheduleSlot(scheduleId: string, eventId: string) {
  const user = await getCurrentUser();
  if (!user) return { error: 'Não autorizado.' };
  if (!canManageSchedules(user.roles, user.isSysAdmin)) return { error: 'Acesso negado.' };
  if (!isValidUuid(scheduleId)) return { error: 'Identificador inválido.' };

  const supabase = await createClient();
  const { error } = await supabase.from('event_schedules').delete().eq('id', scheduleId);

  if (error) {
    console.error('Erro ao remover escala:', error.message);
    return { error: 'Falha ao remover o slot da escala.' };
  }

  revalidatePath(`/eventos/${eventId}`);
  return { success: true };
}