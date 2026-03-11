import React from 'react';
import { createClient } from '@/lib/supabase/server';
import { PublicNavbar } from '@/features/portal/components/PublicNavbar';
import { PublicFooter } from '@/features/portal/components/PublicFooter';
import { AdminSystemButton } from '@/features/portal/components/AdminSystemButton';

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let profile: { full_name: string | null } | null = null;
  let isAdmin = false;

  if (user) {
    const { data: profileData } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .single();

    profile = profileData;

    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .in('role', ['LEADER', 'FINANCE_ADMIN', 'CHURCH_ADMIN', 'SYSADMIN'])
      .limit(1)
      .single();

    isAdmin = !!roleData;
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <PublicNavbar
        user={user ? { fullName: profile?.full_name ?? 'Usuário', isAdmin } : null}
      />

      <main className="flex-grow">
        {children}
      </main>

      <PublicFooter />

      {isAdmin && <AdminSystemButton />}
    </div>
  );
}