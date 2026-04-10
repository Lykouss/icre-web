'use client'

import Link from 'next/link';
import { useScrollReveal } from '@/features/core/hooks/use-scroll-reveal';
import type { CellsSectionContent, PublicCell, MeetingType } from '@/features/portal/types';

const TYPE_CONFIG: Record<MeetingType, { label: string; cls: string }> = {
  presencial: { label: 'Presencial', cls: 'bg-emerald-500/15 border-emerald-500/25 text-emerald-400' },
  online:     { label: 'Online',     cls: 'bg-blue-500/15 border-blue-500/25 text-blue-400' },
  hibrido:    { label: 'Híbrido',    cls: 'bg-violet-500/15 border-violet-500/25 text-violet-400' },
};

function CellCard({ cell, index }: { cell: PublicCell; index: number }) {
  const { ref, visible } = useScrollReveal<HTMLDivElement>({ threshold: 0.08 });
  const typeConfig = TYPE_CONFIG[cell.meeting_type] ?? { label: cell.meeting_type, cls: 'bg-slate-500/15 border-slate-500/25 text-slate-400' };

  return (
    <div
      ref={ref}
      className="group bg-slate-900/60 backdrop-blur-sm border border-white/8 rounded-3xl p-6 hover:border-blue-500/25 hover:-translate-y-1.5 transition-all duration-300 ease-out"
      style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(28px)', transitionDelay: `${index * 70}ms` }}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="w-10 h-10 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-center justify-center shrink-0">
          <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
        </div>
        <span className={`text-xs font-bold border px-2.5 py-1 rounded-full ${typeConfig.cls}`}>
          {typeConfig.label}
        </span>
      </div>

      <h3 className="text-lg font-bold text-white mb-1 group-hover:text-blue-300 transition-colors duration-200">{cell.name}</h3>



      {/* Líderes */}
      {(cell.leader1 || cell.leader2) && (
        <div className="flex items-center gap-2 mb-4">
          {[cell.leader1, cell.leader2].filter(Boolean).map((leader, i) => (
            <div key={i} className="flex items-center gap-1.5">
              {leader!.photo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={leader!.photo_url} alt={leader!.name} className="w-6 h-6 rounded-full object-cover ring-1 ring-white/20" />
              ) : (
                <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center">
                  <svg className="w-3.5 h-3.5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
              )}
              <span className="text-xs text-slate-400">{leader!.name}</span>
              {i === 0 && cell.leader2 && <span className="text-slate-600">&amp;</span>}
            </div>
          ))}
        </div>
      )}

      <div className="space-y-2 pt-4 border-t border-white/6">
        {cell.meeting_days && (
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <svg className="w-3.5 h-3.5 text-slate-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            {cell.meeting_days}{cell.meeting_time && ` · ${cell.meeting_time}`}
          </div>
        )}
        {cell.neighborhood && (
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <svg className="w-3.5 h-3.5 text-slate-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {cell.neighborhood}
          </div>
        )}
      </div>
    </div>
  );
}

function ComingSoonPlaceholder() {
  const { ref, visible } = useScrollReveal({ threshold: 0.1 });
  return (
    <div ref={ref} className="transition-all duration-700 ease-out"
      style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(24px)' }}>
      <div className="bg-slate-900/40 border border-white/6 border-dashed rounded-3xl p-12 text-center">
        <div className="w-16 h-16 bg-blue-500/10 border border-blue-500/15 rounded-2xl flex items-center justify-center mx-auto mb-5">
          <svg className="w-8 h-8 text-blue-400/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
        </div>
        <p className="text-slate-400 font-semibold mb-2">Módulo de Células em desenvolvimento</p>
        <p className="text-slate-600 text-sm">As células serão exibidas aqui assim que o módulo for ativado.</p>
        <div className="mt-6">
          <Link href="/contato"
            className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 text-sm font-semibold border border-blue-500/20 hover:border-blue-400/40 px-5 py-2.5 rounded-2xl hover:bg-blue-500/8 transition-all duration-200">
            Quero participar de uma célula
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
          </Link>
        </div>
      </div>
    </div>
  );
}

interface Props {
  content: CellsSectionContent;
  cells: PublicCell[];
}

export function CellsSection({ content, cells }: Props) {
  const { ref, visible } = useScrollReveal({ threshold: 0.1 });

  return (
    <section id="celulas" className="relative py-32 px-6 bg-slate-900 overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-indigo-600/5 rounded-full blur-[100px]" />
      </div>

      <div className="relative max-w-6xl mx-auto">
        <div ref={ref} className="text-center mb-16 transition-all duration-700 ease-out"
          style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(24px)' }}>
          <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold tracking-widest uppercase px-4 py-2 rounded-full mb-6">
            Comunidade
          </div>
          <h2 className="text-4xl sm:text-5xl font-black text-white tracking-tight">
            {content.title || 'Nossas Células'}
          </h2>
          {content.subtitle && <p className="mt-4 text-lg text-slate-400 max-w-xl mx-auto">{content.subtitle}</p>}
        </div>

        {cells.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {cells.map((cell, i) => <CellCard key={cell.id} cell={cell} index={i} />)}
            </div>
            <div className="text-center mt-12 transition-all duration-700 ease-out"
              style={{ opacity: visible ? 1 : 0, transitionDelay: '400ms' }}>
              <Link href="/contato"
                className="inline-flex items-center gap-2 text-slate-400 hover:text-white text-sm font-semibold border border-white/10 hover:border-white/25 px-6 py-3 rounded-2xl hover:bg-white/5 transition-all duration-200">
                Quero participar de uma célula
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
              </Link>
            </div>
          </>
        ) : (
          <ComingSoonPlaceholder />
        )}
      </div>
    </section>
  );
}