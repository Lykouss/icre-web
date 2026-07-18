'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { renderMessageWithLinks } from '@/lib/render-message';

export type AnnouncementPayload = {
  id: string; // The user_notification id
  type: 'INFO' | 'WARNING' | 'MAINTENANCE' | 'ALERT';
  title: string;
  message: string;
  lockDurationSeconds: number;
};

interface FullscreenAnnouncementProps {
  announcement: AnnouncementPayload | null;
  onClose: (id: string) => void;
}

export function FullscreenAnnouncement({ announcement, onClose }: FullscreenAnnouncementProps) {
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    if (announcement) {
      setTimeLeft(announcement.lockDurationSeconds);
    }
  }, [announcement]);

  useEffect(() => {
    if (!announcement || timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [announcement, timeLeft]);

  if (!announcement) return null;

  const config = {
    INFO: { bg: 'bg-blue-900/20', border: 'border-blue-500/50', icon: 'text-blue-500', color: 'from-blue-600 to-sky-400' },
    WARNING: { bg: 'bg-amber-900/20', border: 'border-amber-500/50', icon: 'text-amber-500', color: 'from-amber-500 to-yellow-300' },
    MAINTENANCE: { bg: 'bg-indigo-900/20', border: 'border-indigo-500/50', icon: 'text-indigo-500', color: 'from-indigo-600 to-purple-400' },
    ALERT: { bg: 'bg-red-900/20', border: 'border-red-500/50', icon: 'text-red-500', color: 'from-red-600 to-orange-400' },
  }[announcement.type];

  const handleClose = () => {
    if (timeLeft <= 0) {
      onClose(announcement.id);
    }
  };

  return (
    <AnimatePresence>
      {announcement && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-white/80 backdrop-blur-md dark:backdrop-blur-none border border-slate-200/50 dark:border-transparent dark:bg-slate-950/80"
            style={{ pointerEvents: 'auto' }}
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            className={`relative z-10 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden border-2 ${config.border} bg-[#0b101a]`}
          >
            {/* Top glowing bar */}
            <div className={`h-2 w-full bg-gradient-to-r ${config.color}`} />
            
            <div className={`p-8 ${config.bg}`}>
              <div className="flex items-center justify-center mb-6">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center bg-white/5 border border-white/10 shadow-lg ${config.icon}`}>
                  {announcement.type === 'INFO' && <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                  {announcement.type === 'WARNING' && <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>}
                  {announcement.type === 'MAINTENANCE' && <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
                  {announcement.type === 'ALERT' && <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                </div>
              </div>
              
              <h2 className="text-2xl font-black text-center text-slate-900 dark:text-white mb-4">{announcement.title}</h2>
              <div className="text-slate-600 dark:text-slate-300 text-sm text-center leading-relaxed whitespace-pre-wrap max-h-48 overflow-y-auto portal-scroll">
                {renderMessageWithLinks(announcement.message)}
              </div>
            </div>

            <div className="p-6 bg-black/40 border-t border-black/5 dark:border-white/5 flex justify-center">
              <button
                onClick={handleClose}
                disabled={timeLeft > 0}
                className={`w-full py-4 rounded-xl font-bold tracking-wider uppercase transition-all shadow-lg
                  ${timeLeft > 0 
                    ? 'bg-white/5 text-slate-500 cursor-not-allowed border border-white/10' 
                    : `bg-gradient-to-r ${config.color} text-white hover:scale-[1.02] hover:shadow-xl`
                  }`}
              >
                {timeLeft > 0 ? `Aguarde ${timeLeft}s para fechar` : 'Estou ciente, fechar aviso'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
