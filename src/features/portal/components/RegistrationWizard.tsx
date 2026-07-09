'use client'

import React, { useState, useTransition, useRef, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createPublicRegistration } from '@/features/events/actions/registrations';
import type { AsaasPaymentInfo, FormField, CustomFormResponses } from '@/features/events/types';
import { DynamicFormRenderer } from './DynamicFormRenderer';
import { Turnstile } from '@marsidev/react-turnstile';

interface EventData {
  id: string;
  title: string;
  date: string | null;
  time: string | null;
  location: string | null;
  description: string | null;
  rules?: string | null;
  type: string;
  capacity: number | null;
  is_public: boolean;
  status: string;
  ticket_price: number | null;
  requires_registration: boolean;
  requires_payment: boolean;
  banner_url: string | null;
  custom_form_schema?: FormField[] | null;
  terms_text?: string | null;
  accepts_pix?: boolean;
  accepts_boleto?: boolean;
}

interface Props {
  event: EventData;
  spotsLeft: number | null;
  isFull: boolean;
  isAdminPreview?: boolean;
}

function isValidCpfClient(cpf: string): boolean {
  const clean = cpf.replace(/\D/g, '');
  if (clean.length !== 11 || /^(\d)\1{10}$/.test(clean)) return false;
  let sum = 0;
  for (let i = 0; i < 9; i++) sum += parseInt(clean[i]) * (10 - i);
  let r = (sum * 10) % 11; if (r >= 10) r = 0;
  if (r !== parseInt(clean[9])) return false;
  sum = 0;
  for (let i = 0; i < 10; i++) sum += parseInt(clean[i]) * (11 - i);
  r = (sum * 10) % 11; if (r >= 10) r = 0;
  return r === parseInt(clean[10]);
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '';
  const MONTHS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
  const d = new Date(dateStr + 'T12:00:00');
  return `${d.getDate()} de ${MONTHS[d.getMonth()]}. de ${d.getFullYear()}`;
}

type StepId = 'terms' | 'form' | 'custom' | 'summary' | 'success';

