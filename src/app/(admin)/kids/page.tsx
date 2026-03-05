import { getFeatureFlag } from '@/features/core/api/get-feature-flag';
import { getCurrentUser } from '@/features/core/api/get-current-user';
import { FeatureMaintenance } from '@/features/core/components/FeatureMaintenance';

export default async function KidsPage() {
  const user = await getCurrentUser();
  const isActive = await getFeatureFlag('module_kids', user);

  if (!isActive) return <FeatureMaintenance featureName="Ministério Infantil (Kids)" />;

  return (
    <div className="p-4 sm:p-8">
      <h1 className="text-3xl font-bold text-slate-800">Ministério Kids</h1>
      <p className="mt-4 text-slate-600">Sistema de Check-in seguro das crianças.</p>
    </div>
  );
}