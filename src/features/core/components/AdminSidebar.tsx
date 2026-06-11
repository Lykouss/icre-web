'use client'

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { AppRole } from '@/features/core/api/get-current-user';
import type { FlagResult } from '@/features/core/api/get-feature-flag';

/* ─── Types ──────────────────────────────────────────────────── */

interface SidebarProps {
  user: {
    id: string;
    fullName: string;
    photoUrl: string | null;
    roles: AppRole[];
    isAdmin: boolean;
    isSysAdmin: boolean;
  };
  flags?: Record<string, FlagResult>;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

interface NavItem {
  label: string;
  href: string;
  flag: string;
  roles: AppRole[];
  icon: React.ReactNode;
  badge?: string;
}

const ROLE_LABELS: Record<string, string> = {
  SYSADMIN:     'Administrador do Sistema',
  CHURCH_ADMIN: 'Administrador da Igreja',
  FINANCE_ADMIN:'Adm. Financeiro',
  LEADER:       'Líder',
  MEMBER:       'Membro',
};

/* ─── Icons (18×18, strokeWidth 1.5) ────────────────────────── */
const icons = {
  dashboard: (
    <svg className="w-[17px] h-[17px] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"/>
    </svg>
  ),
  finance: (
    <svg className="w-[17px] h-[17px] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
    </svg>
  ),
  members: (
    <svg className="w-[17px] h-[17px] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/>
    </svg>
  ),
  events: (
    <svg className="w-[17px] h-[17px] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
    </svg>
  ),
  cells: (
    <svg className="w-[17px] h-[17px] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
    </svg>
  ),
  leaders: (
    <svg className="w-[17px] h-[17px] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
    </svg>
  ),
  pastors: (
    <svg className="w-[17px] h-[17px] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
    </svg>
  ),
  media: (
    <svg className="w-[17px] h-[17px] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
    </svg>
  ),
  portal: (
    <svg className="w-[17px] h-[17px] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"/>
    </svg>
  ),
  permissions: (
    <svg className="w-[17px] h-[17px] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
    </svg>
  ),
  sysadmin: (
    <svg className="w-[17px] h-[17px] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
    </svg>
  ),
  logout: (
    <svg className="w-[17px] h-[17px] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
    </svg>
  ),
};

/* ─── Spinner ────────────────────────────────────────────────── */
function Spinner() {
  return (
    <svg className="w-3.5 h-3.5 animate-spin shrink-0" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"/>
      <path className="opacity-70" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/>
    </svg>
  );
}

/* ─── Nav Items ──────────────────────────────────────────────── */
const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard',        href: '/dashboard',  flag: 'module_dashboard',    roles: ['SYSADMIN','CHURCH_ADMIN','FINANCE_ADMIN','LEADER'], icon: icons.dashboard },
  { label: 'Financeiro',       href: '/financeiro', flag: 'module_finance',      roles: ['SYSADMIN','CHURCH_ADMIN','FINANCE_ADMIN'],          icon: icons.finance   },
  { label: 'Membros',          href: '/membros',    flag: 'module_members',      roles: ['SYSADMIN','CHURCH_ADMIN','LEADER'],                  icon: icons.members   },
  { label: 'Eventos',          href: '/eventos',    flag: 'module_events',       roles: ['SYSADMIN','CHURCH_ADMIN'],                          icon: icons.events    },
  { label: 'Células',          href: '/celulas',    flag: 'module_cells',        roles: ['SYSADMIN','CHURCH_ADMIN'],                          icon: icons.cells     },
  { label: 'Líderes',          href: '/lideres',    flag: 'module_leaders',      roles: ['SYSADMIN','CHURCH_ADMIN'],                          icon: icons.leaders   },
  { label: 'Pastores',         href: '/pastores',   flag: 'module_pastors',      roles: ['SYSADMIN','CHURCH_ADMIN'],                          icon: icons.pastors   },
  { label: 'Central de Mídias',href: '/midias',     flag: 'module_media',        roles: ['SYSADMIN','CHURCH_ADMIN'],                          icon: icons.media     },
  { label: 'Site Público',     href: '/portal',     flag: 'module_public_site',  roles: ['SYSADMIN','CHURCH_ADMIN'],                          icon: icons.portal    },
  { label: 'Permissões',       href: '/permissoes', flag: 'module_permissions',  roles: ['SYSADMIN','CHURCH_ADMIN'],                          icon: icons.permissions },
];

