'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { getCurrentUser } from '@/features/core/api/get-current-user';

export async function adminCreateUser(data: { fullName: string; email: string; password: string; role: string; }) {
  const admin = await getCurrentUser();
  if (!admin?.isSysAdmin && !admin?.roles.includes('CHURCH_ADMIN')) {
    return { error: 'Não autorizado' };
  }
  if (data.role === 'SYSADMIN' && !admin.isSysAdmin) {
    return { error: 'ChurchAdmins não podem criar contas de SysAdmin.' };
  }

  const supabase = await createAdminClient();

  // Create Auth user
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: data.email,
    password: data.password,
    email_confirm: true,
  });

  if (authError || !authData.user) {
    return { error: authError?.message || 'Erro ao criar usuário no Auth' };
  }

  const newUserId = authData.user.id;

  // Insert profile explicitly (even if trigger handles it, we want to ensure fullName is set)
  // Our trigger on auth.users will set the email, but fullName requires explicit insert/update.
  const { error: profileError } = await supabase.from('profiles').upsert({
    id: newUserId,
    full_name: data.fullName,
    email: data.email,
  });

  if (profileError) {
    // Attempt rollback
    await supabase.auth.admin.deleteUser(newUserId);
    return { error: profileError.message };
  }

  // Insert role
  if (data.role !== 'MEMBER') {
    const { error: roleError } = await supabase.from('user_roles').insert({
      user_id: newUserId,
      role: data.role,
    });
    if (roleError) {
      console.error('Role assign error:', roleError);
    }
  }

  return { success: true };
}

export async function adminUpdateUserProfile(userId: string, data: {
  fullName?: string;
  phone?: string;
  address?: string;
  cellGroup?: string;
  photoUrl?: string;
  birthDate?: string;
  gender?: string;
  maritalStatus?: string;
}) {
  const admin = await getCurrentUser();
  if (!admin?.isSysAdmin && !admin?.roles.includes('CHURCH_ADMIN')) {
    return { error: 'Não autorizado' };
  }

  const supabase = await createAdminClient();

  // Protect against editing SYSADMINs if you are not a SYSADMIN
  const { data: targetRoles } = await supabase.from('user_roles').select('role').eq('user_id', userId);
  const isTargetSysAdmin = targetRoles?.some(r => r.role === 'SYSADMIN');
  if (isTargetSysAdmin && !admin.isSysAdmin) {
    return { error: 'ChurchAdmins não podem alterar dados de um SysAdmin.' };
  }

  // Se for um ChurchAdmin tentando editar outro ChurchAdmin
  const isTargetChurchAdmin = targetRoles?.some(r => r.role === 'CHURCH_ADMIN');
  if (isTargetChurchAdmin && !admin.isSysAdmin) {
    return { error: 'ChurchAdmins não podem alterar dados de outro ChurchAdmin.' };
  }

  const payload: any = {};
  if (data.fullName !== undefined) payload.full_name = data.fullName;
  if (data.phone !== undefined) payload.phone = data.phone;
  if (data.address !== undefined) payload.address = data.address;
  if (data.cellGroup !== undefined) payload.cell_group = data.cellGroup;
  if (data.photoUrl !== undefined) payload.photo_url = data.photoUrl;
  if (data.birthDate !== undefined) payload.birth_date = data.birthDate;
  if (data.gender !== undefined) payload.gender = data.gender;
  if (data.maritalStatus !== undefined) payload.marital_status = data.maritalStatus;

  const { error } = await supabase
    .from('profiles')
    .update(payload)
    .eq('id', userId);

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}

export async function adminMassForceLogout(userIds: string[]) {
  const admin = await getCurrentUser();
  if (!admin?.isSysAdmin && !admin?.roles.includes('CHURCH_ADMIN')) return { error: 'Não autorizado' };

  const supabase = await createAdminClient();
  const { error } = await supabase.from('profiles').update({ force_logout: true }).in('id', userIds);
  if (error) return { error: error.message };
  return { success: true };
}

