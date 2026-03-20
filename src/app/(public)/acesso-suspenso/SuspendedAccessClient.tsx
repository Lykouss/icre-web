'use client'

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface SuspendedAccessClientProps {
  fullName: string;
  reason:   string | null;
  byName:   string | null;
  until:    string | null;
}

export function SuspendedAccessClient({ fullName, reason, byName, until }: SuspendedAccessClientProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 60);
    return () => clearTimeout(t);
  }, []);

  const untilDate = until ? new Date(until) : null;
  const formatDate = (d: Date) =>
    d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 overflow-hidden relative">

      {/* Blurs de fundo */}
      <div className="pointer-events-none absolute inset-0">
        <div
          className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[500px] rounded-full blur-[140px] transition-opacity duration-1000"
          style={{ background: 'radial-gradient(ellipse, rgba(220,38,38,0.10) 0%, transparent 70%)', opacity: mounted ? 1 : 0 }}
        />
        <div
          className="absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full blur-[120px] transition-opacity duration-1000 delay-300"
          style={{ background: 'radial-gradient(ellipse, rgba(30,58,95,0.25) 0%, transparent 70%)', opacity: mounted ? 1 : 0 }}
        />
        {/* Grade sutil */}
        <div
          className="absolute inset-0 opacity-[0.018]"
          style={{
            backgroundImage: 'linear-gradient(rgba(148,163,184,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.4) 1px, transparent 1px)',
            backgroundSize: '64px 64px',
          }}
        />
      </div>

      {/* Partículas flutuantes vermelhas */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-red-500/20 animate-pulse"
            style={{
              width:  `${3 + (i % 3) * 2}px`,
              height: `${3 + (i % 3) * 2}px`,
              top:    `${15 + i * 13}%`,
              left:   `${10 + i * 14}%`,
              animationDelay:    `${i * 0.6}s`,
              animationDuration: `${3 + i * 0.4}s`,
            }}
          />
        ))}
      </div>

      <div className="relative w-full max-w-md">

        {/* Logo */}
        <div
          className="flex items-center justify-center gap-2.5 mb-8 transition-all duration-700"
          style={{ opacity: mounted ? 1 : 0, transform: mounted ? 'translateY(0)' : 'translateY(16px)' }}
        >
          <div className="relative w-7 h-7">
            <Image src="/logo.svg" alt="ICRE" fill className="object-contain brightness-0 invert opacity-40" />
          </div>
          <span className="text-slate-600 font-bold text-sm tracking-wide">SIGE-Web · ICRE</span>
        </div>

        {/* Card glassmorphism */}
        <div
          className="bg-slate-900/70 backdrop-blur-xl border border-white/8 rounded-3xl overflow-hidden shadow-2xl transition-all duration-700 delay-75"
          style={{ opacity: mounted ? 1 : 0, transform: mounted ? 'translateY(0) scale(1)' : 'translateY(24px) scale(0.97)' }}
        >
          {/* Linha de destaque topo */}
          <div className="h-0.5 w-full bg-linear-to-r from-transparent via-red-500/60 to-transparent" />

          {/* Ícone + título */}
          <div className="px-8 pt-10 pb-6 text-center">
            {/* Ícone animado */}
            <div className="relative inline-flex items-center justify-center mb-6">
              <div
                className="absolute w-20 h-20 rounded-full border border-red-500/20 transition-all duration-1000"
                style={{ transform: mounted ? 'scale(1.4)' : 'scale(0.8)', opacity: mounted ? 1 : 0 }}
              />
              <div
                className="absolute w-20 h-20 rounded-full border border-red-500/10 transition-all duration-1000 delay-200"
                style={{ transform: mounted ? 'scale(1.8)' : 'scale(0.8)', opacity: mounted ? 0.5 : 0 }}
              />
              <div
                className="relative w-16 h-16 bg-red-500/10 border border-red-500/25 rounded-2xl flex items-center justify-center transition-all duration-700 delay-150"
                style={{ opacity: mounted ? 1 : 0, transform: mounted ? 'scale(1)' : 'scale(0.7)' }}
              >
                <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5"
                    d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                </svg>
              </div>
            </div>

            <div
              className="transition-all duration-700 delay-200"
              style={{ opacity: mounted ? 1 : 0, transform: mounted ? 'translateY(0)' : 'translateY(12px)' }}
            >
              <p className="text-xs font-bold text-red-400/70 uppercase tracking-widest mb-2">Acesso bloqueado</p>
              <h1 className="text-2xl font-black text-white tracking-tight">Conta suspensa</h1>
              <p className="text-slate-400 text-sm mt-2">
                Olá, <span className="text-slate-200 font-medium">{fullName}</span>. Seu acesso ao
                sistema administrativo foi temporariamente suspenso.
              </p>
            </div>
          </div>

          {/* Separador */}
          <div className="mx-8 h-px bg-white/6" />

          {/* Corpo */}
          <div
            className="px-8 py-6 space-y-4 transition-all duration-700 delay-300"
            style={{ opacity: mounted ? 1 : 0, transform: mounted ? 'translateY(0)' : 'translateY(12px)' }}
          >
            {/* Motivo */}
            {reason && (
              <div className="relative bg-red-500/5 border border-red-500/15 rounded-2xl p-5 overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-red-500/40 rounded-l-2xl" />
                <p className="text-xs font-bold text-red-400/80 uppercase tracking-wider mb-2 ml-3">
                  Motivo da suspensão
                </p>
                <p className="text-slate-200 text-sm leading-relaxed ml-3">
                  {reason}
                </p>
              </div>
            )}

            {/* Detalhes */}
            <div className="bg-white/4 border border-white/8 rounded-2xl divide-y divide-white/6 overflow-hidden">
              {byName && (
                <div className="flex items-center justify-between px-4 py-3">
                  <span className="text-xs text-slate-500 font-medium">Suspenso por</span>
                  <span className="text-sm text-slate-200 font-semibold">{byName}</span>
                </div>
              )}
              <div className="flex items-center justify-between px-4 py-3">
                <span className="text-xs text-slate-500 font-medium">Duração</span>
                <span className={`text-sm font-bold ${untilDate ? 'text-amber-400' : 'text-red-400'}`}>
                  {untilDate ? `Até ${formatDate(untilDate)}` : 'Indefinido'}
                </span>
              </div>
            </div>

            {/* Nota */}
            <div className="flex items-start gap-3 bg-blue-500/5 border border-blue-500/15 rounded-2xl px-4 py-3.5">
              <svg className="w-4 h-4 text-blue-400/70 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-xs text-slate-400 leading-relaxed">
                Sua conta pública permanece ativa. Para contestar esta decisão, entre em contato
                diretamente com a liderança da ICRE.
              </p>
            </div>
          </div>

          {/* Botões */}
          <div
            className="px-8 pb-8 flex flex-col gap-2.5 transition-all duration-700 delay-500"
            style={{ opacity: mounted ? 1 : 0, transform: mounted ? 'translateY(0)' : 'translateY(8px)' }}
          >
            <Link
              href="/"
              className="group flex items-center justify-center gap-2 w-full py-3.5 bg-white/8 hover:bg-white/12 border border-white/10 hover:border-white/20 text-white font-semibold rounded-2xl transition-all duration-200 text-sm backdrop-blur-sm"
            >
              <svg className="w-4 h-4 text-slate-400 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                  d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              Voltar ao site
            </Link>

            <Link
              href="/minha-conta"
              className="flex items-center justify-center gap-2 w-full py-3 text-slate-500 hover:text-slate-300 font-medium rounded-2xl transition-colors text-sm"
            >
              Acessar minha conta pública
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>

          {/* Linha de destaque base */}
          <div className="h-0.5 w-full bg-linear-to-r from-transparent via-red-500/20 to-transparent" />
        </div>

        {/* Footer */}
        <p
          className="text-center text-xs text-slate-700 mt-6 transition-all duration-700 delay-700"
          style={{ opacity: mounted ? 1 : 0 }}
        >
          © {new Date().getFullYear()} Igreja de Cristo Rocha Eterna
        </p>
      </div>
    </div>
  );
}