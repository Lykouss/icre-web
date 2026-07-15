'use client'

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import type { HeroContent } from '@/features/portal/types';

export function HeroSection({ content }: { content: HeroContent }) {
  const [mounted, setMounted] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 80);
    return () => clearTimeout(t);
  }, []);

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
      className="dark relative min-h-svh flex items-center justify-center overflow-hidden bg-transparent"
    >
      {/* Fundo com parallax */}
      {content.image_url && (
        <div
          className="absolute inset-0 will-change-transform"
          style={{ transform: `translate3d(0, ${parallaxOffset}px, 0) scale(1.15)` }}
        >
          <Image src={content.image_url} alt="Capa" fill className="object-cover" priority />
          {/* Overlay multicamadas */}
          <div className="absolute inset-0 bg-white/15 dark:bg-slate-950/55" />
          <div className="absolute inset-0 bg-gradient-to-t from-white/80 dark:from-transparent via-white/10 dark:via-slate-950/40 to-transparent dark:to-slate-950/20" />
          <div className="absolute inset-0 bg-gradient-to-r from-white/30 dark:from-slate-950/60 via-transparent to-white/30 dark:to-slate-950/60" />
        </div>
      )}

      {/* Gradiente base (sem imagem) */}
      {!content.image_url && (
        <div
          className="absolute inset-0 will-change-transform"
          style={{ transform: `translate3d(0, ${parallaxOffset * 0.3}px, 0)` }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-slate-100 dark:from-slate-950 via-blue-100/80 dark:via-blue-950/80 to-white dark:to-slate-900" />
          <div className="absolute inset-0 bg-gradient-to-t from-white/80 dark:from-slate-950/80 via-transparent to-transparent" />
        </div>
      )}

      {/* Blurs atmosfÃ©ricos */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute top-1/4 left-1/3 w-[700px] h-[700px] bg-blue-500/10 rounded-full blur-[160px] will-change-transform"
          style={{ transform: `translate3d(0, ${parallaxOffset * 0.18}px, 0)` }}
        />
        <div
          className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-indigo-500/8 rounded-full blur-[120px] will-change-transform"
          style={{ transform: `translate3d(0, ${parallaxOffset * -0.12}px, 0)` }}
        />
      </div>

      {/* Grade sutil */}
      <div
        className="absolute inset-0 opacity-[0.018] pointer-events-none"
        style={{
          backgroundImage: 'linear-gradient(rgba(148,163,184,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.5) 1px, transparent 1px)',
          backgroundSize: '80px 80px',
          transform: `translate3d(0, ${parallaxOffset * 0.04}px, 0)`,
        }}
      />

      {/* Linhas horizontais de luz decorativas */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/20 to-transparent"
          style={{ top: '35%' }}
        />
        <div
          className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-indigo-500/12 to-transparent"
          style={{ top: '65%' }}
        />
      </div>

      {/* ConteÃºdo */}
      <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">

        {/* TÃ­tulo com gradiente */}
        <h1
          className="text-5xl sm:text-7xl lg:text-8xl xl:text-9xl font-black leading-[0.95] tracking-tight mb-8 transition-all duration-700 ease-out text-gradient-blue"
          style={{ opacity: mounted ? 1 : 0, transform: mounted ? 'translate3d(0, 0, 0)' : 'translate3d(0, 36px, 0)', transitionDelay: '120ms' }}
        >
          {content.title || 'Bem-vindo Ã  ICRE'}
        </h1>

        {/* Linha decorativa */}
        <div
          className="flex items-center justify-center gap-4 mb-8 transition-all duration-700 ease-out"
          style={{ opacity: mounted ? 1 : 0, transitionDelay: '220ms' }}
        >
          <div className="h-px w-16 bg-gradient-to-r from-transparent to-blue-500/60 rounded-full" />
          <div className="w-1.5 h-1.5 rounded-full bg-blue-500/80" />
          <div className="h-px w-16 bg-gradient-to-l from-transparent to-blue-500/60 rounded-full" />
        </div>

        {/* SubtÃ­tulo */}
        {content.subtitle && (
          <p
            className="text-lg sm:text-xl text-slate-900 dark:text-white/50 max-w-xl mx-auto mb-14 leading-relaxed tracking-wide font-light transition-all duration-700 ease-out"
            style={{ opacity: mounted ? 1 : 0, transform: mounted ? 'translate3d(0, 0, 0)' : 'translate3d(0, 20px, 0)', transitionDelay: '260ms' }}
          >
            {content.subtitle}
          </p>
        )}

        {/* CTAs */}
        <div
          className="flex items-center justify-center gap-4 flex-wrap transition-all duration-700 ease-out"
          style={{ opacity: mounted ? 1 : 0, transform: mounted ? 'translate3d(0, 0, 0)' : 'translate3d(0, 20px, 0)', transitionDelay: '360ms' }}
        >
          {(content.cta_label || content.button_text) && (
            <Link
              href={content.cta_url || content.button_link || '/contato'}
              className="group relative inline-flex items-center gap-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold px-8 py-4 rounded-2xl transition-all duration-300 hover:scale-[1.03] hover:shadow-2xl hover:shadow-blue-500/40 overflow-hidden"
            >
              {/* Shimmer no hover */}
              <span className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 shimmer-bg" />
              <span className="relative">{content.cta_label || content.button_text}</span>
              <svg className="relative w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </Link>
          )}
        </div>
      </div>

      {/* Scroll indicator animado */}
      <div
        className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 transition-all duration-700 ease-out"
        style={{ opacity: mounted ? 0.35 : 0, transitionDelay: '700ms' }}
      >
        <span className="text-[10px] text-slate-900 dark:text-white/40 font-semibold tracking-[0.2em] uppercase">Scroll</span>
        <div className="w-5 h-8 rounded-full border border-black/20 dark:border-white/20 flex items-start justify-center pt-1.5">
          <div className="w-1 h-2 bg-white/50 rounded-full animate-bounce" style={{ animationDuration: '1.8s' }} />
        </div>
      </div>
    </section>
  );
}
