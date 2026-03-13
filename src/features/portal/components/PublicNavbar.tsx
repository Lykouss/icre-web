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

function Avatar({ name, photoUrl }: { name: string; photoUrl: string | null }) {
  const initials = name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();

  return (
    <div className="w-8 h-8 rounded-full overflow-hidden bg-blue-600 text-white font-bold flex items-center justify-center shrink-0 text-xs">
      {photoUrl ? (
        <Image src={photoUrl} alt={name} width={32} height={32} className="object-cover w-full h-full" />
      ) : (
        initials
      )}
    </div>
  );
}

// Threshold: altura aproximada do HeroSection (92vh)
const HERO_THRESHOLD = typeof window !== 'undefined' ? window.innerHeight * 0.85 : 600;

export function PublicNavbar({ user }: Props) {
  const pathname    = usePathname();
  const router      = useRouter();
  const isHome      = pathname === '/';
  const [open, setOpen]       = useState(false);
  // Na home começa sobre o hero (escuro). Fora da home começa sempre no modo claro.
  const [overHero, setOverHero] = useState(isHome);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isHome) return;

    const update = () => {
      setOverHero(window.scrollY < HERO_THRESHOLD);
    };

    update();
    window.addEventListener('scroll', update, { passive: true });
    return () => window.removeEventListener('scroll', update);
  }, [isHome]);

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.refresh();
  };

  // Estilos adaptativos: escuro sobre hero, claro sobre conteúdo branco
  const navBg   = overHero
    ? 'bg-slate-900/60 backdrop-blur-xl border-white/10'
    : 'bg-white/80 backdrop-blur-xl border-slate-200/80 shadow-sm shadow-black/5';

  const textColor  = overHero ? 'text-white/75 hover:text-white'    : 'text-slate-600 hover:text-slate-900';
  const logoFilter = overHero ? 'brightness-0 invert'                : '';
  const logoText   = overHero ? 'text-white'                         : 'text-slate-900';
  const chevron    = overHero ? 'text-white/50'                      : 'text-slate-400';

  return (
    <header className="fixed top-0 left-0 right-0 z-50 px-4 pt-3">
      <nav className={`max-w-6xl mx-auto flex items-center justify-between gap-4 h-14 px-4 rounded-2xl border transition-all duration-300 ${navBg}`}>

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 shrink-0">
          <div className="relative w-7 h-7">
            <Image
              src="/logo.svg"
              alt="ICRE"
              fill
              className={`object-contain transition-all duration-300 ${logoFilter}`}
            />
          </div>
          <span className={`font-black text-base tracking-tight transition-colors duration-300 ${logoText}`}>
            ICRE
          </span>
        </Link>

        {/* Links centrais */}
        <div className="hidden md:flex items-center gap-1">
          {[
            { label: 'Início',    href: '/#'         },
            { label: 'Sobre',     href: '/#sobre'    },
            { label: 'Liderança', href: '/#pastores' },
            { label: 'Células',   href: '/#celulas'  },
            { label: 'Contato',   href: '/#contato'  },
          ].map(item => (
            <a
              key={item.href}
              href={item.href}
              className={`text-sm font-semibold px-3 py-1.5 rounded-xl transition-all duration-300 ${textColor} ${
                overHero ? 'hover:bg-white/10' : 'hover:bg-slate-100'
              }`}
            >
              {item.label}
            </a>
          ))}
        </div>

        {/* Área direita */}
        <div className="flex items-center gap-2 shrink-0">
          {!user && (
            <>
              <Link
                href="/login"
                className={`text-sm font-semibold px-3 py-1.5 rounded-xl transition-all duration-300 ${textColor} ${
                  overHero ? 'hover:bg-white/10' : 'hover:bg-slate-100'
                }`}
              >
                Entrar
              </Link>
              <Link
                href="/cadastro"
                className="text-sm font-bold bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl transition-colors shadow-sm"
              >
                Criar conta
              </Link>
            </>
          )}

          {user && (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setOpen(v => !v)}
                className={`flex items-center gap-2 px-2 py-1.5 rounded-xl transition-colors ${
                  overHero ? 'hover:bg-white/10' : 'hover:bg-slate-100'
                }`}
              >
                <Avatar name={user.fullName} photoUrl={user.photoUrl} />
                <svg
                  className={`w-3.5 h-3.5 transition-transform duration-200 ${open ? 'rotate-180' : ''} ${chevron}`}
                  fill="none" stroke="currentColor" viewBox="0 0 24 24"
                >
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
                    <Link
                      href="/minha-conta"
                      onClick={() => setOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      Minha Conta
                    </Link>

                    {user.isAdmin && (
                      <Link
                        href="/dashboard"
                        onClick={() => setOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-blue-600 hover:bg-blue-50 transition-colors font-semibold"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18" />
                        </svg>
                        Ir para o Sistema
                      </Link>
                    )}
                  </div>

                  <div className="border-t border-slate-100 py-1">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
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
      </nav>
    </header>
  );
}