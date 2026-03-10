'use client'

import React, { useState, useEffect, useRef, useTransition, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/features/core/components/ToastContext';
import { toggleBlock, reorderBlocks, addBlock, deleteBlock, publishAllBlocks } from '@/features/portal/actions/portal';
import { BlockEditor } from '@/features/portal/components/BlockEditor';
import type { SiteBlock, SiteBlockType, EditorMessage } from '@/features/portal/types';

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

const BLOCK_ICONS: Record<SiteBlockType, string> = {
  hero:        '🎨',
  about:       'ℹ️',
  mission:     '🎯',
  events:      '📅',
  youtube:     '▶️',
  contact:     '📍',
  custom_text: '✏️',
  banner:      '🖼️',
};

type PreviewDevice = 'desktop' | 'tablet' | 'mobile';

const DEVICE_WIDTHS: Record<PreviewDevice, string> = {
  desktop: '100%',
  tablet:  '768px',
  mobile:  '390px',
};

interface VisualEditorProps {
  initialBlocks: SiteBlock[];
  isSysAdmin: boolean;
}

export function VisualEditor({ initialBlocks, isSysAdmin }: VisualEditorProps) {
  const router = useRouter();
  const { toast, dismiss } = useToast();
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const [blocks, setBlocks] = useState<SiteBlock[]>(initialBlocks);
  const [editingBlock, setEditingBlock] = useState<SiteBlock | null>(null);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [device, setDevice] = useState<PreviewDevice>('desktop');
  const [isPending, startTransition] = useTransition();
  const [isPublishing, startPublishTransition] = useTransition();
  const [iframeReady, setIframeReady] = useState(false);
  const [hasUnpublished, setHasUnpublished] = useState(false);
  const [otherEditorActive, setOtherEditorActive] = useState(false);

  // Realtime — detecta quando outro admin salva um bloco
  useEffect(() => {
    const supabase = createClient();
    let timeout: ReturnType<typeof setTimeout>;

    const channel = supabase
      .channel('portal_realtime')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'site_blocks' }, () => {
        setOtherEditorActive(true);
        clearTimeout(timeout);
        timeout = setTimeout(() => setOtherEditorActive(false), 5000);
        router.refresh();
      })
      .subscribe();

    return () => {
      clearTimeout(timeout);
      supabase.removeChannel(channel);
    };
  }, [router]);

  // Escuta mensagens do iframe (bloco clicado no preview)
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.origin !== window.location.origin) return;
      const msg = e.data as EditorMessage;
      if (msg.type === 'block-clicked' && msg.blockId) {
        const block = blocks.find(b => b.id === msg.blockId);
        if (block) setEditingBlock(block);
      }
      if (msg.type === 'preview-ready') setIframeReady(true);
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [blocks]);

  // Envia blocos atualizados para o iframe em tempo real
  const sendBlocksToPreview = useCallback((updatedBlocks: SiteBlock[]) => {
    iframeRef.current?.contentWindow?.postMessage(
      { type: 'blocks-updated', blocks: updatedBlocks } satisfies { type: string; blocks: SiteBlock[] },
      window.location.origin
    );
  }, []);

  // Quando o editor altera conteúdo localmente, atualiza o preview sem salvar
  const handleContentChange = (blockId: string, content: Record<string, unknown>) => {
    const updated = blocks.map(b =>
      b.id === blockId ? { ...b, content } : b
    );
    setBlocks(updated);
    sendBlocksToPreview(updated);
    setHasUnpublished(true);
  };

  const handleToggle = (blockId: string, current: boolean) => {
    const updated = blocks.map(b => b.id === blockId ? { ...b, is_active: !current } : b);
    setBlocks(updated);
    sendBlocksToPreview(updated);
    setHasUnpublished(true);

    startTransition(async () => {
      const result = await toggleBlock(blockId, !current);
      if (result.error) {
        toast('error', result.error);
        setBlocks(blocks);
      }
    });
  };

  const handleDragStart = (id: string) => setDraggingId(id);

  const handleDragOver = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggingId || draggingId === targetId) return;
    setBlocks(prev => {
      const arr = [...prev];
      const from = arr.findIndex(b => b.id === draggingId);
      const to   = arr.findIndex(b => b.id === targetId);
      const [moved] = arr.splice(from, 1);
      arr.splice(to, 0, moved);
      return arr;
    });
  };

  const handleDragEnd = () => {
    setDraggingId(null);
    sendBlocksToPreview(blocks);
    setHasUnpublished(true);
    startTransition(async () => {
      const result = await reorderBlocks(blocks.map(b => b.id));
      if (result.error) toast('error', result.error);
    });
  };

  const handleAdd = (type: SiteBlockType) => {
    setShowAddMenu(false);
    startTransition(async () => {
      const loadingId = toast('loading', 'Adicionando bloco...');
      const result = await addBlock(type);
      dismiss(loadingId);
      if (result.error) toast('error', result.error);
      else {
        toast('success', 'Bloco adicionado!');
        router.refresh();
      }
    });
  };

  const handleDelete = (blockId: string) => {
    const updated = blocks.filter(b => b.id !== blockId);
    setBlocks(updated);
    sendBlocksToPreview(updated);
    setHasUnpublished(true);

    startTransition(async () => {
      const loadingId = toast('loading', 'Removendo bloco...');
      const result = await deleteBlock(blockId);
      dismiss(loadingId);
      if (result.error) {
        toast('error', result.error);
        setBlocks(blocks);
      } else {
        toast('success', 'Bloco removido.');
      }
    });
  };

  const handlePublish = () => {
    startPublishTransition(async () => {
      const loadingId = toast('loading', 'Publicando site...');
      const result = await publishAllBlocks();
      dismiss(loadingId);
      if (result.error) toast('error', result.error);
      else {
        toast('success', '🎉 Site publicado com sucesso!');
        setHasUnpublished(false);
      }
    });
  };

  const highlightBlock = (blockId: string | null) => {
    setHighlightedId(blockId);
    iframeRef.current?.contentWindow?.postMessage(
      { type: 'highlight-block', blockId: blockId ?? undefined } satisfies EditorMessage,
      window.location.origin
    );
  };

  return (
    <div className="flex flex-col h-[calc(100vh-80px)]">

      {/* Toolbar superior */}
      <div className="flex items-center justify-between gap-4 mb-4 shrink-0">
        <div className="flex items-center gap-2 bg-slate-100 rounded-xl p-1">
          {(['desktop', 'tablet', 'mobile'] as PreviewDevice[]).map(d => (
            <button
              key={d}
              onClick={() => setDevice(d)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${device === d ? 'bg-white shadow text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
            >
              {d === 'desktop' ? '🖥 Desktop' : d === 'tablet' ? '📱 Tablet' : '📱 Mobile'}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          {otherEditorActive && (
            <span className="text-xs text-purple-700 font-semibold bg-purple-50 px-3 py-1.5 rounded-xl border border-purple-200 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
              Outro admin editando
            </span>
          )}
          {hasUnpublished && (
            <span className="text-xs text-amber-600 font-semibold bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-200">
              Rascunho não publicado
            </span>
          )}
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-semibold hover:bg-slate-200 text-sm transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            Ver ao vivo
          </a>
          <button
            onClick={handlePublish}
            disabled={isPublishing}
            className="px-4 py-2 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 disabled:opacity-50 text-sm flex items-center gap-2 transition-colors"
          >
            {isPublishing ? (
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
              </svg>
            ) : '🚀'}
            {isPublishing ? 'Publicando...' : 'Publicar tudo'}
          </button>
        </div>
      </div>

      {/* Layout principal: sidebar + preview */}
      <div className="flex gap-4 flex-1 min-h-0">

        {/* Sidebar — lista de blocos */}
        <div className="w-72 shrink-0 flex flex-col gap-3 overflow-y-auto">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Blocos</p>
            <div className="relative">
              <button
                onClick={() => setShowAddMenu(v => !v)}
                className="inline-flex items-center gap-1.5 bg-blue-600 text-white px-3 py-1.5 rounded-xl font-semibold hover:bg-blue-700 text-xs"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                </svg>
                Adicionar
              </button>
              {showAddMenu && (
                <div className="absolute right-0 top-full mt-1 bg-white border border-slate-200 rounded-2xl shadow-xl z-20 py-2 w-48">
                  {(Object.keys(BLOCK_LABELS) as SiteBlockType[]).map(type => (
                    <button
                      key={type}
                      onClick={() => handleAdd(type)}
                      disabled={isPending}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-slate-50 flex items-center gap-2.5 disabled:opacity-50"
                    >
                      <span>{BLOCK_ICONS[type]}</span>
                      <span className="font-medium text-slate-700">{BLOCK_LABELS[type]}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {blocks.map(block => (
            <div
              key={block.id}
              draggable
              onDragStart={() => handleDragStart(block.id)}
              onDragOver={e => handleDragOver(e, block.id)}
              onDragEnd={handleDragEnd}
              onMouseEnter={() => highlightBlock(block.id)}
              onMouseLeave={() => highlightBlock(null)}
              onClick={() => setEditingBlock(block)}
              className={`bg-white rounded-2xl border-2 transition-all cursor-pointer select-none p-3 ${
                editingBlock?.id === block.id
                  ? 'border-blue-500 shadow-md shadow-blue-100'
                  : highlightedId === block.id
                  ? 'border-blue-300'
                  : draggingId === block.id
                  ? 'border-slate-300 opacity-50'
                  : 'border-slate-200 hover:border-slate-300'
              } ${!block.is_active ? 'opacity-50' : ''}`}
            >
              <div className="flex items-center gap-2.5">
                <div className="cursor-grab text-slate-300 shrink-0">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 6a2 2 0 100-4 2 2 0 000 4zm0 8a2 2 0 100-4 2 2 0 000 4zm0 8a2 2 0 100-4 2 2 0 000 4zm8-16a2 2 0 100-4 2 2 0 000 4zm0 8a2 2 0 100-4 2 2 0 000 4zm0 8a2 2 0 100-4 2 2 0 000 4z" />
                  </svg>
                </div>
                <span className="text-base">{BLOCK_ICONS[block.type]}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-800 text-xs">{BLOCK_LABELS[block.type]}</p>
                  <p className="text-xs text-slate-400 truncate">
                    {(() => { const c = block.content as Record<string, unknown>; return (c?.title as string) || '—'; })()}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0" onClick={e => e.stopPropagation()}>
                  <button
                    onClick={() => handleToggle(block.id, block.is_active)}
                    className={`relative inline-flex h-4 w-7 items-center rounded-full transition-colors ${block.is_active ? 'bg-blue-600' : 'bg-slate-200'}`}
                  >
                    <span className={`inline-block h-3 w-3 rounded-full bg-white shadow transition-transform ${block.is_active ? 'translate-x-3.5' : 'translate-x-0.5'}`} />
                  </button>
                  {isSysAdmin && (
                    <button
                      onClick={() => handleDelete(block.id)}
                      className="text-red-400 hover:text-red-600"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Preview iframe */}
        <div className="flex-1 min-w-0 bg-slate-200 rounded-2xl overflow-hidden flex flex-col">
          <div className="flex items-center gap-2 px-4 py-2 bg-slate-300 rounded-t-2xl shrink-0">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-400" />
              <div className="w-3 h-3 rounded-full bg-yellow-400" />
              <div className="w-3 h-3 rounded-full bg-green-400" />
            </div>
            <div className="flex-1 bg-white rounded-lg px-3 py-1 text-xs text-slate-500 font-mono">
              icre.com.br/
            </div>
            {!iframeReady && (
              <span className="text-xs text-slate-500">Carregando preview...</span>
            )}
          </div>

          <div className="flex-1 overflow-auto flex justify-center bg-slate-200 p-2">
            <div
              className="bg-white rounded-b-xl overflow-hidden shadow-xl transition-all duration-300 h-full"
              style={{ width: DEVICE_WIDTHS[device], minHeight: '100%' }}
            >
              <iframe
                ref={iframeRef}
                src="/?preview=true"
                className="w-full h-full border-0"
                style={{ minHeight: '800px' }}
                onLoad={() => {
                  // Envia blocos atuais ao iframe assim que carrega
                  setTimeout(() => sendBlocksToPreview(blocks), 300);
                }}
              />
            </div>
          </div>
        </div>

        {/* Painel lateral de edição */}
        {editingBlock && (
          <div className="w-80 shrink-0 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
            <BlockEditor
              block={editingBlock}
              onClose={() => setEditingBlock(null)}
              onContentChange={handleContentChange}
            />
          </div>
        )}
      </div>

      {showAddMenu && (
        <div className="fixed inset-0 z-10" onClick={() => setShowAddMenu(false)} />
      )}
    </div>
  );
}