'use client'

import { useTransition, useState } from 'react';
import { updateProfile } from '@/features/core/actions/update-profile';
import { useToast } from '@/features/core/components/ToastContext';

interface ProfileFormProps {
  userId: string;
  fullName: string;
}

export function ProfileForm({ userId, fullName }: ProfileFormProps) {
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState(fullName);
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    startTransition(async () => {
      const result = await updateProfile(userId, { fullName: name });
      if ('error' in result) {
        toast('error', result.error);
      } else {
        toast('success', 'Dados atualizados com sucesso!');
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="fullName" className="block text-sm font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
          Nome Completo
        </label>
        <input
          id="fullName"
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          required
          className="w-full px-4 py-3 bg-blue-50/50 dark:bg-white/5 border border-blue-300/60 dark:border-white/10 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
        />
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isPending || name.trim() === fullName}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-slate-900 dark:text-white font-bold text-sm rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {isPending ? (
            <>
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
              </svg>
              Salvando...
            </>
          ) : (
            'Salvar'
          )}
        </button>
      </div>
    </form>
  );
}