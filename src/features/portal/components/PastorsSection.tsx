'use client'

import { useState } from 'react';
import { useScrollReveal } from '@/features/core/hooks/use-scroll-reveal';
import type { Pastor, PastorsSectionContent } from '@/features/portal/types';

function PastorModal({ pastor, onClose }: { pastor: Pastor; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md" />
      <div
        className="relative bg-slate-900 border border-white/10 rounded-t-3xl sm:rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-modal-in"
        onClick={e => e.stopPropagation()}
      >
        {/* Header com imagem */}
        <div className="relative w-full aspect-[4/3] bg-slate-800 overflow-hidden">
          {pastor.photo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={pastor.photo_url} alt={pastor.name} className="w-full h-full object-cover object-top" />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-slate-800 via-slate-800 to-slate-900">
              <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
              <svg className="w-20 h-20 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
              </svg>
            </div>
          )}
          {/* Gradiente sobre a imagem */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/20 to-transparent" />

          {/* Fechar */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 w-9 h-9 bg-black/40 hover:bg-black/70 text-white rounded-xl flex items-center justify-center transition-all duration-200 hover:scale-110 border border-white/10 backdrop-blur-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>

          {/* Texto sobre a imagem */}
          <div className="absolute bottom-0 left-0 right-0 p-6">
            <p className="text-xs font-bold text-blue-400 uppercase tracking-[0.2em] mb-1.5">{pastor.role}</p>
            <h3 className="text-2xl font-black text-white leading-tight">{pastor.name}</h3>
          </div>
        </div>

        {/* Corpo */}
        <div className="p-6">
          {pastor.bio
            ? <p className="text-slate-400 leading-relaxed text-sm mb-5">{pastor.bio}</p>
            : <p className="text-slate-600 text-sm italic mb-5">Sem biografia disponível.</p>
          }
          {pastor.instagram_url && (
            <a
              href={pastor.instagram_url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 text-sm text-fuchsia-400 bg-fuchsia-500/10 hover:bg-fuchsia-500/20 border border-fuchsia-500/20 px-4 py-2.5 rounded-xl transition-all duration-200 font-medium hover:scale-[1.02]"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
              Instagram
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

function PastorCard({ pastor, index }: { pastor: Pastor; index: number }) {
  const { ref, visible } = useScrollReveal<HTMLDivElement>({ threshold: 0.08 });
  const [open, setOpen] = useState(false);

  return (
    <>
      <div
        ref={ref}
        onClick={() => setOpen(true)}
        className="group relative bg-slate-900/60 backdrop-blur-sm border border-white/8 rounded-3xl overflow-hidden cursor-pointer hover:border-white/16 hover:-translate-y-2 hover:shadow-2xl hover:shadow-blue-500/8 transition-all duration-400 ease-out"
        style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(40px)', transitionDelay: `${index * 90}ms` }}
      >
        {/* Imagem */}
        <div className="relative w-full aspect-3/4 bg-slate-800 overflow-hidden">
          {pastor.photo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={pastor.photo_url} alt={pastor.name} className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-600 ease-out" />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900">
              <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
              <svg className="w-16 h-16 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
              </svg>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/10 to-transparent" />

          {/* CTA hover overlay */}
          <div className="absolute inset-0 flex items-end justify-end p-4 opacity-0 group-hover:opacity-100 transition-all duration-300">
            <span className="inline-flex items-center gap-1.5 bg-blue-600/90 backdrop-blur-sm text-white text-xs font-bold px-3 py-1.5 rounded-xl translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
              Ver perfil
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7"/></svg>
            </span>
          </div>
        </div>

        {/* Info */}
        <div className="p-5">
          <p className="text-xs font-bold text-blue-400 uppercase tracking-[0.18em] mb-1.5">{pastor.role}</p>
          <h3 className="text-lg font-bold text-white mb-2 group-hover:text-blue-200 transition-colors duration-200">{pastor.name}</h3>
          {pastor.bio && <p className="text-sm text-slate-400 leading-relaxed line-clamp-2">{pastor.bio}</p>}
        </div>

        {/* Linha inferior animada */}
        <div className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-blue-500 to-indigo-500 scale-x-0 group-hover:scale-x-100 transition-transform duration-400 origin-left" />
      </div>

      {open && <PastorModal pastor={pastor} onClose={() => setOpen(false)} />}
    </>
  );
}

interface Props {
  content: PastorsSectionContent;
  pastors: Pastor[];
}

export function PastorsSection({ content, pastors }: Props) {
  const { ref, visible } = useScrollReveal({ threshold: 0.1 });
  return (
    <section id="lideranca" className="relative py-32 px-6 bg-slate-950 overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-600/6 rounded-full blur-[110px]" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-600/5 rounded-full blur-[90px]" />
      </div>

      <div className="relative max-w-6xl mx-auto">
        <div ref={ref} className="text-center mb-16 transition-all duration-700 ease-out"
          style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(24px)' }}>
          <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold tracking-widest uppercase px-4 py-2 rounded-full mb-6">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
            </svg>
            Liderança
          </div>
          <h2 className="text-4xl sm:text-5xl font-black text-white tracking-tight mb-3">
            {content.title || 'Nossa Liderança'}
          </h2>
          {content.subtitle && <p className="mt-4 text-lg text-slate-400 max-w-xl mx-auto leading-relaxed">{content.subtitle}</p>}
          <p className="mt-3 text-xs text-slate-600">Clique em um card para conhecer melhor</p>
        </div>

        {pastors.length > 0 ? (
          <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-${Math.min(pastors.length, 3)} gap-8`}>
            {pastors.map((pastor, i) => <PastorCard key={pastor.id} pastor={pastor} index={i} />)}
          </div>
        ) : (
          <div className="bg-slate-900/40 border border-white/6 border-dashed rounded-3xl p-14 text-center">
            <div className="w-16 h-16 bg-indigo-500/10 border border-indigo-500/15 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <svg className="w-8 h-8 text-indigo-400/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/>
              </svg>
            </div>
            <p className="text-slate-400 font-semibold mb-2">Liderança em breve</p>
            <p className="text-slate-600 text-sm">Os líderes serão exibidos aqui assim que forem cadastrados no painel.</p>
          </div>
        )}
      </div>
    </section>
  );
}