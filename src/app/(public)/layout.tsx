import { createClient } from '@/lib/supabase/server';
import { PublicNavbar } from '@/features/portal/components/PublicNavbar';
import { PublicFooter } from '@/features/portal/components/PublicFooter';
import { AdminPromotionBanner } from '@/features/core/components/AdminPromotionBanner';
import { PendingOnboardingBanner } from '@/features/core/components/PendingOnboardingBanner';
import { PendingPaymentBanner } from '@/features/core/components/PendingPaymentBanner';
import { ToastProvider } from '@/features/core/components/ToastContext';
import { GlobalNotificationListener } from '@/features/core/components/GlobalNotificationListener';
import { GiftNotificationModal } from '@/features/events/components/GiftNotificationModal';

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();

  const [{ data: { user: authUser } }, { data: blocksData }] = await Promise.all([
    supabase.auth.getUser(),
    supabase
      .from('site_blocks')
      .select('type, is_active')
      .eq('is_active', true)
      .order('order_idx'),
  ]);

  let navUser: { fullName: string; photoUrl: string | null; isAdmin: boolean } | null = null;

  let unnotifiedGifts: { id: string; eventName: string; receiptUrl: string }[] = [];

  if (authUser) {
    const [profileRes, roleRes, giftsRes] = await Promise.all([
      supabase.from('profiles').select('full_name, photo_url').eq('id', authUser.id).single(),
      supabase.from('user_roles').select('role').eq('user_id', authUser.id),
      supabase
        .from('event_registrations')
        .select('id, receipt_url, events ( title )')
        .eq('is_gift', true)
        .is('gift_notified_at', null)
        .eq('email', authUser.email)
    ]);
    const roles = roleRes.data?.map(r => r.role) ?? [];
    navUser = {
      fullName: profileRes.data?.full_name ?? 'Usuário',
      photoUrl: profileRes.data?.photo_url ?? null,
      isAdmin:  roles.some(r => ['SYSADMIN', 'CHURCH_ADMIN'].includes(r)),
    };
    
    if (giftsRes.data) {
      unnotifiedGifts = giftsRes.data.map(g => {
        // @ts-ignore - PostgREST type issue
        const eventTitle = Array.isArray(g.events) ? g.events[0]?.title : g.events?.title;
        return {
          id: g.id,
          eventName: eventTitle || 'Evento',
          receiptUrl: g.receipt_url || `/comprovante/${g.id}`
        };
      });
    }
  }

  const activeBlockTypes = (blocksData ?? []).map(b => b.type as string);

  return (
    <ToastProvider>
      <GlobalNotificationListener />
      <GiftNotificationModal gifts={unnotifiedGifts} />
      <AdminPromotionBanner />
      <PendingOnboardingBanner />
      <PendingPaymentBanner />
      <PublicNavbar user={navUser} activeBlockTypes={activeBlockTypes} />
      <div className="pt-0 min-h-screen">{children}</div>
      <PublicFooter />
    </ToastProvider>
  );
}