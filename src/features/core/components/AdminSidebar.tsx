'use client'

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { AppRole } from '@/features/core/api/get-current-user';

interface SidebarProps {
  user: {
    id: string;
    fullName: string;
    photoUrl: string | null;
    roles: AppRole[];
    isAdmin: boolean;
    isSysAdmin: boolean;
  };
  flags?: Record<string, boolean>;
}

interface NavItem {
  label: string;
  href: string;
  flag: string;
  roles: AppRole[];
  icon: React.ReactNode;
}

const ICON_DASHBOARD = (
  <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
  </svg>
);

const NAV_ITEMS: NavItem[] = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    flag: 'module_dashboard',
    roles: ['SYSADMIN', 'CHURCH_ADMIN', 'FINANCE_ADMIN', 'LEADER'],
    icon: ICON_DASHBOARD,
  },
  {
    label: 'Financeiro',
    href: '/financeiro',
    flag: 'module_finance',
    roles: ['SYSADMIN', 'CHURCH_ADMIN', 'FINANCE_ADMIN'],
    icon: (
      <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    label: 'Membros',
    href: '/membros',
    flag: 'module_members',
    roles: ['SYSADMIN', 'CHURCH_ADMIN', 'LEADER'],
    icon: (
      <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    label: 'Eventos',
    href: '/eventos',
    flag: 'module_events',
    roles: ['SYSADMIN', 'CHURCH_ADMIN'],
    icon: (
      <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    label: 'Site Público',
    href: '/portal',
    flag: 'module_public_site',
    roles: ['SYSADMIN', 'CHURCH_ADMIN'],
    icon: (
      <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
      </svg>
    ),
  },
  {
    label: 'Permissões',
    href: '/permissoes',
    flag: 'module_permissions',
    roles: ['SYSADMIN', 'CHURCH_ADMIN'],
    icon: (
      <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
  },
];

function UserAvatar({ photoUrl, fullName, size }: { photoUrl: string | null; fullName: string; size: number }) {
  const initials = fullName.trim().split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase() || '?';
  const sizeClass = size === 32 ? 'w-8 h-8 text-sm' : 'w-10 h-10 text-base';

  return (
    <div className={`${sizeClass} rounded-full overflow-hidden bg-blue-600 flex items-center justify-center text-white font-bold shrink-0`}>
      {photoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={photoUrl} alt={fullName || 'Avatar'} className="object-cover w-full h-full" />
      ) : (
        initials
      )}
    </div>
  );
}

export function AdminSidebar({ user, flags = {} }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel('realtime_flags')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'feature_flags' }, () => {
        router.refresh();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [router]);

  const visibleItems = NAV_ITEMS.filter(item => {
    if (!flags[item.flag]) return false;
    if (user.isSysAdmin) return true;
    return item.roles.some(r => user.roles.includes(r));
  });

  function isActive(href: string) {
    return pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
  }

  return (
    <aside className={`bg-slate-900 text-slate-300 flex flex-col shadow-xl z-20 transition-all duration-300 ease-in-out relative shrink-0 ${
      isCollapsed ? 'w-20' : 'w-64'
    }`}>
      {/* Botão recolher */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-5 bg-blue-600 text-white rounded-full p-1 shadow-md hover:bg-blue-500 transition-colors z-30"
      >
        <svg className={`w-4 h-4 transition-transform duration-300 ${isCollapsed ? 'rotate-180' : ''}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      {/* Logo */}
      <div className={`h-16 flex items-center bg-slate-950 border-b border-slate-800 shrink-0 ${isCollapsed ? 'justify-center px-0' : 'px-6'}`}>
        <Link href="/dashboard" className="flex items-center gap-3 transition-opacity hover:opacity-80">
          <div className="relative w-8 h-8 shrink-0">
            <Image src="/logo.svg" alt="Logo ICRE" fill className="object-contain brightness-0 invert" />
          </div>
          {!isCollapsed && (
            <span className="font-bold text-lg text-white tracking-wide truncate">SIGE-Web</span>
          )}
        </Link>
      </div>

      {/* Navegação */}
      <nav
        className="flex-1 py-4 overflow-y-auto overflow-x-hidden"
        style={{ scrollbarWidth: 'thin', scrollbarColor: '#334155 transparent' }}
      >
        {!isCollapsed && (
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 px-6">
            Gestão
          </p>
        )}

        <div className="space-y-0.5 px-3">
          {visibleItems.map(item => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                title={isCollapsed ? item.label : undefined}
                className={`flex items-center rounded-lg font-medium transition-colors ${
                  isCollapsed ? 'justify-center py-3 px-0' : 'gap-3 px-3 py-2.5'
                } ${
                  active
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                {item.icon}
                {!isCollapsed && <span className="truncate text-sm">{item.label}</span>}
              </Link>
            );
          })}
        </div>

        {user.isSysAdmin && (
          <>
            <div className={`mt-6 mb-3 ${isCollapsed ? 'mx-3 border-t border-slate-800' : 'px-6'}`}>
              {!isCollapsed && (
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Sistema</p>
              )}
            </div>
            <div className="px-3">
              <Link
                href="/sysadmin"
                title={isCollapsed ? 'SysAdmin' : undefined}
                className={`flex items-center rounded-lg font-medium transition-colors ${
                  isCollapsed ? 'justify-center py-3 px-0' : 'gap-3 px-3 py-2.5'
                } ${
                  isActive('/sysadmin')
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {!isCollapsed && <span className="truncate text-sm">SysAdmin</span>}
              </Link>
            </div>
          </>
        )}
      </nav>

      {/* Rodapé com avatar */}
      <div className={`border-t border-slate-800 p-3 shrink-0 ${isCollapsed ? 'flex justify-center' : ''}`}>
        {isCollapsed ? (
          <UserAvatar photoUrl={user.photoUrl} fullName={user.fullName} size={32} />
        ) : (
          <div className="flex items-center gap-3 px-2 py-1.5 rounded-lg">
            <UserAvatar photoUrl={user.photoUrl} fullName={user.fullName} size={32} />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white truncate">{user.fullName}</p>
              <p className="text-xs text-slate-500 truncate">{user.roles[0]}</p>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}