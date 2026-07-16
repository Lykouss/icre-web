'use server'

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';
import { getCurrentUser } from '@/features/core/api/get-current-user';
import type { SiteBlockType } from '@/features/portal/types';
import { checkUploadPermission, registerMediaAsset } from '@/features/media/actions/media-actions';

const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

const AVATAR_MAX_PER_DAY = 3;

function isAdmin(user: Awaited<ReturnType<typeof getCurrentUser>>): user is NonNullable<Awaited<ReturnType<typeof getCurrentUser>>> {
  if (!user) return false;
  return user.isSysAdmin || user.roles.some(r => ['CHURCH_ADMIN'].includes(r));
}

// ── Rate limit de avatar ──────────────────────────────────────

async function checkAvatarRateLimit(userId: string): Promise<{ allowed: boolean; remaining: number }> {
  const admin = await createAdminClient();
  const windowStart = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { count } = await admin
    .from('auth_rate_limits')
    .select('id', { count: 'exact', head: true })
    .eq('identifier', userId)
    .eq('action', 'avatar_upload')
    .gte('attempted_at', windowStart);
  const used = count ?? 0;
  return { allowed: used < AVATAR_MAX_PER_DAY, remaining: Math.max(0, AVATAR_MAX_PER_DAY - used) };
}

async function recordAvatarUpload(userId: string): Promise<void> {
  const admin = await createAdminClient();
  await admin.from('auth_rate_limits').insert({ identifier: userId, action: 'avatar_upload' });
}

// ── Upload genérico ───────────────────────────────────────────

async function uploadFile(
  bucket: string,
  path: string,
  file: File
): Promise<{ url: string } | { error: string }> {
  if (!ALLOWED_MIME.has(file.type)) return { error: 'Formato inválido. Use JPG, PNG, WebP ou GIF.' };

  const admin = await createAdminClient();
  const ext = file.name.split('.').pop() ?? 'jpg';
  const fullPath = `${path}.${ext}`;

  const { error } = await admin.storage
    .from(bucket)
    .upload(fullPath, file, { upsert: true, contentType: file.type, cacheControl: '31536000' });

  if (error) {
    console.error(`[upload] ${bucket}/${fullPath}:`, error.message);
    return { error: `Falha no upload: ${error.message}` };
  }

  const { data } = admin.storage.from(bucket).getPublicUrl(fullPath);
  return { url: data.publicUrl };
}

// ── Avatar de perfil ─────────────────────────────────────────

export async function uploadAvatar(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) return { error: 'Não autenticado.' };

  const file = formData.get('file');
  if (!(file instanceof File) || file.size === 0) return { error: 'Arquivo inválido.' };

  const rateLimit = await checkAvatarRateLimit(user.id);
  if (!rateLimit.allowed) {
    return { error: 'Limite de 3 trocas de foto por dia atingido. Tente novamente amanhã.' };
  }

  const perm = await checkUploadPermission('avatar', file.size);
  if (!perm.allowed) return { error: perm.error || 'Upload negado.' };

  const result = await uploadFile('avatars', `${user.id}/avatar`, file);
  if ('error' in result) return result;

  await registerMediaAsset({
    file_name: file.name,
    category: 'avatar',
    url: result.url,
    storage_path: `${user.id}/avatar.${file.name.split('.').pop() ?? 'jpg'}`,
    size_bytes: file.size,
    mime_type: file.type,
    uploaded_by: user.id
  });

  await recordAvatarUpload(user.id);

  const supabase = await createClient();
  const { error } = await supabase
    .from('profiles')
    .update({ photo_url: result.url })
    .eq('id', user.id);

  if (error) {
    console.error('[avatar] Erro ao salvar photo_url:', error.message);
    return { error: 'Falha ao salvar a foto. Tente novamente.' };
  }

  revalidatePath('/minha-conta');
  revalidatePath('/dashboard');
  return { success: true, url: result.url, remaining: rateLimit.remaining - 1 };
}

export async function removeAvatar() {
  const user = await getCurrentUser();
  if (!user) return { error: 'Não autenticado.' };

  const supabase = await createClient();
  const { error } = await supabase
    .from('profiles')
    .update({ photo_url: null })
    .eq('id', user.id);

  if (error) {
    console.error('[avatar] Erro ao remover photo_url:', error.message);
    return { error: 'Falha ao remover a foto. Tente novamente.' };
  }

  revalidatePath('/minha-conta');
  revalidatePath('/dashboard');
  return { success: true };
}

// ── Galeria de mídia do site ──────────────────────────────────

export interface SiteMediaItem {
  id:         string;
  name:       string;
  url:        string;
  size_bytes: number;
  mime_type:  string;
  created_at: string;
}

