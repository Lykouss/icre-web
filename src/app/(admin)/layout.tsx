import React from 'react';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/features/core/api/get-current-user';
import { AdminSidebar } from '@/features/core/components/AdminSidebar';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user || !user.isAdmin) {
    redirect('/login');
  }

  // Busca todas as permissões do usuário para o menu lateral!
  // IMPORTANTE: Adicione a importação do getSidebarFeatureFlags lá em cima:
  // import { getSidebarFeatureFlags } from '@/features/core/api/get-feature-flag';
  const { getSidebarFeatureFlags } = await import('@/features/core/api/get-feature-flag');
  const sidebarFlags = await getSidebarFeatureFlags(user);

  return (
    <div className="h-screen w-full overflow-hidden flex flex-col md:flex-row bg-slate-50">
      
      <AdminSidebar user={user} flags={sidebarFlags} />
      
      <div className="flex-1 flex flex-col min-w-0 h-full">
        <header className="h-16 bg-white border-b border-slate-200 px-8 flex items-center justify-between z-10 shrink-0">
          <h2 className="font-semibold text-slate-700 truncate">Visão Geral</h2>
          
          <div className="flex items-center gap-4 ml-4">
            <span className="hidden sm:inline-block px-2.5 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-md border border-blue-200">
              {user.roles.join(', ')}
            </span>
            <div className="h-8 w-8 rounded-full bg-slate-900 flex items-center justify-center text-white font-bold shadow-sm shrink-0">
              {user.fullName.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
          {children}
        </main>
      </div>
    </div>
  );
}