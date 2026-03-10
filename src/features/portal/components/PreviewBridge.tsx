'use client'

import { useEffect } from 'react';
import type { SiteBlock, EditorMessage } from '@/features/portal/types';

interface PreviewBridgeProps {
  onBlocksUpdate: (blocks: SiteBlock[]) => void;
  onHighlight: (blockId: string | null) => void;
}

export function PreviewBridge({ onBlocksUpdate, onHighlight }: PreviewBridgeProps) {
  useEffect(() => {
    // Avisa o editor que o iframe está pronto
    window.parent.postMessage({ type: 'preview-ready' } satisfies EditorMessage, window.location.origin);

    const handler = (e: MessageEvent) => {
      if (e.origin !== window.location.origin) return;
      const msg = e.data as { type: string; blocks?: SiteBlock[]; blockId?: string };

      if (msg.type === 'blocks-updated' && msg.blocks) {
        onBlocksUpdate(msg.blocks);
      }
      if (msg.type === 'highlight-block') {
        onHighlight(msg.blockId ?? null);
      }
    };

    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [onBlocksUpdate, onHighlight]);

  return null;
}