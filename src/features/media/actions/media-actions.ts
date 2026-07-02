'use server'

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';
import { getCurrentUser } from '@/features/core/api/get-current-user';

export type MediaCategory = 'avatar' | 'pastor' | 'cell' | 'banner' | 'event' | 'support_archive' | 'support_attachment' | 'other';

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
  owner_name?: string; // Resolved name instead of ID
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
  if (!settings) return { allowed: true }; // Fallback se não existir

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
    case 'support_archive':
    case 'support_attachment':
      isEnabled = true; // Assumimos true por padrão para suporte
      maxSizeKb = 51200; // 50MB para arquivos de suporte (PDFs, etc)
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

export async function updateMediaAsset(id: string, updates: { file_name: string; category: MediaCategory }) {
  const user = await getCurrentUser();
  if (!user || (!user.isSysAdmin && !user.roles.includes('CHURCH_ADMIN'))) {
    return { error: 'Acesso negado.' };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from('media_assets')
    .update({ file_name: updates.file_name, category: updates.category })
    .eq('id', id);

  if (error) {
    console.error('[media] Erro ao atualizar asset:', error.message);
    return { error: 'Falha ao atualizar arquivo.' };
  }

  revalidatePath('/midias');
  return { success: true };
}

export async function listMediaAssets(category?: MediaCategory): Promise<{ items: MediaAsset[], error?: string }> {
  const user = await getCurrentUser();
  if (!user || (!user.isSysAdmin && !user.roles.includes('CHURCH_ADMIN'))) {
    return { items: [], error: 'Acesso negado.' };
  }

  const admin = await createAdminClient();
  
  // 1. Fetch assets
  let query = admin
    .from('media_assets')
    .select(`*, uploader:profiles!uploaded_by(full_name)`)
    .order('created_at', { ascending: false });

  if (category && category !== 'other') {
    query = query.eq('category', category);
  }

  const { data: assets, error } = await query;
  if (error) {
    console.error('[media] Falha ao listar assets:', error.message);
    return { items: [], error: 'Falha ao carregar galeria.' };
  }

  // 2. We want to resolve UUIDs in storage_path to human readable names.
  // We will load all profiles, cells, and pastors names to create a map.
  const [{ data: profiles }, { data: cells }, { data: pastors }] = await Promise.all([
    admin.from('profiles').select('id, full_name'),
    admin.from('cells').select('id, name'),
    admin.from('pastors').select('id, name')
  ]);

  const idMap = new Map<string, string>();
  profiles?.forEach(p => idMap.set(p.id, p.full_name));
  cells?.forEach(c => idMap.set(c.id, c.name));
  pastors?.forEach(p => idMap.set(p.id, p.name));

  const items = (assets as any[]).map(asset => {
    let owner_name = asset.uploader?.full_name || 'Desconhecido';
    
    // Check if any UUID in the storage path matches our ID Map
    const uuidRegex = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi;
    const matches = asset.storage_path.match(uuidRegex);
    if (matches && matches.length > 0) {
      for (const match of matches) {
        if (idMap.has(match)) {
          owner_name = idMap.get(match)!;
          break; // First match wins
        }
      }
    }
    
    return {
      ...asset,
      owner_name
    };
  });

  return { items };
}

export async function deleteMediaAsset(id: string): Promise<{ success?: boolean; error?: string }> {
  const user = await getCurrentUser();
  if (!user) return { error: 'Acesso negado.' };

  const supabase = await createClient();
  
  const { data: asset } = await supabase.from('media_assets').select('*').eq('id', id).single();
  if (!asset) return { error: 'Arquivo não encontrado.' };

  if (asset.uploaded_by !== user.id && !user.isSysAdmin && !user.roles.includes('CHURCH_ADMIN')) {
    return { error: 'Acesso negado para excluir este arquivo.' };
  }

  const admin = await createAdminClient();
  
  let bucket = 'site-images';
  if (asset.storage_path.includes('avatars/')) bucket = 'avatars';
  if (asset.category === 'support_archive') bucket = 'support_archives';
  if (asset.category === 'support_attachment') bucket = 'support_attachments';
  
  const { error: storageError } = await admin.storage.from(bucket).remove([asset.storage_path]);
  if (storageError) {
    console.error('[media] Storage delete err:', storageError.message);
  }

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

  const register = async (category: MediaCategory, url: string, fileName: string, uploadedBy: string, sizeBytes: number = 0, mimeType: string = 'image/jpeg') => {
    if (!url) return;
    const { data: existing } = await admin.from('media_assets').select('id').eq('url', url).single();
    if (existing) return;

    let path = url.split('/object/public/')[1];
    if (path) {
      const parts = path.split('/');
      parts.shift();
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

  const { data: profiles } = await admin.from('profiles').select('id, photo_url');
  if (profiles) {
    for (const p of profiles) {
      if (p.photo_url) await register('avatar', p.photo_url, `avatar_${p.id}.jpg`, p.id);
    }
  }

  const { data: pastors } = await admin.from('pastors').select('id, name, photo_url');
  if (pastors) {
    for (const p of pastors) {
      if (p.photo_url) await register('pastor', p.photo_url, `pastor_${p.name.replace(/\s+/g,'_')}.jpg`, user.id);
    }
  }

  const { data: leaders } = await admin.from('leaders').select('id, name, photo_url');
  if (leaders) {
    for (const p of leaders) {
      if (p.photo_url) await register('avatar', p.photo_url, `leader_${p.name.replace(/\s+/g,'_')}.jpg`, user.id);
    }
  }

  const { data: cells } = await admin.from('cells').select('id, name, image_url, leader_photo_url');
  if (cells) {
    for (const c of cells) {
      if (c.image_url) await register('cell', c.image_url, `cell_banner_${c.name.replace(/\s+/g,'_')}.jpg`, user.id);
      if (c.leader_photo_url) await register('avatar', c.leader_photo_url, `cell_leader_${c.name.replace(/\s+/g,'_')}.jpg`, user.id);
    }
  }

  const { data: siteMedia } = await admin.from('site_media').select('*');
  if (siteMedia) {
    for (const sm of siteMedia) {
      if (sm.url) await register('banner', sm.url, sm.name, sm.uploaded_by || user.id, sm.size_bytes, sm.mime_type);
    }
  }

  revalidatePath('/midias');
  return { success: true };
}
