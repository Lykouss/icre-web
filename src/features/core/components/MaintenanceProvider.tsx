'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import { differenceInSeconds } from 'date-fns';

interface MaintenanceProviderProps {
  children: React.ReactNode;
}

export function MaintenanceProvider({ children }: MaintenanceProviderProps) {
  const router = useRouter();
  const [maintenanceTimer, setMaintenanceTimer] = useState<number | null>(null);
  const [moduleName, setModuleName] = useState<string>('O sistema');

  useEffect(() => {
    const supabase = createClient();
    
    // Check initial state or whenever a realtime event fires
    const checkMaintenance = async () => {
      const { data } = await supabase
        .from('feature_flags')
        .select('slug, status, maintenance_scheduled_at')
        .not('maintenance_scheduled_at', 'is', null);
      
      if (!data || data.length === 0) {
        setMaintenanceTimer(null);
        return;
      }
      
      // Find the most critical/imminent maintenance
      // Se houver manutenção global, ela sobrepõe. Se for módulo, avisamos sobre ele.
      const imminent = data.reduce((prev, curr) => {
        if (!prev) return curr;
        // Priorize system_core se existir
        if (curr.slug === 'system_core') return curr;
        return differenceInSeconds(new Date(curr.maintenance_scheduled_at!), new Date(prev.maintenance_scheduled_at!)) < 0 ? curr : prev;
      }, null as typeof data[0] | null);

      if (imminent?.maintenance_scheduled_at) {
        const secs = differenceInSeconds(new Date(imminent.maintenance_scheduled_at), new Date());
        if (secs > 0 && secs <= 900) { // dentro dos 15 min
           setMaintenanceTimer(secs);
           setModuleName(imminent.slug === 'system_core' ? 'O sistema inteiro' : 'Um ou mais módulos');
        } else if (secs <= 0) {
           // Força recarregamento ou redirecionamento se zerou
           router.refresh();
        }
      } else {
        setMaintenanceTimer(null);
      }
    };

    checkMaintenance();

    const channel = supabase
      .channel('maintenance_warnings')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'feature_flags' }, () => {
        checkMaintenance();
        // Also simply trigger Next.js router refresh so server components get the fresh status
        router.refresh();
      })
      .subscribe();

    const interval = setInterval(() => {
      setMaintenanceTimer((prev) => {
        if (prev === null) return null;
        if (prev <= 1) {
          router.push('/dashboard');
          router.refresh();
          return null;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, [router]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <>
      <AnimatePresence>
        {maintenanceTimer !== null && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-0 left-0 right-0 z-[100] flex justify-center p-4 pointer-events-none"
          >
            <div className="bg-gradient-to-r from-red-600 to-amber-600 text-white shadow-2xl rounded-2xl p-4 max-w-xl w-full flex items-center justify-between pointer-events-auto border border-red-400/30">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/20">
                  <svg className="w-6 h-6 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </span>
                <div>
                  <h3 className="font-bold text-sm">Aviso de Manutenção</h3>
                  <p className="text-xs text-red-100 pr-4">
                    {moduleName} entrará em manutenção em breve. Por favor, <strong>salve tudo o que estiver fazendo</strong>.
                  </p>
                </div>
              </div>
              <div className="text-2xl font-black tabular-nums tracking-tighter bg-black/20 px-3 py-1.5 rounded-xl text-center min-w-[5rem]">
                {formatTime(maintenanceTimer)}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {children}
    </>
  );
}
