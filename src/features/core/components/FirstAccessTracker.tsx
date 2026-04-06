'use client';

import { useRecordFirstAccess } from '@/features/core/hooks/useRecordFirstAccess';

interface FirstAccessTrackerProps {
  flagSlug: string;
  userId: string | null | undefined;
}

/**
 * Client component to track the first access to a feature flag.
 */
export function FirstAccessTracker({ flagSlug, userId }: FirstAccessTrackerProps) {
  useRecordFirstAccess(flagSlug, userId);
  return null;
}
