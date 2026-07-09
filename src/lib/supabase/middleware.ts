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

  // DEBUG: Rastrear o que está causando o loop
  const rscHeader = request.headers.get('RSC');
  const accept = request.headers.get('accept');
  const isRSC = rscHeader === '1' || accept?.includes('text/x-component');
  console.log(`[MW DEBUG] ${request.method} ${pathname} | user=${!!user} | RSC=${isRSC} | cookies_changed=${supabaseResponse.headers.getSetCookie().length > 0}`);

  const adminRoutes = [
    '/dashboard', '/financeiro', '/membros',
    '/eventos', '/escalas', '/kids',
    '/patrimonio', '/sysadmin', '/portal', '/permissoes',
    '/pin-lock'
  ];

  // Instância admin para consultar tabelas de sistema sem RLS
  const supabaseAdmin = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll() { return [] }, setAll() {} } }
  );

  // 3. Verificação de Manutenção (Redirecionamento Invisível - Rewrite)
  if (pathname !== '/manutencao-screen' && !pathname.startsWith('/api') && !pathname.startsWith('/_next')) {
    const { data: maintenance } = await supabaseAdmin
      .from('site_maintenance')
      .select('is_portal_maintenance, is_sige_maintenance, scheduled_portal, scheduled_sige, auto_activate_scheduled, auto_deactivate_expected, scheduled_at, expected_end_at')
      .eq('id', 1)
      .maybeSingle();

    if (maintenance) {
      const now = new Date();
      let isPortal = maintenance.is_portal_maintenance;
      let isSige = maintenance.is_sige_maintenance;

      // 1. Ativação automática se passou da data de agendamento
      if (maintenance.scheduled_at && maintenance.auto_activate_scheduled) {
        if (new Date(maintenance.scheduled_at) <= now) {
          if (maintenance.scheduled_portal) isPortal = true;
          if (maintenance.scheduled_sige) isSige = true;
        }
      }

      // 2. Desativação automática se passou da previsão de término
      if (maintenance.expected_end_at && maintenance.auto_deactivate_expected) {
        if (new Date(maintenance.expected_end_at) <= now) {
          isPortal = false;
          isSige = false;
        }
      }

      if (isPortal || isSige) {
      let isSysAdmin = false;
      if (user) {
        const { data: roles } = await supabaseAdmin.from('user_roles').select('role').eq('user_id', user.id);
        isSysAdmin = roles?.some(r => r.role === 'SYSADMIN' || r.role === 'CHURCH_ADMIN') || false;
      }

      if (!isSysAdmin) {
        const isSigeRoute = adminRoutes.some(r => pathname.startsWith(r));

        // Se o portal está em manutenção, bloqueia TUDO (portal e sistema)
        if (isPortal) {
          return NextResponse.rewrite(new URL('/manutencao-screen', request.url));
        }
        // Se só o sistema está em manutenção, bloqueia apenas o sistema
        if (isSige && isSigeRoute) {
          return NextResponse.rewrite(new URL('/manutencao-screen', request.url));
        }
        }
      }
    }
  }
  const onboardingRoutes = ['/termos-admin', '/criar-pin', '/admin-onboarding'];
  const isOnboardingRoute = onboardingRoutes.some(r => pathname.startsWith(r));
  const isProtectedRoute  = adminRoutes.some(r => pathname.startsWith(r));

  if (isProtectedRoute && !user) {
    const response = NextResponse.redirect(new URL('/login', request.url));
    supabaseResponse.cookies.getAll().forEach(c => response.cookies.set(c));
    return response;
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
        // Usa RPC SECURITY DEFINER para limpar suspensão expirada
        // (update direto de is_suspended é bloqueado pelo trigger de proteção de campos)
        await supabase.rpc('clear_expired_suspension', { p_user_id: user.id });
      } else {
        const response = NextResponse.redirect(new URL('/acesso-suspenso', request.url));
        supabaseResponse.cookies.getAll().forEach(c => response.cookies.set(c));
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
        const response = NextResponse.redirect(new URL('/admin-onboarding', request.url));
        supabaseResponse.cookies.getAll().forEach(c => response.cookies.set(c));
        return response;
      }
      if (realStep === 'accept_admin_terms') {
        const response = NextResponse.redirect(new URL('/termos-admin', request.url));
        supabaseResponse.cookies.getAll().forEach(c => response.cookies.set(c));
        return response;
      }
      if (realStep === 'create_pin') {
        const response = NextResponse.redirect(new URL('/criar-pin', request.url));
        supabaseResponse.cookies.getAll().forEach(c => response.cookies.set(c));
        return response;
      }
    }
  }

  // PIN lock
  const requiresPin = isProtectedRoute && pathname !== '/pin-lock';
  if (requiresPin && user) {
    const unlockToken = request.cookies.get('admin_unlocked')?.value;
    
    if (!unlockToken) {
      const response = NextResponse.redirect(new URL('/pin-lock', request.url));
      supabaseResponse.cookies.getAll().forEach(c => response.cookies.set(c));
      return response;
    }

    const { verifyPinToken } = await import('@/features/core/utils/pin-token');
    const isValidToken = await verifyPinToken(unlockToken, user.id);

    if (!isValidToken) {
      // Clear invalid cookie
      const response = NextResponse.redirect(new URL('/pin-lock', request.url));
      supabaseResponse.cookies.getAll().forEach(c => response.cookies.set(c));
      response.cookies.delete('admin_unlocked');
      return response;
    }
  }

  if (pathname === '/login' && user) {
    const response = NextResponse.redirect(new URL('/', request.url));
    supabaseResponse.cookies.getAll().forEach(c => response.cookies.set(c));
    return response;
  }

  return supabaseResponse;
}