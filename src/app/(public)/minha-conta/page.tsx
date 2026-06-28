import { cache } from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { ProfileClient } from '@/features/core/components/ProfileClient';

export const metadata = { title: 'Minha Conta — ICRE' };

const AVATAR_MAX_PER_DAY = 3;
const AVATAR_WINDOW_MS   = 24 * 60 * 60 * 1000;

const getAvatarUploadsUsed = cache(async (userId: string): Promise<number> => {
  const admin = await createAdminClient();
  const windowStart = new Date(Date.now() - AVATAR_WINDOW_MS).toISOString();
  const { count } = await admin
    .from('auth_rate_limits')
    .select('id', { count: 'exact', head: true })
    .eq('identifier', userId)
    .eq('action', 'avatar_upload')
    .gte('attempted_at', windowStart);
  return count ?? 0;
});

export default async function MyAccountPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const [profileRes, roleRes, uploadCount, unnotifiedGiftsRes] = await Promise.all([
    supabase
      .from('profiles')
      .select('full_name, phone, address, birth_date, photo_url')
      .eq('id', user.id)
      .single(),
    supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .in('role', ['CHURCH_ADMIN', 'SYSADMIN', 'FINANCE_ADMIN', 'LEADER'])
      .limit(1)
      .single(),
    getAvatarUploadsUsed(user.id),
    supabase
      .from('event_registrations')
      .select('id, event:events(title)')
      .eq('member_id', user.id)
      .eq('is_gift', true)
      .is('gift_notified_at', null)
  ]);

  const uploadsRemaining = Math.max(0, AVATAR_MAX_PER_DAY - uploadCount);

  
  return (
    <ProfileClient
      email={user.email ?? ''}
      fullName={profileRes.data?.full_name ?? ''}
      phone={profileRes.data?.phone ?? ''}
      address={profileRes.data?.address ?? ''}
      birthDate={profileRes.data?.birth_date ?? ''}
      photoUrl={profileRes.data?.photo_url ?? null}
      primaryRole={roleRes.data?.role as any}
      isAdmin={!!roleRes.data}
      uploadsRemaining={uploadsRemaining}
      unnotifiedGifts={unnotifiedGiftsRes.data as any}
    />
  );
}