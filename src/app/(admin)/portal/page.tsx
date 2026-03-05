import { getFeatureFlag } from '@/features/core/api/get-feature-flag';
import { getCurrentUser } from '@/features/core/api/get-current-user';
import { FeatureMaintenance } from '@/features/core/components/FeatureMaintenance';

export default async function PortalPage() {
  const user = await getCurrentUser();
  const isActive = await getFeatureFlag('module_portal', user);

  if (!isActive) return <FeatureMaintenance featureName="Gestão do Site Público" />;

  return (
    <div className="p-4 sm:p-8">
      <h1 className="text-3xl font-bold text-slate-800">Gestão do Site</h1>
      <p className="mt-4 text-slate-600">
        Aqui você poderá alterar banners, textos, galerias de fotos e informações da ICRE.
      </p>
    </div>
  );
}