/* ─── Avatar ─────────────────────────────────────────────────── */
function UserAvatar({ photoUrl, fullName, size = 30 }: { photoUrl: string | null; fullName: string; size?: number }) {
  const initials = fullName.trim().split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase() || '?';
  return (
    <div
      style={{ width: size, height: size, fontSize: size * 0.36 }}
      className="rounded-lg overflow-hidden bg-blue-600 flex items-center justify-center text-white font-bold shrink-0 ring-1 ring-white/10"
    >
      {photoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={photoUrl} alt={fullName} className="object-cover w-full h-full"/>
      ) : (
        <span>{initials}</span>
      )}
    </div>
  );
}

/* ─── Sidebar Content ────────────────────────────────────────── */
function SidebarContent({
  user, flags = {}, isCollapsed, onCollapse, onClose, isMobile = false,
}: {
  user: SidebarProps['user'];
  flags: Record<string, FlagResult>;
  isCollapsed: boolean;
  onCollapse: () => void;
  onClose?: () => void;
  isMobile?: boolean;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [navigatingTo, setNavigatingTo] = useState<string | null>(null);

  useEffect(() => { setNavigatingTo(null); }, [pathname]);

  const handleLogout = useCallback(async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.refresh();
  }, [router]);

  const handleNavClick = useCallback((href: string) => {
    if (pathname === href) return;
    setNavigatingTo(href);
    onClose?.();
  }, [pathname, onClose]);

  const visibleItems = NAV_ITEMS.filter(item => {
    const flagData = flags[item.flag];
    return flagData?.isAllowed;
  });

  function isActive(href: string) {
    return pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
  }

  const primaryRole = user.roles[0];
  const roleLabel = ROLE_LABELS[primaryRole] ?? primaryRole;

  return (
    <div className="flex flex-col h-full overflow-hidden">

      {/* ── Logo Header ── */}
      <div
        className={`h-14 flex items-center shrink-0 ${isCollapsed ? 'justify-center px-3' : 'px-4 gap-3'}`}
        style={{ borderBottom: '1px solid var(--admin-border)' }}
      >
        <Link
          href="/dashboard"
          onClick={() => handleNavClick('/dashboard')}
          className="flex items-center gap-2.5 group min-w-0"
        >
          <div className="w-7 h-7 shrink-0 relative">
            <Image src="/logo.svg" alt="ICRE" fill className="object-contain brightness-0 invert opacity-80"/>
          </div>
          <AnimatePresence initial={false}>
            {!isCollapsed && (
              <motion.span
                key="brand"
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.18 }}
                className="font-bold text-sm text-slate-200 tracking-wide truncate"
              >
                SIGE-Web
              </motion.span>
            )}
          </AnimatePresence>
        </Link>

        {!isMobile && !isCollapsed && (
          <button
            onClick={onCollapse}
            title="Recolher menu"
            className="ml-auto w-6 h-6 flex items-center justify-center rounded text-slate-600 hover:text-slate-300 hover:bg-white/5 transition-colors shrink-0"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"/>
            </svg>
          </button>
        )}
        {!isMobile && isCollapsed && (
          <button
            onClick={onCollapse}
            title="Expandir menu"
            className="w-6 h-6 flex items-center justify-center rounded text-slate-600 hover:text-slate-300 hover:bg-white/5 transition-colors absolute right-2"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"/>
            </svg>
          </button>
        )}
      </div>

      {/* ── Nav ── */}
      <nav className="flex-1 py-3 overflow-y-auto overflow-x-hidden px-2">

        {/* Gestão label */}
        <AnimatePresence initial={false}>
          {!isCollapsed && (
            <motion.p
              key="label-gestao"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="text-[9px] font-semibold uppercase tracking-[0.15em] mb-1.5 px-2"
              style={{ color: 'var(--admin-text-muted)' }}
            >
              Gestão
            </motion.p>
          )}
        </AnimatePresence>

        <div className="space-y-px">
          {visibleItems.map(item => {
            const active = isActive(item.href);
            const isLoading = navigatingTo === item.href;
            const flagData = flags[item.flag];

            let dynBadge: { text: string; cls: string } | null = null;
            if (flagData) {
              switch (flagData.status) {
                case 'novo':          if (!flagData.userHasViewed) dynBadge = { text: 'Novo', cls: 'bg-emerald-500/15 text-emerald-400' }; break;
                case 'antecipado':    dynBadge = { text: 'VIP',        cls: 'bg-amber-500/15 text-amber-400' }; break;
                case 'desenvolvimento': dynBadge = { text: 'Dev',      cls: 'bg-slate-500/15 text-slate-500' }; break;
                case 'manutencao':    dynBadge = { text: 'Manutenção', cls: 'bg-red-500/15 text-red-400' };    break;
                case 'inativo':       dynBadge = { text: 'Inativo',    cls: 'bg-stone-500/15 text-stone-500' }; break;
              }
            }

            const isBlocked = flagData?.status === 'manutencao' && !user.isSysAdmin;

            return (
              <div key={item.href} className="relative group/item">
                <Link
                  href={isBlocked ? '#' : item.href}
                  onClick={e => {
                    if (isBlocked) { e.preventDefault(); return; }
                    handleNavClick(item.href);
                  }}
                  title={isCollapsed ? item.label : undefined}
                  className={`
                    relative flex items-center gap-2.5 rounded-md text-[13px] font-medium transition-all duration-150
                    ${isCollapsed ? 'justify-center py-2.5 px-0' : 'px-2.5 py-2'}
                    ${active
                      ? 'text-blue-300'
                      : isBlocked
                        ? 'text-slate-600 cursor-not-allowed'
                        : 'text-slate-500 hover:text-slate-200'
                    }
                  `}
                  style={active ? { background: 'var(--admin-accent-dim)' } : {}}
                >
                  {/* Active bar */}
                  {active && (
                    <motion.span
                      layoutId="active-indicator"
                      className="absolute left-0 top-1 bottom-1 w-0.5 rounded-r-full bg-blue-500"
                      transition={{ type: 'spring', stiffness: 400, damping: 40 }}
                    />
                  )}

                  {/* Icon */}
                  <span className={`transition-colors duration-150 ${active ? 'text-blue-400' : 'text-slate-600 group-hover:text-slate-400'}`}>
                    {isLoading ? <Spinner /> : item.icon}
                  </span>

                  {/* Label */}
                  <AnimatePresence initial={false}>
                    {!isCollapsed && (
                      <motion.span
                        key="lbl"
                        initial={{ opacity: 0, width: 0 }}
                        animate={{ opacity: 1, width: 'auto' }}
                        exit={{ opacity: 0, width: 0 }}
                        transition={{ duration: 0.18 }}
                        className="truncate overflow-hidden whitespace-nowrap flex-1"
                      >
                        {item.label}
                      </motion.span>
                    )}
                  </AnimatePresence>

                  {/* Loading dots */}
                  {isLoading && !isCollapsed && (
                    <span className="ml-auto flex gap-0.5 items-center">
                      {[0,1,2].map(i => (
                        <span key={i} className="w-1 h-1 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: `${i*0.1}s`, animationDuration: '0.6s' }}/>
                      ))}
                    </span>
                  )}

                  {/* Badge */}
                  {dynBadge && !isCollapsed && !isLoading && (
                    <span className={`ml-auto text-[9px] font-bold px-1.5 py-0.5 rounded ${dynBadge.cls}`}>
                      {dynBadge.text}
                    </span>
                  )}
                </Link>

                {/* Tooltip for collapsed + maintenance */}
                {isBlocked && !isCollapsed && (
                  <span className="absolute hidden group-hover/item:block left-full ml-2 w-max bg-slate-900 border border-white/10 text-xs text-slate-300 px-2.5 py-1.5 rounded-lg z-[100] shadow-xl">
                    Módulo em Manutenção
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* SysAdmin section */}
        {user.isSysAdmin && (
          <div className="mt-4">
            <div className="my-2 mx-1" style={{ borderTop: '1px solid var(--admin-border)' }} />
            <AnimatePresence initial={false}>
              {!isCollapsed && (
                <motion.p
                  key="label-sistema"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="text-[9px] font-semibold uppercase tracking-[0.15em] mb-1.5 px-2"
                  style={{ color: 'var(--admin-text-muted)' }}
                >
                  Sistema
                </motion.p>
              )}
            </AnimatePresence>
            {(() => {
              const active = isActive('/sysadmin');
              const isLoading = navigatingTo === '/sysadmin';
              return (
                <Link
                  href="/sysadmin"
                  onClick={() => handleNavClick('/sysadmin')}
                  title={isCollapsed ? 'SysAdmin' : undefined}
                  className={`
                    relative flex items-center gap-2.5 rounded-md text-[13px] font-medium transition-all duration-150
                    ${isCollapsed ? 'justify-center py-2.5 px-0' : 'px-2.5 py-2'}
                    ${active ? 'text-blue-300' : 'text-slate-600 hover:text-slate-300'}
                  `}
                  style={active ? { background: 'var(--admin-accent-dim)' } : {}}
                >
                  {active && (
                    <motion.span
                      layoutId="active-indicator"
                      className="absolute left-0 top-1 bottom-1 w-0.5 rounded-r-full bg-blue-500"
                      transition={{ type: 'spring', stiffness: 400, damping: 40 }}
                    />
                  )}
                  <span className={`transition-colors duration-150 ${active ? 'text-blue-400' : 'text-slate-600 group-hover:text-slate-400'}`}>
                    {isLoading ? <Spinner /> : icons.sysadmin}
                  </span>
                  <AnimatePresence initial={false}>
                    {!isCollapsed && (
                      <motion.span
                        key="lbl-sa"
                        initial={{ opacity: 0, width: 0 }}
                        animate={{ opacity: 1, width: 'auto' }}
                        exit={{ opacity: 0, width: 0 }}
                        transition={{ duration: 0.18 }}
                        className="truncate overflow-hidden whitespace-nowrap flex-1"
                      >
                        SysAdmin
                      </motion.span>
                    )}
                  </AnimatePresence>
                </Link>
              );
            })()}
          </div>
        )}
      </nav>

      {/* ── Footer: User ── */}
      <div className="shrink-0 p-2" style={{ borderTop: '1px solid var(--admin-border)' }}>
        <div className={`flex items-center gap-2.5 rounded-md px-2 py-2 ${isCollapsed ? 'justify-center' : ''}`}>
          <UserAvatar photoUrl={user.photoUrl} fullName={user.fullName} size={30} />

          <AnimatePresence initial={false}>
            {!isCollapsed && (
              <motion.div
                key="user-info"
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.18 }}
                className="flex-1 min-w-0 overflow-hidden"
              >
                <p className="text-[13px] font-semibold text-slate-200 truncate leading-tight">{user.fullName}</p>
                <p className="text-[11px] truncate leading-tight" style={{ color: 'var(--admin-text-muted)' }}>{roleLabel}</p>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence initial={false}>
            {!isCollapsed && (
              <motion.button
                key="logout"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.12 }}
                onClick={async () => {
                  const supabase = createClient();
                  await supabase.auth.signOut();
                  window.location.href = '/login';
                }}
                title="Sair"
                className="p-1.5 rounded text-slate-600 hover:text-red-400 hover:bg-red-500/8 transition-colors shrink-0"
              >
                {icons.logout}
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

/* ─── Main Export ────────────────────────────────────────────── */
export function AdminSidebar({ user, flags = {}, mobileOpen = false, onMobileClose }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsMounted(true);
    const saved = localStorage.getItem('sige_sidebar_collapsed');
    if (saved) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsCollapsed(saved === 'true');
    }
  }, []);

  const handleCollapseToggle = useCallback(() => {
    setIsCollapsed(prev => {
      const next = !prev;
      localStorage.setItem('sige_sidebar_collapsed', String(next));
      return next;
    });
  }, []);

  // Realtime feature flags
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel('realtime_flags')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'feature_flags' }, () => router.refresh())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [router]);

  // Escape key (mobile)
  useEffect(() => {
    if (!mobileOpen) return;
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onMobileClose?.(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [mobileOpen, onMobileClose]);

  // Body scroll lock (mobile)
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  const sidebarStyle = { background: 'var(--admin-sidebar)' };

  return (
    <>
      {/* ── Desktop Sidebar ── */}
      <motion.aside
        variants={{
          expanded:  { width: 236, transition: { duration: 0.28, ease: [0.4, 0, 0.2, 1] } },
          collapsed: { width: 60,  transition: { duration: 0.28, ease: [0.4, 0, 0.2, 1] } },
        }}
        animate={isMounted && isCollapsed ? 'collapsed' : 'expanded'}
        className="hidden md:flex flex-col shrink-0 z-20 relative overflow-visible"
        style={{ ...sidebarStyle, borderRight: '1px solid var(--admin-border)', minWidth: isCollapsed ? 60 : 236 }}
      >
        <div className="relative z-10 flex flex-col h-full">
          <SidebarContent user={user} flags={flags} isCollapsed={isCollapsed} onCollapse={handleCollapseToggle} isMobile={false} />
        </div>
      </motion.aside>

      {/* ── Mobile Drawer ── */}
      <div className="md:hidden">
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              key="overlay"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm"
              onClick={onMobileClose}
            />
          )}
        </AnimatePresence>
        <AnimatePresence>
          {mobileOpen && (
            <motion.aside
              key="drawer"
              initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }}
              transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
              className="fixed top-0 left-0 w-64 h-full z-50 overflow-hidden"
              style={{ ...sidebarStyle, borderRight: '1px solid var(--admin-border)' }}
            >
              <SidebarContent user={user} flags={flags} isCollapsed={false} onCollapse={() => {}} onClose={onMobileClose} isMobile={true} />
            </motion.aside>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}