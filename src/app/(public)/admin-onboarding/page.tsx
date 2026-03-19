'use client'

import React, { useState, useTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { submitAdminProfile } from '@/features/core/actions/admin-onboarding';

type FieldErrors = Partial<Record<string, string>>;

const ESTADOS_BR = [
  'AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG',
  'PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO',
];

function formatCPF(value: string): string {
  const d = value.replace(/\D/g, '').slice(0, 11);
  return d
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
}

function formatPhone(value: string): string {
  const d = value.replace(/\D/g, '').slice(0, 11);
  return d
    .replace(/^(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d)/, '$1-$2');
}

function formatCEP(value: string): string {
  const d = value.replace(/\D/g, '').slice(0, 8);
  return d.replace(/(\d{5})(\d)/, '$1-$2');
}

export default function AdminOnboardingPage() {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);
  const [checking, setChecking]     = useState(true);
  const [cpf,   setCpf]   = useState('');
  const [phone, setPhone] = useState('');
  const [cep,   setCep]   = useState('');
  const [errors, setErrors] = useState<FieldErrors>({});
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const check = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace('/login'); return; }

      const { data } = await supabase
        .from('profiles')
        .select('onboarding_step, phone')
        .eq('id', user.id)
        .single();

      if (data?.onboarding_step !== 'fill_admin_profile') {
        router.replace('/');
        return;
      }

      if (data.phone) setPhone(formatPhone(data.phone));
      setAuthorized(true);
      setChecking(false);
    };
    check();
  }, [router]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrors({});
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = await submitAdminProfile(formData);
      if (result?.error) {
        setErrors({ [result.field ?? 'general']: result.error });
      }
    });
  };

  if (checking) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <svg className="w-8 h-8 animate-spin text-blue-400" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
        </svg>
      </div>
    );
  }

  if (!authorized) return null;

  const inputCls = (field: string) =>
    `w-full px-4 py-3 bg-slate-800 border rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all ${
      errors[field] ? 'border-red-500' : 'border-slate-700'
    }`;

  const labelCls = 'block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5';

  return (
    <div className="min-h-screen bg-slate-950 pt-28 pb-16 px-4">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,#3b1f5e_0%,transparent_60%)] pointer-events-none" />

      <div className="relative max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-violet-500/10 border border-violet-500/20 text-violet-400 text-xs font-bold tracking-widest uppercase px-4 py-2 rounded-full mb-4">
            Cadastro Administrativo — Passo 1 de 4
          </div>
          <h1 className="text-3xl font-black text-white">Complete seu perfil</h1>
          <p className="text-slate-400 text-sm mt-2 max-w-md mx-auto">
            Precisamos de seus dados completos para ativar seu cargo administrativo.
            Todos os campos são obrigatórios.
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-8">

            {errors.general && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-4 py-3 rounded-xl">
                {errors.general}
              </div>
            )}

            {/* Seção 1 — Dados pessoais */}
            <div>
              <h2 className="text-sm font-bold text-slate-300 mb-5 flex items-center gap-2">
                <span className="w-6 h-6 bg-violet-500/20 text-violet-400 rounded-lg flex items-center justify-center text-xs font-black">1</span>
                Dados Pessoais
              </h2>
              <div className="space-y-4">
                <div>
                  <label className={labelCls}>Nome completo *</label>
                  <input
                    name="fullName" type="text" required
                    placeholder="Nome e sobrenome completos"
                    className={inputCls('fullName')}
                  />
                  {errors.fullName && <p className="text-red-400 text-xs mt-1">{errors.fullName}</p>}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>CPF *</label>
                    <input
                      name="cpf" type="text" required placeholder="000.000.000-00"
                      value={cpf} onChange={e => setCpf(formatCPF(e.target.value))}
                      className={inputCls('cpf')}
                    />
                    {errors.cpf && <p className="text-red-400 text-xs mt-1">{errors.cpf}</p>}
                  </div>
                  <div>
                    <label className={labelCls}>Data de nascimento *</label>
                    <input
                      name="birthDate" type="date" required
                      max={new Date().toISOString().split('T')[0]}
                      className={`${inputCls('birthDate')} scheme-dark`}
                    />
                    {errors.birthDate && <p className="text-red-400 text-xs mt-1">{errors.birthDate}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>Telefone celular *</label>
                    <input
                      name="phone" type="text" required placeholder="(XX) XXXXX-XXXX"
                      value={phone} onChange={e => setPhone(formatPhone(e.target.value))}
                      className={inputCls('phone')}
                    />
                    {errors.phone && <p className="text-red-400 text-xs mt-1">{errors.phone}</p>}
                  </div>
                  <div>
                    <label className={labelCls}>Função na igreja *</label>
                    <input
                      name="churchRole" type="text" required
                      placeholder="Ex: Pastor, Tesoureira, Secretário"
                      className={inputCls('churchRole')}
                    />
                    {errors.churchRole && <p className="text-red-400 text-xs mt-1">{errors.churchRole}</p>}
                  </div>
                </div>
              </div>
            </div>

            {/* Seção 2 — Endereço */}
            <div>
              <h2 className="text-sm font-bold text-slate-300 mb-5 flex items-center gap-2">
                <span className="w-6 h-6 bg-violet-500/20 text-violet-400 rounded-lg flex items-center justify-center text-xs font-black">2</span>
                Endereço Residencial
              </h2>
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-2">
                    <label className={labelCls}>Logradouro *</label>
                    <input
                      name="address" type="text" required
                      placeholder="Rua, Avenida, etc."
                      className={inputCls('address')}
                    />
                    {errors.address && <p className="text-red-400 text-xs mt-1">{errors.address}</p>}
                  </div>
                  <div>
                    <label className={labelCls}>Número *</label>
                    <input
                      name="number" type="text" required placeholder="Ex: 123"
                      className={inputCls('number')}
                    />
                    {errors.number && <p className="text-red-400 text-xs mt-1">{errors.number}</p>}
                  </div>
                </div>

                <div>
                  <label className={labelCls}>Bairro *</label>
                  <input
                    name="neighborhood" type="text" required placeholder="Nome do bairro"
                    className={inputCls('neighborhood')}
                  />
                  {errors.neighborhood && <p className="text-red-400 text-xs mt-1">{errors.neighborhood}</p>}
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className={labelCls}>CEP *</label>
                    <input
                      name="cep" type="text" required placeholder="00000-000"
                      value={cep} onChange={e => setCep(formatCEP(e.target.value))}
                      className={inputCls('cep')}
                    />
                    {errors.cep && <p className="text-red-400 text-xs mt-1">{errors.cep}</p>}
                  </div>
                  <div>
                    <label className={labelCls}>Cidade *</label>
                    <input
                      name="city" type="text" required placeholder="Cidade"
                      className={inputCls('city')}
                    />
                    {errors.city && <p className="text-red-400 text-xs mt-1">{errors.city}</p>}
                  </div>
                  <div>
                    <label className={labelCls}>Estado *</label>
                    <select name="state" required className={inputCls('state')}>
                      <option value="">UF</option>
                      {ESTADOS_BR.map(uf => (
                        <option key={uf} value={uf}>{uf}</option>
                      ))}
                    </select>
                    {errors.state && <p className="text-red-400 text-xs mt-1">{errors.state}</p>}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-4 text-xs text-slate-400 leading-relaxed">
              Seus dados são armazenados com segurança e utilizados exclusivamente para identificação administrativa dentro da ICRE, conforme nossa{' '}
              <a href="/privacidade" target="_blank" className="text-violet-400 hover:underline">
                Política de Privacidade
              </a>.
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="w-full bg-violet-600 hover:bg-violet-500 text-white font-bold py-4 rounded-2xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
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
                <>
                  Continuar para os Termos
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </>
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-slate-600 mt-6">
          Passo 1 de 4 — Perfil → Foto → Termos → PIN
        </p>
      </div>
    </div>
  );
}