import React from 'react';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/features/core/api/get-current-user';
import { getFeatureFlag } from '@/features/core/api/get-feature-flag';
import { createAdminClient } from '@/lib/supabase/admin';
import { FeatureMaintenance } from '@/features/core/components/FeatureMaintenance';
import { PastoresAdminClient } from '@/features/pastores/components/PastoresAdminClient';
import type { Pastor } from '@/features/portal/types';

export default async function PastoresPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const isActive = await getFeatureFlag('module_pastors', user);
  if (!isActive) return <FeatureMaintenance featureName="Módulo de Liderança" />;

  const canManage = user.isSysAdmin || user.roles.some(r => ['CHURCH_ADMIN'].includes(r));

  // Admin client bypasses RLS to show all pastors (including inactive)
  const admin = await createAdminClient();
  const { data } = await admin
    .from('pastors')
    .select('id, name, role, bio, photo_url, sort_order, is_active')
    .order('sort_order', { ascending: true })
    .order('name', { ascending: true });

  const pastors: Pastor[] = (data ?? []) as Pastor[];

  return (
    <PastoresAdminClient
      initialPastors={pastors}
      canManage={canManage}
      isSysAdmin={user.isSysAdmin}
    />
  );
}
