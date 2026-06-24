'use client'

import { useState } from 'react';
import type { DbHealthData, TableStat, BucketStat, ModuleStat, RecentAuditLog } from '@/features/core/actions/db-health';

const ACTION_LABELS: Record<string, string> = {
  CREATE:               'Cadastro',
  UPDATE:               'Edição',
  UPDATE_NOTES:         'Anotação',
  UPDATE_SPIRITUAL:     'Trilha espiritual',
  UPDATE_MINISTRIES:    'Ministérios',
  GRANT_ROLE:           'Cargo concedido',
  REVOKE_ROLE:          'Cargo revogado',
  SUSPEND_ACCESS:       'Suspensão',
  UNSUSPEND_ACCESS:     'Reativação',
  RESET_PIN:            'PIN redefinido',
  RESET_PASSWORD:       'Senha redefinida',
  CREATE_TRANSACTION:   'Nova transação',
  DELETE_TRANSACTION:   'Transação excluída',
  CLOSE_MONTH:          'Fechamento de caixa',
  CREATE_RECURRING:     'Recorrente criado',
  DELETE_RECURRING:     'Recorrente excluído',
};

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function TableIcon({ icon }: { icon: string }) {
  switch (icon) {
    case 'users':    return <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
    case 'profile':  return <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>;
    case 'calendar': return <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>;
    case 'ticket':   return <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" /></svg>;
    case 'money':    return <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
    case 'lock':     return <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>;
    case 'home':     return <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>;
    case 'log':      return <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>;
    case 'layout':   return <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm0 8a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zm12-1a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" /></svg>;
    case 'image':    return <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>;
    case 'pastor':   return <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
    default:         return <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" /></svg>;
  }
}

function StatCard({ stat }: { stat: TableStat }) {
  return (
    <div className="rounded-2xl border p-5 transition-all group" style={{ background: 'var(--admin-surface)', borderColor: 'var(--admin-border)' }}>
      <div className="flex items-start justify-between mb-4">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center transition-colors"
             style={{ background: 'var(--admin-surface-alt)', color: 'var(--admin-text-secondary)' }}>
          <TableIcon icon={stat.icon} />
        </div>
        <span className="text-2xl font-black tabular-nums" style={{ color: 'var(--admin-text-primary)' }}>
          {stat.count.toLocaleString('pt-BR')}
        </span>
      </div>
      <p className="text-sm font-medium" style={{ color: 'var(--admin-text-secondary)' }}>{stat.label}</p>
      <p className="text-xs mt-0.5" style={{ color: 'var(--admin-text-muted)' }}>{stat.name}</p>
    </div>
  );
}

