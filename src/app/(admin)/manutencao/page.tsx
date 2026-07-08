import { Metadata } from 'next';
import { MaintenanceClient } from '@/features/admin/components/MaintenanceClient';
import { createClient } from '@/lib/supabase/server';

export const metadata: Metadata = {
  title: 'Manutenção',
};

export default async function MaintenancePage() {
  const supabase = await createClient();
  const { data: maintenance } = await supabase
    .from('site_maintenance')
    .select('*')
    .eq('id', 1)
    .single();

  return (
    <div className="max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold" style={{ color: 'var(--admin-text-primary)' }}>
          Manutenção
        </h1>
        <p className="mt-2 text-sm" style={{ color: 'var(--admin-text-secondary)' }}>
          Controle de acesso, bloqueios e manutenção geral do portal público.
        </p>
      </div>

      <MaintenanceClient initialData={maintenance} />
    </div>
  );
}
