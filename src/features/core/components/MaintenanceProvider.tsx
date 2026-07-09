'use client'

import { ReactNode, useEffect } from 'react';
import { useMaintenance } from '@/features/core/hooks/use-maintenance';
import { AlertTriangle } from 'lucide-react';

interface MaintenanceProviderProps {
  children: ReactNode;
}

export function MaintenanceProvider({ children }: MaintenanceProviderProps) {
  const { maintenance, isSysAdmin, loading } = useMaintenance();

  // Efeito que monitora o momento exato em que a manutenção deve iniciar
  useEffect(() => {
    if (loading) return; // Aguarda a verificação de SysAdmin terminar

    if (maintenance && !maintenance.is_portal_maintenance && !maintenance.is_sige_maintenance && maintenance.scheduled_at && maintenance.auto_activate_scheduled) {
      const scheduledTime = new Date(maintenance.scheduled_at).getTime();
      const expectedEndTime = maintenance.expected_end_at ? new Date(maintenance.expected_end_at).getTime() : null;

      const interval = setInterval(() => {
        const now = Date.now();
        const isPastStart = now >= scheduledTime;
        const isPastEnd = expectedEndTime ? now >= expectedEndTime : false;

        // Só redireciona se passou do início E NÃO passou do fim
        if (isPastStart && !isPastEnd && !isSysAdmin) {
          if (window.location.pathname !== '/manutencao-screen') {
            window.location.href = '/manutencao-screen';
          }
        }
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [maintenance?.scheduled_at, maintenance?.expected_end_at, maintenance?.auto_activate_scheduled, maintenance?.is_portal_maintenance, maintenance?.is_sige_maintenance, isSysAdmin, loading]);

  if (loading) return <>{children}</>;

  if (!maintenance) return <>{children}</>;

  // Calcula tempo restante se houver agendamento
  let timeRemaining = null;
  if (maintenance.scheduled_at && !maintenance.is_portal_maintenance && !maintenance.is_sige_maintenance) {
    const scheduledTime = new Date(maintenance.scheduled_at).getTime();
    const now = Date.now();
    const diffMins = Math.ceil((scheduledTime - now) / 60000);
    
    if (diffMins > 0 && diffMins <= 15) {
      timeRemaining = diffMins;
    }
  }

  // Se a manutenção está ativa e não é SysAdmin -> O Middleware fará o bloqueio e rewrite.
  // Não fazemos mais bloqueio em tela client-side para evitar flashes!

  return (
    <>
      {/* Banner flutuante para SysAdmins informando que o site está fora do ar para o público */}
      {(maintenance.is_portal_maintenance || maintenance.is_sige_maintenance) && isSysAdmin && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] bg-amber-500 text-amber-950 px-4 py-2 rounded-full font-semibold shadow-xl flex items-center gap-2 border border-amber-400/50 animate-in slide-in-from-bottom-4 text-sm whitespace-nowrap">
          <AlertTriangle className="w-4 h-4" />
          {maintenance.is_portal_maintenance ? 'Portal em Manutenção (Acesso Bloqueado)' : 'SIGE em Manutenção (Acesso Bloqueado)'}
        </div>
      )}

      {/* Alerta de Manutenção Agendada */}
      {timeRemaining !== null && (
        <div className="fixed bottom-4 right-4 z-[9999] bg-slate-900 text-white px-6 py-4 rounded-2xl border border-amber-500/30 shadow-2xl flex items-start gap-4 max-w-sm animate-in slide-in-from-bottom-4">
          <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
          </div>
          <div>
            <h4 className="font-bold text-amber-500 mb-1">Manutenção Programada</h4>
            <p className="text-sm text-slate-300">
              O sistema será pausado em aproximadamente <strong className="text-white">{timeRemaining} minutos</strong>. Salve seu trabalho.
            </p>
          </div>
        </div>
      )}

      {children}
    </>
  );
}
