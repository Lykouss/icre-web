'use server'

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { assertSysAdmin } from './admin-access';
import { AppRole } from '@/features/core/api/get-current-user';

export type CommunicationType = 'INFO' | 'WARNING' | 'MAINTENANCE' | 'ALERT' | 'DIRECT_MESSAGE';

export interface AudienceFilter {
  type: 'ALL' | 'PENDING_PAYMENT' | 'UNVERIFIED_EMAIL' | 'NON_ADMINS' | 'ROLES' | 'MANUAL' | 'EVENT_SUBSCRIBERS';
  roles?: AppRole[];
  userIds?: string[];
  emails?: string[];
  eventId?: string;
}

export interface DispatchPayload {
  type: CommunicationType;
  title: string;
  message: string;
  lockDurationSeconds: number;
  audience: AudienceFilter;
  scheduledFor?: string | null;
}

export async function dispatchCommunication(payload: DispatchPayload): Promise<{ success: boolean; error?: string }> {
  try {
    const actor = await assertSysAdmin(); // Requires at least basic admin access, we could restrict to SYSADMIN only later
    const admin = await createAdminClient();

    // 1. Insert into communications table
    const { data: comm, error: commError } = await admin
      .from('communications')
      .insert({
        type: payload.type,
        title: payload.title,
        message: payload.message,
        lock_duration_seconds: payload.lockDurationSeconds,
        audience_filter: payload.audience as any,
        scheduled_for: payload.scheduledFor || null,
        created_by: actor.id,
      })
      .select('id')
      .single();

    if (commError || !comm) throw new Error(commError?.message || 'Erro ao criar comunicação.');

    // 2. Resolve audience filter to user IDs
    let recipientIds: string[] = [];

    if (payload.audience.type === 'ALL') {
      const { data } = await admin.from('profiles').select('id');
      recipientIds = data?.map((u: any) => u.id) || [];
    } else if (payload.audience.type === 'MANUAL') {
      if (payload.audience.userIds && payload.audience.userIds.length > 0) {
        recipientIds = payload.audience.userIds;
      } else if (payload.audience.emails && payload.audience.emails.length > 0) {
        const { data } = await admin.from('profiles').select('id').in('email', payload.audience.emails);
        recipientIds = data?.map((u: any) => u.id) || [];
      }
    } else if (payload.audience.type === 'ROLES' && payload.audience.roles) {
      const { data } = await admin.from('user_roles').select('user_id').in('role', payload.audience.roles);
      recipientIds = Array.from(new Set(data?.map((u: any) => u.user_id) || []));
    } else if (payload.audience.type === 'NON_ADMINS') {
      const { data: usersWithRoles } = await admin.from('user_roles').select('user_id');
      const adminIds = new Set(usersWithRoles?.map((u: any) => u.user_id) || []);
      const { data: allUsers } = await admin.from('profiles').select('id');
      recipientIds = (allUsers?.map((u: any) => u.id) || []).filter((id: string) => !adminIds.has(id));
    } else if (payload.audience.type === 'EVENT_SUBSCRIBERS' && payload.audience.eventId) {
      const { data } = await admin.from('event_registrations').select('user_id').eq('event_id', payload.audience.eventId);
      recipientIds = Array.from(new Set(data?.map((u: any) => u.user_id) || [])).filter(Boolean) as string[];
    } else if (payload.audience.type === 'PENDING_PAYMENT') {
      const { data } = await admin.from('event_registrations').select('user_id').eq('status', 'PENDING');
      recipientIds = Array.from(new Set(data?.map((u: any) => u.user_id) || [])).filter(Boolean) as string[];
    } else if (payload.audience.type === 'UNVERIFIED_EMAIL') {
      const { data: authUsers } = await admin.auth.admin.listUsers();
      recipientIds = authUsers.users.filter((u: any) => !u.email_confirmed_at).map((u: any) => u.id);
    }

    if (recipientIds.length === 0) return { success: true };

    // 3. Batch insert into user_notifications
    const batchSize = 1000;
    for (let i = 0; i < recipientIds.length; i += batchSize) {
      const batch = recipientIds.slice(i, i + batchSize).map(userId => ({
        user_id: userId,
        communication_id: comm.id,
        is_read: false,
      }));
      await admin.from('user_notifications').insert(batch);
    }

    // Optional: We could trigger FCM here directly from the server using firebase-admin SDK.

    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : 'Erro interno.' };
  }
}

export async function sendSystemNotificationToUser(
  userId: string,
  type: CommunicationType,
  title: string,
  message: string
) {
  try {
    const admin = await createAdminClient();
    
    // Create communication
    const { data: comm, error: commError } = await admin
      .from('communications')
      .insert({
        type,
        title,
        message,
        audience_filter: { type: 'MANUAL', userIds: [userId] },
        // Use a system user ID or let created_by be null if allowed, 
        // since it's an internal system message. Assuming foreign key allows null,
        // or we just omit created_by.
      })
      .select('id')
      .single();

    if (commError || !comm) throw new Error(commError?.message || 'Error creating communication');

    // Assign to user
    await admin.from('user_notifications').insert({
      user_id: userId,
      communication_id: comm.id,
      is_read: false,
    });
    
    return { success: true };
  } catch (e) {
    console.error('[sendSystemNotificationToUser] failed', e);
    return { success: false };
  }
}


