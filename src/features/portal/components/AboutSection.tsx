'use client'

import { useScrollReveal } from '@/features/core/hooks/use-scroll-reveal';
import type { AboutContent } from '@/features/portal/types';

export function AboutSection({ content }: { content: AboutContent }) {
  const { ref: leftRef, visible: lv } = useScrollReveal<HTMLDivElement>({ threshold: 0.12 });
  const { ref: rightRef, visible: rv } = useScrollReveal<HTMLDivElement>({ threshold: 0.12 });

  const text = (content as unknown as Record<string, unknown>).text as string || content.body || '';

  return (
    <section id="sobre" className="relative py-28 px-6 bg-slate-50 dark:bg-slate-950 overflow-hidden transition-colors duration-300">
      
      {/* Elementos de fundo dinâmicos */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-[10%] -right-[10%] w-[500px] h-[500px] bg-blue-100/60 dark:bg-blue-900/20 rounded-full blur-[120px]" />
        <div className="absolute top-[40%] -left-[10%] w-[400px] h-[400px] bg-indigo-100/50 dark:bg-indigo-900/20 rounded-full blur-[100px]" />
      </div>

      <div className="relative max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-20 items-center">
        
        {/* Lado da Imagem (Metade) */}
        <div
          ref={leftRef}
          className="relative transition-all duration-1000 ease-out"
          style={{ opacity: lv ? 1 : 0, transform: lv ? 'translateY(0)' : 'translateY(40px)' }}
        >
          {/* Box principal da imagem */}
          <div className="relative rounded-[2.5rem] overflow-hidden aspect-[16/10] sm:aspect-[3/2] bg-slate-200 dark:bg-slate-800 shadow-2xl shadow-blue-900/10 ring-1 ring-slate-200/50 dark:ring-slate-700/50 z-10">
            {content.image_url ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={content.image_url} alt="Sobre a ICRE" className="w-full h-full object-cover transition-transform hover:scale-105 duration-700" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent pointer-events-none" />
              </>
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 transition-colors">
                <svg className="w-12 h-12 text-slate-400 dark:text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Imagem configurável</p>
              </div>
            )}
          </div>

          {/* Badge flutuante (Glassmorphism) */}
          <div className="absolute -bottom-6 -right-4 sm:-right-8 lg:-right-12 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200/60 dark:border-slate-700/60 shadow-2xl p-5 sm:p-6 rounded-3xl flex items-center gap-4 transition-transform hover:-translate-y-2 duration-300 z-20">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/30 shrink-0">
              <svg className="w-6 h-6 sm:w-7 sm:h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest mb-0.5">História Viva</p>
              <p className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white leading-none">Desde 1993</p>
            </div>
          </div>
          
          {/* Pattern decorativo de pontinhos */}
          <div className="absolute -top-8 -left-8 w-32 h-32 bg-[radial-gradient(circle,rgba(59,130,246,0.25)_2px,transparent_2px)] bg-[size:16px_16px] z-0" />
        </div>

        {/* Lado do Texto (Metade) */}
        <div
          ref={rightRef}
          className="lg:pl-8 transition-all duration-1000 ease-out mt-8 lg:mt-0"
          style={{ opacity: rv ? 1 : 0, transform: rv ? 'translateX(0)' : 'translateX(40px)', transitionDelay: '200ms' }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-800/50 mb-6 transition-colors">
            <span className="w-2 h-2 rounded-full bg-blue-600 dark:bg-blue-400 animate-pulse" />
            <span className="text-xs font-bold text-blue-700 dark:text-blue-300 uppercase tracking-widest">
              Quem Somos
            </span>
          </div>

          <h2 className="text-4xl sm:text-5xl lg:text-[3.5rem] font-black text-slate-900 dark:text-white leading-[1.1] tracking-tight mb-8">
            {content.title || 'Sobre a ICRE'}
          </h2>

          <div className="space-y-6 text-lg text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
            {(text || 'Descreva aqui a história e a missão da sua igreja.').split('\n').map((paragraph, i) => (
              paragraph.trim() ? <p key={i}>{paragraph}</p> : null
            ))}
          </div>

          <div className="mt-12 flex items-center gap-4 opacity-80">
            <div className="h-px bg-slate-300 dark:bg-slate-700 flex-1" />
            <div className="flex items-center gap-2 text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              </svg>
              Santa Maria, Brasília-DF
            </div>
            <div className="h-px bg-slate-300 dark:bg-slate-700 flex-1" />
          </div>
        </div>
      </div>
    </section>
  );
}