export async function listSiteMedia(): Promise<{ items: SiteMediaItem[]; usedBytes: number } | { error: string }> {
  const user = await getCurrentUser();
  if (!isAdmin(user)) return { error: 'Acesso negado.' };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('site_media')
    .select('id, name, url, size_bytes, mime_type, created_at')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[site_media] Erro ao listar:', error.message);
    return { error: 'Falha ao carregar galeria.' };
  }

  const items = (data ?? []) as SiteMediaItem[];
  const usedBytes = items.reduce((sum, i) => sum + i.size_bytes, 0);
  return { items, usedBytes };
}

export async function uploadSiteMedia(formData: FormData): Promise<{ success: true; url: string; item: SiteMediaItem } | { error: string }> {
  const user = await getCurrentUser();
  if (!isAdmin(user)) return { error: 'Acesso negado.' };

  const file = formData.get('file');
  if (!(file instanceof File) || file.size === 0) return { error: 'Arquivo inválido.' };

  const perm = await checkUploadPermission('banner', file.size);
  if (!perm.allowed) return { error: perm.error || 'Upload negado.' };

  const supabase = await createClient();

  // Verifica quota total (ex: 200MB hard limit global, ou podemos ler de config depois)
  const SITE_MEDIA_QUOTA = 200 * 1024 * 1024;
  const { data: usageData } = await supabase
    .from('site_media')
    .select('size_bytes');

  const usedBytes = (usageData ?? []).reduce((sum: number, row: { size_bytes: number }) => sum + row.size_bytes, 0);

  if (usedBytes + file.size > SITE_MEDIA_QUOTA) {
    const usedMB = (usedBytes / 1024 / 1024).toFixed(1);
    const quotaMB = (SITE_MEDIA_QUOTA / 1024 / 1024).toFixed(0);
    return {
      error: `Quota de armazenamento atingida (${usedMB} MB de ${quotaMB} MB usados). Exclua imagens para liberar espaço.`,
    };
  }

  const slug = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
  const storagePath = `gallery/${slug}`;
  const result = await uploadFile('site-images', storagePath, file);
  if ('error' in result) return result;

  await registerMediaAsset({
    file_name: file.name,
    category: 'banner',
    url: result.url,
    storage_path: `${storagePath}.${file.name.split('.').pop() ?? 'jpg'}`,
    size_bytes: file.size,
    mime_type: file.type,
    uploaded_by: user.id
  });

  const { data: inserted, error: dbError } = await supabase
    .from('site_media')
    .insert({
      name:        file.name,
      url:         result.url,
      size_bytes:  file.size,
      mime_type:   file.type,
      uploaded_by: user.id,
    })
    .select()
    .single();

  if (dbError || !inserted) {
    console.error('[site_media] Erro ao registrar:', dbError?.message);
    return { error: 'Upload realizado mas falhou ao registrar. Contate o administrador.' };
  }

  revalidatePath('/portal');
  return { success: true, url: result.url, item: inserted as SiteMediaItem };
}

export async function deleteSiteMedia(id: string): Promise<{ success: true } | { error: string }> {
  const user = await getCurrentUser();
  if (!isAdmin(user)) return { error: 'Acesso negado.' };

  const supabase = await createClient();

  const { data: media } = await supabase
    .from('site_media')
    .select('url')
    .eq('id', id)
    .single();

  if (!media) return { error: 'Arquivo não encontrado.' };

  const admin = await createAdminClient();
  const urlPath = new URL(media.url).pathname;
  const storagePath = urlPath.split('/object/public/site-images/')[1];
  if (storagePath) {
    await admin.storage.from('site-images').remove([storagePath]);
  }

  const { error } = await supabase.from('site_media').delete().eq('id', id);
  if (error) {
    console.error('[site_media] Erro ao deletar:', error.message);
    return { error: 'Falha ao excluir o arquivo.' };
  }

  revalidatePath('/portal');
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
      { type: blockType, content, updated_at: new Date().toISOString(), updated_by: user.id },
      { onConflict: 'type' }
    );

  if (error) return { error: 'Falha ao salvar bloco.' };

  revalidatePath('/');
  return { success: true };
}

// ── Pastores ─────────────────────────────────────────────────

