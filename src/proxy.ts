import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  // Chama o nosso motor de segurança
  return await updateSession(request)
}

// O Matcher diz ao Next.js para NÃO rodar o middleware em arquivos estáticos (imagens, css, etc)
// para não deixar o site lento. Ele só roda nas páginas de verdade.
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}