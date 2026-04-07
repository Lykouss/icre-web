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
        if (prev <= 1) return 0;
        return prev - 1;
      });
    }, 1000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, [router]);

  useEffect(() => {
    if (maintenanceTimer === 0) {
      router.push('/dashboard');
      router.refresh();
    }
  }, [maintenanceTimer, router]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <>
      <AnimatePresence>
        {maintenanceTimer !== null && maintenanceTimer > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -50, scale: 0.95 }}
            className="fixed top-6 left-0 right-0 z-[100] flex justify-center px-4 pointer-events-none"
          >
            <div className="bg-slate-900/80 backdrop-blur-xl text-white shadow-2xl shadow-red-500/10 rounded-3xl p-4 md:px-6 w-auto max-w-2xl flex flex-col md:flex-row items-center gap-4 border border-white/10 ring-1 ring-red-500/20 pointer-events-auto">
              <div className="flex items-center gap-3">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-red-500/20 to-amber-500/10 border border-white/5 ring-1 ring-inset ring-white/10 shadow-inner">
                  <svg className="w-6 h-6 text-red-400 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </span>
                <div className="min-w-0 pr-4">
                  <h3 className="font-bold text-sm tracking-tight text-white line-clamp-1">{moduleName} entrará em manutenção</h3>
                  <p className="text-[13px] text-slate-400 leading-tight mt-0.5 line-clamp-1">
                    Por favor, <strong>salve suas alterações</strong> o mais rápido possível.
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-center bg-black/40 shadow-inner px-4 py-2.5 rounded-2xl border border-white/5 min-w-[6rem] mx-auto md:ml-auto md:mr-0 shrink-0">
                <span className="text-2xl font-black tabular-nums tracking-tighter text-red-400">
                  {formatTime(maintenanceTimer)}
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {children}
    </>
  );
}
