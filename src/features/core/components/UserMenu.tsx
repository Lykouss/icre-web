'use client'

import React, { useTransition } from 'react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

interface UserMenuProps {
  fullName: string;
  roles: string[];
}

export function UserMenu({ fullName, roles }: UserMenuProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleSignOut() {
    startTransition(async () => {
      const supabase = createClient();
      await supabase.auth.signOut();
      router.push('/login');
    });
  }

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button className="flex items-center gap-3 rounded-xl px-2 py-1.5 hover:bg-slate-100 transition-colors focus:outline-none">
          <span className="hidden sm:block text-right">
            <p className="text-sm font-semibold text-slate-800 leading-tight">{fullName}</p>
            <p className="text-xs text-slate-500 leading-tight">{roles[0]}</p>
          </span>
          <div className="h-8 w-8 rounded-full bg-slate-900 flex items-center justify-center text-white font-bold text-sm shadow-sm shrink-0">
            {fullName.charAt(0).toUpperCase()}
          </div>
          <svg className="w-4 h-4 text-slate-400 hidden sm:block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={8}
          className="z-50 min-w-[200px] bg-white rounded-xl shadow-lg border border-slate-200 py-1 animate-in fade-in-0 zoom-in-95"
        >
          {/* Info do usuário */}
          <div className="px-4 py-3 border-b border-slate-100">
            <p className="text-sm font-semibold text-slate-800 truncate">{fullName}</p>
            <p className="text-xs text-slate-500 mt-0.5">{roles.join(', ')}</p>
          </div>

          {/* Ir para o site */}
          <DropdownMenu.Item asChild>
            <Link
              href="/"
              className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 cursor-pointer outline-none transition-colors"
            >
              <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
              </svg>
              Ir para o site
            </Link>
          </DropdownMenu.Item>

          <DropdownMenu.Separator className="h-px bg-slate-100 my-1" />

          {/* Sair */}
          <DropdownMenu.Item asChild>
            <button
              onClick={handleSignOut}
              disabled={isPending}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 cursor-pointer outline-none transition-colors disabled:opacity-50"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              {isPending ? 'Saindo...' : 'Sair'}
            </button>
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}