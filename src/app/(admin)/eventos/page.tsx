import { redirect } from 'next/navigation';
import { getFeatureFlag } from '@/features/core/api/get-feature-flag';
import { getCurrentUser } from '@/features/core/api/get-current-user';
import { FeatureMaintenance } from '@/features/core/components/FeatureMaintenance';
import { createClient } from '@/lib/supabase/server';
import { EventsPageClient } from '@/features/events/components/EventsPageClient';
import type { ChurchEvent } from '@/features/events/types';

export default async function EventosPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const isActive = await getFeatureFlag('module_events', user);
  if (!isActive) return <FeatureMaintenance featureName="Eventos e Calendário" />;

  const supabase = await createClient();

  const { data, error } = await supabase
    .from('events')
    .select('id, title, type, date, time, location, description, is_recurring, recurrence_rules, cancelled_dates, capacity, is_public, requires_registration, requires_payment, ticket_price, status, banner_url, publish_at, expires_at, created_at')
    .order('date', { ascending: false })
    .returns<ChurchEvent[]>();

  if (error) console.error('[EventosPage]', error.message);

  const canManage = user.roles.some(r => ['SYSADMIN', 'CHURCH_ADMIN'].includes(r));

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Eventos e Calendário</h1>
          <p className="text-slate-500 mt-1">Gerencie cultos, eventos especiais e inscrições.</p>
        </div>
      </div>

      <EventsPageClient
        initialEvents={data ?? []}
        canManage={canManage}
        isSysAdmin={user.isSysAdmin}
      />
    </div>
  );
}