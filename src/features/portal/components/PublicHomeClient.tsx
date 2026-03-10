'use client'

import React, { useState, useCallback, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { BlockRenderer } from '@/features/portal/components/BlockRenderer';
import { PreviewBridge } from '@/features/portal/components/PreviewBridge';
import type { SiteBlock } from '@/features/portal/types';
import type { PublicEvent } from '@/features/portal/components/BlockRenderer';

interface PublicHomeClientProps {
  blocks: SiteBlock[];
  publicEvents: PublicEvent[];
  isPreview: boolean;
}

export function PublicHomeClient({ blocks: initialBlocks, publicEvents, isPreview }: PublicHomeClientProps) {
  const [blocks, setBlocks] = useState<SiteBlock[]>(initialBlocks);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);

  // Realtime — quando published_content muda, recarrega o bloco atualizado
  useEffect(() => {
    if (isPreview) return; // no preview, blocos vêm via postMessage

    const supabase = createClient();

    const channel = supabase
      .channel('public_site_realtime')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'site_blocks' },
        payload => {
          const updated = payload.new as SiteBlock;
          setBlocks(prev =>
            prev.map(b =>
              b.id === updated.id
                ? { ...updated, content: updated.published_content }
                : b
            )
          );
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [isPreview]);

  const handleBlocksUpdate = useCallback((updated: SiteBlock[]) => {
    setBlocks(updated);
  }, []);

  const handleHighlight = useCallback((blockId: string | null) => {
    setHighlightedId(blockId);
  }, []);

  const notifyBlockClick = (blockId: string) => {
    if (!isPreview) return;
    window.parent.postMessage({ type: 'block-clicked', blockId }, window.location.origin);
  };

  return (
    <main>
      {isPreview && (
        <PreviewBridge onBlocksUpdate={handleBlocksUpdate} onHighlight={handleHighlight} />
      )}

      {isPreview && (
        <div className="fixed bottom-4 right-4 z-50 bg-blue-600 text-white text-xs font-semibold px-4 py-2.5 rounded-2xl shadow-lg pointer-events-none flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
          Modo preview · clique em um bloco para editar
        </div>
      )}

      {blocks.map(block => (
        <div
          key={block.id}
          data-block-id={block.id}
          onClick={() => notifyBlockClick(block.id)}
          className={isPreview ? `relative cursor-pointer transition-all ${
            highlightedId === block.id
              ? 'outline-2 outline-blue-500 -outline-offset-2'
              : 'hover:outline-2 hover:outline-blue-300 hover:-outline-offset-2'
          }` : ''}
        >
          {isPreview && highlightedId === block.id && (
            <div className="absolute top-2 left-2 z-10 bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded-lg pointer-events-none shadow">
              Clique para editar
            </div>
          )}
          <BlockRenderer block={block} publicEvents={publicEvents} />
        </div>
      ))}
    </main>
  );
}