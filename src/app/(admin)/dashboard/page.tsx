import { getFeatureFlag } from '@/features/core/api/get-feature-flag';
import { getCurrentUser } from '@/features/core/api/get-current-user';
import { MaintenanceScreen } from '@/features/core/components/MaintenanceScreen';
import { FirstAccessTracker } from '@/features/core/components/FirstAccessTracker';
import { PageHeader } from '@/features/core/components/AdminSidebarShell';

export default async function DashboardPage() {
  const user = await getCurrentUser();
  const flag = await getFeatureFlag('module_dashboard', user);

  if (!flag.isSysAdmin && (!flag.isActive || flag.status === 'manutencao')) {
    return <MaintenanceScreen featureName="Dashboard" />;
  }

  return (
    <div className="max-w-7xl mx-auto">
      <FirstAccessTracker flagSlug="module_dashboard" userId={user?.id} />
      
      <PageHeader 
        title="Dashboard" 
        description="Bem-vindo ao SIGE-Web! Em breve, os gráficos de membros, finanças e eventos aparecerão aqui."
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl p-6 flex flex-col items-center justify-center text-center h-48 shadow-sm">
          <svg className="w-8 h-8 text-gray-400 dark:text-slate-500 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
          <h3 className="text-gray-900 dark:text-white font-semibold mb-1">Membros</h3>
          <p className="text-sm text-gray-500 dark:text-slate-400 font-medium">Módulo em desenvolvimento</p>
        </div>
        <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl p-6 flex flex-col items-center justify-center text-center h-48 shadow-sm">
          <svg className="w-8 h-8 text-gray-400 dark:text-slate-500 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
          <h3 className="text-gray-900 dark:text-white font-semibold mb-1">Financeiro</h3>
          <p className="text-sm text-gray-500 dark:text-slate-400 font-medium">Módulo em desenvolvimento</p>
        </div>
        <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl p-6 flex flex-col items-center justify-center text-center h-48 shadow-sm">
          <svg className="w-8 h-8 text-gray-400 dark:text-slate-500 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
          <h3 className="text-gray-900 dark:text-white font-semibold mb-1">Eventos</h3>
          <p className="text-sm text-gray-500 dark:text-slate-400 font-medium">Módulo em desenvolvimento</p>
        </div>
      </div>
    </div>
  );
}