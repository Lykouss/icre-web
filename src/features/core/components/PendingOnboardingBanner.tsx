'use client'

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

const STEP_LABELS: Record<string, { label: string; href: string }> = {
  fill_admin_profile: { label: 'Complete seu perfil administrativo',     href: '/admin-onboarding' },
  accept_admin_terms: { label: 'Aceite os Termos de Responsabilidade',   href: '/termos-admin'     },
  create_pin:         { label: 'Crie seu PIN de segurança',              href: '/criar-pin'        },
};

// Rotas onde o banner não deve aparecer (já estão nessas páginas)
const ONBOARDING_ROUTES = ['/admin-onboarding', '/termos-admin', '/criar-pin'];

export function PendingOnboardingBanner() {
  const [step, setStep]   = useState<string | null>(null);
  const pathname          = usePathname();
  const router            = useRouter();

  useEffect(() => {
  const check = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('profiles')
      .select('onboarding_step, admin_profile_completed_at, photo_url, admin_terms_accepted_at, security_pin_hash')
      .eq('id', user.id)
      .single();

    if (!data) return;

    // Verifica se é admin
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .in('role', ['CHURCH_ADMIN', 'FINANCE_ADMIN', 'LEADER', 'SYSADMIN'])
      .limit(1)
      .maybeSingle();

    if (!roleData) return;

    // Detecta etapa pendente pelos campos reais
    let pending: string | null = null;
    if (!data.admin_profile_completed_at) pending = 'fill_admin_profile';
    else if (!data.photo_url)             pending = 'upload_photo';
    else if (!data.admin_terms_accepted_at) pending = 'accept_admin_terms';
    else if (!data.security_pin_hash)     pending = 'create_pin';

    // Só mostra se há etapa pendente E não está nas rotas de onboarding
    if (pending && STEP_LABELS[pending] && !ONBOARDING_ROUTES.some(r => pathname.startsWith(r))) {
      setStep(pending);
    } else {
      setStep(null);
    }
  };

  check();
}, [pathname]); // re-executa a cada mudança de rota

  // Não mostra nas próprias páginas de onboarding
  if (!step || ONBOARDING_ROUTES.some(r => pathname.startsWith(r))) return null;

  const info = STEP_LABELS[step];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 p-4 flex justify-center pointer-events-none">
      <div className="pointer-events-auto flex items-center gap-4 bg-slate-900/90 backdrop-blur-xl border border-violet-500/30 rounded-2xl px-5 py-3.5 shadow-2xl shadow-black/40 max-w-lg w-full">
        {/* Ícone pulsante */}
        <div className="w-8 h-8 bg-violet-500/15 border border-violet-500/30 rounded-xl flex items-center justify-center shrink-0">
          <span className="w-2 h-2 rounded-full bg-violet-400 animate-pulse" />
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-xs text-violet-400 font-bold uppercase tracking-wide">Etapa pendente</p>
          <p className="text-sm text-slate-200 font-medium truncate">{info.label}</p>
        </div>

        <button
          onClick={() => router.push(info.href)}
          className="shrink-0 bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold px-4 py-2 rounded-xl transition-colors"
        >
          Continuar
        </button>
      </div>
    </div>
  );
}