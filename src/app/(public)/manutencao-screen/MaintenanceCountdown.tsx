'use client'

import { useState, useEffect } from 'react';
import { Clock, RefreshCw } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export function MaintenanceCountdown({ expectedEndAt, serverTime, autoDeactivate }: { expectedEndAt: string | null, serverTime?: number, autoDeactivate: boolean }) {
  const [timeLeft, setTimeLeft] = useState<string | null>(null);
  const [offset] = useState(() => (serverTime ? serverTime - Date.now() : 0));
  const [isFinished, setIsFinished] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    // Inscreve no Realtime para detectar quando a manutenção for desativada manualmente
    const channel = supabase.channel('public:site_maintenance_screen')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'site_maintenance' }, (payload) => {
        const row = payload.new as any;
        if (row && !row.is_portal_maintenance && !row.is_sige_maintenance) {
          window.location.href = '/'; // Redireciona para home se a manutenção global acabar
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    if (!expectedEndAt) return;
    
    const target = new Date(expectedEndAt).getTime();
    
    const interval = setInterval(() => {
      const now = Date.now() + offset;
      const diff = target - now;
      
      if (diff <= 0) {
        if (autoDeactivate) {
          window.location.href = '/';
        } else {
          setTimeLeft('Tempo estimado atingido');
          setIsFinished(true);
        }
        clearInterval(interval);
        return;
      }
      
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      
      if (hours > 0) {
        setTimeLeft(`${hours}h ${minutes}m`);
      } else {
        setTimeLeft(`${minutes}m ${seconds}s`);
      }
    }, 1000);
    
    return () => clearInterval(interval);
  }, [expectedEndAt]);

  if (!timeLeft) return null;

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex items-center gap-2 bg-slate-900 border border-slate-700 px-4 py-2 rounded-full text-slate-300">
        <Clock className="w-4 h-4 text-amber-500" />
        <span className="text-sm font-semibold">
          Expectativa de retorno: <strong className="text-white">{timeLeft}</strong>
        </span>
      </div>
      
      {isFinished && !autoDeactivate && (
        <button 
          onClick={() => window.location.href = '/'}
          className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors bg-slate-800/50 hover:bg-slate-700 px-4 py-2 rounded-full border border-slate-700 hover:border-slate-600"
        >
          <RefreshCw className="w-4 h-4" />
          Tentar acessar novamente
        </button>
      )}
    </div>
  );
}
