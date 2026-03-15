'use client'

import { useScrollReveal } from '@/features/core/hooks/use-scroll-reveal';
import type { AboutContent } from '@/features/portal/types';

export function AboutSection({ content }: { content: AboutContent }) {
  const { ref: leftRef,  visible: lv } = useScrollReveal<HTMLDivElement>({ threshold: 0.15 });
  const { ref: rightRef, visible: rv } = useScrollReveal<HTMLDivElement>({ threshold: 0.15 });

  const text = (content as unknown as Record<string, unknown>).text as string || content.body || '';

  return (
    <section id="sobre" className="relative py-32 px-6 bg-slate-950 overflow-hidden">
      {/* Blurs */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-32 right-0 w-[600px] h-[600px] bg-blue-600/7 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 -left-32 w-[500px] h-[500px] bg-indigo-600/6 rounded-full blur-[100px]" />
      </div>

      <div className="relative max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">

        {/* Imagem com glassmorphism frame */}
        <div
          ref={leftRef}
          className="transition-all duration-700 ease-out"
          style={{ opacity: lv ? 1 : 0, transform: lv ? 'translateX(0)' : 'translateX(-48px)' }}
        >
          <div className="relative">
            {/* Frame decorativo atrás */}
            <div className="absolute -inset-3 bg-linear-to-br from-blue-500/20 to-indigo-500/10 rounded-3xl blur-xl" />
            <div className="relative rounded-3xl overflow-hidden aspect-4/3 bg-slate-800/60 border border-white/10 shadow-2xl backdrop-blur-sm">
              {content.image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={content.image_url} alt="Sobre a ICRE" className="w-full h-full object-cover" />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                  <svg className="w-16 h-16 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="text-sm text-slate-500">Imagem configurável no painel</p>
                </div>
              )}
              {/* Reflexo de luz */}
              <div className="absolute inset-0 bg-linear-to-br from-white/5 via-transparent to-transparent pointer-events-none" />
            </div>
            {/* Chip flutuante */}
            <div className="absolute -bottom-5 -right-5 bg-slate-900/80 backdrop-blur-md border border-white/10 rounded-2xl px-4 py-3 shadow-xl">
              <p className="text-xs text-slate-400 font-medium">Desde</p>
              <p className="text-2xl font-black text-white">1993</p>
            </div>
          </div>
        </div>

        {/* Texto */}
        <div
          ref={rightRef}
          className="transition-all duration-700 ease-out"
          style={{ opacity: rv ? 1 : 0, transform: rv ? 'translateX(0)' : 'translateX(48px)', transitionDelay: '100ms' }}
        >
          <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold tracking-widest uppercase px-4 py-2 rounded-full mb-8">
            Quem Somos
          </div>
          <h2 className="text-4xl sm:text-5xl font-black text-white tracking-tight leading-tight mb-6">
            {content.title || 'Sobre a ICRE'}
          </h2>
          <div className="flex items-center gap-3 mb-8">
            <div className="h-0.5 w-12 bg-blue-500 rounded-full" />
            <div className="h-0.5 w-6 bg-blue-500/40 rounded-full" />
          </div>
          <p className="text-lg text-slate-400 leading-relaxed">
            {text || 'Descreva aqui a história e a missão da sua igreja.'}
          </p>
        </div>
      </div>
    </section>
  );
}