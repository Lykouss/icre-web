'use client'

import React, { useState, useTransition } from 'react';
import { submitFeedback } from '@/features/support/actions/feedback-actions';
import type { FeedbackType } from '@/features/support/types';
import { Bug, Lightbulb, Send, Loader2, CheckCircle, AlertTriangle, Clock } from 'lucide-react';

interface FeedbackFormProps {
  canSubmit: boolean;
  nextAvailableAt: string | null;
}

function formatNextAvailable(iso: string): string {
  const next = new Date(iso);
  const now  = new Date();
  const diffMs = next.getTime() - now.getTime();
  const diffH  = Math.ceil(diffMs / (1000 * 60 * 60));
  if (diffH <= 1) return 'em menos de 1 hora';
  return `em aproximadamente ${diffH}h`;
}

export function FeedbackForm({ canSubmit: initialCanSubmit, nextAvailableAt }: FeedbackFormProps) {
  const [isPending, startTransition] = useTransition();
  const [type, setType]             = useState<FeedbackType>('suggestion');
  const [content, setContent]       = useState('');
  const [error, setError]           = useState('');
  const [success, setSuccess]       = useState(false);
  const [canSubmit]                 = useState(initialCanSubmit);

  const charCount = content.length;
  const isValid   = charCount >= 20 && charCount <= 500 && canSubmit;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValid) return;
    setError('');
    startTransition(async () => {
      const result = await submitFeedback(type, content);
      if (result.error) {
        setError(result.error);
        return;
      }
      setSuccess(true);
      setContent('');
    });
  }

  // ── Success State ──────────────────────────────────────────────────────────
  if (success) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#060b17] flex items-center justify-center px-4 overflow-hidden relative">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_0%,_rgba(16,185,129,0.12)_0%,_transparent_60%)] dark:bg-[radial-gradient(ellipse_80%_50%_at_50%_0%,_rgba(16,185,129,0.08)_0%,_transparent_60%)] pointer-events-none" />
        <div className="text-center max-w-sm relative z-10">
          <div
            className="inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-6 bg-emerald-500/10 border border-emerald-500/25 dark:bg-emerald-500/10 dark:border-emerald-500/25"
          >
            <CheckCircle className="w-10 h-10 text-emerald-500 dark:text-emerald-400" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2">Feedback recebido!</h2>
          <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed mb-8">
            Obrigado por contribuir com a melhoria da plataforma. Nosso time analisa cada feedback recebido.
          </p>
          <a
            href="/"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-sm text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 dark:text-white dark:bg-white/5 dark:border-white/10 dark:hover:bg-white/10 transition-all"
          >
            Voltar ao início
          </a>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-slate-50 dark:bg-[#060b17] relative overflow-hidden"
    >
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_0%,_rgba(139,92,246,0.12)_0%,_transparent_60%)] dark:bg-[radial-gradient(ellipse_80%_50%_at_50%_0%,_rgba(139,92,246,0.08)_0%,_transparent_60%)] pointer-events-none" />
      <div className="max-w-xl mx-auto px-4 pt-32 pb-16 relative z-10">
        {/* Page Header */}
        <div className="mb-8">
          <div
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[12px] font-semibold mb-4 bg-violet-500/10 text-violet-600 border border-violet-500/20 dark:bg-violet-500/15 dark:text-violet-300 dark:border-violet-500/25"
          >
            <Lightbulb className="w-3.5 h-3.5" />
            Sugerir ou Relatar
          </div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white">Seu Feedback</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Ajude-nos a melhorar relatando problemas ou sugerindo melhorias.</p>
        </div>

        {/* Rate limit warning */}
        {!canSubmit && nextAvailableAt && (
          <div
            className="flex items-start gap-3 px-5 py-4 rounded-2xl mb-6 bg-amber-500/10 border border-amber-500/20 dark:bg-amber-500/10 dark:border-amber-500/20"
          >
            <Clock className="w-4 h-4 text-amber-500 dark:text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-[13px] font-semibold text-amber-600 dark:text-amber-300">Limite atingido</p>
              <p className="text-[12px] text-amber-600/70 dark:text-amber-200/70 mt-0.5">
                Você já enviou um feedback nas últimas 24 horas. Poderá enviar novamente{' '}
                <strong className="text-amber-600 dark:text-amber-200">{formatNextAvailable(nextAvailableAt)}</strong>.
              </p>
            </div>
          </div>
        )}

        {/* Form Card */}
        <div
          className="rounded-2xl overflow-hidden bg-white/80 border border-slate-200 dark:bg-[#0d1526]/80 dark:border-white/10 backdrop-blur-sm"
        >
          <form onSubmit={handleSubmit} className="p-6 space-y-5">

            {/* Type Select */}
            <div className="space-y-2">
              <label className="block text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                Tipo de Feedback <span className="text-red-500 dark:text-red-400">*</span>
              </label>
              <div className="grid grid-cols-2 gap-3">
                {([
                  { value: 'bug' as FeedbackType, label: 'Relatar um Bug', icon: <Bug className="w-4 h-4" />, colorCls: 'text-red-600 dark:text-red-400', bgCls: 'bg-red-500/10 border border-red-500/20', darkBgCls: 'dark:bg-red-500/10 dark:border-red-500/25' },
                  { value: 'suggestion' as FeedbackType, label: 'Sugerir Melhoria', icon: <Lightbulb className="w-4 h-4" />, colorCls: 'text-amber-600 dark:text-amber-400', bgCls: 'bg-amber-500/10 border border-amber-500/20', darkBgCls: 'dark:bg-amber-500/10 dark:border-amber-500/25' },
                ] as const).map(opt => {
                  const isSelected = type === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setType(opt.value)}
                      className={`flex items-center gap-2.5 px-4 py-3.5 rounded-xl font-semibold text-[13px] transition-all ${
                        isSelected
                          ? `${opt.bgCls} ${opt.darkBgCls} ${opt.colorCls}`
                          : 'bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100 dark:bg-white/5 dark:border-white/10 dark:text-slate-400 dark:hover:bg-white/10'
                      }`}
                    >
                      <span className={isSelected ? opt.colorCls : 'text-slate-400 dark:text-slate-500'}>
                        {opt.icon}
                      </span>
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Content Textarea */}
            <div className="space-y-2 group">
              <label className="block text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                Detalhes <span className="text-red-500 dark:text-red-400">*</span>
              </label>
              <textarea
                required
                value={content}
                onChange={e => setContent(e.target.value)}
                placeholder="Descreva os detalhes…"
                rows={5}
                maxLength={500}
                disabled={!canSubmit}
                className="w-full px-4 py-3 rounded-xl text-sm bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 transition-all resize-none disabled:opacity-50 disabled:cursor-not-allowed dark:bg-white/5 dark:border-white/10 dark:text-slate-200 dark:placeholder-slate-600 dark:focus:border-violet-500/50 dark:focus:ring-violet-500/10"
              />
              <div className="flex items-center justify-between">
                <p className="text-[11px] text-slate-500">Mínimo 20 caracteres</p>
                <p
                  className={`text-[11px] font-mono ${
                    charCount < 20
                      ? 'text-red-500 dark:text-red-400/80'
                      : charCount > 480
                      ? 'text-amber-500 dark:text-amber-400/80'
                      : 'text-slate-500 dark:text-slate-400'
                  }`}
                >
                  {charCount}/500
                </p>
              </div>
            </div>

            {/* Rate limit note */}
            <div
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 dark:bg-white/5 dark:border-white/10"
            >
              <Clock className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <p className="text-[11px] text-slate-600 dark:text-slate-400">
                Você pode enviar <strong className="text-slate-700 dark:text-slate-300">1 feedback a cada 24 horas</strong>.
              </p>
            </div>

            {error && (
              <div className="flex items-center gap-2 px-4 py-3 rounded-xl text-[13px] font-medium text-red-600 bg-red-50 border border-red-200 dark:text-red-400 dark:bg-red-500/10 dark:border-red-500/20">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={!isValid || isPending}
              className="w-full h-11 flex items-center justify-center gap-2 rounded-xl font-bold text-sm text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed bg-gradient-to-br from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500"
            >
              {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              {isPending ? 'Enviando…' : 'Enviar Feedback'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
