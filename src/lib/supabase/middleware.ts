import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  // Começamos assumindo que a requisição vai passar
  let supabaseResponse = NextResponse.next({
    request,
  })

  // Criamos o cliente do Supabase específico para o Middleware
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Pegamos o usuário logado de forma segura
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname

  // REGRAS DE ACESSO:
  // Lista de todas as rotas que pertencem ao cofre do sistema
  const adminRoutes = [
    '/dashboard', '/financeiro', '/membros', 
    '/eventos', '/escalas', '/kids', 
    '/patrimonio', '/sysadmin', '/portal', '/permissoes'
  ];

  // Verifica se a URL atual começa com alguma das rotas acima
  const isProtectedRoute = adminRoutes.some(route => pathname.startsWith(route));

  // 1. Regra de Login: Se for protegida e NÃO tiver usuário, manda pro login!
  if (isProtectedRoute && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // 2. NOVA REGRA DO PIN: Se for uma rota protegida E NÃO for a tela do próprio PIN...
  if (isProtectedRoute && pathname !== '/pin-lock') {
    const hasPinCookie = request.cookies.has('admin_unlocked')
    
    if (!hasPinCookie) {
      const url = request.nextUrl.clone()
      url.pathname = '/pin-lock'
      return NextResponse.redirect(url)
    }
  }

  // 3. Regra da Home: Se o usuário JÁ estiver logado e tentar acessar a página de login
  if (pathname === '/login' && user) {
    const url = request.nextUrl.clone()
    url.pathname = '/'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}