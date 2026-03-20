'use client'

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export function AdminPromotionBanner() {
  const [show, setShow]       = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    let userId: string | null = null;

    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      userId = user.id;

      const { data } = await supabase
        .from('profiles')
        .select('onboarding_step')
        .eq('id', user.id)
        .single();

      if (data?.onboarding_step === 'admin_notification') setShow(true);
    };

    init();

    // Detecta concessão de cargo em tempo real
    const channel = supabase
      .channel('admin_promotion_watch')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'profiles' },
        payload => {
          if (
            payload.new.id === userId &&
            payload.new.onboarding_step === 'admin_notification'
          ) {
            setShow(true);
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const handleProceed = async () => {
  setLoading(true);
  setShow(false);

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { data: profile } = await supabase
      .from('profiles')
      .select('admin_profile_completed_at, photo_url, admin_terms_accepted_at, security_pin_hash')
      .eq('id', user.id)
      .single();

    // Detecta próxima etapa pendente
    let nextStep = 'fill_admin_profile';
    let nextPath = '/admin-onboarding';

    if (profile?.admin_profile_completed_at) {
      if (!profile.photo_url) {
        nextStep = 'upload_photo';
        nextPath = '/admin-onboarding/foto';
      } else if (!profile.admin_terms_accepted_at) {
        nextStep = 'accept_admin_terms';
        nextPath = '/termos-admin';
      } else if (!profile.security_pin_hash) {
        nextStep = 'create_pin';
        nextPath = '/criar-pin';
      } else {
        // Tudo completo — só atualiza o step e vai para o dashboard
        nextStep = 'done';
        nextPath = '/dashboard';
      }
    }

    await supabase
      .from('profiles')
      .update({ onboarding_step: nextStep })
      .eq('id', user.id);

    router.push(nextPath);
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-md" />

      <div className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-white/10 bg-slate-900/80 backdrop-blur-xl shadow-2xl shadow-black/50">

        {/* Glows decorativos */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-64 h-64 bg-violet-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 right-0 w-48 h-48 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="relative px-8 pt-10 pb-6 text-center border-b border-white/8">
          <div className="w-16 h-16 bg-violet-500/15 border border-violet-500/30 rounded-2xl flex items-center justify-center mx-auto mb-5">
            <svg className="w-8 h-8 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>

          <div className="inline-flex items-center gap-2 bg-violet-500/10 border border-violet-500/20 text-violet-400 text-xs font-bold tracking-widest uppercase px-4 py-1.5 rounded-full mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
            Novo cargo atribuído
          </div>

          <h2 className="text-2xl font-black text-white mb-2">Você é um Administrador</h2>
          <p className="text-slate-400 text-sm leading-relaxed">
            A liderança da ICRE concedeu a você um cargo administrativo no sistema SIGE-Web.
          </p>
        </div>

        {/* Corpo */}
        <div className="relative px-8 py-6 space-y-5">
          <p className="text-slate-300 text-sm font-semibold">Antes de acessar o sistema:</p>

          <ul className="space-y-3">
            {[
                { n: '1', text: 'Preencher um formulário com seus dados completos para identificação administrativa' },
                { n: '2', text: 'Enviar uma foto de perfil obrigatória para o sistema' },
                { n: '3', text: 'Ler e aceitar os Termos de Responsabilidade do Administrador' },
                { n: '4', text: 'Criar um PIN de segurança pessoal para proteger o acesso' },
            ].map(item => (
              <li key={item.n} className="flex items-start gap-3 text-sm text-slate-400">
                <span className="w-6 h-6 bg-white/5 border border-white/10 text-violet-400 rounded-lg flex items-center justify-center text-xs font-black shrink-0 mt-0.5">
                  {item.n}
                </span>
                {item.text}
              </li>
            ))}
          </ul>

          <div className="bg-amber-500/8 border border-amber-500/20 rounded-2xl p-4 text-xs text-amber-300/80 leading-relaxed">
            <strong className="text-amber-300">Atenção:</strong> Todas as suas ações são registradas em log de auditoria. O uso indevido de dados de membros ou finanças viola os termos e pode ter consequências disciplinares.
          </div>

          <button
            onClick={handleProceed}
            disabled={loading}
            className="w-full bg-violet-600 hover:bg-violet-500 active:bg-violet-700 text-white font-bold py-3.5 rounded-2xl transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-violet-500/20"
          >
            {loading ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                </svg>
                Aguarde...
              </>
            ) : (
              <>
                Entender minhas responsabilidades
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}