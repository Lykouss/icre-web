'use client'

import { useActionState } from 'react';
import { verifyPin } from '@/features/core/actions/verify-pin';

export default function PinLockPage() {
  const [state, formAction, isPending] = useActionState(verifyPin, null);

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col items-center justify-center bg-slate-950 absolute top-0 left-0 z-50">

      {/* Glows decorativos */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-600/8 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-indigo-600/8 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-sm mx-4">

        {/* Ícone */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-500/10 border border-blue-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">Acesso Restrito</h1>
          <p className="text-slate-400 text-sm mt-1">Digite seu PIN de segurança para continuar</p>
        </div>

        {/* Card glassmorphism */}
        <div className="bg-slate-900/60 backdrop-blur-xl border border-white/8 rounded-3xl p-8 shadow-2xl shadow-black/40">
          <form action={formAction} className="space-y-6">

            <input
              type="password"
              name="pin"
              maxLength={4}
              pattern="[0-9]*"
              inputMode="numeric"
              required
              autoFocus
              className="w-full text-center tracking-[1em] text-3xl font-mono px-4 py-4 bg-white dark:bg-slate-800/5 border border-white/10 text-white rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500/50 outline-none transition-all placeholder:text-slate-600"
              placeholder="••••"
            />

            {state?.error && (
              <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-4 py-3 rounded-xl">
                <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {state.error}
              </div>
            )}

            <button
              type="submit"
              disabled={isPending}
              className="w-full bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-bold py-3.5 rounded-2xl transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20"
            >
              {isPending ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                  </svg>
                  Verificando...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                  </svg>
                  Desbloquear
                </>
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-slate-600 mt-6">
          ICRE — Sistema de Gestão Eclesiástica
        </p>
      </div>
    </div>
  );
}