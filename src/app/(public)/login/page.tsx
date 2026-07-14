'use client'

import React, { useState, useActionState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { loginUser, requestPasswordReset } from '@/features/core/actions/auth';
import { Turnstile } from '@marsidev/react-turnstile';

type View = 'login' | 'forgot';

export default function LoginPage() {
  const [view, setView] = useState<View>('login');

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-blue-50/40 to-indigo-50/40 dark:from-slate-950 dark:via-slate-950 dark:to-slate-950 flex items-center justify-center p-4 text-slate-900 dark:text-white">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_#e0f2fe_0%,_transparent_60%)] dark:bg-[radial-gradient(ellipse_at_top,_#1e3a5f_0%,_transparent_60%)] pointer-events-none" />

      <div className="relative w-full max-w-md animate-[fadeSlideUp_0.4s_ease_both]">
        <div className="flex items-center justify-center gap-5 mb-8">
          <Image src="/logo.svg" alt="ICRE" width={56} height={56} className="dark:brightness-0 dark:invert shrink-0" />
          <div className="w-[1.5px] h-14 bg-slate-300 dark:bg-slate-700 rounded-full shrink-0" />
          <div className="text-left">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight leading-tight">
              {view === 'login' ? 'Bem-vindo de volta' : 'Recuperar senha'}
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
              {view === 'login' ? 'ICRE — Igreja de Cristo Rocha Eterna' : 'Enviaremos um link para seu e-mail'}
            </p>
          </div>
        </div>

        <div className="bg-white/60 dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 backdrop-blur-xl rounded-3xl p-8 shadow-2xl">
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

      <style>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

function LoginForm({ onForgot }: { onForgot: () => void }) {
  const [state, formAction, isPending] = useActionState(loginUser, null);
  const [showPass, setShowPass] = useState(false);
  const [token, setToken] = useState<string>('');

  const inputClass =
    'w-full bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 text-slate-900 dark:text-white placeholder-slate-500 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 dark:focus:border-blue-500 transition-all';

  return (
    <div className="space-y-5">
      {/* Google — em breve */}
      <div className="relative group">
        <div className="w-full flex items-center gap-3 bg-white/80 dark:bg-slate-800/40 border border-slate-200/50 dark:border-slate-700/50 rounded-xl px-4 py-3 cursor-not-allowed select-none backdrop-blur-sm">
          <svg className="w-5 h-5 shrink-0 opacity-35" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          <span className="text-sm font-medium text-slate-500 flex-1">Continuar com Google</span>
          <span className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-900/80 border border-amber-500/25 text-amber-400/80 text-[10px] font-semibold px-2.5 py-1 rounded-full">
            <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Em breve
          </span>
        </div>
        <div className="absolute -bottom-9 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none z-10 translate-y-1 group-hover:translate-y-0">
          <div className="bg-white dark:bg-slate-800 shadow-2xl shadow-slate-300/80 dark:shadow-none border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs px-3 py-1.5 rounded-lg whitespace-nowrap">
            Login com Google estará disponível em breve
          </div>
          <div className="w-2 h-2 bg-white dark:bg-slate-800 shadow-2xl shadow-slate-300/80 dark:shadow-none border border-slate-200 dark:border-slate-700 border-r-0 border-b-0 rotate-45 absolute -top-1 left-1/2 -translate-x-1/2" />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-slate-700" />
        <span className="text-xs text-slate-500 font-medium">ou</span>
        <div className="flex-1 h-px bg-slate-700" />
      </div>

      <form action={formAction} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide">
            E-mail
          </label>
          <input
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="seu@email.com"
            className={inputClass}
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Senha</label>
            <button
              type="button"
              onClick={onForgot}
              className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
            >
              Esqueci a senha
            </button>
          </div>
          <div className="relative">
            <input
              name="password"
              type={showPass ? 'text' : 'password'}
              required
              autoComplete="current-password"
              placeholder="••••••••"
              className={`${inputClass} pr-11`}
            />
            <button
              type="button"
              onClick={() => setShowPass(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-600 dark:text-slate-300 transition-colors"
              aria-label={showPass ? 'Ocultar senha' : 'Mostrar senha'}
            >
              {showPass ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {state?.error && (
          <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-4 py-3 rounded-xl">
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {state.error}
          </div>
        )}

        {process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY && (
          <div className="flex justify-center py-2">
            <Turnstile
              siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY}
              onSuccess={setToken}
            />
            <input type="hidden" name="turnstile_token" value={token} />
          </div>
        )}

        <button
          type="submit"
          disabled={isPending}
          className="w-full bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-slate-900 dark:text-white font-bold py-3.5 rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2 mt-1"
        >
          {isPending ? (
            <>
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
              </svg>
              Entrando...
            </>
          ) : (
            'Entrar'
          )}
        </button>
      </form>
    </div>
  );
}

function ForgotForm({ onBack }: { onBack: () => void }) {
  const [state, formAction, isPending] = useActionState(requestPasswordReset, null);
  const [token, setToken] = useState<string>('');

  const inputClass =
    'w-full bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 text-slate-900 dark:text-white placeholder-slate-500 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 dark:focus:border-blue-500 transition-all';

  if (state?.success) {
    return (
      <div className="text-center py-4 space-y-4">
        <div className="w-14 h-14 bg-green-500/10 rounded-full flex items-center justify-center mx-auto">
          <svg className="w-7 h-7 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <div>
          <p className="text-slate-900 dark:text-white font-bold text-lg">Verifique seu e-mail</p>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Se este e-mail estiver cadastrado, você receberá o link em instantes.
          </p>
        </div>
        <button
          onClick={onBack}
          className="text-blue-400 hover:text-blue-300 text-sm font-semibold transition-colors"
        >
          Voltar para o login
        </button>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-5">
      <div>
        <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide">
          Seu e-mail
        </label>
        <input
          name="email"
          type="email"
          required
          placeholder="seu@email.com"
          className={inputClass}
          autoFocus
        />
      </div>

      {state?.error && (
        <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-4 py-3 rounded-xl">
          <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {state.error}
        </div>
      )}

      {process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY && (
        <div className="flex justify-center py-2">
          <Turnstile
            siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY}
            onSuccess={setToken}
          />
          <input type="hidden" name="turnstile_token" value={token} />
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
        ) : (
          'Enviar link de recuperação'
        )}
      </button>

      <button
        type="button"
        onClick={onBack}
        className="w-full text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:text-white text-sm font-medium transition-colors py-1"
      >
        ← Voltar para o login
      </button>
    </form>
  );
}