export async function adminMassRequirePassword(userIds: string[]) {
  const admin = await getCurrentUser();
  if (!admin?.isSysAdmin && !admin?.roles.includes('CHURCH_ADMIN')) return { error: 'Não autorizado' };

  const supabase = await createAdminClient();
  const { error } = await supabase.from('profiles').update({ requires_password_change: true }).in('id', userIds);
  if (error) return { error: error.message };
  return { success: true };
}

export async function adminMassBan(userIds: string[], bannedUntil: string | null, banReason: string | null) {
  const admin = await getCurrentUser();
  if (!admin?.isSysAdmin && !admin?.roles.includes('CHURCH_ADMIN')) return { error: 'Não autorizado' };

  const supabase = await createAdminClient();
  const { error } = await supabase.from('profiles').update({ 
    banned_until: bannedUntil,
    ban_reason: banReason
  }).in('id', userIds);
  if (error) return { error: error.message };
  return { success: true };
}



export async function adminUpdateUserAuth(userId: string, data: {
  email?: string;
  password?: string;
  requiresPasswordChange?: boolean;
}) {
  const admin = await getCurrentUser();
  if (!admin?.isSysAdmin && !admin?.roles.includes('CHURCH_ADMIN')) {
    return { error: 'Não autorizado' };
  }

  const supabase = await createAdminClient();

  // Protect against editing SYSADMINs if you are not a SYSADMIN
  const { data: targetRoles } = await supabase.from('user_roles').select('role').eq('user_id', userId);
  const isTargetSysAdmin = targetRoles?.some(r => r.role === 'SYSADMIN');
  if (isTargetSysAdmin && !admin.isSysAdmin) {
    return { error: 'ChurchAdmins não podem alterar dados de um SysAdmin.' };
  }

  const isTargetChurchAdmin = targetRoles?.some(r => r.role === 'CHURCH_ADMIN');
  if (isTargetChurchAdmin && !admin.isSysAdmin) {
    return { error: 'ChurchAdmins não podem alterar dados de outro ChurchAdmin.' };
  }

  if (data.email || data.password) {
    const authPayload: any = {};
    if (data.email) authPayload.email = data.email;
    if (data.password) authPayload.password = data.password;

    const { error: authError } = await supabase.auth.admin.updateUserById(userId, authPayload);
    if (authError) return { error: authError.message };
  }

  if (data.requiresPasswordChange !== undefined) {
    const { error: profError } = await supabase
      .from('profiles')
      .update({ requires_password_change: data.requiresPasswordChange })
      .eq('id', userId);
    if (profError) return { error: profError.message };
  }

  return { success: true };
}

export async function adminBanUser(userId: string, data: {
  bannedUntil: string | null;
  reason: string;
  bannedModules: string[];
}) {
  const admin = await getCurrentUser();
  if (!admin?.isSysAdmin && !admin?.roles.includes('CHURCH_ADMIN')) {
    return { error: 'Não autorizado' };
  }

  const supabase = await createAdminClient();

  // Protect against editing SYSADMINs if you are not a SYSADMIN
  const { data: targetRoles } = await supabase.from('user_roles').select('role').eq('user_id', userId);
  const isTargetSysAdmin = targetRoles?.some(r => r.role === 'SYSADMIN');
  if (isTargetSysAdmin && !admin.isSysAdmin) {
    return { error: 'ChurchAdmins não podem banir um SysAdmin.' };
  }

  const isTargetChurchAdmin = targetRoles?.some(r => r.role === 'CHURCH_ADMIN');
  if (isTargetChurchAdmin && !admin.isSysAdmin) {
    return { error: 'ChurchAdmins não podem banir outro ChurchAdmin.' };
  }

  const { error } = await supabase
    .from('profiles')
    .update({ 
      banned_until: data.bannedUntil,
      ban_reason: data.bannedUntil ? data.reason : null,
      banned_modules: data.bannedModules
    })
    .eq('id', userId);

  if (error) return { error: error.message };
  
  return { success: true };
}
