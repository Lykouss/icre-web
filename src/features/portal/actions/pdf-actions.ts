'use server'

import { createClient } from '@supabase/supabase-js';
import { getCurrentUser } from '@/features/core/api/get-current-user';
import { isValidUuid } from '@/lib/action-validators';

const RATE_LIMIT_MAX = 5;         // max downloads per user per hour
const RATE_LIMIT_WINDOW_MS = 3600_000; // 1 hour

export async function checkPdfRateLimit(userId: string): Promise<{ allowed: boolean; remaining: number; resetAt?: Date }> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );

  const windowStart = new Date(Date.now() - RATE_LIMIT_WINDOW_MS).toISOString();

  const { count } = await supabase
    .from('pdf_download_logs')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('downloaded_at', windowStart);

  const used = count ?? 0;
  const remaining = Math.max(0, RATE_LIMIT_MAX - used);

  return {
    allowed: remaining > 0,
    remaining,
  };
}

export async function logPdfDownload(registrationId: string): Promise<{ error?: string; success?: boolean }> {
  const user = await getCurrentUser();
  if (!user) return { error: 'Não autenticado.' };
  if (!isValidUuid(registrationId)) return { error: 'Inscrição inválida.' };

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );

  // Rate limit check
  const { allowed, remaining } = await checkPdfRateLimit(user.id);
  if (!allowed) {
    return { error: `Limite atingido. Você pode baixar no máximo ${RATE_LIMIT_MAX} comprovantes por hora. Tente novamente mais tarde.` };
  }

  // Verify the registration belongs to the user
  const { data: reg } = await supabase
    .from('event_registrations')
    .select('id, member_id, user_id, status')
    .eq('id', registrationId)
    .single();

  if (!reg) return { error: 'Inscrição não encontrada.' };
  if (reg.user_id !== user.id && reg.member_id !== user.id) {
    return { error: 'Você não tem permissão para baixar este comprovante.' };
  }
  if (reg.status !== 'confirmado') return { error: 'Apenas inscrições confirmadas possuem comprovante.' };

  // Log the download
  await supabase.from('pdf_download_logs').insert({
    user_id: user.id,
    registration_id: registrationId,
  });

  return { success: true };
}
