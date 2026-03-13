import { createClient } from '@/lib/supabase/server';
import LayoutShell from '@/features/portal/components/LayoutShell';

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();

  let navUser: { fullName: string; photoUrl: string | null; isAdmin: boolean } | null = null;

  if (authUser) {
    const [profileRes, roleRes] = await Promise.all([
      supabase.from('profiles').select('full_name, photo_url').eq('id', authUser.id).single(),
      supabase.from('user_roles').select('role').eq('user_id', authUser.id),
    ]);

    const roles = roleRes.data?.map(r => r.role) ?? [];
    navUser = {
      fullName: profileRes.data?.full_name ?? 'Usuário',
      photoUrl: profileRes.data?.photo_url ?? null,
      isAdmin:  roles.some(r => ['SYSADMIN', 'CHURCH_ADMIN'].includes(r)),
    };
  }

  return <LayoutShell navUser={navUser}>{children}</LayoutShell>;
}