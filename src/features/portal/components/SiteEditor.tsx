'use client'

import React, { useState, useTransition, useCallback, useRef } from 'react';
import { useToast } from '@/features/core/components/ToastContext';
import { saveBlockDraft, publishAllBlocks, toggleBlock } from '@/features/portal/actions/portal';
import { listSiteMedia, uploadSiteMedia, deleteSiteMedia } from '@/features/portal/actions/portal-actions';
import type { SiteBlock, MissionItem } from '@/features/portal/types';
import type { SiteMediaItem } from '@/features/portal/actions/portal-actions';

// ── Seções editáveis ─────────────────────────────────────────────

type SectionKey = 'hero' | 'about' | 'mission' | 'pastors' | 'cells' | 'events' | 'youtube' | 'contact';

interface SectionMeta { key: SectionKey; label: string; icon: React.ReactNode }

const SECTIONS: SectionMeta[] = [
  { key: 'hero',    label: 'Capa',       icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg> },
  { key: 'about',   label: 'Sobre nós',  icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
  { key: 'mission', label: 'Missão',     icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" /></svg> },
  { key: 'pastors', label: 'Liderança',  icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg> },
  { key: 'cells',   label: 'Células',    icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg> },
  { key: 'events',  label: 'Eventos',    icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg> },
  { key: 'youtube', label: 'YouTube',    icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
  { key: 'contact', label: 'Contato',    icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg> },
];

// ── Primitivos ───────────────────────────────────────────────────

const inputCls = 'w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm text-slate-800 placeholder-slate-400 transition-all';

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">{label}</label>
      {children}
      {hint && <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">{hint}</p>}
    </div>
  );
}

function SectionDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 pt-1">
      <span className="text-xs font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">{label}</span>
      <div className="flex-1 h-px bg-slate-100" />
    </div>
  );
}

