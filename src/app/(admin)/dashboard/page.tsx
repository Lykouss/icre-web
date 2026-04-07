import { getFeatureFlag } from '@/features/core/api/get-feature-flag';
import { getCurrentUser } from '@/features/core/api/get-current-user';
import { MaintenanceScreen } from '@/features/core/components/MaintenanceScreen';
import { FirstAccessTracker } from '@/features/core/components/FirstAccessTracker';

export default async function DashboardPage() {
  const user = await getCurrentUser();
  const flag = await getFeatureFlag('module_dashboard', user);

  if (!flag.isSysAdmin && (!flag.isActive || flag.status === 'manutencao')) {
    return <MaintenanceScreen featureName="Dashboard" />;
  }

  return (
    <div className="p-4 sm:p-8">
      <FirstAccessTracker flagSlug="module_dashboard" userId={user?.id} />
      <h1 className="text-3xl font-bold text-slate-800">Dashboard</h1>
      <p className="mt-4 text-slate-600">
        Bem-vindo ao SIGE-Web! Em breve, os gráficos de membros, finanças e eventos aparecerão aqui.
      </p>
    </div>
  );
}