'use client'

import React from 'react';
import Link from 'next/link';

interface Module {
  href: string;
  title: string;
  description: string;
  color: string;
  available: boolean;
  icon: React.ReactNode;
}

export function SysAdminCards({ modules }: { modules: Module[] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      {modules.map(mod => {
        const card = (
          <div
            key={mod.href + mod.title}
            className={`group relative flex flex-col h-full p-6 rounded-2xl transition-all duration-200 ${mod.available && mod.href !== '#' ? 'cursor-pointer' : 'opacity-60 cursor-not-allowed'}`}
            style={{
              background: 'var(--admin-surface)',
              border: '1px solid var(--admin-border)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
            }}
            onMouseEnter={e => {
              if (mod.available && mod.href !== '#') {
                e.currentTarget.style.borderColor = `${mod.color}40`;
                e.currentTarget.style.boxShadow = `0 8px 24px rgba(0,0,0,0.3), 0 0 0 1px ${mod.color}20`;
                e.currentTarget.style.transform = 'translateY(-2px)';
              }
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = 'var(--admin-border)';
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.2)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            {!mod.available && (
              <div className="absolute top-3 right-3 text-[9px] font-bold px-2 py-1 rounded-lg"
                style={{ background: 'rgba(245,158,11,0.1)', color: '#fbbf24' }}>
                Em breve
              </div>
            )}
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center mb-5 transition-transform duration-200 group-hover:scale-105"
              style={{ background: `${mod.color}15`, border: `1px solid ${mod.color}25`, color: mod.color }}
            >
              {mod.icon}
            </div>
            <h3 className="text-[15px] font-bold text-slate-100 mb-2">{mod.title}</h3>
            <p className="text-[12px] leading-relaxed flex-grow" style={{ color: 'var(--admin-text-secondary)' }}>
              {mod.description}
            </p>
            {mod.available && mod.href !== '#' && (
              <div className="mt-5 flex items-center gap-1 text-[12px] font-bold" style={{ color: mod.color }}>
                Acessar painel
                <svg className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"/>
                </svg>
              </div>
            )}
          </div>
        );

        return mod.available && mod.href !== '#'
          ? <Link key={mod.title} href={mod.href} className="contents">{card}</Link>
          : <React.Fragment key={mod.title}>{card}</React.Fragment>;
      })}
    </div>
  );
}
