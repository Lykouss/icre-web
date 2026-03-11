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

  const onboardingRoutes = ['/termos-admin', '/criar-pin'];
  const isOnboardingRoute = onboardingRoutes.some(r => pathname.startsWith(r));
  const isProtectedRoute = adminRoutes.some(route => pathname.startsWith(route));

  if (isProtectedRoute && !user) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Usuário logado em rota admin — verifica onboarding_step
  if (isProtectedRoute && user && !isOnboardingRoute) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('onboarding_step')
      .eq('id', user.id)
      .single();

    const step = profile?.onboarding_step ?? 'done';

    if (step === 'accept_admin_terms') {
      return NextResponse.redirect(new URL('/termos-admin', request.url));
    }
    if (step === 'create_pin') {
      return NextResponse.redirect(new URL('/criar-pin', request.url));
    }
  }

  const requiresPin = isProtectedRoute && pathname !== '/pin-lock';
  if (requiresPin && !request.cookies.has('admin_unlocked')) {
    return NextResponse.redirect(new URL('/pin-lock', request.url));
  }

  if (pathname === '/login' && user) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return supabaseResponse;
}