// ── Galeria de mídia ─────────────────────────────────────────────

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
    <div className="space-y-2">
      {value && (
        <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-slate-100 border border-slate-200">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="" className="w-full h-full object-cover" />
          <button onClick={() => onChange('')} className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-black/80 text-white rounded-lg transition-colors">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
      )}
      <div className="flex gap-2">
        <button type="button" onClick={() => { setOpen(true); load(); }}
          className="flex-1 flex items-center justify-center gap-2 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
          {value ? 'Trocar' : 'Galeria'}
        </button>
        <input className={`${inputCls} flex-1`} value={value} onChange={e => onChange(e.target.value)} placeholder="Ou cole uma URL..." />
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 shrink-0">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Galeria de imagens</h3>
                <p className="text-xs text-slate-400 mt-0.5">Selecione ou envie uma imagem</p>
              </div>
              <button onClick={() => setOpen(false)} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="px-5 py-3 border-b border-slate-100 shrink-0">
              <div className="flex justify-between text-xs text-slate-500 mb-1.5">
                <span>Armazenamento</span>
                <span className={usedPct > 85 ? 'text-red-500 font-semibold' : ''}>{usedMB.toFixed(1)} MB / {QUOTA_MB} MB</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-1.5">
                <div className={`h-1.5 rounded-full transition-all ${usedPct > 85 ? 'bg-red-500' : usedPct > 60 ? 'bg-amber-400' : 'bg-blue-500'}`} style={{ width: `${usedPct}%` }} />
              </div>
            </div>
            <div className="px-5 py-3 border-b border-slate-100 shrink-0">
              <label className={`flex items-center justify-center gap-2 py-2.5 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${uploading ? 'border-slate-200 text-slate-400' : 'border-slate-300 hover:border-blue-400 hover:text-blue-600 text-slate-500'}`}>
                {uploading ? (
                  <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/></svg><span className="text-xs font-semibold">Enviando...</span></>
                ) : (
                  <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/></svg><span className="text-xs font-semibold">Enviar imagem</span><span className="text-xs text-slate-400">JPG, PNG, WebP · Máx. 10 MB</span></>
                )}
                <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="sr-only" onChange={handleUpload} disabled={uploading} />
              </label>
              {error && <p className="mt-2 text-xs text-red-500 font-medium">{error}</p>}
            </div>
            <div className="flex-1 overflow-y-auto p-4" style={{ scrollbarWidth: 'thin' }}>
              {loading ? (
                <div className="flex justify-center py-10"><svg className="w-6 h-6 animate-spin text-slate-300" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/></svg></div>
              ) : items.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-slate-400">
                  <svg className="w-10 h-10 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                  <p className="text-sm font-medium">Galeria vazia</p>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-3">
                  {items.map(item => (
                    <div key={item.id} onClick={() => { onChange(item.url); setOpen(false); }}
                      className={`group relative aspect-video rounded-xl overflow-hidden bg-slate-100 border-2 cursor-pointer transition-all ${value === item.url ? 'border-blue-500' : 'border-transparent hover:border-slate-300'}`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={item.url} alt={item.name} className="w-full h-full object-cover" />
                      {value === item.url && (
                        <div className="absolute inset-0 bg-blue-500/20 flex items-center justify-center">
                          <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                            <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7"/></svg>
                          </div>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all flex flex-col justify-between p-2 opacity-0 group-hover:opacity-100">
                        <div className="flex justify-end">
                          <button onClick={e => { e.stopPropagation(); handleDelete(item); }} className="p-1 bg-red-600 text-white rounded-lg">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                          </button>
                        </div>
                        <p className="text-white text-xs">{formatBytes(item.size_bytes)}</p>
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

// ── Formulários por seção ────────────────────────────────────────

function HeroForm({ c, set }: { c: Record<string, unknown>; set: (k: string, v: unknown) => void }) {
  return (
    <>
      <Field label="Título principal"><input className={inputCls} value={c.title as string ?? ''} onChange={e => set('title', e.target.value)} placeholder="Bem-vindo à ICRE" /></Field>
      <Field label="Subtítulo"><textarea className={inputCls} rows={2} value={c.subtitle as string ?? ''} onChange={e => set('subtitle', e.target.value)} placeholder="Uma breve descrição..." /></Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Texto do botão"><input className={inputCls} value={c.cta_label as string ?? c.button_text as string ?? ''} onChange={e => set('cta_label', e.target.value)} placeholder="Saiba mais" /></Field>
        <Field label="Link do botão"><input className={inputCls} value={c.cta_url as string ?? c.button_link as string ?? ''} onChange={e => set('cta_url', e.target.value)} placeholder="/contato" /></Field>
      </div>
      <Field label="Imagem de fundo">
        <MediaPicker value={c.image_url as string ?? ''} onChange={v => set('image_url', v)} />
      </Field>
    </>
  );
}

function AboutForm({ c, set }: { c: Record<string, unknown>; set: (k: string, v: unknown) => void }) {
  return (
    <>
      <Field label="Título"><input className={inputCls} value={c.title as string ?? ''} onChange={e => set('title', e.target.value)} placeholder="Sobre nós" /></Field>
      <Field label="Texto"><textarea className={inputCls} rows={6} value={c.text as string ?? c.body as string ?? ''} onChange={e => set('text', e.target.value)} placeholder="A história e missão da igreja..." /></Field>
      <Field label="Imagem">
        <MediaPicker value={c.image_url as string ?? ''} onChange={v => set('image_url', v)} />
      </Field>
    </>
  );
}

function MissionForm({ c, set }: { c: Record<string, unknown>; set: (k: string, v: unknown) => void }) {
  const items = (c.items ?? []) as MissionItem[];

  const setItem = (i: number, field: keyof MissionItem, value: string) => {
    const next = [...items];
    next[i] = { ...next[i], [field]: value };
    set('items', next);
  };
  const addItem = () => set('items', [...items, { icon: '', title: '', text: '' }]);
  const removeItem = (i: number) => set('items', items.filter((_, idx) => idx !== i));

  return (
    <>
      <Field label="Título da seção"><input className={inputCls} value={c.title as string ?? ''} onChange={e => set('title', e.target.value)} placeholder="Nossa Missão" /></Field>
      <SectionDivider label="Pilares" />
      <div className="space-y-3">
        {items.map((item, i) => (
          <div key={i} className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Pilar {i + 1}</span>
              <button onClick={() => removeItem(i)} className="p-1 text-slate-400 hover:text-red-500 transition-colors">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>
            <input className={inputCls} placeholder="Título" value={item.title ?? ''} onChange={e => setItem(i, 'title', e.target.value)} />
            <textarea className={inputCls} placeholder="Descrição" rows={2} value={item.text ?? ''} onChange={e => setItem(i, 'text', e.target.value)} />
            <input className={inputCls} placeholder="Ícone (emoji)" value={item.icon ?? ''} onChange={e => setItem(i, 'icon', e.target.value)} />
          </div>
        ))}
        <button onClick={addItem}
          className="w-full flex items-center justify-center gap-2 py-2.5 border border-dashed border-slate-300 rounded-xl text-sm text-slate-500 hover:border-slate-400 hover:text-slate-700 transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/></svg>
          Adicionar pilar
        </button>
      </div>
    </>
  );
}

function SimpleHeaderForm({ c, set, titlePlaceholder, subtitlePlaceholder, hint }: {
  c: Record<string, unknown>; set: (k: string, v: unknown) => void;
  titlePlaceholder: string; subtitlePlaceholder: string; hint?: string;
}) {
  return (
    <>
      <Field label="Título da seção" hint={hint}><input className={inputCls} value={c.title as string ?? ''} onChange={e => set('title', e.target.value)} placeholder={titlePlaceholder} /></Field>
      <Field label="Subtítulo"><input className={inputCls} value={c.subtitle as string ?? ''} onChange={e => set('subtitle', e.target.value)} placeholder={subtitlePlaceholder} /></Field>
    </>
  );
}

function YoutubeForm({ c, set }: { c: Record<string, unknown>; set: (k: string, v: unknown) => void }) {
  return (
    <>
      <Field label="Título"><input className={inputCls} value={c.title as string ?? ''} onChange={e => set('title', e.target.value)} placeholder="Ao Vivo" /></Field>
      <Field label="ID do vídeo" hint="Cole apenas o ID após ?v= na URL. Ex: para youtube.com/watch?v=dQw4w9WgXcQ cole dQw4w9WgXcQ">
        <input className={inputCls} value={c.video_id as string ?? ''} onChange={e => set('video_id', e.target.value)} placeholder="dQw4w9WgXcQ" />
      </Field>
      <Field label="URL do canal"><input className={inputCls} value={c.channel_url as string ?? ''} onChange={e => set('channel_url', e.target.value)} placeholder="https://youtube.com/@..." /></Field>
    </>
  );
}

function ContactForm({ c, set }: { c: Record<string, unknown>; set: (k: string, v: unknown) => void }) {
  return (
    <>
      <Field label="Título"><input className={inputCls} value={c.title as string ?? ''} onChange={e => set('title', e.target.value)} placeholder="Contato" /></Field>
      <Field label="Subtítulo"><input className={inputCls} value={c.subtitle as string ?? ''} onChange={e => set('subtitle', e.target.value)} placeholder="Venha nos visitar..." /></Field>
      <Field label="Endereço"><input className={inputCls} value={c.address as string ?? ''} onChange={e => set('address', e.target.value)} placeholder="Rua, número, bairro — Cidade/UF" /></Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Telefone"><input className={inputCls} value={c.phone as string ?? ''} onChange={e => set('phone', e.target.value)} placeholder="(XX) XXXXX-XXXX" /></Field>
        <Field label="E-mail"><input className={inputCls} value={c.email as string ?? ''} onChange={e => set('email', e.target.value)} placeholder="contato@..." /></Field>
      </div>
      <Field label="Horários"><input className={inputCls} value={c.schedule as string ?? ''} onChange={e => set('schedule', e.target.value)} placeholder="Dom 9h e 19h / Qua 19h30" /></Field>
      <Field label="URL embed Google Maps" hint="No Google Maps: Compartilhar → Incorporar → copiar o src do iframe.">
        <textarea className={inputCls} rows={3} value={c.maps_embed_url as string ?? c.maps_url as string ?? ''} onChange={e => set('maps_embed_url', e.target.value)} placeholder="https://www.google.com/maps/embed?..." />
      </Field>
    </>
  );
}

// ── Componente principal ─────────────────────────────────────────

interface SiteEditorProps {
  blocks: SiteBlock[];
}

export function SiteEditor({ blocks: initialBlocks }: SiteEditorProps) {
  const { toast, dismiss } = useToast();

  const [blocks, setBlocks]       = useState<SiteBlock[]>(initialBlocks);
  const [activeKey, setActiveKey] = useState<SectionKey>('hero');
  const [hasUnsaved, setHasUnsaved] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [isPublishing, startPublish] = useTransition();
  const pendingRef = useRef<Record<string, unknown> | null>(null);

  const activeBlock = blocks.find(b => b.type === activeKey);
  const activeContent = (activeBlock?.content ?? {}) as Record<string, unknown>;

  const set = useCallback((key: string, value: unknown) => {
    setBlocks(prev => prev.map(b => {
      if (b.type !== activeKey) return b;
      const next = { ...b.content, [key]: value };
      pendingRef.current = next;
      return { ...b, content: next };
    }));
    setHasUnsaved(true);
  }, [activeKey]);

  const handleToggle = () => {
    if (!activeBlock) return;
    const next = !activeBlock.is_active;
    setBlocks(prev => prev.map(b => b.type === activeKey ? { ...b, is_active: next } : b));
    startTransition(async () => {
      const r = await toggleBlock(activeBlock.id, next);
      if (r.error) {
        toast('error', r.error);
        setBlocks(prev => prev.map(b => b.type === activeKey ? { ...b, is_active: !next } : b));
      }
    });
  };

  const handleSave = () => {
    if (!activeBlock) return;
    startTransition(async () => {
      const id = toast('loading', 'Salvando rascunho...');
      const r = await saveBlockDraft(activeBlock.id, activeBlock.content);
      dismiss(id);
      if (r.error) toast('error', r.error);
      else { toast('success', 'Rascunho salvo.'); setHasUnsaved(false); }
    });
  };

  const handlePublish = () => {
    startPublish(async () => {
      const id = toast('loading', 'Publicando site...');
      const r = await publishAllBlocks();
      dismiss(id);
      if (r.error) toast('error', r.error);
      else { toast('success', 'Site publicado com sucesso.'); setHasUnsaved(false); }
    });
  };

  const c = activeContent;

  return (
    <div className="flex h-[calc(100vh-8rem)] rounded-2xl overflow-hidden border border-slate-200 shadow-sm bg-white">

      {/* ── Sidebar ── */}
      <aside className="w-52 shrink-0 bg-slate-950 flex flex-col border-r border-slate-800">
        <div className="px-4 py-4 border-b border-slate-800">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Seções do site</p>
        </div>

        <nav className="flex-1 overflow-y-auto py-2" style={{ scrollbarWidth: 'thin', scrollbarColor: '#334155 transparent' }}>
          {SECTIONS.map(s => {
            const b = blocks.find(bl => bl.type === s.key);
            const active = activeKey === s.key;
            return (
              <button key={s.key} onClick={() => setActiveKey(s.key)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-all duration-150 ${active ? 'bg-blue-600/15 border-r-2 border-blue-500' : 'border-r-2 border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'}`}
              >
                <span className={active ? 'text-blue-400' : 'text-slate-500'}>{s.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className={`text-xs font-semibold truncate ${active ? 'text-blue-300' : ''}`}>{s.label}</p>
                  {b && (
                    <p className={`text-xs mt-0.5 ${b.is_active ? 'text-emerald-500' : 'text-slate-600'}`}>
                      {b.is_active ? 'Visível' : 'Oculto'}
                    </p>
                  )}
                </div>
              </button>
            );
          })}
        </nav>

        <div className="p-3 border-t border-slate-800">
          <a href="/" target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
            Ver site ao vivo
          </a>
        </div>
      </aside>

      {/* ── Área de edição ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0 gap-4">
          <div className="min-w-0">
            <h2 className="font-bold text-slate-900 truncate">{SECTIONS.find(s => s.key === activeKey)?.label}</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {activeBlock?.is_active ? 'Visível no site' : 'Oculto no site'}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {activeBlock && (
              <button onClick={handleToggle} disabled={isPending}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-colors disabled:opacity-50 ${
                  activeBlock.is_active
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                    : 'border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-100'
                }`}
              >
                {activeBlock.is_active
                  ? <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                  : <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"/></svg>
                }
                {activeBlock.is_active ? 'Visível' : 'Oculto'}
              </button>
            )}

            {hasUnsaved && (
              <span className="flex items-center gap-1.5 text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-1.5 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                Não salvo
              </span>
            )}

            <button onClick={handleSave} disabled={isPending}
              className="flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl transition-colors disabled:opacity-50">
              {isPending
                ? <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/></svg>
                : <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"/></svg>
              }
              Salvar rascunho
            </button>

            <button onClick={handlePublish} disabled={isPublishing}
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition-colors disabled:opacity-50">
              {isPublishing
                ? <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/></svg>
                : <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/></svg>
              }
              Publicar site
            </button>
          </div>
        </div>

        {/* Formulário */}
        <div className="flex-1 overflow-y-auto px-6 py-6" style={{ scrollbarWidth: 'thin', scrollbarColor: '#e2e8f0 transparent' }}>
          {!activeBlock ? (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
              <p className="text-sm font-semibold text-amber-800">Bloco não encontrado no banco de dados.</p>
              <p className="text-xs text-amber-600 mt-1">Execute a migration SQL para criar os blocos iniciais com os defaults.</p>
            </div>
          ) : (
            <div className="max-w-xl space-y-5">
              {activeKey === 'hero'    && <HeroForm c={c} set={set} />}
              {activeKey === 'about'   && <AboutForm c={c} set={set} />}
              {activeKey === 'mission' && <MissionForm c={c} set={set} />}
              {activeKey === 'pastors' && <SimpleHeaderForm c={c} set={set} titlePlaceholder="Nossa Liderança" subtitlePlaceholder="Conheça quem guia nossa comunidade" hint="Os pastores são cadastrados no módulo de Liderança. Aqui você configura apenas o título desta seção." />}
              {activeKey === 'cells'   && <SimpleHeaderForm c={c} set={set} titlePlaceholder="Nossas Células" subtitlePlaceholder="Encontre uma célula perto de você" hint="As células são gerenciadas no módulo de Células. Aqui você configura apenas o título desta seção." />}
              {activeKey === 'events'  && <SimpleHeaderForm c={c} set={set} titlePlaceholder="Próximos Eventos" subtitlePlaceholder="Venha participar" hint="Os eventos são gerenciados no módulo de Eventos. Aqui você configura apenas o título desta seção." />}
              {activeKey === 'youtube' && <YoutubeForm c={c} set={set} />}
              {activeKey === 'contact' && <ContactForm c={c} set={set} />}
            </div>
          )}
        </div>

        <div className="px-6 py-3 border-t border-slate-100 shrink-0 bg-slate-50/50">
          <p className="text-xs text-slate-400">
            <strong>Rascunho</strong> salva localmente e no banco sem afetar o site. <strong>Publicar</strong> torna as alterações visíveis ao público.
          </p>
        </div>
      </div>
    </div>
  );
}