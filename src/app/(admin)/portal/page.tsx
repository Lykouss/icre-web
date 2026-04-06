import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/features/core/api/get-current-user';
import { getFeatureFlag } from '@/features/core/api/get-feature-flag';
import { MaintenanceScreen } from '@/features/core/components/MaintenanceScreen';
import { FirstAccessTracker } from '@/features/core/components/FirstAccessTracker';
import { createClient } from '@/lib/supabase/server';
import { SiteEditor } from '@/features/portal/components/SiteEditor';
import type { SiteBlock } from '@/features/portal/types';

export default async function PortalPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const flag = await getFeatureFlag('module_public_site', user);
  if (!flag.isActive || flag.status === 'manutencao') {
    return <MaintenanceScreen featureName="Editor do Site" />;
  }

  const supabase = await createClient();
  const { data } = await supabase
    .from('site_blocks')
    .select('*')
    .order('order_idx')
    .returns<SiteBlock[]>();

  return (
    <div className="h-full">
      <FirstAccessTracker flagSlug="module_public_site" userId={user?.id} />
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Editor do Site</h1>
          <p className="text-sm text-slate-500 mt-0.5">Edite o conteúdo · salve rascunho · publique quando pronto.</p>
        </div>
      </div>
      <SiteEditor blocks={data ?? []} />
    </div>
  );
}