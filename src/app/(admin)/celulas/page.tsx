import React from 'react';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/features/core/api/get-current-user';
import { getFeatureFlag } from '@/features/core/api/get-feature-flag';
import { createAdminClient } from '@/lib/supabase/admin';
import { MaintenanceScreen } from '@/features/core/components/MaintenanceScreen';
import { FirstAccessTracker } from '@/features/core/components/FirstAccessTracker';
import { CellsAdminClient } from '@/features/cells/components/CellsAdminClient';
import type { Cell } from '@/features/portal/types';

export default async function CelulasPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const flag = await getFeatureFlag('module_cells', user);
  if (!flag.isActive || flag.status === 'manutencao') {
    return <MaintenanceScreen featureName="Células" />;
  }

  const canManage = user.isSysAdmin || user.roles.some(r => ['CHURCH_ADMIN'].includes(r));

  // Use admin client to bypass RLS and see all cells (including inactive)
  const admin = await createAdminClient();
  const { data } = await admin
    .from('cells')
    .select('*')
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false });

  const cells: Cell[] = (data ?? []) as Cell[];

  return (
    <>
      <FirstAccessTracker flagSlug="module_cells" userId={user?.id} />
      <CellsAdminClient
        initialCells={cells}
        canManage={canManage}
        isSysAdmin={user.isSysAdmin}
      />
    </>
  );
}
