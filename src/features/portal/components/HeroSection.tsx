'use client'

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import type { HeroContent } from '@/features/portal/types';

function TypewriterText({ text }: { text: string }) {
  const [displayed, setDisplayed] = useState('');
  useEffect(() => {
    let i = 0;
    setDisplayed('');
    const timer = setInterval(() => {
      i++;
      setDisplayed(text.substring(0, i));
      if (i >= text.length) clearInterval(timer);
    }, 90);
    return () => clearInterval(timer);
  }, [text]);
  
  return (
    <span className="italic">
      {displayed}
    </span>
  );
}

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

  const parallaxOffset = scrollY * 0.35;

  return (
    <section
      ref={sectionRef}
      id="inicio"
      data-theme="dark"
      className="relative min-h-svh flex items-center justify-center overflow-hidden bg-slate-900"
    >
      {/* Imagem de fundo com parallax */}
      {content.image_url ? (
        <div
          className="absolute inset-0 will-change-transform"
          style={{ transform: `translateY(${parallaxOffset}px) scale(1.12)` }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={content.image_url} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-slate-900/65" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-transparent to-transparent" />
        </div>
      ) : (
        <div className="absolute inset-0 bg-gradient-to-b from-slate-800 to-slate-900" />
      )}

      {/* Conteúdo */}
      <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">

        {/* Badge */}
        <div
          className="transition-all duration-700 ease-out"
          style={{ opacity: mounted ? 1 : 0, transform: mounted ? 'translateY(0)' : 'translateY(-16px)' }}
        >
          <div className="inline-flex items-center gap-2 border border-white/20 text-white/70 text-xs font-semibold tracking-widest uppercase px-5 py-2 rounded-full mb-10">
            <svg className="w-3.5 h-3.5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
              <path d="M9 2a1 1 0 000 2h1V2H9zm1 0h1a1 1 0 000-2h-1v2zM8 4v5H3a1 1 0 000 2h5v7a1 1 0 002 0v-7h5a1 1 0 000-2h-5V4H8z" />
            </svg>
            Igreja de Cristo Rocha Eterna
          </div>
        </div>

        {/* Título */}
        <h1
          className="text-6xl sm:text-7xl lg:text-[5.5rem] font-black leading-tight tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white to-blue-400 mb-6 transition-all duration-700 ease-out py-2"
          style={{ opacity: mounted ? 1 : 0, transform: mounted ? 'translateY(0)' : 'translateY(28px)', transitionDelay: '100ms' }}
        >
          {content.title || 'Bem-vindo à ICRE'}
        </h1>

        {/* Subtítulo */}
        {content.subtitle && (
          <p
            className="text-lg sm:text-xl text-white/60 max-w-lg mx-auto mb-12 leading-relaxed transition-all duration-700 ease-out"
            style={{ opacity: mounted ? 1 : 0, transform: mounted ? 'translateY(0)' : 'translateY(16px)', transitionDelay: '200ms' }}
          >
            <TypewriterText text={content.subtitle} />
          </p>
        )}

        {/* CTAs */}
        <div
          className="flex items-center justify-center gap-4 flex-wrap transition-all duration-700 ease-out"
          style={{ opacity: mounted ? 1 : 0, transform: mounted ? 'translateY(0)' : 'translateY(16px)', transitionDelay: '300ms' }}
        >
          {(content.cta_label || content.button_text) && (
            <Link
              href={content.cta_url || content.button_link || '/contato'}
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold px-8 py-3.5 rounded-xl transition-all duration-200 hover:shadow-lg hover:shadow-blue-500/30 text-base"
            >
              {content.cta_label || content.button_text}
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </Link>
          )}
          <Link
            href="/login"
            className="inline-flex items-center gap-2 text-white/70 hover:text-white font-semibold px-6 py-3.5 rounded-xl border border-white/20 hover:border-white/40 hover:bg-white/8 transition-all duration-200 text-base"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
            Área do Membro
          </Link>
        </div>
      </div>

      {/* Scroll indicator */}
      <div
        className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 transition-all duration-700 ease-out"
        style={{ opacity: mounted ? 0.4 : 0, transitionDelay: '600ms' }}
      >
        <span className="text-[10px] text-white/50 font-semibold tracking-widest uppercase">Scroll</span>
        <div className="w-5 h-8 rounded-full border border-white/25 flex items-start justify-center pt-1.5">
          <div className="w-1 h-2 bg-white/50 rounded-full animate-bounce" style={{ animationDuration: '1.8s' }} />
        </div>
      </div>
    </section>
  );
}