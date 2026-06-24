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

  const inputStyle: React.CSSProperties = {
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.1)',
  };

  // ── Success State ──────────────────────────────────────────────────────────
  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'radial-gradient(ellipse 80% 50% at 50% 0%, rgba(16,185,129,0.08) 0%, transparent 60%), #060b17' }}>
        <div className="text-center max-w-sm">
          <div
            className="inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-6"
            style={{ background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.25)' }}
          >
            <CheckCircle className="w-10 h-10 text-emerald-400" />
          </div>
          <h2 className="text-2xl font-black text-white mb-2">Feedback recebido!</h2>
          <p className="text-slate-400 text-sm leading-relaxed mb-8">
            Obrigado por contribuir com a melhoria da plataforma. Nosso time analisa cada feedback recebido.
          </p>
          <a
            href="/"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-sm text-white transition-all"
            style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)' }}
          >
            Voltar ao início
          </a>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen"
      style={{
        background: 'radial-gradient(ellipse 80% 50% at 50% 0%, rgba(139,92,246,0.08) 0%, transparent 60%), #060b17',
      }}
    >
      <div className="max-w-xl mx-auto px-4 pt-32 pb-16">
        {/* Page Header */}
        <div className="mb-8">
          <div
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[12px] font-semibold mb-4"
            style={{ background: 'rgba(139,92,246,0.15)', color: '#c4b5fd', border: '1px solid rgba(139,92,246,0.25)' }}
          >
            <Lightbulb className="w-3.5 h-3.5" />
            Sugerir ou Relatar
          </div>
          <h1 className="text-3xl font-black text-white">Seu Feedback</h1>
          <p className="text-slate-400 mt-1">Ajude-nos a melhorar relatando problemas ou sugerindo melhorias.</p>
        </div>

        {/* Rate limit warning */}
        {!canSubmit && nextAvailableAt && (
          <div
            className="flex items-start gap-3 px-5 py-4 rounded-2xl mb-6"
            style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' }}
          >
            <Clock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-[13px] font-semibold text-amber-300">Limite atingido</p>
              <p className="text-[12px] text-amber-200/70 mt-0.5">
                Você já enviou um feedback nas últimas 24 horas. Poderá enviar novamente{' '}
                <strong className="text-amber-200">{formatNextAvailable(nextAvailableAt)}</strong>.
              </p>
            </div>
          </div>
        )}

        {/* Form Card */}
        <div
          className="rounded-2xl overflow-hidden"
          style={{ background: 'rgba(13,21,38,0.8)', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          <form onSubmit={handleSubmit} className="p-6 space-y-5">

            {/* Type Select */}
            <div className="space-y-2">
              <label className="block text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                Tipo de Feedback <span className="text-red-400">*</span>
              </label>
              <div className="grid grid-cols-2 gap-3">
                {([
                  { value: 'bug' as FeedbackType, label: 'Relatar um Bug', icon: <Bug className="w-4 h-4" />, color: '#f87171', bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.25)' },
                  { value: 'suggestion' as FeedbackType, label: 'Sugerir Melhoria', icon: <Lightbulb className="w-4 h-4" />, color: '#fcd34d', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.25)' },
                ] as const).map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setType(opt.value)}
                    className="flex items-center gap-2.5 px-4 py-3.5 rounded-xl font-semibold text-[13px] transition-all"
                    style={
                      type === opt.value
                        ? { background: opt.bg, color: opt.color, border: `1px solid ${opt.border}` }
                        : { background: 'rgba(255,255,255,0.03)', color: 'rgba(148,163,184,0.7)', border: '1px solid rgba(255,255,255,0.08)' }
                    }
                  >
                    <span style={{ color: type === opt.value ? opt.color : 'rgba(100,116,139,0.8)' }}>
                      {opt.icon}
                    </span>
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Content Textarea */}
            <div className="space-y-2">
              <label className="block text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                Detalhes <span className="text-red-400">*</span>
              </label>
              <textarea
                required
                value={content}
                onChange={e => setContent(e.target.value)}
                placeholder="Descreva os detalhes…"
                rows={5}
                maxLength={500}
                disabled={!canSubmit}
                className="w-full px-4 py-3 rounded-xl text-sm text-slate-200 placeholder-slate-600 outline-none transition-all resize-none disabled:opacity-50 disabled:cursor-not-allowed"
                style={inputStyle}
                onFocus={e => {
                  e.currentTarget.style.borderColor = 'rgba(139,92,246,0.5)';
                  e.currentTarget.style.boxShadow   = '0 0 0 3px rgba(139,92,246,0.1)';
                }}
                onBlur={e => {
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
                  e.currentTarget.style.boxShadow   = 'none';
                }}
              />
              <div className="flex items-center justify-between">
                <p className="text-[11px] text-slate-600">Mínimo 20 caracteres</p>
                <p
                  className="text-[11px] font-mono"
                  style={{
                    color:
                      charCount < 20
                        ? 'rgba(239,68,68,0.8)'
                        : charCount > 480
                        ? 'rgba(245,158,11,0.8)'
                        : 'rgba(100,116,139,0.8)',
                  }}
                >
                  {charCount}/500
                </p>
              </div>
            </div>

            {/* Rate limit note */}
            <div
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
            >
              <Clock className="w-3.5 h-3.5 text-slate-600 shrink-0" />
              <p className="text-[11px] text-slate-600">
                Você pode enviar <strong className="text-slate-500">1 feedback a cada 24 horas</strong>.
              </p>
            </div>

            {error && (
              <div className="flex items-center gap-2 px-4 py-3 rounded-xl text-[13px] font-medium text-red-400" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
                <AlertTriangle className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={!isValid || isPending}
              className="w-full h-11 flex items-center justify-center gap-2 rounded-xl font-bold text-sm text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ background: 'linear-gradient(135deg, #7c3aed, #2563eb)' }}
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
