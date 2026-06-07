import { getFeatureFlag } from '@/features/core/api/get-feature-flag';
import { getCurrentUser } from '@/features/core/api/get-current-user';
import { MaintenanceScreen } from '@/features/core/components/MaintenanceScreen';
import { FirstAccessTracker } from '@/features/core/components/FirstAccessTracker';
import { NewMemberModal } from '@/features/members/components/NewMemberModal';
import { MembersTable } from '@/features/members/components/MembersTable';
import { createClient } from '@/lib/supabase/server';
import { PageHeader } from '@/features/core/components/AdminSidebarShell';

export interface MemberRow {
  id: string;
  full_name: string;
  phone: string | null;
  status: string;
  address: string | null;
  cell_name: string | null;
  system_role: string | null;
  is_admin_only: boolean;
}

export default async function MembrosPage() {
  const user = await getCurrentUser();
  const flag = await getFeatureFlag('module_members', user);

  if (!flag.isSysAdmin && (!flag.isActive || flag.status === 'manutencao')) {
    return <MaintenanceScreen featureName="Membros" />;
  }

  const hasAccess = user?.isSysAdmin || user?.roles.some(r => ['CHURCH_ADMIN', 'LEADER'].includes(r));
  if (!hasAccess) {
    const { redirect } = await import('next/navigation');
    redirect('/dashboard');
  }

  const supabase = await createClient();

  const [{ data, error }, { data: cellsData }] = await Promise.all([
    supabase
      .from('members_with_admins')
      .select('id, full_name, phone, status, address, cell_name, system_role, is_admin_only')
      .order('full_name')
      .returns<MemberRow[]>(),
    supabase.from('cells').select('id, name').order('name'),
  ]);

  if (error) {
    console.error('Erro ao buscar membros:', JSON.stringify(error, null, 2));
  }

  return (
    <div className="max-w-7xl mx-auto">
      <FirstAccessTracker flagSlug="module_members" userId={user?.id} />
      
      <PageHeader 
        title="Secretaria e Membros"
        description="Gerencie o registro de todas as pessoas da igreja e visitantes."
        action={<NewMemberModal cells={cellsData ?? []} />}
      />

      <MembersTable initialMembers={data ?? []} />
    </div>
  );
}