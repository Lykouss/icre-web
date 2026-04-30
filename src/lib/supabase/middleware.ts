import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  const { pathname } = request.nextUrl;

  const adminRoutes = [
    '/dashboard', '/financeiro', '/membros',
    '/eventos', '/escalas', '/kids',
    '/patrimonio', '/sysadmin', '/portal', '/permissoes',
    '/pin-lock',
  ];

  const onboardingRoutes = ['/termos-admin', '/criar-pin', '/admin-onboarding'];
  const isOnboardingRoute = onboardingRoutes.some(r => pathname.startsWith(r));
  const isProtectedRoute  = adminRoutes.some(r => pathname.startsWith(r));

  if (isProtectedRoute && !user) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (isProtectedRoute && user && !isOnboardingRoute) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('onboarding_step, is_suspended, suspended_until, admin_profile_completed_at, photo_url, admin_terms_accepted_at, security_pin_hash')
      .eq('id', user.id)
      .single();

    // Suspensão ativa — bloqueia acesso ao sistema
    if (profile?.is_suspended) {
      const until = profile.suspended_until ? new Date(profile.suspended_until) : null;
      const expired = until !== null && until < new Date();

      if (expired) {
        await supabase
          .from('profiles')
          .update({ is_suspended: false, suspended_until: null, suspension_reason: null, suspended_by_name: null })
          .eq('id', user.id);
      } else {
        const response = NextResponse.redirect(new URL('/acesso-suspenso', request.url));
        response.cookies.delete('admin_unlocked');
        return response;
      }
    }

    // Onboarding pendente — verifica campos reais
    const step = profile?.onboarding_step ?? 'done';
    if (step !== 'done') {
      let realStep = step;
      if (!profile?.admin_profile_completed_at) {
        realStep = 'fill_admin_profile';
      } else if (!profile.admin_terms_accepted_at) {
        realStep = 'accept_admin_terms';
      } else if (!profile.security_pin_hash) {
        realStep = 'create_pin';
      } else {
        realStep = 'done';
        await supabase.from('profiles').update({ onboarding_step: 'done' }).eq('id', user.id);
      }

      if (['admin_notification', 'fill_admin_profile', 'upload_photo'].includes(realStep)) {
        return NextResponse.redirect(new URL('/admin-onboarding', request.url));
      }
      if (realStep === 'accept_admin_terms') {
        return NextResponse.redirect(new URL('/termos-admin', request.url));
      }
      if (realStep === 'create_pin') {
        return NextResponse.redirect(new URL('/criar-pin', request.url));
      }
    }
  }

  // PIN lock
  const requiresPin = isProtectedRoute && pathname !== '/pin-lock';
  if (requiresPin && user) {
    const unlockToken = request.cookies.get('admin_unlocked')?.value;
    
    if (!unlockToken) {
      return NextResponse.redirect(new URL('/pin-lock', request.url));
    }

    const { verifyPinToken } = await import('@/features/core/utils/pin-token');
    const isValidToken = await verifyPinToken(unlockToken, user.id);

    if (!isValidToken) {
      // Clear invalid cookie
      const response = NextResponse.redirect(new URL('/pin-lock', request.url));
      response.cookies.delete('admin_unlocked');
      return response;
    }
  }

  if (pathname === '/login' && user) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return supabaseResponse;
}