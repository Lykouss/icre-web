import React from 'react';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/features/core/api/get-current-user';
import { getFeatureFlag } from '@/features/core/api/get-feature-flag';
import { createAdminClient } from '@/lib/supabase/admin';
import { MaintenanceScreen } from '@/features/core/components/MaintenanceScreen';
import { FirstAccessTracker } from '@/features/core/components/FirstAccessTracker';
import { PageHeader } from '@/features/core/components/AdminSidebarShell';
import { PastoresAdminClient } from '@/features/pastores/components/PastoresAdminClient';
import type { Pastor } from '@/features/portal/types';

export default async function PastoresPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const flag = await getFeatureFlag('module_pastors', user);
  if (!flag.isSysAdmin && (!flag.isActive || flag.status === 'manutencao')) {
    return <MaintenanceScreen featureName="Pastores" />;
  }

  const canManage = user.isSysAdmin || user.roles.some(r => ['CHURCH_ADMIN'].includes(r));
  if (!canManage) redirect('/dashboard');

  // Admin client bypasses RLS to show all pastors (including inactive)
  const admin = await createAdminClient();
  const { data } = await admin
    .from('pastors')
    .select('id, name, role, bio, photo_url, instagram_url, sort_order, is_active')
    .order('sort_order', { ascending: true })
    .order('name', { ascending: true });

  const pastors: Pastor[] = (data ?? []) as Pastor[];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <FirstAccessTracker flagSlug="module_pastors" userId={user?.id} />
      <PageHeader
        title="Pastores"
        description="Gerencie os pastores exibidos na seção de pastores do portal."
      />
      <PastoresAdminClient
        initialPastors={pastors}
        canManage={canManage}
        isSysAdmin={user.isSysAdmin}
      />
    </div>
  );
}
