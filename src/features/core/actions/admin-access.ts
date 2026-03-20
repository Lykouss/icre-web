'use server'

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';
import { getCurrentUser, AppRole } from '@/features/core/api/get-current-user';

const GRANTABLE_ROLES: AppRole[] = ['CHURCH_ADMIN', 'FINANCE_ADMIN', 'LEADER'];
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isValidUUID(id: string) {
  return UUID_REGEX.test(id);
}

async function assertSysAdmin() {
  const actor = await getCurrentUser();
  if (!actor?.isSysAdmin) throw new Error('Acesso negado.');
  return actor;
}

// ── Cargos ────────────────────────────────────────────────────

export async function grantAdminRole(userId: string, role: AppRole): Promise<{ error?: string }> {
  try {
    const actor = await assertSysAdmin();
    if (!GRANTABLE_ROLES.includes(role)) return { error: 'Cargo inválido.' };
    if (!isValidUUID(userId)) return { error: 'Usuário inválido.' };

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
      console.error('[admin-access] grantAdminRole:', roleError.message);
      return { error: 'Falha ao conceder cargo.' };
    }

    const { data: profile } = await admin
      .from('profiles')
      .select('onboarding_step, admin_profile_completed_at, photo_url, admin_terms_accepted_at, security_pin_hash')
      .eq('id', userId)
      .single();

    if (!profile?.onboarding_step || profile.onboarding_step === 'done') {
      let nextStep = 'admin_notification';
      if (profile?.admin_profile_completed_at) {
        if (!profile.photo_url)                   nextStep = 'admin_notification';
        else if (!profile.admin_terms_accepted_at) nextStep = 'admin_notification';
        else if (!profile.security_pin_hash)       nextStep = 'admin_notification';
        else                                       nextStep = 'admin_notification';
      }

      await admin
        .from('profiles')
        .update({ onboarding_step: nextStep })
        .eq('id', userId);
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
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Erro desconhecido.' };
  }
}

