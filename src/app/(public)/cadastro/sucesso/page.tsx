import Link from 'next/link';
import Image from 'next/image';

export default function RegisterSuccessPage() {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_#064e3b_0%,_transparent_60%)] pointer-events-none" />

      <div className="relative text-center max-w-md w-full">
        <div className="w-20 h-20 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <div className="flex items-center justify-center gap-2 mb-6">
          <Image src="/logo.svg" alt="ICRE" width={28} height={28} className="brightness-0 invert opacity-60" />
          <span className="text-slate-400 text-sm font-medium">ICRE</span>
        </div>

        <h1 className="text-3xl font-bold text-white mb-3">Conta criada! 🎉</h1>
        <p className="text-slate-400 mb-8">
          Bem-vindo(a) à ICRE! Sua conta está pronta. Você pode personalizar seu perfil agora ou fazer isso depois.
        </p>

        <div className="flex flex-col gap-3">
          <Link
            href="/minha-conta"
            className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold px-8 py-3.5 rounded-xl transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            Adicionar foto de perfil
          </Link>

          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 text-slate-400 hover:text-white font-semibold px-8 py-3 rounded-xl border border-white/10 hover:border-white/25 transition-all"
          >
            Ir para o início
          </Link>
        </div>
      </div>
    </div>
  );
}