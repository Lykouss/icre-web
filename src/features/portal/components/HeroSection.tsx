'use client'

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import type { HeroContent } from '@/features/portal/types';

export function HeroSection({ content }: { content: HeroContent }) {
  const [mounted, setMounted] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 100);
    return () => clearTimeout(t);
  }, []);

  // Parallax: move o fundo e os blurs conforme scroll
  useEffect(() => {
    const onScroll = () => {
      if (!sectionRef.current) return;
      const rect = sectionRef.current.getBoundingClientRect();
      if (rect.bottom > 0) setScrollY(window.scrollY);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const parallaxOffset = scrollY * 0.4;

  return (
    <section
      ref={sectionRef}
      id="inicio"
      data-theme="dark"
      className="relative min-h-svh flex items-center justify-center overflow-hidden bg-slate-950"
    >
      {/* Imagem de fundo com parallax */}
      {content.image_url && (
        <div
          className="absolute inset-0 will-change-transform"
          style={{ transform: `translateY(${parallaxOffset}px) scale(1.15)` }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={content.image_url} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-slate-950/65" />
        </div>
      )}

      {/* Gradiente base */}
      {!content.image_url && (
        <div
          className="absolute inset-0 will-change-transform"
          style={{ transform: `translateY(${parallaxOffset * 0.3}px)` }}
        >
          <div className="absolute inset-0 bg-linear-to-br from-slate-950 via-blue-950 to-slate-900" />
        </div>
      )}

      {/* Blurs com parallax próprio */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-blue-500/12 rounded-full blur-[130px] will-change-transform"
          style={{ transform: `translateY(${parallaxOffset * 0.2}px)` }}
        />
        <div
          className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[110px] will-change-transform"
          style={{ transform: `translateY(${parallaxOffset * -0.15}px)` }}
        />
        <div
          className="absolute top-3/4 left-1/2 w-[300px] h-[300px] bg-violet-500/8 rounded-full blur-[80px] will-change-transform"
          style={{ transform: `translateY(${parallaxOffset * 0.1}px)` }}
        />
      </div>

      {/* Grade sutil */}
      <div
        className="absolute inset-0 opacity-[0.025] pointer-events-none"
        style={{
          backgroundImage: 'linear-gradient(rgba(148,163,184,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.3) 1px, transparent 1px)',
          backgroundSize: '72px 72px',
          transform: `translateY(${parallaxOffset * 0.05}px)`,
        }}
      />

      {/* Partículas flutuantes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-blue-400/20 animate-pulse"
            style={{
              width: `${4 + (i % 3) * 3}px`,
              height: `${4 + (i % 3) * 3}px`,
              top: `${10 + i * 11}%`,
              left: `${8 + i * 12}%`,
              animationDelay: `${i * 0.7}s`,
              animationDuration: `${3 + i * 0.5}s`,
            }}
          />
        ))}
      </div>

      {/* Conteúdo */}
      <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
        {/* Badge */}
        <div
          className="transition-all duration-700 ease-out"
          style={{ opacity: mounted ? 1 : 0, transform: mounted ? 'translateY(0)' : 'translateY(24px)', transitionDelay: '0ms' }}
        >
          <div className="inline-flex items-center gap-2.5 bg-white/6 backdrop-blur-md border border-white/12 text-white/70 text-xs font-semibold tracking-widest uppercase px-5 py-2.5 rounded-full mb-10">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
            Igreja de Cristo Rocha Eterna
          </div>
        </div>

        {/* Título */}
        <h1
          className="text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-black text-white leading-[1.02] tracking-tight mb-6 transition-all duration-700 ease-out"
          style={{ opacity: mounted ? 1 : 0, transform: mounted ? 'translateY(0)' : 'translateY(32px)', transitionDelay: '120ms' }}
        >
          {content.title || 'Bem-vindo à ICRE'}
        </h1>

        {/* Subtítulo */}
        {content.subtitle && (
          <p
            className="text-lg sm:text-xl text-white/55 max-w-2xl mx-auto mb-12 leading-relaxed transition-all duration-700 ease-out"
            style={{ opacity: mounted ? 1 : 0, transform: mounted ? 'translateY(0)' : 'translateY(28px)', transitionDelay: '240ms' }}
          >
            {content.subtitle}
          </p>
        )}

        {/* CTAs */}
        <div
          className="flex items-center justify-center gap-4 flex-wrap transition-all duration-700 ease-out"
          style={{ opacity: mounted ? 1 : 0, transform: mounted ? 'translateY(0)' : 'translateY(24px)', transitionDelay: '360ms' }}
        >
          {(content.cta_label || content.button_text) && (
            <Link
              href={content.cta_url || content.button_link || '/contato'}
              className="group inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold px-8 py-4 rounded-2xl transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/40"
            >
              {content.cta_label || content.button_text}
              <svg className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </Link>
          )}
          <Link
            href="/login"
            className="inline-flex items-center gap-2 text-white/65 hover:text-white font-semibold px-6 py-4 rounded-2xl border border-white/15 hover:border-white/35 hover:bg-white/5 transition-all duration-300 backdrop-blur-sm"
          >
            Área do Membro
          </Link>
        </div>
      </div>

      {/* Scroll indicator animado */}
      <div
        className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 transition-all duration-700 ease-out"
        style={{ opacity: mounted ? 0.4 : 0, transitionDelay: '600ms' }}
      >
        <div className="w-5 h-8 rounded-full border border-white/30 flex items-start justify-center pt-1.5">
          <div className="w-1 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDuration: '1.5s' }} />
        </div>
      </div>
    </section>
  );
}