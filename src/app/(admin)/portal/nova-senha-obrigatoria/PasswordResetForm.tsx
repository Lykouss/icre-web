'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { updateOwnPassword } from '@/features/auth/actions/update-password';

export function PasswordResetForm({ userId }: { userId: string }) {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      setError('A senha deve ter no mínimo 6 caracteres.');
      return;
    }
    if (password !== confirm) {
      setError('As senhas não coincidem.');
      return;
    }

    setLoading(true);
    setError('');

    const res = await updateOwnPassword(password);
    if (res.error) {
      setError(res.error);
      setLoading(false);
    } else {
      router.push('/dashboard');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-200">
          {error}
        </div>
      )}
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nova Senha</label>
        <input 
          type="password" 
          required 
          value={password}
          onChange={e => setPassword(e.target.value)}
          className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" 
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Confirmar Nova Senha</label>
        <input 
          type="password" 
          required 
          value={confirm}
          onChange={e => setConfirm(e.target.value)}
          className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" 
        />
      </div>
      <button 
        type="submit" 
        disabled={loading}
        className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-blue-500/20 mt-4 disabled:opacity-50"
      >
        {loading ? 'Atualizando...' : 'Atualizar e Continuar'}
      </button>
    </form>
  );
}
