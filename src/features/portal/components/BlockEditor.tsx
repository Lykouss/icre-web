'use client'

import React, { useState, useTransition } from 'react';
import { useToast } from '@/features/core/components/ToastContext';
import { saveBlockDraft } from '@/features/portal/actions/portal';
import type {
  SiteBlock, SiteBlockType, BlockLayout, BlockAlignment, BlockWidth, BlockPadding,
  HeroContent, AboutContent, MissionContent, MissionItem,
  YoutubeContent, ContactContent, CustomTextContent, BannerContent, EventsContent,
} from '@/features/portal/types';

const BLOCK_LABELS: Record<SiteBlockType, string> = {
  hero:        'Hero (Capa)',
  about:       'Sobre nós',
  mission:     'Missão / Pilares',
  events:      'Eventos',
  youtube:     'YouTube / Ao Vivo',
  contact:     'Contato',
  custom_text: 'Texto Personalizado',
  banner:      'Banner',
};

interface BlockEditorProps {
  block: SiteBlock;
  onClose: () => void;
  onContentChange?: (blockId: string, content: Record<string, unknown>) => void;
}

const inputClass = 'w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm';
const labelClass = 'block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wide';
const sectionTitle = 'text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2';

// ── Layout Panel ────────────────────────────────────────────────────────────

interface LayoutPanelProps {
  layout: BlockLayout;
  onChange: (layout: BlockLayout) => void;
}

