import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { ProfileClient } from '@/features/core/components/ProfileClient';

export const metadata = { title: 'Minha Conta — ICRE' };

export default async function MyAccountPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, phone, address, birth_date, photo_url')
    .eq('id', user.id)
    .single();

  const { data: roleData } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .in('role', ['CHURCH_ADMIN', 'SYSADMIN', 'FINANCE_ADMIN', 'LEADER'])
    .limit(1)
    .single();

  return (
    <ProfileClient
      email={user.email ?? ''}
      fullName={profile?.full_name ?? ''}
      phone={profile?.phone ?? ''}
      address={profile?.address ?? ''}
      birthDate={profile?.birth_date ?? ''}
      photoUrl={profile?.photo_url ?? null}
      isAdmin={!!roleData}
    />
  );
}