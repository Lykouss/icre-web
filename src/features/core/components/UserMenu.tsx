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
  const initials =
    name.trim().split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase() || '?'

  return (
    <div className="h-8 w-8 rounded-full overflow-hidden bg-slate-900 flex items-center justify-center text-white font-bold text-sm shadow-sm shrink-0">
      {photoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={photoUrl} alt={name} className="w-full h-full object-cover" />
      ) : (
        initials
      )}
    </div>
  )
}

export function UserMenu({ fullName, roles, photoUrl }: UserMenuProps) {
  const [isPending] = useTransition()
  const router = useRouter()

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.refresh()
  }

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button className="flex items-center gap-3 rounded-xl px-2 py-1.5 hover:bg-slate-100 transition-colors focus:outline-none">
          <span className="hidden sm:block text-right">
            <p className="text-sm font-semibold text-slate-800 leading-tight">{fullName}</p>
            <p className="text-xs text-slate-500 leading-tight">{roles[0]}</p>
          </span>

          <Avatar name={fullName} photoUrl={photoUrl} />

          <svg className="w-4 h-4 text-slate-400 hidden sm:block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={8}
          className="z-50 min-w-[200px] bg-white rounded-xl shadow-lg border border-slate-200 py-1"
        >
          <div className="px-4 py-3 border-b border-slate-100">
            <p className="text-sm font-semibold text-slate-800 truncate">{fullName}</p>
            <p className="text-xs text-slate-500 mt-0.5">{roles.join(', ')}</p>
          </div>

          <DropdownMenu.Item asChild>
            <Link href="/" className="px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50">
              Ir para o site
            </Link>
          </DropdownMenu.Item>

          <DropdownMenu.Separator className="h-px bg-slate-100 my-1" />

          <DropdownMenu.Item asChild>
            <button
              onClick={handleLogout}
              disabled={isPending}
              className="w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
            >
              {isPending ? 'Saindo...' : 'Sair'}
            </button>
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}