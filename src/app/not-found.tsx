'use client'

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';

export default function NotFound() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 80);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center overflow-hidden relative px-6">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-blue-600/8 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-indigo-600/8 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 text-center max-w-lg mx-auto">
        <div className={`flex items-center justify-center gap-3 mb-6 transition-all duration-700 ease-out ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <div className="relative w-10 h-10">
            <Image src="/logo.svg" alt="ICRE" fill className="object-contain brightness-0 invert opacity-70" />
          </div>
          <span className="font-black text-xl tracking-tight text-white/80">ICRE</span>
        </div>

        <div className={`transition-all duration-700 ease-out ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
          <p
            className="text-[10rem] sm:text-[14rem] font-black leading-none tracking-tighter select-none"
            style={{
              background: 'linear-gradient(135deg, #1e3a5f 0%, #2563eb 50%, #1e40af 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            404
          </p>
        </div>

        <div className={`-mt-4 sm:-mt-8 transition-all duration-700 delay-100 ease-out ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mb-3">
            Página não encontrada
          </h1>
          <p className="text-slate-400 leading-relaxed mb-10">
            O endereço que você acessou não existe ou foi movido.
            Verifique o link ou volte ao início.
          </p>
        </div>

        <div className={`flex items-center justify-center gap-4 flex-wrap transition-all duration-700 delay-200 ease-out ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
          <Link
            href="/"
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold px-6 py-3 rounded-2xl transition-all duration-200 hover:scale-105 hover:shadow-xl hover:shadow-blue-600/30"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            Ir para o início
          </Link>
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center gap-2 text-slate-400 hover:text-white font-semibold px-6 py-3 rounded-2xl border border-white/10 hover:border-white/25 transition-all duration-200"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Voltar
          </button>
        </div>
      </div>
    </div>
  );
}