'use server'

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';
import { getCurrentUser, AppRole } from '@/features/core/api/get-current-user';

const GRANTABLE_ROLES: AppRole[] = ['CHURCH_ADMIN', 'FINANCE_ADMIN', 'LEADER'];

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function grantAdminRole(userId: string, role: AppRole): Promise<{ error?: string }> {
  const actor = await getCurrentUser();
  if (!actor?.isSysAdmin) return { error: 'Acesso negado.' };
  if (!GRANTABLE_ROLES.includes(role)) return { error: 'Cargo inválido.' };
  if (!UUID_REGEX.test(userId)) return { error: 'Usuário inválido.' };

  const admin = await createAdminClient();

  const { data: existing } = await admin
    .from('user_roles')
    .select('id')
    .eq('user_id', userId)
    .eq('role', role)
    .maybeSingle();

  if (existing) return { error: 'Este usuário já possui este cargo.' };

  const { error: roleError } = await admin
    .from('user_roles')
    .insert({ user_id: userId, role });

  if (roleError) {
    console.error('[admin-access] Erro ao conceder cargo:', roleError.message);
    return { error: 'Falha ao conceder cargo.' };
  }

  const { data: profile } = await admin
    .from('profiles')
    .select('onboarding_step')
    .eq('id', userId)
    .single();

  if (!profile?.onboarding_step || profile.onboarding_step === 'done') {
    const { error: profileError } = await admin
      .from('profiles')
      .update({ onboarding_step: 'admin_notification' })
      .eq('id', userId);

    if (profileError) {
      console.error('[admin-access] Erro ao iniciar onboarding:', profileError.message);
    }
  }

  const supabase = await createClient();
  await supabase.from('audit_logs').insert({
    entity_name: 'user_roles',
    entity_id:   userId,
    action:      'GRANT_ROLE',
    actor_id:    actor.id,
    actor_name:  actor.fullName,
    actor_role:  'SYSADMIN',
    old_data:    null,
    new_data:    { user_id: userId, role },
  });

  revalidatePath('/sysadmin/acessos');
  return {};
}

export async function revokeAdminRole(userId: string, role: AppRole): Promise<{ error?: string }> {
  const actor = await getCurrentUser();
  if (!actor?.isSysAdmin) return { error: 'Acesso negado.' };
  if (!GRANTABLE_ROLES.includes(role)) return { error: 'Cargo inválido.' };
  if (!UUID_REGEX.test(userId)) return { error: 'Usuário inválido.' };
  if (userId === actor.id) return { error: 'Você não pode revogar seu próprio cargo.' };

  const admin = await createAdminClient();

  const { error } = await admin
    .from('user_roles')
    .delete()
    .eq('user_id', userId)
    .eq('role', role);

  if (error) {
    console.error('[admin-access] Erro ao revogar cargo:', error.message);
    return { error: 'Falha ao revogar cargo.' };
  }

  const { data: remainingRoles } = await admin
    .from('user_roles')
    .select('role')
    .eq('user_id', userId);

  const stillAdmin = remainingRoles?.some(r =>
    ['CHURCH_ADMIN', 'FINANCE_ADMIN', 'LEADER', 'SYSADMIN'].includes(r.role)
  );

  if (!stillAdmin) {
    await admin
      .from('profiles')
      .update({ onboarding_step: 'done' })
      .eq('id', userId);
  }

  const supabase = await createClient();
  await supabase.from('audit_logs').insert({
    entity_name: 'user_roles',
    entity_id:   userId,
    action:      'REVOKE_ROLE',
    actor_id:    actor.id,
    actor_name:  actor.fullName,
    actor_role:  'SYSADMIN',
    old_data:    { user_id: userId, role },
    new_data:    null,
  });

  revalidatePath('/sysadmin/acessos');
  return {};
}

export type UserWithRoles = {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  church_role: string | null;
  onboarding_step: string | null;
  roles: AppRole[];
};

export async function listUsersWithRoles(): Promise<UserWithRoles[]> {
  const actor = await getCurrentUser();
  if (!actor?.isSysAdmin) return [];

  const admin = await createAdminClient();

  const { data: authData } = await admin.auth.admin.listUsers({ perPage: 1000 });
  if (!authData?.users) return [];

  const { data: profiles } = await admin
    .from('profiles')
    .select('id, full_name, phone, church_role, onboarding_step');

  const { data: allRoles } = await admin
    .from('user_roles')
    .select('user_id, role');

  return authData.users
    .filter(u => !u.is_anonymous)
    .map(authUser => {
      const profile = profiles?.find(p => p.id === authUser.id);
      const roles = (allRoles ?? [])
        .filter(r => r.user_id === authUser.id)
        .map(r => r.role as AppRole);

      return {
        id:              authUser.id,
        full_name:       profile?.full_name ?? authUser.email ?? '—',
        email:           authUser.email ?? '—',
        phone:           profile?.phone ?? null,
        church_role:     profile?.church_role ?? null,
        onboarding_step: profile?.onboarding_step ?? null,
        roles,
      };
    });
}