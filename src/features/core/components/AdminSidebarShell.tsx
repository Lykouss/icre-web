'use client'

import React, { useState } from 'react';
import { usePathname } from 'next/navigation';
import { AdminSidebar } from '@/features/core/components/AdminSidebar';
import { UserMenu } from '@/features/core/components/UserMenu';
import { ThemeToggle } from '@/features/core/components/ThemeToggle';
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

/* ─── PageHeader ─────────────────────────────────────────────── */
export interface PageHeaderProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  badge?: React.ReactNode;
}

export function PageHeader({ title, description, action, badge }: PageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-8">
      <div className="min-w-0">
        <div className="flex items-center gap-3 mb-1">
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight leading-tight">{title}</h1>
          {badge}
        </div>
        {description && (
          <p className="text-sm text-gray-500 leading-relaxed max-w-2xl font-medium">{description}</p>
        )}
      </div>
      {action && (
        <div className="shrink-0 flex items-center gap-2">{action}</div>
      )}
    </div>
  );
}

/* ─── Breadcrumb from pathname ──────────────────────────────── */
const ROUTE_LABELS: Record<string, string> = {
  '/dashboard':  'Dashboard',
  '/financeiro': 'Financeiro',
  '/membros':    'Membros',
  '/eventos':    'Eventos',
  '/celulas':    'Células',
  '/lideres':    'Líderes',
  '/pastores':   'Pastores',
  '/midias':     'Central de Mídias',
  '/portal':     'Editor do Site',
  '/permissoes': 'Permissões',
  '/sysadmin':   'SysAdmin',
};

function TopbarTitle() {
  const pathname = usePathname();
  const base = '/' + (pathname.split('/')[1] ?? '');
  const label = ROUTE_LABELS[base] ?? 'Painel';
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="text-slate-600 font-medium">SIGE</span>
      <svg className="w-3.5 h-3.5 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"/>
      </svg>
      <span className="text-slate-300 font-semibold">{label}</span>
    </div>
  );
}

/* ─── Shell ──────────────────────────────────────────────────── */
export function AdminSidebarShell({ user, flags, children }: Props) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div
      data-admin="true"
      className="h-screen w-full flex flex-col md:flex-row overflow-hidden"
      style={{ background: 'var(--admin-bg)' }}
    >
      {/* Sidebar */}
      <AdminSidebar
        user={user}
        flags={flags}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">

        {/* Topbar */}
        <header
          className="h-14 shrink-0 flex items-center justify-between px-4 md:px-6 z-10"
          style={{
            background: 'var(--admin-sidebar)',
            borderBottom: '1px solid var(--admin-border)',
          }}
        >
          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen(true)}
            className="md:hidden p-2 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-white/5 transition-colors"
            aria-label="Abrir menu"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M4 6h16M4 12h16M4 18h16"/>
            </svg>
          </button>

          {/* Desktop: breadcrumb */}
          <div className="hidden md:block">
            <TopbarTitle />
          </div>

          {/* Right: user menu */}
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <UserMenu
              fullName={user.fullName}
              roles={user.roles}
              photoUrl={user.photoUrl}
            />
          </div>
        </header>

        {/* Page content */}
        <main
          className="flex-1 overflow-y-auto p-5 md:p-8 bg-gray-50 dark:bg-slate-900 text-gray-900 dark:text-slate-50 transition-colors duration-300"
        >
          {children}
        </main>
      </div>
    </div>
  );
}
