'use client'

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    // Verificar se há uma sessão ativa (pode ter vindo do link de recovery)
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        setSessionReady(true);
      } else {
        // Escutar evento de PASSWORD_RECOVERY (Supabase envia após trocar o token do hash)
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
          if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') {
            setSessionReady(true);
          }
        });
        return () => subscription.unsubscribe();
      }
      setChecking(false);
    }).finally(() => setChecking(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.');
      return;
    }
    if (password !== confirm) {
      setError('As senhas não coincidem.');
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });

    if (updateError) {
      setError(updateError.message || 'Erro ao atualizar a senha. Tente novamente.');
      setLoading(false);
      return;
    }

    setSuccess(true);
    setTimeout(() => router.push('/minha-conta'), 3000);
  };

  if (checking) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-blue-600/6 rounded-full blur-[140px]" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo/Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-blue-500/10 border border-blue-500/20 rounded-2xl mb-4">
            <svg className="w-7 h-7 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
          </div>
          <h1 className="text-2xl font-black text-white">Redefinir Senha</h1>
          <p className="text-slate-400 text-sm mt-1">
            {sessionReady ? 'Escolha uma nova senha para sua conta.' : 'Link de redefinição inválido ou expirado.'}
          </p>
        </div>

        <div className="bg-slate-900/60 backdrop-blur-xl border border-white/8 rounded-3xl overflow-hidden shadow-2xl">
          {success ? (
            <div className="p-8 text-center">
              <div className="relative inline-flex items-center justify-center mb-6">
                <div className="absolute w-20 h-20 rounded-full bg-emerald-500/10 animate-ping" style={{ animationDuration: '2s' }} />
                <div className="relative w-16 h-16 bg-emerald-500/10 border border-emerald-500/25 rounded-2xl flex items-center justify-center">
                  <svg className="w-8 h-8 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
              <h2 className="text-xl font-black text-white mb-2">Senha atualizada!</h2>
              <p className="text-slate-400 text-sm mb-6">
                Sua senha foi redefinida com sucesso. Redirecionando...
              </p>
              <div className="w-full bg-slate-800 rounded-full h-1 overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full animate-[progress_3s_linear_forwards]" style={{ animation: 'width 3s linear forwards', width: '100%' }} />
              </div>
            </div>
          ) : !sessionReady ? (
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Link expirado</h2>
              <p className="text-slate-400 text-sm mb-6">
                Este link de redefinição é inválido ou já expirou. Solicite um novo.
              </p>
              <Link
                href="/login"
                className="inline-flex items-center justify-center gap-2 w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3.5 rounded-2xl transition-all"
              >
                Voltar ao login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="p-8 space-y-5">
              {error && (
                <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-4 py-3 rounded-xl">
                  <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {error}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">
                  Nova senha
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  required
                  minLength={6}
                  className="w-full px-4 py-3 bg-slate-800/60 border border-white/10 text-white rounded-2xl text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500/50 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">
                  Confirmar nova senha
                </label>
                <input
                  type="password"
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  placeholder="Repita a senha"
                  required
                  minLength={6}
                  className={`w-full px-4 py-3 bg-slate-800/60 border text-white rounded-2xl text-sm placeholder-slate-500 focus:outline-none focus:ring-2 transition-all ${
                    confirm && confirm !== password
                      ? 'border-red-500/50 focus:ring-red-500'
                      : confirm && confirm === password
                      ? 'border-emerald-500/50 focus:ring-emerald-500'
                      : 'border-white/10 focus:ring-blue-500 focus:border-blue-500/50'
                  }`}
                />
                {confirm && confirm !== password && (
                  <p className="text-xs text-red-400 mt-1">As senhas não coincidem.</p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading || !password || !confirm || password !== confirm}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-2xl transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 mt-2"
              >
                {loading ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                    </svg>
                    Atualizando...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    Redefinir senha
                  </>
                )}
              </button>

              <div className="text-center">
                <Link href="/login" className="text-slate-500 hover:text-slate-300 text-sm transition-colors">
                  Voltar ao login
                </Link>
              </div>
            </form>
          )}
        </div>

        <p className="text-center text-xs text-slate-600 mt-6">
          ICRE · Sistema de Gestão Eclesiástica
        </p>
      </div>
    </div>
  );
}
