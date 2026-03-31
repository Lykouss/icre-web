'use server'

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';
import { getCurrentUser } from '@/features/core/api/get-current-user';
import { isValidUuid } from '@/lib/action-validators';

const MAX_CELL_IMAGE = 5 * 1024 * 1024; // 5 MB
const ALLOWED_MIME   = new Set(['image/jpeg', 'image/png', 'image/webp']);

function canManage(roles: string[]): boolean {
  return roles.some(r => ['SYSADMIN', 'CHURCH_ADMIN'].includes(r));
}

async function uploadCellFile(
  path: string,
  file: File,
): Promise<{ url: string } | { error: string }> {
  if (!ALLOWED_MIME.has(file.type))
    return { error: 'Formato inválido. Use JPG, PNG ou WebP.' };
  if (file.size > MAX_CELL_IMAGE)
    return { error: 'Arquivo muito grande. Máximo 5 MB.' };

  const admin   = await createAdminClient();
  const ext      = file.name.split('.').pop() ?? 'jpg';
  const fullPath = `${path}.${ext}`;

  const { error } = await admin.storage
    .from('site-images')
    .upload(fullPath, file, { upsert: true, contentType: file.type });

  if (error) {
    console.error('[cells upload]', fullPath, error.message);
    return { error: `Falha no upload: ${error.message}` };
  }

  const { data } = admin.storage.from('site-images').getPublicUrl(fullPath);
  return { url: data.publicUrl };
}

/* ─── Create ──────────────────────────────────────────────────── */

export async function createCell(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) return { error: 'Não autorizado.' };
  if (!canManage(user.roles)) return { error: 'Acesso negado.' };

  const name = (formData.get('name') as string)?.trim();
  if (!name || name.length < 2) return { error: 'Nome da célula é obrigatório.' };

  const leader_name      = (formData.get('leader_name')      as string)?.trim() || null;
  const description      = (formData.get('description')      as string)?.trim() || null;
  const neighborhood     = (formData.get('neighborhood')     as string)?.trim() || null;
  const address          = (formData.get('address')          as string)?.trim() || null;
  const meeting_days     = (formData.get('meeting_days')     as string)?.trim() || null;
  const meeting_time     = (formData.get('meeting_time')     as string)?.trim() || null;
  const meeting_type     = (formData.get('meeting_type')     as string)?.trim() || 'presencial';
  const contact_phone    = (formData.get('contact_phone')    as string)?.trim() || null;
  const contact_whatsapp = (formData.get('contact_whatsapp') as string)?.trim() || null;
  const contact_email    = (formData.get('contact_email')    as string)?.trim() || null;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('cells')
    .insert({ name, leader_name, description, neighborhood, address,
              meeting_days, meeting_time, meeting_type,
              contact_phone, contact_whatsapp, contact_email })
    .select('id')
    .single();

  if (error || !data) {
    console.error('[cells] create:', error?.message);
    return { error: 'Falha ao criar célula.' };
  }

  const id = data.id as string;

  const bannerFile = formData.get('image');
  if (bannerFile instanceof File && bannerFile.size > 0) {
    const upload = await uploadCellFile(`cells/${id}/banner`, bannerFile);
    if ('url' in upload)
      await supabase.from('cells').update({ image_url: upload.url }).eq('id', id);
  }

  const leaderPhotoFile = formData.get('leader_photo');
  if (leaderPhotoFile instanceof File && leaderPhotoFile.size > 0) {
    const upload = await uploadCellFile(`cells/${id}/leader`, leaderPhotoFile);
    if ('url' in upload)
      await supabase.from('cells').update({ leader_photo_url: upload.url }).eq('id', id);
  }

  revalidatePath('/celulas');
  revalidatePath('/');
  return { success: true, id };
}

/* ─── Update ──────────────────────────────────────────────────── */

export async function updateCell(id: string, formData: FormData) {
  const user = await getCurrentUser();
  if (!user) return { error: 'Não autorizado.' };
  if (!canManage(user.roles)) return { error: 'Acesso negado.' };
  if (!isValidUuid(id)) return { error: 'ID inválido.' };

  const name = (formData.get('name') as string)?.trim();
  if (!name || name.length < 2) return { error: 'Nome da célula é obrigatório.' };

  const patch: Record<string, unknown> = {
    name,
    leader_name:      (formData.get('leader_name')      as string)?.trim() || null,
    description:      (formData.get('description')      as string)?.trim() || null,
    neighborhood:     (formData.get('neighborhood')     as string)?.trim() || null,
    address:          (formData.get('address')          as string)?.trim() || null,
    meeting_days:     (formData.get('meeting_days')     as string)?.trim() || null,
    meeting_time:     (formData.get('meeting_time')     as string)?.trim() || null,
    meeting_type:     (formData.get('meeting_type')     as string)?.trim() || 'presencial',
    contact_phone:    (formData.get('contact_phone')    as string)?.trim() || null,
    contact_whatsapp: (formData.get('contact_whatsapp') as string)?.trim() || null,
    contact_email:    (formData.get('contact_email')    as string)?.trim() || null,
    updated_at:       new Date().toISOString(),
  };

  const supabase = await createClient();

  const bannerFile = formData.get('image');
  if (bannerFile instanceof File && bannerFile.size > 0) {
    const upload = await uploadCellFile(`cells/${id}/banner`, bannerFile);
    if ('url' in upload) patch.image_url = upload.url;
    else return upload;
  }

  const leaderPhotoFile = formData.get('leader_photo');
  if (leaderPhotoFile instanceof File && leaderPhotoFile.size > 0) {
    const upload = await uploadCellFile(`cells/${id}/leader`, leaderPhotoFile);
    if ('url' in upload) patch.leader_photo_url = upload.url;
    else return upload;
  }

  const { error } = await supabase.from('cells').update(patch).eq('id', id);
  if (error) return { error: 'Falha ao atualizar célula.' };

  revalidatePath('/celulas');
  revalidatePath('/');
  return { success: true };
}

/* ─── Toggle active ───────────────────────────────────────────── */

export async function toggleCellActive(id: string, isActive: boolean) {
  const user = await getCurrentUser();
  if (!user) return { error: 'Não autorizado.' };
  if (!canManage(user.roles)) return { error: 'Acesso negado.' };
  if (!isValidUuid(id)) return { error: 'ID inválido.' };

  const supabase = await createClient();
  const { error } = await supabase
    .from('cells')
    .update({ is_active: isActive, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) return { error: 'Falha ao alterar status.' };

  revalidatePath('/celulas');
  revalidatePath('/');
  return { success: true };
}

/* ─── Delete (soft) ───────────────────────────────────────────── */

export async function deleteCell(id: string) {
  const user = await getCurrentUser();
  if (!user) return { error: 'Não autorizado.' };
  if (!user.isSysAdmin) return { error: 'Apenas SYSADMIN pode excluir células.' };
  if (!isValidUuid(id)) return { error: 'ID inválido.' };

  const supabase = await createClient();
  const { error } = await supabase
    .from('cells')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) return { error: 'Falha ao remover célula.' };

  revalidatePath('/celulas');
  revalidatePath('/');
  return { success: true };
}
