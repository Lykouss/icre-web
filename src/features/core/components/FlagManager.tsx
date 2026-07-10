'use client';

import React, { useState, useTransition } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  updateFlagStatus,
  updateFlagActive,
  scheduleMaintenance,
  grantEarlyAccessToRandomUsers,
  type FlagStatus,
} from '@/features/core/actions/flag-management';

interface FlagManagerProps {
  slug: string;
  name: string;
  description: string;
  initialIsActive: boolean;
  initialStatus: FlagStatus | null;
  initialMaintenanceAt: string | null;
}

const STATUS_OPTIONS: { value: FlagStatus; label: string; color: string; bg: string; border: string; glow: string; description: string; icon: React.ReactNode }[] = [
  { 
    value: 'normal',       
    label: 'Operação Normal',                
    color: '#34d399', 
    bg: 'rgba(16, 185, 129, 0.1)', 
    border: 'rgba(16, 185, 129, 0.2)',
    glow: 'shadow-emerald-500/10',
    description: 'Módulo em funcionamento saudável para todos.',
    icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
  },
  { 
    value: 'novo',         
    label: 'Novo Recurso',                  
    color: '#60a5fa',     
    bg: 'rgba(59, 130, 246, 0.1)',         
    border: 'rgba(59, 130, 246, 0.2)',
    glow: 'shadow-blue-500/10',
    description: 'Badge "Novo" visível até o primeiro acesso.',
    icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-7.714 2.143L11 21l-2.286-6.857L1 12l7.714-2.143L11 3z" /></svg>
  },
  { 
    value: 'antecipado',   
    label: 'Acesso Antecipado',     
    color: '#fbbf24',   
    bg: 'rgba(245, 158, 11, 0.1)',     
    border: 'rgba(245, 158, 11, 0.2)',
    glow: 'shadow-amber-500/10',
    description: 'Exclusivo para usuários selecionados via sorteio.',
    icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>
  },
  { 
    value: 'desenvolvimento', 
    label: 'Lab / Dev', 
    color: '#c084fc',  
    bg: 'rgba(168, 85, 247, 0.1)',   
    border: 'rgba(168, 85, 247, 0.2)',
    glow: 'shadow-violet-500/10',
    description: 'Apenas desenvolvedores e SysAdmins visualizam.',
    icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>
  },
  { 
    value: 'manutencao',   
    label: 'Manutenção',         
    color: '#f87171',     
    bg: 'rgba(239, 68, 68, 0.1)',         
    border: 'rgba(239, 68, 68, 0.2)',
    glow: 'shadow-red-500/10',
    description: 'Módulo bloqueado para usuários comuns.',
    icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
  },
  { 
    value: 'inativo',      
    label: 'Offline / Inativo',               
    color: '#94a3b8',   
    bg: 'rgba(255, 255, 255, 0.05)',     
    border: 'rgba(255, 255, 255, 0.1)',
    glow: '',
    description: 'Completamente oculto do menu de navegação.',
    icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
  },
  { 
    value: 'indisponivel', 
    label: 'Legado / Remover', 
    color: '#fb923c', 
    bg: 'rgba(249, 115, 22, 0.1)', 
    border: 'rgba(249, 115, 22, 0.2)',
    glow: '',
    description: 'Sinaliza que o recurso será removido em breve.',
    icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
  },
  { 
    value: 'movido',       
    label: 'Recurso Movido',                
    color: '#818cf8',  
    bg: 'rgba(99, 102, 241, 0.1)',   
    border: 'rgba(99, 102, 241, 0.2)',
    glow: '',
    description: 'Sinaliza alteração permanente de localização.',
    icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
  },
];

