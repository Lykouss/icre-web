'use client'

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { AppRole } from '@/features/core/api/get-current-user';
import type { FlagResult } from '@/features/core/api/get-feature-flag';
import { getPendingTicketsCount } from '@/features/support/actions/admin-support-actions';
import { getPendingFeedbackCount } from '@/features/support/actions/admin-feedback-actions';
import { RoleBadge } from '@/features/core/components/RoleBadge';


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
  icon: React.ReactNode;
}

const ROLE_LABELS: Record<string, string> = {
  SYSADMIN:      'Administrador do Sistema',
  CHURCH_ADMIN:  'Adm. da Igreja',
  FINANCE_ADMIN: 'Adm. Financeiro',
  LEADER:        'Líder',
  MEMBER:        'Membro',
  SUPPORT_ADMIN: 'Atendente de Suporte',
  EVENT_ADMIN:   'Coord. de Eventos',
  MEDIA_ADMIN:   'Gerente de Mídia',
  MEMBER_ADMIN:  'Gestor de Membros',
  REPORT_VIEWER: 'Analista',
};

const ROLE_COLORS: Record<string, string> = {
  SYSADMIN:      '#f59e0b',
  CHURCH_ADMIN:  '#3b82f6',
  FINANCE_ADMIN: '#10b981',
  LEADER:        '#8b5cf6',
  MEMBER:        '#64748b',
  SUPPORT_ADMIN: '#0ea5e9',
  EVENT_ADMIN:   '#f97316',
  MEDIA_ADMIN:   '#ec4899',
  MEMBER_ADMIN:  '#14b8a6',
  REPORT_VIEWER: '#94a3b8',
};

/* ─── SVG Icons ────────────────────────────────────────────────── */
const NavIcon = ({ d, d2 }: { d: string; d2?: string }) => (
  <svg className="w-[18px] h-[18px] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d={d} />
    {d2 && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d={d2} />}
  </svg>
);

const NAV_ICONS: Record<string, React.ReactNode> = {
  dashboard:   <NavIcon d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />,
  financeiro:  <NavIcon d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />,
  membros:     <NavIcon d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />,
  eventos:     <NavIcon d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />,
  celulas:     <NavIcon d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />,
  lideres:     <NavIcon d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />,
  pastores:    <NavIcon d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />,
  midias:      <NavIcon d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />,
  portal:      <NavIcon d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />,
  permissoes:  <NavIcon d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />,
  sysadmin:    <NavIcon d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" d2="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />,
  manutencao:  <NavIcon d="M14.752 11.168l-3.197-2.132A4 4 0 002 9.87v4.263a4 4 0 009.555.832l3.197-2.132a4.111 4.111 0 000-1.664z" d2="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />,
  suporte:     <NavIcon d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />,
};

const NAV_GROUPS = [
  {
    title: 'Visão Geral',
    items: [
      { label: 'Dashboard',        href: '/dashboard',  flag: 'module_dashboard',    icon: NAV_ICONS.dashboard  },
      { label: 'Financeiro',       href: '/financeiro', flag: 'module_finance',      icon: NAV_ICONS.financeiro },
    ]
  },
  {
    title: 'Comunidade',
    items: [
      { label: 'Membros',          href: '/membros',    flag: 'module_members',      icon: NAV_ICONS.membros    },
      { label: 'Células',          href: '/celulas',    flag: 'module_cells',        icon: NAV_ICONS.celulas    },
      { label: 'Eventos',          href: '/eventos',    flag: 'module_events',       icon: NAV_ICONS.eventos    },
    ]
  },
  {
    title: 'Liderança',
    items: [
      { label: 'Líderes',          href: '/lideres',    flag: 'module_leaders',      icon: NAV_ICONS.lideres    },
      { label: 'Pastores',         href: '/pastores',   flag: 'module_pastors',      icon: NAV_ICONS.pastores   },
    ]
  },
  {
    title: 'Comunicação',
    items: [
      { label: 'Central de Mídias',href: '/midias',     flag: 'module_media',        icon: NAV_ICONS.midias     },
      { label: 'Site Público',     href: '/portal',     flag: 'module_public_site',  icon: NAV_ICONS.portal     },
    ]
  },
  {
    title: 'Administração',
    items: [
      { label: 'Permissões',       href: '/permissoes', flag: 'module_permissions',  icon: NAV_ICONS.permissoes },
      { label: 'Suporte',          href: '/admin-suporte',   flag: '',                    icon: NAV_ICONS.suporte    },
      { label: 'Feedbacks & Bugs', href: '/admin-feedback',  flag: '',                    icon: <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/></svg> },
    ]
  }
];


