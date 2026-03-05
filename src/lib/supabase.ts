import { createBrowserClient } from '@supabase/ssr';

// Criamos o cliente que roda no navegador, mas salva em cookies
// para o servidor conseguir ler depois.
export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    // Garante que funcione no Tablet (HTTP) e Produção (HTTPS)
    cookieOptions: {
      secure: process.env.NODE_ENV === 'production',
    },
  }
);