import { getFeatureFlag } from '@/features/core/api/get-feature-flag';
import { getCurrentUser } from '@/features/core/api/get-current-user';
import { MaintenanceScreen } from '@/features/core/components/MaintenanceScreen';
import { FirstAccessTracker } from '@/features/core/components/FirstAccessTracker';
import { createClient } from '@/lib/supabase/server';
import { EventsPageClient } from '@/features/events/components/EventsPageClient';
import type { ChurchEvent } from '@/features/events/types';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { PageHeader } from '@/features/core/components/AdminSidebarShell';

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
      <PageHeader
        title="Eventos e Calendário"
        description="Gerencie cultos, eventos especiais e inscrições da comunidade."
        action={
          <div className="flex items-center gap-2">
            <Link href="/eventos/checkin"
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-[12px] font-bold transition-all"
              style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', color: '#34d399' }}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" /></svg>
              Check-in
            </Link>
            <Link href="/eventos/historico"
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-[12px] font-bold transition-all"
              style={{ background: 'var(--admin-surface-alt)', border: '1px solid var(--admin-border)', color: 'var(--admin-text-secondary)' }}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
              Auditoria
            </Link>
          </div>
        }
      />

      <EventsPageClient
        initialEvents={data ?? []}
        canManage={canManage}
        isSysAdmin={user.isSysAdmin}
      />
    </div>
  );
}