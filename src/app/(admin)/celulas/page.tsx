import React from 'react';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/features/core/api/get-current-user';
import { getFeatureFlag } from '@/features/core/api/get-feature-flag';
import { createAdminClient } from '@/lib/supabase/admin';
import { MaintenanceScreen } from '@/features/core/components/MaintenanceScreen';
import { FirstAccessTracker } from '@/features/core/components/FirstAccessTracker';
import { CellsAdminClient } from '@/features/cells/components/CellsAdminClient';
import type { Cell, Leader } from '@/features/portal/types';

export default async function CelulasPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const flag = await getFeatureFlag('module_cells', user);
  if (!flag.isSysAdmin && (!flag.isActive || flag.status === 'manutencao')) {
    return <MaintenanceScreen featureName="Células" />;
  }

  const canManage = user.isSysAdmin || user.roles.some(r => ['CHURCH_ADMIN'].includes(r));
  if (!canManage) redirect('/dashboard');

  const admin = await createAdminClient();
  const [cellsRes, leadersRes] = await Promise.all([
    admin
      .from('cells')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false }),
    admin
      .from('leaders')
      .select('*')
      .order('name'),
  ]);

  const cells: Cell[] = (cellsRes.data ?? []) as Cell[];
  const leaders: Leader[] = (leadersRes.data ?? []) as Leader[];

  console.log('[DEBUG celulas/page] cellsRes error:', cellsRes.error);
  console.log('[DEBUG celulas/page] leadersRes error:', leadersRes.error);
  console.log('[DEBUG celulas/page] leaders count:', leaders.length);

  return (
    <>
      <FirstAccessTracker flagSlug="module_cells" userId={user?.id} />
      <CellsAdminClient
        initialCells={cells}
        leaders={leaders}
        canManage={canManage}
        isSysAdmin={user.isSysAdmin}
      />
    </>
  );
}
