'use client'

import { useActionState } from 'react';
import { verifyPin } from '@/features/core/actions/verify-pin';

export default function PinLockPage() {
  const [state, formAction, isPending] = useActionState(verifyPin, null);

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col items-center justify-center bg-slate-50 absolute top-0 left-0 z-50">
      
      <div className="max-w-sm w-full bg-white border border-slate-200 rounded-3xl shadow-xl p-8 text-center mx-4">
        
        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm border border-slate-200">
          <svg className="w-8 h-8 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
          </svg>
        </div>

        <h1 className="text-2xl font-bold text-slate-900 mb-2">Acesso Restrito</h1>
        <p className="text-slate-500 text-sm mb-8">
          Digite seu PIN de segurança para liberar o sistema.
        </p>

        <form action={formAction} className="space-y-6">
          <div>
            <input
              type="password"
              name="pin"
              maxLength={4}
              pattern="[0-9]*"
              inputMode="numeric"
              required
              autoFocus
              className="w-full text-center tracking-[1em] text-4xl font-mono px-4 py-4 bg-slate-50 border border-slate-300 text-slate-900 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder:text-slate-300"
              placeholder="••••"
            />
          </div>

          {state?.error && (
            <div className="p-3 bg-red-50 text-red-600 text-sm rounded-xl border border-red-200">
              {state.error}
            </div>
          )}

          <button
            type="submit"
            disabled={isPending}
            className="w-full bg-slate-900 text-white font-semibold py-4 rounded-xl hover:bg-slate-800 transition-colors disabled:opacity-70 disabled:cursor-not-allowed shadow-md"
          >
            {isPending ? 'Verificando...' : 'Desbloquear'}
          </button>
        </form>

      </div>
    </div>
  );
}