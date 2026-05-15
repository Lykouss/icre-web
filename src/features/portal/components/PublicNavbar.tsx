'use client'

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

interface NavUser {
  fullName: string;
  photoUrl: string | null;
  isAdmin: boolean;
}

// Mapa de tipo de bloco → label e id de âncora da seção
const BLOCK_NAV_MAP: Record<string, { label: string; id: string }> = {
  hero:    { label: 'Início',    id: 'inicio'    },
  about:   { label: 'Sobre',     id: 'sobre'     },
  mission: { label: 'Missão',    id: 'missao'    },
  pastors: { label: 'Liderança', id: 'lideranca' },
  cells:   { label: 'Células',   id: 'celulas'   },
  events:  { label: 'Eventos',   id: 'eventos'   },
  youtube: { label: 'YouTube',   id: 'youtube'   },
  contact: { label: 'Contato',   id: 'contato'   },
};

interface Props {
  user: NavUser | null;
  activeBlockTypes?: string[];
}

function Avatar({ name, photoUrl }: { name: string; photoUrl: string | null }) {
  const initials = name.trim().split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase() || '?';
  return (
    <div className="w-8 h-8 rounded-full overflow-hidden bg-blue-600 text-white font-bold flex items-center justify-center shrink-0 text-xs">
      {photoUrl
        // eslint-disable-next-line @next/next/no-img-element
        ? <img src={photoUrl} alt={name} className="w-full h-full object-cover" />
        : initials}
    </div>
  );
}

function scrollToSection(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 80, behavior: 'smooth' });
  window.history.pushState(null, '', `#${id}`);
}

