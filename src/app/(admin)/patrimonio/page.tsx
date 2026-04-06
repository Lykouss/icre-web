import { getFeatureFlag } from '@/features/core/api/get-feature-flag';
import { getCurrentUser } from '@/features/core/api/get-current-user';
import { MaintenanceScreen } from '@/features/core/components/MaintenanceScreen';
import { FirstAccessTracker } from '@/features/core/components/FirstAccessTracker';

export default async function PatrimonioPage() {
  const user = await getCurrentUser();
  const flag = await getFeatureFlag('module_assets', user);

  if (!flag.isActive || flag.status === 'manutencao') {
    return <MaintenanceScreen featureName="Patrimônio" />;
  }

  return (
    <div className="p-4 sm:p-8">
      <FirstAccessTracker flagSlug="module_assets" userId={user?.id} />
      <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Patrimônio</h1>
      <p className="mt-4 text-slate-600">Controle de equipamentos e bens da ICRE.</p>
    </div>
  );
}