import React from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/features/core/api/get-current-user';
import { FlagToggler } from '@/features/core/components/FlagToggler';

// Tipagem estrita do banco de dados (Tolerância Zero para "any")
export interface FeatureFlagRecord {
  slug: string;
  name: string;
  description: string;
  is_active: boolean;
}

export default async function FlagsPage() {
  const user = await getCurrentUser();

  if (!user?.isSysAdmin) {
    redirect('/dashboard');
  }

  // Busca todas as flags no banco ordenadas pelo nome
  const supabase = await createClient();
  const { data: flags, error } = await supabase
    .from('feature_flags')
    .select('slug, name, description, is_active')
    .order('name');

  if (error) {
    console.error('Erro ao buscar flags:', error);
  }

  const flagsList = (flags as FeatureFlagRecord[]) || [];

  return (
    <div className="max-w-4xl mx-auto">
      {/* Botão de Voltar */}
      <Link 
        href="/sysadmin" 
        className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-slate-900 mb-6 transition-colors"
      >
        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Voltar para SysAdmin
      </Link>

      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Controle de Módulos</h1>
          <p className="text-slate-500 mt-2">
            Ligue ou desligue o acesso público aos módulos do sistema.
          </p>
        </div>
      </div>

      {/* Lista de Interruptores */}
      <div className="flex flex-col gap-4">
        {flagsList.length === 0 ? (
          <div className="text-center p-8 bg-slate-50 rounded-2xl border border-slate-200">
            Nenhum módulo cadastrado no banco de dados.
          </div>
        ) : (
          flagsList.map((flag) => (
            <FlagToggler 
              key={flag.slug}
              slug={flag.slug}
              name={flag.name}
              description={flag.description}
              initialStatus={flag.is_active}
            />
          ))
        )}
      </div>
    </div>
  );
}