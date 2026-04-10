'use server'

import { createAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';
import { getCurrentUser } from '@/features/core/api/get-current-user';
import { isValidUuid } from '@/lib/action-validators';

const MAX_LEADER_PHOTO = 4 * 1024 * 1024; // 4 MB
const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp']);

function canManage(roles: string[]): boolean {
  return roles.some(r => ['SYSADMIN', 'CHURCH_ADMIN'].includes(r));
}

async function uploadLeaderPhoto(
  leaderId: string,
  file: File,
): Promise<{ url: string } | { error: string }> {
  if (!ALLOWED_MIME.has(file.type))
    return { error: 'Formato inválido. Use JPG, PNG ou WebP.' };
  if (file.size > MAX_LEADER_PHOTO)
    return { error: 'Arquivo muito grande. Máximo 4 MB.' };

  const admin = await createAdminClient();
  const ext = file.name.split('.').pop() ?? 'jpg';
  const fullPath = `leaders/${leaderId}.${ext}`;

  const { error } = await admin.storage
    .from('site-images')
    .upload(fullPath, file, { upsert: true, contentType: file.type });

  if (error) {
    console.error('[leaders upload]', fullPath, error.message);
    return { error: `Falha no upload: ${error.message}` };
  }

  const { data } = admin.storage.from('site-images').getPublicUrl(fullPath);
  return { url: data.publicUrl };
}

/* ─── List ────────────────────────────────────────────────────── */

export async function getLeaders() {
  const admin = await createAdminClient();
  const { data, error } = await admin
    .from('leaders')
    .select('*')
    .order('sort_order', { ascending: true })
    .order('name', { ascending: true });

  if (error) {
    console.error('[leaders] list:', error.message);
    return { error: 'Falha ao carregar líderes.' };
  }
  return { leaders: data ?? [] };
}

/* ─── Create ──────────────────────────────────────────────────── */

export async function createLeader(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) return { error: 'Não autorizado.' };
  if (!canManage(user.roles)) return { error: 'Acesso negado.' };

  const name = (formData.get('name') as string)?.trim();
  if (!name || name.length < 2) return { error: 'Nome do líder é obrigatório.' };

  const phone = (formData.get('phone') as string)?.trim() || null;
  const bio   = (formData.get('bio')   as string)?.trim() || null;

  const admin = await createAdminClient();
  const { data, error } = await admin
    .from('leaders')
    .insert({ name, phone, bio, is_active: true })
    .select('id')
    .single();

  if (error || !data) {
    console.error('[leaders] create:', error?.message);
    return { error: `Falha ao criar líder: ${error?.message ?? 'erro desconhecido'}` };
  }

  const photoFile = formData.get('photo');
  if (photoFile instanceof File && photoFile.size > 0) {
    const upload = await uploadLeaderPhoto(data.id, photoFile);
    if ('url' in upload) {
      await admin.from('leaders').update({ photo_url: upload.url }).eq('id', data.id);
    }
  }

  revalidatePath('/lideres');
  revalidatePath('/celulas');
  revalidatePath('/');
  return { success: true, id: data.id };
}

/* ─── Update ──────────────────────────────────────────────────── */

export async function updateLeader(id: string, formData: FormData) {
  const user = await getCurrentUser();
  if (!user) return { error: 'Não autorizado.' };
  if (!canManage(user.roles)) return { error: 'Acesso negado.' };
  if (!isValidUuid(id)) return { error: 'ID inválido.' };

  const name = (formData.get('name') as string)?.trim();
  if (!name || name.length < 2) return { error: 'Nome do líder é obrigatório.' };

  const patch: Record<string, unknown> = {
    name,
    phone: (formData.get('phone') as string)?.trim() || null,
    bio:   (formData.get('bio')   as string)?.trim() || null,
  };

  const admin = await createAdminClient();

  const photoFile = formData.get('photo');
  if (photoFile instanceof File && photoFile.size > 0) {
    const upload = await uploadLeaderPhoto(id, photoFile);
    if ('url' in upload) patch.photo_url = upload.url;
    else return upload;
  }

  const { error } = await admin.from('leaders').update(patch).eq('id', id);
  if (error) {
    console.error('[leaders] update:', error.message);
    return { error: `Falha ao atualizar líder: ${error.message}` };
  }

  revalidatePath('/lideres');
  revalidatePath('/celulas');
  revalidatePath('/');
  return { success: true };
}

/* ─── Toggle active ───────────────────────────────────────────── */

export async function toggleLeaderActive(id: string, isActive: boolean) {
  const user = await getCurrentUser();
  if (!user) return { error: 'Não autorizado.' };
  if (!canManage(user.roles)) return { error: 'Acesso negado.' };
  if (!isValidUuid(id)) return { error: 'ID inválido.' };

  const admin = await createAdminClient();
  const { error } = await admin
    .from('leaders')
    .update({ is_active: isActive })
    .eq('id', id);

  if (error) return { error: 'Falha ao alterar status.' };

  revalidatePath('/lideres');
  revalidatePath('/celulas');
  revalidatePath('/');
  return { success: true };
}

/* ─── Delete (soft) ───────────────────────────────────────────── */

export async function deleteLeader(id: string) {
  const user = await getCurrentUser();
  if (!user) return { error: 'Não autorizado.' };
  if (!user.isSysAdmin) return { error: 'Apenas SYSADMIN pode excluir líderes.' };
  if (!isValidUuid(id)) return { error: 'ID inválido.' };

  // Desvincular células
  const admin = await createAdminClient();
  await admin.from('cells')
    .update({ leader1_id: null })
    .eq('leader1_id', id);
  await admin.from('cells')
    .update({ leader2_id: null })
    .eq('leader2_id', id);

  const { error } = await admin
    .from('leaders')
    .update({ is_active: false })
    .eq('id', id);

  if (error) return { error: 'Falha ao remover líder.' };

  revalidatePath('/lideres');
  revalidatePath('/celulas');
  revalidatePath('/');
  return { success: true };
}
