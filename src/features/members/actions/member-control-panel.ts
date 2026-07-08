'use server'

import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/features/core/api/get-current-user';
import { revalidatePath } from 'next/cache';
import crypto from 'crypto';

// Reusable function to log audit
async function logAudit(
  adminId: string,
  targetId: string,
  actionType: string,
  description: string,
  messageToUser: string | null = null
) {
  const admin = await createAdminClient();
  await admin.from('audit_logs').insert({
    admin_user_id: adminId,
    target_user_id: targetId,
    action_type: actionType,
    description,
    message_sent_to_user: messageToUser,
  });

  if (messageToUser) {
    // Send to inbox (notifications table assumed to exist based on previous interactions)
    await admin.from('notifications').insert({
      user_id: targetId,
      title: 'Aviso Administrativo',
      message: messageToUser,
      type: 'system',
      read: false,
    });
  }
}

export async function createMemberAccount(formData: FormData) {
  const currentUser = await getCurrentUser();
  if (!currentUser || (!currentUser.roles.includes('SYSADMIN') && !currentUser.roles.includes('CHURCH_ADMIN'))) {
    return { error: 'Não autorizado.' };
  }

  const fullName = (formData.get('fullName') as string)?.trim();
  const email = (formData.get('email') as string)?.trim();
  const phone = (formData.get('phone') as string)?.trim();
  const role = (formData.get('role') as string)?.trim() || 'MEMBER';

  if (!fullName || !email) {
    return { error: 'Nome e email são obrigatórios.' };
  }

  // Apenas SYSADMIN pode criar outro tipo que não seja MEMBER ou LEADER
  if (role !== 'MEMBER' && role !== 'LEADER' && !currentUser.roles.includes('SYSADMIN')) {
    return { error: 'Você não tem permissão para criar usuários com este cargo.' };
  }

  const admin = await createAdminClient();

  // Gerar senha temporária forte
  const tempPassword = crypto.randomBytes(8).toString('hex') + 'A1!';

  const { data: newUser, error: createError } = await admin.auth.admin.createUser({
    email,
    password: tempPassword,
    email_confirm: true,
    user_metadata: {
      full_name: fullName,
      phone,
    }
  });

  if (createError || !newUser.user) {
    return { error: 'Erro ao criar conta no Supabase: ' + createError?.message };
  }

  const userId = newUser.user.id;

  // Atualizar profile para forçar troca de senha (o trigger já deve ter criado o profile)
  await admin.from('profiles').update({
    force_password_change: true,
    full_name: fullName,
    phone: phone || null,
  }).eq('id', userId);

  // Atribuir cargo
  await admin.from('user_roles').insert({
    user_id: userId,
    role: role,
  });

  await logAudit(
    currentUser.id,
    userId,
    'CREATE_ACCOUNT',
    `Conta criada com cargo ${role}`,
    'Sua conta foi criada pelo administrador. Por favor, redefina sua senha no primeiro login.'
  );

  revalidatePath('/admin/membros');
  return { success: true, tempPassword };
}

export async function forceLogoutMember(userId: string) {
  const currentUser = await getCurrentUser();
  if (!currentUser || (!currentUser.roles.includes('SYSADMIN') && !currentUser.roles.includes('CHURCH_ADMIN'))) {
    return { error: 'Não autorizado.' };
  }

  // Validação hierárquica (simples)
  if (currentUser.roles.includes('CHURCH_ADMIN')) {
    const admin = await createAdminClient();
    const { data: targetRoles } = await admin.from('user_roles').select('role').eq('user_id', userId);
    const hasAdminRole = targetRoles?.some(r => r.role === 'SYSADMIN' || r.role === 'CHURCH_ADMIN');
    if (hasAdminRole) {
      return { error: 'ChurchAdmins não podem alterar outros administradores.' };
    }
  }

  const admin = await createAdminClient();
  const { error } = await admin.auth.admin.signOut(userId);

  if (error) {
    return { error: 'Erro ao deslogar usuário: ' + error.message };
  }

  await logAudit(
    currentUser.id,
    userId,
    'FORCE_LOGOUT',
    'Sessões encerradas forçadamente.',
    null // Sem notificação para não ser redundante
  );

  return { success: true };
}

export async function adminUpdatePassword(userId: string, newPassword?: string) {
  const currentUser = await getCurrentUser();
  // Apenas SYSADMIN pode mexer em senhas
  if (!currentUser || !currentUser.roles.includes('SYSADMIN')) {
    return { error: 'Não autorizado. Apenas SysAdmins podem alterar senhas.' };
  }

  const admin = await createAdminClient();
  const passwordToSet = newPassword || crypto.randomBytes(8).toString('hex') + 'A1!';

  const { error } = await admin.auth.admin.updateUserById(userId, {
    password: passwordToSet,
  });

  if (error) {
    return { error: 'Erro ao alterar senha: ' + error.message };
  }

  // Forçar troca de senha no próximo login
  await admin.from('profiles').update({ force_password_change: true }).eq('id', userId);
  
  // Deslogar de todas as sessões para obrigar login com nova senha
  await forceLogoutMember(userId);

  await logAudit(
    currentUser.id,
    userId,
    'PASSWORD_CHANGED',
    newPassword ? 'Senha definida manualmente pelo SysAdmin.' : 'Senha provisória gerada.',
    'Sua senha foi alterada por um administrador. No próximo login, você deverá escolher uma nova senha.'
  );

  return { success: true, tempPassword: passwordToSet };
}

