'use client'

import React, { useState, useEffect, useRef, useTransition, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/features/core/components/ToastContext';
import { toggleBlock, reorderBlocks, addBlock, deleteBlock, publishAllBlocks } from '@/features/portal/actions/portal';
import { BlockEditor } from '@/features/portal/components/BlockEditor';
import type { SiteBlock, SiteBlockType, EditorMessage } from '@/features/portal/types';

type EditableBlockType = Exclude<SiteBlockType, 'pastors' | 'cells' | 'events_preview'>;

const BLOCK_META: Record<EditableBlockType, { label: string; description: string; icon: React.ReactNode }> = {
  hero: {
    label: 'Capa',
    description: 'Seção principal com título e CTA',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
  },
  about: {
    label: 'Sobre nós',
    description: 'Texto e imagem sobre a igreja',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  mission: {
    label: 'Missão',
    description: 'Pilares e valores em cards',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
      </svg>
    ),
  },
  events: {
    label: 'Eventos',
    description: 'Grade de eventos públicos',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
  },
  youtube: {
    label: 'YouTube',
    description: 'Vídeo ou transmissão ao vivo',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  contact: {
    label: 'Contato',
    description: 'Endereço, telefone e mapa',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  custom_text: {
    label: 'Texto livre',
    description: 'Título e parágrafo personalizados',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 6h16M4 12h16M4 18h7" />
      </svg>
    ),
  },
  banner: {
    label: 'Banner',
    description: 'Imagem em largura total',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
      </svg>
    ),
  },
};

const EDITABLE_TYPES = Object.keys(BLOCK_META) as EditableBlockType[];

function isEditable(type: SiteBlockType): type is EditableBlockType {
  return EDITABLE_TYPES.includes(type as EditableBlockType);
}

type PreviewDevice = 'desktop' | 'tablet' | 'mobile';
const DEVICE_WIDTHS: Record<PreviewDevice, string> = { desktop: '100%', tablet: '768px', mobile: '390px' };

function DeviceIcon({ device }: { device: PreviewDevice }) {
  if (device === 'mobile') return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
    </svg>
  );
  if (device === 'tablet') return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 18h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
    </svg>
  );
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  );
}

interface VisualEditorProps {
  initialBlocks: SiteBlock[];
  isSysAdmin: boolean;
}

