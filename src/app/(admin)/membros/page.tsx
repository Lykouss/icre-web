import { getFeatureFlag } from '@/features/core/api/get-feature-flag';
import { getCurrentUser } from '@/features/core/api/get-current-user';
import { MaintenanceScreen } from '@/features/core/components/MaintenanceScreen';
import { FirstAccessTracker } from '@/features/core/components/FirstAccessTracker';
import { createClient } from '@/lib/supabase/server';
import { PageHeader } from '@/features/core/components/AdminSidebarShell';
import { AdminMembersList } from '@/features/members/components/AdminMembersList';
import { AdminMemberRow } from '@/features/members/components/types';
import Link from 'next/link';

export default async function MembrosPage() {
  const user = await getCurrentUser();
  const flag = await getFeatureFlag('module_members', user);

  if (!flag.isSysAdmin && (!flag.isActive || flag.status === 'manutencao')) {
    return <MaintenanceScreen featureName="Membros" />;
  }

  const hasAccess = user?.isSysAdmin || user?.roles.some(r => ['CHURCH_ADMIN'].includes(r));
  if (!hasAccess) {
    const { redirect } = await import('next/navigation');
    redirect('/dashboard');
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from('admin_users_view')
    .select('*')
    .order('full_name')
    .returns<AdminMemberRow[]>();

  if (error) {
    console.error('Erro ao buscar membros na admin_users_view:', JSON.stringify(error, null, 2));
  }

  return (
    <div className="max-w-7xl mx-auto pb-24">
      <FirstAccessTracker flagSlug="module_members" userId={user?.id} />
      
      <PageHeader 
        title="Gestão de Contas e Membros"
        description="Painel de controle de acessos, permissões e contas da plataforma."
        action={
          <Link href="/membros/novo" className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-blue-500/20">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
            Nova Conta
          </Link>
        }
      />

      <div className="mt-8">
        <AdminMembersList initialMembers={data ?? []} />
      </div>
    </div>
  );
}