export async function createPastor(formData: FormData) {
  const user = await getCurrentUser();
  if (!isAdmin(user)) return { error: 'Acesso negado.' };

  const name = (formData.get('name') as string)?.trim();
  const role = (formData.get('role') as string)?.trim();
  const bio  = (formData.get('bio')  as string)?.trim() || null;
  const instagram_url = (formData.get('instagram_url') as string)?.trim() || null;
  const is_president = formData.get('is_president') === 'on';
  const spouse_id_raw = formData.get('spouse_id') as string;
  const spouse_id = spouse_id_raw && spouse_id_raw !== 'null' ? spouse_id_raw : null;
  const sort_order = parseInt(formData.get('sort_order') as string || '0', 10);

  if (!name || !role) return { error: 'Nome e cargo são obrigatórios.' };
  if (name.length < 2 || name.length > 120) return { error: 'Nome inválido.' };
  if (role.length > 80) return { error: 'Cargo muito longo.' };
  if (bio && bio.length > 600) return { error: 'Bio muito longa (máx. 600 caracteres).' };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('pastors')
    .insert({ name, role, bio, instagram_url, is_president, spouse_id, sort_order })
    .select('id')
    .single();

  if (error) return { error: 'Falha ao criar pastor.' };

  // Sync spouse relation
  if (spouse_id && data) {
    await supabase.from('pastors').update({ spouse_id: data.id }).eq('id', spouse_id);
  }

  const photoFile = formData.get('photo');
  if (photoFile instanceof File && photoFile.size > 0) {
    const perm = await checkUploadPermission('pastor', photoFile.size);
    if (!perm.allowed) return { error: perm.error || 'Upload negado.' };

    const result = await uploadFile('site-images', `pastors/${data.id}`, photoFile);
    if ('url' in result) {
      await supabase.from('pastors').update({ photo_url: result.url }).eq('id', data.id);
      await registerMediaAsset({
        file_name: photoFile.name,
        category: 'pastor',
        url: result.url,
        storage_path: `pastors/${data.id}.${photoFile.name.split('.').pop() ?? 'jpg'}`,
        size_bytes: photoFile.size,
        mime_type: photoFile.type,
        uploaded_by: user.id
      });
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

  const name = (formData.get('name') as string)?.trim();
  const role = (formData.get('role') as string)?.trim();
  const bio  = (formData.get('bio')  as string)?.trim() || null;
  const instagram_url = (formData.get('instagram_url') as string)?.trim() || null;
  const is_president = formData.get('is_president') === 'on';
  const spouse_id_raw = formData.get('spouse_id') as string;
  const spouse_id = spouse_id_raw && spouse_id_raw !== 'null' ? spouse_id_raw : null;
  const sort_order = parseInt(formData.get('sort_order') as string || '0', 10);

  if (!name || !role) return { error: 'Nome e cargo são obrigatórios.' };
  if (bio && bio.length > 600) return { error: 'Bio muito longa.' };

  const supabase = await createClient();

  const photoFile = formData.get('photo');
  let photo_url: string | undefined;
  if (photoFile instanceof File && photoFile.size > 0) {
    const perm = await checkUploadPermission('pastor', photoFile.size);
    if (!perm.allowed) return { error: perm.error || 'Upload negado.' };

    const upload = await uploadFile('site-images', `pastors/${id}`, photoFile);
    if ('url' in upload) {
      photo_url = upload.url;
      await registerMediaAsset({
        file_name: photoFile.name,
        category: 'pastor',
        url: upload.url,
        storage_path: `pastors/${id}.${photoFile.name.split('.').pop() ?? 'jpg'}`,
        size_bytes: photoFile.size,
        mime_type: photoFile.type,
        uploaded_by: user.id
      });
    } else return upload;
  }

  const { data: oldData } = await supabase.from('pastors').select('spouse_id').eq('id', id).single();
  const old_spouse_id = oldData?.spouse_id;

  const patch: Record<string, unknown> = { name, role, bio, instagram_url, is_president, spouse_id, sort_order, updated_at: new Date().toISOString() };
  if (photo_url !== undefined) patch.photo_url = photo_url;

  const { error } = await supabase.from('pastors').update(patch).eq('id', id);
  if (error) return { error: 'Falha ao atualizar.' };

  if (old_spouse_id !== spouse_id) {
    if (old_spouse_id) {
      await supabase.from('pastors').update({ spouse_id: null }).eq('id', old_spouse_id);
    }
    if (spouse_id) {
      await supabase.from('pastors').update({ spouse_id: id }).eq('id', spouse_id);
    }
  }

  revalidatePath('/');
  revalidatePath('/dashboard/pastores');
  return { success: true };
}

export async function deletePastor(id: string) {
  const user = await getCurrentUser();
  if (!user?.isSysAdmin) return { error: 'Acesso negado.' };
  if (!id.match(/^[0-9a-f-]{36}$/i)) return { error: 'ID inválido.' };

  const supabase = await createClient();
  const { error } = await supabase.from('pastors').delete().eq('id', id);
  if (error) return { error: 'Falha ao remover do banco de dados.' };

  revalidatePath('/');
  return { success: true };
}

export async function togglePastorActive(id: string, isActive: boolean) {
  const user = await getCurrentUser();
  if (!isAdmin(user)) return { error: 'Acesso negado.' };
  if (!id.match(/^[0-9a-f-]{36}$/i)) return { error: 'ID inválido.' };

  const supabase = await createClient();
  const { error } = await supabase.from('pastors')
    .update({ is_active: isActive, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) return { error: 'Falha ao alterar status.' };

  revalidatePath('/');
  revalidatePath('/pastores');
  return { success: true };
}