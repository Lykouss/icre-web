'use client'

import { useEffect, useRef, useState } from 'react';
import { useScrollReveal } from '@/features/core/hooks/use-scroll-reveal';
import type { MissionContent, MissionItem } from '@/features/portal/types';

function useCounter(target: number, active: boolean, duration = 1800) {
  const [value, setValue] = useState(0);
  const started = useRef(false);

  useEffect(() => {
    if (!active || started.current || target === 0) return;
    started.current = true;
    const start = performance.now();
    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(target * eased));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [active, target, duration]);

  return value;
}

const STAT_ICONS = [
  <svg key="a" className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
  <svg key="b" className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>,
  <svg key="c" className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>,
];

function StatCard({ icon, value, suffix, label, index, active }: {
  icon: React.ReactNode; value: number; suffix: string; label: string; index: number; active: boolean;
}) {
  const count = useCounter(value, active, 1600 + index * 200);
  const { ref, visible } = useScrollReveal<HTMLDivElement>({ threshold: 0.1 });

  return (
    <div
      ref={ref}
      className="text-center transition-all duration-500 ease-out"
      style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(24px)', transitionDelay: `${index * 120}ms` }}
    >
      <div className="inline-flex items-center justify-center w-14 h-14 bg-blue-500/10 border border-blue-500/20 rounded-2xl text-blue-400 mb-4 mx-auto">
        {icon}
      </div>
      <div className="text-4xl font-black text-white tabular-nums">
        {count}{suffix}
      </div>
      <p className="text-sm text-slate-400 mt-1 font-medium">{label}</p>
    </div>
  );
}

function PillarCard({ item, index }: { item: MissionItem; index: number }) {
  const { ref, visible } = useScrollReveal<HTMLDivElement>({ threshold: 0.1 });

  return (
    <div
      ref={ref}
      className="group relative bg-slate-900/60 backdrop-blur-sm border border-white/8 rounded-3xl p-8 hover:border-blue-500/30 hover:-translate-y-2 transition-all duration-400 ease-out"
      style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(32px)', transitionDelay: `${index * 100}ms` }}
    >
      {/* Glow no hover */}
      <div className="absolute inset-0 rounded-3xl bg-blue-500/0 group-hover:bg-blue-500/3 transition-colors duration-400" />

      <div className="text-4xl mb-5">{item.icon || '✦'}</div>
      <h3 className="text-xl font-bold text-white mb-3">{item.title}</h3>
      <p className="text-slate-400 leading-relaxed text-sm">{item.text}</p>

      {/* Linha decorativa */}
      <div className="absolute bottom-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-blue-500/40 to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-400" />
    </div>
  );
}

interface Props {
  content: MissionContent;
}

export function MissionSection({ content }: Props) {
  const { ref: headerRef, visible: headerVisible } = useScrollReveal({ threshold: 0.1 });
  const { ref: statsRef, visible: statsVisible }   = useScrollReveal({ threshold: 0.2 });

  const items = (content.items ?? []) as MissionItem[];

  return (
    <section id="missao" className="relative py-32 px-6 bg-slate-900 overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[500px] bg-blue-600/5 rounded-full blur-[140px]" />
      </div>

      <div className="relative max-w-6xl mx-auto">
        {/* Header */}
        <div
          ref={headerRef}
          className="text-center mb-20 transition-all duration-700 ease-out"
          style={{ opacity: headerVisible ? 1 : 0, transform: headerVisible ? 'translateY(0)' : 'translateY(24px)' }}
        >
          <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold tracking-widest uppercase px-4 py-2 rounded-full mb-6">
            Propósito
          </div>
          <h2 className="text-4xl sm:text-5xl font-black text-white tracking-tight">
            {content.title || 'Nossa Missão'}
          </h2>
        </div>

        {/* Stats com contadores */}
        <div ref={statsRef} className="grid grid-cols-3 gap-8 mb-24 p-8 bg-slate-800/40 backdrop-blur-sm border border-white/6 rounded-3xl">
          <StatCard icon={STAT_ICONS[0]} value={500} suffix="+" label="Membros ativos" index={0} active={statsVisible} />
          <StatCard icon={STAT_ICONS[1]} value={4}  suffix=""  label="Células ativas"  index={1} active={statsVisible} />
          <StatCard icon={STAT_ICONS[2]} value={33}  suffix=""  label="Anos de história" index={2} active={statsVisible} />
        </div>

        {/* Pilares */}
        {items.length > 0 && (
          <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-${Math.min(items.length, 3)} gap-6`}>
            {items.map((item, i) => <PillarCard key={i} item={item} index={i} />)}
          </div>
        )}
      </div>
    </section>
  );
}