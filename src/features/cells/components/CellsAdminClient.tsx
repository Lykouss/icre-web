'use client'

import React, { useState, useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createCell, updateCell, toggleCellActive, deleteCell } from '@/features/cells/actions/cells';
import { useToast } from '@/features/core/components/ToastContext';
import type { Cell, MeetingType, Leader } from '@/features/portal/types';
import { AdminEmptyState } from '@/features/core/components/AdminEmptyState';
import { AdminButton, AdminBadge } from '@/features/core/components/AdminUI';

/* ─── Constants ───────────────────────────────────────────────── */
const MEETING_TYPES: { value: MeetingType; label: string; color: string; bg: string }[] = [
  { value: 'presencial', label: 'Presencial', color: '#34d399', bg: 'rgba(16,185,129,0.12)'  },
  { value: 'online',     label: 'Online',     color: '#93c5fd', bg: 'rgba(37,99,235,0.12)'   },
  { value: 'hibrido',    label: 'Híbrido',    color: '#c4b5fd', bg: 'rgba(139,92,246,0.12)'  },
];

const inputCls = 'w-full h-9 px-3 rounded-xl text-sm text-slate-200 placeholder-slate-600 outline-none transition-all';
const inputStyle = { background: 'var(--admin-surface-alt)', border: '1px solid var(--admin-border)' } as const;
const focusFns = {
  onFocus: (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    e.target.style.borderColor = 'rgba(37,99,235,0.5)';
    e.target.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.1)';
  },
  onBlur: (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    e.target.style.borderColor = 'var(--admin-border)';
    e.target.style.boxShadow = 'none';
  },
};

/* ─── Dark Toggle ─────────────────────────────────────────────── */
function Toggle({ checked, onChange, disabled }: { checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <button
      type="button" role="switch" aria-checked={checked} disabled={disabled}
      onClick={() => onChange(!checked)}
      className="relative w-9 h-5 rounded-full transition-colors duration-200 disabled:opacity-40"
      style={{ background: checked ? 'var(--admin-accent)' : 'var(--admin-surface-alt)', border: '1px solid var(--admin-border)' }}
    >
      <span
        className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full shadow transition-transform duration-200"
        style={{ background: checked ? '#fff' : 'rgba(255,255,255,0.3)', transform: checked ? 'translateX(16px)' : 'translateX(0)' }}
      />
    </button>
  );
}

/* ─── Image Preview ───────────────────────────────────────────── */
function ImagePreview({ src, onChange, name, aspectClass = 'aspect-video' }: {
  src: string | null; onChange: (url: string | null) => void; name: string; aspectClass?: string;
}) {
  const ref = React.useRef<HTMLInputElement>(null);
  return (
    <div
      className={`relative ${aspectClass} rounded-xl overflow-hidden cursor-pointer group transition-all`}
      style={{ background: 'var(--admin-surface-alt)', border: '2px dashed var(--admin-border)' }}
      onClick={() => ref.current?.click()}
      onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(37,99,235,0.4)')}
      onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--admin-border)')}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" className="w-full h-full object-cover" />
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2" style={{ color: 'var(--admin-text-muted)' }}>
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span className="text-[11px] font-medium">Clique para selecionar</span>
        </div>
      )}
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors rounded-xl" />
      <input ref={ref} type="file" name={name} className="hidden" accept="image/jpeg,image/png,image/webp"
        onChange={e => { const f = e.target.files?.[0]; if (f) onChange(URL.createObjectURL(f)); }} />
    </div>
  );
}

/* ─── Section Label ───────────────────────────────────────────── */
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-bold uppercase tracking-[0.15em] mb-3" style={{ color: 'var(--admin-text-muted)' }}>
      {children}
    </p>
  );
}

