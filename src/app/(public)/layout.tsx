import { createClient } from '@/lib/supabase/server';
import { PublicNavbar } from '@/features/portal/components/PublicNavbar';
import { ToastProvider } from '@/features/core/components/ToastContext';

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();

  const [{ data: { user: authUser } }, { data: blocksData }] = await Promise.all([
    supabase.auth.getUser(),
    supabase
      .from('site_blocks')
      .select('type, is_active')
      .eq('is_active', true)
      .order('order_idx'),
  ]);

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

  const activeBlockTypes = (blocksData ?? []).map(b => b.type as string);

  return (
    <ToastProvider>
      <PublicNavbar user={navUser} activeBlockTypes={activeBlockTypes} />
      <div className="pt-0">{children}</div>
    </ToastProvider>
  );
}