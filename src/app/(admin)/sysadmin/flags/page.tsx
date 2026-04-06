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
          <Link
            href="/sysadmin"
            className="group inline-flex items-center text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-blue-600 mb-2 transition-all gap-2"
          >
            <svg className="w-3.5 h-3.5 transform group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Voltar ao Painel
          </Link>
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">Gestão de Módulos</h1>
          <p className="text-slate-500 text-sm max-w-md leading-relaxed">
            Controle de visibilidade, deploy progressivo e status de manutenção.
          </p>
        </div>

        <div className="flex items-center gap-3">
           <div className="flex flex-col items-end">
              <div className="flex items-center gap-2 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full ring-1 ring-emerald-200 shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Sincronização Realtime
              </div>
              <span className="text-[9px] text-slate-400 mt-1 uppercase tracking-widest font-black">Broadcast Ativo</span>
           </div>
        </div>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Módulos Ativos</span>
          <div className="text-4xl font-black text-slate-900">{activeCount}</div>
          <div className="mt-4 flex items-center gap-1.5">
             <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
             <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter">Em produção agora</p>
          </div>
        </div>
        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Sob Manutenção</span>
          <div className="text-4xl font-black text-red-600">{maintenanceCount}</div>
          <div className="mt-4 flex items-center gap-1.5">
             <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
             <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter">Acesso restrito</p>
          </div>
        </div>
        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Fase Experimental</span>
          <div className="text-4xl font-black text-violet-600">{devCount}</div>
          <div className="mt-4 flex items-center gap-1.5">
             <div className="w-1.5 h-1.5 rounded-full bg-violet-500" />
             <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter">Novidades e Lab</p>
          </div>
        </div>
      </div>

      {/* ── List ── */}
      <section className="space-y-6">
        <header className="flex items-center justify-between border-b border-slate-100 pb-4">
           <div className="flex items-center gap-3">
              <div className="w-1.5 h-6 bg-blue-600 rounded-full" />
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">Recursos do Ecossistema</h2>
           </div>
           <span className="text-xs font-black text-slate-400 uppercase tracking-widest">{flagsList.length} módulos</span>
        </header>

        <div className="flex flex-col gap-4">
          {flagsList.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-20 rounded-[3rem] bg-slate-50 border-2 border-dashed border-slate-200 text-slate-400">
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
           { label: 'Visível ao Público', dot: 'bg-emerald-500' },
           { label: 'Somente SysAdmin', dot: 'bg-violet-500' },
           { label: 'Grupos VIP / Early', dot: 'bg-amber-500' },
           { label: 'Módulo Inativo', dot: 'bg-slate-300' },
         ].map(l => (
           <div key={l.label} className="flex items-center gap-2">
              <div className={`w-1.5 h-1.5 rounded-full ${l.dot}`} />
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{l.label}</span>
           </div>
         ))}
      </footer>
    </div>
  );
}