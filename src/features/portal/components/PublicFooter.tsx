import Link from 'next/link';

export function PublicFooter() {
  return (
    <footer className="bg-slate-900 text-slate-400 py-12 px-6">
      <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <p className="font-bold text-white text-lg">ICRE</p>
          <p className="text-sm mt-1">Igreja de Cristo Rocha Eterna</p>
        </div>

        <nav className="flex items-center gap-6 text-sm">
          <Link href="/" className="hover:text-white transition-colors">Início</Link>
          <Link href="/agenda" className="hover:text-white transition-colors">Eventos</Link>
          <Link href="/contato" className="hover:text-white transition-colors">Contato</Link>
        </nav>

        <p className="text-xs text-slate-600">
          © {new Date().getFullYear()} ICRE · SIGE-Web
        </p>
      </div>
    </footer>
  );
}