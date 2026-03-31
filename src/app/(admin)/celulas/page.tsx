import React from 'react';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/features/core/api/get-current-user';
import { getFeatureFlag } from '@/features/core/api/get-feature-flag';
import { createAdminClient } from '@/lib/supabase/admin';
import { FeatureMaintenance } from '@/features/core/components/FeatureMaintenance';
import { CellsAdminClient } from '@/features/cells/components/CellsAdminClient';
import type { Cell } from '@/features/portal/types';

export default async function CelulasPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const isActive = await getFeatureFlag('module_cells', user);
  if (!isActive) return <FeatureMaintenance featureName="Módulo de Células" />;

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
    <CellsAdminClient
      initialCells={cells}
      canManage={canManage}
      isSysAdmin={user.isSysAdmin}
    />
  );
}
