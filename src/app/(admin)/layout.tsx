import React from 'react';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/features/core/api/get-current-user';
import { getSidebarFeatureFlags } from '@/features/core/api/get-feature-flag';
import { createClient } from '@/lib/supabase/server';
import { AdminSidebarShell } from '@/features/core/components/AdminSidebarShell';
import { ToastProvider } from '@/features/core/components/ToastContext';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  if (!user || !user.isAdmin) {
    redirect('/login');
  }

  const supabase = await createClient();
  const [sidebarFlags, profileRes] = await Promise.all([
    getSidebarFeatureFlags(user),
    supabase.from('profiles').select('photo_url').eq('id', user.id).single(),
  ]);

  const photoUrl = profileRes.data?.photo_url ?? null;

  return (
    <ToastProvider>
      <AdminSidebarShell
        user={{ ...user, photoUrl }}
        flags={sidebarFlags}
      >
        {children}
      </AdminSidebarShell>
    </ToastProvider>
  );
}