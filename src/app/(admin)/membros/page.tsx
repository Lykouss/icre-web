import { getFeatureFlag } from '@/features/core/api/get-feature-flag';
import { getCurrentUser } from '@/features/core/api/get-current-user';
import { MaintenanceScreen } from '@/features/core/components/MaintenanceScreen';
import { FirstAccessTracker } from '@/features/core/components/FirstAccessTracker';
import { NewMemberModal } from '@/features/members/components/NewMemberModal';
import { MembersTable } from '@/features/members/components/MembersTable';
import { createClient } from '@/lib/supabase/server';

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

  if (!flag.isActive || flag.status === 'manutencao') {
    return <MaintenanceScreen featureName="Membros" />;
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Secretaria e Membros</h1>
          <p className="text-slate-500 mt-1">Gerencie o registro de todas as pessoas da igreja e visitantes.</p>
        </div>
        <NewMemberModal cells={cellsData ?? []} />
      </div>

      <MembersTable initialMembers={data ?? []} />
    </div>
  );
}