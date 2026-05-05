import { getFeatureFlag } from '@/features/core/api/get-feature-flag';
import { getCurrentUser } from '@/features/core/api/get-current-user';
import { MaintenanceScreen } from '@/features/core/components/MaintenanceScreen';
import { FirstAccessTracker } from '@/features/core/components/FirstAccessTracker';

export default async function KidsPage() {
  const user = await getCurrentUser();
  const flag = await getFeatureFlag('module_kids', user);

  if (!flag.isSysAdmin && (!flag.isActive || flag.status === 'manutencao')) {
    return <MaintenanceScreen featureName="Kids" />;
  }

  const hasAccess = user?.isSysAdmin || user?.roles.some(r => ['CHURCH_ADMIN'].includes(r));
  if (!hasAccess) {
    const { redirect } = await import('next/navigation');
    redirect('/dashboard');
  }

  return (
    <div className="p-4 sm:p-8">
      <FirstAccessTracker flagSlug="module_kids" userId={user?.id} />
      <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Ministério Kids</h1>
      <p className="mt-4 text-slate-600">Sistema de Check-in seguro das crianças.</p>
    </div>
  );
}