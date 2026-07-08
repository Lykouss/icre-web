'use client';

import { useState } from 'react';
import { markGiftAsNotified } from '@/features/events/actions/registrations';
import { GiftIcon, XIcon, ExternalLinkIcon } from 'lucide-react';
import Link from 'next/link';

interface GiftNotificationModalProps {
  gifts: { id: string; eventName: string; receiptUrl: string }[];
}

export function GiftNotificationModal({ gifts }: GiftNotificationModalProps) {
  const [openGifts, setOpenGifts] = useState(gifts);

  if (openGifts.length === 0) return null;

  const currentGift = openGifts[0];

  const handleClose = async () => {
    // Mark as notified in DB
    await markGiftAsNotified(currentGift.id);
    // Remove from state
    setOpenGifts(prev => prev.filter(g => g.id !== currentGift.id));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden border border-slate-200 dark:border-white/10 p-6 animate-in zoom-in-95 duration-300">
        <button 
          onClick={handleClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-white/5 transition-colors text-slate-500"
        >
          <XIcon className="w-5 h-5" />
        </button>
        
        <div className="w-16 h-16 bg-pink-100 dark:bg-pink-500/10 border border-pink-200 dark:border-pink-500/20 rounded-2xl flex items-center justify-center mb-5 mx-auto">
          <GiftIcon className="w-8 h-8 text-pink-500 dark:text-pink-400" />
        </div>
        
        <div className="text-center space-y-2 mb-6">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Você ganhou um ingresso!</h2>
          <p className="text-slate-600 dark:text-slate-400 text-sm">
            Você foi presenteado com uma inscrição para o evento <strong className="text-slate-900 dark:text-white font-semibold">{currentGift.eventName}</strong>.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <Link
            href={currentGift.receiptUrl}
            onClick={handleClose}
            target="_blank"
            className="flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl font-bold text-white transition-all shadow-lg hover:shadow-xl active:scale-[0.98]"
            style={{ background: 'linear-gradient(135deg, #f472b6 0%, #db2777 100%)' }}
          >
            Ver Comprovante e QR Code
            <ExternalLinkIcon className="w-4 h-4" />
          </Link>
          <button
            onClick={handleClose}
            className="flex items-center justify-center w-full py-3 px-4 rounded-xl font-bold text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5 transition-all"
          >
            Dispensar
          </button>
        </div>
      </div>
    </div>
  );
}
