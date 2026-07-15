'use client'

import React, { useState, useTransition, useCallback, useRef, useEffect } from 'react';
import { useToast } from '@/features/core/components/ToastContext';
import { saveBlockDraft } from '@/features/portal/actions/portal';
import { listSiteMedia, uploadSiteMedia, deleteSiteMedia } from '@/features/portal/actions/portal-actions';
import type {
  SiteBlock, SiteBlockType, BlockLayout, BlockAlignment, BlockWidth, BlockPadding,
  MissionItem,
} from '@/features/portal/types';
import type { SiteMediaItem } from '@/features/portal/actions/portal-actions';

const BLOCK_LABELS: Partial<Record<SiteBlockType, string>> = {
  hero:        'Capa',
  about:       'Sobre nós',
  mission:     'Missão',
  events:      'Eventos',
  youtube:     'YouTube',
  contact:     'Contato',
  custom_text: 'Texto livre',
  banner:      'Banner',
};

const SITE_MEDIA_QUOTA_MB = 200;

interface BlockEditorProps {
  block: SiteBlock;
  onClose: () => void;
  onContentChange?: (blockId: string, content: Record<string, unknown>) => void;
}

// ── Primitivos ───────────────────────────────────────────────────

const inputCls = 'w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm text-slate-800 placeholder-slate-400 transition-all';
const labelCls = 'block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label className={labelCls}>{label}</label>{children}</div>;
}

function Hint({ children }: { children: React.ReactNode }) {
  return (
    <p className="flex items-start gap-2 text-xs text-slate-500 dark:text-slate-400 bg-slate-50 border border-slate-100 rounded-lg px-3 py-2.5 leading-relaxed">
      <svg className="w-3.5 h-3.5 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      {children}
    </p>
  );
}

function SectionDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 pt-1">
      <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest whitespace-nowrap">{label}</span>
      <div className="flex-1 h-px bg-slate-100" />
    </div>
  );
}

function ColorField({ label, value, fallback, onChange }: {
  label: string; value: string | undefined; fallback: string; onChange: (v: string) => void;
}) {
  return (
    <Field label={label}>
      <div className="flex gap-2">
        <input type="color" value={value || fallback} onChange={e => onChange(e.target.value)} className="w-9 h-9 rounded-lg border border-slate-200 cursor-pointer p-0.5 bg-white" />
        <input className={`${inputCls} flex-1`} value={value ?? ''} onChange={e => onChange(e.target.value)} />
      </div>
    </Field>
  );
}

// ── Seletor de mídia (galeria) ───────────────────────────────────

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

interface MediaPickerProps {
  value: string;
  onChange: (url: string) => void;
}

