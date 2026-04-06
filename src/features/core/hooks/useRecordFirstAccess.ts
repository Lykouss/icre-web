'use client';

import { useEffect, useRef } from 'react';

/**
 * Hook that records a user's first access to a flag-gated module.
 * Must be called inside a page component. It fires once on mount.
 */
export function useRecordFirstAccess(flagSlug: string, userId: string | null | undefined) {
  const recorded = useRef(false);

  useEffect(() => {
    if (recorded.current || !userId) return;
    recorded.current = true;

    // Fire-and-forget: calls the lightweight API route
    fetch(`/api/flags/record-access`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ flagSlug, userId }),
    }).catch(() => {
      // Silently ignore — this is best-effort tracking
    });
  }, [flagSlug, userId]);
}