export async function syncRegistrationNotifications(userId: string, email: string) {
  try {
    const admin = await createAdminClient();
    
    // Buscar inscrições atreladas a este usuário (pelo email)
    const { data: registrations, error: fetchError } = await admin
      .from('event_registrations')
      .select('id, event_id, status, is_gift, notified_events, events(title)')
      .eq('email', email);

    if (fetchError || !registrations) return;

    for (const reg of registrations) {
      const notified = Array.isArray(reg.notified_events) ? reg.notified_events : [];
      const eventObj = Array.isArray(reg.events) ? reg.events[0] : reg.events;
      const eventTitle = eventObj?.title || 'o evento';
      let toNotify = '';
      let msgType: CommunicationType = 'INFO';
      let title = '';
      let message = '';

      if (reg.is_gift && !notified.includes('GIFT')) {
        toNotify = 'GIFT';
        msgType = 'INFO';
        title = 'Você ganhou um Ingresso! 🎁';
        message = `Você foi presenteado com uma inscrição para o evento "${eventTitle}". Acesse seu comprovante para visualizar e aceitar os termos de participação.`;
      } else if (reg.status === 'pendente_pagamento' && !notified.includes('PENDING')) {
        toNotify = 'PENDING';
        msgType = 'WARNING';
        title = 'Pagamento Pendente ⏳';
        message = `Você tem um pagamento pendente para "${eventTitle}". Acesse sua aba de inscrições para concluir o pagamento.`;
      } else if (reg.status === 'confirmado' && !reg.is_gift && !notified.includes('CONFIRMED')) {
        toNotify = 'CONFIRMED';
        msgType = 'INFO';
        title = 'Inscrição Confirmada! 🎉';
        message = `Sua inscrição para "${eventTitle}" foi confirmada com sucesso! Acesse a aba de inscrições para ver seu ingresso.`;
      } else if (reg.status === 'cancelado' && !notified.includes('CANCELLED')) {
        toNotify = 'CANCELLED';
        msgType = 'WARNING';
        title = 'Tempo Expirado ⏰';
        message = `O tempo limite para pagamento da inscrição em "${eventTitle}" expirou. Sua inscrição foi cancelada automaticamente.`;
      }

      if (toNotify) {
        // Envia notificação
        await sendSystemNotificationToUser(userId, msgType, title, message);
        
        // Atualiza a lista de notificações enviadas nesta inscrição
        const newNotified = [...notified, toNotify];
        await admin
          .from('event_registrations')
          .update({ notified_events: newNotified })
          .eq('id', reg.id);
      }
    }
  } catch (e) {
    console.error('[syncRegistrationNotifications] error', e);
  }
}

export async function getUserInbox() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: [], error: 'Não autenticado' };

  if (user.email) {
    await syncRegistrationNotifications(user.id, user.email);
  }

  const { data, error } = await supabase
    .from('user_notifications')
    .select(`
      id,
      is_read,
      read_at,
      created_at,
      communications (
        id, type, title, message, lock_duration_seconds
      )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) return { data: null, error: error.message };
  return { data };
}

export async function markNotificationAsRead(notificationId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Não autenticado' };

  const { error } = await supabase
    .from('user_notifications')
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq('id', notificationId)
    .eq('user_id', user.id); // ensure they own it

  return { success: !error, error: error?.message };
}

export async function searchUsers(query: string) {
  if (!query || query.length < 2) return [];
  try {
    await assertSysAdmin();
    const admin = await createAdminClient();
    
    const isId = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(query);
    
    let q = admin.from('profiles').select('id, full_name, photo_url').limit(10);
    if (isId) {
      q = q.eq('id', query);
    } else {
      q = q.ilike('full_name', `%${query}%`);
    }
    
    const { data } = await q;
    
    if (data && data.length > 0) {
      const enriched = await Promise.all(data.map(async (p: any) => {
        const { data: userAuth } = await admin.auth.admin.getUserById(p.id);
        return {
          id: p.id,
          name: p.full_name,
          email: userAuth.user?.email || 'Sem email',
          photo_url: p.photo_url
        };
      }));
      return enriched;
    }
    
    // If no profiles found by name, try finding by email directly via listUsers 
    // This is a bit slow, but works as fallback
    if (!isId && query.includes('@')) {
      const { data: authUsers } = await admin.auth.admin.listUsers();
      const match = authUsers.users.find(u => u.email?.toLowerCase().includes(query.toLowerCase()));
      if (match) {
        const { data: profile } = await admin.from('profiles').select('full_name, photo_url').eq('id', match.id).single();
        return [{
          id: match.id,
          name: profile?.full_name || 'Desconhecido',
          email: match.email || '',
          photo_url: profile?.photo_url
        }];
      }
    }
    
    return [];
  } catch (e) {
    console.error('searchUsers error:', e);
    return [];
  }
}

