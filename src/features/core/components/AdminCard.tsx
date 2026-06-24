import React from 'react';

/* ─── AdminCard ────────────────────────────────────────────────
   Card padrão escuro para todo o sistema admin.
   Suporta hover lift, header com ícone e título, children.
──────────────────────────────────────────────────────────────── */

interface AdminCardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  /** Nível de profundidade de fundo (padrão: surface) */
  depth?: 'surface' | 'surface-alt' | 'bg';
}

export function AdminCard({ children, className = '', hover = false, depth = 'surface' }: AdminCardProps) {
  const bg =
    depth === 'bg'          ? 'var(--admin-bg)' :
    depth === 'surface-alt' ? 'var(--admin-surface-alt)' :
                              'var(--admin-surface)';
  return (
    <div
      className={`rounded-2xl border transition-all duration-200 ${hover ? 'hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/30' : ''} ${className}`}
      style={{
        background: bg,
        borderColor: 'var(--admin-border)',
        ...(hover ? {} : {}),
      }}
    >
      {children}
    </div>
  );
}

/* ─── AdminCardHeader ──────────────────────────────────────────── */
interface AdminCardHeaderProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

export function AdminCardHeader({ title, description, icon, action, className = '' }: AdminCardHeaderProps) {
  return (
    <div
      className={`flex items-center justify-between px-5 py-4 border-b ${className}`}
      style={{ borderColor: 'var(--admin-border)' }}
    >
      <div className="flex items-center gap-3 min-w-0">
        {icon && (
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-blue-400"
            style={{ background: 'var(--admin-accent-dim)', border: '1px solid var(--admin-accent-border)' }}
          >
            {icon}
          </div>
        )}
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-200 leading-tight">{title}</p>
          {description && <p className="text-[11px] mt-0.5" style={{ color: 'var(--admin-text-secondary)' }}>{description}</p>}
        </div>
      </div>
      {action && <div className="shrink-0 ml-3">{action}</div>}
    </div>
  );
}

/* ─── AdminCardBody ────────────────────────────────────────────── */
export function AdminCardBody({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`p-5 ${className}`}>
      {children}
    </div>
  );
}

/* ─── AdminStatCard ────────────────────────────────────────────── */
interface AdminStatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: { value: string; positive: boolean };
  accentColor?: string;
  className?: string;
}

export function AdminStatCard({ label, value, icon, trend, accentColor = '#3b82f6', className = '' }: AdminStatCardProps) {
  return (
    <div
      className={`rounded-2xl border p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-black/30 ${className}`}
      style={{
        background: 'var(--admin-surface)',
        borderColor: 'var(--admin-border)',
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--admin-text-secondary)' }}>{label}</p>
          <p className="text-2xl font-bold text-slate-100 leading-none">{value}</p>
          {trend && (
            <p className={`text-[11px] font-semibold mt-2 flex items-center gap-1 ${trend.positive ? 'text-emerald-400' : 'text-red-400'}`}>
              <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d={trend.positive ? 'M7 17L17 7M17 7H7M17 7v10' : 'M7 7l10 10M17 17H7M17 17V7'} />
              </svg>
              {trend.value}
            </p>
          )}
        </div>
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
          style={{
            background: `${accentColor}18`,
            border: `1px solid ${accentColor}30`,
            color: accentColor,
          }}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}
