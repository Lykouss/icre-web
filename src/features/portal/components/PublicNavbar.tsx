import Link from 'next/link';

export function PublicNavbar() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100 shadow-sm">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="font-bold text-xl text-slate-900 tracking-tight">
          ICRE
        </Link>

        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
          <Link href="/#about" className="hover:text-slate-900 transition-colors">Sobre</Link>
          <Link href="/agenda" className="hover:text-slate-900 transition-colors">Eventos</Link>
          <Link href="/contato" className="hover:text-slate-900 transition-colors">Contato</Link>
        </nav>

        <Link
          href="/contato"
          className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors"
        >
          Primeira vez?
        </Link>
      </div>
    </header>
  );
}