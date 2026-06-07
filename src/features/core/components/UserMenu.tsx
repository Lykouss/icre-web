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

function Avatar({ name, photoUrl }: { name: string; photoUrl: string | null }) {
  const initials = name.trim().split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase() || '?'
  return (
    <div className="h-8 w-8 rounded-lg overflow-hidden bg-blue-600 flex items-center justify-center text-white font-bold text-xs shrink-0 ring-1 ring-white/10">
      {photoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={photoUrl} alt={name} className="w-full h-full object-cover"/>
      ) : initials}
    </div>
  )
}

export function UserMenu({ fullName, roles, photoUrl }: UserMenuProps) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

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
        <button className="flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 hover:bg-white/5 transition-colors focus:outline-none group">
          <span className="hidden sm:block text-right">
            <p className="text-[13px] font-semibold text-slate-200 leading-tight">{fullName}</p>
            <p className="text-[11px] text-slate-600 leading-tight">{roles[0]}</p>
          </span>
          <Avatar name={fullName} photoUrl={photoUrl} />
          <svg className="w-3.5 h-3.5 text-slate-600 hidden sm:block group-hover:text-slate-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"/>
          </svg>
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={8}
          className="z-50 min-w-[200px] rounded-xl shadow-2xl shadow-black/50 py-1 animate-in fade-in-0 zoom-in-95 duration-100"
          style={{ background: 'var(--admin-surface-alt)', border: '1px solid var(--admin-border-strong)' }}
        >
          {/* User info */}
          <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--admin-border)' }}>
            <div className="flex items-center gap-2.5">
              <Avatar name={fullName} photoUrl={photoUrl} />
              <div className="min-w-0">
                <p className="text-[13px] font-semibold text-slate-200 truncate">{fullName}</p>
                <p className="text-[11px] text-slate-500 mt-0.5">{roles.join(', ')}</p>
              </div>
            </div>
          </div>

          <div className="py-1">
            <DropdownMenu.Item asChild>
              <Link
                href="/"
                target="_blank"
                className="flex items-center gap-2.5 px-4 py-2 text-[13px] text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-colors outline-none cursor-pointer"
              >
                <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
                </svg>
                Ver site público
              </Link>
            </DropdownMenu.Item>

            <DropdownMenu.Item asChild>
              <Link
                href="/sysadmin"
                className="flex items-center gap-2.5 px-4 py-2 text-[13px] text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-colors outline-none cursor-pointer"
              >
                <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                </svg>
                Meu perfil
              </Link>
            </DropdownMenu.Item>
          </div>

          <div style={{ borderTop: '1px solid var(--admin-border)' }} className="py-1">
            <DropdownMenu.Item asChild>
              <button
                onClick={handleLogout}
                disabled={isPending}
                className="w-full flex items-center gap-2.5 px-4 py-2 text-[13px] text-red-500 hover:text-red-400 hover:bg-red-500/8 transition-colors outline-none cursor-pointer disabled:opacity-50"
              >
                <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
                </svg>
                {isPending ? 'Saindo...' : 'Sair'}
              </button>
            </DropdownMenu.Item>
          </div>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}