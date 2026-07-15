'use client'

import { createPortal } from 'react-dom';
import { useEffect, useState, useTransition, useCallback, useRef } from 'react';
import { useToast } from '@/features/core/components/ToastContext';
import { saveBlockDraft, publishAllBlocks, toggleBlock } from '@/features/portal/actions/portal';
import { listSiteMedia, uploadSiteMedia, deleteSiteMedia } from '@/features/portal/actions/portal-actions';
import type { SiteBlock, MissionItem, Pastor, PublicCell } from '@/features/portal/types';
import type { PublicEvent } from '@/features/portal/components/EventsSection';
import type { SiteMediaItem } from '@/features/portal/actions/portal-actions';
import { PageHeader } from '@/features/core/components/AdminSidebarShell';

// Import all sections directly
import { HeroSection }    from '@/features/portal/components/HeroSection';
import { AboutSection }   from '@/features/portal/components/AboutSection';
import { MissionSection } from '@/features/portal/components/MissionSection';
import { PastorsSection } from '@/features/portal/components/PastorsSection';
import { CellsSection }   from '@/features/portal/components/CellsSection';
import { EventsSection }  from '@/features/portal/components/EventsSection';
import { YoutubeSection } from '@/features/portal/components/YoutubeSection';
import { ContactSection } from '@/features/portal/components/ContactSection';

// â”€â”€ SeÃ§Ãµes editÃ¡veis â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

type SectionKey = 'hero' | 'about' | 'mission' | 'pastors' | 'cells' | 'events' | 'youtube' | 'contact';

interface SectionMeta { key: SectionKey; label: string; icon: React.ReactNode }

const SECTIONS: SectionMeta[] = [
  { key: 'hero',    label: 'Capa',       icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg> },
  { key: 'about',   label: 'Sobre nÃ³s',  icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
  { key: 'mission', label: 'MissÃ£o',     icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" /></svg> },
  { key: 'pastors', label: 'LideranÃ§a',  icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg> },
  { key: 'cells',   label: 'CÃ©lulas',    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg> },
  { key: 'events',  label: 'Eventos',    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg> },
  { key: 'youtube', label: 'YouTube',    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
  { key: 'contact', label: 'Contato',    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg> },
];

// â”€â”€ Primitivos â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const inputCls = 'w-full px-3 py-2 bg-[var(--admin-surface-alt)] border border-[var(--admin-border)] rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-sm text-[var(--admin-text-primary)] placeholder-slate-500 transition-all';

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[11px] font-bold text-[var(--admin-text-secondary)] mb-1.5 tracking-wide uppercase">{label}</label>
      {children}
      {hint && <p className="text-[11px] text-[var(--admin-text-muted)] mt-1.5 leading-relaxed">{hint}</p>}
    </div>
  );
}

function SectionDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 pt-3">
      <span className="text-[10px] font-bold text-[var(--admin-text-muted)] uppercase tracking-widest whitespace-nowrap">{label}</span>
      <div className="flex-1 h-px" style={{ background: 'var(--admin-border)' }} />
    </div>
  );
}

// â”€â”€ Galeria de mÃ­dia â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const QUOTA_MB = 200;