export function RegistrationWizard({ event, spotsLeft, isFull, isAdminPreview }: Props) {
  const router = useRouter();
  const isPaid = event.requires_payment && (event.ticket_price ?? 0) > 0;
  const hasCustomForm = !!(event.custom_form_schema && event.custom_form_schema.length > 0);
  
  const stepLabels = isPaid 
    ? (hasCustomForm ? ['Termos', 'Titular', 'Adicionais', 'Resumo', 'Sucesso'] : ['Termos', 'Titular', 'Resumo', 'Sucesso'])
    : (hasCustomForm ? ['Termos', 'Titular', 'Adicionais', 'Sucesso'] : ['Termos', 'Titular', 'Sucesso']);

  const stepIds: StepId[] = isPaid
    ? (hasCustomForm ? ['terms', 'form', 'custom', 'summary', 'success'] : ['terms', 'form', 'summary', 'success'])
    : (hasCustomForm ? ['terms', 'form', 'custom', 'success'] : ['terms', 'form', 'success']);

  const [currentStep, setCurrentStep] = useState(0);
  const [direction, setDirection] = useState<'forward' | 'back'>('forward');
  const [animating, setAnimating] = useState(false);

  const [termsAccepted, setTermsAccepted] = useState(false);
  const initialPaymentMethod = event.accepts_pix !== false ? 'pix' : 'boleto';
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'boleto'>(initialPaymentMethod);
  const [formData, setFormData] = useState({ name: '', email: '', phone: '' });
  const [cpfValue, setCpfValue] = useState('');
  const [cpfError, setCpfError] = useState('');
  const [customResponses, setCustomResponses] = useState<CustomFormResponses>({});
  const [error, setError] = useState('');
  const [isPending, startTransition] = useTransition();
  const [registrationId, setRegistrationId] = useState<string | null>(null);
  const [showProcessingOverlay, setShowProcessingOverlay] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string>('');
  const isSubmittingRef = useRef(false);
  const formRef = useRef<HTMLFormElement>(null);
  
  // Controle de scroll dos termos
  const termsBoxRef = useRef<HTMLDivElement>(null);
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(!event.terms_text);

  const handleTermsScroll = () => {
    if (!termsBoxRef.current || hasScrolledToBottom) return;
    const { scrollTop, scrollHeight, clientHeight } = termsBoxRef.current;
    if (scrollHeight - scrollTop - clientHeight < 10) {
      setHasScrolledToBottom(true);
    }
  };
  
  // Se não houver texto personalizado de termos, libera automático
  useEffect(() => {
    if (!event.terms_text) setHasScrolledToBottom(true);
  }, [event.terms_text]);

  const goTo = useCallback((index: number, dir: 'forward' | 'back') => {
    if (animating) return;
    setDirection(dir);
    setAnimating(true);
    setTimeout(() => {
      setCurrentStep(index);
      setAnimating(false);
    }, 220);
  }, [animating]);

  const nextStep = useCallback(() => {
    if (currentStep < stepIds.length - 1) goTo(currentStep + 1, 'forward');
  }, [currentStep, stepIds.length, goTo]);

  const prevStep = useCallback(() => {
    if (currentStep > 0) goTo(currentStep - 1, 'back');
  }, [currentStep, goTo]);

  const stepId = stepIds[currentStep];
  const formFields: FormField[] = event.custom_form_schema ?? [];

  const handlePersonalDataSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isPaid && cpfValue) {
      if (!isValidCpfClient(cpfValue.replace(/\D/g, ''))) {
        setCpfError('CPF inválido. Verifique os dígitos.');
        return;
      }
    }
    setCpfError('');

    if (hasCustomForm) {
      nextStep();
    } else if (isPaid) {
      nextStep();
    } else {
      executeSubmit();
    }
  };

  const handleCustomFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isPaid) {
      nextStep();
    } else {
      executeSubmit();
    }
  };

  const executeSubmit = () => {
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    setError('');

    const dataToSubmit = new FormData();
    dataToSubmit.set('name', formData.name);
    dataToSubmit.set('email', formData.email);
    dataToSubmit.set('phone', formData.phone);
    if (turnstileToken) dataToSubmit.set('turnstile_token', turnstileToken);
    if (cpfValue) dataToSubmit.set('cpf', cpfValue);
    if (isPaid) dataToSubmit.set('payment_method', paymentMethod);
    if (Object.keys(customResponses).length > 0) {
      dataToSubmit.set('custom_form_responses', JSON.stringify(customResponses));
    }

    setShowProcessingOverlay(true);
    startTransition(async () => {
      try {
        let deviceId = localStorage.getItem('icre_device_id');
        if (!deviceId) {
          deviceId = crypto.randomUUID();
          localStorage.setItem('icre_device_id', deviceId);
        }

        const result = await createPublicRegistration(event.id, dataToSubmit, undefined, deviceId);

        if (result.error) {
          setError(result.error);
          return;
        }

        setRegistrationId(result.registrationId ?? null);

        if (result.paymentInfo && result.registrationId) {
          router.push(`/agenda/${event.id}/pagamento/${result.registrationId}`);
        } else {
          goTo(stepIds.length - 1, 'forward');
        }
      } finally {
        isSubmittingRef.current = false;
        setShowProcessingOverlay(false);
      }
    });
  };

  const inputCls = 'w-full px-4 py-3.5 bg-slate-800/80 border border-white/10 text-white rounded-xl text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/60 focus:border-blue-500/40 transition-all';

  // Stepper completo (sem o "Sucesso")
  const visibleSteps = stepLabels.slice(0, -1);

  return (
    <div className={`min-h-screen bg-slate-950 ${isAdminPreview ? 'pt-10' : ''}`}>
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-blue-700/5 rounded-full blur-[160px]" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[300px] bg-indigo-700/4 rounded-full blur-[100px]" />
      </div>

      <div className="relative max-w-xl mx-auto px-4 pt-24 pb-16">

        {/* Header institucional */}
        <div className="flex items-center gap-3 mb-8">
          <Link
            href={`/agenda/${event.id}`}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-all"
            title="Voltar ao evento"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </Link>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.15em]">ICRE — Portal de Inscrições</p>
            <h1 className="text-sm font-bold text-slate-200 truncate">{event.title}</h1>
          </div>
          {isPaid && (
            <div className="shrink-0 bg-blue-600/10 border border-blue-500/20 rounded-xl px-3 py-1.5">
              <p className="text-xs font-black text-blue-300">{formatCurrency(event.ticket_price!)}</p>
            </div>
          )}
        </div>

        {/* Stepper */}
        {stepId !== 'success' && (
          <div className="bg-slate-900/50 border border-white/6 rounded-2xl p-4 mb-6">
            <div className="flex items-center gap-0">
              {visibleSteps.map((label, i) => {
                const isActive = i === currentStep;
                const isDone = i < currentStep;
                return (
                  <React.Fragment key={label}>
                    <div className="flex flex-col items-center gap-1.5">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black transition-all duration-300 ${
                        isDone ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30' :
                        isActive ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30 ring-2 ring-blue-400/30' :
                        'bg-slate-800 text-slate-500 border border-white/6'
                      }`}>
                        {isDone ? (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                          </svg>
                        ) : i + 1}
                      </div>
                      <span className={`text-[10px] font-bold uppercase tracking-wide transition-colors ${
                        isActive ? 'text-white' : isDone ? 'text-emerald-400' : 'text-slate-600'
                      }`}>{label}</span>
                    </div>
                    {i < visibleSteps.length - 1 && (
                      <div className={`flex-1 h-px mb-5 mx-2 transition-colors duration-500 ${isDone ? 'bg-emerald-500/40' : 'bg-slate-800'}`} />
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        )}

        {/* Card animado */}
        <div
          className="transition-all duration-220"
          style={{
            opacity: animating ? 0 : 1,
            transform: animating
              ? `translateX(${direction === 'forward' ? '16px' : '-16px'})`
              : 'translateX(0)',
          }}
        >
          <div className="bg-slate-900/70 backdrop-blur-xl border border-white/8 rounded-2xl overflow-hidden shadow-2xl shadow-black/40">

            {/* ─── STEP: TERMS ─── */}
            {stepId === 'terms' && (
              <div>
                {/* Header do card */}
                <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/60 border-b border-white/6 px-7 py-5">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-blue-500/15 border border-blue-500/25 rounded-xl flex items-center justify-center shrink-0">
                      <svg className="w-4.5 h-4.5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{width:'18px', height:'18px'}}>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Passo 1 de {visibleSteps.length}</p>
                      <h2 className="text-base font-black text-white">Regras e Termos</h2>
                    </div>
                  </div>
                </div>

                <div className="p-7">
                  {/* Info do evento */}
                  {(event.date || event.location) && (
                    <div className="flex flex-wrap gap-3 mb-5">
                      {event.date && (
                        <div className="flex items-center gap-1.5 text-xs text-slate-400">
                          <svg className="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          {formatDate(event.date)}{event.time ? ` · ${event.time.slice(0,5)}` : ''}
                        </div>
                      )}
                      {event.location && (
                        <div className="flex items-center gap-1.5 text-xs text-slate-400">
                          <svg className="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          </svg>
                          {event.location}
                        </div>
                      )}
                    </div>
                  )}

                  <div 
                    ref={termsBoxRef}
                    onScroll={handleTermsScroll}
                    className="bg-slate-800/60 border border-white/6 rounded-xl p-5 text-sm text-slate-300 leading-relaxed mb-5 max-h-48 overflow-y-auto portal-scroll whitespace-pre-wrap"
                  >
                    {event.terms_text || event.rules || event.description || 'Ao se inscrever, você concorda em comparecer ao evento na data e horário indicados e respeitar todas as orientações da organização.'}
                  </div>

                  <label className={`flex items-start gap-3 cursor-pointer mb-6 group p-3 rounded-xl transition-colors ${!hasScrolledToBottom ? 'opacity-50 cursor-not-allowed' : 'hover:bg-white/3'}`}>
                    <input
                      type="checkbox"
                      checked={termsAccepted}
                      disabled={!hasScrolledToBottom}
                      onChange={e => setTermsAccepted(e.target.checked)}
                      className="mt-0.5 w-4 h-4 text-blue-500 rounded border-slate-600 bg-slate-800 accent-blue-500 shrink-0 disabled:opacity-50"
                    />
                    <span className="text-sm text-slate-300 group-hover:text-white transition-colors leading-snug">
                      Li e aceito as regras e termos deste evento
                    </span>
                  </label>

                  <button
                    onClick={() => { if (termsAccepted) nextStep(); }}
                    disabled={!termsAccepted || !hasScrolledToBottom}
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3.5 rounded-xl transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20"
                  >
                    Continuar
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>
            )}

            {/* ─── STEP: FORM ─── */}
            {stepId === 'form' && (
              <div>
                <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/60 border-b border-white/6 px-7 py-5">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-violet-500/15 border border-violet-500/25 rounded-xl flex items-center justify-center shrink-0">
                      <svg className="w-4.5 h-4.5 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{width:'18px', height:'18px'}}>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-violet-400 uppercase tracking-widest">Passo 2 de {visibleSteps.length}</p>
                      <h2 className="text-base font-black text-white">Dados do Participante</h2>
                    </div>
                  </div>
                </div>

                <div className="p-7">
                  {error && (
                    <div className="flex flex-col gap-2 mb-5">
                      <div className="flex items-start gap-2.5 bg-red-500/8 border border-red-500/20 text-red-400 text-sm px-4 py-3.5 rounded-xl">
                        <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>{error}</span>
                      </div>
                      <Link 
                        href={`/suporte?title=Erro+na+Inscrição&description=${encodeURIComponent(error)}`}
                        className="self-start text-xs font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1.5 px-1 py-1 transition-colors"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zM12 9v2m0 4h.01" />
                        </svg>
                        Reportar problema ao Suporte
                      </Link>
                    </div>
                  )}

                  <form ref={formRef} onSubmit={handlePersonalDataSubmit} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Nome completo *</label>
                      <input 
                        name="name" 
                        type="text" 
                        required 
                        placeholder="Seu nome completo" 
                        className={inputCls} 
                        value={formData.name}
                        onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">E-mail *</label>
                      <input 
                        name="email" 
                        type="email" 
                        required 
                        placeholder="seu@email.com" 
                        className={inputCls} 
                        value={formData.email}
                        onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Telefone *</label>
                      <input 
                        name="phone" 
                        type="tel" 
                        required 
                        placeholder="(XX) XXXXX-XXXX" 
                        className={inputCls} 
                        value={formData.phone}
                        onChange={e => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                      />
                      {isPaid && <p className="text-xs text-amber-400/80 mt-1.5 flex items-center gap-1"><span>⚠️</span> Necessário para eventuais estornos.</p>}
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                        CPF {isPaid ? '*' : <span className="text-slate-600 normal-case font-normal">(opcional)</span>}
                      </label>
                      <input
                        name="cpf"
                        type="text"
                        required={isPaid}
                        placeholder="000.000.000-00"
                        className={inputCls}
                        value={cpfValue}
                        onChange={e => {
                          let v = e.target.value.replace(/\D/g, '');
                          v = v.replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})$/, '$1-$2');
                          setCpfValue(v);
                          setCpfError('');
                        }}
                      />
                      {cpfError && <p className="text-xs text-red-400 mt-1 font-semibold">{cpfError}</p>}
                    </div>

                    {/* Custom fields foram removidos daqui e movidos para o próximo step */}

                    {/* Método de pagamento */}
                    {isPaid && (
                      <div className="pt-1">
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Forma de Pagamento</label>
                        <div className="grid grid-cols-2 gap-3">
                          {/* PIX */}
                          {event.accepts_pix !== false && (
                            <button
                              type="button"
                              onClick={() => setPaymentMethod('pix')}
                              className={`relative flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left ${
                                paymentMethod === 'pix'
                                  ? 'border-blue-500 bg-blue-500/8 shadow-lg shadow-blue-500/10'
                                  : 'border-white/8 hover:border-white/16 bg-slate-800/40'
                              }`}
                            >
                              {paymentMethod === 'pix' && (
                                <div className="absolute top-2 right-2 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                                  <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                                  </svg>
                                </div>
                              )}
                              <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${paymentMethod === 'pix' ? 'bg-blue-500' : 'bg-slate-700'}`}>
                                <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor">
                                  <path d="M11.9999 2L3 7v10l9 5 9-5V7l-9-5zM12 4.236L18.764 8 12 11.764 5.236 8 12 4.236zM4 9.236l7 3.888V19.764L4 15.888V9.236zm9 10.528V13.124l7-3.888v6.652L13 19.764z"/>
                                </svg>
                              </div>
                              <div>
                                <p className={`text-sm font-black ${paymentMethod === 'pix' ? 'text-white' : 'text-slate-300'}`}>PIX</p>
                                <p className="text-[10px] text-slate-500">Aprovação imediata</p>
                              </div>
                            </button>
                          )}

                          {/* Boleto */}
                          {event.accepts_boleto !== false && (
                            <button
                              type="button"
                              onClick={() => setPaymentMethod('boleto')}
                              className={`relative flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left ${
                                paymentMethod === 'boleto'
                                  ? 'border-blue-500 bg-blue-500/8 shadow-lg shadow-blue-500/10'
                                  : 'border-white/8 hover:border-white/16 bg-slate-800/40'
                              }`}
                            >
                              {paymentMethod === 'boleto' && (
                                <div className="absolute top-2 right-2 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                                  <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                                  </svg>
                                </div>
                              )}
                              <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${paymentMethod === 'boleto' ? 'bg-blue-500' : 'bg-slate-700'}`}>
                                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                              </div>
                              <div>
                                <p className={`text-sm font-black ${paymentMethod === 'boleto' ? 'text-white' : 'text-slate-300'}`}>Boleto</p>
                                <p className="text-[10px] text-slate-500">Até 3 dias úteis</p>
                              </div>
                            </button>
                          )}
                        </div>
                      </div>
                    )}

                    {!isPaid && !hasCustomForm && process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY && (
                      <div className="flex justify-center mt-4">
                        <Turnstile
                          siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY}
                          onSuccess={setTurnstileToken}
                        />
                      </div>
                    )}

                    <div className="flex gap-3 pt-2">
                      <button
                        type="button"
                        onClick={prevStep}
                        className="px-5 py-3.5 rounded-xl border border-white/10 text-slate-400 hover:text-white hover:bg-white/5 text-sm font-semibold transition-all"
                      >
                        Voltar
                      </button>
                      <button
                        type="submit"
                        disabled={isPending}
                        className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold py-3.5 rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20"
                      >
                        {isPending ? (
                          <>
                            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                            </svg>
                            Confirmando...
                          </>
                        ) : (!hasCustomForm && isPaid) ? (
                          <>Revisar e Pagar <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" /></svg></>
                        ) : (
                          <>{hasCustomForm ? 'Próximo Passo' : 'Confirmar Inscrição'} <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" /></svg></>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* ─── STEP: CUSTOM FORM (Adicionais) ─── */}
            {stepId === 'custom' && hasCustomForm && (
              <div>
                <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/60 border-b border-white/6 px-7 py-5">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-pink-500/15 border border-pink-500/25 rounded-xl flex items-center justify-center shrink-0">
                      <svg className="w-4.5 h-4.5 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{width:'18px', height:'18px'}}>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-pink-400 uppercase tracking-widest">Passo 3 de {visibleSteps.length}</p>
                      <h2 className="text-base font-black text-white">Dados Adicionais</h2>
                    </div>
                  </div>
                </div>

                <div className="p-7">
                  {error && (
                    <div className="flex flex-col gap-2 mb-5">
                      <div className="flex items-start gap-2.5 bg-red-500/8 border border-red-500/20 text-red-400 text-sm px-4 py-3.5 rounded-xl">
                        <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>{error}</span>
                      </div>
                    </div>
                  )}

                  <form onSubmit={handleCustomFormSubmit} className="space-y-4">
                    <DynamicFormRenderer
                      fields={formFields}
                      responses={customResponses}
                      onChange={(id, val) => setCustomResponses(prev => ({ ...prev, [id]: val }))}
                      inputCls={inputCls}
                    />

                    {!isPaid && process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY && (
                      <div className="flex justify-center mt-4">
                        <Turnstile
                          siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY}
                          onSuccess={setTurnstileToken}
                        />
                      </div>
                    )}

                    <div className="flex gap-3 pt-2">
                      <button
                        type="button"
                        onClick={prevStep}
                        className="px-5 py-3.5 rounded-xl border border-white/10 text-slate-400 hover:text-white hover:bg-white/5 text-sm font-semibold transition-all"
                      >
                        Voltar
                      </button>
                      <button
                        type="submit"
                        disabled={isPending}
                        className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold py-3.5 rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20"
                      >
                        {isPending ? (
                          <>
                            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                            </svg>
                            Confirmando...
                          </>
                        ) : isPaid ? (
                          <>Revisar e Pagar <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" /></svg></>
                        ) : (
                          <>Confirmar Inscrição <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" /></svg></>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* ─── STEP: SUMMARY (Checkout) ─── */}
            {stepId === 'summary' && isPaid && (
              <div>
                <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/60 border-b border-white/6 px-7 py-5">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-emerald-500/15 border border-emerald-500/25 rounded-xl flex items-center justify-center shrink-0">
                      <svg className="w-4.5 h-4.5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{width:'18px', height:'18px'}}>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Passo Final de {visibleSteps.length}</p>
                      <h2 className="text-base font-black text-white">Resumo da Compra</h2>
                    </div>
                  </div>
                </div>

                <div className="p-7">
                  {error && (
                    <div className="flex flex-col gap-2 mb-5">
                      <div className="flex items-start gap-2.5 bg-red-500/8 border border-red-500/20 text-red-400 text-sm px-4 py-3.5 rounded-xl">
                        <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>{error}</span>
                      </div>
                    </div>
                  )}

                  <div className="bg-slate-800/40 border border-white/10 rounded-2xl p-5 mb-6">
                    <div className="flex justify-between items-center mb-4 pb-4 border-b border-white/10">
                      <span className="text-sm font-semibold text-slate-300">Valor da Inscrição (Base)</span>
                      <span className="text-sm font-bold text-white">{formatCurrency(event.ticket_price || 0)}</span>
                    </div>
                    <div className="flex justify-between items-center mb-4 pb-4 border-b border-white/10">
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-slate-300">Taxa de Transação</span>
                        <span className="text-[10px] text-slate-500 mt-0.5">Cobrada pelo Asaas ({paymentMethod === 'pix' ? 'PIX' : 'Boleto'})</span>
                      </div>
                      <span className="text-sm font-bold text-white">{formatCurrency(paymentMethod === 'pix' ? 1.99 : 2.99)}</span>
                    </div>
                    <div className="flex justify-between items-center pt-2">
                      <span className="text-base font-black text-white">Total a Pagar</span>
                      <span className="text-xl font-black text-blue-400">{formatCurrency((event.ticket_price || 0) + (paymentMethod === 'pix' ? 1.99 : 2.99))}</span>
                    </div>
                  </div>

                  {process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY && (
                    <div className="flex justify-center mb-6">
                      <Turnstile
                        siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY}
                        onSuccess={setTurnstileToken}
                      />
                    </div>
                  )}

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={prevStep}
                      className="px-5 py-3.5 rounded-xl border border-white/10 text-slate-400 hover:text-white hover:bg-white/5 text-sm font-semibold transition-all"
                    >
                      Voltar
                    </button>
                    <button
                      type="button"
                      onClick={executeSubmit}
                      disabled={isPending}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3.5 rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
                    >
                      {isPending ? (
                        <>
                          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                          </svg>
                          Gerando cobrança...
                        </>
                      ) : (
                        <>Confirmar e Pagar <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" /></svg></>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ─── STEP: SUCCESS ─── */}
            {stepId === 'success' && (
              <div>
                {/* Header de sucesso */}
                <div className="bg-gradient-to-br from-emerald-900/30 to-slate-900/60 border-b border-emerald-500/15 px-7 py-6 text-center">
                  <div className="relative inline-flex items-center justify-center mb-3">
                    <div className="absolute w-20 h-20 rounded-full bg-emerald-500/10 animate-ping" style={{ animationDuration: '2.5s' }} />
                    <div className="relative w-16 h-16 bg-emerald-500/15 border border-emerald-500/25 rounded-2xl flex items-center justify-center">
                      <svg className="w-8 h-8 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  </div>
                  <h2 className="text-xl font-black text-white">Inscrição Confirmada</h2>
                  <p className="text-emerald-400/80 text-xs font-semibold uppercase tracking-widest mt-1">Registro efetuado com sucesso</p>
                </div>

                <div className="p-7">
                  <p className="text-slate-400 text-sm leading-relaxed mb-6 text-center">
                    Sua presença no evento <span className="text-white font-semibold">{event.title}</span> foi registrada. Te esperamos!
                  </p>

                  <div className="space-y-3">
                    {registrationId && (
                      <Link
                        href={`/comprovante/${registrationId}`}
                        className="flex items-center justify-center gap-2 w-full bg-blue-600 hover:bg-blue-500 text-white font-bold px-6 py-3.5 rounded-xl transition-all shadow-lg shadow-blue-500/20"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                        </svg>
                        Ver Comprovante
                      </Link>
                    )}
                    <Link
                      href="/minhas-inscricoes"
                      className="flex items-center justify-center gap-2 w-full bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-semibold px-6 py-3.5 rounded-xl transition-all border border-white/8"
                    >
                      Minhas Inscrições
                    </Link>
                    <Link
                      href="/agenda"
                      className="block text-center text-slate-500 hover:text-slate-300 text-sm font-medium transition-colors py-1"
                    >
                      Ver outros eventos
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Rodapé */}
        <div className="mt-6 flex items-center justify-center gap-2">
          <div className="w-px h-4 bg-white/10" />
          <p className="text-xs text-slate-600">ICRE · Portal de Eventos · Ambiente Seguro</p>
          <div className="w-px h-4 bg-white/10" />
        </div>
      </div>

      {/* Processing overlay */}
      {showProcessingOverlay && (
        <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-black/85 backdrop-blur-sm">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mb-5 mx-auto shadow-2xl shadow-blue-500/40">
            <svg className="w-8 h-8 text-white animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
            </svg>
          </div>
          <p className="text-white font-bold text-lg">Processando inscrição...</p>
          <p className="text-slate-400 text-sm mt-1">Por favor, não feche esta página.</p>
        </div>
      )}
    </div>
  );
}