export async function revokeAdminRole(userId: string, role: AppRole): Promise<{ error?: string }> {
  try {
    const actor = await assertSysAdmin();
    if (!GRANTABLE_ROLES.includes(role)) return { error: 'Cargo inválido.' };
    if (!isValidUUID(userId)) return { error: 'Usuário inválido.' };
    if (userId === actor.id) return { error: 'Você não pode revogar seu próprio cargo.' };

    const admin = await createAdminClient();

    const { error } = await admin
      .from('user_roles')
      .delete()
      .eq('user_id', userId)
      .eq('role', role);

    if (error) {
      console.error('[admin-access] revokeAdminRole:', error.message);
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
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Erro desconhecido.' };
  }
}

// ── Suspensão ─────────────────────────────────────────────────

export async function suspendAdmin(
  userId: string,
  reason: string,
  until: Date | null
): Promise<{ error?: string }> {
  try {
    const actor = await assertSysAdmin();
    if (!isValidUUID(userId)) return { error: 'Usuário inválido.' };
    if (userId === actor.id) return { error: 'Você não pode suspender sua própria conta.' };
    if (!reason?.trim()) return { error: 'A justificativa é obrigatória.' };

    const admin = await createAdminClient();

    const banDuration = until
      ? `${Math.ceil((until.getTime() - Date.now()) / 3600000)}h`
      : '876600h';

    const { error: banError } = await admin.auth.admin.updateUserById(userId, {
      ban_duration: banDuration,
    });

    if (banError) {
      console.error('[admin-access] suspendAdmin ban:', banError.message);
      return { error: 'Falha ao suspender o acesso.' };
    }

    const { error: profileError } = await admin
      .from('profiles')
      .update({
        is_suspended:      true,
        suspended_until:   until?.toISOString() ?? null,
        suspension_reason: reason.trim(),
        suspended_by_name: actor.fullName,
      })
      .eq('id', userId);

    if (profileError) {
      console.error('[admin-access] suspendAdmin profile:', profileError.message);
    }

    const supabase = await createClient();
    await supabase.from('audit_logs').insert({
      entity_name: 'profiles',
      entity_id:   userId,
      action:      'SUSPEND_ACCESS',
      actor_id:    actor.id,
      actor_name:  actor.fullName,
      actor_role:  'SYSADMIN',
      old_data:    null,
      new_data:    {
        suspended: true,
        reason:    reason.trim(),
        until:     until?.toISOString() ?? 'indefinido',
      },
    });

    revalidatePath('/sysadmin/acessos');
    return {};
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Erro desconhecido.' };
  }
}

export async function unsuspendAdmin(userId: string): Promise<{ error?: string }> {
  try {
    const actor = await assertSysAdmin();
    if (!isValidUUID(userId)) return { error: 'Usuário inválido.' };

    const admin = await createAdminClient();

    await admin.auth.admin.updateUserById(userId, { ban_duration: 'none' });

    await admin
      .from('profiles')
      .update({
        is_suspended:      false,
        suspended_until:   null,
        suspension_reason: null,
        suspended_by_name: null,
      })
      .eq('id', userId);

    const supabase = await createClient();
    await supabase.from('audit_logs').insert({
      entity_name: 'profiles',
      entity_id:   userId,
      action:      'UNSUSPEND_ACCESS',
      actor_id:    actor.id,
      actor_name:  actor.fullName,
      actor_role:  'SYSADMIN',
      old_data:    { suspended: true },
      new_data:    { suspended: false },
    });

    revalidatePath('/sysadmin/acessos');
    return {};
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Erro desconhecido.' };
  }
}

// ── Redefinições ──────────────────────────────────────────────

export async function resetAdminPin(userId: string): Promise<{ error?: string }> {
  try {
    const actor = await assertSysAdmin();
    if (!isValidUUID(userId)) return { error: 'Usuário inválido.' };

    const admin = await createAdminClient();

    const { error } = await admin
      .from('profiles')
      .update({ security_pin_hash: null, onboarding_step: 'create_pin' })
      .eq('id', userId);

    if (error) {
      console.error('[admin-access] resetAdminPin:', error.message);
      return { error: 'Falha ao redefinir o PIN.' };
    }

    const supabase = await createClient();
    await supabase.from('audit_logs').insert({
      entity_name: 'profiles',
      entity_id:   userId,
      action:      'RESET_PIN',
      actor_id:    actor.id,
      actor_name:  actor.fullName,
      actor_role:  'SYSADMIN',
      old_data:    null,
      new_data:    null,
    });

    revalidatePath('/sysadmin/acessos');
    return {};
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Erro desconhecido.' };
  }
}

export async function resetAdminPassword(userId: string): Promise<{ error?: string }> {
  try {
    const actor = await assertSysAdmin();
    if (!isValidUUID(userId)) return { error: 'Usuário inválido.' };

    const admin = await createAdminClient();
    const { data: authUser } = await admin.auth.admin.getUserById(userId);
    if (!authUser?.user?.email) return { error: 'E-mail do usuário não encontrado.' };

    const supabase = await createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(
      authUser.user.email,
      { redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback?next=/nova-senha` }
    );

    if (error) {
      console.error('[admin-access] resetAdminPassword:', error.message);
      return { error: 'Falha ao enviar e-mail de redefinição.' };
    }

    await supabase.from('audit_logs').insert({
      entity_name: 'profiles',
      entity_id:   userId,
      action:      'RESET_PASSWORD',
      actor_id:    actor.id,
      actor_name:  actor.fullName,
      actor_role:  'SYSADMIN',
      old_data:    null,
      new_data:    { email_sent_to: authUser.user.email },
    });

    return {};
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Erro desconhecido.' };
  }
}

// ── Edição de dados ───────────────────────────────────────────

export async function updateAdminProfile(
  userId: string,
  data: {
    full_name?: string;
    church_role?: string;
    phone?: string;
    address?: string;
    roles?: AppRole[];
  }
): Promise<{ error?: string }> {
  try {
    const actor = await assertSysAdmin();
    if (!isValidUUID(userId)) return { error: 'Usuário inválido.' };

    const admin = await createAdminClient();

    const { data: oldProfile } = await admin
      .from('profiles')
      .select('full_name, church_role, phone, address')
      .eq('id', userId)
      .single();

    const updates: Record<string, string> = {};
    if (data.full_name)   updates.full_name   = data.full_name.trim();
    if (data.church_role) updates.church_role = data.church_role.trim();
    if (data.phone)       updates.phone       = data.phone.replace(/\D/g, '');
    if (data.address)     updates.address     = data.address.trim();

    if (Object.keys(updates).length > 0) {
      const { error: profileError } = await admin
        .from('profiles')
        .update(updates)
        .eq('id', userId);

      if (profileError) {
        console.error('[admin-access] updateAdminProfile:', profileError.message);
        return { error: 'Falha ao atualizar os dados.' };
      }
    }

    if (data.roles !== undefined) {
      const validRoles = data.roles.filter(r => GRANTABLE_ROLES.includes(r));
      await admin.from('user_roles').delete().eq('user_id', userId)
        .in('role', GRANTABLE_ROLES);
      if (validRoles.length > 0) {
        await admin.from('user_roles').insert(
          validRoles.map(role => ({ user_id: userId, role }))
        );
      }
    }

    const supabase = await createClient();
    await supabase.from('audit_logs').insert({
      entity_name: 'profiles',
      entity_id:   userId,
      action:      'UPDATE_ADMIN_PROFILE',
      actor_id:    actor.id,
      actor_name:  actor.fullName,
      actor_role:  'SYSADMIN',
      old_data:    oldProfile as Record<string, unknown>,
      new_data:    updates as Record<string, unknown>,
    });

    revalidatePath('/sysadmin/acessos');
    return {};
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Erro desconhecido.' };
  }
}

// ── Logs de auditoria ─────────────────────────────────────────

export type AuditLogEntry = {
  id: string;
  action: string;
  actor_name: string;
  actor_role: string;
  entity_name: string;
  old_data: Record<string, unknown> | null;
  new_data: Record<string, unknown> | null;
  created_at: string;
};

export async function getAdminAuditLogs(userId: string): Promise<AuditLogEntry[]> {
  try {
    await assertSysAdmin();
    if (!isValidUUID(userId)) return [];

    const admin = await createAdminClient();

    const { data } = await admin
      .from('audit_logs')
      .select('id, action, actor_name, actor_role, entity_name, old_data, new_data, created_at')
      .or(`entity_id.eq.${userId},actor_id.eq.${userId}`)
      .order('created_at', { ascending: false })
      .limit(200);

    return (data ?? []) as AuditLogEntry[];
  } catch {
    return [];
  }
}

// ── Listagem ──────────────────────────────────────────────────

export type UserWithRoles = {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  church_role: string | null;
  photo_url: string | null;
  onboarding_step: string | null;
  is_suspended: boolean;
  suspended_until: string | null;
  suspension_reason: string | null;
  suspended_by_name: string | null;
  roles: AppRole[];
};

export async function listUsersWithRoles(): Promise<UserWithRoles[]> {
  try {
    await assertSysAdmin();

    const admin = await createAdminClient();

    const { data: authData } = await admin.auth.admin.listUsers({ perPage: 1000 });
    if (!authData?.users) return [];

    const { data: profiles } = await admin
      .from('profiles')
      .select('id, full_name, phone, church_role, photo_url, onboarding_step, is_suspended, suspended_until, suspension_reason, suspended_by_name');

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
          id:                authUser.id,
          full_name:         profile?.full_name ?? authUser.email ?? '—',
          email:             authUser.email ?? '—',
          phone:             profile?.phone ?? null,
          church_role:       profile?.church_role ?? null,
          photo_url:         profile?.photo_url ?? null,
          onboarding_step:   profile?.onboarding_step ?? null,
          is_suspended:      profile?.is_suspended ?? false,
          suspended_until:   profile?.suspended_until ?? null,
          suspension_reason: profile?.suspension_reason ?? null,
          suspended_by_name: profile?.suspended_by_name ?? null,
          roles,
        };
      });
  } catch {
    return [];
  }
}