/* ─── Cell Modal ──────────────────────────────────────────────── */
function CellModal({ editing, leaders, isPending, onClose, onSubmit }: {
  editing: Cell | null; leaders: Leader[]; isPending: boolean;
  onClose: () => void; onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
}) {
  const [bannerSrc, setBannerSrc] = useState<string | null>(editing?.image_url ?? null);
  const activeLeaders = leaders.filter(l => l.is_active !== false);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={onClose} />
      <div
        className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl shadow-2xl overflow-hidden"
        style={{ background: 'var(--admin-surface)', border: '1px solid var(--admin-border-strong)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 shrink-0" style={{ borderBottom: '1px solid var(--admin-border)' }}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center text-blue-400" style={{ background: 'var(--admin-accent-dim)', border: '1px solid var(--admin-accent-border)' }}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            </div>
            <h2 className="text-[15px] font-bold text-slate-100">{editing ? 'Editar Célula' : 'Nova Célula'}</h2>
          </div>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg transition-all" style={{ color: 'var(--admin-text-muted)' }}
            onMouseEnter={e => { e.currentTarget.style.color = 'var(--admin-text-primary)'; e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--admin-text-muted)'; e.currentTarget.style.background = 'transparent'; }}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form key={editing?.id ?? 'new'} onSubmit={onSubmit} className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-6">

            {/* Banner */}
            <div>
              <SectionLabel>Banner da Célula</SectionLabel>
              <ImagePreview src={bannerSrc} onChange={setBannerSrc} name="image" />
            </div>

            {/* Líderes */}
            <div>
              <SectionLabel>Líderes</SectionLabel>
              <div className="grid grid-cols-2 gap-3">
                {[{ name: 'leader1_id', label: 'Líder 1', val: editing?.leader1_id },
                  { name: 'leader2_id', label: 'Líder 2 (casal)', val: editing?.leader2_id }
                ].map(f => (
                  <div key={f.name}>
                    <label className="block text-[11px] font-semibold mb-1.5" style={{ color: 'var(--admin-text-secondary)' }}>{f.label}</label>
                    <select name={f.name} defaultValue={f.val ?? ''} className={`${inputCls} cursor-pointer`} style={inputStyle} {...focusFns}>
                      <option value="">— Nenhum —</option>
                      {activeLeaders.map(l => <option key={l.id} value={l.id} style={{ background: '#111d35' }}>{l.name}</option>)}
                    </select>
                  </div>
                ))}
              </div>
            </div>

            {/* Informações */}
            <div>
              <SectionLabel>Informações</SectionLabel>
              <label className="block text-[11px] font-semibold mb-1.5" style={{ color: 'var(--admin-text-secondary)' }}>
                Nome da Célula <span className="text-red-400">*</span>
              </label>
              <input name="name" defaultValue={editing?.name} required placeholder="Ex: Célula Renovação"
                className={inputCls} style={inputStyle} {...focusFns} />
            </div>

            {/* Encontros */}
            <div>
              <SectionLabel>Encontros</SectionLabel>
              <div className="mb-3">
                <label className="block text-[11px] font-semibold mb-2" style={{ color: 'var(--admin-text-secondary)' }}>Tipo de Encontro</label>
                <div className="flex gap-2">
                  {MEETING_TYPES.map(t => (
                    <label key={t.value} className="flex-1 cursor-pointer">
                      <input type="radio" name="meeting_type" value={t.value}
                        defaultChecked={editing ? editing.meeting_type === t.value : t.value === 'presencial'}
                        className="sr-only peer" />
                      <div className="text-center py-2 text-[11px] font-bold rounded-xl border-2 transition-all cursor-pointer"
                        style={{ background: 'var(--admin-surface-alt)', borderColor: 'var(--admin-border)', color: 'var(--admin-text-secondary)' }}
                        data-type={t.value}
                        /* peer-checked via JS workaround */
                      >
                        {t.label}
                      </div>
                    </label>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[{ name: 'meeting_days', val: editing?.meeting_days, ph: 'Ex: Terças-feiras' },
                  { name: 'meeting_time', val: editing?.meeting_time, ph: 'Ex: 19h30' }
                ].map(f => (
                  <input key={f.name} name={f.name} defaultValue={f.val ?? ''} placeholder={f.ph}
                    className={inputCls} style={inputStyle} {...focusFns} />
                ))}
              </div>
            </div>

            {/* Localização */}
            <div>
              <SectionLabel>Localização</SectionLabel>
              <div className="grid grid-cols-2 gap-3">
                <input name="neighborhood" defaultValue={editing?.neighborhood ?? ''} placeholder="Bairro"
                  className={inputCls} style={inputStyle} {...focusFns} />
                <input name="address" defaultValue={editing?.address ?? ''} placeholder="Rua, número..."
                  className={inputCls} style={inputStyle} {...focusFns} />
              </div>
            </div>

            {/* Contato */}
            <div>
              <SectionLabel>Contato e Redes</SectionLabel>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <input name="contact_whatsapp" defaultValue={editing?.contact_whatsapp ?? ''} placeholder="(00) 00000-0000"
                  className={inputCls} style={inputStyle} {...focusFns} />
                <input name="contact_phone" defaultValue={editing?.contact_phone ?? ''} placeholder="(00) 0000-0000"
                  className={inputCls} style={inputStyle} {...focusFns} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input name="contact_email" type="email" defaultValue={editing?.contact_email ?? ''} placeholder="celula@..."
                  className={inputCls} style={inputStyle} {...focusFns} />
                <input name="instagram_url" type="url" defaultValue={editing?.instagram_url ?? ''} placeholder="https://instagram.com/..."
                  className={inputCls} style={inputStyle} {...focusFns} />
              </div>
            </div>

            {/* Descrição */}
            <div>
              <SectionLabel>Descrição</SectionLabel>
              <textarea name="description" rows={3} defaultValue={editing?.description ?? ''}
                placeholder="Conte sobre o grupo, quem frequenta, o propósito..."
                className="w-full px-3 py-2.5 rounded-xl text-sm text-slate-200 placeholder-slate-600 outline-none transition-all resize-none"
                style={inputStyle} {...focusFns} />
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 shrink-0" style={{ borderTop: '1px solid var(--admin-border)', background: 'rgba(0,0,0,0.15)' }}>
            <AdminButton type="button" variant="ghost" onClick={onClose}>Cancelar</AdminButton>
            <AdminButton type="submit" variant="primary" loading={isPending}>
              {editing ? 'Salvar alterações' : 'Criar Célula'}
            </AdminButton>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ─── Cell Detail Modal ───────────────────────────────────────── */
function CellDetailModal({ cell, leader1, leader2, onClose, onEdit }: {
  cell: Cell; leader1: Leader | null; leader2: Leader | null; onClose: () => void; onEdit: () => void;
}) {
  const typeObj = MEETING_TYPES.find(t => t.value === cell.meeting_type) ?? MEETING_TYPES[0];
  const cellLeaders = [leader1, leader2].filter(Boolean) as Leader[];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={onClose} />
      <div
        className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl"
        style={{ background: 'var(--admin-surface)', border: '1px solid var(--admin-border-strong)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Banner */}
        <div className="relative h-48 overflow-hidden rounded-t-2xl" style={{ background: 'var(--admin-surface-alt)' }}>
          {cell.image_url
            // eslint-disable-next-line @next/next/no-img-element
            ? <img src={cell.image_url} alt={cell.name} className="w-full h-full object-cover" />
            : (
              <div className="absolute inset-0 flex items-center justify-center">
                <svg className="w-16 h-16" viewBox="0 0 64 64" fill="none">
                  <path d="M32 8L56 22v22L32 58 8 44V22L32 8z" fill="rgba(37,99,235,0.12)" stroke="rgba(37,99,235,0.25)" strokeWidth="1.5" />
                  <path d="M32 16L48 26v14L32 50 16 40V26L32 16z" fill="rgba(37,99,235,0.2)" stroke="rgba(37,99,235,0.35)" strokeWidth="1.5" />
                  <circle cx="32" cy="33" r="8" fill="rgba(37,99,235,0.25)" stroke="rgba(37,99,235,0.5)" strokeWidth="1.5" />
                </svg>
              </div>
            )}
          <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/70 to-transparent" />
          <button onClick={onClose} className="absolute top-3 right-3 p-2 rounded-xl text-white bg-black/50 hover:bg-black/70 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <div className="absolute bottom-3 left-4">
            <span className="text-[10px] font-bold px-2.5 py-1 rounded-full"
              style={{ background: typeObj.bg, color: typeObj.color }}>
              {typeObj.label}
            </span>
          </div>
        </div>

        <div className="p-6 space-y-5">
          <div className="flex items-start justify-between gap-3">
            <h2 className="text-2xl font-bold text-slate-100">{cell.name}</h2>
            <AdminButton variant="secondary" size="sm"
              icon={<svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>}
              onClick={() => { onClose(); onEdit(); }}>
              Editar
            </AdminButton>
          </div>

          {cellLeaders.length > 0 && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--admin-text-muted)' }}>Líderes</p>
              <div className="flex gap-3 flex-wrap">
                {cellLeaders.map(l => (
                  <div key={l.id} className="flex items-center gap-2.5 rounded-xl px-3 py-2" style={{ background: 'var(--admin-surface-alt)', border: '1px solid var(--admin-border)' }}>
                    {l.photo_url
                      // eslint-disable-next-line @next/next/no-img-element
                      ? <img src={l.photo_url} alt={l.name} className="w-8 h-8 rounded-lg object-cover" />
                      : (
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-blue-400" style={{ background: 'var(--admin-accent-dim)' }}>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                      )}
                    <div>
                      <p className="text-[13px] font-semibold text-slate-200">{l.name}</p>
                      {l.phone && <p className="text-[11px]" style={{ color: 'var(--admin-text-secondary)' }}>{l.phone}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {(cell.meeting_days || cell.meeting_time) && (
            <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--admin-text-secondary)' }}>
              <svg className="w-4 h-4 text-slate-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {[cell.meeting_days, cell.meeting_time].filter(Boolean).join(' · ')}
            </div>
          )}

          {(cell.neighborhood || cell.address) && (
            <div className="flex items-start gap-2 text-sm" style={{ color: 'var(--admin-text-secondary)' }}>
              <svg className="w-4 h-4 text-slate-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              </svg>
              {[cell.neighborhood, cell.address].filter(Boolean).join(' — ')}
            </div>
          )}

          {cell.description && (
            <p className="text-sm leading-relaxed pt-4" style={{ color: 'var(--admin-text-secondary)', borderTop: '1px solid var(--admin-border)' }}>
              {cell.description}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Cell Card ───────────────────────────────────────────────── */
function CellCard({ cell, leader1, leader2, canManage, isSysAdmin, onEdit, onDetail, onToggle, toggling, onDelete }: {
  cell: Cell; leader1: Leader | null; leader2: Leader | null;
  canManage: boolean; isSysAdmin: boolean;
  onEdit: () => void; onDetail: () => void; onToggle: () => void; toggling: boolean; onDelete: () => void;
}) {
  const typeObj = MEETING_TYPES.find(t => t.value === cell.meeting_type) ?? MEETING_TYPES[0];
  const cellLeaders = [leader1, leader2].filter(Boolean) as Leader[];

  return (
    <div
      className={`rounded-2xl overflow-hidden flex flex-col transition-all duration-200 hover:-translate-y-0.5 ${!cell.is_active ? 'opacity-50' : ''}`}
      style={{
        background: 'var(--admin-surface)',
        border: '1px solid var(--admin-border)',
        boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
      }}
      onMouseEnter={e => { if (cell.is_active) e.currentTarget.style.borderColor = 'rgba(37,99,235,0.3)'; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--admin-border)'; }}
    >
      {/* Banner */}
      <div className="relative aspect-video overflow-hidden cursor-pointer" style={{ background: 'var(--admin-surface-alt)' }} onClick={onDetail}>
        {cell.image_url
          // eslint-disable-next-line @next/next/no-img-element
          ? <img src={cell.image_url} alt={cell.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
          : (
            <div className="absolute inset-0 flex items-center justify-center">
              <svg className="w-10 h-10" viewBox="0 0 48 48" fill="none">
                <path d="M24 6L42 16v16L24 42 6 32V16L24 6z" fill="rgba(37,99,235,0.1)" stroke="rgba(37,99,235,0.2)" strokeWidth="1.5" />
                <circle cx="24" cy="24" r="7" fill="rgba(37,99,235,0.15)" stroke="rgba(37,99,235,0.3)" strokeWidth="1.5" />
              </svg>
            </div>
          )}
        <span className="absolute top-2 left-2 text-[10px] font-bold px-2 py-0.5 rounded-full"
          style={{ background: typeObj.bg, color: typeObj.color }}>
          {typeObj.label}
        </span>
      </div>

      <div className="p-4 flex flex-col flex-1">
        <button onClick={onDetail} className="text-left mb-2">
          <h3 className="font-bold text-slate-200 text-[13px] leading-tight hover:text-blue-300 transition-colors">{cell.name}</h3>
          {cellLeaders.length > 0 && (
            <p className="text-[11px] mt-1" style={{ color: 'var(--admin-text-secondary)' }}>
              {cellLeaders.map(l => l.name).join(' & ')}
            </p>
          )}
        </button>

        {cell.description && (
          <p className="text-[11px] line-clamp-2 mb-3 leading-relaxed" style={{ color: 'var(--admin-text-muted)' }}>
            {cell.description}
          </p>
        )}

        <div className="space-y-1.5 mb-3 mt-auto">
          {(cell.meeting_days || cell.meeting_time) && (
            <div className="flex items-center gap-1.5 text-[11px]" style={{ color: 'var(--admin-text-secondary)' }}>
              <svg className="w-3 h-3 text-slate-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {[cell.meeting_days, cell.meeting_time].filter(Boolean).join(' · ')}
            </div>
          )}
          {cell.neighborhood && (
            <div className="flex items-center gap-1.5 text-[11px]" style={{ color: 'var(--admin-text-secondary)' }}>
              <svg className="w-3 h-3 text-slate-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              </svg>
              {cell.neighborhood}
            </div>
          )}
        </div>

        {canManage && (
          <div className="flex items-center justify-between pt-3" style={{ borderTop: '1px solid var(--admin-border)' }}>
            <div className="flex items-center gap-2">
              <Toggle checked={cell.is_active} onChange={onToggle} disabled={toggling} />
              <span className="text-[11px]" style={{ color: 'var(--admin-text-secondary)' }}>
                {cell.is_active ? 'Ativa' : 'Inativa'}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={onEdit} title="Editar" className="p-1.5 rounded-lg transition-all" style={{ color: 'var(--admin-text-muted)' }}
                onMouseEnter={e => { e.currentTarget.style.color = '#93c5fd'; e.currentTarget.style.background = 'rgba(37,99,235,0.1)'; }}
                onMouseLeave={e => { e.currentTarget.style.color = 'var(--admin-text-muted)'; e.currentTarget.style.background = 'transparent'; }}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
              {isSysAdmin && (
                <button onClick={onDelete} title="Remover" className="p-1.5 rounded-lg transition-all" style={{ color: 'var(--admin-text-muted)' }}
                  onMouseEnter={e => { e.currentTarget.style.color = '#f87171'; e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; }}
                  onMouseLeave={e => { e.currentTarget.style.color = 'var(--admin-text-muted)'; e.currentTarget.style.background = 'transparent'; }}>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Main ────────────────────────────────────────────────────── */
interface Props { initialCells: Cell[]; leaders: Leader[]; canManage: boolean; isSysAdmin: boolean; }

export function CellsAdminClient({ initialCells, leaders, canManage, isSysAdmin }: Props) {
  const router = useRouter();
  const { toast, dismiss } = useToast();
  const [cells, setCells] = useState(initialCells);
  const [isOpen, setIsOpen] = useState(false);
  const [editing, setEditing] = useState<Cell | null>(null);
  const [detailCell, setDetailCell] = useState<Cell | null>(null);
  const [isPending, startTransition] = useTransition();
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => { setCells(initialCells); }, [initialCells]);

  const getLeader = (id: string | null | undefined) => leaders.find(l => l.id === id) ?? null;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const id = toast('loading', editing ? 'Salvando célula…' : 'Criando célula…');
      const result = editing ? await updateCell(editing.id, formData) : await createCell(formData);
      dismiss(id);
      const err = 'error' in result ? result.error : null;
      if (err) { toast('error', err); return; }
      toast('success', editing ? 'Célula atualizada!' : 'Célula criada!');
      setIsOpen(false);
      router.refresh();
    });
  };

  const handleToggle = (cell: Cell) => {
    setTogglingId(cell.id);
    startTransition(async () => {
      const result = await toggleCellActive(cell.id, !cell.is_active);
      setTogglingId(null);
      const err = 'error' in result ? result.error : null;
      if (err) { toast('error', err); return; }
      setCells(prev => prev.map(c => c.id === cell.id ? { ...c, is_active: !c.is_active } : c));
    });
  };

  const handleDelete = (cell: Cell) => {
    if (!confirm(`Remover "${cell.name}"? Esta ação ocultará a célula do portal.`)) return;
    startTransition(async () => {
      const id = toast('loading', 'Removendo…');
      const result = await deleteCell(cell.id);
      dismiss(id);
      const err = 'error' in result ? result.error : null;
      if (err) { toast('error', err); return; }
      toast('success', 'Célula removida do portal.');
      setCells(prev => prev.filter(c => c.id !== cell.id));
    });
  };

  const filtered = cells.filter(c =>
    !search || c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.neighborhood?.toLowerCase() ?? '').includes(search.toLowerCase())
  );

  const activeCount = cells.filter(c => c.is_active).length;

  const STATS = [
    { label: 'Total',    value: cells.length,              color: '#3b82f6'  },
    { label: 'Ativas',   value: activeCount,               color: '#10b981'  },
    { label: 'Inativas', value: cells.length - activeCount, color: '#f59e0b' },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {STATS.map(s => (
          <div key={s.label} className="rounded-2xl p-4 transition-all"
            style={{ background: 'var(--admin-surface)', border: '1px solid var(--admin-border)' }}>
            <p className="text-2xl font-black" style={{ color: s.color }}>{s.value}</p>
            <p className="text-[11px] font-semibold uppercase tracking-wide mt-0.5" style={{ color: 'var(--admin-text-secondary)' }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center">
        <div className="relative flex-1 w-full">
          <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-600 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por nome ou bairro…"
            className="w-full h-9 pl-9 pr-4 rounded-xl text-sm text-slate-200 placeholder-slate-600 outline-none transition-all"
            style={inputStyle}
            onFocus={e => { e.target.style.borderColor = 'rgba(37,99,235,0.5)'; e.target.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.1)'; }}
            onBlur={e => { e.target.style.borderColor = 'var(--admin-border)'; e.target.style.boxShadow = 'none'; }}
          />
        </div>
        {canManage && (
          <AdminButton variant="primary" className="shrink-0"
            icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>}
            onClick={() => { setEditing(null); setIsOpen(true); }}>
            Nova Célula
          </AdminButton>
        )}
      </div>

      {/* Grid / Empty */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl" style={{ border: '1px dashed var(--admin-border-strong)', background: 'var(--admin-surface)' }}>
          <AdminEmptyState
            icon={search ? 'search' : 'cells'}
            title={search ? 'Nenhuma célula encontrada' : 'Nenhuma célula cadastrada'}
            description={search ? 'Tente outros termos.' : 'Crie a primeira célula para exibi-la no portal.'}
            action={canManage && !search ? (
              <AdminButton variant="primary"
                icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>}
                onClick={() => { setEditing(null); setIsOpen(true); }}>
                Criar primeira célula
              </AdminButton>
            ) : undefined}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map(cell => (
            <CellCard key={cell.id} cell={cell}
              leader1={getLeader(cell.leader1_id)} leader2={getLeader(cell.leader2_id)}
              canManage={canManage} isSysAdmin={isSysAdmin}
              onEdit={() => { setEditing(cell); setIsOpen(true); }}
              onDetail={() => setDetailCell(cell)}
              onToggle={() => handleToggle(cell)}
              toggling={togglingId === cell.id}
              onDelete={() => handleDelete(cell)}
            />
          ))}
        </div>
      )}

      {isOpen && (
        <CellModal editing={editing} leaders={leaders} isPending={isPending}
          onClose={() => setIsOpen(false)} onSubmit={handleSubmit} />
      )}
      {detailCell && (
        <CellDetailModal cell={detailCell}
          leader1={getLeader(detailCell.leader1_id)} leader2={getLeader(detailCell.leader2_id)}
          onClose={() => setDetailCell(null)}
          onEdit={() => { setDetailCell(null); setEditing(detailCell); setIsOpen(true); }}
        />
      )}
    </div>
  );
}