/* ─── Loading Dots ─────────────────────────────────────────────── */
function LoadingDots() {
  return (
    <span className="flex items-center gap-0.5">
      {[0,1,2].map(i => (
        <span
          key={i}
          className="w-1 h-1 rounded-full bg-blue-400 animate-bounce"
          style={{ animationDelay: `${i * 0.12}s`, animationDuration: '0.7s' }}
        />
      ))}
    </span>
  );
}

/* ─── User Avatar ──────────────────────────────────────────────── */
function UserAvatar({ photoUrl, fullName, size = 34, roleColor = '#3b82f6' }: {
  photoUrl: string | null; fullName: string; size?: number; roleColor?: string;
}) {
  const initials = fullName.trim().split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase() || '?';
  return (
    <div
      className="shrink-0 overflow-hidden flex items-center justify-center text-white font-bold"
      style={{
        width: size, height: size,
        borderRadius: '10px',
        fontSize: size * 0.35,
        background: photoUrl ? 'transparent' : `linear-gradient(135deg, ${roleColor}cc, ${roleColor}66)`,
        boxShadow: `0 0 0 2px rgba(255,255,255,0.08), 0 0 0 3px ${roleColor}44`,
      }}
    >
      {photoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={photoUrl} alt={fullName} className="w-full h-full object-cover" />
      ) : initials}
    </div>
  );
}

