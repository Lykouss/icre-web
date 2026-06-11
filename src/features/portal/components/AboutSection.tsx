'use client'

import { useScrollReveal } from '@/features/core/hooks/use-scroll-reveal';
import type { AboutContent } from '@/features/portal/types';

export function AboutSection({ content }: { content: AboutContent }) {
  const { ref: leftRef, visible: lv } = useScrollReveal<HTMLDivElement>({ threshold: 0.12 });
  const { ref: rightRef, visible: rv } = useScrollReveal<HTMLDivElement>({ threshold: 0.12 });

  const text = (content as unknown as Record<string, unknown>).text as string || content.body || '';

  return (
    <section id="sobre" className="relative py-24 px-6 bg-white overflow-hidden" data-theme="light">

      <div className="relative max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

        {/* Imagem */}
        <div
          ref={leftRef}
          className="transition-all duration-700 ease-out"
          style={{ opacity: lv ? 1 : 0, transform: lv ? 'translateX(0)' : 'translateX(-32px)' }}
        >
          <div className="relative rounded-2xl overflow-hidden aspect-4/3 bg-gray-100 border border-gray-200 shadow-sm">
            {content.image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={content.image_url} alt="Sobre a ICRE" className="w-full h-full object-cover" />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-gray-100">
                <svg className="w-12 h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="text-sm text-gray-400">Imagem configurável no painel</p>
              </div>
            )}
          </div>

          {/* Chip — fundada em */}
          <div className="mt-4 inline-flex items-center gap-3 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center shrink-0">
              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-widest">Fundada em</p>
              <p className="text-xl font-black text-gray-900 leading-tight">1993</p>
            </div>
            <div className="ml-2 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="text-xs font-semibold text-gray-600">Santa Maria, Brasília-DF</span>
            </div>
          </div>
        </div>

        {/* Texto */}
        <div
          ref={rightRef}
          className="transition-all duration-700 ease-out"
          style={{ opacity: rv ? 1 : 0, transform: rv ? 'translateX(0)' : 'translateX(32px)', transitionDelay: '100ms' }}
        >
          <span className="inline-block text-xs font-bold text-blue-600 tracking-widest uppercase bg-blue-50 border border-blue-100 px-3 py-1.5 rounded-full mb-5">
            Quem Somos
          </span>

          <h2 className="text-3xl sm:text-4xl font-black text-gray-900 leading-tight mb-5">
            {content.title || 'Sobre a ICRE'}
          </h2>

          <div className="h-1 w-12 bg-blue-600 rounded-full mb-6" />

          <p className="text-lg text-gray-600 leading-relaxed">
            {text || 'Descreva aqui a história e a missão da sua igreja.'}
          </p>
        </div>
      </div>
    </section>
  );
}