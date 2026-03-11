import Link from 'next/link';
import Image from 'next/image';

export default function RegisterSuccessPage() {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_#064e3b_0%,_transparent_60%)] pointer-events-none" />
      <div className="relative text-center max-w-md">
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
        <p className="text-slate-400 mb-2">
          Bem-vindo(a) à ICRE! Verifique seu e-mail para ativar sua conta.
        </p>
        <p className="text-slate-500 text-sm mb-8">
          Você receberá um link de confirmação em breve. Após confirmar, poderá fazer login normalmente.
        </p>
        <Link
          href="/login"
          className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-8 py-3.5 rounded-xl transition-colors"
        >
          Ir para o login
        </Link>
      </div>
    </div>
  );
}