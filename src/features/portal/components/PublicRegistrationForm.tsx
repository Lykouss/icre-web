'use client'

import React, { useState, useTransition, useEffect, useRef } from 'react';
import { createRegistration } from '@/features/events/actions/registrations';
import { Loader2 } from 'lucide-react';

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

  // Prevenção estrita contra Race Conditions
  const isSubmittingRef = useRef(false);

  // Funcionalidade de Rascunho
  useEffect(() => {
    const draftKey = `registration_draft_${eventId}`;
    const savedDraft = localStorage.getItem(draftKey);

    if (savedDraft) {
      try {
        const parsed = JSON.parse(savedDraft);
        if (parsed.name) setName(parsed.name);
        if (parsed.phone) setPhone(parsed.phone);
        if (parsed.cpf) setCpf(parsed.cpf);
      } catch (e) {
        // Ignora JSON quebrado
      }
    }
  }, [eventId]);

  useEffect(() => {
    const draftKey = `registration_draft_${eventId}`;
    localStorage.setItem(draftKey, JSON.stringify({ name, phone, cpf }));
  }, [name, phone, cpf, eventId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;

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
          localStorage.removeItem(`registration_draft_${eventId}`); // Limpa rascunho ao finalizar
        }
      } catch (err) {
        setError('Ocorreu um erro inesperado.');
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
    <div className="relative">
      {/* Tela de Carregamento Imersiva */}
      {isPending && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center">
          <Loader2 className="w-12 h-12 text-white animate-spin mb-4" />
          <p className="text-white font-bold tracking-wide">Processando pagamento em ambiente seguro...</p>
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
          Confirmar inscrição
        </button>
      </form>
    </div>
  );
}