import { createClient }          from '@/lib/supabase/server';
import { redirect }               from 'next/navigation';
import { SuspendedAccessClient }  from '@/app/(public)/acesso-suspenso/SuspendedAccessClient';

export const metadata = { title: 'Acesso suspenso — ICRE' };

export default async function AcessoSuspensosPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, is_suspended, suspended_until, suspension_reason, suspended_by_name')
    .eq('id', user.id)
    .single();

  if (!profile?.is_suspended) redirect('/dashboard');

  return (
    <SuspendedAccessClient
      fullName={profile.full_name ?? 'usuário'}
      reason={profile.suspension_reason ?? null}
      byName={profile.suspended_by_name ?? null}
      until={profile.suspended_until ?? null}
    />
  );
}