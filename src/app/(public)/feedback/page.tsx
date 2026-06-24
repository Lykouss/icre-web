import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { FeedbackForm } from '@/features/support/components/FeedbackForm';

export const metadata: Metadata = {
  title: 'Sugerir ou Relatar — ICRE',
  description: 'Envie sugestões de melhoria ou relate bugs para nossa equipe.',
};

export default async function FeedbackPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  // Verifica se pode enviar agora (1 por 24h)
  const windowStart = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const { data: lastFeedback } = await supabase
    .from('feedback')
    .select('created_at')
    .eq('user_id', user.id)
    .gte('created_at', windowStart)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  const canSubmit = !lastFeedback;
  const nextAvailableAt = lastFeedback
    ? new Date(new Date(lastFeedback.created_at).getTime() + 24 * 60 * 60 * 1000).toISOString()
    : null;

  return (
    <FeedbackForm
      canSubmit={canSubmit}
      nextAvailableAt={nextAvailableAt}
    />
  );
}
