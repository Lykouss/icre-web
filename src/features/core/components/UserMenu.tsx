'use client'

import React, { useTransition } from 'react'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { RoleBadge, ROLE_BADGE_CONFIG } from '@/features/core/components/RoleBadge'
import type { AppRole } from '@/features/core/api/get-current-user'

interface UserMenuProps {
  fullName: string
  roles: string[]
  photoUrl: string | null
}

function Avatar({ name, photoUrl, roleColor = '#3b82f6' }: { name: string; photoUrl: string | null; roleColor?: string }) {
  const initials = name.trim().split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase() || '?'
  return (
    <div
      className="h-8 w-8 overflow-hidden flex items-center justify-center text-white font-bold text-[11px] shrink-0 transition-transform duration-200 group-hover:scale-105"
      style={{
        borderRadius: '9px',
        background: photoUrl ? 'transparent' : `linear-gradient(135deg, ${roleColor}cc, ${roleColor}66)`,
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
  const primaryRole = (roles[0] as AppRole) ?? 'MEMBER'
  const roleColor = ROLE_BADGE_CONFIG[primaryRole]?.color ?? '#64748b'

  const handleLogout = () => {
    startTransition(async () => {
      const supabase = createClient()
      await supabase.auth.signOut()
      router.refresh()
    })
  }

  const menuItemClass = "flex items-center gap-3 px-3 py-2.5 mx-1.5 my-0.5 rounded-xl text-[13px] font-medium transition-all outline-none cursor-pointer text-slate-300 focus:bg-white/10 focus:text-white"
  const menuIconClass = "w-4 h-4 shrink-0 text-slate-400 group-focus:text-slate-200"

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button className="flex items-center gap-2.5 rounded-xl px-2.5 py-1.5 transition-all focus:outline-none group hover:bg-white/5 data-[state=open]:bg-white/5">
          <span className="hidden sm:block text-right">
            <p className="text-[13px] font-semibold leading-tight mb-1 text-slate-200">{fullName}</p>
            <div className="flex justify-end"><RoleBadge role={primaryRole} variant="chip" size="sm" /></div>
          </span>
          <Avatar name={fullName} photoUrl={photoUrl} roleColor={roleColor} />
          <svg className="w-3 h-3 hidden sm:block transition-transform duration-200 group-data-[state=open]:rotate-180 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7"/>
          </svg>
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={12}
          className="z-50 w-64 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in-0 zoom-in-95 duration-200 data-[side=bottom]:slide-in-from-top-2"
          style={{ 
            background: 'rgba(15, 23, 42, 0.85)', 
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(255,255,255,0.1)',
            boxShadow: '0 20px 40px -10px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05) inset'
          }}
        >
          {/* User info header */}
          <div className="px-4 py-4 mb-1" style={{ background: 'linear-gradient(to bottom, rgba(255,255,255,0.03), transparent)' }}>
            <div className="flex items-center gap-3.5">
              <Avatar name={fullName} photoUrl={photoUrl} roleColor={roleColor} />
              <div className="min-w-0 flex-1">
                <p className="text-[14px] font-bold text-white truncate leading-tight mb-1.5">{fullName}</p>
                <RoleBadge role={primaryRole} variant="chip" size="sm" className="bg-slate-900/50" />
              </div>
            </div>
          </div>

          <div className="h-px bg-white/5 mx-3 mb-1" />

          {/* Menu items */}
          <div className="py-1">
            <DropdownMenu.Item asChild>
              <Link href="/" target="_blank" className={`group ${menuItemClass}`}>
                <svg className={menuIconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"/>
                </svg>
                Ver site público
              </Link>
            </DropdownMenu.Item>

            <DropdownMenu.Item asChild>
              <Link href="/sysadmin" className={`group ${menuItemClass}`}>
                <svg className={menuIconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                </svg>
                Meu perfil
              </Link>
            </DropdownMenu.Item>
          </div>

          <div className="h-px bg-white/5 mx-3 my-1" />

          {/* Support items */}
          <div className="py-1">
            <DropdownMenu.Item asChild>
              <Link href="/ajuda" target="_blank" className={`group ${menuItemClass}`}>
                <svg className={menuIconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
                </svg>
                Ajuda e Guias
              </Link>
            </DropdownMenu.Item>

            <DropdownMenu.Item asChild>
              <Link href="/suporte" target="_blank" className={`group ${menuItemClass}`}>
                <svg className={menuIconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z"/>
                </svg>
                Suporte Técnico
              </Link>
            </DropdownMenu.Item>

            <DropdownMenu.Item asChild>
              <Link href="/feedback" target="_blank" className={`group ${menuItemClass}`}>
                <svg className={menuIconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"/>
                </svg>
                Sugerir ou Relatar
              </Link>
            </DropdownMenu.Item>
          </div>

          <div className="h-px bg-white/5 mx-3 my-1" />

          {/* Logout */}
          <div className="py-1 pb-1.5">
            <DropdownMenu.Item asChild>
              <button
                onClick={handleLogout}
                disabled={isPending}
                className="group flex w-full items-center gap-3 px-3 py-2.5 mx-1.5 my-0.5 rounded-xl text-[13px] font-bold transition-all outline-none cursor-pointer text-red-400 focus:bg-red-500/10 focus:text-red-300 disabled:opacity-50"
              >
                <svg className="w-4 h-4 shrink-0 text-red-500/80 group-focus:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
                </svg>
                {isPending ? 'Saindo…' : 'Sair da conta'}
              </button>
            </DropdownMenu.Item>
          </div>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}