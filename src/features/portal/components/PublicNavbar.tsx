'use client'

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

interface PublicNavbarProps {
  user: {
    fullName: string;
    isAdmin: boolean;
  } | null;
}

export function PublicNavbar({ user }: PublicNavbarProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5">
          <div className="relative w-9 h-9 overflow-hidden">
            <Image src="/logo.svg" alt="ICRE" fill className="object-contain" />
          </div>
          <span className="font-bold text-lg tracking-tight text-slate-900 hidden sm:block">ICRE</span>
        </Link>

        {/* Nav links — desktop */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
          <Link href="/" className="hover:text-slate-900 transition-colors">Início</Link>
          <Link href="/agenda" className="hover:text-slate-900 transition-colors">Agenda</Link>
          <Link href="/contato" className="hover:text-slate-900 transition-colors">Contato</Link>
        </nav>

        {/* Área de autenticação */}
        <div className="flex items-center gap-3">
          {!user ? (
            <>
              <Link
                href="/login"
                className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
              >
                Entrar
              </Link>
              <Link
                href="/cadastro"
                className="text-sm font-bold bg-slate-900 text-white px-4 py-2 rounded-xl hover:bg-slate-800 transition-colors"
              >
                Criar conta
              </Link>
            </>
          ) : (
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen(v => !v)}
                className="flex items-center gap-2.5 px-2 py-1.5 rounded-xl hover:bg-slate-100 transition-colors"
              >
                <div className="w-8 h-8 bg-slate-900 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0">
                  {user.fullName.charAt(0).toUpperCase()}
                </div>
                <span className="hidden sm:block text-sm font-semibold text-slate-800 max-w-[120px] truncate">
                  {user.fullName.split(' ')[0]}
                </span>
                <svg className={`w-4 h-4 text-slate-400 transition-transform ${menuOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Dropdown */}
              {menuOpen && (
                <div className="absolute right-0 top-full mt-2 w-56 bg-white border border-slate-200 rounded-2xl shadow-xl py-1.5 z-50 animate-in fade-in-0 zoom-in-95 duration-100">
                  {/* Info */}
                  <div className="px-4 py-3 border-b border-slate-100">
                    <p className="font-semibold text-slate-900 text-sm truncate">{user.fullName}</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {user.isAdmin ? 'Administrador' : 'Membro / Visitante'}
                    </p>
                  </div>

                  {/* Perfil */}
                  <Link
                    href="/minha-conta"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Minha conta
                  </Link>

                  {/* Ir para o sistema — apenas admins */}
                  {user.isAdmin && (
                    <Link
                      href="/dashboard"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 3H5a2 2 0 00-2 2v14a2 2 0 002 2h4M16 17l5-5m0 0l-5-5m5 5H9" />
                      </svg>
                      Ir para o sistema
                    </Link>
                  )}

                  <div className="border-t border-slate-100 mt-1 pt-1">
                    <button
                      onClick={() => { setMenuOpen(false); handleSignOut(); }}
                      className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      Sair
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}