'use client'

import { useState, useTransition } from 'react';
import { DownloadIcon, Loader2 } from 'lucide-react';
import { logPdfDownload } from '@/features/portal/actions/pdf-actions';

interface DownloadReceiptButtonProps {
  registrationId: string;
  disabled?: boolean;
  disabledReason?: string;
}

export function DownloadReceiptButton({ registrationId, disabled, disabledReason }: DownloadReceiptButtonProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState('');

  const handleDownload = () => {
    if (disabled) return;
    setError('');
    startTransition(async () => {
      const result = await logPdfDownload(registrationId);
      if (result.error) {
        setError(result.error);
        return;
      }
      // Open the receipt page in a new tab for browser print/save
      window.open(`/comprovante/${registrationId}?print=1`, '_blank');
    });
  };

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={handleDownload}
        disabled={disabled || isPending}
        title={disabledReason}
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-slate-900 dark:text-white text-sm font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <DownloadIcon className="w-4 h-4" />}
        Baixar PDF
      </button>
      {error && <p className="text-xs text-red-400 max-w-[200px] text-right">{error}</p>}
    </div>
  );
}
