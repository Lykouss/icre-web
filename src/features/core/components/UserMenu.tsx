'use client'

import React, { useTransition } from 'react'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface UserMenuProps {
  fullName: string
  roles: string[]
  photoUrl: string | null
}

const ROLE_LABELS: Record<string, string> = {
  SYSADMIN:     'Administrador do Sistema',
  CHURCH_ADMIN: 'Adm. da Igreja',
  FINANCE_ADMIN:'Adm. Financeiro',
  LEADER:       'Líder',
  MEMBER:       'Membro',
};

const ROLE_COLORS: Record<string, string> = {
  SYSADMIN:     '#f59e0b',
  CHURCH_ADMIN: '#3b82f6',
  FINANCE_ADMIN:'#10b981',
  LEADER:       '#8b5cf6',
  MEMBER:       '#64748b',
};

function Avatar({ name, photoUrl, roleColor = '#3b82f6' }: { name: string; photoUrl: string | null; roleColor?: string }) {
  const initials = name.trim().split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase() || '?'
  return (
    <div
      className="h-8 w-8 overflow-hidden flex items-center justify-center text-white font-bold text-[11px] shrink-0"
      style={{
        borderRadius: '9px',
        background: photoUrl ? 'transparent' : `linear-gradient(135deg, ${roleColor}bb, ${roleColor}66)`,
        boxShadow: `0 0 0 1.5px rgba(255,255,255,0.08), 0 0 0 2.5px ${roleColor}33`,
      }}
    >
      {photoUrl
        // eslint-disable-next-line @next/next/no-img-element
        ? <img src={photoUrl} alt={name} className="w-full h-full object-cover" />
        : initials}
    </div>
  )
}

export function UserMenu({ fullName, roles, photoUrl }: UserMenuProps) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()
  const primaryRole = roles[0] ?? 'MEMBER'
  const roleLabel = ROLE_LABELS[primaryRole] ?? primaryRole
  const roleColor = ROLE_COLORS[primaryRole] ?? '#64748b'

  const handleLogout = () => {
    startTransition(async () => {
      const supabase = createClient()
      await supabase.auth.signOut()
      router.refresh()
    })
  }

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button className="flex items-center gap-2.5 rounded-xl px-2.5 py-1.5 transition-all focus:outline-none group"
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
        >
          <span className="hidden sm:block text-right">
            <p className="text-[13px] font-semibold leading-tight" style={{ color: 'var(--admin-text-primary)' }}>{fullName}</p>
            <p className="text-[10px] leading-tight font-medium" style={{ color: roleColor }}>{roleLabel}</p>
          </span>
          <Avatar name={fullName} photoUrl={photoUrl} roleColor={roleColor} />
          <svg className="w-3 h-3 hidden sm:block transition-transform group-data-[state=open]:rotate-180" style={{ color: 'var(--admin-text-muted)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"/>
          </svg>
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={8}
          className="z-50 min-w-[220px] rounded-2xl shadow-2xl shadow-black/60 overflow-hidden animate-in fade-in-0 zoom-in-95 duration-150"
          style={{ background: 'var(--admin-surface)', border: '1px solid var(--admin-border-strong)' }}
        >
          {/* User info header */}
          <div className="px-4 py-3.5" style={{ borderBottom: '1px solid var(--admin-border)' }}>
            <div className="flex items-center gap-3">
              <Avatar name={fullName} photoUrl={photoUrl} roleColor={roleColor} />
              <div className="min-w-0">
                <p className="text-[13px] font-semibold text-slate-100 truncate leading-tight">{fullName}</p>
                <p className="text-[10px] font-semibold mt-0.5" style={{ color: roleColor }}>{roleLabel}</p>
              </div>
            </div>
          </div>

          {/* Menu items */}
          <div className="py-1.5">
            <DropdownMenu.Item asChild>
              <Link
                href="/"
                target="_blank"
                className="flex items-center gap-2.5 px-4 py-2.5 text-[13px] transition-all outline-none cursor-pointer"
                style={{ color: 'var(--admin-text-secondary)' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = 'var(--admin-text-primary)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--admin-text-secondary)'; }}
              >
                <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"/>
                </svg>
                Ver site público
              </Link>
            </DropdownMenu.Item>

            <DropdownMenu.Item asChild>
              <Link
                href="/sysadmin"
                className="flex items-center gap-2.5 px-4 py-2.5 text-[13px] transition-all outline-none cursor-pointer"
                style={{ color: 'var(--admin-text-secondary)' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = 'var(--admin-text-primary)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--admin-text-secondary)'; }}
              >
                <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                </svg>
                Meu perfil
              </Link>
            </DropdownMenu.Item>
          </div>

          {/* Support items */}
          <div className="py-1.5" style={{ borderTop: '1px solid var(--admin-border)' }}>
            <DropdownMenu.Item asChild>
              <Link
                href="/ajuda"
                target="_blank"
                className="flex items-center gap-2.5 px-4 py-2.5 text-[13px] transition-all outline-none cursor-pointer"
                style={{ color: 'var(--admin-text-secondary)' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = 'var(--admin-text-primary)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--admin-text-secondary)'; }}
              >
                <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
                </svg>
                Ajuda e Guias
              </Link>
            </DropdownMenu.Item>

            <DropdownMenu.Item asChild>
              <Link
                href="/suporte"
                target="_blank"
                className="flex items-center gap-2.5 px-4 py-2.5 text-[13px] transition-all outline-none cursor-pointer"
                style={{ color: 'var(--admin-text-secondary)' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = 'var(--admin-text-primary)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--admin-text-secondary)'; }}
              >
                <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z"/>
                </svg>
                Suporte Técnico
              </Link>
            </DropdownMenu.Item>

            <DropdownMenu.Item asChild>
              <Link
                href="/feedback"
                target="_blank"
                className="flex items-center gap-2.5 px-4 py-2.5 text-[13px] transition-all outline-none cursor-pointer"
                style={{ color: 'var(--admin-text-secondary)' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = 'var(--admin-text-primary)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--admin-text-secondary)'; }}
              >
                <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"/>
                </svg>
                Sugerir ou Relatar
              </Link>
            </DropdownMenu.Item>
          </div>

          <div className="py-1.5" style={{ borderTop: '1px solid var(--admin-border)' }}>
            <DropdownMenu.Item asChild>
              <button
                onClick={handleLogout}
                disabled={isPending}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-[13px] transition-all outline-none cursor-pointer disabled:opacity-50"
                style={{ color: '#f87171' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
              >
                <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
                </svg>
                {isPending ? 'Saindo…' : 'Sair'}
              </button>
            </DropdownMenu.Item>
          </div>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}