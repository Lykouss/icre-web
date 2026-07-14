import { createClient } from '@/lib/supabase/server';
import { PublicNavbar } from '@/features/portal/components/PublicNavbar';
import { PublicFooter } from '@/features/portal/components/PublicFooter';
import { AdminPromotionBanner } from '@/features/core/components/AdminPromotionBanner';
import { PendingOnboardingBanner } from '@/features/core/components/PendingOnboardingBanner';
import { PendingPaymentBanner } from '@/features/core/components/PendingPaymentBanner';
import { ToastProvider } from '@/features/core/components/ToastContext';
import { GlobalNotificationListener } from '@/features/core/components/GlobalNotificationListener';
import { GiftNotificationModal } from '@/features/events/components/GiftNotificationModal';

import { cookies } from 'next/headers';
import { PublicThemeProvider } from '@/features/portal/components/PublicThemeProvider';

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const cookieStore = await cookies();
  const themeCookie = cookieStore.get('public-theme')?.value;
  let theme: 'light' | 'dark' = (themeCookie === 'light' || themeCookie === 'dark') ? themeCookie : 'dark';

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
      supabase.from('profiles').select('full_name, photo_url, public_theme').eq('id', authUser.id).single(),
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
    
    if (profileRes.data?.public_theme === 'light') theme = 'light';
    
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
    <PublicThemeProvider initialTheme={theme}>
      <ToastProvider>
        <GlobalNotificationListener />
        <GiftNotificationModal gifts={unnotifiedGifts} />
        <AdminPromotionBanner />
        <PendingOnboardingBanner />
        <PendingPaymentBanner />
        <PublicNavbar user={navUser} activeBlockTypes={activeBlockTypes} />
        <div className="pt-0 min-h-screen bg-gradient-to-br from-white via-blue-50/40 to-indigo-50/40 dark:from-slate-950 dark:to-slate-950 dark:bg-slate-950 transition-colors duration-300 relative">
          <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
            {/* Light mode ambient orbs */}
            <div className="absolute top-[-10%] left-[-10%] w-[800px] h-[800px] bg-blue-400/15 rounded-full blur-[140px] dark:hidden" />
            <div className="absolute top-[20%] right-[-10%] w-[600px] h-[600px] bg-indigo-400/10 rounded-full blur-[120px] dark:hidden" />
            <div className="absolute bottom-[-10%] left-[20%] w-[700px] h-[700px] bg-sky-300/15 rounded-full blur-[140px] dark:hidden" />
          </div>
          <div className="relative z-10">
            {children}
          </div>
        </div>
        <PublicFooter />
      </ToastProvider>
    </PublicThemeProvider>
  );
}