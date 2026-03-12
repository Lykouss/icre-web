'use client'

import Image from 'next/image';
import { useScrollReveal } from '@/features/core/hooks/use-scroll-reveal';
import type { AboutContent } from '@/features/portal/types';

export function AboutSection({ content }: { content: AboutContent }) {
  const { ref: leftRef, visible: leftVisible }   = useScrollReveal({ threshold: 0.2 });
  const { ref: rightRef, visible: rightVisible } = useScrollReveal({ threshold: 0.2 });

  return (
    <section id="sobre" className="py-24 px-6 bg-white">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        {/* Imagem */}
        <div
          ref={leftRef}
          className={`transition-all duration-700 ease-out ${leftVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8'}`}
        >
          <div className="relative rounded-3xl overflow-hidden aspect-[4/3] bg-slate-100 shadow-xl">
            {content.image_url ? (
              <Image src={content.image_url} alt="Sobre a ICRE" fill className="object-cover" />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-gradient-to-br from-slate-100 to-slate-200">
                <svg className="w-16 h-16 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="text-sm text-slate-400 font-medium">Adicione uma imagem no painel</p>
              </div>
            )}
            <div className="absolute inset-0 ring-1 ring-inset ring-black/5 rounded-3xl" />
          </div>
        </div>

        {/* Texto */}
        <div
          ref={rightRef}
          className={`transition-all duration-700 ease-out ${rightVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'}`}
        >
          <div className="inline-flex items-center gap-2 text-blue-600 text-xs font-bold tracking-widest uppercase mb-6">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Quem Somos
          </div>
          <h2 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight leading-tight mb-6">
            {content.title || 'Quem Somos'}
          </h2>
          <div className="w-12 h-1 bg-blue-600 rounded-full mb-6" />
          <p className="text-lg text-slate-600 leading-relaxed">
            {content.body || 'Descreva aqui a história e a missão da sua igreja.'}
          </p>
        </div>
      </div>
    </section>
  );
}