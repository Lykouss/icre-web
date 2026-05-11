'use client'

import React, { useState, useTransition, useRef, useEffect } from 'react';
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
  const [cpf, setCpf] = useState('');

  const isSubmittingRef = useRef(false);

  // Draft recovery
  useEffect(() => {
    const draft = localStorage.getItem(`registration_draft_${eventId}`);
    if (draft) {
      try {
        const parsed = JSON.parse(draft);
        if (parsed.name) setName(parsed.name);
        if (parsed.phone) setPhone(parsed.phone);
        if (parsed.cpf) setCpf(parsed.cpf);
      } catch (e) {
        // Ignore JSON error
      }
    }
  }, [eventId]);

  // Draft saving
  useEffect(() => {
    localStorage.setItem(`registration_draft_${eventId}`, JSON.stringify({ name, phone, cpf }));
  }, [name, phone, cpf, eventId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    
    setError('');

    const formData = new FormData();
    formData.set('name', name);
    formData.set('phone', phone);
    formData.set('cpf', cpf);

    startTransition(async () => {
      try {
        const result = await createRegistration(eventId, formData);
        if (result.error) {
          setError(result.error);
        } else {
          setSuccess(true);
          localStorage.removeItem(`registration_draft_${eventId}`);
        }
      } catch (err) {
        setError('Ocorreu um erro ao processar sua inscrição.');
      } finally {
        isSubmittingRef.current = false;
      }
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
      {/* Immersive loading overlay */}
      {isPending && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center">
          <div className="animate-pulse">
            <div className="w-20 h-20 bg-blue-600 rounded-2xl flex items-center justify-center mb-6 mx-auto">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
            </div>
          </div>
          <p className="text-white font-bold text-lg">Processando pagamento em ambiente seguro...</p>
        </div>
      )}

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
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">CPF *</label>
          <input
            type="text"
            value={cpf}
            onChange={e => setCpf(e.target.value)}
            placeholder="000.000.000-00"
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