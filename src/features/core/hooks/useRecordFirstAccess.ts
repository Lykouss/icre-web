'use client';

import { useEffect, useRef } from 'react';

/**
 * Hook that records a user's first access to a flag-gated module.
 * Must be called inside a page component. It fires once on mount.
 * NOTE: userId is only used as a dependency to wait for auth — the API
 * extracts the real userId from the server session (not from the body).
 */
export function useRecordFirstAccess(flagSlug: string, userId: string | null | undefined) {
  const recorded = useRef(false);

  useEffect(() => {
    if (recorded.current || !userId) return;
    recorded.current = true;

    // Fire-and-forget: calls the lightweight API route
    // userId is NOT sent in the body — the route reads it from the auth session
    fetch(`/api/flags/record-access`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ flagSlug }),
    }).catch(() => {
      // Silently ignore — this is best-effort tracking
    });
  }, [flagSlug, userId]);
}
