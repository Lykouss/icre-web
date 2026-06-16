import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const type = searchParams.get('type');
  const next = searchParams.get('next') ?? '/';
  const safeNext = next.startsWith('/') && !next.startsWith('//') ? next : '/';

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // Fluxo de recuperação de senha → redirecionar para página de redefinição
      if (type === 'recovery') {
        return NextResponse.redirect(`${origin}/auth/reset-password`);
      }
      return NextResponse.redirect(`${origin}${safeNext}`);
    }
  }

  // Tentativa sem code: pode ser link de recovery com token no hash (Supabase PKCE flow)
  // Neste caso o Supabase SDK trata via onAuthStateChange no cliente
  if (type === 'recovery') {
    return NextResponse.redirect(`${origin}/auth/reset-password`);
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}