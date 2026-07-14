'use client'

import React, { useState, useRef, useTransition, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { uploadAvatar } from '@/features/portal/actions/portal-actions';

type Phase = 'celebrate' | 'photo' | 'redirect';

export default function RegisterSuccessPage() {
  const [phase, setPhase]         = useState<Phase>('celebrate');
  const [fadeOut, setFadeOut]     = useState(false);

  const transitionTo = useCallback((next: Phase) => {
    setFadeOut(true);
    setTimeout(() => {
      setPhase(next);
      setFadeOut(false);
    }, 380);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => transitionTo('photo'), 2600);
    return () => clearTimeout(t);
  }, [transitionTo]);

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 flex items-center justify-center p-4 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_#e0f2fe_0%,_transparent_55%)] dark:bg-[radial-gradient(ellipse_at_top,_#064e3b_0%,_transparent_55%)] pointer-events-none transition-all duration-1000" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_#1e3a5f10_0%,_transparent_60%)] dark:bg-[radial-gradient(ellipse_at_bottom_right,_#1e3a5f20_0%,_transparent_60%)] pointer-events-none" />

      <Particles />

      <div
        className={`relative w-full max-w-md transition-all duration-380 ${
          fadeOut ? 'opacity-0 scale-95 translate-y-4' : 'opacity-100 scale-100 translate-y-0'
        }`}
      >
        {phase === 'celebrate' && <CelebratePhase />}
        {phase === 'photo'     && <PhotoPhase onNext={() => transitionTo('redirect')} />}
        {phase === 'redirect'  && <RedirectPhase />}
      </div>

      <style>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes popIn {
          0%   { opacity: 0; transform: scale(0.5); }
          70%  { transform: scale(1.08); }
          100% { opacity: 1; transform: scale(1); }
        }
        @keyframes pulse-ring {
          0%   { transform: scale(1);   opacity: 0.6; }
          100% { transform: scale(1.8); opacity: 0; }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50%      { transform: translateY(-8px); }
        }
        @keyframes particle {
          0%   { transform: translateY(0) rotate(0deg);   opacity: 1; }
          100% { transform: translateY(-120px) rotate(720deg); opacity: 0; }
        }
        .duration-380 { transition-duration: 380ms; }
      `}</style>
    </div>
  );
}

function Particles() {
  const items = Array.from({ length: 12 }, (_, i) => i);
  const colors = [
    'bg-blue-400', 'bg-emerald-400', 'bg-blue-300',
    'bg-teal-400', 'bg-blue-500', 'bg-emerald-300',
  ];
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {items.map(i => (
        <div
          key={i}
          className={`absolute w-2 h-2 rounded-full ${colors[i % colors.length]} opacity-0`}
          style={{
            left:              `${15 + (i * 6.5) % 70}%`,
            bottom:            `${20 + (i * 7) % 40}%`,
            animationName:     'particle',
            animationDuration: `${1.5 + (i % 4) * 0.4}s`,
            animationDelay:    `${i * 0.15}s`,
            animationFillMode: 'both',
            animationIterationCount: '1',
          }}
        />
      ))}
    </div>
  );
}

function CelebratePhase() {
  return (
    <div className="text-center space-y-6 animate-[fadeSlideUp_0.5s_ease_both]">
      <div className="relative inline-flex items-center justify-center">
        <div className="absolute w-24 h-24 rounded-full bg-emerald-500/20 animate-[pulse-ring_1.5s_ease-out_infinite]" />
        <div className="absolute w-24 h-24 rounded-full bg-emerald-500/10 animate-[pulse-ring_1.5s_ease-out_0.5s_infinite]" />
        <div
          className="relative w-20 h-20 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center animate-[popIn_0.6s_cubic-bezier(0.34,1.56,0.64,1)_0.2s_both]"
        >
          <svg className="w-10 h-10 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
          </svg>
        </div>
      </div>

      <div className="animate-[fadeSlideUp_0.5s_ease_0.3s_both]">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Image src="/logo.svg" alt="ICRE" width={24} height={24} className="dark:brightness-0 dark:invert opacity-50" />
          <span className="text-slate-500 text-sm font-medium">ICRE</span>
        </div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Bem-vindo(a)!</h1>
        <p className="text-slate-500 dark:text-slate-400 text-base">Sua conta foi criada com sucesso.</p>
      </div>

      <div className="animate-[fadeSlideUp_0.5s_ease_0.5s_both]">
        <p className="text-slate-500 text-sm">Preparando seu perfil...</p>
        <div className="mt-3 flex justify-center gap-1.5">
          {[0, 1, 2].map(i => (
            <div
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-emerald-500/60"
              style={{
                animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite`,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

interface PhotoPhaseProps {
  onNext: () => void;
}

function PhotoPhase({ onNext }: PhotoPhaseProps) {
  const [preview, setPreview]        = useState<string | null>(null);
  const [isDragging, setIsDragging]  = useState(false);
  const [isPending, startTransition] = useTransition();
  const [uploadDone, setUploadDone]  = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const validateAndPreview = (file: File): string | null => {
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      return 'Formato inválido. Use JPG, PNG ou WebP.';
    }
    if (file.size > 2 * 1024 * 1024) {
      return 'Imagem muito grande. Máximo 2 MB.';
    }
    return null;
  };

  const handleFile = (file: File) => {
    const err = validateAndPreview(file);
    if (err) { setUploadError(err); return; }

    setUploadError(null);
    setPreview(URL.createObjectURL(file));

    startTransition(async () => {
      const fd = new FormData();
      fd.set('file', file);
      const result = await uploadAvatar(fd);
      if ('error' in result) {
        setUploadError(result.error ?? 'Erro ao enviar foto.');
        setPreview(null);
      } else {
        setUploadDone(true);
      }
    });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  return (
    <div className="text-center animate-[fadeSlideUp_0.5s_ease_both]">
      <div className="flex items-center justify-center gap-2 mb-6">
        <Image src="/logo.svg" alt="ICRE" width={22} height={22} className="dark:brightness-0 dark:invert opacity-50" />
        <span className="text-slate-500 text-sm font-medium">ICRE</span>
      </div>

      <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Adicione uma foto</h2>
      <p className="text-slate-500 dark:text-slate-400 text-sm mb-8">
        Coloque um rosto no seu perfil. Você pode mudar isso depois.
      </p>

      {/* Avatar preview / drop zone */}
      <div className="flex justify-center mb-8">
        <div
          className={`relative w-36 h-36 rounded-full cursor-pointer group transition-all duration-300 ${
            isDragging
              ? 'scale-105 ring-4 ring-blue-400/50 ring-offset-4 ring-offset-slate-950'
              : 'hover:scale-102'
          }`}
          onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
        >
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={preview}
              alt="Preview"
              className="w-full h-full rounded-full object-cover"
            />
          ) : (
            <div className="w-full h-full rounded-full bg-white/80 backdrop-blur-md dark:backdrop-blur-none border border-slate-200/50 dark:border-transparent dark:bg-slate-800/80 border-2 border-dashed border-slate-200 dark:border-slate-600 group-hover:border-blue-400/60 flex flex-col items-center justify-center gap-2 transition-all duration-200">
              <svg className="w-8 h-8 text-slate-500 group-hover:text-blue-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <span className="text-xs text-slate-500 group-hover:text-slate-500 dark:text-slate-400 transition-colors">
                Clique ou arraste
              </span>
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

          {uploadDone && !isPending && (
            <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-emerald-500 border-2 border-slate-950 flex items-center justify-center animate-[popIn_0.4s_cubic-bezier(0.34,1.56,0.64,1)_both]">
              <svg className="w-4 h-4 text-slate-900 dark:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
              </svg>
            </div>
          )}
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        onChange={e => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }}
      />

      {uploadError && (
        <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-4 py-3 rounded-xl mb-6 animate-[fadeSlideUp_0.2s_ease_both]">
          <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {uploadError}
        </div>
      )}

      {uploadDone && (
        <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm px-4 py-3 rounded-xl mb-6 animate-[fadeSlideUp_0.3s_ease_both]">
          <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
          </svg>
          Foto adicionada com sucesso!
        </div>
      )}

      <div className="space-y-3">
        <button
          type="button"
          onClick={onNext}
          disabled={isPending}
          className="w-full bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-slate-900 dark:text-white font-bold py-3.5 rounded-2xl transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20"
        >
          {uploadDone ? (
            <>
              Continuar
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </>
          ) : (
            'Continuar sem foto'
          )}
        </button>

        {!uploadDone && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={isPending}
            className="w-full border border-slate-200 dark:border-slate-700 hover:border-slate-500 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:text-white font-semibold py-3 rounded-2xl transition-all text-sm disabled:opacity-50"
          >
            Escolher foto
          </button>
        )}
      </div>

      <p className="mt-5 text-xs text-slate-600">JPG, PNG ou WebP · Máx. 2 MB</p>
    </div>
  );
}