function LayoutPanel({ layout, onChange }: LayoutPanelProps) {
  const set = <K extends keyof BlockLayout>(key: K, value: BlockLayout[K]) =>
    onChange({ ...layout, [key]: value });

  const btn = (active: boolean) =>
    `px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
      active
        ? 'bg-blue-600 text-white border-blue-600'
        : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
    }`;

  const alignOptions: { value: BlockAlignment; label: string; icon: string }[] = [
    { value: 'left',   label: 'Esq.',   icon: '⬅' },
    { value: 'center', label: 'Centro', icon: '↔' },
    { value: 'right',  label: 'Dir.',   icon: '➡' },
  ];

  const widthOptions: { value: BlockWidth; label: string }[] = [
    { value: 'full',      label: 'Tela cheia' },
    { value: 'container', label: 'Container' },
    { value: 'narrow',    label: 'Estreito' },
  ];

  const paddingOptions: { value: BlockPadding; label: string }[] = [
    { value: 'compact',  label: 'Compacto' },
    { value: 'normal',   label: 'Normal' },
    { value: 'spacious', label: 'Espaçoso' },
  ];

  return (
    <div className="space-y-4 pb-4 mb-4 border-b border-slate-100">
      <p className={sectionTitle}>
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h7" />
        </svg>
        Layout
      </p>

      <div>
        <label className={labelClass}>Alinhamento</label>
        <div className="flex gap-2">
          {alignOptions.map(o => (
            <button key={o.value} onClick={() => set('alignment', o.value)} className={btn(layout.alignment === o.value)}>
              {o.icon} {o.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className={labelClass}>Largura</label>
        <div className="flex gap-2 flex-wrap">
          {widthOptions.map(o => (
            <button key={o.value} onClick={() => set('width', o.value)} className={btn(layout.width === o.value)}>
              {o.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className={labelClass}>Espaçamento vertical</label>
        <div className="flex gap-2">
          {paddingOptions.map(o => (
            <button key={o.value} onClick={() => set('padding', o.value)} className={btn(layout.padding === o.value)}>
              {o.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className={labelClass}>Cor de fundo do bloco</label>
        <div className="flex gap-2 items-center">
          <input
            type="color"
            value={layout.bg_color ?? '#ffffff'}
            onChange={e => set('bg_color', e.target.value)}
            className="w-10 h-9 rounded-lg border border-slate-200 cursor-pointer"
          />
          <input
            className={inputClass}
            value={layout.bg_color ?? ''}
            placeholder="#ffffff"
            onChange={e => set('bg_color', e.target.value)}
          />
          <button
            onClick={() => set('bg_color', 'transparent')}
            className="shrink-0 text-xs text-slate-400 hover:text-slate-600 font-medium"
          >
            Limpar
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────────────────────

export function BlockEditor({ block, onClose, onContentChange }: BlockEditorProps) {
  const { toast, dismiss } = useToast();
  const [isPending, startTransition] = useTransition();

  const raw = (block.content as Record<string, unknown>) ?? {};
  const [content, setContent] = useState<Record<string, unknown>>(raw);
  const [layout, setLayout] = useState<BlockLayout>((raw._layout as BlockLayout) ?? {});

  const set = (key: string, value: unknown) => {
    const next = { ...content, [key]: value, _layout: layout };
    setContent(next);
    onContentChange?.(block.id, next);
  };

  const handleLayoutChange = (next: BlockLayout) => {
    setLayout(next);
    const merged = { ...content, _layout: next };
    setContent(merged);
    onContentChange?.(block.id, merged);
  };

  const setMissionItem = (index: number, field: keyof MissionItem, value: string) => {
    const items = [...((content.items as MissionItem[]) ?? [])];
    items[index] = { ...items[index], [field]: value };
    set('items', items);
  };

  const addMissionItem = () => {
    const items = [...((content.items as MissionItem[]) ?? [])];
    items.push({ icon: '✨', title: '', text: '' });
    set('items', items);
  };

  const removeMissionItem = (index: number) => {
    const items = ((content.items as MissionItem[]) ?? []).filter((_, i) => i !== index);
    set('items', items);
  };

  const handleSave = () => {
    startTransition(async () => {
      const final = { ...content, _layout: layout };
      const loadingId = toast('loading', 'Salvando rascunho...');
      const result = await saveBlockDraft(block.id, final);
      dismiss(loadingId);
      if (result.error) toast('error', result.error);
      else {
        toast('success', 'Rascunho salvo!');
        onClose();
      }
    });
  };

  const c = content;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between shrink-0">
        <div>
          <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">Rascunho</p>
          <h3 className="text-base font-bold text-slate-900">{BLOCK_LABELS[block.type]}</h3>
        </div>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4">

        {/* Layout — sempre visível */}
        <LayoutPanel layout={layout} onChange={handleLayoutChange} />

        {/* Conteúdo específico por tipo */}
        <p className={sectionTitle}>
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5" />
          </svg>
          Conteúdo
        </p>

        {block.type === 'hero' && (() => {
          const h = c as unknown as HeroContent;
          return <>
            <div><label className={labelClass}>Título</label><input className={inputClass} value={h.title ?? ''} onChange={e => set('title', e.target.value)} /></div>
            <div><label className={labelClass}>Subtítulo</label><textarea className={inputClass} rows={2} value={h.subtitle ?? ''} onChange={e => set('subtitle', e.target.value)} /></div>
            <div><label className={labelClass}>Texto do botão</label><input className={inputClass} value={h.button_text ?? ''} onChange={e => set('button_text', e.target.value)} /></div>
            <div><label className={labelClass}>Link do botão</label><input className={inputClass} value={h.button_link ?? ''} onChange={e => set('button_link', e.target.value)} /></div>
            <div><label className={labelClass}>URL da imagem de fundo</label><input className={inputClass} value={h.image_url ?? ''} onChange={e => set('image_url', e.target.value)} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Cor de fundo</label>
                <div className="flex gap-2 items-center">
                  <input type="color" value={h.bg_color ?? '#1e3a5f'} onChange={e => set('bg_color', e.target.value)} className="w-10 h-9 rounded-lg border border-slate-200 cursor-pointer" />
                  <input className={inputClass} value={h.bg_color ?? ''} onChange={e => set('bg_color', e.target.value)} />
                </div>
              </div>
              <div>
                <label className={labelClass}>Cor do texto</label>
                <div className="flex gap-2 items-center">
                  <input type="color" value={h.text_color ?? '#ffffff'} onChange={e => set('text_color', e.target.value)} className="w-10 h-9 rounded-lg border border-slate-200 cursor-pointer" />
                  <input className={inputClass} value={h.text_color ?? ''} onChange={e => set('text_color', e.target.value)} />
                </div>
              </div>
            </div>
          </>;
        })()}

        {block.type === 'about' && (() => {
          const a = c as unknown as AboutContent;
          return <>
            <div><label className={labelClass}>Título</label><input className={inputClass} value={a.title ?? ''} onChange={e => set('title', e.target.value)} /></div>
            <div><label className={labelClass}>Texto</label><textarea className={inputClass} rows={5} value={a.text ?? ''} onChange={e => set('text', e.target.value)} /></div>
            <div><label className={labelClass}>URL da imagem</label><input className={inputClass} value={a.image_url ?? ''} onChange={e => set('image_url', e.target.value)} /></div>
          </>;
        })()}

        {block.type === 'mission' && (() => {
          const m = c as unknown as MissionContent;
          const items = (m.items ?? []) as MissionItem[];
          return <>
            <div><label className={labelClass}>Título</label><input className={inputClass} value={m.title ?? ''} onChange={e => set('title', e.target.value)} /></div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className={labelClass}>Pilares</label>
                <button onClick={addMissionItem} className="text-xs text-blue-600 hover:text-blue-800 font-semibold">+ Adicionar</button>
              </div>
              {items.map((item, i) => (
                <div key={i} className="bg-slate-50 rounded-xl p-3 space-y-2 border border-slate-200">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-500">Pilar {i + 1}</span>
                    <button onClick={() => removeMissionItem(i)} className="text-xs text-red-400 hover:text-red-600 font-semibold">Remover</button>
                  </div>
                  <input className={inputClass} placeholder="Ícone (emoji)" value={item.icon ?? ''} onChange={e => setMissionItem(i, 'icon', e.target.value)} />
                  <input className={inputClass} placeholder="Título" value={item.title ?? ''} onChange={e => setMissionItem(i, 'title', e.target.value)} />
                  <input className={inputClass} placeholder="Descrição" value={item.text ?? ''} onChange={e => setMissionItem(i, 'text', e.target.value)} />
                </div>
              ))}
            </div>
          </>;
        })()}

        {block.type === 'events' && (() => {
          const ev = c as unknown as EventsContent;
          return <>
            <div><label className={labelClass}>Título</label><input className={inputClass} value={ev.title ?? ''} onChange={e => set('title', e.target.value)} /></div>
            <div><label className={labelClass}>Subtítulo</label><input className={inputClass} value={ev.subtitle ?? ''} onChange={e => set('subtitle', e.target.value)} /></div>
            <p className="text-xs text-slate-400 bg-slate-50 rounded-xl p-3 border border-slate-200">Os eventos são buscados automaticamente com <strong>is_public = true</strong> e status <strong>publicado</strong>.</p>
          </>;
        })()}

        {block.type === 'youtube' && (() => {
          const y = c as unknown as YoutubeContent;
          return <>
            <div><label className={labelClass}>Título</label><input className={inputClass} value={y.title ?? ''} onChange={e => set('title', e.target.value)} /></div>
            <div><label className={labelClass}>ID do vídeo (YouTube)</label><input className={inputClass} placeholder="Ex: dQw4w9WgXcQ" value={y.video_id ?? ''} onChange={e => set('video_id', e.target.value)} /></div>
            <div><label className={labelClass}>URL do canal</label><input className={inputClass} placeholder="https://youtube.com/@..." value={y.channel_url ?? ''} onChange={e => set('channel_url', e.target.value)} /></div>
            <p className="text-xs text-slate-400 bg-slate-50 rounded-xl p-3 border border-slate-200">Cole apenas o ID após <code>?v=</code> na URL do YouTube.</p>
          </>;
        })()}

        {block.type === 'contact' && (() => {
          const ct = c as unknown as ContactContent;
          return <>
            <div><label className={labelClass}>Título</label><input className={inputClass} value={ct.title ?? ''} onChange={e => set('title', e.target.value)} /></div>
            <div><label className={labelClass}>Subtítulo</label><input className={inputClass} value={ct.subtitle ?? ''} onChange={e => set('subtitle', e.target.value)} /></div>
            <div><label className={labelClass}>Endereço</label><input className={inputClass} value={ct.address ?? ''} onChange={e => set('address', e.target.value)} /></div>
            <div><label className={labelClass}>Telefone / WhatsApp</label><input className={inputClass} value={ct.phone ?? ''} onChange={e => set('phone', e.target.value)} /></div>
            <div><label className={labelClass}>E-mail</label><input className={inputClass} value={ct.email ?? ''} onChange={e => set('email', e.target.value)} /></div>
            <div><label className={labelClass}>URL embed do Google Maps</label><textarea className={inputClass} rows={3} value={ct.maps_embed_url ?? ''} onChange={e => set('maps_embed_url', e.target.value)} /></div>
          </>;
        })()}

        {block.type === 'custom_text' && (() => {
          const t = c as unknown as CustomTextContent;
          return <>
            <div><label className={labelClass}>Título</label><input className={inputClass} value={t.title ?? ''} onChange={e => set('title', e.target.value)} /></div>
            <div><label className={labelClass}>Texto</label><textarea className={inputClass} rows={6} value={t.text ?? ''} onChange={e => set('text', e.target.value)} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Cor de fundo</label>
                <div className="flex gap-2 items-center">
                  <input type="color" value={t.bg_color ?? '#ffffff'} onChange={e => set('bg_color', e.target.value)} className="w-10 h-9 rounded-lg border border-slate-200 cursor-pointer" />
                  <input className={inputClass} value={t.bg_color ?? ''} onChange={e => set('bg_color', e.target.value)} />
                </div>
              </div>
              <div>
                <label className={labelClass}>Cor do texto</label>
                <div className="flex gap-2 items-center">
                  <input type="color" value={t.text_color ?? '#1e293b'} onChange={e => set('text_color', e.target.value)} className="w-10 h-9 rounded-lg border border-slate-200 cursor-pointer" />
                  <input className={inputClass} value={t.text_color ?? ''} onChange={e => set('text_color', e.target.value)} />
                </div>
              </div>
            </div>
          </>;
        })()}

        {block.type === 'banner' && (() => {
          const b = c as unknown as BannerContent;
          return <>
            <div><label className={labelClass}>URL da imagem</label><input className={inputClass} value={b.image_url ?? ''} onChange={e => set('image_url', e.target.value)} /></div>
            <div><label className={labelClass}>Link ao clicar</label><input className={inputClass} value={b.link ?? ''} onChange={e => set('link', e.target.value)} /></div>
            <div><label className={labelClass}>Texto alternativo</label><input className={inputClass} value={b.alt ?? ''} onChange={e => set('alt', e.target.value)} /></div>
          </>;
        })()}
      </div>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-slate-200 shrink-0 space-y-2">
        <button
          onClick={handleSave}
          disabled={isPending}
          className="w-full py-2.5 font-semibold bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {isPending && (
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
            </svg>
          )}
          {isPending ? 'Salvando...' : 'Salvar rascunho'}
        </button>
        <p className="text-xs text-slate-400 text-center">Visível ao público somente após &quot;Publicar tudo&quot;.</p>
      </div>
    </div>
  );
}