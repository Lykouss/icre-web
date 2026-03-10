'use client'

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/features/core/components/ToastContext';
import { toggleBlock, reorderBlocks, addBlock, deleteBlock } from '@/features/portal/actions/portal';
import { BlockEditor } from '@/features/portal/components/BlockEditor';
import type { SiteBlock, SiteBlockType } from '@/features/portal/types';

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

interface PortalEditorProps {
  initialBlocks: SiteBlock[];
  isSysAdmin: boolean;
}

export function PortalEditor({ initialBlocks, isSysAdmin }: PortalEditorProps) {
  const router = useRouter();
  const { toast, dismiss } = useToast();

  const [blocks, setBlocks] = useState<SiteBlock[]>(initialBlocks);
  const [editingBlock, setEditingBlock] = useState<SiteBlock | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleToggle = (blockId: string, current: boolean) => {
    setBlocks(prev => prev.map(b => b.id === blockId ? { ...b, is_active: !current } : b));
    startTransition(async () => {
      const result = await toggleBlock(blockId, !current);
      if (result.error) {
        toast('error', result.error);
        setBlocks(prev => prev.map(b => b.id === blockId ? { ...b, is_active: current } : b));
      } else {
        router.refresh();
      }
    });
  };

  const handleDragStart = (id: string) => setDraggingId(id);

  const handleDragOver = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggingId || draggingId === targetId) return;

    setBlocks(prev => {
      const arr = [...prev];
      const fromIdx = arr.findIndex(b => b.id === draggingId);
      const toIdx   = arr.findIndex(b => b.id === targetId);
      const [moved] = arr.splice(fromIdx, 1);
      arr.splice(toIdx, 0, moved);
      return arr;
    });
  };

  const handleDragEnd = () => {
    setDraggingId(null);
    const orderedIds = blocks.map(b => b.id);
    startTransition(async () => {
      const result = await reorderBlocks(orderedIds);
      if (result.error) toast('error', result.error);
      else router.refresh();
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
    startTransition(async () => {
      const loadingId = toast('loading', 'Removendo bloco...');
      const result = await deleteBlock(blockId);
      dismiss(loadingId);
      if (result.error) toast('error', result.error);
      else {
        toast('success', 'Bloco removido.');
        setBlocks(prev => prev.filter(b => b.id !== blockId));
        router.refresh();
      }
    });
  };

  return (
    <div className="flex gap-6 items-start">

      {/* Lista de blocos */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-slate-500">Arraste para reordenar · clique em <strong>Editar</strong> para personalizar o conteúdo</p>
          <div className="relative">
            <button
              onClick={() => setShowAddMenu(v => !v)}
              className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl font-semibold hover:bg-blue-700 text-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
              Adicionar bloco
            </button>
            {showAddMenu && (
              <div className="absolute right-0 top-full mt-2 bg-white border border-slate-200 rounded-2xl shadow-xl z-20 py-2 w-52">
                {(Object.keys(BLOCK_LABELS) as SiteBlockType[]).map(type => (
                  <button
                    key={type}
                    onClick={() => handleAdd(type)}
                    disabled={isPending}
                    className="w-full px-4 py-2.5 text-left text-sm hover:bg-slate-50 flex items-center gap-3 disabled:opacity-50"
                  >
                    <span>{BLOCK_ICONS[type]}</span>
                    <span className="font-medium text-slate-700">{BLOCK_LABELS[type]}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-3">
          {blocks.map(block => (
            <div
              key={block.id}
              draggable
              onDragStart={() => handleDragStart(block.id)}
              onDragOver={e => handleDragOver(e, block.id)}
              onDragEnd={handleDragEnd}
              className={`bg-white rounded-2xl border-2 transition-all select-none ${
                draggingId === block.id
                  ? 'border-blue-400 opacity-50 scale-[0.98]'
                  : 'border-slate-200 hover:border-slate-300'
              } ${!block.is_active ? 'opacity-60' : ''}`}
            >
              <div className="px-4 py-3 flex items-center gap-4">
                <div className="cursor-grab text-slate-300 hover:text-slate-400 shrink-0">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 6a2 2 0 100-4 2 2 0 000 4zm0 8a2 2 0 100-4 2 2 0 000 4zm0 8a2 2 0 100-4 2 2 0 000 4zm8-16a2 2 0 100-4 2 2 0 000 4zm0 8a2 2 0 100-4 2 2 0 000 4zm0 8a2 2 0 100-4 2 2 0 000 4z" />
                  </svg>
                </div>

                <span className="text-xl shrink-0">{BLOCK_ICONS[block.type]}</span>

                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-800 text-sm">{BLOCK_LABELS[block.type]}</p>
                  <p className="text-xs text-slate-400 mt-0.5 truncate">
                    {(() => { const c = block.content as Record<string, unknown>; return (c.title as string) || (c.image_url as string) || '—'; })()}
                  </p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <button
                    onClick={() => handleToggle(block.id, block.is_active)}
                    disabled={isPending}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors disabled:opacity-50 ${block.is_active ? 'bg-blue-600' : 'bg-slate-200'}`}
                  >
                    <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${block.is_active ? 'translate-x-4' : 'translate-x-0.5'}`} />
                  </button>

                  <button
                    onClick={() => setEditingBlock(block)}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-800 px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-colors"
                  >
                    Editar
                  </button>

                  {isSysAdmin && (
                    <button
                      onClick={() => handleDelete(block.id)}
                      disabled={isPending}
                      className="text-red-400 hover:text-red-600 disabled:opacity-50"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 flex items-center gap-3">
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-semibold hover:bg-slate-200 text-sm transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            Ver site ao vivo
          </a>
        </div>
      </div>

      {/* Painel lateral de edição */}
      {editingBlock && (
        <div className="w-96 shrink-0 bg-white rounded-3xl border border-slate-200 shadow-sm sticky top-6 max-h-[85vh] flex flex-col overflow-hidden">
          <BlockEditor
            block={editingBlock}
            onClose={() => {
              setEditingBlock(null);
              router.refresh();
            }}
          />
        </div>
      )}

      {showAddMenu && (
        <div className="fixed inset-0 z-10" onClick={() => setShowAddMenu(false)} />
      )}
    </div>
  );
}