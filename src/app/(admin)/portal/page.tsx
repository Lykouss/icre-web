import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/features/core/api/get-current-user';
import { getFeatureFlag } from '@/features/core/api/get-feature-flag';
import { MaintenanceScreen } from '@/features/core/components/MaintenanceScreen';
import { FirstAccessTracker } from '@/features/core/components/FirstAccessTracker';
import { createClient } from '@/lib/supabase/server';
import { SiteEditor } from '@/features/portal/components/SiteEditor';
import type { SiteBlock, Pastor, PublicCell } from '@/features/portal/types';
import { getNextEventOccurrence } from '@/lib/event-utils';

export default async function PortalPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const flag = await getFeatureFlag('module_public_site', user);
  if (!flag.isSysAdmin && (!flag.isActive || flag.status === 'manutencao')) {
    return <MaintenanceScreen featureName="Editor do Site" />;
  }

  const hasAccess = user?.isSysAdmin || user?.roles.some(r => ['CHURCH_ADMIN'].includes(r));
  if (!hasAccess) {
    redirect('/dashboard');
  }

  const supabase = await createClient();
  const [blocksRes, pastorsRes, cellsRes, eventsRes] = await Promise.all([
    supabase.from('site_blocks').select('*').order('order_idx').returns<SiteBlock[]>(),
    supabase.from('pastors').select('id, name, role, bio, photo_url, instagram_url, sort_order, is_president, spouse_id').eq('is_active', true).order('sort_order'),
    supabase.from('cells').select('id, name, meeting_days, meeting_time, meeting_type, neighborhood, address, description, contact_phone, contact_whatsapp, instagram_url, image_url, leader_photo_url, leader1_id, leader2_id, leader1:leaders!leader1_id(id,name,photo_url,instagram_url), leader2:leaders!leader2_id(id,name,photo_url,instagram_url)').eq('is_active', true).order('name'),
    supabase.from('events').select('id, title, date, time, location, is_recurring, recurrence_rules, type, banner_url, cancelled_dates').eq('is_public', true).eq('status', 'publicado'),
  ]);

  const rawEvents = (eventsRes.data ?? []);
  
  // Compute next dates dynamically
  const computedEvents = rawEvents.map(ev => {
    const { nextDate, isCancelled } = getNextEventOccurrence(ev as any);
    return { ...ev, date: nextDate, isCancelled };
  }).filter(ev => ev.date !== null)
    .sort((a, b) => (a.date as string).localeCompare(b.date as string))
    .slice(0, 6);

  return (
    <div className="h-full">
      <FirstAccessTracker flagSlug="module_public_site" userId={user?.id} />
      <SiteEditor 
        blocks={blocksRes.data ?? []} 
        pastors={(pastorsRes.data ?? []) as Pastor[]}
        cells={(cellsRes.data ?? []) as unknown as PublicCell[]}
        events={computedEvents as any[]}
      />
    </div>
  );
}