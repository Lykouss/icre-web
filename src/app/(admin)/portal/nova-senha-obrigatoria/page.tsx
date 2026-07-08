import { getCurrentUser } from '@/features/core/api/get-current-user';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { ShieldAlert } from 'lucide-react';
import { PasswordResetForm } from './PasswordResetForm';

export default async function NovaSenhaObrigatoriaPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const supabase = await createClient();
  const { data: profile } = await supabase
    .from('profiles')
    .select('requires_password_change')
    .eq('id', user.id)
    .single();

  if (!profile?.requires_password_change) {
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-white/10 shadow-xl">
        <div className="w-16 h-16 bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-500 rounded-full flex items-center justify-center mb-6 mx-auto">
          <ShieldAlert className="w-8 h-8" />
        </div>
        
        <h1 className="text-2xl font-black text-center text-slate-900 dark:text-white mb-2">
          Atualização de Segurança
        </h1>
        <p className="text-center text-slate-500 dark:text-slate-400 mb-8 text-sm">
          Um administrador exigiu que você atualize sua senha para continuar acessando a plataforma.
        </p>

        <PasswordResetForm userId={user.id} />
      </div>
    </div>
  );
}
