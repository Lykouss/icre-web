import React from 'react';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/features/core/api/get-current-user';
import { getFeatureFlag } from '@/features/core/api/get-feature-flag';
import { MaintenanceScreen } from '@/features/core/components/MaintenanceScreen';
import { FirstAccessTracker } from '@/features/core/components/FirstAccessTracker';
import { listMediaAssets, getUploadSettings } from '@/features/media/actions/media-actions';
import { MediaAdminClient } from '@/features/media/components/MediaAdminClient';

export default async function MediaAdminPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const flag = await getFeatureFlag('module_media', user);
  if (!flag.isSysAdmin && (!flag.isActive || flag.status === 'manutencao')) {
    return <MaintenanceScreen featureName="Central de Mídias" />;
  }

  // Só Admins e SysAdmins entram
  if (!user.isSysAdmin && !user.roles.includes('CHURCH_ADMIN')) {
    redirect('/dashboard');
  }

  // Fetch data
  const [{ items }, settings] = await Promise.all([
    listMediaAssets(),
    getUploadSettings()
  ]);

  return (
    <>
      <FirstAccessTracker flagSlug="module_media" userId={user.id} />
      <MediaAdminClient 
        initialAssets={items} 
        settings={settings} 
        isSysAdmin={user.isSysAdmin} 
      />
    </>
  );
}
