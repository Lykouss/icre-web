import { getFeatureFlag } from '@/features/core/api/get-feature-flag';
import { getCurrentUser } from '@/features/core/api/get-current-user';
import { MaintenanceScreen } from '@/features/core/components/MaintenanceScreen';
import { FirstAccessTracker } from '@/features/core/components/FirstAccessTracker';

export default async function EscalasPage() {
  const user = await getCurrentUser();
  const flag = await getFeatureFlag('module_volunteers', user);

  if (!flag.isActive || flag.status === 'manutencao') {
    return <MaintenanceScreen featureName="Escalas" />;
  }

  return (
    <div className="p-4 sm:p-8">
      <FirstAccessTracker flagSlug="module_volunteers" userId={user?.id} />
      <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Escalas de Voluntários</h1>
      <p className="mt-4 text-slate-600">Organização de equipes para os cultos.</p>
    </div>
  );
}