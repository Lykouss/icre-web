'use client'

import React, { useState } from 'react';
import { AdminSidebar } from '@/features/core/components/AdminSidebar';
import { UserMenu } from '@/features/core/components/UserMenu';
import { AppRole } from '@/features/core/api/get-current-user';

import type { FlagResult } from '@/features/core/api/get-feature-flag';

interface Props {
  user: {
    id: string;
    fullName: string;
    photoUrl: string | null;
    roles: AppRole[];
    isAdmin: boolean;
    isSysAdmin: boolean;
  };
  flags: Record<string, FlagResult>;
  children: React.ReactNode;
}

export function AdminSidebarShell({ user, flags, children }: Props) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="h-screen w-full flex flex-col md:flex-row bg-slate-50 overflow-y-hidden">

      {/* Sidebar */}
      <AdminSidebar
        user={user}
        flags={flags}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0 h-full">

        {/* Header */}
        <header className="h-16 bg-white border-b border-slate-200 px-4 md:px-6 flex items-center justify-between z-10 shrink-0">

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen(true)}
            className="md:hidden p-2 rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors"
            aria-label="Abrir menu"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          {/* Desktop: left-side title placeholder */}
          <h2 className="hidden md:block font-semibold text-slate-700 truncate">Visão Geral</h2>

          {/* User menu */}
          <UserMenu
            fullName={user.fullName}
            roles={user.roles}
            photoUrl={user.photoUrl}
          />
        </header>

        {/* Page content */}
        <main
          className="flex-1 overflow-y-auto p-4 md:p-8"
          style={{ scrollbarWidth: 'thin', scrollbarColor: '#cbd5e1 transparent' }}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
