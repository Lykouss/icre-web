'use client'

import { useState } from 'react';
import Image from 'next/image';
import { useScrollReveal } from '@/features/core/hooks/use-scroll-reveal';
import type { CellsSectionContent, PublicCell, MeetingType } from '@/features/portal/types';

const TYPE_CONFIG: Record<MeetingType, { label: string; cls: string; dot: string }> = {
  presencial: { label: 'Presencial', cls: 'bg-emerald-500/15 border-emerald-500/25 text-emerald-600 dark:text-emerald-400', dot: 'bg-emerald-500 dark:bg-emerald-400' },
  online:     { label: 'Online',     cls: 'bg-blue-500/15 border-blue-500/25 text-blue-600 dark:text-blue-400',         dot: 'bg-blue-500 dark:bg-blue-400' },
  hibrido:    { label: 'Híbrido',    cls: 'bg-violet-500/15 border-violet-500/25 text-violet-600 dark:text-violet-400',   dot: 'bg-violet-500 dark:bg-violet-400' },
};

function CellCard({ cell, index, onClick }: { cell: PublicCell; index: number; onClick: () => void }) {
  const { ref, visible } = useScrollReveal<HTMLButtonElement>({ threshold: 0.06 });
  const typeConfig = TYPE_CONFIG[cell.meeting_type] ?? { label: cell.meeting_type, cls: 'bg-slate-500/15 border-slate-500/25 text-slate-600 dark:text-slate-400', dot: 'bg-slate-500 dark:bg-slate-400' };

  return (
    <button
      ref={ref}
      onClick={onClick}
      className="group flex flex-col text-left bg-blue-100 dark:bg-slate-900/50 backdrop-blur-xl border border-blue-300/60 dark:border-white/10 rounded-[2rem] overflow-hidden hover:border-blue-500/30 hover:-translate-y-2 hover:shadow-[0_20px_40px_-15px_rgba(59,130,246,0.2)] transition-all duration-500 ease-out w-full"
      style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(28px)', transitionDelay: `${index * 70}ms` }}
    >
      {/* Imagem */}
      <div className="relative w-full aspect-[4/3] bg-white/60 backdrop-blur-xl shadow-2xl shadow-blue-900/5 border border-white/60 dark:border-transparent dark:shadow-none dark:bg-slate-800 shrink-0 overflow-hidden">
        {cell.image_url ? (
          <Image src={cell.image_url} alt={cell.name} fill sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" className="object-cover group-hover:scale-110 transition-transform duration-1000 ease-out will-change-transform" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-slate-50 dark:from-slate-800 via-slate-50/80 dark:via-slate-800/80 to-slate-50 dark:to-slate-900">
            <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
            <svg className="w-12 h-12 text-blue-500/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
            </svg>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-white dark:from-slate-950 via-slate-50/40 dark:via-slate-900/40 to-transparent opacity-90" />
        
        {/* Top Badge */}
        <div className="absolute top-4 left-4">
          <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold border px-3 py-1.5 rounded-full bg-white/40 dark:bg-slate-900/50 backdrop-blur-xl/90 backdrop-blur-md shadow-lg ${typeConfig.cls}`}>
            <span className={`w-2 h-2 rounded-full ${typeConfig.dot} animate-pulse`} />
            {typeConfig.label}
          </span>
        </div>

        {/* Name Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-6 pt-12 bg-gradient-to-t from-slate-50 dark:from-slate-900 to-transparent">
          <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-300 transition-colors duration-300 leading-tight">{cell.name}</h3>
        </div>
      </div>

      {/* Conteúdo */}
      <div className="relative p-6 flex flex-col flex-1 bg-blue-50/30 dark:bg-slate-900/50 w-full z-10">
        
        {/* Floating Leaders Badge */}
        {(cell.leader1 || cell.leader2) && (
          <div className="absolute -top-6 right-6 flex items-center bg-white/80 backdrop-blur-md dark:backdrop-blur-none border border-white/60/50 dark:border-transparent dark:bg-slate-800/90 backdrop-blur-xl p-1.5 pr-4 rounded-full border-white/60 dark:border-white/10 shadow-xl group-hover:border-blue-500/30 transition-colors duration-300">
            <div className="flex -space-x-2 mr-2">
              {[cell.leader1, cell.leader2].filter(Boolean).map((leader, i) => (
                leader?.photo_url ? (
                  <div key={i} className="relative w-8 h-8 rounded-full overflow-hidden ring-2 ring-white dark:ring-slate-800 z-10">
                    <Image src={leader.photo_url} alt={leader.name} fill sizes="32px" className="object-cover object-top" />
                  </div>
                ) : (
                  <div key={i} className="w-8 h-8 rounded-full bg-blue-500/20 ring-2 ring-white dark:ring-slate-800 flex items-center justify-center relative z-10">
                    <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
                  </div>
                )
              ))}
            </div>
            <div className="flex flex-col items-start justify-center text-left">
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest leading-none mb-0.5">Líderes</span>
              <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 leading-none max-w-[90px] truncate">
                {[cell.leader1, cell.leader2].filter(Boolean).map(l => {
                  const parts = l!.name.split(' ');
                  return (parts[0] === 'Pr.' || parts[0] === 'Pra.') ? (parts[1] || parts[0]) : parts[0];
                }).join(' & ')}
              </span>
            </div>
          </div>
        )}

        {/* Info Area */}
        <div className="space-y-4 pt-2">
          {cell.meeting_days && (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0 group-hover:bg-blue-500/20 transition-colors">
                <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
              </div>
              <div className="flex flex-col items-start text-left">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">Encontros</span>
                <span className="text-sm font-semibold text-slate-600 dark:text-slate-200 transition-colors">{cell.meeting_days}{cell.meeting_time && ` às ${cell.meeting_time}`}</span>
              </div>
            </div>
          )}
          {(cell.neighborhood || cell.address) && (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0 group-hover:bg-emerald-500/20 transition-colors">
                <svg className="w-5 h-5 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
              </div>
              <div className="flex flex-col items-start text-left">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">Localização</span>
                <span className="text-sm font-semibold text-slate-600 dark:text-slate-200 transition-colors line-clamp-1">{cell.neighborhood || cell.address}</span>
              </div>
            </div>
          )}
        </div>
        
        {/* Glow Bottom Line */}
        <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" />
      </div>
    </button>
  );
}

/* ─── Modal ─────────────────────────────────────────────────── */
function CellDetailModal({ cell, onClose }: { cell: PublicCell; onClose: () => void }) {
  const typeConfig = TYPE_CONFIG[cell.meeting_type] ?? { label: cell.meeting_type, cls: 'bg-slate-500/15 text-slate-500 dark:text-slate-400', dot: 'bg-slate-400' };

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-slate-900/40 dark:bg-slate-950/90 backdrop-blur-md" />
      <div
        className="relative bg-blue-50/95 dark:bg-slate-900/50 backdrop-blur-2xl border border-blue-200/60 dark:border-white/10 rounded-t-3xl sm:rounded-3xl shadow-2xl w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden animate-modal-in portal-scroll"
        onClick={e => e.stopPropagation()}
      >
        {/* Imagem header */}
        <div className="relative h-40 sm:h-52 w-full bg-white/60 backdrop-blur-xl shadow-2xl shadow-blue-900/5 border border-white/60 dark:border-transparent dark:shadow-none dark:bg-slate-800 shrink-0 border-b border-white/60 dark:border-white/5 overflow-hidden">
          {cell.image_url ? (
            <Image src={cell.image_url} alt={cell.name} fill sizes="(max-width: 768px) 100vw, 50vw" className="object-cover" />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-slate-50 dark:from-slate-800 via-slate-50/80 dark:via-slate-800/80 to-slate-50 dark:to-slate-900">
              <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
              <svg className="w-12 h-12 text-blue-500/30" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-50 dark:from-slate-900 via-slate-50/30 dark:via-slate-900/30 to-transparent" />
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-9 h-9 bg-white/40 hover:bg-white/70 text-slate-900 dark:bg-black/50 dark:hover:bg-black/80 dark:text-white rounded-xl flex items-center justify-center transition-all duration-200 hover:scale-110 border border-white/10 backdrop-blur-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
          {/* Badge no header */}
          <div className="absolute top-4 left-4">
            <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold border px-2.5 py-1 rounded-full bg-white/40 dark:bg-slate-900/50 backdrop-blur-xl/80 backdrop-blur-md ${typeConfig.cls}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${typeConfig.dot}`} />
              {typeConfig.label}
            </span>
          </div>
        </div>

        <div className="p-6 sm:p-7 flex-1 overflow-y-auto portal-scroll">
          <div className="mb-5">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">{cell.name}</h2>
          </div>

          {/* Líderes */}
          {(cell.leader1 || cell.leader2) && (
            <div className="mb-6 p-4 bg-white/80 backdrop-blur-md dark:backdrop-blur-none border border-white/60/50 dark:border-transparent dark:bg-slate-800/50 rounded-2xl border-white/60 dark:border-white/5 flex flex-wrap gap-4 items-center">
              {[cell.leader1, cell.leader2].filter(Boolean).map((leader, i) => {
                const LeaderTag = leader!.instagram_url ? 'a' : 'div';
                const tagProps = leader!.instagram_url ? { href: leader!.instagram_url, target: '_blank', rel: 'noreferrer' } : {};
                return (
                  <LeaderTag key={i} {...tagProps} className={`flex items-center gap-3 ${leader!.instagram_url ? 'hover:bg-black/5 dark:bg-white/5 p-2 rounded-xl transition-colors cursor-pointer group' : ''}`}>
                    {leader?.photo_url ? (
                      <div className="relative w-10 h-10 rounded-full overflow-hidden ring-2 ring-white/10 shadow-lg shrink-0">
                        <Image src={leader.photo_url} alt={leader.name} fill sizes="40px" className="object-cover object-top" />
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center ring-2 ring-blue-500/20">
                        <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
                      </div>
                    )}
                    <div>
                      <span className="block text-[10px] font-semibold text-slate-500 mb-0.5 uppercase tracking-wide">Líder {i + 1}</span>
                      <span className="block text-sm font-semibold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-300 transition-colors">
                        {leader!.name}
                        {leader!.instagram_url && <svg className="inline w-3 h-3 text-fuchsia-500 dark:text-fuchsia-400 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>}
                      </span>
                    </div>
                  </LeaderTag>
                )
              })}
            </div>
          )}

          <div className="space-y-4 text-sm text-slate-600 dark:text-slate-300">
            {cell.description && (
              <p className="leading-relaxed mb-4 bg-white/80 backdrop-blur-md dark:backdrop-blur-none border border-white/60/50 dark:border-transparent dark:bg-slate-800/30 p-4 rounded-xl border-white/60 dark:border-white/5 text-slate-600 dark:text-slate-300">{cell.description}</p>
            )}

            <div className="grid sm:grid-cols-2 gap-3">
              {(cell.meeting_days || cell.meeting_time) && (
                <div className="flex items-start gap-3 p-4 rounded-xl bg-white/80 backdrop-blur-md dark:backdrop-blur-none border border-white/60/50 dark:border-transparent dark:bg-slate-800/30 border-white/60 dark:border-white/5">
                  <div className="mt-0.5 p-2 bg-blue-500/10 rounded-lg shrink-0 border border-blue-500/10">
                    <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                  </div>
                  <div>
                    <span className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wide">Encontros</span>
                    <span className="text-slate-900 dark:text-white font-medium text-sm">{cell.meeting_days}{cell.meeting_time && ` às ${cell.meeting_time}`}</span>
                  </div>
                </div>
              )}

              {(cell.neighborhood || cell.address) && (
                <div className="flex items-start gap-3 p-4 rounded-xl bg-white/80 backdrop-blur-md dark:backdrop-blur-none border border-white/60/50 dark:border-transparent dark:bg-slate-800/30 border-white/60 dark:border-white/5">
                  <div className="mt-0.5 p-2 bg-emerald-500/10 rounded-lg shrink-0 border border-emerald-500/10">
                    <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                  </div>
                  <div>
                    <span className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wide">Localização</span>
                    {cell.neighborhood && <span className="text-slate-900 dark:text-white font-medium text-sm block">{cell.neighborhood}</span>}
                    {cell.address && <span className="text-slate-500 dark:text-slate-400 text-xs block mt-1">{cell.address}</span>}
                  </div>
                </div>
              )}
            </div>

            {/* WhatsApp */}
            {(cell.contact_whatsapp || cell.contact_phone) && (
              <a
                href={`https://wa.me/${(cell.contact_whatsapp || cell.contact_phone)!.replace(/\D/g, '')}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 px-4 py-3 rounded-xl transition-colors font-medium mt-2"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.554 4.117 1.524 5.847L.054 23.03a.75.75 0 00.916.916l5.183-1.47A11.931 11.931 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.89 0-3.663-.5-5.2-1.374l-.373-.22-3.876 1.098 1.098-3.876-.22-.373A9.97 9.97 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/></svg>
                Entrar em contato via WhatsApp
              </a>
            )}

            {cell.instagram_url && (
              <a href={cell.instagram_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-sm text-fuchsia-600 dark:text-fuchsia-400 bg-fuchsia-500/10 hover:bg-fuchsia-500/20 border border-fuchsia-500/20 px-4 py-2.5 rounded-xl transition-colors font-medium">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
                Instagram da Célula
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ComingSoonPlaceholder() {
  const { ref, visible } = useScrollReveal({ threshold: 0.1 });
  return (
    <div ref={ref} className="transition-all duration-700 ease-out"
      style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(24px)' }}>
      <div className="bg-white/40 dark:bg-slate-900/50 backdrop-blur-xl/40 border border-black/6 dark:border-white/6 border-dashed rounded-3xl p-14 text-center">
        <div className="w-16 h-16 bg-blue-500/10 border border-blue-500/15 rounded-2xl flex items-center justify-center mx-auto mb-5">
          <svg className="w-8 h-8 text-blue-400/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
          </svg>
        </div>
        <p className="text-slate-500 dark:text-slate-400 font-semibold mb-2">Módulo de Células em desenvolvimento</p>
        <p className="text-slate-600 text-sm">As células serão exibidas aqui assim que o módulo for ativado.</p>
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
  const [selectedCell, setSelectedCell] = useState<PublicCell | null>(null);

  return (
    <section id="celulas" className="relative py-32 px-6 bg-transparent dark:bg-slate-950 overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-indigo-600/5 rounded-full blur-[100px]" />
        <div className="absolute top-0 left-0 w-[400px] h-[400px] bg-blue-600/4 rounded-full blur-[80px]" />
      </div>

      <div className="relative max-w-6xl mx-auto">
        <div ref={ref} className="text-center mb-16 transition-all duration-700 ease-out"
          style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(24px)' }}>
          <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold tracking-widest uppercase px-4 py-2 rounded-full mb-6">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/>
            </svg>
            Comunidade
          </div>
          <h2 className="text-4xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
            {content.title || 'Nossas Células'}
          </h2>
          {content.subtitle && <p className="mt-4 text-lg text-slate-500 dark:text-slate-400 max-w-xl mx-auto leading-relaxed">{content.subtitle}</p>}
        </div>

        {cells.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {cells.map((cell, i) => (
              <CellCard key={cell.id} cell={cell} index={i} onClick={() => setSelectedCell(cell)} />
            ))}
          </div>
        ) : (
          <ComingSoonPlaceholder />
        )}
      </div>

      {selectedCell && (
        <CellDetailModal cell={selectedCell} onClose={() => setSelectedCell(null)} />
      )}
    </section>
  );
}