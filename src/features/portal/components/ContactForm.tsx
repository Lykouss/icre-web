'use client'

import React, { useState, useTransition } from 'react';
import { sendContactMessage } from '@/features/portal/actions/contact';

export function ContactForm() {
  const [isPending, startTransition] = useTransition();
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const [name, setName]       = useState('');
  const [phone, setPhone]     = useState('');
  const [email, setEmail]     = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const formData = new FormData();
    formData.set('name', name);
    formData.set('phone', phone);
    formData.set('email', email);
    formData.set('message', message);

    startTransition(async () => {
      const result = await sendContactMessage(formData);
      if (result.error) setError(result.error);
      else setSuccess(true);
    });
  };

  const inputClass = 'w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none text-sm transition-colors';

  if (success) {
    return (
      <div className="text-center py-8">
        <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-7 h-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <p className="font-bold text-slate-900 text-lg">Mensagem enviada!</p>
        <p className="text-slate-500 text-sm mt-1">Em breve nossa equipe entrará em contato.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-2xl">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Nome *</label>
        <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Seu nome" required className={inputClass} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">Telefone</label>
          <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="(00) 00000-0000" className={inputClass} />
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">E-mail</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="seu@email.com" className={inputClass} />
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Mensagem *</label>
        <textarea value={message} onChange={e => setMessage(e.target.value)} placeholder="Como podemos te ajudar?" rows={4} required className={inputClass} />
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
        {isPending ? 'Enviando...' : 'Enviar mensagem'}
      </button>
    </form>
  );
}