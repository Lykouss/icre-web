'use client'

import React, { useState, useTransition } from 'react';
import { createRegistration } from '@/features/events/actions/registrations';

interface PublicRegistrationFormProps {
  eventId: string;
}

export function PublicRegistrationForm({ eventId }: PublicRegistrationFormProps) {
  const [isPending, startTransition] = useTransition();
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const formData = new FormData();
    formData.set('name', name);
    formData.set('phone', phone);

    startTransition(async () => {
      const result = await createRegistration(eventId, formData);
      if (result.error) setError(result.error);
      else setSuccess(true);
    });
  };

  const inputClass = 'w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none text-sm';

  if (success) {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">Inscrição confirmada!</h2>
        <p className="text-slate-500 text-sm">Sua presença foi registrada. Te esperamos!</p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-xl font-bold text-slate-900 mb-1">Fazer inscrição</h2>
      <p className="text-sm text-slate-500 mb-6">Preencha seus dados para garantir sua vaga.</p>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-2xl mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">Nome completo *</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Seu nome"
            required
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">Telefone / WhatsApp</label>
          <input
            type="tel"
            value={phone}
            onChange={e => setPhone(e.target.value)}
            placeholder="(00) 00000-0000"
            className={inputClass}
          />
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="w-full py-3.5 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
        >
          {isPending && (
            <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
            </svg>
          )}
          {isPending ? 'Aguarde...' : 'Confirmar inscrição'}
        </button>
      </form>
    </div>
  );
}