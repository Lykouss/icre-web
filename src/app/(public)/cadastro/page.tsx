'use client'

import React, { useState, useRef, useTransition, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { registerUser } from '@/features/core/actions/auth';
import { useRegisterDraft } from '@/features/core/hooks/use-register-draft';

type StepId = 'name' | 'email' | 'phone' | 'birthdate' | 'address' | 'password' | 'terms';

interface StepConfig {
  id: StepId;
  title: string;
  subtitle: string;
  icon: string;
}

const STEPS: StepConfig[] = [
  { id: 'name',      title: 'Como podemos te chamar?',     subtitle: 'Seu nome completo.',                          icon: '👋' },
  { id: 'email',     title: 'Qual o seu e-mail?',           subtitle: 'Usaremos para login e comunicados.',          icon: '✉️' },
  { id: 'phone',     title: 'E seu telefone?',              subtitle: 'WhatsApp preferencial. Opcional.',            icon: '📱' },
  { id: 'birthdate', title: 'Quando você nasceu?',          subtitle: 'Sua data de nascimento.',                     icon: '🎂' },
  { id: 'address',   title: 'Onde você mora?',              subtitle: 'Endereço completo. Opcional.',                icon: '📍' },
  { id: 'password',  title: 'Crie sua senha',               subtitle: 'Mínimo 8 caracteres, 1 maiúscula, 1 número.', icon: '🔒' },
  { id: 'terms',     title: 'Termos e Condições',           subtitle: 'Leia e aceite para continuar.',               icon: '📋' },
];

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
  if (p.length >= 8)  score++;
  if (p.length >= 12) score++;
  if (/[A-Z]/.test(p)) score++;
  if (/[0-9]/.test(p)) score++;
  if (/[^A-Za-z0-9]/.test(p)) score++;
  if (score <= 1) return { score, label: 'Fraca',  color: 'bg-red-500' };
  if (score <= 3) return { score, label: 'Média',  color: 'bg-amber-500' };
  return            { score, label: 'Forte',  color: 'bg-emerald-500' };
}

