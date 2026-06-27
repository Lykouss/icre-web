'use server'

import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/features/core/api/get-current-user';
import type { ActionResult } from '@/features/support/types';

const FEEDBACK_ADMIN_ROLES = ['SYSADMIN', 'CHURCH_ADMIN', 'SUPPORT_ADMIN'] as const;

async function requireFeedbackAdmin() {
  const user = await getCurrentUser();
  if (!user || !user.roles.some(r => (FEEDBACK_ADMIN_ROLES as ReadonlyArray<string>).includes(r))) {
    return null;
  }
  return user;
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface FeedbackItem {
  id: string;
  user_id: string;
  content: string;
  type: 'bug' | 'suggestion';
  created_at: string;
  status: 'pending' | 'in_review' | 'resolved' | 'dismissed';
  is_pinned: boolean;
  admin_notes: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  profiles: { full_name: string; photo_url: string | null } | null;
}

export type FeedbackStatus = FeedbackItem['status'];

// ─────────────────────────────────────────────────────────────────────────────
// getAllFeedbacks — busca todos com dados do perfil do usuário
// ─────────────────────────────────────────────────────────────────────────────

export async function getAllFeedbacks(): Promise<ActionResult<FeedbackItem[]>> {
  const admin = await requireFeedbackAdmin();
  if (!admin) return { error: 'Acesso negado.' };

  const supabase = await createClient();

  const { data, error } = await supabase
    .from('feedback')
    .select('*, profiles:user_id(full_name, photo_url)')
    .order('is_pinned', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[getAllFeedbacks]', error.message);
    return { error: 'Erro ao buscar feedbacks.' };
  }

  return { data: (data ?? []) as FeedbackItem[] };
}

// ─────────────────────────────────────────────────────────────────────────────
// updateFeedbackStatus — muda o status de um feedback
// ─────────────────────────────────────────────────────────────────────────────

export async function updateFeedbackStatus(
  id: string,
  status: FeedbackStatus,
): Promise<ActionResult<void>> {
  const admin = await requireFeedbackAdmin();
  if (!admin) return { error: 'Acesso negado.' };

  const supabase = await createClient();

  const { error } = await supabase
    .from('feedback')
    .update({
      status,
      reviewed_by: admin.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', id);

  if (error) {
    console.error('[updateFeedbackStatus]', error.message);
    return { error: 'Erro ao atualizar status.' };
  }

  return { data: undefined };
}

// ─────────────────────────────────────────────────────────────────────────────
// toggleFeedbackPin — afixar/desafixar um feedback
// ─────────────────────────────────────────────────────────────────────────────

export async function toggleFeedbackPin(
  id: string,
  isPinned: boolean,
): Promise<ActionResult<void>> {
  const admin = await requireFeedbackAdmin();
  if (!admin) return { error: 'Acesso negado.' };

  const supabase = await createClient();

  const { error } = await supabase
    .from('feedback')
    .update({ is_pinned: isPinned })
    .eq('id', id);

  if (error) {
    console.error('[toggleFeedbackPin]', error.message);
    return { error: 'Erro ao alterar fixação.' };
  }

  return { data: undefined };
}

// ─────────────────────────────────────────────────────────────────────────────
// saveFeedbackNotes — salva anotações internas do admin
// ─────────────────────────────────────────────────────────────────────────────

export async function saveFeedbackNotes(
  id: string,
  notes: string,
): Promise<ActionResult<void>> {
  const admin = await requireFeedbackAdmin();
  if (!admin) return { error: 'Acesso negado.' };

  const supabase = await createClient();

  const { error } = await supabase
    .from('feedback')
    .update({
      admin_notes: notes.trim() || null,
      reviewed_by: admin.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', id);

  if (error) {
    console.error('[saveFeedbackNotes]', error.message);
    return { error: 'Erro ao salvar anotações.' };
  }

  return { data: undefined };
}

// ─────────────────────────────────────────────────────────────────────────────
// deleteFeedback — remove permanentemente (SYSADMIN apenas)
// ─────────────────────────────────────────────────────────────────────────────

export async function deleteFeedback(id: string): Promise<ActionResult<void>> {
  const user = await getCurrentUser();
  if (!user || !user.roles.includes('SYSADMIN')) {
    return { error: 'Apenas SYSADMIN pode remover feedbacks.' };
  }

  const supabase = await createClient();

  const { error } = await supabase.from('feedback').delete().eq('id', id);

  if (error) {
    console.error('[deleteFeedback]', error.message);
    return { error: 'Erro ao remover feedback.' };
  }

  return { data: undefined };
}

// ─────────────────────────────────────────────────────────────────────────────
// getPendingFeedbackCount — contagem de feedbacks pendentes para o badge do sidebar
// ─────────────────────────────────────────────────────────────────────────────

export async function getPendingFeedbackCount(): Promise<number> {
  try {
    const admin = await requireFeedbackAdmin();
    if (!admin) return 0;

    const supabase = await createClient();
    const { count } = await supabase
      .from('feedback')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending');

    return count ?? 0;
  } catch {
    return 0;
  }
}
