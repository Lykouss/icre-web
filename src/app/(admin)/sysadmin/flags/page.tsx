import React from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/features/core/api/get-current-user';
import { FlagManager } from '@/features/core/components/FlagManager';
import type { FlagStatus } from '@/features/core/actions/flag-management';

interface FeatureFlagRecord {
  slug: string;
  name: string;
  description: string;
  is_active: boolean;
  status: FlagStatus | null;
  maintenance_scheduled_at: string | null;
}

export default async function FlagsPage() {
  const user = await getCurrentUser();
  if (!user?.isSysAdmin) redirect('/dashboard');

  const supabase = await createClient();
  const { data: flags, error } = await supabase
    .from('feature_flags')
    .select('slug, name, description, is_active, status, maintenance_scheduled_at')
    .order('name');

  if (error) console.error('Erro ao buscar flags:', error);

  const flagsList = (flags as FeatureFlagRecord[]) || [];
  
  const activeCount = flagsList.filter(f => f.is_active).length;
  const maintenanceCount = flagsList.filter(f => f.status === 'manutencao').length;
  const devCount = flagsList.filter(f => f.status === 'desenvolvimento' || f.status === 'novo').length;

  return (
    <div className="max-w-5xl mx-auto space-y-10 pb-20">
      {/* ── Breadcrumb & Title ── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 overflow-hidden">
        <div className="space-y-1">
          <Link href="/sysadmin"
            className="group inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.2em] mb-2 transition-all"
            style={{ color: 'var(--admin-text-muted)' }}
          >
            <svg className="w-3 h-3 transform group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Voltar ao Painel
          </Link>
          <h1 className="text-2xl font-extrabold text-slate-100 tracking-tight">Gestão de Módulos</h1>
          <p className="text-sm max-w-md leading-relaxed" style={{ color: 'var(--admin-text-secondary)' }}>
            Controle de visibilidade, deploy progressivo e status de manutenção.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex flex-col items-end">
            <div className="flex items-center gap-2 text-[10px] font-bold px-3 py-1.5 rounded-full" style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', color: '#34d399' }}>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Sincronização Realtime
            </div>
            <span className="text-[9px] mt-1 uppercase tracking-widest font-black" style={{ color: 'var(--admin-text-muted)' }}>Broadcast Ativo</span>
          </div>
        </div>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {[
          { label: 'Módulos Ativos',   value: activeCount,      color: '#34d399', dot: 'bg-emerald-400', sub: 'Em produção agora' },
          { label: 'Sob Manutenção', value: maintenanceCount,  color: '#f87171', dot: 'bg-red-400',     sub: 'Acesso restrito' },
          { label: 'Fase Experimental', value: devCount,         color: '#c4b5fd', dot: 'bg-violet-400',  sub: 'Novidades e Lab' },
        ].map(s => (
          <div key={s.label} className="p-6 rounded-2xl transition-all"
            style={{ background: 'var(--admin-surface)', border: '1px solid var(--admin-border)' }}>
            <span className="text-[10px] font-black uppercase tracking-widest block mb-2" style={{ color: 'var(--admin-text-muted)' }}>{s.label}</span>
            <div className="text-4xl font-black" style={{ color: s.color }}>{s.value}</div>
            <div className="mt-4 flex items-center gap-1.5">
              <div className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
              <p className="text-[10px] font-bold uppercase tracking-tighter" style={{ color: 'var(--admin-text-secondary)' }}>{s.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── List ── */}
      <section className="space-y-6">
        <header className="flex items-center justify-between pb-4" style={{ borderBottom: '1px solid var(--admin-border)' }}>
          <div className="flex items-center gap-3">
            <div className="w-1 h-6 rounded-full" style={{ background: 'var(--admin-accent)' }} />
            <h2 className="text-[15px] font-bold text-slate-100 tracking-tight">Recursos do Ecossistema</h2>
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: 'var(--admin-text-muted)' }}>{flagsList.length} módulos</span>
        </header>

        <div className="flex flex-col gap-4">
          {flagsList.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-20 rounded-[3rem] border-2 border-dashed" style={{ background: 'var(--admin-surface)', borderColor: 'var(--admin-border)', color: 'var(--admin-text-secondary)' }}>
              <svg className="w-16 h-16 mb-4 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              <p className="text-sm font-bold uppercase tracking-widest">Nenhum módulo encontrado</p>
            </div>
          ) : (
            flagsList.map((flag) => (
              <FlagManager
                key={flag.slug}
                slug={flag.slug}
                name={flag.name}
                description={flag.description}
                initialIsActive={flag.is_active}
                initialStatus={flag.status}
                initialMaintenanceAt={flag.maintenance_scheduled_at}
              />
            ))
          )}
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="pt-10 flex flex-wrap items-center justify-center gap-x-12 gap-y-4">
        {[
          { label: 'Visível ao Público',  dot: 'bg-emerald-500' },
          { label: 'Somente SysAdmin',  dot: 'bg-violet-500' },
          { label: 'Grupos VIP / Early', dot: 'bg-amber-500' },
          { label: 'Módulo Inativo',    dot: 'bg-slate-600' },
        ].map(l => (
          <div key={l.label} className="flex items-center gap-2">
            <div className={`w-1.5 h-1.5 rounded-full ${l.dot}`} />
            <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: 'var(--admin-text-muted)' }}>{l.label}</span>
          </div>
        ))}
      </footer>
    </div>
  );
}