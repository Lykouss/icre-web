'use client'

import React, { useState, useTransition, useActionState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { loginUser, requestPasswordReset } from '@/features/core/actions/auth';
import { createClient } from '@/lib/supabase/client';

type View = 'login' | 'forgot';

export default function LoginPage() {
  const [view, setView] = useState<View>('login');

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      {/* Fundo com gradiente sutil */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_#1e3a5f_0%,_transparent_60%)] pointer-events-none" />

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-blue-600 rounded-2xl mb-4 shadow-lg shadow-blue-500/30">
            <Image src="/logo.svg" alt="ICRE" width={32} height={32} className="brightness-0 invert" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            {view === 'login' ? 'Bem-vindo de volta' : 'Recuperar senha'}
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            {view === 'login' ? 'ICRE — Igreja de Cristo Rocha Eterna' : 'Enviaremos um link para seu e-mail'}
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl">
          {view === 'login' ? (
            <LoginForm onForgot={() => setView('forgot')} />
          ) : (
            <ForgotForm onBack={() => setView('login')} />
          )}
        </div>

        <p className="text-center text-slate-500 text-sm mt-6">
          Não tem conta?{' '}
          <Link href="/cadastro" className="text-blue-400 hover:text-blue-300 font-semibold transition-colors">
            Criar conta
          </Link>
        </p>
      </div>
    </div>
  );
}

function LoginForm({ onForgot }: { onForgot: () => void }) {
  const [state, formAction, isPending] = useActionState(loginUser, null);
  const [showPass, setShowPass] = useState(false);
  const [isGooglePending, startGoogleTransition] = useTransition();

  const handleGoogle = () => {
    startGoogleTransition(async () => {
      const supabase = createClient();
      await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${window.location.origin}/auth/callback` },
      });
    });
  };

  const inputClass = 'w-full bg-slate-800 border border-slate-700 text-white placeholder-slate-500 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all';

  return (
    <div className="space-y-5">
      {/* Google */}
      <button
        onClick={handleGoogle}
        disabled={isGooglePending}
        className="w-full flex items-center justify-center gap-3 bg-white text-slate-900 font-semibold py-3 rounded-xl hover:bg-slate-100 transition-colors disabled:opacity-50 text-sm"
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
        </svg>
        {isGooglePending ? 'Aguarde...' : 'Continuar com Google'}
      </button>

      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-slate-700" />
        <span className="text-xs text-slate-500 font-medium">ou</span>
        <div className="flex-1 h-px bg-slate-700" />
      </div>

      <form action={formAction} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wide">E-mail</label>
          <input name="email" type="email" required autoComplete="email" placeholder="seu@email.com" className={inputClass} />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide">Senha</label>
            <button type="button" onClick={onForgot} className="text-xs text-blue-400 hover:text-blue-300 transition-colors">
              Esqueci a senha
            </button>
          </div>
          <div className="relative">
            <input name="password" type={showPass ? 'text' : 'password'} required autoComplete="current-password" placeholder="••••••••" className={`${inputClass} pr-11`} />
            <button type="button" onClick={() => setShowPass(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors">
              {showPass ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
              )}
            </button>
          </div>
        </div>

        {state?.error && (
          <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-4 py-3 rounded-xl">
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            {state.error}
          </div>
        )}

        <button
          type="submit"
          disabled={isPending}
          className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3.5 rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {isPending ? (
            <>
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
              </svg>
              Entrando...
            </>
          ) : 'Entrar'}
        </button>
      </form>
    </div>
  );
}

function ForgotForm({ onBack }: { onBack: () => void }) {
  const [state, formAction, isPending] = useActionState(requestPasswordReset, null);
  const inputClass = 'w-full bg-slate-800 border border-slate-700 text-white placeholder-slate-500 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all';

  if (state?.success) {
    return (
      <div className="text-center py-4 space-y-4">
        <div className="w-14 h-14 bg-green-500/10 rounded-full flex items-center justify-center mx-auto">
          <svg className="w-7 h-7 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <div>
          <p className="text-white font-bold text-lg">Verifique seu e-mail</p>
          <p className="text-slate-400 text-sm mt-1">Se este e-mail estiver cadastrado, você receberá o link em instantes.</p>
        </div>
        <button onClick={onBack} className="text-blue-400 hover:text-blue-300 text-sm font-semibold transition-colors">
          Voltar para o login
        </button>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-5">
      <div>
        <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wide">Seu e-mail</label>
        <input name="email" type="email" required placeholder="seu@email.com" className={inputClass} autoFocus />
      </div>

      {state?.error && (
        <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-4 py-3 rounded-xl">
          <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          {state.error}
        </div>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3.5 rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {isPending ? (
          <>
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
            </svg>
            Enviando...
          </>
        ) : 'Enviar link de recuperação'}
      </button>

      <button type="button" onClick={onBack} className="w-full text-slate-400 hover:text-white text-sm font-medium transition-colors py-1">
        ← Voltar para o login
      </button>
    </form>
  );
}