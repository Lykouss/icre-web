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
  <svg key="a" className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
  <svg key="b" className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>,
  <svg key="c" className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>,
];

const PILLAR_COLORS = [
  { text: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100' },
  { text: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-100' },
  { text: 'text-violet-600', bg: 'bg-violet-50', border: 'border-violet-100' },
  { text: 'text-sky-600', bg: 'bg-sky-50', border: 'border-sky-100' },
  { text: 'text-cyan-600', bg: 'bg-cyan-50', border: 'border-cyan-100' },
  { text: 'text-teal-600', bg: 'bg-teal-50', border: 'border-teal-100' },
];

function StatCard({ icon, value, suffix, label, index, active }: {
  icon: React.ReactNode; value: number; suffix: string; label: string; index: number; active: boolean;
}) {
  const count = useCounter(value, active, 1600 + index * 200);
  const { ref, visible } = useScrollReveal<HTMLDivElement>({ threshold: 0.1 });

  return (
    <div
      ref={ref}
      className="relative text-center px-4 transition-all duration-500 ease-out"
      style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(20px)', transitionDelay: `${index * 100}ms` }}
    >
      {index < 2 && (
        <div className="absolute right-0 top-1/2 -translate-y-1/2 h-10 w-px bg-gray-200 dark:bg-slate-700" />
      )}
      <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/30 rounded-xl text-blue-600 dark:text-blue-400 mb-3 mx-auto transition-colors">
        {icon}
      </div>
      <div className="text-4xl sm:text-5xl font-black text-gray-900 dark:text-white tabular-nums leading-none transition-colors">
        {count}{suffix}
      </div>
      <p className="text-sm text-gray-500 dark:text-slate-400 mt-2 font-medium transition-colors">{label}</p>
    </div>
  );
}

function PillarCard({ item, index }: { item: MissionItem; index: number }) {
  const { ref, visible } = useScrollReveal<HTMLDivElement>({ threshold: 0.1 });
  const color = PILLAR_COLORS[index % PILLAR_COLORS.length];

  return (
    <div
      ref={ref}
      className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl p-6 hover:shadow-md hover:-translate-y-1 transition-all duration-300 ease-out"
      style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(24px)', transitionDelay: `${index * 80}ms` }}
    >
      <div className={`w-11 h-11 ${color.bg} border ${color.border} rounded-xl flex items-center justify-center ${color.text} mb-5`}>
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3l14 9-14 9V3z" />
        </svg>
      </div>
      <h3 className="text-base font-bold text-gray-900 dark:text-white mb-2 leading-tight transition-colors">{item.title}</h3>
      <p className="text-gray-500 dark:text-slate-400 leading-relaxed text-sm transition-colors">{item.text}</p>
    </div>
  );
}

interface Props {
  content: MissionContent;
}

export function MissionSection({ content }: Props) {
  const { ref: headerRef, visible: headerVisible } = useScrollReveal({ threshold: 0.1 });
  const { ref: statsRef, visible: statsVisible } = useScrollReveal({ threshold: 0.2 });

  const items = (content.items ?? []) as MissionItem[];

  return (
    <section id="missao" className="relative py-24 px-6 bg-gray-50 dark:bg-slate-900/80 overflow-hidden transition-colors duration-300" data-theme="light">
      <div className="relative max-w-6xl mx-auto">

        {/* Header */}
        <div
          ref={headerRef}
          className="text-center mb-16 transition-all duration-700 ease-out"
          style={{ opacity: headerVisible ? 1 : 0, transform: headerVisible ? 'translateY(0)' : 'translateY(20px)' }}
        >
          <span className="inline-block text-xs font-bold text-blue-600 dark:text-blue-400 tracking-widest uppercase bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/30 px-3 py-1.5 rounded-full mb-5 transition-colors">
            Propósito
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-gray-900 dark:text-white tracking-tight transition-colors">
            {content.title || 'Nossa Missão'}
          </h2>
          <div className="mt-4 flex justify-center">
            <div className="h-1 w-12 bg-blue-600 rounded-full" />
          </div>
        </div>

        {/* Stats */}
        <div
          ref={statsRef}
          className="grid grid-cols-3 gap-0 mb-16 p-8 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl shadow-sm transition-colors"
        >
          <StatCard icon={STAT_ICONS[0]} value={500} suffix="+" label="Membros ativos" index={0} active={statsVisible} />
          <StatCard icon={STAT_ICONS[1]} value={4}   suffix=""  label="Células ativas"  index={1} active={statsVisible} />
          <StatCard icon={STAT_ICONS[2]} value={33}  suffix=""  label="Anos de história" index={2} active={statsVisible} />
        </div>

        {/* Pilares */}
        {items.length > 0 && (
          <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-${Math.min(items.length, 3)} gap-5`}>
            {items.map((item, i) => <PillarCard key={i} item={item} index={i} />)}
          </div>
        )}
      </div>
    </section>
  );
}