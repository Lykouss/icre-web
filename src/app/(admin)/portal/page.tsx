import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/features/core/api/get-current-user';
import { getFeatureFlag } from '@/features/core/api/get-feature-flag';
import { FeatureMaintenance } from '@/features/core/components/FeatureMaintenance';
import { createClient } from '@/lib/supabase/server';
import { VisualEditor } from '@/features/portal/components/VisualEditor';
import type { SiteBlock } from '@/features/portal/types';

export default async function PortalPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const isActive = await getFeatureFlag('module_portal', user);
  if (!isActive) return <FeatureMaintenance featureName="Gestão do Site Público" />;

  const supabase = await createClient();
  const { data } = await supabase
    .from('site_blocks')
    .select('*')
    .order('order_idx')
    .returns<SiteBlock[]>();

  return (
    <div className="h-full">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Editor do Site</h1>
          <p className="text-sm text-slate-500 mt-0.5">Edite no preview · salve rascunho · publique quando estiver pronto.</p>
        </div>
      </div>
      <VisualEditor initialBlocks={data ?? []} isSysAdmin={user.isSysAdmin} />
    </div>
  );
}