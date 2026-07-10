'use client'

import React, { useState, useTransition } from 'react';
import { saveAdminPin, completeAdminOnboarding } from '@/features/core/actions/auth';

const PIN_LENGTH = 4;

export default function CreatePinPage() {
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [step, setStep] = useState<'create' | 'confirm'>('create');
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleDigit = (digit: string) => {
    if (step === 'create') {
      if (pin.length >= PIN_LENGTH) return;
      const next = pin + digit;
      setPin(next);
      setError(null);
      if (next.length === PIN_LENGTH) {
        setTimeout(() => setStep('confirm'), 300);
      }
    } else {
      if (confirmPin.length >= PIN_LENGTH) return;
      const next = confirmPin + digit;
      setConfirmPin(next);
      setError(null);
      if (next.length === PIN_LENGTH) {
        handleSave(next);
      }
    }
  };

  const handleDelete = () => {
    if (step === 'create') {
      setPin(p => p.slice(0, -1));
    } else {
      setConfirmPin(p => p.slice(0, -1));
    }
    setError(null);
  };

  const handleSave = (finalConfirm: string) => {
  if (pin !== finalConfirm) {
    setError('Os PINs não coincidem. Tente novamente.');
    setPin('');
    setConfirmPin('');
    setStep('create');
    return;
  }

  startTransition(async () => {
    const saveResult = await saveAdminPin(pin);
    if (saveResult.error) {
      setError(saveResult.error);
      setPin('');
      setConfirmPin('');
      setStep('create');
      return;
    }

    const result = await completeAdminOnboarding();
    if (result?.error) {
      setError(result.error);
    }
  });
};

  const currentPin = step === 'create' ? pin : confirmPin;

  const digits = ['1','2','3','4','5','6','7','8','9','','0','⌫'];

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 flex items-center justify-center pt-24 pb-8 px-4">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_#1e3a5f_0%,_transparent_60%)] pointer-events-none" />

      <div className="relative w-full max-w-sm">
        <div className="bg-slate-50 dark:bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl text-center">

          {/* Ícone */}
          <div className="w-16 h-16 bg-blue-500/10 border border-blue-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>

          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">
            {step === 'create' ? 'Crie seu PIN' : 'Confirme seu PIN'}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mb-8 leading-relaxed">
            {step === 'create'
              ? 'Escolha um PIN de 4 dígitos. Ele será exigido sempre que você acessar o sistema.'
              : 'Digite novamente para confirmar.'}
          </p>

          {/* Indicadores de dígitos */}
          <div className="flex justify-center gap-4 mb-8">
            {Array.from({ length: PIN_LENGTH }).map((_, i) => (
              <div
                key={i}
                className={`w-4 h-4 rounded-full border-2 transition-all duration-200 ${
                  i < currentPin.length
                    ? 'bg-blue-500 border-blue-500 scale-110'
                    : 'bg-transparent border-slate-600'
                }`}
              />
            ))}
          </div>

          {/* Erro */}
          {error && (
            <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-4 py-3 rounded-xl mb-6">
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {error}
            </div>
          )}

          {/* Teclado numérico */}
          <div className="grid grid-cols-3 gap-3">
            {digits.map((d, i) => {
              if (d === '') return <div key={i} />;

              const isDelete = d === '⌫';
              const isLoading = isPending && d === '0';

              return (
                <button
                  key={i}
                  onClick={() => isDelete ? handleDelete() : handleDigit(d)}
                  disabled={isPending}
                  className={`
                    h-16 rounded-2xl font-bold text-xl transition-all active:scale-95
                    ${isDelete
                      ? 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:text-white hover:bg-slate-800 bg-transparent'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-900 dark:text-white border border-slate-700 hover:border-slate-600 shadow-sm'
                    }
                    disabled:opacity-50
                  `}
                >
                  {isPending && !isDelete ? (
                    <svg className="w-5 h-5 animate-spin mx-auto" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                    </svg>
                  ) : d}
                </button>
              );
            })}
          </div>

          {/* Indicador de etapa */}
          <div className="flex justify-center gap-2 mt-8">
            <div className={`h-1.5 w-8 rounded-full transition-all ${step === 'create' ? 'bg-blue-500' : 'bg-slate-700'}`} />
            <div className={`h-1.5 w-8 rounded-full transition-all ${step === 'confirm' ? 'bg-blue-500' : 'bg-slate-700'}`} />
          </div>

          {step === 'confirm' && (
            <button
              onClick={() => { setStep('create'); setPin(''); setConfirmPin(''); setError(null); }}
              className="mt-4 text-xs text-slate-500 hover:text-slate-600 dark:text-slate-300 transition-colors"
            >
              ← Redefinir PIN
            </button>
          )}
        </div>

        <p className="text-center text-xs text-slate-600 mt-6 px-4 leading-relaxed">
          Seu PIN é armazenado de forma segura e nunca pode ser recuperado — apenas redefinido pela liderança.
        </p>
      </div>
    </div>
  );
}