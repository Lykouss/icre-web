'use client'

import { useRef, useState, useTransition } from 'react';
import Image from 'next/image';
import { uploadAvatar, removeAvatar } from '@/features/portal/actions/portal-actions';
import { useToast } from '@/features/core/components/ToastContext';

interface Props {
  currentPhotoUrl: string | null;
  fullName: string;
}

export function AvatarUpload({ currentPhotoUrl, fullName }: Props) {
  const [preview, setPreview]        = useState<string | null>(currentPhotoUrl);
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const initials = fullName.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();

  const handleFile = (file: File) => {
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      toast('error', 'Formato inválido. Use JPG, PNG ou WebP.');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast('error', 'Imagem muito grande. Máximo 2 MB.');
      return;
    }

    setPreview(URL.createObjectURL(file));

    startTransition(async () => {
      const fd = new FormData();
      fd.set('file', file);
      const result = await uploadAvatar(fd);
      if ('error' in result) {
        toast('error', result.error ?? 'Erro desconhecido.');
        setPreview(currentPhotoUrl);
      } else {
        toast('success', 'Foto atualizada.');
      }
    });
  };

  const handleRemove = () => {
    startTransition(async () => {
      const result = await removeAvatar();
      if ('error' in result) {
        toast('error', result.error ?? 'Erro desconhecido.');
      } else {
        setPreview(null);
        toast('success', 'Foto removida.');
      }
    });
  };

  return (
    <div className="flex items-center gap-6">
      <div className="relative shrink-0">
        <div className="w-24 h-24 rounded-full overflow-hidden bg-blue-600 text-white font-bold text-2xl flex items-center justify-center border-4 border-white shadow-md">
          {preview ? (
            <Image src={preview} alt={fullName} width={96} height={96} className="object-cover w-full h-full" />
          ) : (
            initials
          )}
        </div>
        {isPending && (
          <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center">
            <svg className="w-6 h-6 text-white animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
            </svg>
          </div>
        )}
      </div>

      <div className="space-y-2">
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
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-50"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
          Alterar foto
        </button>
        {preview && (
          <button
            type="button"
            onClick={handleRemove}
            disabled={isPending}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors disabled:opacity-50"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Remover
          </button>
        )}
        <p className="text-xs text-slate-400">JPG, PNG ou WebP · Máx. 2 MB</p>
      </div>
    </div>
  );
}