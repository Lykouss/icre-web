'use server'

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { isValidEmail, isValidPhone, isValidDate } from '@/lib/action-validators';

function sanitize(value: string): string {
  return value.trim().replace(/[<>]/g, '');
}

interface ProfileResult {
  error?: string;
  success?: boolean;
}

export async function updatePublicProfile(formData: FormData): Promise<ProfileResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Não autorizado.' };

  const fullName  = sanitize((formData.get('fullName')  as string) ?? '');
  const phone     = sanitize((formData.get('phone')     as string) ?? '');
  const address   = sanitize((formData.get('address')   as string) ?? '');
  const birthDate = sanitize((formData.get('birthDate') as string) ?? '');

  if (!fullName || fullName.length < 3 || fullName.length > 100) {
    return { error: 'Nome deve ter entre 3 e 100 caracteres.' };
  }
  if (!/^[a-zA-ZÀ-ÿ\s'-]+$/.test(fullName)) {
    return { error: 'Nome contém caracteres inválidos.' };
  }
  if (phone && !isValidPhone(phone)) {
    return { error: 'Telefone inválido.' };
  }
  if (birthDate && !isValidDate(birthDate)) {
    return { error: 'Data de nascimento inválida.' };
  }
  if (address && address.length > 300) {
    return { error: 'Endereço muito longo.' };
  }

  const { error } = await supabase
    .from('profiles')
    .update({
      full_name:  fullName,
      phone:      phone     || null,
      address:    address   || null,
      birth_date: birthDate || null,
    })
    .eq('id', user.id);

  if (error) {
    console.error('Erro ao atualizar perfil:', error.message);
    return { error: 'Falha ao salvar. Tente novamente.' };
  }

  revalidatePath('/minha-conta');
  return { success: true };
}

export async function changePublicPassword(formData: FormData): Promise<ProfileResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Não autorizado.' };

  const currentPassword = (formData.get('currentPassword') as string) ?? '';
  const newPassword     = (formData.get('newPassword')     as string) ?? '';
  const confirmPass     = (formData.get('confirmPassword') as string) ?? '';

  if (!currentPassword) return { error: 'Informe a senha atual.' };

  // Verifica senha atual
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: user.email!,
    password: currentPassword,
  });
  if (signInError) return { error: 'Senha atual incorreta.' };

  if (newPassword.length < 8 || newPassword.length > 72)
    return { error: 'A senha deve ter entre 8 e 72 caracteres.' };
  if (!/[A-Z]/.test(newPassword))
    return { error: 'Inclua pelo menos uma letra maiúscula.' };
  if (!/[0-9]/.test(newPassword))
    return { error: 'Inclua pelo menos um número.' };
  if (newPassword !== confirmPass)
    return { error: 'As senhas não coincidem.' };
  if (newPassword === currentPassword)
    return { error: 'A nova senha deve ser diferente da atual.' };

  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) return { error: 'Falha ao alterar a senha. Tente novamente.' };

  return { success: true };
}

export async function deletePublicAccount(password: string): Promise<ProfileResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Não autorizado.' };

  if (!password) return { error: 'Informe sua senha para confirmar.' };

  // Verifica que não é admin
  const { data: roleData } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .in('role', ['CHURCH_ADMIN', 'SYSADMIN', 'FINANCE_ADMIN', 'LEADER'])
    .limit(1)
    .single();

  if (roleData) return { error: 'Administradores não podem excluir a própria conta por aqui. Entre em contato com a liderança.' };

  // Verifica senha
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: user.email!,
    password,
  });
  if (signInError) return { error: 'Senha incorreta.' };

  // Remove avatar do storage
  const { data: profile } = await supabase
    .from('profiles')
    .select('photo_url')
    .eq('id', user.id)
    .single();

  if (profile?.photo_url) {
    const admin = await createAdminClient();
    const urlPath = new URL(profile.photo_url).pathname;
    const storagePath = urlPath.split('/object/public/avatars/')[1];
    if (storagePath) {
      await admin.storage.from('avatars').remove([storagePath]);
    }
  }

  const adminSupabase = await createAdminClient();
  const { error } = await adminSupabase.auth.admin.deleteUser(user.id);
  if (error) return { error: 'Falha ao excluir a conta. Tente novamente.' };

  await supabase.auth.signOut();
  redirect('/');
}