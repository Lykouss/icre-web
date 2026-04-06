'use client'

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { AppRole } from '@/features/core/api/get-current-user';
import type { FlagResult } from '@/features/core/api/get-feature-flag';

/* ─── Types ─────────────────────────────────────────────────────── */

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

/* ─── Role Labels ─────────────────────────────────────────────────── */

const ROLE_LABELS: Record<string, string> = {
  SYSADMIN:     'Administrador do Sistema',
  CHURCH_ADMIN: 'Administrador da Igreja',
  FINANCE_ADMIN:'Administrador Financeiro',
  LEADER:       'Líder',
  MEMBER:       'Membro',
};

/* ─── Icons ──────────────────────────────────────────────────────── */

const icons = {
  dashboard: (
    <svg className="w-[18px] h-[18px] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
    </svg>
  ),
  finance: (
    <svg className="w-[18px] h-[18px] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  members: (
    <svg className="w-[18px] h-[18px] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  events: (
    <svg className="w-[18px] h-[18px] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
  portal: (
    <svg className="w-[18px] h-[18px] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
    </svg>
  ),
  permissions: (
    <svg className="w-[18px] h-[18px] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  ),
  sysadmin: (
    <svg className="w-[18px] h-[18px] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  logout: (
    <svg className="w-[18px] h-[18px] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
  ),
};

/* ─── Spinner ─────────────────────────────────────────────────────── */

function Spinner() {
  return (
    <svg className="w-3.5 h-3.5 animate-spin shrink-0" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
      <path className="opacity-80" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
  );
}

/* ─── Nav Items ──────────────────────────────────────────────────── */

const NAV_ITEMS: NavItem[] = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    flag: 'module_dashboard',
    roles: ['SYSADMIN', 'CHURCH_ADMIN', 'FINANCE_ADMIN', 'LEADER'],
    icon: icons.dashboard,
  },
  {
    label: 'Financeiro',
    href: '/financeiro',
    flag: 'module_finance',
    roles: ['SYSADMIN', 'CHURCH_ADMIN', 'FINANCE_ADMIN'],
    icon: icons.finance,
  },
  {
    label: 'Membros',
    href: '/membros',
    flag: 'module_members',
    roles: ['SYSADMIN', 'CHURCH_ADMIN', 'LEADER'],
    icon: icons.members,
  },
  {
    label: 'Eventos',
    href: '/eventos',
    flag: 'module_events',
    roles: ['SYSADMIN', 'CHURCH_ADMIN'],
    icon: icons.events,
  },
  {
    label: 'Células',
    href: '/celulas',
    flag: 'module_cells',
    roles: ['SYSADMIN', 'CHURCH_ADMIN'],
    icon: (
      <svg className="w-[18px] h-[18px] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    label: 'Liderança',
    href: '/pastores',
    flag: 'module_pastors',
    roles: ['SYSADMIN', 'CHURCH_ADMIN'],
    icon: (
      <svg className="w-[18px] h-[18px] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
  },
  {
    label: 'Site Público',
    href: '/portal',
    flag: 'module_public_site',
    roles: ['SYSADMIN', 'CHURCH_ADMIN'],
    icon: icons.portal,
  },
  {
    label: 'Permissões',
    href: '/permissoes',
    flag: 'module_permissions',
    roles: ['SYSADMIN', 'CHURCH_ADMIN'],
    icon: icons.permissions,
  },
];

/* ─── Avatar ─────────────────────────────────────────────────────── */

function UserAvatar({ photoUrl, fullName, size = 36 }: { photoUrl: string | null; fullName: string; size?: number }) {
  const initials = fullName.trim().split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase() || '?';

  return (
    <div
      style={{ width: size, height: size }}
      className="rounded-full overflow-hidden bg-blue-700 flex items-center justify-center text-white font-bold shrink-0 ring-2 ring-blue-400/20"
    >
      {photoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={photoUrl} alt={fullName || 'Avatar'} className="object-cover w-full h-full" />
      ) : (
        <span style={{ fontSize: size * 0.36 }}>{initials}</span>
      )}
    </div>
  );
}

/* ─── Collapse Toggle Button ─────────────────────────────────────── */

function CollapseButton({ isCollapsed, onClick }: { isCollapsed: boolean; onClick: () => void }) {
  return (
    <motion.button
      onClick={onClick}
      title={isCollapsed ? 'Expandir menu' : 'Recolher menu'}
      whileHover={{ scale: 1.06, x: 2 }}
      whileTap={{ scale: 0.94 }}
      className="
        ml-auto z-20 
        w-8 h-8 rounded-full
        bg-white/5 border border-white/10
        flex items-center justify-center shrink-0
        text-slate-400 hover:text-white
        hover:border-blue-500/50 hover:bg-blue-900/40
        transition-all duration-200
        cursor-pointer
      "
    >
      <motion.svg
        animate={{ rotate: isCollapsed ? 180 : 0 }}
        transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
        className="w-4 h-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
      </motion.svg>
    </motion.button>
  );
}

/* ─── Sidebar Inner Content ──────────────────────────────────────── */

function SidebarContent({
  user,
  flags = {},
  isCollapsed,
  onCollapse,
  onClose,
  isMobile = false,
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

  // Limpa o loading quando a rota muda
  useEffect(() => {
    setNavigatingTo(null);
  }, [pathname]);

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
    if (!flagData || !flagData.isAllowed) return false;
    return true;
  });

  function isActive(href: string) {
    return pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
  }

  const primaryRole = user.roles[0];
  const roleLabel = ROLE_LABELS[primaryRole] ?? primaryRole;

  return (
    <div className="flex flex-col h-full overflow-hidden">

      {/* ── Logo Header ── */}
      <div className="relative h-16 flex items-center shrink-0 px-4 border-b border-white/5">
        <Link
          href="/dashboard"
          onClick={() => handleNavClick('/dashboard')}
          className="flex items-center gap-3 min-w-0 group"
        >
          <div className="relative w-8 h-8 shrink-0 transition-transform group-hover:scale-110 duration-200">
            <Image src="/logo.svg" alt="Logo ICRE" fill className="object-contain brightness-0 invert opacity-90" />
          </div>
          <AnimatePresence initial={false}>
            {!isCollapsed && (
              <motion.span
                key="brand"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
                className="font-bold text-[15px] text-white tracking-wide truncate"
              >
                SIGE-Web
              </motion.span>
            )}
          </AnimatePresence>
        </Link>

        {/* Collapse toggle — desktop only */}
        {!isMobile && (
          <CollapseButton isCollapsed={isCollapsed} onClick={onCollapse} />
        )}
      </div>

      {/* ── Nav ── */}
      <nav className="flex-1 py-4 overflow-y-auto overflow-x-hidden" style={{ scrollbarWidth: 'thin', scrollbarColor: '#1e3a5f transparent' }}>

        {/* Gestão section label */}
        <AnimatePresence initial={false}>
          {!isCollapsed && (
            <motion.p
              key="label-gestao"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="text-[10px] font-semibold text-blue-400/40 uppercase tracking-widest mb-2 px-5"
            >
              Gestão
            </motion.p>
          )}
        </AnimatePresence>

        <div className="space-y-0.5 px-2">
          {visibleItems.map(item => {
            const active = isActive(item.href);
            const isLoading = navigatingTo === item.href;
            
            const flagData = flags[item.flag];
            let dynamicBadge: { text: string; bg: string; textCol: string } | null = null;
            if (flagData) {
              switch (flagData.status) {
                case 'novo':
                  // Only show "Novo" badge if the user hasn't visited yet
                  if (!flagData.userHasViewed) {
                    dynamicBadge = { text: 'Novo', bg: 'bg-emerald-500/20', textCol: 'text-emerald-400' };
                  }
                  break;
                case 'antecipado': dynamicBadge = { text: '★ VIP', bg: 'bg-amber-500/20', textCol: 'text-amber-400' }; break;
                case 'desenvolvimento': dynamicBadge = { text: 'Dev', bg: 'bg-slate-500/20', textCol: 'text-slate-400' }; break;
                case 'manutencao': dynamicBadge = { text: 'Manutenção', bg: 'bg-red-500/20', textCol: 'text-red-400' }; break;
                case 'inativo': dynamicBadge = { text: 'Inativo', bg: 'bg-stone-500/20', textCol: 'text-stone-400' }; break;
                case 'indisponivel': dynamicBadge = { text: 'Fim', bg: 'bg-orange-500/20', textCol: 'text-orange-400' }; break;
                case 'movido': dynamicBadge = { text: 'Movido', bg: 'bg-indigo-500/20', textCol: 'text-indigo-400' }; break;
              }
            }
            const fallbackBadge = item.badge ? { text: item.badge, bg: 'bg-blue-500/20', textCol: 'text-blue-300' } : null;
            const FinalBadge = dynamicBadge || fallbackBadge;

            const isMaintenanceBlocked = flagData?.status === 'manutencao' && !user.isSysAdmin;
            
            return (
              <div key={item.href} className="relative group/link">
                <Link
                  href={isMaintenanceBlocked ? '#' : item.href}
                  onClick={(e) => {
                    if (isMaintenanceBlocked) {
                      e.preventDefault();
                      return;
                    }
                    handleNavClick(item.href);
                  }}
                  title={isCollapsed ? item.label : undefined}
                  className={`relative flex items-center gap-3 rounded-xl text-sm font-medium transition-all duration-150 group
                    ${isCollapsed ? 'justify-center px-0 py-3' : 'px-4 py-3'}
                    ${active
                      ? 'bg-blue-500/10 text-blue-300 shadow-[inset_0_0_0_1px_rgba(59,130,246,0.2)]'
                      : isMaintenanceBlocked 
                        ? 'text-slate-500 opacity-70 cursor-not-allowed hover:bg-transparent hover:text-slate-500'
                        : 'text-slate-300 hover:bg-white/5 hover:text-white'
                    }`}
                >
                {/* Active left border */}
                {active && (
                  <motion.span
                    layoutId="active-pill"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 rounded-r-full bg-blue-400"
                    transition={{ type: 'spring', stiffness: 320, damping: 36 }}
                  />
                )}

                {/* Icon or spinner */}
                <span className={`transition-all duration-150 ${active ? 'text-blue-400' : 'text-slate-400 group-hover:text-slate-200 group-hover:scale-110'}`}>
                  {isLoading ? <Spinner /> : item.icon}
                </span>

                {/* Label */}
                <AnimatePresence initial={false}>
                  {!isCollapsed && (
                    <motion.span
                      key="label"
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: 'auto' }}
                      exit={{ opacity: 0, width: 0 }}
                      transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
                      className="truncate overflow-hidden whitespace-nowrap flex-1"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>

                {/* Loading dots when navigating */}
                {isLoading && !isCollapsed && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="ml-auto flex gap-0.5 items-center"
                  >
                    {[0, 1, 2].map(i => (
                      <span
                        key={i}
                        className="w-1 h-1 rounded-full bg-blue-400 animate-bounce"
                        style={{ animationDelay: `${i * 0.12}s`, animationDuration: '0.7s' }}
                      />
                    ))}
                  </motion.span>
                )}

                {/* Badge (ex: "Novo", "Beta") */}
                {FinalBadge && !isCollapsed && !isLoading && (
                  <span className={`ml-auto text-[9px] font-bold px-1.5 py-0.5 rounded-full ${FinalBadge.bg} ${FinalBadge.textCol}`}>
                    {FinalBadge.text}
                  </span>
                )}
                </Link>
                {isMaintenanceBlocked && !isCollapsed && (
                   <span className="absolute hidden group-hover/link:block left-full ml-2 w-max bg-slate-800 text-xs text-white p-2 rounded z-[100] shadow-xl">
                     Módulo em Manutenção
                   </span>
                )}
              </div>
            );
          })}
        </div>

        {/* SysAdmin section */}
        {user.isSysAdmin && (
          <div className="mt-5">
            {isCollapsed ? (
              <div className="mx-2 border-t border-white/5 mb-3" />
            ) : (
              <AnimatePresence initial={false}>
                <motion.p
                  key="label-sistema"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="text-[10px] font-semibold text-blue-400/40 uppercase tracking-widest mb-2 px-5"
                >
                  Sistema
                </motion.p>
              </AnimatePresence>
            )}
            <div className="px-2">
              {(() => {
                const active = isActive('/sysadmin');
                const isLoading = navigatingTo === '/sysadmin';
                return (
                  <Link
                    href="/sysadmin"
                    onClick={() => handleNavClick('/sysadmin')}
                    title={isCollapsed ? 'SysAdmin' : undefined}
                    className={`relative flex items-center gap-3 rounded-xl text-sm font-medium transition-all duration-150 group
                      ${isCollapsed ? 'justify-center px-0 py-3' : 'px-3 py-2.5'}
                      ${active ? 'bg-blue-500/15 text-blue-300' : 'text-slate-300 hover:bg-white/5 hover:text-white'}`}
                  >
                    {active && (
                      <motion.span
                        layoutId="active-pill"
                        className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-full bg-blue-400"
                        transition={{ type: 'spring', stiffness: 320, damping: 36 }}
                      />
                    )}
                    <span className={`transition-all duration-150 ${active ? 'text-blue-400' : 'text-slate-500 group-hover:text-slate-300 group-hover:scale-110'}`}>
                      {isLoading ? <Spinner /> : icons.sysadmin}
                    </span>
                    <AnimatePresence initial={false}>
                      {!isCollapsed && (
                        <motion.span
                          key="label-sa"
                          initial={{ opacity: 0, width: 0 }}
                          animate={{ opacity: 1, width: 'auto' }}
                          exit={{ opacity: 0, width: 0 }}
                          transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
                          className="truncate overflow-hidden whitespace-nowrap flex-1"
                        >
                          SysAdmin
                        </motion.span>
                      )}
                    </AnimatePresence>
                    {isLoading && !isCollapsed && (
                      <motion.span
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="ml-auto flex gap-0.5 items-center"
                      >
                        {[0, 1, 2].map(i => (
                          <span
                            key={i}
                            className="w-1 h-1 rounded-full bg-blue-400 animate-bounce"
                            style={{ animationDelay: `${i * 0.12}s`, animationDuration: '0.7s' }}
                          />
                        ))}
                      </motion.span>
                    )}
                  </Link>
                );
              })()}
            </div>
          </div>
        )}
      </nav>

      {/* ── Fade gradient antes do footer ── */}
      <div className="h-4 shrink-0 bg-gradient-to-t from-[#060d1b] to-transparent -mt-4 pointer-events-none" />

      {/* ── Footer: User + Logout ── */}
      <div className="border-t border-white/5 p-2.5 shrink-0">
        <div className={`flex items-center rounded-xl py-2 px-2 gap-3 ${isCollapsed ? 'justify-center' : ''}`}>
          <UserAvatar photoUrl={user.photoUrl} fullName={user.fullName} size={34} />

          <AnimatePresence initial={false}>
            {!isCollapsed && (
              <motion.div
                key="user-info"
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
                className="flex-1 min-w-0 overflow-hidden"
              >
                <p className="text-sm font-semibold text-white truncate leading-tight">{user.fullName}</p>
                <p className="text-[11px] text-blue-300/60 truncate leading-tight">{roleLabel}</p>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence initial={false}>
            {!isCollapsed && (
              <motion.button
                key="logout-btn"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.15 }}
                onClick={handleLogout}
                title="Sair"
                className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors shrink-0"
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

/* ─── Main Export ────────────────────────────────────────────────── */

export function AdminSidebar({ user, flags = {}, mobileOpen = false, onMobileClose }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const router = useRouter();

  // Realtime feature flags listener
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

  // Close on Escape (mobile)
  useEffect(() => {
    if (!mobileOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onMobileClose?.();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [mobileOpen, onMobileClose]);

  // Body scroll lock (mobile)
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  // The sidebar background palette matches the portal's hero dark gradient
  const sidebarBg = 'bg-[#060d1b]';

  return (
    <>
      {/* ─────────────────── DESKTOP SIDEBAR ─────────────────── */}
      <motion.aside
        variants={{
          expanded:  { width: 240, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] } },
          collapsed: { width: 72,  transition: { duration: 0.36, ease: [0.4, 0, 0.2, 1]  } },
        }}
        animate={isCollapsed ? 'collapsed' : 'expanded'}
        className={`
          hidden md:flex flex-col shrink-0 z-20 relative overflow-visible
          ${sidebarBg}
          rounded-r-3xl
          shadow-[6px_0_40px_rgba(0,0,0,0.7),_2px_0_0_rgba(59,130,246,0.07)]
          border-r border-blue-900/30
        `}
        style={{ minWidth: isCollapsed ? 72 : 240 }}
      >
        {/* Ambient glows */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-r-3xl">
          <div className="absolute top-0 left-0 right-0 h-64 bg-gradient-to-b from-blue-600/10 via-blue-800/5 to-transparent" />
          <div className="absolute top-1/3 left-0 right-0 h-40 bg-gradient-to-b from-transparent via-indigo-900/5 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-blue-950/50 to-transparent" />
          {/* Right edge glow for depth */}
          <div className="absolute inset-y-0 right-0 w-px bg-gradient-to-b from-transparent via-blue-500/20 to-transparent" />
        </div>

        <div className="relative z-10 flex flex-col h-full">
          <SidebarContent
            user={user}
            flags={flags}
            isCollapsed={isCollapsed}
            onCollapse={() => setIsCollapsed(c => !c)}
            isMobile={false}
          />
        </div>
      </motion.aside>

      {/* ─────────────────── MOBILE DRAWER ─────────────────── */}
      <div className="md:hidden">
        {/* Overlay */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              key="overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="fixed inset-0 z-40 bg-black/65 backdrop-blur-sm"
              onClick={onMobileClose}
            />
          )}
        </AnimatePresence>

        {/* Drawer */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.aside
              key="drawer"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
              className={`
                fixed top-0 left-0 w-72 h-full z-50
                ${sidebarBg}
                rounded-r-3xl
                shadow-[4px_0_40px_rgba(0,0,0,0.6)]
                border-r border-white/5
                overflow-hidden
              `}
            >
              {/* Ambient glow */}
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-0 left-0 right-0 h-48 bg-gradient-to-b from-blue-600/6 to-transparent" />
              </div>
              <div className="relative z-10 h-full">
                <SidebarContent
                  user={user}
                  flags={flags}
                  isCollapsed={false}
                  onCollapse={() => {}}
                  onClose={onMobileClose}
                  isMobile={true}
                />
              </div>
            </motion.aside>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}