'use client'

import React from 'react';

/* ─── AdminEmptyState ──────────────────────────────────────────
   Estado vazio padronizado com SVG illustration e call-to-action.
──────────────────────────────────────────────────────────────── */

interface AdminEmptyStateProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  icon?: 'members' | 'events' | 'finance' | 'cells' | 'media' | 'search' | 'generic';
}

const illustrations: Record<string, React.ReactNode> = {
  members: (
    <svg viewBox="0 0 120 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="60" cy="90" rx="40" ry="6" fill="rgba(37,99,235,0.06)" />
      {/* Person 1 */}
      <circle cx="42" cy="35" r="14" fill="rgba(37,99,235,0.12)" stroke="rgba(37,99,235,0.3)" strokeWidth="1.5" />
      <circle cx="42" cy="31" r="7" fill="rgba(37,99,235,0.2)" stroke="rgba(37,99,235,0.4)" strokeWidth="1.5" />
      <path d="M28 58c0-7.732 6.268-14 14-14s14 6.268 14 14" stroke="rgba(37,99,235,0.4)" strokeWidth="1.5" strokeLinecap="round" />
      {/* Person 2 */}
      <circle cx="78" cy="35" r="14" fill="rgba(37,99,235,0.08)" stroke="rgba(37,99,235,0.2)" strokeWidth="1.5" />
      <circle cx="78" cy="31" r="7" fill="rgba(37,99,235,0.15)" stroke="rgba(37,99,235,0.3)" strokeWidth="1.5" />
      <path d="M64 58c0-7.732 6.268-14 14-14s14 6.268 14 14" stroke="rgba(37,99,235,0.3)" strokeWidth="1.5" strokeLinecap="round" />
      {/* Plus */}
      <circle cx="60" cy="72" r="9" fill="rgba(37,99,235,0.2)" stroke="rgba(37,99,235,0.4)" strokeWidth="1.5" />
      <path d="M60 68v8M56 72h8" stroke="rgba(37,99,235,0.7)" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  ),
  events: (
    <svg viewBox="0 0 120 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="60" cy="92" rx="38" ry="5" fill="rgba(37,99,235,0.06)" />
      <rect x="20" y="28" width="80" height="58" rx="8" fill="rgba(37,99,235,0.08)" stroke="rgba(37,99,235,0.25)" strokeWidth="1.5" />
      <rect x="20" y="28" width="80" height="18" rx="8" fill="rgba(37,99,235,0.15)" stroke="rgba(37,99,235,0.25)" strokeWidth="1.5" />
      <line x1="20" y1="46" x2="100" y2="46" stroke="rgba(37,99,235,0.25)" strokeWidth="1.5" />
      {/* Calendar lines */}
      {[0,1,2].map(row => [0,1,2,3].map(col => (
        <rect key={`${row}-${col}`} x={29 + col * 18} y={54 + row * 10} width="10" height="5" rx="1.5" fill="rgba(37,99,235,0.12)" />
      )))}
      {/* Pins */}
      <line x1="38" y1="22" x2="38" y2="32" stroke="rgba(37,99,235,0.5)" strokeWidth="2" strokeLinecap="round" />
      <circle cx="38" cy="20" r="3" fill="rgba(37,99,235,0.4)" />
      <line x1="82" y1="22" x2="82" y2="32" stroke="rgba(37,99,235,0.5)" strokeWidth="2" strokeLinecap="round" />
      <circle cx="82" cy="20" r="3" fill="rgba(37,99,235,0.4)" />
    </svg>
  ),
  finance: (
    <svg viewBox="0 0 120 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="60" cy="92" rx="38" ry="5" fill="rgba(16,185,129,0.06)" />
      <circle cx="60" cy="48" r="32" fill="rgba(16,185,129,0.06)" stroke="rgba(16,185,129,0.2)" strokeWidth="1.5" />
      <circle cx="60" cy="48" r="22" fill="rgba(16,185,129,0.1)" stroke="rgba(16,185,129,0.25)" strokeWidth="1.5" />
      <path d="M60 36v2.5M60 57.5V60M66.5 41.5C65.5 39.5 63 38 60 38c-3.866 0-7 2.686-7 6s3.134 6 7 6 7 2.686 7 6-3.134 6-7 6c-3 0-5.5-1.5-6.5-3.5" stroke="rgba(16,185,129,0.6)" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  ),
  cells: (
    <svg viewBox="0 0 120 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="60" cy="92" rx="38" ry="5" fill="rgba(37,99,235,0.06)" />
      <path d="M60 18L90 36v30L60 84 30 66V36L60 18z" fill="rgba(37,99,235,0.08)" stroke="rgba(37,99,235,0.25)" strokeWidth="1.5" />
      <path d="M60 30L80 42v20L60 74 40 62V42L60 30z" fill="rgba(37,99,235,0.12)" stroke="rgba(37,99,235,0.3)" strokeWidth="1.5" />
      <circle cx="60" cy="51" r="8" fill="rgba(37,99,235,0.2)" stroke="rgba(37,99,235,0.4)" strokeWidth="1.5" />
    </svg>
  ),
  media: (
    <svg viewBox="0 0 120 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="60" cy="92" rx="38" ry="5" fill="rgba(37,99,235,0.06)" />
      <rect x="18" y="22" width="58" height="48" rx="6" fill="rgba(37,99,235,0.08)" stroke="rgba(37,99,235,0.25)" strokeWidth="1.5" />
      <rect x="32" y="34" width="30" height="22" rx="4" fill="rgba(37,99,235,0.12)" stroke="rgba(37,99,235,0.25)" strokeWidth="1.5" />
      <circle cx="40" cy="41" r="4" fill="rgba(37,99,235,0.2)" stroke="rgba(37,99,235,0.35)" strokeWidth="1.5" />
      <path d="M28 60l12-12 8 8 6-6 8 10" stroke="rgba(37,99,235,0.4)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="82" y="32" width="22" height="32" rx="4" fill="rgba(37,99,235,0.08)" stroke="rgba(37,99,235,0.2)" strokeWidth="1.5" />
      <line x1="86" y1="42" x2="100" y2="42" stroke="rgba(37,99,235,0.3)" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="86" y1="48" x2="100" y2="48" stroke="rgba(37,99,235,0.3)" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="86" y1="54" x2="95" y2="54" stroke="rgba(37,99,235,0.3)" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
  search: (
    <svg viewBox="0 0 120 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="60" cy="92" rx="38" ry="5" fill="rgba(37,99,235,0.06)" />
      <circle cx="52" cy="46" r="24" fill="rgba(37,99,235,0.08)" stroke="rgba(37,99,235,0.2)" strokeWidth="1.5" />
      <circle cx="52" cy="46" r="16" fill="rgba(37,99,235,0.1)" stroke="rgba(37,99,235,0.25)" strokeWidth="1.5" />
      <line x1="70" y1="64" x2="84" y2="78" stroke="rgba(37,99,235,0.4)" strokeWidth="3" strokeLinecap="round" />
      <path d="M44 46h16M52 38v16" stroke="rgba(37,99,235,0.5)" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  generic: (
    <svg viewBox="0 0 120 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="60" cy="92" rx="38" ry="5" fill="rgba(37,99,235,0.06)" />
      <rect x="25" y="22" width="70" height="58" rx="8" fill="rgba(37,99,235,0.08)" stroke="rgba(37,99,235,0.2)" strokeWidth="1.5" />
      <line x1="35" y1="38" x2="85" y2="38" stroke="rgba(37,99,235,0.2)" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="35" y1="50" x2="85" y2="50" stroke="rgba(37,99,235,0.2)" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="35" y1="62" x2="65" y2="62" stroke="rgba(37,99,235,0.2)" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
};

export function AdminEmptyState({ title, description, action, icon = 'generic' }: AdminEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="w-32 h-28 mb-5 opacity-80">
        {illustrations[icon]}
      </div>
      <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-300 mb-1">{title}</h3>
      {description && (
        <p className="text-xs max-w-xs leading-relaxed" style={{ color: 'var(--admin-text-secondary)' }}>
          {description}
        </p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
