'use client'

import { useState } from 'react';
import { useScrollReveal } from '@/features/core/hooks/use-scroll-reveal';
import Image from 'next/image';
import type { Pastor, PastorsSectionContent } from '@/features/portal/types';

function PastorModal({ pastor, onClose }: { pastor: Pastor; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-white dark:bg-slate-950/90 backdrop-blur-md" />
      <div
        className="relative bg-slate-50 dark:bg-slate-900 border border-black/10 dark:border-white/10 rounded-t-3xl sm:rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-modal-in"
        onClick={e => e.stopPropagation()}
      >
        <div className="relative w-full aspect-[4/3] bg-slate-800 overflow-hidden">
          {pastor.photo_url ? (
            <Image src={pastor.photo_url} alt={pastor.name} fill sizes="(max-width: 768px) 100vw, 448px" className="object-cover object-top" />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-slate-800 via-slate-800 to-slate-900">
              <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
              <svg className="w-20 h-20 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
              </svg>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/20 to-transparent" />
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 w-9 h-9 bg-black/40 hover:bg-black/70 text-slate-900 dark:text-white rounded-xl flex items-center justify-center transition-all duration-200 hover:scale-110 border border-black/10 dark:border-white/10 backdrop-blur-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
          <div className="absolute bottom-0 left-0 right-0 p-6">
            <p className={`text-xs font-bold uppercase tracking-[0.2em] mb-1.5 ${pastor.is_president ? 'text-yellow-400' : 'text-blue-400'}`}>{pastor.role}</p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white leading-tight">{pastor.name}</h3>
          </div>
        </div>
        <div className="p-6">
          {pastor.bio
            ? <p className="text-slate-500 dark:text-slate-400 leading-relaxed text-sm mb-5">{pastor.bio}</p>
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

function PastorCard({ pastor, index, isPresident, embedded }: { pastor: Pastor; index: number, isPresident?: boolean, embedded?: boolean }) {
  const { ref, visible } = useScrollReveal<HTMLDivElement>({ threshold: 0.08 });
  const [open, setOpen] = useState(false);

  const themeColor = isPresident ? 'yellow' : 'blue';
  const borderHover = isPresident ? 'hover:border-yellow-500/30' : 'hover:border-blue-500/30';
  const shadowHover = isPresident ? 'hover:shadow-yellow-500/20' : 'hover:shadow-blue-500/8';
  const textRole = isPresident ? 'text-yellow-400' : 'text-blue-400';
  const textNameHover = isPresident ? 'group-hover:text-yellow-200' : 'group-hover:text-blue-200';
  const gradLine = isPresident ? 'from-yellow-500 to-amber-500' : 'from-blue-500 to-indigo-500';
  const badgeBg = isPresident ? 'bg-yellow-600/90' : 'bg-blue-600/90';

  const wrapperClass = `group relative bg-slate-50 dark:bg-slate-900/60 backdrop-blur-sm border ${isPresident ? 'border-yellow-500/20' : 'border-black/5 dark:border-white/8'} rounded-3xl overflow-hidden cursor-pointer ${borderHover} hover:-translate-y-2 hover:shadow-2xl ${shadowHover} transition-all duration-400 ease-out h-full flex flex-col w-full`;

  return (
    <>
      <div
        ref={!embedded ? ref : undefined}
        onClick={() => setOpen(true)}
        className={wrapperClass}
        style={!embedded ? { opacity: visible ? 1 : 0, transform: visible ? 'translate3d(0,0,0)' : 'translate3d(0,40px,0)', transitionDelay: `${index * 90}ms` } : {}}
      >
        <div className="relative w-full aspect-[3/4] bg-slate-800 overflow-hidden shrink-0">
          {pastor.photo_url ? (
            <Image src={pastor.photo_url} alt={pastor.name} fill sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 320px" className="object-cover object-top group-hover:scale-105 transition-transform duration-600 ease-out will-change-transform" />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900">
              <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
              <svg className="w-16 h-16 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
              </svg>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/10 to-transparent" />
          <div className="absolute inset-0 flex items-end justify-end p-4 opacity-0 group-hover:opacity-100 transition-all duration-300">
            <span className={`inline-flex items-center gap-1.5 ${badgeBg} backdrop-blur-sm text-slate-900 dark:text-white text-xs font-bold px-3 py-1.5 rounded-xl translate-y-2 group-hover:translate-y-0 transition-transform duration-300`}>
              Ver perfil
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7"/></svg>
            </span>
          </div>
        </div>
        <div className="p-5 flex-1 flex flex-col">
          <p className={`text-xs font-bold uppercase tracking-[0.18em] mb-1.5 ${textRole}`}>{pastor.role}</p>
          <h3 className={`text-lg font-bold text-slate-900 dark:text-white mb-2 transition-colors duration-200 ${textNameHover}`}>{pastor.name}</h3>
          <div className="mt-auto pt-2">
            {pastor.bio ? (
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-2">{pastor.bio}</p>
            ) : (
              <p className="text-sm text-transparent select-none line-clamp-2">Sem biografia</p>
            )}
          </div>
        </div>
        <div className={`absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r ${gradLine} scale-x-0 group-hover:scale-x-100 transition-transform duration-400 origin-left`} />
      </div>
      {open && <PastorModal pastor={pastor} onClose={() => setOpen(false)} />}
    </>
  );
}

function CoupleCard({ p1, p2, index, isPresident }: { p1: Pastor; p2: Pastor, index: number, isPresident?: boolean }) {
  const { ref, visible } = useScrollReveal<HTMLDivElement>({ threshold: 0.1 });
  
  return (
    <div 
      ref={ref} 
      className={`relative flex flex-col sm:flex-row items-stretch gap-4 sm:gap-8 p-4 sm:p-6 rounded-[2.5rem] bg-slate-50 dark:bg-slate-900/40 border border-black/5 dark:border-white/5 backdrop-blur-sm transition-all duration-700 ease-out`}
      style={{ opacity: visible ? 1 : 0, transform: visible ? 'translate3d(0,0,0)' : 'translate3d(0,40px,0)', transitionDelay: `${index * 90}ms` }}
    >
      {isPresident && <div className="absolute -inset-0.5 bg-gradient-to-r from-yellow-500/20 to-amber-500/20 rounded-[2.5rem] blur-xl opacity-60 pointer-events-none" />}
      
      <div className="flex-1 w-full sm:w-[280px] md:w-[320px] max-w-[320px] flex">
        <PastorCard pastor={p1} index={0} isPresident={isPresident} embedded />
      </div>
      
      <div className="w-12 h-12 shrink-0 flex items-center justify-center rounded-full bg-slate-800 border border-black/10 dark:border-white/10 shadow-xl z-10 -my-6 sm:my-auto sm:-mx-10 relative">
        <div className="absolute inset-0 rounded-full border border-black/5 dark:border-white/5 bg-slate-800/80 backdrop-blur-md" />
        <svg className={`w-5 h-5 relative z-10 ${isPresident ? 'text-yellow-400' : 'text-indigo-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
        </svg>
      </div>

      <div className="flex-1 w-full sm:w-[280px] md:w-[320px] max-w-[320px] flex">
        <PastorCard pastor={p2} index={1} isPresident={isPresident} embedded />
      </div>
    </div>
  );
}

function pairPastors(pastorsList: Pastor[]) {
  const pairedIds = new Set<string>();
  const results: (Pastor | [Pastor, Pastor])[] = [];

  for (const p of pastorsList) {
    if (pairedIds.has(p.id)) continue;
    if (p.spouse_id) {
      const spouse = pastorsList.find(x => x.id === p.spouse_id);
      if (spouse) {
        // order: president first if mixed, or just left-to-right
        results.push([p, spouse]);
        pairedIds.add(p.id);
        pairedIds.add(spouse.id);
        continue;
      }
    }
    results.push(p);
    pairedIds.add(p.id);
  }
  return results;
}

interface Props {
  content: PastorsSectionContent;
  pastors: Pastor[];
}

export function PastorsSection({ content, pastors }: Props) {
  const { ref, visible } = useScrollReveal({ threshold: 0.1 });
  
  const presidents = pastors.filter(p => p.is_president);
  const others = pastors.filter(p => !p.is_president);
  
  const presidentPairs = pairPastors(presidents);
  const otherPairs = pairPastors(others);

  const sortByCoupleFirst = (a: Pastor | [Pastor, Pastor], b: Pastor | [Pastor, Pastor]) => {
    const aIsCouple = Array.isArray(a);
    const bIsCouple = Array.isArray(b);
    if (aIsCouple && !bIsCouple) return -1;
    if (!aIsCouple && bIsCouple) return 1;
    
    // Explicit fallback to sort_order
    const aSort = aIsCouple ? Math.min((a as [Pastor, Pastor])[0].sort_order ?? 0, (a as [Pastor, Pastor])[1].sort_order ?? 0) : ((a as Pastor).sort_order ?? 0);
    const bSort = bIsCouple ? Math.min((b as [Pastor, Pastor])[0].sort_order ?? 0, (b as [Pastor, Pastor])[1].sort_order ?? 0) : ((b as Pastor).sort_order ?? 0);
    
    return aSort - bSort;
  };

  presidentPairs.sort(sortByCoupleFirst);
  otherPairs.sort(sortByCoupleFirst);

  return (
    <section id="lideranca" className="relative py-32 px-6 bg-white dark:bg-slate-950 overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-600/6 rounded-full blur-[110px] hidden md:block" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-600/5 rounded-full blur-[90px] hidden md:block" />
      </div>

      <div className="relative max-w-6xl mx-auto flex flex-col items-center">
        
        {/* Título e Subtítulo */}
        <div ref={ref} className="text-center mb-16 sm:mb-20 transition-all duration-700 ease-out flex flex-col items-center"
          style={{ opacity: visible ? 1 : 0, transform: visible ? 'translate3d(0,0,0)' : 'translate3d(0,24px,0)' }}>
          <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold tracking-widest uppercase px-4 py-2 rounded-full mb-6">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
            </svg>
            Liderança
          </div>
          <h2 className="text-4xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight mb-3">
            {content.title || 'Nossa Liderança'}
          </h2>
          {content.subtitle && <p className="mt-4 text-lg text-slate-500 dark:text-slate-400 max-w-xl mx-auto leading-relaxed">{content.subtitle}</p>}
        </div>

        {/* Jesus - Cruz */}
        <div className="relative flex justify-center mb-20 sm:mb-28 z-10 w-full animate-fade-in-up">
          <div className="relative">
            {/* Glow background */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[250px] sm:w-[350px] h-[250px] sm:h-[350px] bg-amber-500/15 rounded-full blur-[80px] animate-pulse" style={{ animationDuration: '4s' }} />
            {/* Cross shape */}
            <div className="relative flex flex-col items-center drop-shadow-[0_0_20px_rgba(251,191,36,0.6)]">
              <div className="w-2 sm:w-2.5 h-24 sm:h-32 bg-gradient-to-b from-yellow-100 via-amber-300 to-amber-600 rounded-t-full shadow-[0_0_25px_rgba(251,191,36,0.9)]" />
              <div className="absolute top-8 sm:top-10 w-16 sm:w-20 h-2 sm:h-2.5 bg-gradient-to-r from-yellow-100 via-amber-300 to-amber-600 rounded-full shadow-[0_0_25px_rgba(251,191,36,0.9)]" />
            </div>
          </div>
          <div className="absolute -bottom-16 text-center">
            <h3 className="text-xl sm:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 to-amber-500 tracking-widest uppercase">Jesus Cristo</h3>
            <p className="text-[10px] text-amber-500/70 font-semibold tracking-[0.3em] uppercase mt-1">Nossa Rocha Eterna</p>
          </div>
        </div>

        {pastors.length > 0 ? (
          <div className="w-full flex flex-col items-center gap-16">
            
            {/* Presidentes */}
            {presidentPairs.length > 0 && (
              <div className="w-full flex flex-col items-center gap-10">
                {presidentPairs.map((item, i) => (
                  Array.isArray(item) 
                    ? <CoupleCard key={`pres-couple-${i}`} p1={item[0]} p2={item[1]} index={i} isPresident />
                    : <div key={item.id} className="w-full sm:w-[280px] md:w-[320px] max-w-[320px]"><PastorCard pastor={item} index={i} isPresident /></div>
                ))}
              </div>
            )}

            {/* Linha divisória se houver presidentes e outros */}
            {presidentPairs.length > 0 && otherPairs.length > 0 && (
              <div className="w-full max-w-2xl flex items-center justify-center gap-4 opacity-30 my-4">
                <div className="h-px flex-1 bg-gradient-to-r from-transparent to-white/50" />
                <div className="w-1.5 h-1.5 rounded-full bg-white/50" />
                <div className="h-px flex-1 bg-gradient-to-l from-transparent to-white/50" />
              </div>
            )}

            {/* Demais Pastores */}
            {otherPairs.length > 0 && (
              <div className="w-full flex flex-wrap justify-center gap-8 items-stretch">
                {otherPairs.map((item, i) => (
                  Array.isArray(item)
                    ? <CoupleCard key={`other-couple-${i}`} p1={item[0]} p2={item[1]} index={i + presidentPairs.length} />
                    : <div key={item.id} className="w-full sm:w-[280px] md:w-[320px] max-w-[320px] flex"><PastorCard pastor={item} index={i + presidentPairs.length} /></div>
                ))}
              </div>
            )}

          </div>
        ) : (
          <div className="w-full max-w-2xl bg-slate-50 dark:bg-slate-900/40 border border-white/6 border-dashed rounded-3xl p-14 text-center">
            <div className="w-16 h-16 bg-indigo-500/10 border border-indigo-500/15 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <svg className="w-8 h-8 text-indigo-400/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/>
              </svg>
            </div>
            <p className="text-slate-500 dark:text-slate-400 font-semibold mb-2">Liderança em breve</p>
            <p className="text-slate-600 text-sm">Os líderes serão exibidos aqui assim que forem cadastrados no painel.</p>
          </div>
        )}
      </div>
    </section>
  );
}