export default function RegisterPage() {
  const { draft, setDraft, clearDraft } = useRegisterDraft();

  const [currentStep, setCurrentStep] = useState(() => draft.currentStep ?? 0);
  const [values, setValues]           = useState<Record<string, string>>(() => {
    const { currentStep: _step, ...rest } = draft;
    return rest as Record<string, string>;
  });
  const [error, setError]             = useState<string | null>(null);
  const [animating, setAnimating]     = useState(false);
  const [direction, setDirection]     = useState<'forward' | 'back'>('forward');
  const [showPass, setShowPass]       = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isPending, startTransition]  = useTransition();
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);

  const step     = STEPS[currentStep];
  const progress = (currentStep / (STEPS.length - 1)) * 100;

  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 350);
    return () => clearTimeout(t);
  }, [currentStep]);

  const set = (key: string, value: string) => {
    const next = { ...values, [key]: value };
    setValues(next);
    // Persiste tudo exceto senha e confirmação por segurança
    const safeToPersist = Object.fromEntries(
      Object.entries(next).filter(([k]) => k !== 'password' && k !== 'confirmPass')
    );
    setDraft({ ...safeToPersist, currentStep });
    if (error) setError(null);
  };

  const goNext = () => {
    const err = validateStep(step.id, values);
    if (err) { setError(err); return; }

    if (currentStep === STEPS.length - 1) {
      handleSubmit();
      return;
    }

    setDirection('forward');
    setAnimating(true);
    setTimeout(() => {
      const next = currentStep + 1;
      setCurrentStep(next);
      setDraft({ currentStep: next });
      setError(null);
      setAnimating(false);
    }, 280);
  };

  const goBack = () => {
    if (currentStep === 0) return;
    setDirection('back');
    setAnimating(true);
    setTimeout(() => {
      const prev = currentStep - 1;
      setCurrentStep(prev);
      setDraft({ currentStep: prev });
      setError(null);
      setAnimating(false);
    }, 280);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && step.id !== 'terms') goNext();
  };

  const handleSubmit = () => {
    startTransition(async () => {
      const formData = new FormData();
      Object.entries(values).forEach(([k, v]) => formData.set(k, v));
      const result = await registerUser(formData);
      if (result?.error) {
        setServerError(result.error);
      } else {
        clearDraft();
      }
    });
  };

  const inputClass = 'w-full bg-slate-800 border border-slate-700 text-white placeholder-slate-500 rounded-2xl px-5 py-4 text-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all';
  const strength   = step.id === 'password' ? passwordStrength(values.password ?? '') : null;

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_#1e3a5f_0%,_transparent_60%)] pointer-events-none" />

      <div className="relative w-full max-w-lg">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Link href="/login" className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm font-medium">
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

        {/* Progresso */}
        <div className="mb-8">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
            <span>Passo {currentStep + 1} de {STEPS.length}</span>
            <span>{Math.round(progress)}% concluído</span>
          </div>
          <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl min-h-[380px] flex flex-col">
          <div
            className={`transition-all duration-280 ${
              animating
                ? direction === 'forward' ? 'opacity-0 translate-y-4' : 'opacity-0 -translate-y-4'
                : 'opacity-100 translate-y-0'
            }`}
          >
            <div className="text-4xl mb-4">{step.icon}</div>
            <h2 className="text-2xl font-bold text-white mb-1">{step.title}</h2>
            <p className="text-slate-400 text-sm mb-8">{step.subtitle}</p>

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
                  className={inputClass}
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
                    <button type="button" onClick={() => setShowPass(v => !v)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors">
                      <EyeIcon open={showPass} />
                    </button>
                  </div>

                  {strength && (values.password?.length ?? 0) > 0 && (
                    <div>
                      <div className="flex gap-1 mb-1">
                        {[1,2,3,4,5].map(i => (
                          <div key={i} className={`h-1 flex-1 rounded-full transition-all ${i <= strength.score ? strength.color : 'bg-slate-700'}`} />
                        ))}
                      </div>
                      <p className="text-xs text-slate-400">Força: <span className="font-semibold text-white">{strength.label}</span></p>
                    </div>
                  )}

                  <div className="relative">
                    <input
                      type={showConfirm ? 'text' : 'password'}
                      placeholder="Confirme a senha" maxLength={72}
                      value={values.confirmPass ?? ''} onChange={e => set('confirmPass', e.target.value)}
                      className={`${inputClass} pr-12`} autoComplete="new-password"
                    />
                    <button type="button" onClick={() => setShowConfirm(v => !v)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors">
                      <EyeIcon open={showConfirm} />
                    </button>
                  </div>

                  {values.confirmPass && (
                    <p className={`text-xs font-medium ${values.password === values.confirmPass ? 'text-emerald-400' : 'text-red-400'}`}>
                      {values.password === values.confirmPass ? '✓ Senhas coincidem' : '✗ As senhas não coincidem'}
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
                        className="sr-only peer"
                      />
                      <div className="w-5 h-5 rounded-md border-2 border-slate-600 peer-checked:bg-blue-600 peer-checked:border-blue-600 transition-all flex items-center justify-center">
                        {values.termsAccepted === 'true' && (
                          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                    </div>
                    <span className="text-sm text-slate-300 group-hover:text-white transition-colors leading-relaxed">
                      Li e aceito os{' '}
                      <Link href="/termos" target="_blank" rel="noopener noreferrer" className="text-blue-400 underline hover:text-blue-300">
                        Termos e Condições
                      </Link>
                      {' '}e a{' '}
                      <Link href="/privacidade" target="_blank" rel="noopener noreferrer" className="text-blue-400 underline hover:text-blue-300">
                        Política de Privacidade
                      </Link>
                      {' '}da ICRE.
                    </span>
                  </label>
                </div>
              )}
            </div>

            {(error || serverError) && (
              <div className="mt-4 flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-4 py-3 rounded-xl">
                <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {error ?? serverError}
              </div>
            )}
          </div>

          {/* Botões */}
          <div className="mt-auto pt-6 flex items-center gap-3">
            {currentStep > 0 && (
              <button
                onClick={goBack}
                disabled={animating || isPending}
                className="px-5 py-3.5 text-slate-400 hover:text-white font-semibold rounded-xl hover:bg-slate-800 transition-all disabled:opacity-50"
              >
                ← Voltar
              </button>
            )}
            <button
              onClick={goNext}
              disabled={animating || isPending}
              className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold py-3.5 rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isPending ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                  </svg>
                  Criando conta...
                </>
              ) : currentStep === STEPS.length - 1 ? 'Criar minha conta →' : (
                <>
                  Continuar
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </>
              )}
            </button>
          </div>

          {/* Dots */}
          <div className="flex justify-center gap-1.5 mt-5">
            {STEPS.map((_, i) => (
              <div key={i} className={`rounded-full transition-all duration-300 ${
                i === currentStep ? 'w-6 h-2 bg-blue-500' : i < currentStep ? 'w-2 h-2 bg-blue-700' : 'w-2 h-2 bg-slate-700'
              }`} />
            ))}
          </div>
        </div>

        <p className="text-center text-slate-500 text-sm mt-6">
          Já tem conta?{' '}
          <Link href="/login" className="text-blue-400 hover:text-blue-300 font-semibold transition-colors">
            Entrar
          </Link>
        </p>
      </div>
    </div>
  );
}

