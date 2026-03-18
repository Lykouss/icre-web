import React from 'react';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/features/core/api/get-current-user';
import { getSidebarFeatureFlags } from '@/features/core/api/get-feature-flag';
import { createClient } from '@/lib/supabase/server';
import { AdminSidebar } from '@/features/core/components/AdminSidebar';
import { UserMenu } from '@/features/core/components/UserMenu';
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
      <div className="h-screen w-full overflow-hidden flex flex-col md:flex-row bg-slate-50">
        <AdminSidebar user={{ ...user, photoUrl }} flags={sidebarFlags} />

        <div className="flex-1 flex flex-col min-w-0 h-full">
          <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between z-10 shrink-0">
            <h2 className="font-semibold text-slate-700 truncate">Visão Geral</h2>
            <UserMenu
              fullName={user.fullName}
              roles={user.roles}
              photoUrl={photoUrl}
            />
          </header>

          <main
            className="flex-1 overflow-y-auto p-4 md:p-8"
            style={{ scrollbarWidth: 'thin', scrollbarColor: '#cbd5e1 transparent' }}
          >
            {children}
          </main>
        </div>
      </div>
    </ToastProvider>
  );
}