import { Wrench } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { MaintenanceCountdown } from './MaintenanceCountdown';

export default async function MaintenanceScreen() {
  const supabase = await createClient();
  const { data: maintenance } = await supabase
    .from('site_maintenance')
    .select('message, expected_end_at, auto_deactivate_expected, is_portal_maintenance, is_sige_maintenance')
    .eq('id', 1)
    .single();

  const message = maintenance?.message || 'O site está em manutenção. Voltaremos em breve.';
  
  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
      <div className="w-20 h-20 bg-amber-500/10 rounded-3xl flex items-center justify-center mb-8 border border-amber-500/20 shadow-2xl shadow-amber-500/10 animate-breathe">
        <Wrench className="w-10 h-10 text-amber-500" />
      </div>
      <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">Site em Manutenção</h1>
      <p className="text-slate-500 dark:text-slate-400 max-w-md text-lg leading-relaxed mb-8">
        {message}
      </p>
      
      {maintenance?.expected_end_at ? (
        <MaintenanceCountdown 
          expectedEndAt={maintenance.expected_end_at} 
          serverTime={Date.now()} 
          autoDeactivate={maintenance.auto_deactivate_expected}
        />
      ) : (
        <MaintenanceCountdown 
          expectedEndAt={null} 
          autoDeactivate={false} 
        />
      )}
    </div>
  );
}
