'use client'

import React from 'react';

/* ─── AdminButton ──────────────────────────────────────────────── */
interface AdminButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
  iconEnd?: React.ReactNode;
}

export function AdminButton({
  variant = 'secondary',
  size = 'md',
  loading = false,
  icon,
  iconEnd,
  children,
  disabled,
  className = '',
  ...props
}: AdminButtonProps) {
  const variantStyles: Record<string, React.CSSProperties> = {
    primary: {
      background: 'var(--admin-accent)',
      color: '#fff',
      border: '1px solid rgba(37,99,235,0.6)',
    },
    secondary: {
      background: 'var(--admin-surface-alt)',
      color: 'var(--admin-text-primary)',
      border: '1px solid var(--admin-border-strong)',
    },
    ghost: {
      background: 'transparent',
      color: 'var(--admin-text-secondary)',
      border: '1px solid transparent',
    },
    danger: {
      background: 'rgba(239,68,68,0.12)',
      color: '#f87171',
      border: '1px solid rgba(239,68,68,0.25)',
    },
    success: {
      background: 'rgba(16,185,129,0.12)',
      color: '#34d399',
      border: '1px solid rgba(16,185,129,0.25)',
    },
  };

  const sizeStyles: Record<string, string> = {
    sm: 'h-8 px-3 text-xs gap-1.5',
    md: 'h-9 px-4 text-[13px] gap-2',
    lg: 'h-10 px-5 text-sm gap-2',
  };

  const Spinner = () => (
    <svg className="w-3.5 h-3.5 animate-spin shrink-0" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
      <path className="opacity-70" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
  );

  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={`
        inline-flex items-center justify-center font-semibold rounded-xl
        transition-all duration-150 active:scale-[0.97]
        disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none
        ${sizeStyles[size]} ${className}
      `}
      style={{
        ...variantStyles[variant],
        ...(variant === 'primary' ? { boxShadow: loading ? 'none' : '0 1px 2px rgba(0,0,0,0.3)' } : {}),
      }}
    >
      {loading ? <Spinner /> : icon}
      {children && <span>{children}</span>}
      {!loading && iconEnd}
    </button>
  );
}

/* ─── AdminInput ───────────────────────────────────────────────── */
interface AdminInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  leftIcon?: React.ReactNode;
}

export function AdminInput({ leftIcon, className = '', ...props }: AdminInputProps) {
  return (
    <div className="relative flex items-center">
      {leftIcon && (
        <span className="absolute left-3 text-slate-500 pointer-events-none shrink-0">{leftIcon}</span>
      )}
      <input
        {...props}
        className={`
          w-full h-9 rounded-xl text-sm text-slate-200 placeholder-slate-600
          transition-all duration-150 outline-none
          ${leftIcon ? 'pl-9 pr-3' : 'px-3'}
          ${className}
        `}
        style={{
          background: 'var(--admin-surface-alt)',
          border: '1px solid var(--admin-border)',
        }}
        onFocus={e => {
          e.currentTarget.style.borderColor = 'rgba(37,99,235,0.5)';
          e.currentTarget.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.12)';
          props.onFocus?.(e);
        }}
        onBlur={e => {
          e.currentTarget.style.borderColor = 'var(--admin-border)';
          e.currentTarget.style.boxShadow = 'none';
          props.onBlur?.(e);
        }}
      />
    </div>
  );
}

/* ─── AdminSelect ──────────────────────────────────────────────── */
interface AdminSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  options: { value: string; label: string }[];
  placeholder?: string;
}

export function AdminSelect({ options, placeholder, className = '', ...props }: AdminSelectProps) {
  return (
    <select
      {...props}
      className={`
        h-9 px-3 rounded-xl text-[13px] text-slate-200 outline-none cursor-pointer
        transition-all duration-150 appearance-none
        ${className}
      `}
      style={{
        background: 'var(--admin-surface-alt)',
        border: '1px solid var(--admin-border)',
        color: 'var(--admin-text-primary)',
      }}
    >
      {placeholder && <option value="">{placeholder}</option>}
      {options.map(opt => (
        <option key={opt.value} value={opt.value} style={{ background: '#111d35' }}>{opt.label}</option>
      ))}
    </select>
  );
}

/* ─── AdminBadge ───────────────────────────────────────────────── */
type AdminBadgeColor = 'blue' | 'green' | 'red' | 'amber' | 'purple' | 'slate' | 'violet' | 'emerald';