export function PublicNavbar({ user, activeBlockTypes = [] }: Props) {
  const pathname   = usePathname();
  const router     = useRouter();
  const isHome     = pathname === '/';

  const [mobileOpen, setMobileOpen]       = useState(false);
  const [scrolled, setScrolled]           = useState(false);
  const [userOpen, setUserOpen]           = useState(false);
  const [activeSection, setActiveSection] = useState('inicio');
  // 'dark' | 'light' — cor da seção sob a navbar
  const [sectionTheme, setSectionTheme]   = useState<'dark' | 'light'>('dark');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Constrói links a partir dos blocos ativos recebidos do servidor
  const navLinks = activeBlockTypes
    .filter(t => BLOCK_NAV_MAP[t])
    .map(t => BLOCK_NAV_MAP[t]);

  // Scroll — backdrop mais opaco
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const [isAdminOverride, setIsAdminOverride] = useState<boolean | null>(null);

useEffect(() => {
    const check = async () => {
      const supabase = createClient();
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) return;

      const [{ data: roleData }, { data: profileData }] = await Promise.all([
        supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', authUser.id)
          .in('role', ['LEADER', 'FINANCE_ADMIN', 'CHURCH_ADMIN', 'SYSADMIN'])
          .limit(1)
          .maybeSingle(),
        supabase
          .from('profiles')
          .select('onboarding_step')
          .eq('id', authUser.id)
          .single(),
      ]);

      setIsAdminOverride(!!roleData && profileData?.onboarding_step === 'done');
    };

    check();

    // Realtime — detecta onboarding concluído
    const supabase = createClient();
    const channel = supabase
      .channel('navbar_admin_watch')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'profiles' },
        payload => {
          if (payload.new.onboarding_step === 'done') {
            setIsAdminOverride(true);
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const showAdminButton = isAdminOverride !== null ? isAdminOverride : user?.isAdmin;

  // IntersectionObserver — seção ativa + tema de cor
  useEffect(() => {
    if (!isHome) return;
    const observers: IntersectionObserver[] = [];

    navLinks.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (!el) return;

      const obs = new IntersectionObserver(
        ([entry]) => {
          if (!entry.isIntersecting) return;
          setActiveSection(id);
          // Lê data-theme="dark"|"light" do elemento de seção
          const theme = el.getAttribute('data-theme') as 'dark' | 'light' | null;
          setSectionTheme(theme ?? 'dark');
        },
        { rootMargin: '-25% 0px -65% 0px' }
      );
      obs.observe(el);
      observers.push(obs);
    });

    return () => observers.forEach(o => o.disconnect());
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isHome, activeBlockTypes.join(',')]);

  // Fecha dropdown ao clicar fora
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setUserOpen(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  useEffect(() => {
    const h = () => { if (window.innerWidth >= 768) setMobileOpen(false); };
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string, close?: () => void) => {
    if (isHome) { e.preventDefault(); scrollToSection(id); close?.(); }
    else close?.();
  };

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.refresh();
  };

  // Estilos adaptativos ao tema da seção
  const isDark = !isHome || sectionTheme === 'dark';

  const navBg = scrolled
    ? isDark
      ? 'bg-slate-950/92 backdrop-blur-xl border-white/10 shadow-2xl shadow-black/30'
      : 'bg-white/92 backdrop-blur-xl border-slate-200/80 shadow-lg shadow-black/8'
    : isDark
      ? 'bg-slate-900/50 backdrop-blur-xl border-white/8'
      : 'bg-white/60 backdrop-blur-xl border-slate-200/60';

  const text    = isDark ? 'text-white/65 hover:text-white'   : 'text-slate-600 hover:text-slate-900';
  const textAct = isDark ? 'text-white bg-white/10'            : 'text-slate-900 bg-slate-100';
  const hover   = isDark ? 'hover:bg-white/8'                  : 'hover:bg-slate-100';
  const logo    = isDark ? 'text-white'                         : 'text-slate-900';
  const logoImg = isDark ? 'brightness-0 invert'                : '';

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 px-4 pt-3">
        <nav className={`max-w-6xl mx-auto flex items-center justify-between gap-4 h-14 px-5 rounded-2xl border transition-all duration-300 ${navBg}`}>

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 shrink-0 group">
            <div className="relative w-7 h-7 transition-transform duration-200 group-hover:scale-110">
              <Image src="/logo.svg" alt="ICRE" fill className={`object-contain transition-all duration-300 ${logoImg}`} />
            </div>
            <span className={`font-black text-base tracking-tight transition-colors duration-300 ${logo}`}>ICRE</span>
          </Link>

          {/* Links desktop */}
          <div className="hidden md:flex items-center gap-0.5">
            {navLinks.map(({ label, id }) => {
              const active = isHome && activeSection === id;
              return (
                <a key={id} href={`/#${id}`}
                  onClick={e => handleLinkClick(e, id)}
                  className={`relative text-sm font-semibold px-3 py-1.5 rounded-xl transition-all duration-200 ${active ? textAct : `${text} ${hover}`}`}
                >
                  {label}
                  <span className={`absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-blue-400 transition-all duration-300 ${active ? 'opacity-100 scale-100' : 'opacity-0 scale-0'}`} />
                </a>
              );
            })}
          </div>

          {/* Direita */}
          <div className="flex items-center gap-2 shrink-0">
            {!user && (
              <>
                <Link href="/login" className={`hidden sm:block text-sm font-semibold px-3 py-1.5 rounded-xl transition-all duration-200 ${text} ${hover}`}>
                  Entrar
                </Link>
                <Link href="/cadastro" className="text-sm font-bold bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl transition-all duration-200 hover:scale-105 hover:shadow-lg hover:shadow-blue-500/30">
                  Criar conta
                </Link>
              </>
            )}

            {user && (
              <div className="relative" ref={dropdownRef}>
                <button onClick={() => setUserOpen(v => !v)}
                  className={`flex items-center gap-2 px-2 py-1.5 rounded-xl transition-colors ${hover}`}>
                  <Avatar name={user.fullName} photoUrl={user.photoUrl} />
                  <svg className={`w-3.5 h-3.5 transition-all duration-200 ${userOpen ? 'rotate-180' : ''} ${isDark ? 'text-white/40' : 'text-slate-400'}`}
                    fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                <div className={`absolute right-0 top-full mt-2 w-56 bg-slate-900 border border-white/10 rounded-2xl shadow-2xl shadow-black/40 py-2 z-50 transition-all duration-200 origin-top-right ${
                  userOpen ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 -translate-y-1 pointer-events-none'
                }`}>
                  <div className="px-4 py-3 border-b border-white/8">
                    <p className="font-bold text-white text-sm truncate">{user.fullName}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{user.isAdmin ? 'Administrador' : 'Membro'}</p>
                  </div>
                  <div className="py-1">
                    <Link href="/minha-conta" onClick={() => setUserOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-300 hover:text-white hover:bg-white/6 transition-colors">
                      <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                      Minha Conta
                    </Link>
                    <Link href="/minhas-inscricoes" onClick={() => setUserOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-300 hover:text-white hover:bg-white/6 transition-colors">
                      <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" /></svg>
                      Meus Comprovantes
                    </Link>
                    {showAdminButton && (
                      <Link href="/dashboard" onClick={() => setUserOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-blue-400 font-semibold hover:text-blue-300 hover:bg-blue-500/10 transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18" /></svg>
                        Ir para o Sistema
                      </Link>
                    )}
                  </div>
                  <div className="border-t border-white/8 py-1">
                    <button onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                      Sair
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Hamburger */}
            <button onClick={() => setMobileOpen(v => !v)}
              className={`md:hidden flex flex-col justify-center items-center w-9 h-9 rounded-xl transition-colors gap-1.5 ${hover}`}
              aria-label={mobileOpen ? 'Fechar menu' : 'Abrir menu'}>
              <span className={`block w-5 h-0.5 rounded-full transition-all duration-300 ${isDark ? 'bg-white' : 'bg-slate-800'} ${mobileOpen ? 'rotate-45 translate-y-2' : ''}`} />
              <span className={`block w-5 h-0.5 rounded-full transition-all duration-300 ${isDark ? 'bg-white' : 'bg-slate-800'} ${mobileOpen ? 'opacity-0 scale-x-0' : ''}`} />
              <span className={`block w-5 h-0.5 rounded-full transition-all duration-300 ${isDark ? 'bg-white' : 'bg-slate-800'} ${mobileOpen ? '-rotate-45 -translate-y-2' : ''}`} />
            </button>
          </div>
        </nav>
      </header>

      {/* Menu mobile */}
      <div className={`fixed inset-0 z-40 md:hidden transition-all duration-300 ${mobileOpen ? 'pointer-events-auto' : 'pointer-events-none'}`}>
        <div className={`absolute inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity duration-300 ${mobileOpen ? 'opacity-100' : 'opacity-0'}`}
          onClick={() => setMobileOpen(false)} />

        <aside className={`absolute top-0 right-0 h-full w-72 bg-slate-950 border-l border-white/8 shadow-2xl flex flex-col transition-transform duration-300 ease-out ${mobileOpen ? 'translate-x-0' : 'translate-x-full'}`}>
          <div className="flex items-center justify-between px-5 h-20 border-b border-white/8 shrink-0">
            <span className="font-black text-white text-base">Navegação</span>
            <button onClick={() => setMobileOpen(false)}
              className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-white/8 text-white/50 hover:text-white transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>

          <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
            {navLinks.map(({ label, id }, i) => {
              const active = isHome && activeSection === id;
              return (
                <a key={id} href={`/#${id}`}
                  onClick={e => handleLinkClick(e, id, () => setMobileOpen(false))}
                  className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm font-semibold border transition-all duration-200 ${
                    active
                      ? 'bg-blue-600/15 border-blue-500/25 text-blue-300'
                      : 'text-slate-300 hover:text-white hover:bg-white/6 border-transparent'
                  }`}
                  style={{ transitionDelay: mobileOpen ? `${i * 35}ms` : '0ms' }}
                >
                  <span className={`w-2 h-2 rounded-full shrink-0 transition-colors ${active ? 'bg-blue-400' : 'bg-slate-700'}`} />
                  {label}
                </a>
              );
            })}
          </nav>

          <div className="px-3 py-5 border-t border-white/8 space-y-2 shrink-0">
            {!user ? (
              <>
                <Link href="/login" onClick={() => setMobileOpen(false)}
                  className="flex items-center justify-center w-full py-3 rounded-2xl text-sm font-semibold text-slate-300 border border-white/10 hover:border-white/20 hover:bg-white/5 transition-all">
                  Entrar
                </Link>
                <Link href="/cadastro" onClick={() => setMobileOpen(false)}
                  className="flex items-center justify-center w-full py-3 rounded-2xl text-sm font-bold bg-blue-600 hover:bg-blue-500 text-white transition-colors">
                  Criar conta
                </Link>
              </>
            ) : (
              <div className="space-y-1">
                <div className="flex items-center gap-3 px-3 py-3 rounded-2xl bg-white/4 mb-2">
                  <Avatar name={user.fullName} photoUrl={user.photoUrl} />
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-white truncate">{user.fullName}</p>
                    <p className="text-xs text-slate-400">{user.isAdmin ? 'Administrador' : 'Membro'}</p>
                  </div>
                </div>
                <Link href="/minha-conta" onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-2xl text-sm text-slate-300 hover:text-white hover:bg-white/6 transition-colors">
                  <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                  Minha Conta
                </Link>
                <Link href="/minhas-inscricoes" onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-2xl text-sm text-slate-300 hover:text-white hover:bg-white/6 transition-colors">
                  <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" /></svg>
                  Meus Comprovantes
                </Link>
                {user.isAdmin && (
                  <Link href="/dashboard" onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 rounded-2xl text-sm text-blue-400 font-semibold hover:bg-blue-500/10 transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18" /></svg>
                    Ir para o Sistema
                  </Link>
                )}
                <button onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm text-red-400 hover:bg-red-500/10 transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                  Sair
                </button>
              </div>
            )}
          </div>
        </aside>
      </div>
    </>
  );
}