function EyeIcon({ open }: { open: boolean }) {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={open
        ? 'M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21'
        : 'M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z'
      } />
    </svg>
  );
}

function TermsContent() {
  return (
    <>
      <p className="font-bold text-slate-200 text-sm">Termos e Condições de Uso — ICRE</p>
      <p>Última atualização: março de 2026</p>
      <p className="font-semibold text-slate-200">1. Aceitação dos Termos</p>
      <p>Ao se cadastrar na plataforma SIGE-Web da Igreja de Cristo Rocha Eterna (ICRE), você declara que leu, compreendeu e concorda com estes Termos e Condições. Caso não concorde, não prossiga com o cadastro.</p>
      <p className="font-semibold text-slate-200">2. Uso da Plataforma</p>
      <p>A plataforma SIGE-Web é um sistema de gestão eclesiástica destinado exclusivamente a membros, visitantes e colaboradores da ICRE. O acesso é pessoal e intransferível.</p>
      <p className="font-semibold text-slate-200">3. Dados Pessoais</p>
      <p>Os dados coletados são utilizados exclusivamente para fins de gestão interna da igreja, comunicação com os membros e organização de eventos. Não compartilhamos seus dados com terceiros sem seu consentimento expresso.</p>
      <p className="font-semibold text-slate-200">4. Conduta do Usuário</p>
      <p>Você concorda em não utilizar a plataforma para fins ilícitos ou que violem os valores cristãos da ICRE. É proibido o compartilhamento de informações confidenciais de outros membros.</p>
      <p className="font-semibold text-slate-200">5. Segurança</p>
      <p>Você é responsável pela confidencialidade de suas credenciais. Em caso de suspeita de acesso não autorizado, entre em contato imediatamente com a administração.</p>
      <p className="font-semibold text-slate-200">6. Alterações nos Termos</p>
      <p>A ICRE reserva-se o direito de atualizar estes Termos. Usuários serão notificados por e-mail sobre mudanças significativas.</p>
      <p className="font-semibold text-slate-200">7. Encerramento de Conta</p>
      <p>Você pode solicitar a exclusão de sua conta a qualquer momento. Dados necessários para cumprimento de obrigações legais poderão ser mantidos pelo período exigido pela legislação brasileira.</p>
      <p>Para a versão completa, acesse a{' '}
        <Link href="/termos" target="_blank" rel="noopener noreferrer" className="text-blue-400 underline">
          página de Termos
        </Link>.
      </p>
    </>
  );
}