function Toast({ message, type }: { message: string; type: 'success' | 'error' }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className={`flex items-center gap-2.5 text-xs px-4 py-2.5 rounded-2xl font-bold backdrop-blur-md border ${
        type === 'success' 
          ? 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20' 
          : 'bg-red-500/10 text-red-700 border-red-500/20'
      } shadow-lg`}
    >
      {type === 'success' ? (
        <div className="w-4 h-4 bg-emerald-500 text-slate-900 dark:text-white rounded-full flex items-center justify-center">
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="4"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
        </div>
      ) : (
        <div className="w-4 h-4 bg-red-500 text-slate-900 dark:text-white rounded-full flex items-center justify-center">
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="4"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
        </div>
      )}
      {message}
    </motion.div>
  );
}

export function FlagManager({
  slug,
  name,
  description,
  initialIsActive,
  initialStatus,
  initialMaintenanceAt,
}: FlagManagerProps) {
  const [isPending, startTransition] = useTransition();
  const [isActive, setIsActive] = useState(initialIsActive);
  const [status, setStatus] = useState<FlagStatus>(initialStatus ?? 'normal');
  const [maintenanceAt, setMaintenanceAt] = useState(initialMaintenanceAt ? new Date(initialMaintenanceAt).toISOString().slice(0, 16) : '');
  const [earlyAccessCount, setEarlyAccessCount] = useState(5);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [expanded, setExpanded] = useState(false);

  function showToast(message: string, type: 'success' | 'error') {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }

  function handleToggleActive() {
    const next = !isActive;
    setIsActive(next);
    startTransition(async () => {
      const r = await updateFlagActive(slug, next);
      if (r.error) { setIsActive(!next); showToast(r.error, 'error'); }
      else showToast(next ? 'Módulo ativado com sucesso' : 'Módulo desativado', 'success');
    });
  }

  function handleStatusChange(newStatus: FlagStatus) {
    if (newStatus === status) return;
    setStatus(newStatus);
    startTransition(async () => {
      const r = await updateFlagStatus(slug, newStatus);
      if (r.error) showToast(r.error, 'error');
      else showToast(`Status alterado para ${newStatus}`, 'success');
    });
  }

  function handleScheduleMaintenance() {
    if (!maintenanceAt) return showToast('Selecione data e hora', 'error');
    startTransition(async () => {
      const r = await scheduleMaintenance(slug, new Date(maintenanceAt).toISOString());
      if (r.error) showToast(r.error, 'error');
      else { showToast('Manutenção agendada com sucesso', 'success'); }
    });
  }

  function handleCancelMaintenance() {
    startTransition(async () => {
      const r = await scheduleMaintenance(slug, null);
      if (r.error) showToast(r.error, 'error');
      else { setMaintenanceAt(''); setStatus('normal'); showToast('Manutenção cancelada', 'success'); }
    });
  }

  function handleEarlyAccess() {
    startTransition(async () => {
      const r = await grantEarlyAccessToRandomUsers(slug, earlyAccessCount);
      if (r.error) showToast(r.error, 'error');
      else { setStatus('antecipado'); showToast(`${r.selectedCount} usuários sorteados!`, 'success'); }
    });
  }

  const currentStatusOption = STATUS_OPTIONS.find((s) => s.value === status) ?? STATUS_OPTIONS[0];

  return (
    <div 
      className={`
        relative rounded-[1.5rem] transition-all duration-300 overflow-hidden border
        ${expanded ? 'border-blue-500/50 shadow-2xl shadow-blue-500/10' : 'border-transparent hover:border-slate-700/50 shadow-sm hover:shadow-md'}
      `}
      style={{ background: expanded ? 'var(--admin-surface-alt)' : 'var(--admin-surface)' }}
    >
      {/* Background decoration - subtle color wash */}
      <div className={`absolute top-0 right-0 w-32 h-32 blur-[60px] opacity-[0.1] pointer-events-none transition-colors duration-700`} style={{ background: currentStatusOption.color }} />

      {/* Main Header Row */}
      <div className="flex items-center gap-5 p-5 md:p-6 cursor-pointer group" onClick={() => setExpanded(!expanded)}>
        {/* Toggle Logic */}
        <div onClick={(e) => e.stopPropagation()} className="shrink-0 flex items-center">
          <button
            type="button"
            disabled={isPending}
            onClick={handleToggleActive}
            className={`
              relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-300
              ${isActive ? 'bg-blue-600 shadow-lg shadow-blue-500/30' : 'bg-slate-300'}
              disabled:opacity-50
            `}
          >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform duration-300 ${isActive ? 'translate-x-6' : 'translate-x-1'}`} />
          </button>
        </div>

        {/* Module Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h3 className="font-bold text-lg tracking-tight transition-colors" style={{ color: 'var(--admin-text-primary)' }}>{name}</h3>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter"
              style={{ background: currentStatusOption.bg, color: currentStatusOption.color, border: `1px solid ${currentStatusOption.border}` }}>
              <div className={`w-1.5 h-1.5 rounded-full ${status === 'manutencao' || status === 'novo' ? 'animate-pulse' : ''}`} style={{ background: 'currentColor' }} />
              {currentStatusOption.label}
            </span>
            {maintenanceAt && new Date() < new Date(maintenanceAt) && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter"
                style={{ background: 'var(--admin-surface-alt)', color: 'var(--admin-text-muted)', border: '1px solid var(--admin-border)' }}>
                ⏰ Agendado
              </span>
            )}
          </div>
          <p className="text-sm mt-0.5 max-w-lg line-clamp-1" style={{ color: 'var(--admin-text-secondary)' }}>{description}</p>
        </div>

        {/* Action area */}
        <div className="flex items-center gap-4">
           <AnimatePresence>
            {toast && <Toast message={toast.message} type={toast.type} />}
          </AnimatePresence>
          <div className="p-2 rounded-xl transition-all"
            style={{
              background: expanded ? 'rgba(59, 130, 246, 0.1)' : 'var(--admin-surface-alt)',
              color: expanded ? '#3b82f6' : 'var(--admin-text-muted)',
              transform: expanded ? 'rotate(180deg)' : 'none'
            }}>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
          </div>
        </div>
      </div>

      {/* Expanded Controls */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
          >
            <div className="px-6 pb-8 pt-2 space-y-8 border-t" style={{ borderColor: 'var(--admin-border)' }}>
              
              {/* Status Selector Grid */}
              <section>
                <header className="flex items-center gap-2 mb-4">
                  <div className="w-1 h-3.5 bg-blue-500 rounded-full" />
                  <h4 className="text-[10px] font-black uppercase tracking-widest" style={{ color: 'var(--admin-text-secondary)' }}>Configuração de Status</h4>
                </header>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                  {STATUS_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      disabled={isPending}
                      onClick={(e) => { e.stopPropagation(); handleStatusChange(opt.value); }}
                      className="relative flex flex-col items-start p-4 rounded-2xl border text-left transition-all duration-200"
                      style={{
                        background: status === opt.value ? opt.bg : 'var(--admin-surface-alt)',
                        borderColor: status === opt.value ? opt.border : 'var(--admin-border)',
                      }}
                    >
                      <div className="mb-3 p-2 rounded-xl" style={{ background: status === opt.value ? 'var(--admin-surface)' : 'rgba(255,255,255,0.02)', color: opt.color, border: `1px solid ${status === opt.value ? opt.border : 'transparent'}` }}>
                        {opt.icon}
                      </div>
                      <span className="text-[13px] font-bold" style={{ color: status === opt.value ? opt.color : 'var(--admin-text-primary)' }}>{opt.label}</span>
                      <p className="text-[11px] mt-1 lines-clamp-2 leading-relaxed" style={{ color: 'var(--admin-text-secondary)' }}>{opt.description}</p>
                      
                      {status === opt.value && (
                        <motion.div layoutId={`active-dot-${slug}`} className="absolute top-3 right-3 w-1.5 h-1.5 rounded-full" style={{ background: opt.color }} />
                      )}
                    </button>
                  ))}
                </div>
              </section>

              {/* Advanced Actions Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                
                {/* Maintenance Scheduler */}
                <div className="p-6 rounded-2xl border shadow-sm transition-shadow" style={{ background: 'var(--admin-surface)', borderColor: 'var(--admin-border)' }}>
                  <header className="flex items-center justify-between mb-4">
                    <h5 className="text-[11px] font-black uppercase tracking-widest flex items-center gap-2" style={{ color: 'var(--admin-text-secondary)' }}>
                      <svg className="w-4 h-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      Agendamento
                    </h5>
                    {status === 'manutencao' && (
                      <span className="flex h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                    )}
                  </header>
                  
                  <p className="text-xs mb-5 leading-relaxed" style={{ color: 'var(--admin-text-secondary)' }}>Programa o contador de 15 min para todos os usuários.</p>
                  
                  <div className="flex gap-2">
                    <input
                      type="datetime-local"
                      value={maintenanceAt}
                      onChange={(e) => setMaintenanceAt(e.target.value)}
                      className="flex-1 border text-xs rounded-xl px-4 py-2.5 focus:outline-none focus:border-blue-500 transition-all"
                      style={{ background: 'var(--admin-surface-alt)', color: 'var(--admin-text-primary)', borderColor: 'var(--admin-border)' }}
                    />
                    {maintenanceAt || status === 'manutencao' ? (
                      <button onClick={(e) => { e.stopPropagation(); handleCancelMaintenance(); }} className="px-4 py-2.5 rounded-xl font-bold text-xs transition-all" style={{ background: 'var(--admin-surface-alt)', color: 'var(--admin-text-secondary)' }}>Limpar</button>
                    ) : null}
                     <button
                      disabled={isPending || !maintenanceAt}
                      onClick={(e) => { e.stopPropagation(); handleScheduleMaintenance(); }}
                      className="px-5 py-2.5 text-slate-900 dark:text-white font-bold text-xs rounded-xl shadow-lg transition-all disabled:opacity-30"
                      style={{ background: 'var(--admin-accent)' }}
                    >
                      Agendar
                    </button>
                  </div>
                </div>

                {/* Raffle Selection */}
                <div className="p-6 rounded-2xl border shadow-sm transition-shadow" style={{ background: 'var(--admin-surface)', borderColor: 'var(--admin-border)' }}>
                  <header className="flex items-center gap-2 mb-4">
                    <h5 className="text-[11px] font-black uppercase tracking-widest flex items-center gap-2" style={{ color: 'var(--admin-text-secondary)' }}>
                      <svg className="w-4 h-4 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                      Sorteio de Acesso
                    </h5>
                  </header>
                  
                   <p className="text-xs mb-5 leading-relaxed" style={{ color: 'var(--admin-text-secondary)' }}>Conceda acesso antecipado para usuários aleatórios.</p>
                   
                   <div className="flex items-center gap-4">
                    <div className="flex items-center border rounded-xl p-1 gap-1" style={{ background: 'var(--admin-surface-alt)', borderColor: 'var(--admin-border)' }}>
                      <button onClick={(e) => { e.stopPropagation(); setEarlyAccessCount(Math.max(1, earlyAccessCount - 1)); }} className="w-8 h-8 flex items-center justify-center rounded-lg ml-1 font-bold" style={{ color: 'var(--admin-text-muted)' }}>ー</button>
                      <span className="w-8 text-center font-bold text-sm" style={{ color: 'var(--admin-text-primary)' }}>{earlyAccessCount}</span>
                      <button onClick={(e) => { e.stopPropagation(); setEarlyAccessCount(earlyAccessCount + 1); }} className="w-8 h-8 flex items-center justify-center rounded-lg mr-1 font-bold" style={{ color: 'var(--admin-text-muted)' }}>＋</button>
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-tighter" style={{ color: 'var(--admin-text-muted)' }}>perfis</span>
                    <button
                      disabled={isPending}
                      onClick={(e) => { e.stopPropagation(); handleEarlyAccess(); }}
                      className="ml-auto px-6 py-2.5 text-slate-900 dark:text-white font-bold text-xs rounded-xl shadow-lg transition-all"
                      style={{ background: 'var(--admin-accent)' }}
                    >
                      SORTEAR
                    </button>
                   </div>
                </div>

              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
