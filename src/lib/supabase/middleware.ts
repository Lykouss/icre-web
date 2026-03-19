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
    .select('onboarding_step, admin_profile_completed_at, photo_url, admin_terms_accepted_at, security_pin_hash')
    .eq('id', user.id)
    .single();

  // Verifica se é admin
  const { data: roleData } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .in('role', ['CHURCH_ADMIN', 'FINANCE_ADMIN', 'LEADER', 'SYSADMIN'])
    .limit(1)
    .maybeSingle();

  const isAdminUser = !!roleData;

  if (isAdminUser && profile) {
    // Determina a próxima etapa pendente independente do onboarding_step salvo
    let pendingStep: string | null = null;

    if (!profile.admin_profile_completed_at) pendingStep = 'fill_admin_profile';
    else if (!profile.photo_url)             pendingStep = 'upload_photo';
    else if (!profile.admin_terms_accepted_at) pendingStep = 'accept_admin_terms';
    else if (!profile.security_pin_hash)     pendingStep = 'create_pin';

    if (pendingStep && profile.onboarding_step !== pendingStep) {
      // Sincroniza o onboarding_step com a realidade
      await supabase
        .from('profiles')
        .update({ onboarding_step: pendingStep })
        .eq('id', user.id);
    }

    const step = pendingStep ?? profile.onboarding_step ?? 'done';

    if (step === 'admin_notification') {
      // Deixa passar — o banner cuida disso client-side
    } else if (step === 'fill_admin_profile') {
      return NextResponse.redirect(new URL('/admin-onboarding', request.url));
    } else if (step === 'upload_photo') {
      return NextResponse.redirect(new URL('/admin-onboarding/foto', request.url));
    } else if (step === 'accept_admin_terms') {
      return NextResponse.redirect(new URL('/termos-admin', request.url));
    } else if (step === 'create_pin') {
      return NextResponse.redirect(new URL('/criar-pin', request.url));
    }
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