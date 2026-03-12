'use client'

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

interface NavUser {
  fullName: string;
  photoUrl: string | null;
  isAdmin: boolean;
}

interface Props {
  user: NavUser | null;
}

function Avatar({ name, photoUrl, size = 'sm' }: { name: string; photoUrl: string | null; size?: 'sm' | 'md' }) {
  const sz = size === 'sm' ? 'w-8 h-8 text-xs' : 'w-10 h-10 text-sm';
  const initials = name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();

  return (
    <div className={`${sz} rounded-full overflow-hidden bg-blue-600 text-white font-bold flex items-center justify-center shrink-0`}>
      {photoUrl ? (
        <Image src={photoUrl} alt={name} width={40} height={40} className="object-cover w-full h-full" />
      ) : (
        initials
      )}
    </div>
  );
}

export function PublicNavbar({ user }: Props) {
  const pathname    = usePathname();
  const router      = useRouter();
  const isHome      = pathname === '/';

  const [open, setOpen]         = useState(false);
  const [scrolled, setScrolled] = useState(() => pathname !== '/');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isHome) return;
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [isHome]);

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.refresh();
  };

  const navBase = 'fixed top-0 left-0 right-0 z-50 transition-all duration-300';
  const navBg   = scrolled
    ? 'bg-white/95 backdrop-blur-sm shadow-sm border-b border-slate-200'
    : 'bg-transparent';

  return (
    <header className={`${navBase} ${navBg}`}>
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="relative w-8 h-8">
            <Image src="/logo.svg" alt="ICRE" fill className="object-contain" />
          </div>
          <span className={`font-black text-lg tracking-tight transition-colors ${scrolled ? 'text-slate-900' : 'text-white'}`}>
            ICRE
          </span>
        </Link>

        {/* Links centrais */}
        <nav className="hidden md:flex items-center gap-6">
          {[
            { label: 'Início',    href: '/#'       },
            { label: 'Sobre',     href: '/#sobre'  },
            { label: 'Liderança', href: '/#pastores'},
            { label: 'Células',   href: '/#celulas' },
            { label: 'Contato',   href: '/#contato' },
          ].map(item => (
            <a
              key={item.href}
              href={item.href}
              className={`text-sm font-semibold transition-colors ${
                scrolled ? 'text-slate-600 hover:text-slate-900' : 'text-white/80 hover:text-white'
              }`}
            >
              {item.label}
            </a>
          ))}
        </nav>

        {/* Área direita */}
        <div className="flex items-center gap-3">
          {!user && (
            <>
              <Link
                href="/login"
                className={`text-sm font-semibold transition-colors ${scrolled ? 'text-slate-600 hover:text-slate-900' : 'text-white/80 hover:text-white'}`}
              >
                Entrar
              </Link>
              <Link
                href="/cadastro"
                className="text-sm font-bold bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl transition-colors"
              >
                Criar conta
              </Link>
            </>
          )}

          {user && (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setOpen(v => !v)}
                className="flex items-center gap-2 p-1 rounded-xl hover:bg-white/10 transition-colors"
              >
                <Avatar name={user.fullName} photoUrl={user.photoUrl} />
                <svg className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''} ${scrolled ? 'text-slate-600' : 'text-white/70'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {open && (
                <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50">
                  <div className="px-4 py-3 border-b border-slate-100">
                    <p className="font-bold text-slate-900 text-sm truncate">{user.fullName}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{user.isAdmin ? 'Administrador' : 'Membro'}</p>
                  </div>

                  <div className="py-1">
                    <Link href="/minha-conta" onClick={() => setOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors">
                      <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      Minha Conta
                    </Link>

                    {user.isAdmin && (
                      <Link href="/dashboard" onClick={() => setOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-blue-600 hover:bg-blue-50 transition-colors font-semibold">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18" />
                        </svg>
                        Ir para o Sistema
                      </Link>
                    )}
                  </div>

                  <div className="border-t border-slate-100 py-1">
                    <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors">
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