/* ─── Sidebar Content ──────────────────────────────────────────── */
function SidebarContent({
  user, flags = {}, isCollapsed, onCollapse, onClose, isMobile = false, supportCount = 0, feedbackCount = 0
}: {
  user: SidebarProps['user'];
  flags: Record<string, FlagResult>;
  isCollapsed: boolean;
  onCollapse: () => void;
  onClose?: () => void;
  isMobile?: boolean;
  supportCount?: number;
  feedbackCount?: number;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [navigatingTo, setNavigatingTo] = useState<string | null>(null);

  useEffect(() => { setNavigatingTo(null); }, [pathname]);

  const primaryRole = user.roles[0] ?? 'MEMBER';
  const roleLabel = ROLE_LABELS[primaryRole] ?? primaryRole;
  const roleColor = ROLE_COLORS[primaryRole] ?? '#64748b';

  const visibleGroups = NAV_GROUPS.map(group => ({
    title: group.title,
    items: group.items.filter(item => !item.flag || flags[item.flag]?.isAllowed)
  })).filter(group => group.items.length > 0);

  function isActive(href: string) {
    return pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
  }

  const handleNavClick = useCallback((href: string) => {
    if (pathname === href) return;
    setNavigatingTo(href);
    onClose?.();
  }, [pathname, onClose]);

  const handleLogout = useCallback(async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.refresh();
  }, [router]);

  const shortName = user.fullName.trim().split(/\s+/).slice(0, 2).join(' ');

  return (
    <div className="flex flex-col h-full select-none relative">

      {/* ── Logo Header ─────────────────────────────────────── */}
      <div
        className="h-[60px] shrink-0 flex items-center gap-3 px-4 relative"
        style={{ borderBottom: '1px solid var(--admin-border)' }}
      >
        <Link
          href="/dashboard"
          onClick={() => handleNavClick('/dashboard')}
          className="flex items-center gap-2.5 group min-w-0 flex-1"
        >
          <div className="w-8 h-8 shrink-0 relative rounded-lg overflow-hidden flex items-center justify-center"
            style={{ background: 'rgba(37,99,235,0.15)', border: '1px solid rgba(37,99,235,0.25)' }}>
            <Image src="/logo.svg" alt="ICRE" width={20} height={20} className="object-contain brightness-0 invert" />
          </div>
          <AnimatePresence initial={false}>
            {!isCollapsed && (
              <motion.div
                key="brand"
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -6 }}
                transition={{ duration: 0.2 }}
                className="min-w-0 flex flex-col justify-center"
              >
                <div className="flex items-center gap-1.5">
                  <p className="text-sm font-bold text-slate-100 leading-tight tracking-wide truncate">SIGE-Web</p>
                  <RoleBadge role={primaryRole as AppRole} variant="icon" size="sm" />
                </div>
                <p className="text-[9px] text-slate-500 leading-tight uppercase tracking-widest mt-0.5">Sistema de Gestão</p>
              </motion.div>
            )}
          </AnimatePresence>
        </Link>

        {/* Collapse button — conditionally absolute when collapsed */}
        {!isMobile && (
          <button
            onClick={onCollapse}
            title={isCollapsed ? 'Expandir menu' : 'Recolher menu'}
            className={`flex items-center justify-center transition-all duration-150 ${
              isCollapsed
                ? 'absolute -right-3 top-4 w-6 h-6 rounded-full bg-blue-600 text-white shadow-lg border-2 border-[var(--admin-bg)] z-50 hover:bg-blue-500'
                : 'w-7 h-7 shrink-0 rounded-lg text-slate-600 hover:text-slate-300 hover:bg-white/8'
            }`}
          >
            <motion.svg
              className={isCollapsed ? "w-3 h-3" : "w-3.5 h-3.5"}
              fill="none" stroke="currentColor" viewBox="0 0 24 24"
              animate={{ rotate: isCollapsed ? 180 : 0 }}
              transition={{ duration: 0.25, ease: [0.4,0,0.2,1] }}
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"/>
            </motion.svg>
          </button>
        )}
      </div>

      {/* ── Navigation ──────────────────────────────────────── */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-3 px-2.5">

        {visibleGroups.map((group, groupIdx) => (
          <div key={group.title} className="mb-6 last:mb-0">
            {/* Group Label */}
            <AnimatePresence initial={false}>
              {!isCollapsed && (
                <motion.p
                  key={`label-${group.title}`}
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="px-2 mb-1.5 text-[9.5px] font-bold uppercase tracking-[0.18em]"
                  style={{ color: 'var(--admin-text-muted)' }}
                >
                  {group.title}
                </motion.p>
              )}
            </AnimatePresence>

            <div className="space-y-0.5">
              {group.items.map(item => {
                const active = isActive(item.href);
                const isLoading = navigatingTo === item.href;
                const flag = flags[item.flag];
                const blocked = flag?.status === 'manutencao' && !user.isSysAdmin;

                let chipText = '';
                if (item.href === '/admin-suporte' && supportCount > 0) chipText = String(supportCount);
                else if (item.href === '/admin-feedback' && feedbackCount > 0) chipText = String(feedbackCount);
                else if (flag?.status === 'novo' && !flag.userHasViewed) chipText = 'Novo';
                else if (flag?.status === 'manutencao') chipText = 'Man.';
                else if (flag?.status === 'antecipado') chipText = 'VIP';

                return (
                  <Link
                    key={item.href}
                    href={blocked ? '#' : item.href}
                    onClick={e => {
                      if (blocked) { e.preventDefault(); return; }
                      handleNavClick(item.href);
                    }}
                    title={isCollapsed ? item.label : undefined}
                    className={`
                      group/item relative flex items-center gap-2.5 rounded-xl transition-all duration-200
                      ${isCollapsed ? 'justify-center px-0 py-2.5' : 'px-3 py-2.5'}
                      ${blocked ? 'opacity-40 cursor-not-allowed' : ''}
                      ${active
                        ? 'text-blue-200'
                        : 'text-slate-500 hover:text-slate-200'
                      }
                    `}
                    style={active ? {
                      background: 'linear-gradient(135deg, rgba(37,99,235,0.18) 0%, rgba(37,99,235,0.08) 100%)',
                      boxShadow: 'inset 0 0 0 1px rgba(37,99,235,0.2)',
                    } : {}}
                  >
                    {/* Active left accent bar */}
                    {active && (
                      <motion.span
                        layoutId="nav-active-bar"
                        className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-full"
                        style={{ background: 'var(--admin-accent)', boxShadow: '0 0 8px rgba(37,99,235,0.6)' }}
                        transition={{ type: 'spring', stiffness: 500, damping: 40 }}
                      />
                    )}

                    {/* Hover glow */}
                    {!active && !blocked && (
                      <span className="absolute inset-0 rounded-xl opacity-0 group-hover/item:opacity-100 transition-opacity duration-200"
                        style={{ background: 'rgba(255,255,255,0.035)' }} />
                    )}

                    {/* Icon */}
                    <span className={`
                      relative z-10 transition-all duration-200 shrink-0
                      ${active ? 'text-blue-400 drop-shadow-[0_0_6px_rgba(96,165,250,0.6)]' : 'text-slate-600 group-hover/item:text-slate-300 group-hover/item:translate-x-0.5'}
                    `}>
                      {isLoading ? <LoadingDots /> : item.icon}
                    </span>

                    {/* Label + chip */}
                    <AnimatePresence initial={false}>
                      {!isCollapsed && (
                        <motion.div
                          key="lbl"
                          initial={{ opacity: 0, width: 0 }}
                          animate={{ opacity: 1, width: 'auto' }}
                          exit={{ opacity: 0, width: 0 }}
                          transition={{ duration: 0.2 }}
                          className="flex items-center gap-2 flex-1 min-w-0 overflow-hidden relative z-10"
                        >
                          <span className="text-[13px] font-medium truncate leading-none">{item.label}</span>
                          {chipText && (
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${
                              item.href === '/admin-suporte'   ? 'bg-red-500 text-white' :
                              item.href === '/admin-feedback'  ? 'bg-amber-500 text-white' :
                              chipText === 'Novo' ? 'bg-emerald-500/15 text-emerald-400' :
                              chipText === 'VIP'  ? 'bg-amber-500/15 text-amber-400' :
                              'bg-red-500/15 text-red-400'
                            }`}>
                              {chipText}
                            </span>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}

        {/* System group */}
        {user.isSysAdmin && (
          <>
            <div className="my-3 mx-1" style={{ borderTop: '1px solid var(--admin-border)' }} />
            <AnimatePresence initial={false}>
              {!isCollapsed && (
                <motion.p
                  key="label-sys"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="px-2 mb-1.5 text-[9.5px] font-bold uppercase tracking-[0.18em]"
                  style={{ color: 'var(--admin-text-muted)' }}
                >
                  Sistema
                </motion.p>
              )}
            </AnimatePresence>
            {[
              { label: 'SysAdmin', href: '/sysadmin', icon: NAV_ICONS.sysadmin },
              { label: 'Manutenção', href: '/manutencao', icon: NAV_ICONS.manutencao },
            ].map(item => {
              const active = isActive(item.href);
              const isLoading = navigatingTo === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => handleNavClick(item.href)}
                  title={isCollapsed ? item.label : undefined}
                  className={`
                    group/item relative flex items-center gap-2.5 rounded-xl transition-all duration-200
                    ${isCollapsed ? 'justify-center px-0 py-2.5' : 'px-3 py-2.5'}
                    ${active ? 'text-blue-200' : 'text-slate-600 hover:text-slate-300'}
                  `}
                  style={active ? {
                    background: 'linear-gradient(135deg, rgba(37,99,235,0.18) 0%, rgba(37,99,235,0.08) 100%)',
                    boxShadow: 'inset 0 0 0 1px rgba(37,99,235,0.2)',
                  } : {}}
                >
                  {active && (
                    <motion.span
                      layoutId="nav-active-bar"
                      className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-full"
                      style={{ background: 'var(--admin-accent)', boxShadow: '0 0 8px rgba(37,99,235,0.6)' }}
                      transition={{ type: 'spring', stiffness: 500, damping: 40 }}
                    />
                  )}
                  <span className={!active ? 'hover:translate-x-0.5 transition-transform' : ''}>
                    {isLoading ? <LoadingDots /> : <span className={active ? 'text-blue-400' : 'text-slate-600 group-hover/item:text-slate-400'}>{item.icon}</span>}
                  </span>
                  <AnimatePresence initial={false}>
                    {!isCollapsed && (
                      <motion.span
                        key="lbl-sys"
                        initial={{ opacity: 0, width: 0 }}
                        animate={{ opacity: 1, width: 'auto' }}
                        exit={{ opacity: 0, width: 0 }}
                        transition={{ duration: 0.2 }}
                        className="text-[13px] font-medium truncate"
                      >
                        {item.label}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </Link>
              );
            })}
          </>
        )}
      </nav>

      {/* ── User Footer ─────────────────────────────────────── */}
      <div
        className="shrink-0 p-2.5"
        style={{ borderTop: '1px solid var(--admin-border)' }}
      >
        <div className={`flex items-center gap-2.5 rounded-xl px-2.5 py-2 transition-colors hover:bg-white/5 ${isCollapsed ? 'justify-center' : ''}`}>
          <UserAvatar photoUrl={user.photoUrl} fullName={shortName} size={34} roleColor={roleColor} />

          <AnimatePresence initial={false}>
            {!isCollapsed && (
              <motion.div
                key="user-info"
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.2 }}
                className="flex-1 min-w-0 overflow-hidden flex items-center gap-1.5"
              >
                <p className="text-[13px] font-semibold text-slate-200 truncate leading-tight">{shortName}</p>
                <RoleBadge role={primaryRole as AppRole} variant="icon" size="sm" />
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence initial={false}>
            {!isCollapsed && (
              <motion.button
                key="logout-btn"
                initial={{ opacity: 0, scale: 0.7 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.7 }}
                transition={{ duration: 0.15 }}
                onClick={handleLogout}
                title="Sair"
                className="p-1.5 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-all duration-150 shrink-0"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
                </svg>
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

/* ─── Main Export ──────────────────────────────────────────────── */
export function AdminSidebar({ user, flags = {}, mobileOpen = false, onMobileClose }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [supportCount, setSupportCount] = useState(0);
  const [feedbackCount, setFeedbackCount] = useState(0);
  
  const [hiddenSupportCount, setHiddenSupportCount] = useState(0);
  const [hiddenFeedbackCount, setHiddenFeedbackCount] = useState(0);

  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (pathname === '/admin-suporte') setHiddenSupportCount(supportCount);
    else if (supportCount < hiddenSupportCount) setHiddenSupportCount(supportCount);
  }, [pathname, supportCount, hiddenSupportCount]);

  useEffect(() => {
    if (pathname === '/admin-feedback') setHiddenFeedbackCount(feedbackCount);
    else if (feedbackCount < hiddenFeedbackCount) setHiddenFeedbackCount(feedbackCount);
  }, [pathname, feedbackCount, hiddenFeedbackCount]);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem('sige_sidebar_v2_collapsed');
    if (saved === 'true') setIsCollapsed(true);
  }, []);

  const handleCollapseToggle = useCallback(() => {
    setIsCollapsed(prev => {
      localStorage.setItem('sige_sidebar_v2_collapsed', String(!prev));
      return !prev;
    });
  }, []);

  // Realtime flags and support tickets
  useEffect(() => {
    const supabase = createClient();
    
    // Fetch initial count
    let isSubscribed = true;
    async function fetchSupportCount() {
      const cnt = await getPendingTicketsCount();
      if (isSubscribed) setSupportCount(cnt);
    }
    async function fetchFeedbackCount() {
      const cnt = await getPendingFeedbackCount();
      if (isSubscribed) setFeedbackCount(cnt);
    }
    fetchSupportCount();
    fetchFeedbackCount();

    const chFlags = supabase
      .channel('rt_flags_sidebar')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'feature_flags' }, () => router.refresh())
      .subscribe();
      
    const chTickets = supabase
      .channel('rt_tickets_sidebar')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'support_tickets' }, () => {
        fetchSupportCount();
      })
      .subscribe();

    const chFeedback = supabase
      .channel('rt_feedback_sidebar')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'feedback' }, () => {
        fetchFeedbackCount();
      })
      .subscribe();

    return () => { 
      isSubscribed = false;
      supabase.removeChannel(chFlags); 
      supabase.removeChannel(chTickets);
      supabase.removeChannel(chFeedback);
    };
  }, [router]);

  // Escape key on mobile
  useEffect(() => {
    if (!mobileOpen) return;
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onMobileClose?.(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [mobileOpen, onMobileClose]);

  // Scroll lock
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  const sidebarBg: React.CSSProperties = {
    background: 'var(--admin-sidebar)',
  };

  const displaySupportCount = Math.max(0, supportCount - hiddenSupportCount);
  const displayFeedbackCount = Math.max(0, feedbackCount - hiddenFeedbackCount);

  return (
    <>
      {/* ── Desktop ── */}
      <motion.aside
        animate={mounted && isCollapsed ? 'collapsed' : 'expanded'}
        variants={{
          expanded:  { width: 240, transition: { duration: 0.28, ease: [0.4, 0, 0.2, 1] } },
          collapsed: { width: 64,  transition: { duration: 0.28, ease: [0.4, 0, 0.2, 1] } },
        }}
        className="hidden md:flex flex-col shrink-0 z-40 relative overflow-visible h-full rounded-tr-3xl rounded-br-3xl shadow-[4px_0_24px_rgba(0,0,0,0.6)] border-r border-[var(--admin-border)]"
        style={sidebarBg}
      >
        <SidebarContent
          user={user}
          flags={flags}
          isCollapsed={mounted ? isCollapsed : false}
          onCollapse={handleCollapseToggle}
          isMobile={false}
          supportCount={displaySupportCount}
          feedbackCount={displayFeedbackCount}
        />
      </motion.aside>

      {/* ── Mobile Overlay ── */}
      <div className="md:hidden">
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              key="overlay"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 bg-black/75 backdrop-blur-sm"
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
              className="fixed top-0 left-0 w-64 h-full z-50 flex flex-col"
              style={sidebarBg}
            >
              <SidebarContent
                user={user}
                flags={flags}
                isCollapsed={false}
                onCollapse={() => {}}
                onClose={onMobileClose}
                isMobile={true}
                supportCount={displaySupportCount}
                feedbackCount={displayFeedbackCount}
              />
            </motion.aside>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}