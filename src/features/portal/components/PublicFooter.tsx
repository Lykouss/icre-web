'use client'

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';

export function PublicFooter() {
  const pathname = usePathname();
  // Don't show footer on login/register pages
  if (pathname === '/login' || pathname === '/cadastro') return null;

  return (
    <footer className="bg-transparent dark:bg-slate-950 border-t border-blue-200/50 dark:border-white/5 pt-20 pb-10 relative overflow-hidden">
      {/* Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-blue-600/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-6xl mx-auto px-6 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 lg:gap-8 mb-16">
          
          {/* Brand & Sobre */}
          <div className="md:col-span-5 lg:col-span-4">
            <Link href="/" className="flex items-center gap-3 mb-6 group inline-flex">
              <div className="relative w-9 h-9 transition-transform duration-300 group-hover:scale-110">
                <Image src="/logo.svg" alt="ICRE Logo" fill className="object-contain dark:invert dark:brightness-0" />
              </div>
              <div className="flex flex-col">
                <span className="font-black text-xl tracking-tight text-slate-900 dark:text-white leading-none">ICRE</span>
                <span className="text-[9px] font-bold tracking-[0.2em] text-slate-500 dark:text-slate-400 uppercase mt-1">Rocha Eterna</span>
              </div>
            </Link>
            <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed mb-8 max-w-xs">
              Nosso chamado é viver o evangelho genuíno, amando a Deus e servindo ao próximo com excelência e paixão.
            </p>
            {/* Redes Sociais */}
            <div className="flex items-center gap-4">
              <a href="https://www.instagram.com/icre116?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw==" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-blue-50 dark:bg-slate-900 border border-blue-200/50 dark:border-white/10 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-fuchsia-400 hover:border-fuchsia-500/30 hover:bg-fuchsia-500/10 transition-all duration-300">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
              </a>
            </div>
          </div>

          {/* Links 1 */}
          <div className="md:col-span-3 lg:col-span-2 lg:col-start-6">
            <h4 className="text-slate-900 dark:text-white font-bold mb-5 tracking-wide">Navegação</h4>
            <ul className="space-y-3 text-sm text-slate-500 dark:text-slate-400">
              <li><Link href="/#inicio" className="hover:text-blue-400 transition-colors">Início</Link></li>
              <li><Link href="/#sobre" className="hover:text-blue-400 transition-colors">Sobre Nós</Link></li>
              <li><Link href="/#lideranca" className="hover:text-blue-400 transition-colors">Liderança</Link></li>
              <li><Link href="/#celulas" className="hover:text-blue-400 transition-colors">Células</Link></li>
              <li><Link href="/agenda" className="hover:text-blue-400 transition-colors">Agenda de Eventos</Link></li>
            </ul>
          </div>

          {/* Links 2 */}
          <div className="md:col-span-4 lg:col-span-3">
            <h4 className="text-slate-900 dark:text-white font-bold mb-5 tracking-wide">Contato & Ajuda</h4>
            <ul className="space-y-3 text-sm text-slate-500 dark:text-slate-400">
              <li><Link href="/feedback" className="hover:text-blue-400 transition-colors">Fale Conosco</Link></li>
              <li><Link href="/ajuda" className="hover:text-blue-400 transition-colors">Dúvidas Frequentes</Link></li>
              <li><Link href="/suporte" className="hover:text-blue-400 transition-colors">Suporte Técnico</Link></li>
            </ul>
          </div>

        </div>

        {/* Bottom Line */}
        <div className="pt-8 border-t border-blue-200/50 dark:border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-slate-500 text-xs text-center md:text-left">
            © {new Date().getFullYear()} Igreja de Cristo Rocha Eterna. Todos os direitos reservados.
          </p>
          <div className="flex items-center gap-6 text-xs text-slate-500">
            <Link href="/privacidade" className="hover:text-slate-600 dark:text-slate-300 transition-colors">Política de Privacidade</Link>
            <Link href="/termos" className="hover:text-slate-600 dark:text-slate-300 transition-colors">Termos de Uso</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}