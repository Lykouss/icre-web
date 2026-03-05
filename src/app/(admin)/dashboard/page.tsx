import { getFeatureFlag } from '@/features/core/api/get-feature-flag';
import { getCurrentUser } from '@/features/core/api/get-current-user';
import { FeatureMaintenance } from '@/features/core/components/FeatureMaintenance';

export default async function DashboardPage() {
  const user = await getCurrentUser();
  const isActive = await getFeatureFlag('module_dashboard', user);

  if (!isActive) {
    return <FeatureMaintenance featureName="Dashboard Principal" />;
  }

  return (
    <div className="p-4 sm:p-8">
      <h1 className="text-3xl font-bold text-slate-800">Dashboard</h1>
      <p className="mt-4 text-slate-600">
        Em breve, os gráficos de membros, finanças e eventos aparecerão aqui!
      </p>
    </div>
  );
}