'use server'

import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/features/core/api/get-current-user';
import type { ActionResult } from '@/features/support/types';

const ADMIN_ROLES = ['SYSADMIN', 'CHURCH_ADMIN', 'LEADER', 'FINANCE_ADMIN', 'SUPPORT_ADMIN'] as const;

async function requireAdminOrOwner(filePath: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Não autenticado.', supabase: null };

  const currentUser = await getCurrentUser();
  const isAdmin = currentUser?.roles.some(r =>
    (ADMIN_ROLES as ReadonlyArray<string>).includes(r)
  );

  // Admins têm acesso irrestrito; usuário só acessa a própria pasta
  const [folder] = filePath.split('/');
  const isOwner = folder === user.id;

  if (!isAdmin && !isOwner) {
    return { error: 'Acesso negado.', supabase: null };
  }

  return { error: null, supabase };
}

// ─────────────────────────────────────────────────────────────────────────────
// getAttachmentSignedUrl — Gera URL assinada temporária (60s) para um anexo
// ─────────────────────────────────────────────────────────────────────────────

export async function getAttachmentSignedUrl(
  filePath: string
): Promise<ActionResult<{ signedUrl: string }>> {
  const { error: authError, supabase } = await requireAdminOrOwner(filePath);
  if (authError || !supabase) return { error: authError ?? 'Não autenticado.' };

  const { data, error } = await supabase.storage
    .from('support_attachments')
    .createSignedUrl(filePath, 60); // 60 segundos de validade

  if (error || !data?.signedUrl) {
    console.error('[getAttachmentSignedUrl]', error?.message);
    return { error: 'Não foi possível gerar o link do arquivo.' };
  }

  return { data: { signedUrl: data.signedUrl } };
}
