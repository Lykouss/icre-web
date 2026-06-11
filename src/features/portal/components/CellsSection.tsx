'use client'

import Link from 'next/link';
import { useState } from 'react';
import { useScrollReveal } from '@/features/core/hooks/use-scroll-reveal';
import type { CellsSectionContent, PublicCell, MeetingType } from '@/features/portal/types';

const TYPE_CONFIG: Record<MeetingType, { label: string; cls: string; dot: string }> = {
  presencial: { label: 'Presencial', cls: 'bg-emerald-50 border-emerald-200 text-emerald-700', dot: 'bg-emerald-500' },
  online:     { label: 'Online',     cls: 'bg-blue-50 border-blue-200 text-blue-700',           dot: 'bg-blue-500' },
  hibrido:    { label: 'Híbrido',    cls: 'bg-violet-50 border-violet-200 text-violet-700',     dot: 'bg-violet-500' },
};

function CellCard({ cell, index, onClick }: { cell: PublicCell; index: number; onClick: () => void }) {
  const { ref, visible } = useScrollReveal<HTMLButtonElement>({ threshold: 0.06 });
  const typeConfig = TYPE_CONFIG[cell.meeting_type] ?? { label: cell.meeting_type, cls: 'bg-gray-50 border-gray-200 text-gray-600', dot: 'bg-gray-400' };

  return (
    <button
      ref={ref}
      onClick={onClick}
      className="group flex flex-col text-left bg-white border border-gray-200 rounded-2xl overflow-hidden hover:shadow-md hover:-translate-y-1 transition-all duration-300 ease-out w-full"
      style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(24px)', transitionDelay: `${index * 60}ms` }}
    >
      {/* Imagem */}
      <div className="relative h-44 bg-gray-100 shrink-0 border-b border-gray-100 w-full overflow-hidden">
        {cell.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={cell.image_url} alt={cell.name} className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-500 ease-out" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
            <svg className="w-10 h-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
            </svg>
          </div>
        )}

        {/* Badge de tipo */}
        <div className="absolute top-3 left-3">
          <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold border px-2.5 py-1 rounded-full ${typeConfig.cls}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${typeConfig.dot}`} />
            {typeConfig.label}
          </span>
        </div>
      </div>

      {/* Conteúdo */}
      <div className="p-5 flex flex-col flex-1">
        <h3 className="text-base font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors duration-200 leading-tight">{cell.name}</h3>

        {/* Líderes */}
        {(cell.leader1 || cell.leader2) && (
          <div className="flex items-center gap-2 mb-4">
            <div className="flex -space-x-2">
              {[cell.leader1, cell.leader2].filter(Boolean).map((leader, i) => (
                leader!.photo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={i} src={leader!.photo_url} alt={leader!.name} className="w-6 h-6 rounded-full object-cover object-top ring-2 ring-white" />
                ) : (
                  <div key={i} className="w-6 h-6 rounded-full bg-blue-100 ring-2 ring-white flex items-center justify-center">
                    <svg className="w-3 h-3 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                    </svg>
                  </div>
                )
              ))}
            </div>
            <span className="text-xs text-gray-500 truncate">
              {[cell.leader1, cell.leader2].filter(Boolean).map(l => l!.name).join(' & ')}
            </span>
          </div>
        )}

        {/* Info */}
        <div className="space-y-2 pt-3 border-t border-gray-100 mt-auto">
          {cell.meeting_days && (
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <svg className="w-3.5 h-3.5 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
              </svg>
              <span className="font-medium">{cell.meeting_days}{cell.meeting_time && ` · ${cell.meeting_time}`}</span>
            </div>
          )}
          {(cell.neighborhood || cell.address) && (
            <div className="flex items-start gap-2 text-xs text-gray-500">
              <svg className="w-3.5 h-3.5 text-gray-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
              </svg>
              <div className="flex flex-col">
                {cell.neighborhood && <span className="font-medium">{cell.neighborhood}</span>}
                {cell.address && <span className="text-gray-400 leading-tight mt-0.5">{cell.address}</span>}
              </div>
            </div>
          )}
        </div>
      </div>
    </button>
  );
}

/* ─── Modal ─────────────────────────────────────────────────── */
function CellDetailModal({ cell, onClose }: { cell: PublicCell; onClose: () => void }) {
  const typeConfig = TYPE_CONFIG[cell.meeting_type] ?? { label: cell.meeting_type, cls: 'bg-gray-50 text-gray-600', dot: 'bg-gray-400' };

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" />
      <div
        className="relative bg-white border border-gray-200 rounded-t-3xl sm:rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden animate-modal-in portal-scroll"
        onClick={e => e.stopPropagation()}
      >
        {/* Imagem header */}
        <div className="relative h-40 sm:h-52 w-full bg-gray-100 shrink-0 border-b border-gray-100 overflow-hidden">
          {cell.image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={cell.image_url} alt={cell.name} className="w-full h-full object-cover" />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
              <svg className="w-10 h-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>
            </div>
          )}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-9 h-9 bg-white hover:bg-gray-50 text-gray-700 rounded-xl flex items-center justify-center transition-all duration-200 shadow-sm border border-gray-200"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
          <div className="absolute top-4 left-4">
            <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold border px-2.5 py-1 rounded-full ${typeConfig.cls}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${typeConfig.dot}`} />
              {typeConfig.label}
            </span>
          </div>
        </div>

        <div className="p-6 sm:p-7 flex-1 overflow-y-auto portal-scroll">
          <div className="mb-5">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">{cell.name}</h2>
          </div>

          {/* Líderes */}
          {(cell.leader1 || cell.leader2) && (
            <div className="mb-6 p-4 bg-gray-50 rounded-xl border border-gray-200 flex flex-wrap gap-4 items-center">
              {[cell.leader1, cell.leader2].filter(Boolean).map((leader, i) => {
                const LeaderTag = leader!.instagram_url ? 'a' : 'div';
                const tagProps = leader!.instagram_url ? { href: leader!.instagram_url, target: '_blank', rel: 'noreferrer' } : {};
                return (
                  <LeaderTag key={i} {...tagProps} className={`flex items-center gap-3 ${leader!.instagram_url ? 'hover:bg-gray-100 p-2 rounded-xl transition-colors cursor-pointer group' : ''}`}>
                    {leader!.photo_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={leader!.photo_url} alt={leader!.name} className="w-10 h-10 rounded-full object-cover object-top ring-2 ring-gray-200 shadow" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center ring-2 ring-blue-100">
                        <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
                      </div>
                    )}
                    <div>
                      <span className="block text-[10px] font-semibold text-gray-400 mb-0.5 uppercase tracking-wide">Líder {i + 1}</span>
                      <span className="block text-sm font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                        {leader!.name}
                        {leader!.instagram_url && <svg className="inline w-3 h-3 text-pink-500 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>}
                      </span>
                    </div>
                  </LeaderTag>
                )
              })}
            </div>
          )}

          <div className="space-y-4 text-sm text-gray-600">
            {cell.description && (
              <p className="leading-relaxed mb-4 bg-gray-50 p-4 rounded-xl border border-gray-200 text-gray-700">{cell.description}</p>
            )}

            <div className="grid sm:grid-cols-2 gap-3">
              {(cell.meeting_days || cell.meeting_time) && (
                <div className="flex items-start gap-3 p-4 rounded-xl bg-gray-50 border border-gray-200">
                  <div className="mt-0.5 p-2 bg-blue-50 rounded-lg shrink-0 border border-blue-100">
                    <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                  </div>
                  <div>
                    <span className="block text-xs font-semibold text-gray-400 mb-1 uppercase tracking-wide">Encontros</span>
                    <span className="text-gray-900 font-medium text-sm">{cell.meeting_days}{cell.meeting_time && ` às ${cell.meeting_time}`}</span>
                  </div>
                </div>
              )}

              {(cell.neighborhood || cell.address) && (
                <div className="flex items-start gap-3 p-4 rounded-xl bg-gray-50 border border-gray-200">
                  <div className="mt-0.5 p-2 bg-emerald-50 rounded-lg shrink-0 border border-emerald-100">
                    <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                  </div>
                  <div>
                    <span className="block text-xs font-semibold text-gray-400 mb-1 uppercase tracking-wide">Localização</span>
                    {cell.neighborhood && <span className="text-gray-900 font-medium text-sm block">{cell.neighborhood}</span>}
                    {cell.address && <span className="text-gray-500 text-xs block mt-1">{cell.address}</span>}
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
                className="flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-4 py-3 rounded-xl transition-colors font-medium mt-2"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.554 4.117 1.524 5.847L.054 23.03a.75.75 0 00.916.916l5.183-1.47A11.931 11.931 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.89 0-3.663-.5-5.2-1.374l-.373-.22-3.876 1.098 1.098-3.876-.22-.373A9.97 9.97 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/></svg>
                Entrar em contato via WhatsApp
              </a>
            )}

            {cell.instagram_url && (
              <a href={cell.instagram_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-sm text-pink-600 bg-pink-50 hover:bg-pink-100 border border-pink-200 px-4 py-2.5 rounded-xl transition-colors font-medium">
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
      style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(20px)' }}>
      <div className="bg-gray-50 border border-dashed border-gray-300 rounded-2xl p-14 text-center">
        <div className="w-14 h-14 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-4">
          <svg className="w-7 h-7 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
          </svg>
        </div>
        <p className="text-gray-600 font-semibold mb-1">Módulo de Células em desenvolvimento</p>
        <p className="text-gray-400 text-sm">As células serão exibidas aqui assim que o módulo for ativado.</p>
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
    <section id="celulas" className="relative py-24 px-6 bg-gray-50 overflow-hidden" data-theme="light">
      <div className="relative max-w-6xl mx-auto">
        <div
          ref={ref}
          className="text-center mb-14 transition-all duration-700 ease-out"
          style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(20px)' }}
        >
          <span className="inline-block text-xs font-bold text-blue-600 tracking-widest uppercase bg-blue-50 border border-blue-100 px-3 py-1.5 rounded-full mb-5">
            Comunidade
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight">
            {content.title || 'Nossas Células'}
          </h2>
          {content.subtitle && <p className="mt-4 text-lg text-gray-500 max-w-xl mx-auto leading-relaxed">{content.subtitle}</p>}
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