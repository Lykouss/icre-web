'use server'

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { getCurrentUser } from '@/features/core/api/get-current-user';
import { isValidUuid } from '@/lib/action-validators';
import type { SiteBlockType } from '@/features/portal/types';

const VALID_BLOCK_TYPES: SiteBlockType[] = [
  'hero', 'about', 'mission', 'events', 'contact', 'custom_text', 'banner', 'youtube',
];

function canManagePortal(roles: string[]): boolean {
  return roles.some(r => ['SYSADMIN', 'CHURCH_ADMIN'].includes(r));
}

export async function saveBlockDraft(blockId: string, content: Record<string, unknown>) {
  const user = await getCurrentUser();
  if (!user) return { error: 'Não autorizado.' };
  if (!canManagePortal(user.roles)) return { error: 'Acesso negado.' };
  if (!isValidUuid(blockId)) return { error: 'Bloco inválido.' };
  if (!content || typeof content !== 'object' || Array.isArray(content)) {
    return { error: 'Conteúdo inválido.' };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from('site_blocks')
    .update({ content, updated_at: new Date().toISOString() })
    .eq('id', blockId);

  if (error) {
    console.error('Erro ao salvar rascunho:', error.message);
    return { error: 'Falha ao salvar o rascunho.' };
  }

  // Revalida apenas o preview, não o site público
  revalidatePath('/portal');
  return { success: true };
}

export async function publishAllBlocks() {
  const user = await getCurrentUser();
  if (!user) return { error: 'Não autorizado.' };
  if (!canManagePortal(user.roles)) return { error: 'Acesso negado.' };

  const supabase = await createClient();

  const { data: blocks, error: fetchError } = await supabase
    .from('site_blocks')
    .select('id, content');

  if (fetchError || !blocks) {
    console.error('Erro ao buscar blocos para publicar:', fetchError?.message);
    return { error: 'Falha ao publicar. Tente novamente.' };
  }

  const now = new Date().toISOString();
  const results = await Promise.all(
    blocks.map(b =>
      supabase
        .from('site_blocks')
        .update({ published_content: b.content, updated_at: now })
        .eq('id', b.id)
    )
  );

  const failed = results.find(r => r.error);
  if (failed?.error) {
    console.error('Erro ao publicar bloco:', failed.error.message);
    return { error: 'Falha ao publicar. Tente novamente.' };
  }

  revalidatePath('/');
  revalidatePath('/agenda');
  revalidatePath('/contato');
  revalidatePath('/portal');
  return { success: true };
}

export async function toggleBlock(blockId: string, isActive: boolean) {
  const user = await getCurrentUser();
  if (!user) return { error: 'Não autorizado.' };
  if (!canManagePortal(user.roles)) return { error: 'Acesso negado.' };
  if (!isValidUuid(blockId)) return { error: 'Bloco inválido.' };

  const supabase = await createClient();
  const { error } = await supabase
    .from('site_blocks')
    .update({ is_active: isActive, updated_at: new Date().toISOString() })
    .eq('id', blockId);

  if (error) {
    console.error('Erro ao alternar bloco:', error.message);
    return { error: 'Falha ao atualizar o bloco.' };
  }

  revalidatePath('/portal');
  return { success: true };
}

export async function reorderBlocks(orderedIds: string[]) {
  const user = await getCurrentUser();
  if (!user) return { error: 'Não autorizado.' };
  if (!canManagePortal(user.roles)) return { error: 'Acesso negado.' };
  if (!Array.isArray(orderedIds) || orderedIds.some(id => !isValidUuid(id))) {
    return { error: 'Lista de blocos inválida.' };
  }

  const supabase = await createClient();
  await Promise.all(
    orderedIds.map((id, index) =>
      supabase
        .from('site_blocks')
        .update({ order_idx: index + 1, updated_at: new Date().toISOString() })
        .eq('id', id)
    )
  );

  revalidatePath('/portal');
  return { success: true };
}

export async function addBlock(type: SiteBlockType) {
  const user = await getCurrentUser();
  if (!user) return { error: 'Não autorizado.' };
  if (!canManagePortal(user.roles)) return { error: 'Acesso negado.' };
  if (!VALID_BLOCK_TYPES.includes(type)) return { error: 'Tipo de bloco inválido.' };

  const supabase = await createClient();

  const { data: last } = await supabase
    .from('site_blocks')
    .select('order_idx')
    .order('order_idx', { ascending: false })
    .limit(1)
    .single();

  const nextOrder = (last?.order_idx ?? 0) + 1;

  const DEFAULT_CONTENT: Record<SiteBlockType, Record<string, unknown>> = {
  hero:           { title: 'Novo Hero', subtitle: '', bg_color: '#1e3a5f', text_color: '#ffffff', button_text: '', button_link: '', image_url: '' },
  about:          { title: 'Sobre nós', text: '', image_url: '' },
  mission:        { title: 'Nossa Missão', items: [] },
  events:         { title: 'Próximos Eventos', subtitle: '' },
  youtube:        { title: 'Ao Vivo', channel_url: '', video_id: '' },
  contact:        { title: 'Contato', subtitle: '', address: '', phone: '', email: '', maps_embed_url: '' },
  custom_text:    { title: '', text: '', bg_color: '#ffffff', text_color: '#1e293b' },
  banner:         { image_url: '', link: '', alt: '' },
  pastors:        { title: 'Nossa Liderança', subtitle: '' },
  cells:          { title: 'Nossas Células', subtitle: '' },
  events_preview: { title: 'Próximos Eventos', subtitle: '' },
};

  const { error } = await supabase.from('site_blocks').insert({
    type,
    order_idx: nextOrder,
    is_active: false,
    content: DEFAULT_CONTENT[type],
    published_content: DEFAULT_CONTENT[type],
  });

  if (error) {
    console.error('Erro ao adicionar bloco:', error.message);
    return { error: 'Falha ao adicionar o bloco.' };
  }

  revalidatePath('/portal');
  return { success: true };
}

export async function deleteBlock(blockId: string) {
  const user = await getCurrentUser();
  if (!user) return { error: 'Não autorizado.' };
  if (!user.isSysAdmin) return { error: 'Apenas SYSADMIN pode excluir blocos.' };
  if (!isValidUuid(blockId)) return { error: 'Bloco inválido.' };

  const supabase = await createClient();
  const { error } = await supabase.from('site_blocks').delete().eq('id', blockId);

  if (error) {
    console.error('Erro ao excluir bloco:', error.message);
    return { error: 'Falha ao excluir o bloco.' };
  }

  revalidatePath('/');
  revalidatePath('/portal');
  return { success: true };
}