function RedirectPhase() {
  const router  = useRouter();
  const [count, setCount] = useState(4);

  useEffect(() => {
    const interval = setInterval(() => {
      setCount(c => Math.max(0, c - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (count === 0) router.push('/');
  }, [count, router]);

  const circumference = 2 * Math.PI * 20;
  const progress = ((4 - count) / 4) * circumference;

  return (
    <div className="text-center space-y-8 animate-[fadeSlideUp_0.5s_ease_both]">
      <div className="relative inline-flex items-center justify-center">
        <svg className="w-20 h-20 -rotate-90" viewBox="0 0 48 48">
          <circle cx="24" cy="24" r="20" className="fill-none stroke-slate-800" strokeWidth="3" />
          <circle
            cx="24" cy="24" r="20"
            className="fill-none stroke-blue-500 transition-all duration-1000"
            strokeWidth="3"
            strokeDasharray={circumference}
            strokeDashoffset={circumference - progress}
            strokeLinecap="round"
          />
        </svg>
        <span className="absolute text-2xl font-bold text-slate-900 dark:text-white">{count}</span>
      </div>

      <div>
        <div className="flex items-center justify-center gap-2 mb-4">
          <Image src="/logo.svg" alt="ICRE" width={22} height={22} className="dark:brightness-0 dark:invert opacity-50" />
          <span className="text-slate-500 text-sm font-medium">ICRE</span>
        </div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Tudo pronto!</h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm">
          Você será redirecionado para a página inicial em instantes.
        </p>
      </div>

      <div className="animate-[float_3s_ease-in-out_infinite]">
        <svg className="w-16 h-16 mx-auto" viewBox="0 0 64 64" fill="none">
          <circle cx="32" cy="32" r="28" className="fill-blue-500/10 stroke-blue-400/40" strokeWidth="1.5" />
          <path d="M20 32h24M32 20v24" className="stroke-blue-400/30" strokeWidth="1.5" strokeLinecap="round" />
          <circle cx="32" cy="20" r="3" className="fill-blue-400/60" />
          <circle cx="44" cy="32" r="3" className="fill-emerald-400/60" />
          <circle cx="32" cy="44" r="3" className="fill-blue-400/40" />
          <circle cx="20" cy="32" r="3" className="fill-blue-300/40" />
          <circle cx="32" cy="32" r="5" className="fill-blue-500/20 stroke-blue-400" strokeWidth="1.5" />
        </svg>
      </div>

      <button
        type="button"
        onClick={() => router.push('/')}
        className="w-full bg-blue-600 hover:bg-blue-500 text-slate-900 dark:text-white font-bold py-3.5 rounded-2xl transition-all flex items-center justify-center gap-2"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
        Ir para o início agora
      </button>
    </div>
  );
}