export async function manageMemberBan(
  userId: string, 
  type: 'permanent' | 'temporary' | 'feature_specific',
  reason: string,
  expiresAt: string | null = null,
  featureName: string | null = null,
  banIps: boolean = false
) {
  const currentUser = await getCurrentUser();
  if (!currentUser || (!currentUser.roles.includes('SYSADMIN') && !currentUser.roles.includes('CHURCH_ADMIN'))) {
    return { error: 'Não autorizado.' };
  }

  // Validação hierárquica
  if (currentUser.roles.includes('CHURCH_ADMIN')) {
    const admin = await createAdminClient();
    const { data: targetRoles } = await admin.from('user_roles').select('role').eq('user_id', userId);
    if (targetRoles?.some(r => r.role === 'SYSADMIN' || r.role === 'CHURCH_ADMIN')) {
      return { error: 'ChurchAdmins não podem gerenciar punições de outros administradores.' };
    }
  }

  const admin = await createAdminClient();

  // Inserir ban
  const { error } = await admin.from('user_bans').insert({
    user_id: userId,
    type,
    reason,
    expires_at: expiresAt,
    feature_name: featureName,
    issued_by: currentUser.id,
  });

  if (error) return { error: 'Erro ao aplicar punição: ' + error.message };

  let description = `Punição aplicada: ${type === 'permanent' ? 'Banimento Permanente' : type === 'temporary' ? 'Suspensão Temporária' : `Restrição em ${featureName}`}. Motivo: ${reason}`;
  
  // Se for banir os IPs também
  if (banIps && type === 'permanent') {
    // Buscar todos os IPs conhecidos do usuário
    const { data: ips } = await admin.from('user_known_ips').select('ip_address').eq('user_id', userId);
    if (ips && ips.length > 0) {
      const ipInserts = ips.map(record => ({
        ip_address: record.ip_address,
        reason: `Associado ao usuário banido ${userId}`,
        issued_by: currentUser.id
      }));
      // Ignorar duplicatas se já existirem
      await admin.from('banned_ips').upsert(ipInserts, { onConflict: 'ip_address' });
      description += ' (IPs associados também foram banidos)';
    }
  }

  // Logout e bloquear acesso
  if (type === 'permanent' || type === 'temporary') {
    await admin.from('profiles').update({ is_suspended: true, suspended_until: expiresAt }).eq('id', userId);
    await forceLogoutMember(userId);
  }

  await logAudit(
    currentUser.id,
    userId,
    'USER_BANNED',
    description,
    `Foi aplicada uma sanção à sua conta. Motivo: ${reason}`
  );

  return { success: true };
}
export async function updateMemberAccount(userId: string, formData: FormData) {
  const currentUser = await getCurrentUser();
  if (!currentUser || (!currentUser.roles.includes('SYSADMIN') && !currentUser.roles.includes('CHURCH_ADMIN'))) {
    return { error: 'Não autorizado.' };
  }

  // Validação hierárquica
  if (currentUser.roles.includes('CHURCH_ADMIN')) {
    const admin = await createAdminClient();
    const { data: targetRoles } = await admin.from('user_roles').select('role').eq('user_id', userId);
    if (targetRoles?.some(r => r.role === 'SYSADMIN' || r.role === 'CHURCH_ADMIN')) {
      return { error: 'ChurchAdmins não podem alterar dados de outros administradores.' };
    }
  }

  const fullName = (formData.get('fullName') as string)?.trim();
  const email = (formData.get('email') as string)?.trim();
  const phone = (formData.get('phone') as string)?.trim();
  const reason = (formData.get('reason') as string)?.trim();
  const messageToUser = (formData.get('messageToUser') as string)?.trim();

  if (!reason || !messageToUser) {
    return { error: 'Para alterar dados de outra conta, você deve informar um motivo para auditoria e uma mensagem para o usuário.' };
  }

  const admin = await createAdminClient();

  // Se email mudou, usar updateUserById
  if (email) {
    const { error: authError } = await admin.auth.admin.updateUserById(userId, { email });
    if (authError) return { error: 'Erro ao atualizar email: ' + authError.message };
  }

  // Atualiza profiles
  const { error: profileError } = await admin.from('profiles').update({
    full_name: fullName || undefined,
    phone: phone || null,
  }).eq('id', userId);

  if (profileError) {
    return { error: 'Erro ao atualizar perfil: ' + profileError.message };
  }

  await logAudit(
    currentUser.id,
    userId,
    'PROFILE_UPDATED',
    `Perfil atualizado. Motivo: ${reason}`,
    messageToUser
  );

  return { success: true };
}

export async function adminSendResetLink(userId: string, email: string) {
  const currentUser = await getCurrentUser();
  if (!currentUser || !currentUser.roles.includes('SYSADMIN')) {
    return { error: 'Não autorizado. Apenas SysAdmins podem gerenciar senhas.' };
  }

  const admin = await createAdminClient();
  
  const { data, error } = await admin.auth.admin.generateLink({
    type: 'recovery',
    email,
  });

  if (error) {
    return { error: 'Erro ao gerar link de recuperação: ' + error.message };
  }

  await logAudit(
    currentUser.id,
    userId,
    'PASSWORD_RESET_LINK',
    'Link de redefinição de senha gerado.',
    'Um link para redefinir sua senha foi gerado e, em breve, você o receberá por e-mail.'
  );

  return { success: true, link: data.properties.action_link };
}
