'use client'

import React from 'react';
import Link from 'next/link';

interface Stat {
  label: string;
  value: string | number;
  sub: string;
  color: string;
  href: string;
  icon: React.ReactNode;
}

interface ModuleItem {
  label: string;
  href: string;
  color: string;
  icon: React.ReactNode;
}

export function DashboardStats({ stats }: { stats: Stat[] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {stats.map(stat => (
        <Link
          key={stat.href}
          href={stat.href}
          className="group rounded-2xl p-5 transition-all duration-200 hover:-translate-y-0.5"
          style={{
            background: 'var(--admin-surface)',
            border: '1px solid var(--admin-border)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
          }}
          onMouseEnter={(e: React.MouseEvent<HTMLAnchorElement>) => {
            e.currentTarget.style.borderColor = `${stat.color}40`;
            e.currentTarget.style.boxShadow = `0 8px 24px rgba(0,0,0,0.3), 0 0 0 1px ${stat.color}25`;
          }}
          onMouseLeave={(e: React.MouseEvent<HTMLAnchorElement>) => {
            e.currentTarget.style.borderColor = 'var(--admin-border)';
            e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.2)';
          }}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wide mb-2" style={{ color: 'var(--admin-text-secondary)' }}>
                {stat.label}
              </p>
              <p className="text-3xl font-black text-slate-100 leading-none mb-1">{stat.value}</p>
              <p className="text-[11px] truncate" style={{ color: 'var(--admin-text-muted)' }}>{stat.sub}</p>
            </div>
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-105"
              style={{ background: `${stat.color}18`, border: `1px solid ${stat.color}30`, color: stat.color }}
            >
              {stat.icon}
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}

export function DashboardModules({ modules }: { modules: ModuleItem[] }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      {modules.map(m => (
        <Link
          key={m.href}
          href={m.href}
          className="group flex flex-col items-center justify-center gap-3 p-5 rounded-2xl transition-all duration-200 text-center hover:-translate-y-0.5"
          style={{
            background: 'var(--admin-surface)',
            border: '1px solid var(--admin-border)',
          }}
          onMouseEnter={(e: React.MouseEvent<HTMLAnchorElement>) => {
            e.currentTarget.style.borderColor = `${m.color}40`;
            e.currentTarget.style.background = `${m.color}08`;
          }}
          onMouseLeave={(e: React.MouseEvent<HTMLAnchorElement>) => {
            e.currentTarget.style.borderColor = 'var(--admin-border)';
            e.currentTarget.style.background = 'var(--admin-surface)';
          }}
        >
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center transition-transform duration-200 group-hover:scale-110"
            style={{ background: `${m.color}18`, border: `1px solid ${m.color}30`, color: m.color }}
          >
            {m.icon}
          </div>
          <span className="text-[12px] font-semibold text-slate-400 group-hover:text-slate-200 transition-colors leading-tight">
            {m.label}
          </span>
        </Link>
      ))}
    </div>
  );
}
