import React from 'react';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/features/core/api/get-current-user';
import { getFeatureFlag } from '@/features/core/api/get-feature-flag';
import { createAdminClient } from '@/lib/supabase/admin';
import { MaintenanceScreen } from '@/features/core/components/MaintenanceScreen';
import { FirstAccessTracker } from '@/features/core/components/FirstAccessTracker';
import { LeadersAdminClient } from '@/features/leaders/components/LeadersAdminClient';
import type { Leader } from '@/features/leaders/components/LeadersAdminClient';

export default async function LideresPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const flag = await getFeatureFlag('module_leaders', user);
  if (!flag.isSysAdmin && (!flag.isActive || flag.status === 'manutencao')) {
    return <MaintenanceScreen featureName="Líderes" />;
  }

  const canManage = user.isSysAdmin || user.roles.some(r => ['CHURCH_ADMIN'].includes(r));

  const admin = await createAdminClient();
  const { data } = await admin
    .from('leaders')
    .select('*')
    .order('sort_order', { ascending: true })
    .order('name', { ascending: true });

  const leaders: Leader[] = (data ?? []) as Leader[];

  return (
    <>
      <FirstAccessTracker flagSlug="module_leaders" userId={user?.id} />
      <LeadersAdminClient
        initialLeaders={leaders}
        canManage={canManage}
        isSysAdmin={user.isSysAdmin}
      />
    </>
  );
}
