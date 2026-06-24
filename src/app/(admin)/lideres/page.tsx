import React from 'react';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/features/core/api/get-current-user';
import { getFeatureFlag } from '@/features/core/api/get-feature-flag';
import { createAdminClient } from '@/lib/supabase/admin';
import { MaintenanceScreen } from '@/features/core/components/MaintenanceScreen';
import { FirstAccessTracker } from '@/features/core/components/FirstAccessTracker';
import { LeadersAdminClient } from '@/features/leaders/components/LeadersAdminClient';
import { PageHeader } from '@/features/core/components/AdminSidebarShell';
import type { Leader } from '@/features/leaders/components/LeadersAdminClient';
import type { Cell } from '@/features/portal/types';

export default async function LideresPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const flag = await getFeatureFlag('module_leaders', user);
  if (!flag.isSysAdmin && (!flag.isActive || flag.status === 'manutencao')) {
    return <MaintenanceScreen featureName="Líderes" />;
  }

  const canManage = user.isSysAdmin || user.roles.some(r => ['CHURCH_ADMIN'].includes(r));
  if (!canManage) redirect('/dashboard');

  const admin = await createAdminClient();
  const [leadersRes, cellsRes] = await Promise.all([
    admin
      .from('leaders')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true }),
    admin
      .from('cells')
      .select('id, name, leader1_id, leader2_id')
      .order('name', { ascending: true })
  ]);

  const leaders: Leader[] = (leadersRes.data ?? []) as Leader[];
  const cells = cellsRes.data ?? [];

  return (
    <div className="max-w-7xl mx-auto">
      <FirstAccessTracker flagSlug="module_leaders" userId={user?.id} />
      <PageHeader
        title="Líderes"
        description="Cadastre e gerencie os líderes vinculados às células da congregação."
      />
      <LeadersAdminClient
        initialLeaders={leaders}
        cells={cells}
        canManage={canManage}
        isSysAdmin={user.isSysAdmin}
      />
    </div>
  );
}