interface AdminBadgeProps {
  children: React.ReactNode;
  color?: AdminBadgeColor;
  dot?: boolean;
  className?: string;
}

const badgeColors: Record<AdminBadgeColor, { bg: string; text: string; dot: string }> = {
  blue:    { bg: 'rgba(37,99,235,0.15)',  text: '#93c5fd', dot: '#3b82f6' },
  green:   { bg: 'rgba(16,185,129,0.15)', text: '#6ee7b7', dot: '#10b981' },
  emerald: { bg: 'rgba(16,185,129,0.15)', text: '#6ee7b7', dot: '#10b981' },
  red:     { bg: 'rgba(239,68,68,0.15)',  text: '#fca5a5', dot: '#ef4444' },
  amber:   { bg: 'rgba(245,158,11,0.15)', text: '#fcd34d', dot: '#f59e0b' },
  purple:  { bg: 'rgba(139,92,246,0.15)', text: '#c4b5fd', dot: '#8b5cf6' },
  violet:  { bg: 'rgba(124,58,237,0.15)', text: '#c4b5fd', dot: '#7c3aed' },
  slate:   { bg: 'rgba(100,116,139,0.15)',text: '#94a3b8', dot: '#64748b' },
};

export function AdminBadge({ children, color = 'blue', dot = false, className = '' }: AdminBadgeProps) {
  const c = badgeColors[color];
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${className}`}
      style={{ background: c.bg, color: c.text }}
    >
      {dot && <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: c.dot }} />}
      {children}
    </span>
  );
}

/* ─── AdminModal ───────────────────────────────────────────────── */
interface AdminModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  maxWidth?: string;
  icon?: React.ReactNode;
}

export function AdminModal({ open, onClose, title, description, children, maxWidth = 'max-w-md', icon }: AdminModalProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
        style={{ animation: 'fadeIn 0.15s ease-out' }}
      />
      {/* Panel */}
      <div
        className={`relative w-full ${maxWidth} rounded-2xl shadow-2xl overflow-hidden`}
        style={{
          background: 'var(--admin-surface)',
          border: '1px solid var(--admin-border-strong)',
          animation: 'modalIn 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4"
          style={{ borderBottom: '1px solid var(--admin-border)' }}
        >
          <div className="flex items-center gap-3">
            {icon && (
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center text-blue-400 shrink-0"
                style={{ background: 'var(--admin-accent-dim)', border: '1px solid var(--admin-accent-border)' }}
              >
                {icon}
              </div>
            )}
            <div>
              <h3 className="text-[15px] font-bold text-slate-100">{title}</h3>
              {description && <p className="text-[11px] mt-0.5" style={{ color: 'var(--admin-text-secondary)' }}>{description}</p>}
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-300 hover:bg-white/8 transition-all"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        {/* Body */}
        <div>{children}</div>
      </div>

      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes modalIn {
          from { opacity: 0; transform: scale(0.95) translateY(8px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  );
}

/* ─── AdminTabBar ──────────────────────────────────────────────── */
interface Tab { id: string; label: string; icon?: React.ReactNode }

interface AdminTabBarProps {
  tabs: Tab[];
  active: string;
  onChange: (id: string) => void;
}

export function AdminTabBar({ tabs, active, onChange }: AdminTabBarProps) {
  return (
    <div
      className="flex items-center gap-1 p-1 rounded-xl w-fit"
      style={{ background: 'var(--admin-surface-alt)', border: '1px solid var(--admin-border)' }}
    >
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-medium transition-all duration-150 whitespace-nowrap"
          style={
            active === tab.id
              ? { background: 'var(--admin-surface)', color: 'var(--admin-text-primary)', boxShadow: '0 1px 4px rgba(0,0,0,0.3)' }
              : { color: 'var(--admin-text-secondary)' }
          }
        >
          {tab.icon}
          {tab.label}
        </button>
      ))}
    </div>
  );
}

/* ─── AdminField ───────────────────────────────────────────────── */
interface AdminFieldProps {
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}

export function AdminField({ label, hint, error, required, children }: AdminFieldProps) {
  return (
    <div className="space-y-1.5">
      <label className="block text-[11px] font-semibold uppercase tracking-wide" style={{ color: 'var(--admin-text-secondary)' }}>
        {label}{required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      {children}
      {error && <p className="text-[11px] text-red-400 font-medium">{error}</p>}
      {hint && !error && <p className="text-[11px] leading-relaxed" style={{ color: 'var(--admin-text-muted)' }}>{hint}</p>}
    </div>
  );
}