function formatBytes(b: number): string {
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(0)} KB`;
  return `${(b / 1024 / 1024).toFixed(1)} MB`;
}

function MediaPicker({ value, onChange }: { value: string; onChange: (url: string) => void }) {
  const [open, setOpen]       = useState(false);
  const [items, setItems]     = useState<SiteMediaItem[]>([]);
  const [usedBytes, setUsed]  = useState(0);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError]     = useState<string | null>(null);
  const { toast } = useToast();

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    const r = await listSiteMedia();
    setLoading(false);
    if ('error' in r) { setError(r.error); return; }
    setItems(r.items); setUsed(r.usedBytes);
  }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    setUploading(true); setError(null);
    const fd = new FormData();
    fd.set('file', file);
    const r = await uploadSiteMedia(fd);
    setUploading(false);
    if ('error' in r) { setError(r.error); return; }
    setItems(prev => [r.item, ...prev]);
    setUsed(prev => prev + r.item.size_bytes);
    toast('success', 'Imagem enviada.');
  };

  const handleDelete = async (item: SiteMediaItem) => {
    if (!confirm(`Excluir "${item.name}"?`)) return;
    const r = await deleteSiteMedia(item.id);
    if ('error' in r) { toast('error', r.error); return; }
    setItems(prev => prev.filter(i => i.id !== item.id));
    setUsed(prev => prev - item.size_bytes);
    if (value === item.url) onChange('');
  };

  const usedMB = usedBytes / 1024 / 1024;
  const usedPct = Math.min(100, (usedMB / QUOTA_MB) * 100);

  return (
    <div className="space-y-3">
      {value && (
        <div className="relative w-full aspect-video rounded-xl overflow-hidden border border-[var(--admin-border)]" style={{ background: 'var(--admin-bg)' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="" className="w-full h-full object-cover" />
          <button onClick={() => onChange('')} className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-black/80 text-white rounded-lg transition-colors backdrop-blur-sm">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
      )}
      <div className="flex gap-2">
        <button type="button" onClick={() => { setOpen(true); load(); }}
          className="flex-none px-4 py-2 border border-[var(--admin-border)] rounded-xl text-xs font-bold text-[var(--admin-text-secondary)] bg-[var(--admin-surface)] hover:text-blue-400 hover:border-blue-500/50 hover:bg-blue-500/5 transition-colors flex items-center gap-2 shadow-sm">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
          {value ? 'Trocar' : 'Galeria'}
        </button>
        <input className={`${inputCls} flex-1`} value={value} onChange={e => onChange(e.target.value)} placeholder="Ou cole uma URL..." />
      </div>

      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden border border-[var(--admin-border-strong)]" style={{ background: 'var(--admin-surface)' }}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--admin-border)] shrink-0">
              <div>
                <h3 className="font-bold text-white text-sm">Galeria de imagens</h3>
                <p className="text-xs text-[var(--admin-text-muted)] mt-0.5">Selecione ou envie uma imagem</p>
              </div>
              <button onClick={() => setOpen(false)} className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-black/5 dark:bg-white/10 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="px-5 py-4 border-b border-[var(--admin-border)] shrink-0 bg-[var(--admin-surface-alt)]">
              <div className="flex justify-between text-xs font-semibold text-[var(--admin-text-secondary)] mb-2">
                <span>Armazenamento Total</span>
                <span className={usedPct > 85 ? 'text-red-400' : ''}>{usedMB.toFixed(1)} MB / {QUOTA_MB} MB</span>
              </div>
              <div className="w-full bg-[var(--admin-border)] rounded-full h-2">
                <div className={`h-2 rounded-full transition-all ${usedPct > 85 ? 'bg-red-500' : usedPct > 60 ? 'bg-amber-400' : 'bg-blue-500'}`} style={{ width: `${usedPct}%` }} />
              </div>
            </div>
            <div className="px-5 py-4 border-b border-[var(--admin-border)] shrink-0">
              <label className={`flex flex-col items-center justify-center gap-2 py-6 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${uploading ? 'border-[var(--admin-border)] text-slate-500' : 'border-slate-500 hover:border-blue-500/50 hover:bg-blue-500/5 hover:text-blue-400 text-slate-500 dark:text-slate-400'}`}>
                {uploading ? (
                  <><svg className="w-6 h-6 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/></svg><span className="text-sm font-semibold">Enviando...</span></>
                ) : (
                  <><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/></svg><span className="text-sm font-bold">Enviar nova imagem</span><span className="text-xs font-medium text-[var(--admin-text-muted)]">JPG, PNG, WebP Â· MÃ¡x. 10 MB</span></>
                )}
                <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="sr-only" onChange={handleUpload} disabled={uploading} />
              </label>
              {error && <p className="mt-3 text-xs text-red-400 font-bold text-center">{error}</p>}
            </div>
            <div className="flex-1 overflow-y-auto p-5" style={{ scrollbarWidth: 'thin' }}>
              {loading ? (
                <div className="flex justify-center py-12"><svg className="w-8 h-8 animate-spin text-slate-500" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/></svg></div>
              ) : items.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-[var(--admin-text-muted)]">
                  <svg className="w-12 h-12 mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                  <p className="text-sm font-bold">A galeria estÃ¡ vazia.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {items.map(item => (
                    <div key={item.id} onClick={() => { onChange(item.url); setOpen(false); }}
                      className={`group relative aspect-video rounded-xl overflow-hidden border-2 cursor-pointer transition-all ${value === item.url ? 'border-blue-500 shadow-md shadow-blue-500/20 scale-[1.02]' : 'border-transparent hover:border-[var(--admin-border-strong)]'}`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={item.url} alt={item.name} className="w-full h-full object-cover" />
                      {value === item.url && (
                        <div className="absolute inset-0 bg-blue-500/20 flex items-center justify-center">
                          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center shadow-lg">
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7"/></svg>
                          </div>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex flex-col justify-between p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="flex justify-end">
                          <button onClick={e => { e.stopPropagation(); handleDelete(item); }} className="p-1.5 bg-red-600/90 hover:bg-red-500 text-white rounded-lg shadow-sm backdrop-blur-sm">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                          </button>
                        </div>
                        <p className="text-white text-[10px] font-semibold">{formatBytes(item.size_bytes)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// â”€â”€ FormulÃ¡rios por seÃ§Ã£o â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function HeroForm({ c, set }: { c: Record<string, unknown>; set: (k: string, v: unknown) => void }) {
  return (
    <div className="space-y-4">
      <Field label="TÃ­tulo principal"><input className={inputCls} value={c.title as string ?? ''} onChange={e => set('title', e.target.value)} placeholder="Bem-vindo Ã  ICRE" /></Field>
      <Field label="SubtÃ­tulo"><textarea className={inputCls} rows={2} value={c.subtitle as string ?? ''} onChange={e => set('subtitle', e.target.value)} placeholder="Uma breve descriÃ§Ã£o..." /></Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Texto do botÃ£o"><input className={inputCls} value={c.cta_label as string ?? c.button_text as string ?? ''} onChange={e => set('cta_label', e.target.value)} placeholder="Saiba mais" /></Field>
        <Field label="Link do botÃ£o"><input className={inputCls} value={c.cta_url as string ?? c.button_link as string ?? ''} onChange={e => set('cta_url', e.target.value)} placeholder="/contato" /></Field>
      </div>
      <Field label="Imagem de fundo">
        <MediaPicker value={c.image_url as string ?? ''} onChange={v => set('image_url', v)} />
      </Field>
    </div>
  );
}

function AboutForm({ c, set }: { c: Record<string, unknown>; set: (k: string, v: unknown) => void }) {
  return (
    <div className="space-y-4">
      <Field label="TÃ­tulo"><input className={inputCls} value={c.title as string ?? ''} onChange={e => set('title', e.target.value)} placeholder="Sobre nÃ³s" /></Field>
      <Field label="Texto"><textarea className={inputCls} rows={8} value={c.text as string ?? c.body as string ?? ''} onChange={e => set('text', e.target.value)} placeholder="A histÃ³ria e missÃ£o da igreja..." /></Field>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="Ano de fundaÃ§Ã£o"><input type="number" className={inputCls} value={c.founded_year as string ?? ''} onChange={e => set('founded_year', e.target.value)} placeholder="1993" /></Field>
        <Field label="LocalizaÃ§Ã£o"><input className={inputCls} value={c.location as string ?? ''} onChange={e => set('location', e.target.value)} placeholder="Santa Maria, BrasÃ­lia-DF" /></Field>
      </div>
      <Field label="Imagem Destacada">
        <MediaPicker value={c.image_url as string ?? ''} onChange={v => set('image_url', v)} />
      </Field>
    </div>
  );
}

function MissionForm({ c, set }: { c: Record<string, unknown>; set: (k: string, v: unknown) => void }) {
  const items = (c.items ?? []) as MissionItem[];

  const setItem = (i: number, field: keyof MissionItem, value: string) => {
    const next = [...items];
    next[i] = { ...next[i], [field]: value };
    set('items', next);
  };
  const addItem = () => set('items', [...items, { title: '', text: '' }]);
  const removeItem = (i: number) => set('items', items.filter((_, idx) => idx !== i));

  return (
    <div className="space-y-4">
      <Field label="TÃ­tulo da seÃ§Ã£o"><input className={inputCls} value={c.title as string ?? ''} onChange={e => set('title', e.target.value)} placeholder="Nossa MissÃ£o" /></Field>
      <SectionDivider label="MÃ©tricas" />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
        <Field label="Membros Ativos"><input type="number" className={inputCls} value={c.active_members as string ?? ''} onChange={e => set('active_members', e.target.value)} placeholder="500" /></Field>
        <Field label="CÃ©lulas Ativas"><input type="number" className={inputCls} value={c.active_cells as string ?? ''} onChange={e => set('active_cells', e.target.value)} placeholder="4" /></Field>
        <Field label="Anos de HistÃ³ria"><input type="number" className={inputCls} value={c.history_years as string ?? ''} onChange={e => set('history_years', e.target.value)} placeholder="33" /></Field>
      </div>
      <SectionDivider label="Pilares" />
      <div className="space-y-4">
        {items.map((item, i) => (
          <div key={i} className="border border-[var(--admin-border-strong)] rounded-xl p-4 space-y-3 bg-[var(--admin-bg)]">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-[var(--admin-text-secondary)] uppercase">Pilar {i + 1}</span>
              <button onClick={() => removeItem(i)} className="w-7 h-7 flex items-center justify-center bg-[var(--admin-surface)] border border-[var(--admin-border)] rounded-lg text-red-400 hover:bg-red-500/10 hover:border-red-500/30 transition-all shadow-sm">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>
            <input className={inputCls} placeholder="TÃ­tulo do Pilar" value={item.title ?? ''} onChange={e => setItem(i, 'title', e.target.value)} />
            <textarea className={inputCls} placeholder="DescriÃ§Ã£o detalhada..." rows={3} value={item.text ?? ''} onChange={e => setItem(i, 'text', e.target.value)} />
          </div>
        ))}
        <button onClick={addItem}
          className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-[var(--admin-border)] rounded-xl text-sm font-bold text-[var(--admin-text-secondary)] hover:border-blue-500/50 hover:text-blue-400 hover:bg-blue-500/5 transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/></svg>
          Adicionar novo pilar
        </button>
      </div>
    </div>
  );
}

function SimpleHeaderForm({ c, set, titlePlaceholder, subtitlePlaceholder, hint }: {
  c: Record<string, unknown>; set: (k: string, v: unknown) => void;
  titlePlaceholder: string; subtitlePlaceholder: string; hint?: string;
}) {
  return (
    <div className="space-y-4">
      <Field label="TÃ­tulo da seÃ§Ã£o" hint={hint}><input className={inputCls} value={c.title as string ?? ''} onChange={e => set('title', e.target.value)} placeholder={titlePlaceholder} /></Field>
      <Field label="SubtÃ­tulo"><input className={inputCls} value={c.subtitle as string ?? ''} onChange={e => set('subtitle', e.target.value)} placeholder={subtitlePlaceholder} /></Field>
    </div>
  );
}

function YoutubeForm({ c, set }: { c: Record<string, unknown>; set: (k: string, v: unknown) => void }) {
  return (
    <div className="space-y-4">
      <Field label="TÃ­tulo"><input className={inputCls} value={c.title as string ?? ''} onChange={e => set('title', e.target.value)} placeholder="Ao Vivo" /></Field>
      <Field label="ID do vÃ­deo" hint="Cole apenas o ID apÃ³s ?v= na URL. Ex: youtube.com/watch?v=dQw4w... â†’ dQw4w...">
        <input className={inputCls} value={c.video_id as string ?? ''} onChange={e => set('video_id', e.target.value)} placeholder="dQw4w9WgXcQ" />
      </Field>
      <Field label="URL do canal"><input className={inputCls} value={c.channel_url as string ?? ''} onChange={e => set('channel_url', e.target.value)} placeholder="https://youtube.com/@..." /></Field>
    </div>
  );
}

function ContactForm({ c, set }: { c: Record<string, unknown>; set: (k: string, v: unknown) => void }) {
  return (
    <div className="space-y-4">
      <Field label="TÃ­tulo"><input className={inputCls} value={c.title as string ?? ''} onChange={e => set('title', e.target.value)} placeholder="Contato" /></Field>
      <Field label="SubtÃ­tulo"><input className={inputCls} value={c.subtitle as string ?? ''} onChange={e => set('subtitle', e.target.value)} placeholder="Venha nos visitar..." /></Field>
      <Field label="EndereÃ§o"><input className={inputCls} value={c.address as string ?? ''} onChange={e => set('address', e.target.value)} placeholder="Rua, nÃºmero, bairro â€” Cidade/UF" /></Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Telefone"><input className={inputCls} value={c.phone as string ?? ''} onChange={e => set('phone', e.target.value)} placeholder="(XX) XXXXX-XXXX" /></Field>
        <Field label="E-mail"><input className={inputCls} value={c.email as string ?? ''} onChange={e => set('email', e.target.value)} placeholder="contato@..." /></Field>
      </div>
      <Field label="HorÃ¡rios"><input className={inputCls} value={c.schedule as string ?? ''} onChange={e => set('schedule', e.target.value)} placeholder="Dom 9h e 19h / Qua 19h30" /></Field>
      <Field label="URL embed Google Maps" hint="No Maps: Compartilhar â†’ Incorporar mapa â†’ Copiar o link do src.">
        <textarea className={inputCls} rows={4} value={c.maps_embed_url as string ?? c.maps_url as string ?? ''} onChange={e => set('maps_embed_url', e.target.value)} placeholder="https://www.google.com/maps/embed?..." />
      </Field>
    </div>
  );
}

function IframePreview({ children, className }: { children: React.ReactNode; className?: string }) {
  const [iframeBody, setIframeBody] = useState<HTMLElement | null>(null);

  const handleLoad = (e: React.SyntheticEvent<HTMLIFrameElement>) => {
    const doc = (e.target as HTMLIFrameElement).contentDocument;
    if (!doc) return;

    Array.from(document.querySelectorAll('style, link[rel="stylesheet"]')).forEach(node => {
      doc.head.appendChild(node.cloneNode(true));
    });
    
    doc.documentElement.setAttribute('data-theme', 'dark');
    doc.body.style.margin = '0';
    doc.body.style.backgroundColor = '#0f172a';
    doc.body.classList.add('portal-scroll');
    
    setIframeBody(doc.body);
  };

  return (
    <iframe
      title="Mobile Preview"
      className={className}
      srcDoc="<!DOCTYPE html><html><head></head><body></body></html>"
      onLoad={handleLoad}
    >
      {iframeBody && createPortal(children, iframeBody)}
    </iframe>
  );
}

// â”€â”€ Componente principal â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

interface SiteEditorProps {
  blocks: SiteBlock[];
  pastors: Pastor[];
  cells: PublicCell[];
  events: PublicEvent[];
}

export function SiteEditor({ blocks: initialBlocks, pastors, cells, events }: SiteEditorProps) {
  const { toast, dismiss } = useToast();

  const [blocks, setBlocks]       = useState<SiteBlock[]>(initialBlocks);
  const [activeKey, setActiveKey] = useState<SectionKey | null>(null);
  const [hasUnpublished, setHasUnpublished] = useState(() => {
    return initialBlocks.some(b => {
      if (!b.published_content) return true;
      return JSON.stringify(b.content) !== JSON.stringify(b.published_content);
    });
  });
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [viewMode, setViewMode]   = useState<'desktop' | 'mobile'>('desktop');
  
  const [isPending, startTransition] = useTransition();
  const [isPublishing, startPublish] = useTransition();
  const pendingRef = useRef<Record<string, unknown> | null>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const activeBlock = activeKey ? blocks.find(b => b.type === activeKey) : null;
  const activeContent = (activeBlock?.content ?? {}) as Record<string, unknown>;

  const handleAutoSave = useCallback(async () => {
    if (!activeKey || !pendingRef.current) return;
    const blockId = blocks.find(b => b.type === activeKey)?.id;
    if (!blockId) return;
    
    setIsAutoSaving(true);
    const r = await saveBlockDraft(blockId, pendingRef.current);
    setIsAutoSaving(false);
    if (r.error) toast('error', r.error);
  }, [activeKey, blocks, toast]);

  const set = useCallback((key: string, value: unknown) => {
    if (!activeKey) return;
    setBlocks(prev => prev.map(b => {
      if (b.type !== activeKey) return b;
      const next = { ...b.content, [key]: value };
      pendingRef.current = next;
      return { ...b, content: next };
    }));
    setHasUnpublished(true);

    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
       handleAutoSave();
    }, 1500);
  }, [activeKey, handleAutoSave]);

  const handleToggle = () => {
    if (!activeBlock) return;
    const next = !activeBlock.is_active;
    setBlocks(prev => prev.map(b => b.type === activeKey ? { ...b, is_active: next } : b));
    setHasUnpublished(true);
    startTransition(async () => {
      const r = await toggleBlock(activeBlock.id, next);
      if (r.error) {
        toast('error', r.error);
        setBlocks(prev => prev.map(b => b.type === activeKey ? { ...b, is_active: !next } : b));
      }
    });
  };

  const handlePublish = () => {
    startPublish(async () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
        await handleAutoSave();
      }
      const id = toast('loading', 'Publicando site...');
      const r = await publishAllBlocks();
      dismiss(id);
      if (r.error) toast('error', r.error);
      else { toast('success', 'Site publicado com sucesso.'); setHasUnpublished(false); }
    });
  };

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnpublished) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnpublished]);

  useEffect(() => {
    if (activeKey) {
      setTimeout(() => {
        let el = document.getElementById(`preview-section-${activeKey}`);
        if (!el) {
          const iframe = document.querySelector('iframe[title="Mobile Preview"]') as HTMLIFrameElement;
          if (iframe && iframe.contentDocument) {
            el = iframe.contentDocument.getElementById(`preview-section-${activeKey}`);
          }
        }
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    }
  }, [activeKey]);

  const renderedBlocks = blocks
    .filter(b => b.is_active)
    .sort((a, b) => a.order_idx - b.order_idx)
    .map(block => (
      <div key={block.id} id={`preview-section-${block.type}`} className="relative group/block">
        <div className="absolute inset-0 border-2 border-transparent group-hover/block:border-blue-500/50 pointer-events-none z-50 transition-colors" />
        
        {block.type === 'hero'    && <HeroSection    content={block.content as any} />}
        {block.type === 'about'   && <AboutSection   content={block.content as any} />}
        {block.type === 'mission' && <MissionSection content={block.content as any} />}
        {block.type === 'pastors' && <PastorsSection content={block.content as any} pastors={pastors} />}
        {block.type === 'cells'   && <CellsSection   content={block.content as any} cells={cells} />}
        {block.type === 'events'  && <EventsSection  content={block.content as any} events={events} />}
        {block.type === 'youtube' && <YoutubeSection content={block.content as any} />}
        {block.type === 'contact' && <ContactSection content={block.content as any} />}
        
        {['hero','about','mission','pastors','cells','events','youtube','contact'].includes(block.type) && (
          <div className="absolute top-2 left-2 px-2 py-1 bg-blue-600 text-white text-[10px] font-bold rounded opacity-0 group-hover/block:opacity-100 pointer-events-none z-50 uppercase shadow">
            {SECTIONS.find(s => s.key === block.type)?.label || block.type}
          </div>
        )}
      </div>
    ));

  // On Mobile, if we have an active key, the sidebar acts as a full-screen drawer.
  // On Desktop, if active key is null, the sidebar shows the list. If active key is set, it shows the form.
  
  return (
    <div className="flex flex-col h-[calc(100vh-2rem)] md:h-[calc(100vh-8rem)] -m-4 md:m-0 overflow-hidden bg-[var(--admin-bg)] relative">
      
      {/* â”€â”€ Top Bar â”€â”€ */}
      <div className="flex items-center justify-between px-4 py-3 bg-[var(--admin-surface)] border-b border-[var(--admin-border)] shrink-0 z-20 shadow-sm">
        <div className="flex items-center gap-3">
          {/* Mobile Back Button when in edit mode */}
          {activeKey && (
            <button onClick={() => setActiveKey(null)} className="md:hidden w-8 h-8 flex items-center justify-center rounded-lg bg-[var(--admin-surface-alt)] border border-[var(--admin-border)]">
              <svg className="w-5 h-5 text-slate-600 dark:text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
            </button>
          )}
          
          {/* View Toggles (Desktop only) */}
          <div className="hidden md:flex items-center bg-[var(--admin-surface-alt)] rounded-lg p-1 border border-[var(--admin-border)]">
            <button onClick={() => setViewMode('desktop')} className={`p-1.5 rounded-md transition-all ${viewMode === 'desktop' ? 'bg-white text-white shadow' : 'text-slate-500 dark:text-slate-400 hover:text-slate-200'}`} title="Desktop">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
            </button>
            <button onClick={() => setViewMode('mobile')} className={`p-1.5 rounded-md transition-all ${viewMode === 'mobile' ? 'bg-white text-white shadow' : 'text-slate-500 dark:text-slate-400 hover:text-slate-200'}`} title="Mobile">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
            </button>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <a href="/" target="_blank" rel="noopener noreferrer" className="hidden sm:flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-slate-200 transition-colors bg-[var(--admin-surface-alt)] px-3 py-2 rounded-lg border border-[var(--admin-border)]">
            Ver Site
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
          </a>
          
          <div className="flex items-center gap-2">
            {isAutoSaving ? (
              <span className="hidden sm:flex items-center gap-1.5 text-xs text-blue-400 bg-blue-500/10 border border-blue-500/20 rounded-md px-2 py-1 font-medium">
                <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/></svg>
                Salvando...
              </span>
            ) : hasUnpublished ? (
              <span className="hidden sm:flex items-center gap-1.5 text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-md px-2 py-1 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                AlteraÃ§Ãµes pendentes
              </span>
            ) : (
              <span className="hidden sm:flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-md px-2 py-1 font-medium">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/></svg>
                Publicado
              </span>
            )}
          <button onClick={handlePublish} disabled={isPublishing}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg transition-colors disabled:opacity-50 shadow-sm">
            {isPublishing
              ? <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/></svg>
              : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/></svg>
            }
          </button>
        </div>
      </div>
    </div>

    <div className="flex-1 flex overflow-hidden relative">
        
        {/* â”€â”€ Sidebar (Master-Detail) â”€â”€ */}
        <aside className={`absolute inset-0 md:relative z-30 flex flex-col w-full md:w-[400px] shrink-0 bg-[var(--admin-surface)] border-r border-[var(--admin-border)] shadow-2xl md:shadow-none transition-transform duration-300 ${!activeKey && 'md:w-80'} ${!activeKey ? 'translate-x-0' : (activeKey ? 'translate-x-0' : '-translate-x-full')} md:translate-x-0`}>
          
          {/* Master View: List of Sections */}
          {!activeKey ? (
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              <h2 className="text-xs font-black uppercase tracking-widest text-[var(--admin-text-muted)] mb-4 ml-2">Blocos do Site</h2>
              {SECTIONS.map(s => {
                const b = blocks.find(bl => bl.type === s.key);
                const hasDraft = b && (!b.published_content || JSON.stringify(b.content) !== JSON.stringify(b.published_content));
                return (
                  <button key={s.key} onClick={() => setActiveKey(s.key)}
                    className="w-full flex items-center gap-4 p-4 rounded-2xl bg-[var(--admin-surface-alt)] border border-[var(--admin-border)] hover:border-blue-500/50 hover:bg-blue-500/5 transition-all text-left group relative">
                    <div className="w-12 h-12 rounded-xl bg-[var(--admin-bg)] border border-[var(--admin-border)] flex items-center justify-center text-[var(--admin-text-secondary)] group-hover:text-blue-400 group-hover:scale-110 transition-all shadow-sm">
                      {s.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm text-[var(--admin-text-primary)]">{s.label}</p>
                      {b && (
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`w-2 h-2 rounded-full ${b.is_active ? 'bg-emerald-400' : 'bg-slate-500'}`} />
                          <p className={`text-[11px] font-semibold ${b.is_active ? 'text-emerald-500' : 'text-slate-500'}`}>
                            {b.is_active ? 'VisÃ­vel no site' : 'Oculto'}
                          </p>
                          {hasDraft && (
                            <>
                              <span className="w-1 h-1 rounded-full bg-slate-600 ml-1" />
                              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse ml-1" />
                              <p className="text-[11px] font-bold text-amber-500">Pendente</p>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                    <svg className="w-5 h-5 text-slate-600 group-hover:text-blue-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                  </button>
                );
              })}
            </div>
          ) : (
            
            /* Detail View: Form for the active section */
            <div className="flex flex-col h-full bg-[var(--admin-surface)]">
              <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--admin-border)] shrink-0 bg-[var(--admin-surface-alt)]">
                <div className="flex items-center gap-3">
                  <button onClick={() => setActiveKey(null)} className="hidden md:flex w-8 h-8 items-center justify-center rounded-lg bg-[var(--admin-surface)] border border-[var(--admin-border)] hover:bg-black/5 dark:bg-white/5 transition-colors">
                    <svg className="w-5 h-5 text-slate-600 dark:text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
                  </button>
                  <h2 className="font-bold text-[var(--admin-text-primary)] text-[15px]">{SECTIONS.find(s => s.key === activeKey)?.label}</h2>
                </div>
                {activeBlock && (
                  <label className="flex items-center gap-2 cursor-pointer bg-[var(--admin-bg)] px-3 py-1.5 rounded-lg border border-[var(--admin-border)]">
                    <span className={`text-xs font-bold ${activeBlock.is_active ? 'text-emerald-400' : 'text-slate-500 dark:text-slate-400'}`}>{activeBlock.is_active ? 'VisÃ­vel' : 'Oculto'}</span>
                    <div className="relative inline-flex h-5 w-9 items-center rounded-full transition-colors" style={{ background: activeBlock.is_active ? '#10b981' : 'var(--admin-border-strong)' }}>
                      <input type="checkbox" className="sr-only" checked={activeBlock.is_active} onChange={handleToggle} disabled={isPending} />
                      <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform shadow-sm ${activeBlock.is_active ? 'translate-x-4' : 'translate-x-1'}`} />
                    </div>
                  </label>
                )}
              </div>
              <div className="flex-1 overflow-y-auto px-5 py-6" style={{ scrollbarWidth: 'thin' }}>
                {!activeBlock ? (
                  <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-5 text-center">
                    <p className="text-sm font-bold text-amber-400">Bloco nÃ£o encontrado no banco de dados.</p>
                  </div>
                ) : (
                  <div className="pb-10">
                    {activeKey === 'hero'    && <HeroForm c={activeContent} set={set} />}
                    {activeKey === 'about'   && <AboutForm c={activeContent} set={set} />}
                    {activeKey === 'mission' && <MissionForm c={activeContent} set={set} />}
                    {activeKey === 'pastors' && <SimpleHeaderForm c={activeContent} set={set} titlePlaceholder="Nossa LideranÃ§a" subtitlePlaceholder="ConheÃ§a quem guia nossa comunidade" hint="A lista de pastores Ã© gerenciada no mÃ³dulo LideranÃ§a." />}
                    {activeKey === 'cells'   && <SimpleHeaderForm c={activeContent} set={set} titlePlaceholder="Nossas CÃ©lulas" subtitlePlaceholder="Encontre uma cÃ©lula perto de vocÃª" hint="As cÃ©lulas sÃ£o gerenciadas no mÃ³dulo de CÃ©lulas." />}
                    {activeKey === 'events'  && <SimpleHeaderForm c={activeContent} set={set} titlePlaceholder="PrÃ³ximos Eventos" subtitlePlaceholder="Venha participar" hint="Os eventos sÃ£o gerenciados automaticamente." />}
                    {activeKey === 'youtube' && <YoutubeForm c={activeContent} set={set} />}
                    {activeKey === 'contact' && <ContactForm c={activeContent} set={set} />}
                  </div>
                )}
              </div>
            </div>
          )}
        </aside>

        {/* â”€â”€ Native Real-time Preview â”€â”€ */}
        {/* On mobile, if activeKey is set, we hide the preview under the absolute sidebar. But if activeKey is null, we show preview. Actually we should always render it so it's under. */}
        <div className={`flex-1 flex flex-col bg-slate-50 dark:bg-slate-900 overflow-y-auto relative ${activeKey ? 'hidden md:flex' : 'flex'} portal-scroll`}>
          
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 px-4 py-2 bg-black/80 backdrop-blur-md rounded-full border border-black/10 dark:border-white/10 shadow-2xl flex items-center gap-2 pointer-events-none">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[11px] font-bold text-white uppercase tracking-wider">Preview Real-time</span>
          </div>

          <div className={`flex-1 mx-auto transition-all duration-300 bg-[var(--admin-bg)] ${viewMode === 'mobile' ? 'w-full max-w-[400px] border-x border-slate-700 shadow-2xl rounded-[2rem] overflow-hidden my-6 max-h-[calc(100vh-6rem)] ring-8 ring-slate-800' : 'w-full min-h-full'}`}>
            {viewMode === 'mobile' ? (
              <IframePreview className="w-full h-full border-0">
                <div data-theme="dark" className="w-full min-h-full bg-[#0f172a]">
                  {renderedBlocks}
                </div>
              </IframePreview>
            ) : (
              <div className="w-full h-full overflow-y-auto portal-scroll">
                <div data-theme="dark" className="w-full min-h-full bg-[#0f172a]">
                  {renderedBlocks}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Mobile floating button to open sections list if we are just viewing the preview */}
        {!activeKey && (
          <button onClick={() => setActiveKey(null)} className="md:hidden absolute bottom-6 right-6 w-14 h-14 bg-blue-600 text-white rounded-full shadow-2xl flex items-center justify-center border-2 border-blue-400 z-40">
             <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
          </button>
        )}

      </div>
    </div>
  );
}
