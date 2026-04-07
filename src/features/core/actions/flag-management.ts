'use server'

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { getCurrentUser } from '@/features/core/api/get-current-user';

export type FlagStatus =
  | 'novo'
  | 'desenvolvimento'
  | 'manutencao'
  | 'inativo'
  | 'antecipado'
  | 'indisponivel'
  | 'movido'
  | 'normal';

export async function updateFlagStatus(slug: string, status: FlagStatus) {
  const user = await getCurrentUser();
  if (!user?.isSysAdmin) return { error: 'Acesso negado.' };

  const supabase = await createClient();
  const updateData: any = { status };
  if (status !== 'manutencao') {
    updateData.maintenance_scheduled_at = null;
  }

  const { error } = await supabase
    .from('feature_flags')
    .update(updateData)
    .eq('slug', slug);

  if (error) return { error: 'Falha ao atualizar status.' };
  revalidatePath('/', 'layout');
  return { success: true };
}

export async function updateFlagActive(slug: string, isActive: boolean) {
  const user = await getCurrentUser();
  if (!user?.isSysAdmin) return { error: 'Acesso negado.' };

  const supabase = await createClient();
  const { error } = await supabase
    .from('feature_flags')
    .update({ is_active: isActive })
    .eq('slug', slug);

  if (error) return { error: 'Falha ao atualizar flag.' };
  revalidatePath('/', 'layout');
  return { success: true };
}

export async function scheduleMaintenance(slug: string, scheduledAt: string | null) {
  const user = await getCurrentUser();
  if (!user?.isSysAdmin) return { error: 'Acesso negado.' };

  const supabase = await createClient();

  // Se agendar uma data, apenas salva a data. Se anular, salva também.
  const updateData = scheduledAt
    ? { maintenance_scheduled_at: scheduledAt }
    : { maintenance_scheduled_at: null };

  const { error } = await supabase
    .from('feature_flags')
    .update(updateData)
    .eq('slug', slug);

  if (error) return { error: 'Falha ao agendar manutenção.' };
  revalidatePath('/', 'layout');
  return { success: true };
}

/**
 * Seleciona N usuários aleatórios e concede acesso antecipado a uma flag.
 * Define status como 'antecipado' e popula allowed_users.
 */
export async function grantEarlyAccessToRandomUsers(slug: string, count: number) {
  const user = await getCurrentUser();
  if (!user?.isSysAdmin) return { error: 'Acesso negado.' };

  const supabase = await createClient();

  // Busca todos os usuários elegíveis (excluindo sysadmins)
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('id, full_name')
    .limit(500);

  if (profilesError || !profiles) return { error: 'Falha ao buscar usuários.' };

  // Exclui o SysAdmin atual e embaralha a lista
  const eligible = profiles.filter((p) => p.id !== user.id);
  const shuffled = eligible.sort(() => Math.random() - 0.5);
  const selected = shuffled.slice(0, count).map((p) => p.id);

  if (selected.length === 0) return { error: 'Nenhum usuário elegível encontrado.' };

  const { error } = await supabase
    .from('feature_flags')
    .update({ allowed_users: selected, status: 'antecipado' })
    .eq('slug', slug);

  if (error) return { error: 'Falha ao conceder acesso antecipado.' };
  revalidatePath('/', 'layout');

  return { success: true, selectedCount: selected.length };
}

export async function recordFirstAccess(userId: string, flagSlug: string) {
  const supabase = await createClient();
  // upsert silently — if already exists it just ignores (unique constraint)
  await supabase
    .from('user_feature_access')
    .upsert({ user_id: userId, flag_slug: flagSlug }, { onConflict: 'user_id,flag_slug' });
}