function MediaPicker({ value, onChange }: MediaPickerProps) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<SiteMediaItem[]>([]);
  const [usedBytes, setUsedBytes] = useState(0);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const loadMedia = useCallback(async () => {
    setLoading(true);
    setError(null);
    const result = await listSiteMedia();
    setLoading(false);
    if ('error' in result) { setError(result.error); return; }
    setItems(result.items);
    setUsedBytes(result.usedBytes);
  }, []);

  const handleOpen = () => {
    setOpen(true);
    loadMedia();
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';

    setUploading(true);
    setError(null);
    const fd = new FormData();
    fd.set('file', file);
    const result = await uploadSiteMedia(fd);
    setUploading(false);

    if ('error' in result) {
      setError(result.error);
      return;
    }

    setItems(prev => [result.item, ...prev]);
    setUsedBytes(prev => prev + result.item.size_bytes);
    toast('success', 'Imagem enviada com sucesso.');
  };

  const handleDelete = async (item: SiteMediaItem) => {
    if (!confirm(`Excluir "${item.name}"? Blocos que usam essa imagem ficarão sem imagem.`)) return;
    const result = await deleteSiteMedia(item.id);
    if ('error' in result) { toast('error', result.error); return; }
    setItems(prev => prev.filter(i => i.id !== item.id));
    setUsedBytes(prev => prev - item.size_bytes);
    if (value === item.url) onChange('');
    toast('success', 'Imagem excluída.');
  };

  const usedMB = usedBytes / 1024 / 1024;
  const quotaMB = SITE_MEDIA_QUOTA_MB;
  const usedPct = Math.min(100, (usedMB / quotaMB) * 100);

  return (
    <div className="space-y-2">
      {/* Preview da imagem atual */}
      {value && (
        <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-slate-100 border border-slate-200">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="Imagem selecionada" className="w-full h-full object-cover" />
          <button
            onClick={() => onChange('')}
            className="absolute top-2 right-2 p-1 bg-black/60 hover:bg-black/80 text-slate-900 dark:text-white rounded-lg transition-colors"
            title="Remover imagem"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleOpen}
          className="flex-1 flex items-center justify-center gap-2 py-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          {value ? 'Trocar imagem' : 'Selecionar da galeria'}
        </button>
        <input
          className={`${inputCls} flex-1`}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder="Ou cole uma URL..."
        />
      </div>

      {/* Modal da galeria */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 shrink-0">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Galeria de imagens</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Selecione ou envie uma nova imagem</p>
              </div>
              <button onClick={() => setOpen(false)} className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Uso de espaço */}
            <div className="px-5 py-3 border-b border-slate-100 shrink-0">
              <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
                <span>Armazenamento utilizado</span>
                <span className={usedPct > 85 ? 'text-red-500 font-semibold' : 'text-slate-500'}>
                  {usedMB.toFixed(1)} MB de {quotaMB} MB
                </span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-1.5">
                <div
                  className={`h-1.5 rounded-full transition-all ${usedPct > 85 ? 'bg-red-500' : usedPct > 60 ? 'bg-amber-400' : 'bg-blue-500'}`}
                  style={{ width: `${usedPct}%` }}
                />
              </div>
              {usedPct > 85 && (
                <p className="text-xs text-red-500 mt-1.5 font-medium">Espaço quase esgotado. Exclua imagens não utilizadas.</p>
              )}
            </div>

            {/* Upload */}
            <div className="px-5 py-3 border-b border-slate-100 shrink-0">
              <label className={`flex items-center justify-center gap-2 py-2.5 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${uploading ? 'border-slate-200 bg-slate-50 text-slate-500 dark:text-slate-400' : 'border-slate-300 hover:border-blue-400 hover:bg-blue-50 hover:text-blue-600 text-slate-500'}`}>
                {uploading ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                    </svg>
                    <span className="text-xs font-semibold">Enviando...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    <span className="text-xs font-semibold">Enviar nova imagem</span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">JPG, PNG, WebP, GIF · Máx. 10 MB</span>
                  </>
                )}
                <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="sr-only" onChange={handleUpload} disabled={uploading} />
              </label>
              {error && (
                <p className="mt-2 text-xs text-red-500 font-medium">{error}</p>
              )}
            </div>

            {/* Grid de imagens */}
            <div className="flex-1 overflow-y-auto p-4" style={{ scrollbarWidth: 'thin' }}>
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <svg className="w-6 h-6 animate-spin text-slate-600 dark:text-slate-300" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                  </svg>
                </div>
              ) : items.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-slate-500 dark:text-slate-400">
                  <svg className="w-10 h-10 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="text-sm font-medium">Nenhuma imagem na galeria</p>
                  <p className="text-xs mt-1">Envie a primeira imagem acima</p>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-3">
                  {items.map(item => (
                    <div
                      key={item.id}
                      className={`group relative aspect-video rounded-xl overflow-hidden bg-slate-100 border-2 cursor-pointer transition-all ${
                        value === item.url ? 'border-blue-500 shadow-md' : 'border-transparent hover:border-slate-300'
                      }`}
                      onClick={() => { onChange(item.url); setOpen(false); }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={item.url} alt={item.name} className="w-full h-full object-cover" />

                      {value === item.url && (
                        <div className="absolute inset-0 bg-blue-500/20 flex items-center justify-center">
                          <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                            <svg className="w-3.5 h-3.5 text-slate-900 dark:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        </div>
                      )}

                      {/* Overlay com info e delete */}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all flex flex-col justify-between p-2 opacity-0 group-hover:opacity-100">
                        <div className="flex justify-end">
                          <button
                            onClick={e => { e.stopPropagation(); handleDelete(item); }}
                            className="p-1 bg-red-600 hover:bg-red-500 text-slate-900 dark:text-white rounded-lg transition-colors"
                            title="Excluir"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                        <p className="text-slate-900 dark:text-white text-xs font-medium truncate">{formatBytes(item.size_bytes)}</p>
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

// ── Layout panel ─────────────────────────────────────────────────

function AlignIcon({ value }: { value: BlockAlignment }) {
  if (value === 'left') return <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h10M4 18h13" /></svg>;
  if (value === 'center') return <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M7 12h10M6 18h12" /></svg>;
  return <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M10 12h10M7 18h13" /></svg>;
}

function LayoutPanel({ layout, onChange }: { layout: BlockLayout; onChange: (l: BlockLayout) => void }) {
  const set = <K extends keyof BlockLayout>(key: K, value: BlockLayout[K]) => onChange({ ...layout, [key]: value });
  const seg = (active: boolean) => `flex-1 flex items-center justify-center py-1.5 rounded-md text-xs font-semibold transition-colors ${active ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-600'}`;

  const alignOptions: BlockAlignment[] = ['left', 'center', 'right'];
  const alignLabels: Record<BlockAlignment, string> = { left: 'Esq.', center: 'Centro', right: 'Dir.' };
  const widthOptions: { value: BlockWidth; label: string }[] = [
    { value: 'full', label: 'Cheio' }, { value: 'container', label: 'Container' }, { value: 'narrow', label: 'Estreito' },
  ];
  const paddingOptions: { value: BlockPadding; label: string }[] = [
    { value: 'compact', label: 'Comp.' }, { value: 'normal', label: 'Normal' }, { value: 'spacious', label: 'Amp.' },
  ];

  return (
    <div className="space-y-4">
      <Field label="Alinhamento">
        <div className="flex bg-slate-100 rounded-lg p-1 gap-0.5">
          {alignOptions.map(a => (
            <button key={a} onClick={() => set('alignment', a)} className={seg(layout.alignment === a)} title={alignLabels[a]}>
              <AlignIcon value={a} />
            </button>
          ))}
        </div>
      </Field>
      <Field label="Largura">
        <div className="flex bg-slate-100 rounded-lg p-1 gap-0.5">
          {widthOptions.map(w => <button key={w.value} onClick={() => set('width', w.value)} className={seg(layout.width === w.value)}>{w.label}</button>)}
        </div>
      </Field>
      <Field label="Espaçamento">
        <div className="flex bg-slate-100 rounded-lg p-1 gap-0.5">
          {paddingOptions.map(p => <button key={p.value} onClick={() => set('padding', p.value)} className={seg(layout.padding === p.value)}>{p.label}</button>)}
        </div>
      </Field>
      <Field label="Cor de fundo">
        <div className="flex items-center gap-2">
          <input type="color" value={layout.bg_color && layout.bg_color !== 'transparent' ? layout.bg_color : '#ffffff'} onChange={e => set('bg_color', e.target.value)} className="w-9 h-9 rounded-lg border border-slate-200 cursor-pointer p-0.5" />
          <input className={`${inputCls} flex-1`} value={layout.bg_color ?? ''} placeholder="transparent" onChange={e => set('bg_color', e.target.value)} />
          <button onClick={() => set('bg_color', 'transparent')} className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-600 whitespace-nowrap">Limpar</button>
        </div>
      </Field>
    </div>
  );
}

// ── Editores por tipo ────────────────────────────────────────────

function HeroEditor({ c, set }: { c: Record<string, unknown>; set: (k: string, v: unknown) => void }) {
  return (
    <>
      <Field label="Título principal">
        <input className={inputCls} value={c.title as string ?? ''} onChange={e => set('title', e.target.value)} placeholder="Bem-vindo à ICRE" />
      </Field>
      <Field label="Subtítulo">
        <textarea className={inputCls} rows={2} value={c.subtitle as string ?? ''} onChange={e => set('subtitle', e.target.value)} placeholder="Uma breve descrição..." />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Texto do botão">
          <input className={inputCls} value={c.cta_label as string ?? c.button_text as string ?? ''} onChange={e => set('cta_label', e.target.value)} placeholder="Saiba mais" />
        </Field>
        <Field label="Link do botão">
          <input className={inputCls} value={c.cta_url as string ?? c.button_link as string ?? ''} onChange={e => set('cta_url', e.target.value)} placeholder="/sobre" />
        </Field>
      </div>
      <Field label="Imagem de fundo">
        <MediaPicker value={c.image_url as string ?? ''} onChange={v => set('image_url', v)} />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <ColorField label="Cor de fundo" value={c.bg_color as string} fallback="#1e3a5f" onChange={v => set('bg_color', v)} />
        <ColorField label="Cor do texto" value={c.text_color as string} fallback="#ffffff" onChange={v => set('text_color', v)} />
      </div>
    </>
  );
}

function AboutEditor({ c, set }: { c: Record<string, unknown>; set: (k: string, v: unknown) => void }) {
  return (
    <>
      <Field label="Título">
        <input className={inputCls} value={c.title as string ?? ''} onChange={e => set('title', e.target.value)} placeholder="Sobre nós" />
      </Field>
      <Field label="Texto">
        <textarea className={inputCls} rows={6} value={c.text as string ?? c.body as string ?? ''} onChange={e => set('text', e.target.value)} placeholder="Um pouco sobre a história e missão da igreja..." />
      </Field>
      <Field label="Imagem">
        <MediaPicker value={c.image_url as string ?? ''} onChange={v => set('image_url', v)} />
      </Field>
    </>
  );
}

function MissionEditor({
  c, set, setItem, addItem, removeItem,
}: {
  c: Record<string, unknown>;
  set: (k: string, v: unknown) => void;
  setItem: (i: number, f: keyof MissionItem, v: string) => void;
  addItem: () => void;
  removeItem: (i: number) => void;
}) {
  const items = (c.items ?? []) as MissionItem[];
  return (
    <>
      <Field label="Título da seção">
        <input className={inputCls} value={c.title as string ?? ''} onChange={e => set('title', e.target.value)} placeholder="Nossa Missão" />
      </Field>
      <SectionDivider label="Pilares" />
      <div className="space-y-3">
        {items.map((item, i) => (
          <div key={i} className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Pilar {i + 1}</span>
              <button onClick={() => removeItem(i)} className="p-1 text-slate-500 dark:text-slate-400 hover:text-red-500 transition-colors">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <input className={inputCls} placeholder="Título" value={item.title ?? ''} onChange={e => setItem(i, 'title', e.target.value)} />
            <textarea className={inputCls} placeholder="Descrição" rows={2} value={item.text ?? ''} onChange={e => setItem(i, 'text', e.target.value)} />
            <input className={inputCls} placeholder="Ícone (emoji ou símbolo)" value={item.icon ?? ''} onChange={e => setItem(i, 'icon', e.target.value)} />
          </div>
        ))}
        <button
          onClick={addItem}
          className="w-full flex items-center justify-center gap-2 py-2.5 border border-dashed border-slate-300 rounded-xl text-sm text-slate-500 hover:text-slate-700 hover:border-slate-400 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
          </svg>
          Adicionar pilar
        </button>
      </div>
    </>
  );
}

function EventsEditor({ c, set }: { c: Record<string, unknown>; set: (k: string, v: unknown) => void }) {
  return (
    <>
      <Field label="Título"><input className={inputCls} value={c.title as string ?? ''} onChange={e => set('title', e.target.value)} placeholder="Próximos Eventos" /></Field>
      <Field label="Subtítulo"><input className={inputCls} value={c.subtitle as string ?? ''} onChange={e => set('subtitle', e.target.value)} placeholder="Venha participar..." /></Field>
      <Hint>Os eventos são buscados automaticamente com <strong>is_public = true</strong> e status publicado.</Hint>
    </>
  );
}

function YoutubeEditor({ c, set }: { c: Record<string, unknown>; set: (k: string, v: unknown) => void }) {
  return (
    <>
      <Field label="Título"><input className={inputCls} value={c.title as string ?? ''} onChange={e => set('title', e.target.value)} placeholder="Ao Vivo" /></Field>
      <Field label="ID do vídeo">
        <input className={inputCls} value={c.video_id as string ?? ''} onChange={e => set('video_id', e.target.value)} placeholder="Ex: dQw4w9WgXcQ" />
      </Field>
      <Field label="URL do canal"><input className={inputCls} value={c.channel_url as string ?? ''} onChange={e => set('channel_url', e.target.value)} placeholder="https://youtube.com/@..." /></Field>
      <Hint>Cole apenas o ID após <code className="bg-slate-100 px-1 rounded">?v=</code> na URL do YouTube.</Hint>
    </>
  );
}

function ContactEditor({ c, set }: { c: Record<string, unknown>; set: (k: string, v: unknown) => void }) {
  return (
    <>
      <Field label="Título"><input className={inputCls} value={c.title as string ?? ''} onChange={e => set('title', e.target.value)} placeholder="Contato" /></Field>
      <Field label="Subtítulo"><input className={inputCls} value={c.subtitle as string ?? ''} onChange={e => set('subtitle', e.target.value)} placeholder="Venha nos visitar..." /></Field>
      <Field label="Endereço"><input className={inputCls} value={c.address as string ?? ''} onChange={e => set('address', e.target.value)} placeholder="Rua, número, bairro" /></Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Telefone"><input className={inputCls} value={c.phone as string ?? ''} onChange={e => set('phone', e.target.value)} placeholder="(XX) XXXXX-XXXX" /></Field>
        <Field label="E-mail"><input className={inputCls} value={c.email as string ?? ''} onChange={e => set('email', e.target.value)} placeholder="contato@..." /></Field>
      </div>
      <Field label="Horário"><input className={inputCls} value={c.schedule as string ?? ''} onChange={e => set('schedule', e.target.value)} placeholder="Dom 9h e 19h / Qua 19h30" /></Field>
      <Field label="URL embed do Google Maps">
        <textarea className={inputCls} rows={3} value={c.maps_embed_url as string ?? c.maps_url as string ?? ''} onChange={e => set('maps_embed_url', e.target.value)} placeholder="https://www.google.com/maps/embed?..." />
      </Field>
    </>
  );
}

function CustomTextEditor({ c, set }: { c: Record<string, unknown>; set: (k: string, v: unknown) => void }) {
  return (
    <>
      <Field label="Título"><input className={inputCls} value={c.title as string ?? ''} onChange={e => set('title', e.target.value)} placeholder="Título opcional" /></Field>
      <Field label="Texto"><textarea className={inputCls} rows={7} value={c.text as string ?? ''} onChange={e => set('text', e.target.value)} placeholder="Escreva seu texto aqui..." /></Field>
      <div className="grid grid-cols-2 gap-3">
        <ColorField label="Cor de fundo" value={c.bg_color as string} fallback="#ffffff" onChange={v => set('bg_color', v)} />
        <ColorField label="Cor do texto" value={c.text_color as string} fallback="#1e293b" onChange={v => set('text_color', v)} />
      </div>
    </>
  );
}

function BannerEditor({ c, set }: { c: Record<string, unknown>; set: (k: string, v: unknown) => void }) {
  return (
    <>
      <Field label="Imagem">
        <MediaPicker value={c.image_url as string ?? ''} onChange={v => set('image_url', v)} />
      </Field>
      <Field label="Link ao clicar (opcional)"><input className={inputCls} value={c.link as string ?? ''} onChange={e => set('link', e.target.value)} placeholder="https://..." /></Field>
      <Field label="Texto alternativo"><input className={inputCls} value={c.alt as string ?? ''} onChange={e => set('alt', e.target.value)} placeholder="Descrição da imagem" /></Field>
    </>
  );
}

// ── Componente principal ─────────────────────────────────────────

export function BlockEditor({ block, onClose, onContentChange }: BlockEditorProps) {
  const { toast, dismiss } = useToast();
  const [isPending, startTransition]      = useTransition();
  const [activeSection, setActiveSection] = useState<'content' | 'layout'>('content');

  const raw = (block.content as Record<string, unknown>) ?? {};
  const [content, setContent] = useState<Record<string, unknown>>(raw);
  const [layout, setLayout]   = useState<BlockLayout>((raw._layout as BlockLayout) ?? {});

  // Ref para layout evita incluir no dep array do useCallback
  const layoutRef = useRef(layout);
  useEffect(() => { layoutRef.current = layout; }, [layout]);

  // pendingNotify guarda o conteúdo mais recente para notificar fora do updater
  const pendingNotify = useRef<Record<string, unknown> | null>(null);
  useEffect(() => {
    if (pendingNotify.current !== null) {
      onContentChange?.(block.id, pendingNotify.current);
      pendingNotify.current = null;
    }
  });

  const set = useCallback((key: string, value: unknown) => {
    setContent(prev => {
      const next = { ...prev, [key]: value, _layout: layoutRef.current };
      pendingNotify.current = next;
      return next;
    });
  }, []);

  const handleLayoutChange = useCallback((nextLayout: BlockLayout) => {
    setLayout(nextLayout);
    setContent(prev => {
      const merged = { ...prev, _layout: nextLayout };
      pendingNotify.current = merged;
      return merged;
    });
  }, []);

  const setMissionItem = (index: number, field: keyof MissionItem, value: string) => {
    const items = [...((content.items as MissionItem[]) ?? [])];
    items[index] = { ...items[index], [field]: value };
    set('items', items);
  };
  const addMissionItem = () => {
    const items = [...((content.items as MissionItem[]) ?? [])];
    items.push({ icon: '', title: '', text: '' });
    set('items', items);
  };
  const removeMissionItem = (index: number) => {
    const items = ((content.items as MissionItem[]) ?? []).filter((_, i) => i !== index);
    set('items', items);
  };

  const handleSave = () => {
    startTransition(async () => {
      const final = { ...content, _layout: layout };
      const id = toast('loading', 'Salvando rascunho...');
      const result = await saveBlockDraft(block.id, final);
      dismiss(id);
      if (result.error) toast('error', result.error);
      else toast('success', 'Rascunho salvo.');
    });
  };

  const c = content;

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 shrink-0">
        <div>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wide">Editando</p>
          <h3 className="font-bold text-slate-900 text-sm">{BLOCK_LABELS[block.type] ?? block.type}</h3>
        </div>
        <button onClick={onClose} className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="flex border-b border-slate-100 shrink-0">
        {(['content', 'layout'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveSection(tab)}
            className={`flex-1 py-2.5 text-xs font-semibold transition-colors ${activeSection === tab ? 'text-blue-600 border-b-2 border-blue-500' : 'text-slate-500 dark:text-slate-400 hover:text-slate-600'}`}
          >
            {tab === 'content' ? 'Conteúdo' : 'Layout'}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4" style={{ scrollbarWidth: 'thin', scrollbarColor: '#e2e8f0 transparent' }}>
        {activeSection === 'layout' ? (
          <LayoutPanel layout={layout} onChange={handleLayoutChange} />
        ) : (
          <>
            {block.type === 'hero'        && <HeroEditor        c={c} set={set} />}
            {block.type === 'about'       && <AboutEditor       c={c} set={set} />}
            {block.type === 'mission'     && <MissionEditor     c={c} set={set} setItem={setMissionItem} addItem={addMissionItem} removeItem={removeMissionItem} />}
            {block.type === 'events'      && <EventsEditor      c={c} set={set} />}
            {block.type === 'youtube'     && <YoutubeEditor     c={c} set={set} />}
            {block.type === 'contact'     && <ContactEditor     c={c} set={set} />}
            {block.type === 'custom_text' && <CustomTextEditor  c={c} set={set} />}
            {block.type === 'banner'      && <BannerEditor      c={c} set={set} />}
          </>
        )}
      </div>

      <div className="px-4 py-3 border-t border-slate-100 shrink-0">
        <button
          onClick={handleSave}
          disabled={isPending}
          className="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold rounded-xl transition-colors disabled:opacity-50"
        >
          {isPending ? (
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
            </svg>
          )}
          {isPending ? 'Salvando...' : 'Salvar rascunho'}
        </button>
      </div>
    </div>
  );
}