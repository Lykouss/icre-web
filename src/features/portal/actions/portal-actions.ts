'use server'

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { getCurrentUser } from '@/features/core/api/get-current-user';
import type { SiteBlockType } from '@/features/portal/types';

const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp']);
const MAX_SITE_IMAGE = 5 * 1024 * 1024;  // 5 MB
const MAX_AVATAR     = 2 * 1024 * 1024;  // 2 MB
const MAX_PASTOR     = 3 * 1024 * 1024;  // 3 MB

function isAdmin(user: Awaited<ReturnType<typeof getCurrentUser>>) {
  if (!user) return false;
  return user.isSysAdmin || user.roles.some(r => ['CHURCH_ADMIN'].includes(r));
}

// ── Upload helpers ───────────────────────────────────────────

async function uploadFile(
  bucket: string,
  path: string,
  file: File,
  maxSize: number
): Promise<{ url: string } | { error: string }> {
  if (!ALLOWED_MIME.has(file.type)) return { error: 'Formato inválido. Use JPG, PNG ou WebP.' };
  if (file.size > maxSize) return { error: `Arquivo muito grande. Máximo ${maxSize / 1024 / 1024} MB.` };

  const supabase = await createClient();
  const ext = file.name.split('.').pop() ?? 'jpg';
  const fullPath = `${path}.${ext}`;

  const { error } = await supabase.storage
    .from(bucket)
    .upload(fullPath, file, { upsert: true, contentType: file.type });

  if (error) return { error: 'Falha no upload.' };

  const { data } = supabase.storage.from(bucket).getPublicUrl(fullPath);
  return { url: data.publicUrl };
}

// ── Avatar de perfil ─────────────────────────────────────────

export async function uploadAvatar(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) return { error: 'Não autenticado.' };

  const file = formData.get('file');
  if (!(file instanceof File)) return { error: 'Arquivo inválido.' };

  const result = await uploadFile('avatars', `${user.id}/avatar`, file, MAX_AVATAR);
  if ('error' in result) return result;

  const supabase = await createClient();
  const { error } = await supabase
    .from('profiles')
    .update({ photo_url: result.url })
    .eq('id', user.id);

  if (error) return { error: 'Falha ao salvar URL do avatar.' };

  revalidatePath('/minha-conta');
  return { success: true, url: result.url };
}

export async function removeAvatar() {
  const user = await getCurrentUser();
  if (!user) return { error: 'Não autenticado.' };

  const supabase = await createClient();
  await supabase.from('profiles').update({ photo_url: null }).eq('id', user.id);

  revalidatePath('/minha-conta');
  return { success: true };
}

// ── Blocos CMS ───────────────────────────────────────────────

export async function upsertSiteBlock(
  blockType: SiteBlockType,
  content: Record<string, unknown>
) {
  const user = await getCurrentUser();
  if (!isAdmin(user)) return { error: 'Acesso negado.' };

  const supabase = await createClient();
  const { error } = await supabase
    .from('site_blocks')
    .upsert(
      { type: blockType, content, updated_at: new Date().toISOString(), updated_by: user!.id },
      { onConflict: 'type' }
    );

  if (error) return { error: 'Falha ao salvar bloco.' };

  revalidatePath('/');
  return { success: true };
}

export async function uploadSiteBlockImage(blockType: SiteBlockType, formData: FormData) {
  const user = await getCurrentUser();
  if (!isAdmin(user)) return { error: 'Acesso negado.' };

  const file = formData.get('file');
  if (!(file instanceof File)) return { error: 'Arquivo inválido.' };

  const result = await uploadFile('site-images', `${blockType}/banner`, file, MAX_SITE_IMAGE);
  return result;
}

// ── Pastores ─────────────────────────────────────────────────

export async function createPastor(formData: FormData) {
  const user = await getCurrentUser();
  if (!isAdmin(user)) return { error: 'Acesso negado.' };

  const name  = (formData.get('name') as string)?.trim();
  const role  = (formData.get('role') as string)?.trim();
  const bio   = (formData.get('bio')  as string)?.trim() || null;

  if (!name || !role) return { error: 'Nome e cargo são obrigatórios.' };
  if (name.length < 2 || name.length > 120) return { error: 'Nome inválido.' };
  if (role.length > 80) return { error: 'Cargo muito longo.' };
  if (bio && bio.length > 600) return { error: 'Bio muito longa (máx. 600 caracteres).' };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('pastors')
    .insert({ name, role, bio })
    .select('id')
    .single();

  if (error) return { error: 'Falha ao criar pastor.' };

  const photoFile = formData.get('photo');
  if (photoFile instanceof File && photoFile.size > 0) {
    const upload = await uploadFile('pastor-photos', data.id, photoFile, MAX_PASTOR);
    if ('url' in upload) {
      await supabase.from('pastors').update({ photo_url: upload.url }).eq('id', data.id);
    }
  }

  revalidatePath('/');
  revalidatePath('/dashboard/pastores');
  return { success: true };
}

export async function updatePastor(id: string, formData: FormData) {
  const user = await getCurrentUser();
  if (!isAdmin(user)) return { error: 'Acesso negado.' };

  if (!id.match(/^[0-9a-f-]{36}$/i)) return { error: 'ID inválido.' };

  const name  = (formData.get('name') as string)?.trim();
  const role  = (formData.get('role') as string)?.trim();
  const bio   = (formData.get('bio')  as string)?.trim() || null;

  if (!name || !role) return { error: 'Nome e cargo são obrigatórios.' };
  if (bio && bio.length > 600) return { error: 'Bio muito longa.' };

  const supabase = await createClient();

  const photoFile = formData.get('photo');
  let photo_url: string | undefined = undefined;
  if (photoFile instanceof File && photoFile.size > 0) {
    const upload = await uploadFile('pastor-photos', id, photoFile, MAX_PASTOR);
    if ('url' in upload) photo_url = upload.url;
    else return upload;
  }

  const patch: Record<string, unknown> = { name, role, bio, updated_at: new Date().toISOString() };
  if (photo_url !== undefined) patch.photo_url = photo_url;

  const { error } = await supabase.from('pastors').update(patch).eq('id', id);
  if (error) return { error: 'Falha ao atualizar.' };

  revalidatePath('/');
  revalidatePath('/dashboard/pastores');
  return { success: true };
}

export async function deletePastor(id: string) {
  const user = await getCurrentUser();
  if (!user?.isSysAdmin) return { error: 'Acesso negado.' };
  if (!id.match(/^[0-9a-f-]{36}$/i)) return { error: 'ID inválido.' };

  const supabase = await createClient();
  const { error } = await supabase.from('pastors').update({ is_active: false }).eq('id', id);
  if (error) return { error: 'Falha ao remover.' };

  revalidatePath('/');
  return { success: true };
}