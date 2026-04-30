'use server'

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';
import { getCurrentUser } from '@/features/core/api/get-current-user';

export type MediaCategory = 'avatar' | 'pastor' | 'cell' | 'banner' | 'event' | 'other';

export interface UploadSettings {
  id: string;
  global_enabled: boolean;
  avatars_enabled: boolean;
  avatars_max_size_kb: number;
  pastors_enabled: boolean;
  pastors_max_size_kb: number;
  cells_enabled: boolean;
  cells_max_size_kb: number;
  banners_enabled: boolean;
  banners_max_size_kb: number;
}

export interface MediaAsset {
  id: string;
  file_name: string;
  category: MediaCategory;
  url: string;
  storage_path: string;
  size_bytes: number;
  mime_type: string;
  uploaded_by: string;
  created_at: string;
  uploader?: { full_name: string }; // joined from profiles
}

// ── Settings ──────────────────────────────────────────────────

export async function getUploadSettings(): Promise<UploadSettings | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('upload_settings')
    .select('*')
    .eq('id', 'singleton')
    .single();
  
  return data as UploadSettings | null;
}

export async function updateUploadSettings(settings: Partial<UploadSettings>) {
  const user = await getCurrentUser();
  if (!user?.isSysAdmin) return { error: 'Acesso negado. Apenas SysAdmins.' };

  const supabase = await createClient();
  const { error } = await supabase
    .from('upload_settings')
    .update({ ...settings, updated_at: new Date().toISOString() })
    .eq('id', 'singleton');

  if (error) {
    console.error('[media] Erro ao atualizar settings:', error.message);
    return { error: 'Falha ao salvar configurações.' };
  }

  revalidatePath('/midias');
  return { success: true };
}

export async function checkUploadPermission(category: MediaCategory, sizeBytes: number): Promise<{ allowed: boolean; error?: string }> {
  const settings = await getUploadSettings();
  if (!settings) return { allowed: true }; // Fallback se não existir (teoricamente existe via SQL)

  if (!settings.global_enabled) {
    return { allowed: false, error: 'Uploads bloqueados globalmente no sistema.' };
  }

  let isEnabled = true;
  let maxSizeKb = 10240; // 10MB default

  switch (category) {
    case 'avatar':
      isEnabled = settings.avatars_enabled;
      maxSizeKb = settings.avatars_max_size_kb;
      break;
    case 'pastor':
      isEnabled = settings.pastors_enabled;
      maxSizeKb = settings.pastors_max_size_kb;
      break;
    case 'cell':
      isEnabled = settings.cells_enabled;
      maxSizeKb = settings.cells_max_size_kb;
      break;
    case 'banner':
      isEnabled = settings.banners_enabled;
      maxSizeKb = settings.banners_max_size_kb;
      break;
    default:
      break;
  }

  if (!isEnabled) {
    return { allowed: false, error: `Upload de ${category} está desativado no momento.` };
  }

  if (sizeBytes > maxSizeKb * 1024) {
    return { allowed: false, error: `Arquivo excedeu limite permitido (${Math.round(sizeBytes/1024)}KB > ${maxSizeKb}KB).` };
  }

  return { allowed: true };
}

// ── Registry ──────────────────────────────────────────────────

export async function registerMediaAsset(data: {
  file_name: string;
  category: MediaCategory;
  url: string;
  storage_path: string;
  size_bytes: number;
  mime_type: string;
  uploaded_by: string;
}) {
  const supabase = await createClient();
  const { error } = await supabase.from('media_assets').insert(data);
  if (error) {
    console.error('[media] Falha ao registrar asset:', error.message);
  }
}

export async function listMediaAssets(category?: MediaCategory): Promise<{ items: MediaAsset[], error?: string }> {
  const user = await getCurrentUser();
  if (!user || (!user.isSysAdmin && !user.roles.includes('CHURCH_ADMIN'))) {
    return { items: [], error: 'Acesso negado.' };
  }

  const supabase = await createClient();
  let query = supabase
    .from('media_assets')
    .select(`*, uploader:profiles!uploaded_by(full_name)`)
    .order('created_at', { ascending: false });

  if (category && category !== 'other') {
    query = query.eq('category', category);
  }

  const { data, error } = await query;
  if (error) {
    console.error('[media] Falha ao listar assets:', error.message);
    return { items: [], error: 'Falha ao carregar galeria.' };
  }

  return { items: data as any[] };
}

