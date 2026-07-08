'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { getCurrentUser } from '@/features/core/api/get-current-user';

export async function getAdminMemberExtraData(userId: string) {
  const admin = await getCurrentUser();
  if (!admin?.isSysAdmin && !admin?.roles.includes('CHURCH_ADMIN')) {
    return { error: 'Não autorizado' };
  }

  const supabase = await createAdminClient();

  // 1. Fetch Auth details (last_sign_in_at)
  const { data: authData } = await supabase.auth.admin.getUserById(userId);
  const lastSignInAt = authData.user?.last_sign_in_at || null;

  // 2. Fetch Event Registrations
  const { data: events } = await supabase
    .from('event_registrations')
    .select(`
      id, created_at, status, payment_status, payment_amount, receipt_url,
      events ( id, title, start_date )
    `)
    .eq('member_id', userId)
    .order('created_at', { ascending: false });

  // 3. Fetch Notifications (Communications)
  const { data: notifications } = await supabase
    .from('user_notifications')
    .select(`
      id, is_read, read_at, created_at,
      communications ( id, type, title, message )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  // 4. Fetch Support Tickets
  const { data: tickets } = await supabase
    .from('support_tickets')
    .select('id, subject, status, urgency, created_at, closed_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  // 5. Fetch Member Notes (CRM)
  const { data: notes } = await supabase
    .from('member_notes')
    .select(`
      id, note_text, created_at,
      admin:profiles!admin_id ( full_name )
    `)
    .eq('target_user_id', userId)
    .order('created_at', { ascending: false });

  // 6. Fetch Audit Logs
  const { data: logs } = await supabase
    .from('audit_logs')
    .select('id, action, resource_type, created_at, details')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50);

  return {
    success: true,
    data: {
      lastSignInAt,
      events: events || [],
      notifications: notifications || [],
      tickets: tickets || [],
      notes: notes || [],
      logs: logs || []
    }
  };
}

export async function adminAddMemberNote(userId: string, noteText: string) {
  const admin = await getCurrentUser();
  if (!admin?.isSysAdmin && !admin?.roles.includes('CHURCH_ADMIN')) return { error: 'Não autorizado' };

  const supabase = await createAdminClient();
  const { error } = await supabase.from('member_notes').insert({
    target_user_id: userId,
    admin_id: admin.id,
    note_text: noteText
  });

  if (error) return { error: error.message };
  return { success: true };
}

export async function adminResetPinAndOnboarding(userId: string) {
  const admin = await getCurrentUser();
  if (!admin?.isSysAdmin && !admin?.roles.includes('CHURCH_ADMIN')) return { error: 'Não autorizado' };

  const supabase = await createAdminClient();
  const { error } = await supabase.from('profiles').update({
    security_pin_hash: null,
    admin_terms_accepted_at: null,
    onboarding_step: 'accept_admin_terms'
  }).eq('id', userId);

  if (error) return { error: error.message };
  
  // Registrar log
  await supabase.from('audit_logs').insert({
    user_id: admin.id,
    action: 'RESET_ONBOARDING',
    resource_type: 'profiles',
    resource_id: userId,
    details: { target: userId }
  });

  return { success: true };
}
