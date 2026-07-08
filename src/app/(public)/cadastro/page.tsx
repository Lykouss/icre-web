'use client'

import React, { useState, useRef, useTransition, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { registerUser } from '@/features/core/actions/auth';
import { useRegisterDraft } from '@/features/core/hooks/use-register-draft';
import { Turnstile } from '@marsidev/react-turnstile';

type StepId = 'name' | 'email' | 'phone' | 'birthdate' | 'address' | 'password' | 'terms';

interface StepConfig {
  id: StepId;
  title: string;
  subtitle: string;
}

const STEPS: StepConfig[] = [
  { id: 'name',      title: 'Como podemos te chamar?',      subtitle: 'Seu nome completo.' },
  { id: 'email',     title: 'Qual o seu e-mail?',            subtitle: 'Usaremos para login e comunicados.' },
  { id: 'phone',     title: 'E seu telefone?',               subtitle: 'WhatsApp preferencial. Opcional.' },
  { id: 'birthdate', title: 'Quando você nasceu?',           subtitle: 'Sua data de nascimento.' },
  { id: 'address',   title: 'Onde você mora?',               subtitle: 'Endereço completo. Opcional.' },
  { id: 'password',  title: 'Crie sua senha',                subtitle: 'Mínimo 8 caracteres, 1 maiúscula, 1 número.' },
  { id: 'terms',     title: 'Termos e Condições',            subtitle: 'Leia e aceite para continuar.' },
];

function StepIllustration({ id }: { id: StepId }) {
  const base = 'w-16 h-16 mx-auto mb-6';
  switch (id) {
    case 'name':
      return (
        <svg className={base} viewBox="0 0 64 64" fill="none">
          <circle cx="32" cy="22" r="12" className="fill-blue-500/20 stroke-blue-400" strokeWidth="1.5" />
          <circle cx="32" cy="22" r="6" className="fill-blue-400/30" />
          <path d="M10 52c0-12.15 9.85-22 22-22s22 9.85 22 22" className="stroke-blue-400" strokeWidth="1.5" strokeLinecap="round" />
          <circle cx="44" cy="18" r="3" className="fill-blue-300/40 stroke-blue-300" strokeWidth="1" />
          <circle cx="20" cy="26" r="2" className="fill-blue-500/40" />
        </svg>
      );
    case 'email':
      return (
        <svg className={base} viewBox="0 0 64 64" fill="none">
          <rect x="8" y="16" width="48" height="34" rx="6" className="fill-blue-500/15 stroke-blue-400" strokeWidth="1.5" />
          <path d="M8 22l24 16 24-16" className="stroke-blue-400" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M8 42l16-12M56 42L40 30" className="stroke-blue-300/40" strokeWidth="1" strokeLinecap="round" />
          <circle cx="49" cy="15" r="5" className="fill-blue-400" />
          <path d="M47 15h4M49 13v4" className="stroke-white" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );
    case 'phone':
      return (
        <svg className={base} viewBox="0 0 64 64" fill="none">
          <rect x="18" y="6" width="28" height="52" rx="6" className="fill-blue-500/15 stroke-blue-400" strokeWidth="1.5" />
          <rect x="24" y="12" width="16" height="10" rx="2" className="fill-blue-400/20" />
          <circle cx="32" cy="50" r="3" className="fill-blue-400/50" />
          <path d="M26 28h12M26 34h8" className="stroke-blue-300/60" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M42 10c4 4 4 10 0 14" className="stroke-blue-300/50" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M46 6c6 6 6 16 0 22" className="stroke-blue-200/30" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );
    case 'birthdate':
      return (
        <svg className={base} viewBox="0 0 64 64" fill="none">
          <rect x="8" y="18" width="48" height="38" rx="6" className="fill-blue-500/15 stroke-blue-400" strokeWidth="1.5" />
          <path d="M8 28h48" className="stroke-blue-400/60" strokeWidth="1.5" />
          <rect x="20" y="10" width="4" height="14" rx="2" className="fill-blue-400" />
          <rect x="40" y="10" width="4" height="14" rx="2" className="fill-blue-400" />
          <circle cx="22" cy="38" r="3" className="fill-blue-400/40" />
          <circle cx="32" cy="38" r="3" className="fill-blue-400" />
          <circle cx="42" cy="38" r="3" className="fill-blue-400/40" />
          <circle cx="22" cy="48" r="3" className="fill-blue-400/40" />
          <circle cx="32" cy="48" r="3" className="fill-blue-400/40" />
        </svg>
      );
    case 'address':
      return (
        <svg className={base} viewBox="0 0 64 64" fill="none">
          <path d="M32 6C22.06 6 14 14.06 14 24c0 14 18 34 18 34s18-20 18-34C50 14.06 41.94 6 32 6z" className="fill-blue-500/15 stroke-blue-400" strokeWidth="1.5" />
          <circle cx="32" cy="24" r="7" className="fill-blue-400/30 stroke-blue-400" strokeWidth="1.5" />
          <circle cx="32" cy="24" r="3" className="fill-blue-400" />
          <path d="M46 52c4 1.5 6 3.5 6 5.5C52 60 43 62 32 62s-20-2-20-4.5c0-2 2-4 6-5.5" className="stroke-blue-300/50" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );
    case 'password':
      return (
        <svg className={base} viewBox="0 0 64 64" fill="none">
          <rect x="12" y="28" width="40" height="28" rx="6" className="fill-blue-500/15 stroke-blue-400" strokeWidth="1.5" />
          <path d="M20 28V22a12 12 0 0124 0v6" className="stroke-blue-400" strokeWidth="1.5" strokeLinecap="round" />
          <circle cx="32" cy="42" r="5" className="fill-blue-400/40 stroke-blue-400" strokeWidth="1.5" />
          <path d="M32 42v5" className="stroke-blue-400" strokeWidth="2" strokeLinecap="round" />
          <circle cx="18" cy="22" r="2" className="fill-blue-300/40" />
          <circle cx="46" cy="22" r="2" className="fill-blue-300/40" />
        </svg>
      );
    case 'terms':
      return (
        <svg className={base} viewBox="0 0 64 64" fill="none">
          <rect x="10" y="6" width="44" height="52" rx="6" className="fill-blue-500/15 stroke-blue-400" strokeWidth="1.5" />
          <path d="M20 20h24M20 28h24M20 36h16" className="stroke-blue-400/60" strokeWidth="1.5" strokeLinecap="round" />
          <circle cx="44" cy="46" r="10" className="fill-slate-900 stroke-emerald-400" strokeWidth="2" />
          <path d="M39 46l3 3 6-6" className="stroke-emerald-400" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
  }
}

function EyeIcon({ open }: { open: boolean }) {
  return open ? (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
    </svg>
  ) : (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  );
}

function TermsContent() {
  return (
    <>
      <p className="font-semibold text-slate-300">1. Aceitação dos Termos</p>
      <p>Ao criar uma conta, você concorda com estes Termos de Uso e com nossa Política de Privacidade.</p>
      <p className="font-semibold text-slate-300">2. Uso do Sistema</p>
      <p>O sistema SIGE-ICRE é destinado exclusivamente a membros e visitantes da Igreja de Cristo Rocha Eterna. O uso indevido pode resultar no cancelamento da conta.</p>
      <p className="font-semibold text-slate-300">3. Dados Pessoais</p>
      <p>Coletamos nome, e-mail, telefone, data de nascimento e endereço para gerenciamento eclesial. Seus dados não serão compartilhados com terceiros.</p>
      <p className="font-semibold text-slate-300">4. Responsabilidades</p>
      <p>Você é responsável por manter a confidencialidade de sua senha e por todas as atividades realizadas em sua conta.</p>
      <p>
        <Link href="/termos" target="_blank" className="text-blue-400 hover:underline">
          Leia os termos completos →
        </Link>
      </p>
    </>
  );
}

function validateStep(step: StepId, values: Record<string, string>): string | null {
  switch (step) {
    case 'name': {
      const v = values.fullName?.trim() ?? '';
      if (v.length < 3) return 'Nome deve ter pelo menos 3 caracteres.';
      if (v.length > 100) return 'Nome muito longo.';
      if (!/^[a-zA-ZÀ-ÿ\s'-]+$/.test(v)) return 'Use apenas letras e espaços.';
      return null;
    }
    case 'email': {
      const v = values.email?.trim() ?? '';
      if (!v) return 'E-mail é obrigatório.';
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return 'E-mail inválido.';
      return null;
    }
    case 'phone': {
      const v = values.phone?.trim() ?? '';
      if (v && !/^[\d\s\(\)\-\+]{8,20}$/.test(v)) return 'Telefone inválido.';
      return null;
    }
    case 'birthdate': {
      const v = values.birthDate ?? '';
      if (!v) return 'Data de nascimento é obrigatória.';
      const age = Math.floor((Date.now() - new Date(v).getTime()) / (1000 * 60 * 60 * 24 * 365.25));
      if (age < 13) return 'É necessário ter pelo menos 13 anos.';
      if (age > 120) return 'Data inválida.';
      return null;
    }
    case 'address':
      if ((values.address?.length ?? 0) > 300) return 'Endereço muito longo.';
      return null;
    case 'password': {
      const p = values.password ?? '';
      if (p.length < 8) return 'Mínimo 8 caracteres.';
      if (p.length > 72) return 'Máximo 72 caracteres.';
      if (!/[A-Z]/.test(p)) return 'Inclua pelo menos uma letra maiúscula.';
      if (!/[0-9]/.test(p)) return 'Inclua pelo menos um número.';
      if (p !== values.confirmPass) return 'As senhas não coincidem.';
      return null;
    }
    case 'terms':
      if (values.termsAccepted !== 'true') return 'Você precisa aceitar os Termos e Condições.';
      return null;
    default:
      return null;
  }
}

function passwordStrength(p: string): { score: number; label: string; color: string } {
  let score = 0;
  if (p.length >= 8)          score++;
  if (p.length >= 12)         score++;
  if (/[A-Z]/.test(p))        score++;
  if (/[0-9]/.test(p))        score++;
  if (/[^A-Za-z0-9]/.test(p)) score++;
  if (score <= 1) return { score, label: 'Fraca',  color: 'bg-red-500' };
  if (score <= 3) return { score, label: 'Média',  color: 'bg-amber-500' };
  return                     { score, label: 'Forte',  color: 'bg-emerald-500' };
}

export default function RegisterPage() {
  const { draft, setDraft, clearDraft } = useRegisterDraft();

  const [currentStep, setCurrentStep] = useState(0);
  const [values, setValues]           = useState<Record<string, string>>({});
  const [error, setError]             = useState<string | null>(null);
  const [phase, setPhase]             = useState<'idle' | 'exit' | 'enter'>('idle');
  const [direction, setDirection]     = useState<'forward' | 'back'>('forward');
  const [showPass, setShowPass]       = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [turnstileToken, setTurnstileToken] = useState<string>('');
  const [isPending, startTransition]  = useTransition();
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);

  // Aplica o draft salvo apenas no cliente, após a hidratação
  useEffect(() => {
    const { currentStep: savedStep, ...savedValues } = draft;
    if (savedStep) setCurrentStep(savedStep);
    if (Object.keys(savedValues).length > 0) setValues(savedValues as Record<string, string>);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const step     = STEPS[currentStep];
  const progress = (currentStep / (STEPS.length - 1)) * 100;
  const strength = step.id === 'password' ? passwordStrength(values.password ?? '') : null;

  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 380);
    return () => clearTimeout(t);
  }, [currentStep]);

  const set = (key: string, value: string) => {
    const next = { ...values, [key]: value };
    setValues(next);
    const safeToPersist = Object.fromEntries(
      Object.entries(next).filter(([k]) => k !== 'password' && k !== 'confirmPass')
    );
    setDraft({ ...safeToPersist, currentStep });
    if (error) setError(null);
    if (serverError) setServerError(null);
  };

  const animateTransition = (callback: () => void) => {
    setPhase('exit');
    setTimeout(() => {
      callback();
      setPhase('enter');
      setTimeout(() => setPhase('idle'), 320);
    }, 260);
  };

  const goNext = () => {
    const err = validateStep(step.id, values);
    if (err) { setError(err); return; }

    if (currentStep === STEPS.length - 1) {
      handleSubmit();
      return;
    }

    setDirection('forward');
    animateTransition(() => {
      const next = currentStep + 1;
      setCurrentStep(next);
      setDraft({ currentStep: next });
      setError(null);
    });
  };

  const goBack = () => {
    if (currentStep === 0) return;
    setDirection('back');
    animateTransition(() => {
      const prev = currentStep - 1;
      setCurrentStep(prev);
      setDraft({ currentStep: prev });
      setError(null);
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && step.id !== 'terms') goNext();
  };

  const fieldToStep: Record<string, number> = {
    fullName:  0,
    email:     1,
    phone:     2,
    birthDate: 3,
    address:   4,
    password:  5,
    terms:     6,
  };

  const handleSubmit = () => {
    startTransition(async () => {
      const formData = new FormData();
      Object.entries(values).forEach(([k, v]) => formData.set(k, v));
      if (turnstileToken) {
        formData.set('turnstile_token', turnstileToken);
      }
      const result = await registerUser(formData);
      if (result?.error) {
        const targetStep = result.field ? (fieldToStep[result.field] ?? null) : null;
        if (targetStep !== null && targetStep !== currentStep) {
          setDirection('back');
          animateTransition(() => {
            setCurrentStep(targetStep);
            setError(result.error ?? null);
          });
        } else {
          setServerError(result.error);
        }
      } else {
        clearDraft();
      }
    });
  };

  const contentClass = [
    'transition-all duration-260',
    phase === 'exit'
      ? direction === 'forward'
        ? 'opacity-0 -translate-x-6 scale-98'
        : 'opacity-0 translate-x-6 scale-98'
      : phase === 'enter'
      ? direction === 'forward'
        ? 'opacity-0 translate-x-6 scale-98'
        : 'opacity-0 -translate-x-6 scale-98'
      : 'opacity-100 translate-x-0 scale-100',
  ].join(' ');

  const inputClass =
    'w-full bg-slate-800 border border-slate-700 text-white placeholder-slate-500 rounded-2xl px-5 py-4 text-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-slate-600';

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_#1e3a5f_0%,_transparent_60%)] pointer-events-none" />

      <div className="relative w-full max-w-lg animate-[fadeSlideUp_0.4s_ease_both]">
        <div className="flex items-center justify-between mb-8">
          <Link
            href="/login"
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm font-medium"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Voltar
          </Link>
          <div className="flex items-center gap-2">
            <Image src="/logo.svg" alt="ICRE" width={24} height={24} className="brightness-0 invert opacity-60" />
            <span className="text-slate-500 text-sm font-medium">ICRE</span>
          </div>
        </div>

        {/* Barra de progresso */}
        <div className="mb-8">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
            <span>Passo {currentStep + 1} de {STEPS.length}</span>
            <span>{Math.round(progress)}% concluído</span>
          </div>
          <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          {/* Dots indicadores */}
          <div className="flex items-center justify-between mt-3 px-0.5">
            {STEPS.map((s, i) => (
              <div
                key={s.id}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i < currentStep
                    ? 'bg-blue-500 w-5'
                    : i === currentStep
                    ? 'bg-blue-400 w-3 ring-2 ring-blue-400/30'
                    : 'bg-slate-700 w-1.5'
                }`}
              />
            ))}
          </div>
        </div>

        <div className="bg-slate-900/80 backdrop-blur-sm border border-slate-800 rounded-3xl p-8 shadow-2xl min-h-[420px] flex flex-col overflow-hidden">
          <div className={contentClass}>
            <StepIllustration id={step.id} />

            <h2 className="text-2xl font-bold text-white mb-1 text-center">{step.title}</h2>
            <p className="text-slate-400 text-sm mb-8 text-center">{step.subtitle}</p>

            <div onKeyDown={handleKeyDown} className="space-y-4">
              {step.id === 'name' && (
                <input
                  ref={el => { inputRef.current = el; }}
                  type="text" placeholder="Ex: Maria Souza" maxLength={100}
                  value={values.fullName ?? ''} onChange={e => set('fullName', e.target.value)}
                  className={inputClass} autoComplete="name"
                />
              )}

              {step.id === 'email' && (
                <input
                  ref={el => { inputRef.current = el; }}
                  type="email" placeholder="seu@email.com" maxLength={254}
                  value={values.email ?? ''} onChange={e => set('email', e.target.value)}
                  className={inputClass} autoComplete="email"
                />
              )}

              {step.id === 'phone' && (
                <input
                  ref={el => { inputRef.current = el; }}
                  type="tel" placeholder="(XX) XXXXX-XXXX" maxLength={20}
                  value={values.phone ?? ''} onChange={e => set('phone', e.target.value)}
                  className={inputClass} autoComplete="tel"
                />
              )}

              {step.id === 'birthdate' && (
                <input
                  ref={el => { inputRef.current = el; }}
                  type="date" max={new Date().toISOString().split('T')[0]}
                  value={values.birthDate ?? ''} onChange={e => set('birthDate', e.target.value)}
                  className={`${inputClass} [color-scheme:dark]`}
                />
              )}

              {step.id === 'address' && (
                <textarea
                  ref={el => { inputRef.current = el; }}
                  placeholder="Rua, número, bairro, cidade..." maxLength={300} rows={3}
                  value={values.address ?? ''} onChange={e => set('address', e.target.value)}
                  className={`${inputClass} resize-none`}
                />
              )}

              {step.id === 'password' && (
                <>
                  <div className="relative">
                    <input
                      ref={el => { inputRef.current = el; }}
                      type={showPass ? 'text' : 'password'}
                      placeholder="Crie uma senha segura" maxLength={72}
                      value={values.password ?? ''} onChange={e => set('password', e.target.value)}
                      className={`${inputClass} pr-12`} autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass(v => !v)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                      aria-label={showPass ? 'Ocultar senha' : 'Mostrar senha'}
                    >
                      <EyeIcon open={showPass} />
                    </button>
                  </div>

                  {strength && (values.password?.length ?? 0) > 0 && (
                    <div className="space-y-1.5">
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map(i => (
                          <div
                            key={i}
                            className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                              i <= strength.score ? strength.color : 'bg-slate-700'
                            }`}
                          />
                        ))}
                      </div>
                      <p className="text-xs text-slate-400">
                        Força: <span className="font-semibold text-white">{strength.label}</span>
                      </p>
                    </div>
                  )}

                  <div className="relative">
                    <input
                      type={showConfirm ? 'text' : 'password'}
                      placeholder="Confirme a senha" maxLength={72}
                      value={values.confirmPass ?? ''} onChange={e => set('confirmPass', e.target.value)}
                      className={`${inputClass} pr-12`} autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(v => !v)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                      aria-label={showConfirm ? 'Ocultar confirmação' : 'Mostrar confirmação'}
                    >
                      <EyeIcon open={showConfirm} />
                    </button>
                  </div>

                  {values.confirmPass && (
                    <p className={`text-xs font-medium flex items-center gap-1.5 ${
                      values.password === values.confirmPass ? 'text-emerald-400' : 'text-red-400'
                    }`}>
                      {values.password === values.confirmPass ? (
                        <>
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                          </svg>
                          Senhas coincidem
                        </>
                      ) : (
                        <>
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                          As senhas não coincidem
                        </>
                      )}
                    </p>
                  )}
                </>
              )}

              {step.id === 'terms' && (
                <div className="space-y-4">
                  <div className="bg-slate-800 rounded-2xl p-4 h-48 overflow-y-auto text-xs text-slate-400 leading-relaxed space-y-3 border border-slate-700">
                    <TermsContent />
                  </div>
                  <label className="flex items-start gap-3 cursor-pointer group">
                    <div className="relative mt-0.5 shrink-0">
                      <input
                        type="checkbox"
                        checked={values.termsAccepted === 'true'}
                        onChange={e => set('termsAccepted', e.target.checked ? 'true' : 'false')}
                        className="sr-only"
                      />
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                        values.termsAccepted === 'true'
                          ? 'bg-blue-600 border-blue-600'
                          : 'bg-transparent border-slate-600 group-hover:border-slate-400'
                      }`}>
                        {values.termsAccepted === 'true' && (
                          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                    </div>
                    <span className="text-sm text-slate-300 leading-relaxed">
                      Li e aceito os{' '}
                      <Link href="/termos" target="_blank" className="text-blue-400 hover:underline">
                        Termos de Uso
                      </Link>{' '}
                      e a{' '}
                      <Link href="/privacidade" target="_blank" className="text-blue-400 hover:underline">
                        Política de Privacidade
                      </Link>
                    </span>
                  </label>
                  
                  {process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY && (
                    <div className="flex justify-center mt-4">
                      <Turnstile
                        siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY}
                        onSuccess={setTurnstileToken}
                      />
                    </div>
                  )}
                </div>
              )}

              {(error || serverError) && (
                <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-4 py-3 rounded-xl animate-[fadeSlideUp_0.2s_ease_both]">
                  <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {error ?? serverError}
                </div>
              )}
            </div>
          </div>

          <div className="mt-auto pt-8 flex items-center gap-3">
            {currentStep > 0 && (
              <button
                type="button"
                onClick={goBack}
                disabled={phase !== 'idle'}
                className="flex items-center gap-2 px-5 py-3.5 text-slate-400 hover:text-white border border-slate-700 hover:border-slate-500 rounded-2xl transition-all text-sm font-semibold disabled:opacity-50"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Voltar
              </button>
            )}

            <button
              type="button"
              onClick={goNext}
              disabled={isPending || phase !== 'idle'}
              className="flex-1 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-bold py-3.5 rounded-2xl transition-all disabled:opacity-50 flex items-center justify-center gap-2 text-sm shadow-lg shadow-blue-500/20"
            >
              {isPending ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                  </svg>
                  Criando conta...
                </>
              ) : currentStep === STEPS.length - 1 ? (
                <>
                  Criar conta
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </>
              ) : (
                <>
                  Continuar
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </>
              )}
            </button>
          </div>
        </div>

        {step.id === 'phone' || step.id === 'address' ? (
          <p className="text-center text-xs text-slate-600 mt-4">
            Campo opcional — você pode preencher depois no seu perfil
          </p>
        ) : null}
      </div>

      <style>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .scale-98 { transform: scale(0.98); }
        .duration-260 { transition-duration: 260ms; }
      `}</style>
    </div>
  );
}