export async function deleteMediaAsset(id: string): Promise<{ success?: boolean; error?: string }> {
  const user = await getCurrentUser();
  if (!user) return { error: 'Acesso negado.' };

  const supabase = await createClient();
  
  // 1. Get asset details
  const { data: asset } = await supabase.from('media_assets').select('*').eq('id', id).single();
  if (!asset) return { error: 'Arquivo não encontrado.' };

  // 2. Check permission (Owner or Admin)
  if (asset.uploaded_by !== user.id && !user.isSysAdmin && !user.roles.includes('CHURCH_ADMIN')) {
    return { error: 'Acesso negado para excluir este arquivo.' };
  }

  // 3. Delete from bucket via Admin Client (bypass bucket RLS to ensure clean up)
  const admin = await createAdminClient();
  
  // Storage path should contain bucket/path format, e.g., "avatars/123/avatar.jpg" or we deduce it
  // Actually, we should store bucket and path separately or just know them.
  // Our url format is https://.../object/public/bucket/path
  let bucket = 'site-images';
  if (asset.storage_path.includes('avatars/')) bucket = 'avatars';
  
  // Extract path from url if needed, but storage_path was saved.
  // Let's assume storage_path is the actual path inside the bucket.
  const { error: storageError } = await admin.storage.from(bucket).remove([asset.storage_path]);
  if (storageError) {
    console.error('[media] Storage delete err:', storageError.message);
    // Ignore error if not found in storage, we still delete record
  }

  // 4. Delete record
  const { error: dbError } = await supabase.from('media_assets').delete().eq('id', id);
  if (dbError) {
    console.error('[media] DB delete err:', dbError.message);
    return { error: 'Falha ao excluir registro do banco.' };
  }

  revalidatePath('/midias');
  return { success: true };
}

export async function syncOldMediaAssets(): Promise<{ success?: boolean; error?: string }> {
  const user = await getCurrentUser();
  if (!user || !user.isSysAdmin) return { error: 'Acesso negado.' };

  const admin = await createAdminClient();
  let count = 0;

  // Function to register if not exists
  const register = async (category: MediaCategory, url: string, fileName: string, uploadedBy: string, sizeBytes: number = 0, mimeType: string = 'image/jpeg') => {
    if (!url) return;
    const { data: existing } = await admin.from('media_assets').select('id').eq('url', url).single();
    if (existing) return;

    let path = url.split('/object/public/')[1];
    if (path) {
      // path looks like "bucket/folder/file.jpg", we want to remove the bucket part for storage_path
      const parts = path.split('/');
      parts.shift(); // remove bucket
      path = parts.join('/');
    } else {
      path = 'unknown/' + fileName;
    }

    await admin.from('media_assets').insert({
      file_name: fileName,
      category,
      url,
      storage_path: path,
      size_bytes: sizeBytes,
      mime_type: mimeType,
      uploaded_by: uploadedBy
    });
    count++;
  };

  // 1. Profiles
  const { data: profiles } = await admin.from('profiles').select('id, photo_url');
  if (profiles) {
    for (const p of profiles) {
      if (p.photo_url) await register('avatar', p.photo_url, `avatar_${p.id}.jpg`, p.id);
    }
  }

  // 2. Pastors
  const { data: pastors } = await admin.from('pastors').select('id, name, photo_url');
  if (pastors) {
    for (const p of pastors) {
      if (p.photo_url) await register('pastor', p.photo_url, `pastor_${p.name.replace(/\s+/g,'_')}.jpg`, user.id);
    }
  }

  // 3. Leaders
  const { data: leaders } = await admin.from('leaders').select('id, name, photo_url');
  if (leaders) {
    for (const p of leaders) {
      if (p.photo_url) await register('avatar', p.photo_url, `leader_${p.name.replace(/\s+/g,'_')}.jpg`, user.id);
    }
  }

  // 4. Cells
  const { data: cells } = await admin.from('cells').select('id, name, image_url, leader_photo_url');
  if (cells) {
    for (const c of cells) {
      if (c.image_url) await register('cell', c.image_url, `cell_banner_${c.name.replace(/\s+/g,'_')}.jpg`, user.id);
      if (c.leader_photo_url) await register('avatar', c.leader_photo_url, `cell_leader_${c.name.replace(/\s+/g,'_')}.jpg`, user.id);
    }
  }

  // 5. Site Media
  const { data: siteMedia } = await admin.from('site_media').select('*');
  if (siteMedia) {
    for (const sm of siteMedia) {
      if (sm.url) await register('banner', sm.url, sm.name, sm.uploaded_by || user.id, sm.size_bytes, sm.mime_type);
    }
  }

  revalidatePath('/midias');
  return { success: true };
}
