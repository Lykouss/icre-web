import { getFeatureFlag } from '@/features/core/api/get-feature-flag';
import { getCurrentUser } from '@/features/core/api/get-current-user';
import { MaintenanceScreen } from '@/features/core/components/MaintenanceScreen';
import { FirstAccessTracker } from '@/features/core/components/FirstAccessTracker';
import { createClient } from '@/lib/supabase/server';
import { EventsPageClient } from '@/features/events/components/EventsPageClient';
import type { ChurchEvent } from '@/features/events/types';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ClipboardListIcon, ScanLineIcon } from 'lucide-react';

export default async function EventosPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const flag = await getFeatureFlag('module_events', user);
  if (!flag.isSysAdmin && (!flag.isActive || flag.status === 'manutencao')) {
    return <MaintenanceScreen featureName="Eventos" />;
  }

  const supabase = await createClient();

  const hasAccess = user.isSysAdmin || user.roles.some(r => ['CHURCH_ADMIN'].includes(r));
  if (!hasAccess) redirect('/dashboard');

  const { data, error } = await supabase
    .from('events')
    .select('id, title, type, date, time, location, description, is_recurring, recurrence_rules, cancelled_dates, capacity, is_public, requires_registration, requires_payment, ticket_price, status, banner_url, publish_at, expires_at, created_at')
    .order('date', { ascending: false })
    .returns<ChurchEvent[]>();

  if (error) console.error('[EventosPage]', error.message);

  const canManage = hasAccess;

  return (
    <div className="max-w-7xl mx-auto">
      <FirstAccessTracker flagSlug="module_events" userId={user?.id} />
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Eventos e Calendário</h1>
          <p className="text-slate-500 mt-1">Gerencie cultos, eventos especiais e inscrições.</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/eventos/checkin"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 transition-all"
          >
            <ScanLineIcon className="w-4 h-4" />
            Check-in
          </Link>
          <Link
            href="/eventos/historico"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-slate-700 bg-slate-100 border border-slate-200 hover:bg-slate-200 transition-all"
          >
            <ClipboardListIcon className="w-4 h-4" />
            Auditoria
          </Link>
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