export function VisualEditor({ initialBlocks, isSysAdmin }: VisualEditorProps) {
  const router = useRouter();
  const { toast, dismiss } = useToast();
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const [blocks, setBlocks]             = useState<SiteBlock[]>(initialBlocks);
  const [editingBlockId, setEditingBlockId] = useState<string | null>(null);
  const editingBlock = useMemo(() => blocks.find(b => b.id === editingBlockId) ?? null, [blocks, editingBlockId]);
  const [draggingId, setDraggingId]     = useState<string | null>(null);
  const [dragOverId, setDragOverId]     = useState<string | null>(null);
  const [showAddMenu, setShowAddMenu]   = useState(false);
  const [device, setDevice]             = useState<PreviewDevice>('desktop');
  const [isPending, startTransition]    = useTransition();
  const [isPublishing, startPublish]    = useTransition();
  const [iframeReady, setIframeReady]   = useState(false);
  const [hasUnpublished, setHasUnpublished] = useState(false);
  const [otherEditor, setOtherEditor]   = useState(false);

  const sendToPreview = useCallback((updated: SiteBlock[]) => {
    if (!iframeRef.current?.contentWindow) return;
    iframeRef.current.contentWindow.postMessage(
      { type: 'blocks-updated', blocks: updated },
      window.location.origin
    );
  }, []);

  // Realtime — detecta outro admin editando
  useEffect(() => {
    const supabase = createClient();
    let timer: ReturnType<typeof setTimeout>;
    const channel = supabase
      .channel('portal_realtime')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'site_blocks' }, () => {
        setOtherEditor(true);
        clearTimeout(timer);
        timer = setTimeout(() => setOtherEditor(false), 5000);
      })
      .subscribe();
    return () => { clearTimeout(timer); supabase.removeChannel(channel); };
  }, []);

  // Escuta mensagens do iframe
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.origin !== window.location.origin) return;
      const msg = e.data as EditorMessage;
      if (msg.type === 'block-clicked' && msg.blockId) {
        const block = blocks.find(b => b.id === msg.blockId);
        if (block) setEditingBlockId(block.id);
      }
      if (msg.type === 'preview-ready') {
        setIframeReady(true);
        // Envia estado atual assim que o iframe estiver pronto
        sendToPreview(blocks);
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [blocks, sendToPreview]);

  // Quando o BlockEditor altera conteúdo, atualiza state E envia ao preview
  const handleContentChange = useCallback((blockId: string, content: Record<string, unknown>) => {
    setBlocks(prev => {
      const updated = prev.map(b => b.id === blockId ? { ...b, content } : b);
      sendToPreview(updated);
      return updated;
    });
    setHasUnpublished(true);
  }, [sendToPreview]);

  const handleToggle = (blockId: string, current: boolean) => {
    setBlocks(prev => {
      const updated = prev.map(b => b.id === blockId ? { ...b, is_active: !current } : b);
      sendToPreview(updated);
      return updated;
    });
    startTransition(async () => {
      const result = await toggleBlock(blockId, !current);
      if (result.error) {
        toast('error', result.error);
        setBlocks(prev => prev.map(b => b.id === blockId ? { ...b, is_active: current } : b));
      }
    });
  };

  const handleDragStart = (id: string) => setDraggingId(id);
  const handleDragOver  = (e: React.DragEvent, id: string) => { e.preventDefault(); setDragOverId(id); };

  const handleDragEnd = () => {
    if (!draggingId || !dragOverId || draggingId === dragOverId) {
      setDraggingId(null); setDragOverId(null); return;
    }
    const from = blocks.findIndex(b => b.id === draggingId);
    const to   = blocks.findIndex(b => b.id === dragOverId);
    const reordered = [...blocks];
    const [moved] = reordered.splice(from, 1);
    reordered.splice(to, 0, moved);
    setBlocks(reordered);
    sendToPreview(reordered);
    setDraggingId(null);
    setDragOverId(null);
    startTransition(async () => { await reorderBlocks(reordered.map(b => b.id)); });
  };

  const handleAdd = (type: EditableBlockType) => {
    setShowAddMenu(false);
    startTransition(async () => {
      const result = await addBlock(type);
      if (result.error) toast('error', result.error);
      else router.refresh();
    });
  };

  const handleDelete = (blockId: string) => {
    if (!confirm('Excluir este bloco permanentemente?')) return;
    const updated = blocks.filter(b => b.id !== blockId);
    setBlocks(updated);
    sendToPreview(updated);
    if (editingBlock?.id === blockId) setEditingBlockId(null);
    startTransition(async () => {
      const result = await deleteBlock(blockId);
      if (result.error) { toast('error', result.error); router.refresh(); }
    });
  };

  const handlePublish = () => {
    startPublish(async () => {
      const id = toast('loading', 'Publicando...');
      const result = await publishAllBlocks();
      dismiss(id);
      if (result.error) toast('error', result.error);
      else { toast('success', 'Site publicado com sucesso.'); setHasUnpublished(false); }
    });
  };


  return (
    <div className="flex h-[calc(100vh-8rem)] gap-0 rounded-2xl overflow-hidden border border-slate-200 shadow-sm bg-white">

      {/* ── Sidebar ── */}
      <aside className="w-64 shrink-0 bg-slate-950 flex flex-col border-r border-slate-800">
        <div className="px-4 py-4 border-b border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Blocos</h2>
            <div className="relative">
              <button
                onClick={() => setShowAddMenu(v => !v)}
                disabled={isPending}
                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg transition-colors disabled:opacity-50"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                </svg>
                Adicionar
              </button>

              {showAddMenu && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowAddMenu(false)} />
                  <div className="absolute left-0 top-full mt-1 w-56 bg-white border border-slate-200 rounded-2xl shadow-xl z-20 py-1.5">
                    {EDITABLE_TYPES.map(type => (
                      <button
                        key={type}
                        onClick={() => handleAdd(type)}
                        className="w-full flex items-start gap-3 px-4 py-2.5 hover:bg-slate-50 transition-colors text-left"
                      >
                        <span className="mt-0.5 text-slate-400">{BLOCK_META[type].icon}</span>
                        <div>
                          <p className="text-sm font-semibold text-slate-800">{BLOCK_META[type].label}</p>
                          <p className="text-xs text-slate-400 mt-0.5">{BLOCK_META[type].description}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {otherEditor && (
            <div className="flex items-center gap-2 text-xs text-amber-400 bg-amber-400/10 border border-amber-400/20 rounded-lg px-2.5 py-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse shrink-0" />
              Outro admin editando
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto py-2" style={{ scrollbarWidth: 'thin', scrollbarColor: '#334155 transparent' }}>
          {blocks.length === 0 ? (
            <p className="px-4 py-8 text-center text-xs text-slate-500">Nenhum bloco adicionado.</p>
          ) : (
            blocks.map(block => {
              const meta = isEditable(block.type) ? BLOCK_META[block.type] : { label: block.type, icon: null, description: '' };
              const isEditing  = editingBlock?.id === block.id;
              const isDragging = draggingId === block.id;
              const isDragOver = dragOverId === block.id && draggingId !== block.id;

              return (
                <div
                  key={block.id}
                  draggable
                  onDragStart={() => handleDragStart(block.id)}
                  onDragOver={e => handleDragOver(e, block.id)}
                  onDragEnd={handleDragEnd}
                  className={`mx-2 mb-1 rounded-xl border transition-all ${
                    isEditing  ? 'border-blue-500 bg-blue-500/10' :
                    isDragOver ? 'border-blue-400/50 bg-blue-400/5' :
                                 'border-transparent hover:border-slate-700 hover:bg-slate-800/50'
                  } ${isDragging ? 'opacity-40' : ''}`}
                >
                  <button
                    onClick={() => setEditingBlockId(isEditing ? null : block.id)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 text-left cursor-grab active:cursor-grabbing"
                  >
                    <div className="flex items-center gap-2 shrink-0">
                      <svg className="w-3 h-3 text-slate-600" fill="currentColor" viewBox="0 0 24 24">
                        <circle cx="9" cy="6" r="1.5" /><circle cx="15" cy="6" r="1.5" />
                        <circle cx="9" cy="12" r="1.5" /><circle cx="15" cy="12" r="1.5" />
                        <circle cx="9" cy="18" r="1.5" /><circle cx="15" cy="18" r="1.5" />
                      </svg>
                      <span className={isEditing ? 'text-blue-400' : 'text-slate-500'}>{meta.icon}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-semibold truncate ${isEditing ? 'text-blue-300' : 'text-slate-300'}`}>
                        {meta.label}
                      </p>
                      {!block.is_active && <p className="text-xs text-slate-600 mt-0.5">Oculto no site</p>}
                    </div>
                  </button>

                  <div className="flex items-center gap-1 px-3 pb-2">
                    <button
                      onClick={() => handleToggle(block.id, block.is_active)}
                      title={block.is_active ? 'Ocultar no site' : 'Exibir no site'}
                      className={`p-1.5 rounded-lg transition-colors ${
                        block.is_active
                          ? 'text-emerald-400 hover:bg-emerald-400/10'
                          : 'text-slate-600 hover:bg-slate-700'
                      }`}
                    >
                      {block.is_active ? (
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      ) : (
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        </svg>
                      )}
                    </button>

                    {isSysAdmin && (
                      <button
                        onClick={() => handleDelete(block.id)}
                        title="Excluir bloco"
                        className="p-1.5 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-400/10 transition-colors"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="px-4 py-3 border-t border-slate-800">
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            Abrir site ao vivo
          </a>
        </div>
      </aside>

      {/* ── Preview central ── */}
      <div className="flex-1 flex flex-col min-w-0 bg-slate-100">
        <div className="flex items-center justify-between px-4 py-2.5 bg-white border-b border-slate-200 shrink-0">
          <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
            {(['desktop', 'tablet', 'mobile'] as PreviewDevice[]).map(d => (
              <button
                key={d}
                onClick={() => setDevice(d)}
                title={d.charAt(0).toUpperCase() + d.slice(1)}
                className={`p-1.5 rounded-md transition-colors ${device === d ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
              >
                <DeviceIcon device={d} />
              </button>
            ))}
          </div>

          <div className="flex-1 mx-4 max-w-xs">
            <div className="flex items-center gap-2 bg-slate-100 rounded-lg px-3 py-1.5">
              <svg className="w-3 h-3 text-slate-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <span className="text-xs text-slate-500 font-mono truncate">preview — rascunho atual</span>
              {!iframeReady && (
                <svg className="w-3 h-3 text-slate-400 animate-spin shrink-0" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                </svg>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {hasUnpublished && (
              <span className="flex items-center gap-1.5 text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-1.5 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                Rascunho não publicado
              </span>
            )}
            <button
              onClick={handlePublish}
              disabled={isPublishing}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg transition-colors disabled:opacity-50"
            >
              {isPublishing ? (
                <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                </svg>
              ) : (
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
              )}
              {isPublishing ? 'Publicando...' : 'Publicar site'}
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto flex justify-center p-4">
          <div
            className="bg-white rounded-xl overflow-hidden shadow-lg transition-all duration-300 h-full"
            style={{ width: DEVICE_WIDTHS[device], minHeight: '600px' }}
          >
            <iframe
              ref={iframeRef}
              src="/?preview=true"
              className="w-full h-full border-0"
              style={{ minHeight: '600px' }}
            />
          </div>
        </div>
      </div>

      {/* ── Painel de edição ── */}
      {editingBlock && (
        <div className="w-80 shrink-0 bg-white border-l border-slate-200 flex flex-col overflow-hidden">
          <BlockEditor
            block={editingBlock}
            onClose={() => { setEditingBlockId(null); router.refresh(); }}
            onContentChange={handleContentChange}
          />
        </div>
      )}
    </div>
  );
}