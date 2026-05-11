'use client'

import React, { useState, useTransition, useRef, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { createPublicRegistration, checkAndUpdatePaymentStatus } from '@/features/events/actions/registrations';
import type { AsaasPaymentInfo, FormField, CustomFormResponses } from '@/features/events/types';
import { DynamicFormRenderer } from './DynamicFormRenderer';

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

type Step = 'terms' | 'form' | 'payment' | 'success';

const WEEKDAYS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
const MONTHS = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T12:00:00');
  return `${WEEKDAYS[d.getDay()]}, ${d.getDate()} de ${MONTHS[d.getMonth()]} de ${d.getFullYear()}`;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

export function PublicEventClient({ event, spotsLeft, isFull, isAdminPreview }: Props) {
  const DRAFT_KEY = `registration_draft_${event.id}`;

  const [step, setStep] = useState<Step>('terms');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'boleto'>('pix');
  const [paymentInfo, setPaymentInfo] = useState<AsaasPaymentInfo | null>(null);
  const [registrationId, setRegistrationId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [isPending, startTransition] = useTransition();
  const [isCheckingPayment, startCheckPayment] = useTransition();
  const [pixCopied, setPixCopied] = useState(false);
  const [showProcessingOverlay, setShowProcessingOverlay] = useState(false);
  const [cpfValue, setCpfValue] = useState('');
  const [cpfError, setCpfError] = useState('');
  const [customResponses, setCustomResponses] = useState<CustomFormResponses>({});
  const [showDraftModal, setShowDraftModal] = useState(false);
  const isSubmittingRef = useRef(false);

  // Draft detection
  useEffect(() => {
    try {
      const draft = localStorage.getItem(DRAFT_KEY);
      if (draft) setShowDraftModal(true);
    } catch { /* ignore */ }
  }, [DRAFT_KEY]);

  const saveDraft = useCallback(() => {
    try { localStorage.setItem(DRAFT_KEY, JSON.stringify({ step, paymentMethod })); } catch { /* ignore */ }
  }, [DRAFT_KEY, step, paymentMethod]);

  const clearDraft = useCallback(() => {
    try { localStorage.removeItem(DRAFT_KEY); } catch { /* ignore */ }
  }, [DRAFT_KEY]);

  // Auto-polling PIX every 10s
  useEffect(() => {
    if (step !== 'payment' || !registrationId || !paymentInfo?.pixQrCode) return;
    const interval = setInterval(async () => {
      const result = await checkAndUpdatePaymentStatus(registrationId);
      if (result.paid) { clearDraft(); setStep('success'); }
    }, 10_000);
    return () => clearInterval(interval);
  }, [step, registrationId, paymentInfo?.pixQrCode, clearDraft]);

  const isPaid = event.requires_payment && (event.ticket_price ?? 0) > 0;
  const needsRegistration = event.requires_registration || isPaid;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // Synchronous lock — prevents double-submit from rapid clicks
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;

    setError('');

    // CPF validation client-side
    if (isPaid && cpfValue) {
      if (!isValidCpfClient(cpfValue.replace(/\D/g, ''))) {
        setCpfError('CPF inválido. Verifique os dígitos.');
        isSubmittingRef.current = false;
        return;
      }
    }
    setCpfError('');

    const formData = new FormData(e.currentTarget);
    if (isPaid) formData.set('payment_method', paymentMethod);
    if (Object.keys(customResponses).length > 0) {
      formData.set('custom_form_responses', JSON.stringify(customResponses));
    }

    setShowProcessingOverlay(true);
    startTransition(async () => {
      try {
        let deviceId = localStorage.getItem('icre_device_id');
        if (!deviceId) {
          deviceId = crypto.randomUUID();
          localStorage.setItem('icre_device_id', deviceId);
        }

        const result = await createPublicRegistration(event.id, formData, undefined, deviceId);

        if (result.error) {
          setError(result.error);
          return;
        }

        setRegistrationId(result.registrationId ?? null);
        clearDraft();

        if (result.paymentInfo) {
          setPaymentInfo(result.paymentInfo);
          setStep('payment');
        } else {
          setStep('success');
        }
      } finally {
        isSubmittingRef.current = false;
        setShowProcessingOverlay(false);
      }
    });
  };

  const handleCheckPayment = () => {
    if (!registrationId) return;

    startCheckPayment(async () => {
      const result = await checkAndUpdatePaymentStatus(registrationId);
      if (result.paid) setStep('success');
      else if (result.error) setError(result.error);
      else setError('Pagamento ainda não confirmado. Aguarde alguns instantes e tente novamente.');
    });
  };

  const copyPix = async () => {
    if (!paymentInfo?.pixCopyPaste) return;
    await navigator.clipboard.writeText(paymentInfo.pixCopyPaste);
    setPixCopied(true);
    setTimeout(() => setPixCopied(false), 3000);
  };

  const inputCls = 'w-full px-4 py-3 bg-slate-800/60 border border-white/10 text-white rounded-2xl text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500/50 transition-all';

  const formFields: FormField[] = event.custom_form_schema ?? [];

  return (
    <div className={`min-h-screen bg-slate-950 ${isAdminPreview ? 'pt-10' : ''}`}>
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-blue-600/8 rounded-full blur-[140px]" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-indigo-600/6 rounded-full blur-[100px]" />
      </div>

      <div className="relative max-w-3xl mx-auto px-4 pt-28 pb-16">
        <Link
          href="/agenda"
          className="inline-flex items-center gap-2 text-slate-400 hover:text-white text-sm font-medium transition-colors mb-8"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Voltar à agenda
        </Link>

        {/* Banner */}
        {event.banner_url && (
          <div className="relative w-full aspect-video rounded-3xl overflow-hidden mb-8 border border-white/8">
            <Image src={event.banner_url} alt={event.title} fill className="object-cover" />
            <div className="absolute inset-0 bg-linear-to-t from-slate-950/60 to-transparent" />
          </div>
        )}

        {/* Header do evento */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <span className={`text-xs font-bold px-3 py-1.5 rounded-full border ${
              event.type === 'culto'
                ? 'bg-blue-500/10 border-blue-500/20 text-blue-400'
                : 'bg-violet-500/10 border-violet-500/20 text-violet-400'
            }`}>
              {event.type === 'culto' ? 'Culto' : 'Evento Especial'}
            </span>
            {isPaid && (
              <span className="text-xs font-bold px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                {formatCurrency(event.ticket_price!)}
              </span>
            )}
          </div>

          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight mb-4">
            {event.title}
          </h1>

          {event.description && (
            <p className="text-slate-400 leading-relaxed text-base">{event.description}</p>
          )}

          <div className="flex flex-wrap gap-5 mt-6">
            {event.date && (
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <div className="w-8 h-8 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-center justify-center shrink-0">
                  <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <span className="font-medium text-slate-200">{formatDate(event.date)}{event.time && ` · ${event.time.slice(0, 5)}`}</span>
              </div>
            )}
            {event.location && (
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <div className="w-8 h-8 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-center justify-center shrink-0">
                  <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  </svg>
                </div>
                <span className="font-medium text-slate-200">{event.location}</span>
              </div>
            )}
            {spotsLeft !== null && (
              <div className="flex items-center gap-2 text-sm">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                  isFull ? 'bg-red-500/10 border border-red-500/20' : 'bg-blue-500/10 border border-blue-500/20'
                }`}>
                  <svg className={`w-4 h-4 ${isFull ? 'text-red-400' : 'text-blue-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <span className={`font-semibold ${isFull ? 'text-red-400' : 'text-slate-200'}`}>
                  {isFull ? 'Evento lotado' : `${spotsLeft} vaga${spotsLeft !== 1 ? 's' : ''} disponível`}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Card de ação */}
        <div className="bg-slate-900/60 backdrop-blur-xl border border-white/8 rounded-3xl overflow-hidden shadow-2xl">

          {/* === STEP: INFO (sem inscrição necessária) === */}
          {!needsRegistration && (
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-blue-500/10 border border-blue-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Evento aberto ao público</h2>
              <p className="text-slate-400 text-sm">
                Não é necessário fazer inscrição. Venha participar!
              </p>
            </div>
          )}

          {/* === STEP: LOTADO === */}
          {isFull && needsRegistration && (
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Evento lotado</h2>
              <p className="text-slate-400 text-sm">Fique de olho nos próximos eventos da nossa agenda.</p>
            </div>
          )}

          {/* === STEP: TERMS === */}
          {needsRegistration && !isFull && step === 'terms' && (
            <div className="p-8">
              <h2 className="text-xl font-bold text-white mb-2">Regras e Termos</h2>
              <p className="text-slate-400 text-sm mb-6">Leia com atenção antes de prosseguir.</p>
              <div className="bg-slate-800/60 border border-white/8 rounded-2xl p-5 text-sm text-slate-300 leading-relaxed mb-6 max-h-48 overflow-y-auto">
                {event.rules || event.description || 'Ao se inscrever, você concorda em comparecer ao evento na data e horário indicados e respeitar todas as orientações da organização.'}
              </div>
              <label className="flex items-start gap-3 cursor-pointer mb-6">
                <input type="checkbox" checked={termsAccepted} onChange={e => setTermsAccepted(e.target.checked)}
                  className="mt-0.5 w-4 h-4 text-blue-500 rounded border-slate-600 bg-slate-800" />
                <span className="text-sm text-slate-300">Li e aceito as regras deste evento</span>
              </label>
              <button
                onClick={() => { if (termsAccepted) { saveDraft(); setStep('form'); } }}
                disabled={!termsAccepted}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-2xl transition-all disabled:opacity-40"
              >
                Avançar
              </button>
            </div>
          )}

          {/* === STEP: FORMULÁRIO === */}
          {needsRegistration && !isFull && step === 'form' && (
            <div className="p-8">
              <h2 className="text-xl font-bold text-white mb-1">Fazer inscrição</h2>
              <p className="text-slate-400 text-sm mb-6">
                {isPaid
                  ? `Garanta sua vaga por ${formatCurrency(event.ticket_price!)} e finalize o pagamento.`
                  : 'Preencha seus dados para confirmar sua presença.'}
              </p>

              {error && (
                <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-4 py-3 rounded-xl mb-5">
                  <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Nome completo *</label>
                  <input name="name" type="text" required placeholder="Seu nome completo" className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">E-mail *</label>
                  <input name="email" type="email" required placeholder="seu@email.com" className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Telefone *</label>
                  <input name="phone" type="tel" required placeholder="(XX) XXXXX-XXXX" className={inputCls} />
                  <p className="text-xs text-red-400 mt-1.5 font-semibold">⚠️ Este número será utilizado caso seja necessário realizar estorno.</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">CPF {isPaid ? '*' : '(opcional)'}</label>
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

                {/* Dynamic form fields */}
                {formFields.length > 0 && (
                  <DynamicFormRenderer
                    fields={formFields}
                    responses={customResponses}
                    onChange={(id, val) => setCustomResponses(prev => ({ ...prev, [id]: val }))}
                    inputCls={inputCls}
                  />
                )}

                {isPaid && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Forma de pagamento</label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('pix')}
                        className={`flex items-center gap-3 p-4 rounded-2xl border-2 transition-all text-left ${
                          paymentMethod === 'pix'
                            ? 'border-blue-500 bg-blue-500/10'
                            : 'border-white/10 hover:border-white/20'
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${paymentMethod === 'pix' ? 'bg-blue-500' : 'bg-slate-700'}`}>
                          <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M11.9999 2L3 7v10l9 5 9-5V7l-9-5zM12 4.236L18.764 8 12 11.764 5.236 8 12 4.236zM4 9.236l7 3.888V19.764L4 15.888V9.236zm9 10.528V13.124l7-3.888v6.652L13 19.764z"/>
                          </svg>
                        </div>
                        <div>
                          <p className={`text-sm font-bold ${paymentMethod === 'pix' ? 'text-white' : 'text-slate-300'}`}>PIX</p>
                          <p className="text-xs text-slate-500">Instantâneo</p>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setPaymentMethod('boleto')}
                        className={`flex items-center gap-3 p-4 rounded-2xl border-2 transition-all text-left ${
                          paymentMethod === 'boleto'
                            ? 'border-blue-500 bg-blue-500/10'
                            : 'border-white/10 hover:border-white/20'
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${paymentMethod === 'boleto' ? 'bg-blue-500' : 'bg-slate-700'}`}>
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <div>
                          <p className={`text-sm font-bold ${paymentMethod === 'boleto' ? 'text-white' : 'text-slate-300'}`}>Boleto</p>
                          <p className="text-xs text-slate-500">Vence em 3 dias</p>
                        </div>
                      </button>
                    </div>
                  </div>
                )}

                <div className="flex gap-3 pt-1">
                  <button type="button" onClick={() => setStep('terms')}
                    className="px-4 py-3 rounded-2xl border border-white/10 text-slate-400 hover:text-white text-sm font-semibold transition-colors">
                    Voltar
                  </button>
                  <button
                    type="submit"
                    disabled={isPending}
                    className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-2xl transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20"
                  >
                    {isPending ? (
                      <><svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" /></svg> {isPaid ? 'Gerando pagamento...' : 'Confirmando...'}</>
                    ) : isPaid ? `Continuar — ${formatCurrency(event.ticket_price!)}` : 'Confirmar inscrição'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* === STEP: PAGAMENTO === */}
          {step === 'payment' && paymentInfo && (
            <div className="p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Finalize o pagamento</h2>
                  <p className="text-sm text-slate-400">{formatCurrency(paymentInfo.value)} · Vence em {new Date(paymentInfo.dueDate).toLocaleDateString('pt-BR')}</p>
                </div>
              </div>

              {/* PIX */}
              {paymentInfo.pixQrCode && (
                <div className="space-y-4 mb-6">
                  <div className="flex justify-center">
                    <div className="bg-white p-4 rounded-2xl">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={`data:image/png;base64,${paymentInfo.pixQrCode}`}
                        alt="QR Code PIX"
                        className="w-48 h-48"
                      />
                    </div>
                  </div>

                  {paymentInfo.pixCopyPaste && (
                    <div>
                      <p className="text-xs text-slate-400 text-center mb-2">Ou use o código PIX Copia e Cola:</p>
                      <button
                        onClick={copyPix}
                        className="w-full flex items-center gap-3 bg-slate-800/60 border border-white/10 hover:border-blue-500/40 px-4 py-3 rounded-xl transition-all group"
                      >
                        <code className="text-xs text-slate-300 flex-1 text-left truncate">
                          {paymentInfo.pixCopyPaste}
                        </code>
                        <div className={`shrink-0 flex items-center gap-1.5 text-xs font-semibold transition-colors ${pixCopied ? 'text-emerald-400' : 'text-slate-400 group-hover:text-blue-400'}`}>
                          {pixCopied ? (
                            <>
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                              </svg>
                              Copiado
                            </>
                          ) : (
                            <>
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                              </svg>
                              Copiar
                            </>
                          )}
                        </div>
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Boleto */}
              {paymentInfo.boletoUrl && (
                <a
                  href={paymentInfo.boletoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full bg-slate-800 hover:bg-slate-700 border border-white/10 text-white font-semibold py-3.5 rounded-xl transition-all mb-4"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Visualizar boleto
                </a>
              )}

              {/* Link alternativo */}
              <a
                href={paymentInfo.invoiceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full text-blue-400 hover:text-blue-300 text-sm font-semibold border border-blue-500/20 hover:border-blue-400/40 py-3 rounded-xl transition-all mb-4"
              >
                Abrir página de pagamento
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>

              {error && (
                <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm px-4 py-3 rounded-xl mb-4">
                  <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  {error}
                </div>
              )}

              <button
                onClick={handleCheckPayment}
                disabled={isCheckingPayment}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-4 rounded-2xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isCheckingPayment ? (
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
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    Já paguei — confirmar
                  </>
                )}
              </button>
            </div>
          )}

          {/* === STEP: SUCESSO === */}
          {step === 'success' && (
            <div className="p-8 text-center">
              <div className="relative inline-flex items-center justify-center mb-6">
                <div className="absolute w-24 h-24 rounded-full bg-emerald-500/10 animate-ping" style={{ animationDuration: '2s' }} />
                <div className="relative w-20 h-20 bg-emerald-500/10 border border-emerald-500/25 rounded-2xl flex items-center justify-center">
                  <svg className="w-10 h-10 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>

              <h2 className="text-2xl font-black text-white mb-2">
                {isPaid ? 'Pagamento confirmado!' : 'Inscrição confirmada!'}
              </h2>
              <p className="text-slate-400 text-sm mb-6 max-w-sm mx-auto">
                {isPaid
                  ? 'Seu pagamento foi confirmado. Seu comprovante está disponível abaixo.'
                  : 'Sua presença foi registrada. Te esperamos!'
                }
              </p>

              <div className="flex flex-col sm:flex-row justify-center items-center gap-3 mb-6">
                {registrationId && isPaid && (
                  <a
                    href={`/comprovante/${registrationId}`}
                    className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold px-6 py-3.5 rounded-2xl transition-all shadow-lg shadow-blue-500/20"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Ver comprovante
                  </a>
                )}

                <Link
                  href="/minhas-inscricoes/comprovantes"
                  className="inline-flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-white text-sm font-semibold px-6 py-3.5 rounded-2xl transition-all border border-white/10"
                >
                  <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                  </svg>
                  Meus Comprovantes
                </Link>
              </div>
              
              <div className="mt-4">
                <Link
                  href="/agenda"
                  className="text-slate-400 hover:text-white text-sm font-medium transition-colors"
                >
                  Ver outros eventos
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Draft resume modal */}
      {showDraftModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 max-w-sm w-full">
            <h3 className="text-white font-bold text-lg mb-2">Inscrição em andamento</h3>
            <p className="text-slate-400 text-sm mb-5">Você tem uma inscrição em andamento. Deseja continuar de onde parou?</p>
            <div className="flex gap-3">
              <button onClick={() => { clearDraft(); setShowDraftModal(false); }} className="flex-1 py-2.5 rounded-xl border border-white/10 text-slate-400 text-sm font-semibold hover:bg-white/5">Começar do zero</button>
              <button onClick={() => { setStep('form'); setShowDraftModal(false); }} className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold">Continuar</button>
            </div>
          </div>
        </div>
      )}

      {/* Immersive payment processing overlay */}
      {showProcessingOverlay && (
        <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="animate-pulse">
            <div className="w-20 h-20 bg-blue-600 rounded-2xl flex items-center justify-center mb-6 mx-auto">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
            </div>
          </div>
          <p className="text-white font-bold text-lg">Processando pagamento em ambiente seguro...</p>
          <p className="text-slate-400 text-sm mt-2">Por favor, aguarde. Não feche esta página.</p>
        </div>
      )}
    </div>
  );
}