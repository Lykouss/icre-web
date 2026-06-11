'use client'

import { useState } from 'react';
import { useScrollReveal } from '@/features/core/hooks/use-scroll-reveal';
import type { Pastor, PastorsSectionContent } from '@/features/portal/types';

function PastorModal({ pastor, onClose }: { pastor: Pastor; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" />
      <div
        className="relative bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-t-3xl sm:rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-modal-in transition-colors"
        onClick={e => e.stopPropagation()}
      >
        {/* Header com imagem */}
        <div className="relative w-full aspect-[4/3] bg-gray-100 dark:bg-slate-700 overflow-hidden transition-colors">
          {pastor.photo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={pastor.photo_url} alt={pastor.name} className="w-full h-full object-cover object-top" />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-slate-700">
              <svg className="w-16 h-16 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
              </svg>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-gray-900/70 via-transparent to-transparent" />

          {/* Fechar */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 w-9 h-9 bg-white/90 hover:bg-white dark:bg-slate-800/90 dark:hover:bg-slate-800 text-gray-700 dark:text-slate-200 rounded-xl flex items-center justify-center transition-all duration-200 shadow-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>

          {/* Nome sobre imagem */}
          <div className="absolute bottom-0 left-0 right-0 p-5">
            <p className="text-xs font-bold text-blue-300 uppercase tracking-widest mb-1">{pastor.role}</p>
            <h3 className="text-2xl font-black text-white leading-tight">{pastor.name}</h3>
          </div>
        </div>

        {/* Corpo */}
        <div className="p-6">
          {pastor.bio
            ? <p className="text-gray-600 dark:text-slate-300 leading-relaxed text-sm mb-5 transition-colors">{pastor.bio}</p>
            : <p className="text-gray-400 dark:text-slate-500 text-sm italic mb-5 transition-colors">Sem biografia disponível.</p>
          }
          {pastor.instagram_url && (
            <a
              href={pastor.instagram_url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 text-sm text-pink-600 dark:text-pink-400 bg-pink-50 dark:bg-pink-900/20 hover:bg-pink-100 dark:hover:bg-pink-900/40 border border-pink-200 dark:border-pink-900/30 px-4 py-2.5 rounded-xl transition-all duration-200 font-medium"
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
        className="group bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl overflow-hidden cursor-pointer hover:shadow-md hover:-translate-y-1 transition-all duration-300 ease-out"
        style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(32px)', transitionDelay: `${index * 80}ms` }}
      >
        {/* Imagem */}
        <div className="relative w-full aspect-3/4 bg-gray-100 dark:bg-slate-700 overflow-hidden transition-colors">
          {pastor.photo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={pastor.photo_url} alt={pastor.name} className="w-full h-full object-cover object-top group-hover:scale-103 transition-transform duration-500 ease-out" />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-slate-700">
              <svg className="w-12 h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
              </svg>
            </div>
          )}
          {/* Overlay para CTA */}
          <div className="absolute inset-0 bg-gradient-to-t from-gray-900/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="absolute bottom-0 left-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
            <span className="inline-flex items-center gap-1.5 bg-white dark:bg-slate-800 text-gray-900 dark:text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow">
              Ver perfil
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7"/></svg>
            </span>
          </div>
        </div>

        {/* Info */}
        <div className="p-5">
          <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-1">{pastor.role}</p>
          <h3 className="text-base font-bold text-gray-900 dark:text-white mb-1.5 group-hover:text-blue-600 transition-colors duration-200">{pastor.name}</h3>
          {pastor.bio && <p className="text-sm text-gray-500 dark:text-slate-400 leading-relaxed line-clamp-2 transition-colors">{pastor.bio}</p>}
        </div>
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
    <section id="lideranca" className="relative py-24 px-6 bg-white dark:bg-slate-900 overflow-hidden transition-colors duration-300" data-theme="light">
      <div className="relative max-w-6xl mx-auto">
        <div
          ref={ref}
          className="text-center mb-14 transition-all duration-700 ease-out"
          style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(20px)' }}
        >
          <span className="inline-block text-xs font-bold text-blue-600 dark:text-blue-400 tracking-widest uppercase bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/30 px-3 py-1.5 rounded-full mb-5 transition-colors">
            Liderança
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-gray-900 dark:text-white tracking-tight mb-2 transition-colors">
            {content.title || 'Nossa Liderança'}
          </h2>
          {content.subtitle && <p className="mt-3 text-lg text-gray-500 dark:text-slate-400 max-w-xl mx-auto leading-relaxed transition-colors">{content.subtitle}</p>}
          <p className="mt-3 text-sm text-gray-400 dark:text-slate-500 transition-colors">Clique em um card para conhecer melhor</p>
        </div>

        {pastors.length > 0 ? (
          <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-${Math.min(pastors.length, 3)} gap-7`}>
            {pastors.map((pastor, i) => <PastorCard key={pastor.id} pastor={pastor} index={i} />)}
          </div>
        ) : (
          <div className="bg-gray-50 dark:bg-slate-800/50 border border-dashed border-gray-300 dark:border-slate-700 rounded-2xl p-14 text-center transition-colors">
            <div className="w-14 h-14 bg-gray-100 dark:bg-slate-800 rounded-xl flex items-center justify-center mx-auto mb-4 transition-colors">
              <svg className="w-7 h-7 text-gray-300 dark:text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/>
              </svg>
            </div>
            <p className="text-gray-600 dark:text-slate-300 font-semibold mb-1 transition-colors">Liderança em breve</p>
            <p className="text-gray-400 dark:text-slate-500 text-sm transition-colors">Os líderes serão exibidos aqui assim que forem cadastrados no painel.</p>
          </div>
        )}
      </div>
    </section>
  );
}