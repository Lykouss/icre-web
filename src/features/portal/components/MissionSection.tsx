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

/* ── Ícones SVG por pilar ── */
const PILLAR_SVG_MAP: Record<string, React.ReactNode> = {
  amor: (
    <svg viewBox="0 0 48 48" fill="none" className="w-full h-full">
      <path d="M24 40s-16-10-16-21a8 8 0 0116 0 8 8 0 0116 0c0 11-16 21-16 21z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" fill="currentColor" fillOpacity="0.15"/>
      <path d="M24 40s-16-10-16-21a8 8 0 0116 0 8 8 0 0116 0c0 11-16 21-16 21z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
    </svg>
  ),
  fe: (
    <svg viewBox="0 0 48 48" fill="none" className="w-full h-full">
      <rect x="8" y="6" width="32" height="36" rx="3" stroke="currentColor" strokeWidth="2" fill="currentColor" fillOpacity="0.1"/>
      <path d="M14 16h20M14 22h20M14 28h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <path d="M24 6V4M20 6V4M28 6V4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  ),
  esperanca: (
    <svg viewBox="0 0 48 48" fill="none" className="w-full h-full">
      <path d="M24 8l3.7 7.5L36 16.9l-6 5.8 1.4 8.3L24 26.7l-7.4 4.3 1.4-8.3-6-5.8 8.3-1.4L24 8z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" fill="currentColor" fillOpacity="0.15"/>
      <path d="M24 36v5M12 38l2-3M36 38l-2-3" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  ),
  oracao: (
    <svg viewBox="0 0 48 48" fill="none" className="w-full h-full">
      <path d="M18 10c0-4 4-7 7-4M24 6c3-3 7 0 7 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <path d="M14 14s-2 8 2 14c2 3 5 5 8 6 3-1 6-3 8-6 4-6 2-14 2-14" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" fill="currentColor" fillOpacity="0.1"/>
      <path d="M19 28c1 4 3 8 5 10M29 28c-1 4-3 8-5 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  ),
  comunidade: (
    <svg viewBox="0 0 48 48" fill="none" className="w-full h-full">
      <circle cx="24" cy="14" r="5" stroke="currentColor" strokeWidth="2" fill="currentColor" fillOpacity="0.1"/>
      <circle cx="10" cy="18" r="4" stroke="currentColor" strokeWidth="2" fill="currentColor" fillOpacity="0.1"/>
      <circle cx="38" cy="18" r="4" stroke="currentColor" strokeWidth="2" fill="currentColor" fillOpacity="0.1"/>
      <path d="M12 38c0-6 5-10 12-10s12 4 12 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <path d="M2 38c0-4 3-7 8-8M46 38c0-4-3-7-8-8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  ),
  crescimento: (
    <svg viewBox="0 0 48 48" fill="none" className="w-full h-full">
      <path d="M24 40V20" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <path d="M24 20c0-8 8-12 8-12s0 10-8 12z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" fill="currentColor" fillOpacity="0.15"/>
      <path d="M24 26c0-6-7-9-7-9s0 8 7 9z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" fill="currentColor" fillOpacity="0.15"/>
      <path d="M16 40h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  ),
  missao: (
    <svg viewBox="0 0 48 48" fill="none" className="w-full h-full">
      <circle cx="24" cy="24" r="16" stroke="currentColor" strokeWidth="2" fill="currentColor" fillOpacity="0.08"/>
      <path d="M8 24h32M24 8c-4 4-6 10-6 16s2 12 6 16M24 8c4 4 6 10 6 16s-2 12-6 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <circle cx="24" cy="24" r="3" fill="currentColor" fillOpacity="0.6"/>
    </svg>
  ),
  default: (
    <svg viewBox="0 0 48 48" fill="none" className="w-full h-full">
      <path d="M24 8l3.7 7.5L36 16.9l-6 5.8 1.4 8.3L24 26.7l-7.4 4.3 1.4-8.3-6-5.8 8.3-1.4L24 8z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" fill="currentColor" fillOpacity="0.15"/>
    </svg>
  ),
};

const PILLAR_COLORS = [
  { text: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20', glow: 'group-hover:shadow-blue-500/15', accent: 'via-blue-500/40' },
  { text: 'text-indigo-400', bg: 'bg-indigo-500/10', border: 'border-indigo-500/20', glow: 'group-hover:shadow-indigo-500/15', accent: 'via-indigo-500/40' },
  { text: 'text-violet-400', bg: 'bg-violet-500/10', border: 'border-violet-500/20', glow: 'group-hover:shadow-violet-500/15', accent: 'via-violet-500/40' },
  { text: 'text-sky-400', bg: 'bg-sky-500/10', border: 'border-sky-500/20', glow: 'group-hover:shadow-sky-500/15', accent: 'via-sky-500/40' },
  { text: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/20', glow: 'group-hover:shadow-cyan-500/15', accent: 'via-cyan-500/40' },
  { text: 'text-teal-400', bg: 'bg-teal-500/10', border: 'border-teal-500/20', glow: 'group-hover:shadow-teal-500/15', accent: 'via-teal-500/40' },
];

function getPillarIcon(title: string): React.ReactNode {
  const t = title.toLowerCase();
  if (t.includes('amor') || t.includes('love')) return PILLAR_SVG_MAP.amor;
  if (t.includes('fé') || t.includes('fe') || t.includes('biblia') || t.includes('palavra')) return PILLAR_SVG_MAP.fe;
  if (t.includes('esperança') || t.includes('esperanca') || t.includes('luz')) return PILLAR_SVG_MAP.esperanca;
  if (t.includes('oração') || t.includes('oracao') || t.includes('pray')) return PILLAR_SVG_MAP.oracao;
  if (t.includes('comunidade') || t.includes('família') || t.includes('familia') || t.includes('pessoas')) return PILLAR_SVG_MAP.comunidade;
  if (t.includes('crescimento') || t.includes('discipul') || t.includes('vida')) return PILLAR_SVG_MAP.crescimento;
  if (t.includes('missão') || t.includes('missao') || t.includes('evangelh') || t.includes('mundo')) return PILLAR_SVG_MAP.missao;
  return PILLAR_SVG_MAP.default;
}

function StatCard({ icon, value, suffix, label, index, active }: {
  icon: React.ReactNode; value: number; suffix: string; label: string; index: number; active: boolean;
}) {
  const count = useCounter(value, active, 1600 + index * 200);
  const { ref, visible } = useScrollReveal<HTMLDivElement>({ threshold: 0.1 });

  return (
    <div
      ref={ref}
      className="relative text-center px-4 transition-all duration-500 ease-out"
      style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(24px)', transitionDelay: `${index * 120}ms` }}
    >
      {/* Divisor vertical (exceto no último) */}
      {index < 2 && (
        <div className="absolute right-0 top-1/2 -translate-y-1/2 h-12 w-px bg-gradient-to-b from-transparent via-white/10 to-transparent" />
      )}
      <div className="inline-flex items-center justify-center w-14 h-14 bg-blue-500/10 border border-blue-500/20 rounded-2xl text-blue-400 mb-4 mx-auto">
        {icon}
      </div>
      <div className="text-4xl sm:text-5xl font-black text-slate-900 dark:text-white tabular-nums leading-none">
        {count}{suffix}
      </div>
      <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 font-medium">{label}</p>
    </div>
  );
}

function PillarCard({ item, index }: { item: MissionItem; index: number }) {
  const { ref, visible } = useScrollReveal<HTMLDivElement>({ threshold: 0.1 });
  const color = PILLAR_COLORS[index % PILLAR_COLORS.length];
  const icon = getPillarIcon(item.title);

  return (
    <div
      ref={ref}
      className={`group relative bg-white/60 dark:bg-slate-900/50 backdrop-blur-xl/60 backdrop-blur-sm border border-black/5 dark:border-white/8 rounded-3xl p-8 hover:border-white/16 hover:-translate-y-2 hover:shadow-2xl ${color.glow} transition-all duration-500 ease-out overflow-hidden`}
      style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(32px)', transitionDelay: `${index * 100}ms` }}
    >
      {/* Glow background no hover */}
      <div className={`absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br from-white/[0.02] to-transparent`} />

      {/* Ícone SVG ilustrativo */}
      <div className={`relative w-14 h-14 ${color.bg} border ${color.border} rounded-2xl p-3 ${color.text} mb-6 transition-all duration-300 group-hover:scale-110 group-hover:rotate-3`}>
        {icon}
      </div>

      <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3 leading-tight">{item.title}</h3>
      <p className="text-slate-500 dark:text-slate-400 leading-relaxed text-sm">{item.text}</p>

      {/* Linha decorativa no hover */}
      <div className={`absolute bottom-0 left-8 right-8 h-px bg-gradient-to-r from-transparent ${color.accent} to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-center`} />
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
    <section id="missao" className="relative py-32 px-6 bg-transparent dark:bg-slate-950 overflow-hidden">
      {/* Blurs de fundo */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-blue-600/6 rounded-full blur-[140px]" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-indigo-600/5 rounded-full blur-[100px]" />
      </div>

      <div className="relative max-w-6xl mx-auto">
        {/* Header */}
        <div
          ref={headerRef}
          className="text-center mb-20 transition-all duration-700 ease-out"
          style={{ opacity: headerVisible ? 1 : 0, transform: headerVisible ? 'translateY(0)' : 'translateY(24px)' }}
        >
          <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold tracking-widest uppercase px-4 py-2 rounded-full mb-6">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
            </svg>
            Propósito
          </div>
          <h2 className="text-4xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight mb-6">
            {content.title || 'Nossa Missão'}
          </h2>
          {/* Linha decorativa */}
          <div className="flex items-center justify-center gap-3">
            <div className="h-px w-12 bg-gradient-to-r from-transparent to-blue-500/60" />
            <div className="w-1.5 h-1.5 rounded-full bg-blue-500/60" />
            <div className="h-px w-12 bg-gradient-to-l from-transparent to-blue-500/60" />
          </div>
        </div>

        {/* Stats */}
        <div
          ref={statsRef}
          className="grid grid-cols-3 gap-0 mb-24 p-8 bg-blue-100 backdrop-blur-xl dark:backdrop-blur-none border border-blue-300/60 dark:border-transparent dark:bg-slate-800/40 rounded-3xl shadow-2xl shadow-blue-900/10"
        >
          <StatCard icon={STAT_ICONS[0]} value={Number(content.active_members) || 500} suffix="+" label="Membros ativos" index={0} active={statsVisible} />
          <StatCard icon={STAT_ICONS[1]} value={Number(content.active_cells) || 4}   suffix=""  label="Células ativas"  index={1} active={statsVisible} />
          <StatCard icon={STAT_ICONS[2]} value={Number(content.history_years) || 33}  suffix=""  label="Anos de história" index={2} active={statsVisible} />
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