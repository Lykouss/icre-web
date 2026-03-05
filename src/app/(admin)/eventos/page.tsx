import { getFeatureFlag } from '@/features/core/api/get-feature-flag';
import { getCurrentUser } from '@/features/core/api/get-current-user';
import { FeatureMaintenance } from '@/features/core/components/FeatureMaintenance';

export default async function EventosPage() {
  const user = await getCurrentUser();
  const isActive = await getFeatureFlag('module_events', user);

  if (!isActive) return <FeatureMaintenance featureName="Eventos e Calendário" />;

  return (
    <div className="p-4 sm:p-8">
      <h1 className="text-3xl font-bold text-slate-800">Eventos da Igreja</h1>
      <p className="mt-4 text-slate-600">Calendário oficial e controle de inscrições.</p>
    </div>
  );
}