function BucketCard({ bucket }: { bucket: BucketStat }) {
  const pct = Math.min(100, (bucket.usedBytes / bucket.quotaBytes) * 100);
  const barColor =
    pct > 85 ? 'bg-red-500' :
    pct > 60 ? 'bg-amber-500' :
    'bg-blue-500';
  const labelColor =
    pct > 85 ? 'text-red-400' :
    pct > 60 ? 'text-amber-400' :
    'text-slate-300';

  return (
    <div className="rounded-2xl border p-5" style={{ background: 'var(--admin-surface)', borderColor: 'var(--admin-border)' }}>
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-semibold" style={{ color: 'var(--admin-text-primary)' }}>{bucket.label}</p>
        <span className="text-xs font-medium px-2 py-1 rounded-lg" style={{ background: 'var(--admin-surface-alt)', color: 'var(--admin-text-secondary)' }}>
          {bucket.fileCount} arquivo{bucket.fileCount !== 1 ? 's' : ''}
        </span>
      </div>
      <div className="w-full rounded-full h-2 mb-2" style={{ background: 'var(--admin-surface-alt)' }}>
        <div
          className={`h-2 rounded-full transition-all duration-700 ${barColor}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="flex items-center justify-between text-xs">
        <span className={`font-semibold ${labelColor}`}>{formatBytes(bucket.usedBytes)}</span>
        <span style={{ color: 'var(--admin-text-muted)' }}>de {formatBytes(bucket.quotaBytes)}</span>
      </div>
      {pct > 85 && (
        <div className="mt-3 flex items-center gap-1.5 text-xs text-red-400 border rounded-lg px-3 py-2"
          style={{ background: 'rgba(239, 68, 68, 0.1)', borderColor: 'rgba(239, 68, 68, 0.2)' }}>
          <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          Espaço quase esgotado
        </div>
      )}
    </div>
  );
}

function ModuleRow({ mod }: { mod: ModuleStat }) {
  return (
    <div className="flex items-center justify-between px-4 py-3 rounded-xl hover:bg-slate-800/50 transition-colors">
      <div className="flex items-center gap-3">
        <div className={`w-2 h-2 rounded-full shrink-0 ${mod.is_active ? 'bg-emerald-500' : 'bg-slate-600'}`} />
        <div>
          <p className="text-sm font-medium" style={{ color: 'var(--admin-text-primary)' }}>{mod.name}</p>
          <p className="text-xs" style={{ color: 'var(--admin-text-muted)' }}>{mod.slug}</p>
        </div>
      </div>
      <span className="text-[11px] font-bold px-2.5 py-1 rounded-full" style={{
        background: mod.is_active ? 'rgba(16, 185, 129, 0.1)' : 'var(--admin-surface-alt)',
        color: mod.is_active ? '#34d399' : 'var(--admin-text-muted)'
      }}>
        {mod.is_active ? 'Ativo' : 'Inativo'}
      </span>
    </div>
  );
}

function LogRow({ log }: { log: RecentAuditLog }) {
  return (
    <div className="flex items-center gap-4 px-4 py-3 rounded-xl" style={{ background: 'var(--admin-surface-alt)' }}>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold truncate" style={{ color: 'var(--admin-text-primary)' }}>
            {ACTION_LABELS[log.action] ?? log.action}
          </p>
          <span className="text-xs px-2 py-0.5 rounded-md shrink-0" style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--admin-text-muted)' }}>
            {log.entity_name}
          </span>
        </div>
        <p className="text-xs mt-0.5" style={{ color: 'var(--admin-text-secondary)' }}>
          {log.actor_name} · {log.actor_role}
        </p>
      </div>
      <p className="text-[11px] whitespace-nowrap shrink-0" style={{ color: 'var(--admin-text-muted)' }}>
        {new Date(log.created_at).toLocaleString('pt-BR', {
          day: '2-digit', month: '2-digit',
          hour: '2-digit', minute: '2-digit',
        })}
      </p>
    </div>
  );
}

type Tab = 'tabelas' | 'storage' | 'modulos' | 'logs';

interface DbHealthClientProps {
  data: DbHealthData;
}

export function DbHealthClient({ data }: DbHealthClientProps) {
  const [tab, setTab] = useState<Tab>('tabelas');

  const totalRecords = data.tables.reduce((sum, t) => sum + t.count, 0);
  const totalStorage = data.buckets.reduce((sum, b) => sum + b.usedBytes, 0);
  const activeModules = data.modules.filter(m => m.is_active).length;

  const tabs: { id: Tab; label: string; count?: string }[] = [
    { id: 'tabelas', label: 'Tabelas',     count: data.tables.length.toString() },
    { id: 'storage', label: 'Storage',     count: data.buckets.length.toString() },
    { id: 'modulos', label: 'Módulos',     count: `${activeModules}/${data.modules.length}` },
    { id: 'logs',    label: 'Atividade recente', count: data.recentLogs.length.toString() },
  ];

  return (
    <div className="space-y-6">

      {/* Cards de resumo */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total de usuários',  value: data.totalUsers.toLocaleString('pt-BR'),    color: '#60a5fa', bg: 'rgba(59, 130, 246, 0.1)'    },
          { label: 'Total de registros', value: totalRecords.toLocaleString('pt-BR'),       color: '#94a3b8', bg: 'var(--admin-surface-alt)'     },
          { label: 'Storage total',      value: formatBytes(totalStorage),                  color: '#c084fc', bg: 'rgba(168, 85, 247, 0.1)' },
          { label: 'Módulos ativos',     value: `${activeModules}/${data.modules.length}`,  color: '#34d399', bg: 'rgba(16, 185, 129, 0.1)' },
        ].map(card => (
          <div key={card.label} className="rounded-2xl p-5" style={{ background: card.bg }}>
            <p className="text-xs font-medium" style={{ color: 'var(--admin-text-secondary)' }}>{card.label}</p>
            <p className="text-2xl font-black mt-1" style={{ color: card.color }}>{card.value}</p>
          </div>
        ))}
      </div>

      {/* Abas */}
      <div className="rounded-2xl border overflow-hidden" style={{ background: 'var(--admin-surface)', borderColor: 'var(--admin-border)' }}>
        <div className="flex overflow-x-auto border-b" style={{ borderColor: 'var(--admin-border)' }}>
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-5 py-3.5 text-sm font-semibold whitespace-nowrap border-b-2 -mb-px transition-colors ${
                tab === t.id
                  ? 'border-blue-500 text-blue-400'
                  : 'border-transparent text-slate-400 hover:text-slate-300'
              }`}
            >
              {t.label}
              {t.count !== undefined && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold ${
                  tab === t.id ? 'bg-blue-500/20 text-blue-400' : 'bg-white/5 text-slate-400'
                }`}>
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="p-4 min-h-[400px]">

          {/* Tabelas */}
          {tab === 'tabelas' && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {data.tables.map(stat => <StatCard key={stat.name} stat={stat} />)}
            </div>
          )}

          {/* Storage */}
          {tab === 'storage' && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {data.buckets.map(b => <BucketCard key={b.name} bucket={b} />)}
            </div>
          )}

          {/* Módulos */}
          {tab === 'modulos' && (
            <div className="space-y-1">
              {data.modules.length === 0 ? (
                <p className="text-sm text-center py-8" style={{ color: 'var(--admin-text-muted)' }}>Nenhum módulo encontrado.</p>
              ) : (
                data.modules.map(mod => <ModuleRow key={mod.slug} mod={mod} />)
              )}
            </div>
          )}

          {/* Logs */}
          {tab === 'logs' && (
            <div className="space-y-2">
              {data.recentLogs.length === 0 ? (
                <p className="text-sm text-center py-8" style={{ color: 'var(--admin-text-muted)' }}>Nenhuma atividade recente.</p>
              ) : (
                data.recentLogs.map(log => <LogRow key={log.id} log={log} />)
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}