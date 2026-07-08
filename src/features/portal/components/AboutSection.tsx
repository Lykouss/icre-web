'use client'

import { useScrollReveal } from '@/features/core/hooks/use-scroll-reveal';
import Image from 'next/image';
import type { AboutContent } from '@/features/portal/types';

export function AboutSection({ content }: { content: AboutContent }) {
  const { ref: leftRef, visible: lv } = useScrollReveal<HTMLDivElement>({ threshold: 0.12 });
  const { ref: rightRef, visible: rv } = useScrollReveal<HTMLDivElement>({ threshold: 0.12 });

  const text = (content as unknown as Record<string, unknown>).text as string || content.body || '';

  return (
    <section id="sobre" className="relative py-32 px-6 bg-slate-950 overflow-hidden">
      {/* Blurs */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-32 right-0 w-[600px] h-[600px] bg-blue-600/7 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 -left-32 w-[500px] h-[500px] bg-indigo-600/6 rounded-full blur-[100px]" />
      </div>

      <div className="relative max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">

        {/* Imagem */}
        <div
          ref={leftRef}
          className="transition-all duration-700 ease-out"
          style={{ opacity: lv ? 1 : 0, transform: lv ? 'translate3d(0, 0, 0)' : 'translate3d(-48px, 0, 0)', transitionTimingFunction: 'var(--ease-spring)' }}
        >
          <div className="relative">
            {/* Glow animado no frame */}
            <div className="absolute -inset-3 bg-gradient-to-br from-blue-500/20 to-indigo-500/10 rounded-3xl blur-xl animate-breathe" />

            <div className="relative rounded-3xl overflow-hidden aspect-4/3 bg-slate-800/60 border border-white/10 shadow-2xl backdrop-blur-sm">
              {content.image_url ? (
                <Image src={content.image_url} alt="Sobre a ICRE" fill sizes="(max-width: 768px) 100vw, 50vw" className="object-cover" />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-gradient-to-br from-slate-800 to-slate-900">
                  <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
                  <svg className="w-16 h-16 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="text-sm text-slate-500">Imagem configurável no painel</p>
                </div>
              )}
              {/* Reflexo de luz */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent pointer-events-none" />
              {/* Linha de borda gradiente */}
              <div className="absolute inset-0 rounded-3xl border border-white/5 pointer-events-none" />
            </div>

            {/* Chip flutuante — anos */}
            <div className="absolute -bottom-5 -right-5 bg-slate-900 border border-white/10 rounded-2xl px-5 py-3.5 shadow-2xl backdrop-blur-md animate-float">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-500/15 border border-blue-500/20 rounded-xl flex items-center justify-center shrink-0">
                  <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-widest">Fundada em</p>
                  <p className="text-2xl font-black text-white leading-tight">{content.founded_year || '1993'}</p>
                </div>
              </div>
            </div>

            {/* Chip flutuante — localização (canto superior) */}
            <div className="absolute -top-5 -left-5 bg-slate-900 border border-white/10 rounded-2xl px-4 py-2.5 shadow-xl backdrop-blur-md animate-float" style={{ animationDelay: '1s' }}>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs font-semibold text-slate-300">{content.location || 'Santa Maria, Brasília-DF'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Texto */}
        <div
          ref={rightRef}
          className="transition-all duration-700 ease-out"
          style={{ opacity: rv ? 1 : 0, transform: rv ? 'translate3d(0, 0, 0)' : 'translate3d(48px, 0, 0)', transitionDelay: '120ms', transitionTimingFunction: 'var(--ease-spring)' }}
        >
          <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold tracking-widest uppercase px-4 py-2 rounded-full mb-8">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Quem Somos
          </div>

          <h2 className="text-4xl sm:text-5xl font-black text-white tracking-tight leading-tight mb-6">
            {content.title || 'Sobre a ICRE'}
          </h2>

          {/* Linha decorativa */}
          <div className="flex items-center gap-3 mb-8">
            <div className="h-0.5 w-12 bg-gradient-to-r from-blue-500 to-blue-400 rounded-full" />
            <div className="w-1.5 h-1.5 rounded-full bg-blue-400/60" />
            <div className="h-0.5 w-6 bg-blue-500/30 rounded-full" />
          </div>

          {/* Texto com linha lateral */}
          <div className="relative pl-5 border-l-2 border-blue-500/30">
            <p className="text-lg text-slate-400 leading-relaxed">
              {text || 'Descreva aqui a história e a missão da sua igreja.'}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}