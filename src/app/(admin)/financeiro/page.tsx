import { getFeatureFlag } from '@/features/core/api/get-feature-flag';
import { getCurrentUser } from '@/features/core/api/get-current-user';
import { FeatureMaintenance } from '@/features/core/components/FeatureMaintenance';

export default async function FinanceiroPage() {
  const user = await getCurrentUser();
  const isActive = await getFeatureFlag('module_finance', user);

  if (!isActive) {
    return <FeatureMaintenance featureName="Módulo Financeiro" />;
  }

  return (
    <div className="p-4 sm:p-8">
      <h1 className="text-3xl font-bold text-slate-800">Painel Financeiro</h1>
      <p className="mt-4 text-slate-600">
        Gestão de dízimos, ofertas e despesas.
      </p>
    </div>
  );
}