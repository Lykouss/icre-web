'use client'

import React, { useState, useRef, useTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { uploadAvatar } from '@/features/portal/actions/portal-actions';
import { advanceOnboardingStep } from '@/features/core/actions/admin-onboarding';

export default function AdminOnboardingPhotoPage() {
  const router                          = useRouter();
  const [authorized, setAuthorized]     = useState(false);
  const [checking, setChecking]         = useState(true);
  const [preview, setPreview]           = useState<string | null>(null);
  const [uploaded, setUploaded]         = useState(false);
  const [isDragging, setIsDragging]     = useState(false);
  const [error, setError]               = useState<string | null>(null);
  const [isPending, startTransition]    = useTransition();
  const inputRef                        = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const check = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace('/login'); return; }

      const { data } = await supabase
        .from('profiles')
        .select('onboarding_step, photo_url')
        .eq('id', user.id)
        .single();

      if (data?.onboarding_step !== 'upload_photo') {
        router.replace('/');
        return;
      }

      if (data.photo_url) {
        setPreview(data.photo_url);
        setUploaded(true);
      }

      setAuthorized(true);
      setChecking(false);
    };
    check();
  }, [router]);

  const handleFile = (file: File) => {
    setError(null);
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('Formato inválido. Use JPG, PNG ou WebP.');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setError('Imagem muito grande. Máximo 2 MB.');
      return;
    }

    setPreview(URL.createObjectURL(file));

    startTransition(async () => {
      const fd = new FormData();
      fd.set('file', file);
      const result = await uploadAvatar(fd);
      if ('error' in result) {
        setError(result.error ?? 'Erro ao enviar foto.');
        setPreview(null);
        setUploaded(false);
      } else {
        setUploaded(true);
      }
    });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleContinue = () => {
    startTransition(async () => {
        // Só avança o step — o middleware detecta a próxima etapa pendente
        const result = await advanceOnboardingStep('upload_photo', 'done');
        if (result?.error) {
        setError(result.error);
        return;
        }
        // Redireciona para área protegida — middleware redireciona para etapa pendente se houver
        router.push('/dashboard');
    });
    };

  if (checking) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-950 flex items-center justify-center">
        <svg className="w-8 h-8 animate-spin text-blue-400" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
        </svg>
      </div>
    );
  }

  if (!authorized) return null;

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 pt-28 pb-16 px-4">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,#3b1f5e_0%,transparent_60%)] pointer-events-none" />

      <div className="relative max-w-md mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-violet-500/10 border border-violet-500/20 text-violet-400 text-xs font-bold tracking-widest uppercase px-4 py-2 rounded-full mb-4">
            Cadastro Administrativo — Passo 2 de 4
          </div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white">Foto de perfil</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-2 max-w-sm mx-auto">
            Uma foto é obrigatória para administradores. Ela aparecerá nos registros e logs do sistema.
          </p>
        </div>

        <div className="bg-slate-50 dark:bg-slate-900/60 backdrop-blur-xl border border-black/5 dark:border-white/8 rounded-3xl p-8 shadow-2xl shadow-black/40 space-y-6">

          {/* Drop zone / preview */}
          <div className="flex flex-col items-center gap-4">
            <div
              className={`relative w-36 h-36 rounded-full cursor-pointer transition-all duration-200 ${
                isDragging ? 'scale-105 ring-4 ring-violet-400/40 ring-offset-4 ring-offset-slate-900' : 'hover:scale-105'
              }`}
              onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => inputRef.current?.click()}
            >
              {preview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={preview} alt="Preview" className="w-full h-full rounded-full object-cover" />
              ) : (
                <div className="w-full h-full rounded-full bg-white/80 backdrop-blur-md dark:backdrop-blur-none border border-slate-200/50 dark:border-transparent dark:bg-slate-800/80 border-2 border-dashed border-slate-200 dark:border-slate-600 hover:border-violet-500/60 flex flex-col items-center justify-center gap-2 transition-all">
                  <svg className="w-8 h-8 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span className="text-xs text-slate-500">Clique ou arraste</span>
                </div>
              )}

              {isPending && (
                <div className="absolute inset-0 rounded-full bg-black/60 flex items-center justify-center">
                  <svg className="w-7 h-7 text-slate-900 dark:text-white animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                  </svg>
                </div>
              )}

              {uploaded && !isPending && (
                <div className="absolute -bottom-1 -right-1 w-9 h-9 rounded-full bg-emerald-500 border-2 border-slate-900 flex items-center justify-center shadow-lg">
                  <svg className="w-4 h-4 text-slate-900 dark:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}
            </div>

            <input
              ref={inputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              onChange={e => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }}
            />

            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={isPending}
              className="flex items-center gap-2 px-5 py-2.5 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 hover:bg-black/5 dark:bg-white/10 text-slate-600 dark:text-slate-300 text-sm font-semibold rounded-xl transition-colors disabled:opacity-50"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              {uploaded ? 'Trocar foto' : 'Escolher foto'}
            </button>

            <p className="text-xs text-slate-600">JPG, PNG ou WebP · Máx. 2 MB</p>
          </div>

          {error && (
            <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-4 py-3 rounded-xl">
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {error}
            </div>
          )}

          {uploaded && (
            <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm px-4 py-3 rounded-xl">
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
              Foto enviada com sucesso!
            </div>
          )}

          <button
            onClick={handleContinue}
            disabled={!uploaded || isPending}
            className="w-full bg-violet-600 hover:bg-violet-500 text-slate-900 dark:text-white font-bold py-3.5 rounded-2xl transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-violet-500/20"
          >
            {isPending ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                </svg>
                Aguarde...
              </>
            ) : (
              <>
                Continuar para os Termos
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </>
            )}
          </button>
        </div>

        <p className="text-center text-xs text-slate-600 mt-6">
          Passo 2 de 4 — Perfil → Foto → Termos → PIN
        </p>
      </div>
    </div>
  );
}