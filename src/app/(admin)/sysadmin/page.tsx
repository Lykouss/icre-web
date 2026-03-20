import React from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/features/core/api/get-current-user';

export default async function SysAdminPage() {
  const user = await getCurrentUser();

  // O Leão de Chácara Supremo: Se não for o Dono, volta pro Dashboard.
  if (!user?.isSysAdmin) {
    redirect('/dashboard');
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Cabeçalho da Sala de Comando */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Sala de Comando (SysAdmin)</h1>
        <p className="text-slate-500 mt-2 max-w-2xl">
          Painel de controle supremo da ICRE. Gerencie módulos, acessos, integrações e a saúde do servidor.
        </p>
      </div>

      {/* Grid de Cartões (Blueprint) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* 1. Módulos e Feature Flags (O PRIMEIRO QUE VAMOS FAZER) */}
        <Link href="/sysadmin/flags" className="group bg-white rounded-2xl p-6 shadow-sm border border-slate-200 hover:shadow-md hover:border-blue-400 transition-all flex flex-col h-full">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"></path>
            </svg>
          </div>
          <h3 className="text-lg font-bold text-slate-800 mb-2">Controle de Módulos</h3>
          <p className="text-sm text-slate-500 flex-grow">
            Ligue ou desligue partes do sistema (Feature Flags) e libere testes antecipados para usuários VIPs.
          </p>
          <div className="mt-4 flex items-center text-sm font-semibold text-blue-600">
            Acessar painel <span className="ml-1 group-hover:translate-x-1 transition-transform">→</span>
          </div>
        </Link>

        {/* 2. Gestão de Acessos e Segurança */}
        <Link href="/sysadmin/acessos" className="group bg-white rounded-2xl p-6 shadow-sm border border-slate-200 hover:shadow-md hover:border-blue-400 transition-all flex flex-col h-full">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-slate-800 mb-2">Segurança & Acessos</h3>
          <p className="text-sm text-slate-500 grow">
            Controle de cargos (RBAC), concessão e revogação de acessos administrativos.
          </p>
          <div className="mt-4 flex items-center text-sm font-semibold text-blue-600">
            Acessar painel <span className="ml-1 group-hover:translate-x-1 transition-transform">→</span>
          </div>
        </Link>

        {/* 3. Configurações da Instituição */}
        <div className="relative overflow-hidden bg-white rounded-2xl p-6 shadow-sm border border-slate-200 opacity-80 flex flex-col h-full cursor-not-allowed">
          <div className="absolute top-4 right-4 bg-amber-100 text-amber-700 text-xs font-bold px-2 py-1 rounded-md">Em breve</div>
          <div className="w-12 h-12 bg-slate-100 text-slate-600 rounded-xl flex items-center justify-center mb-4">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
            </svg>
          </div>
          <h3 className="text-lg font-bold text-slate-800 mb-2">Dados da Instituição</h3>
          <p className="text-sm text-slate-500 flex-grow">
            Nome oficial, CNPJ, endereços, logo marca e cores globais do sistema e do site público.
          </p>
        </div>

        {/* 4. Integrações e APIs */}
        <div className="relative overflow-hidden bg-white rounded-2xl p-6 shadow-sm border border-slate-200 opacity-80 flex flex-col h-full cursor-not-allowed">
          <div className="absolute top-4 right-4 bg-amber-100 text-amber-700 text-xs font-bold px-2 py-1 rounded-md">Em breve</div>
          <div className="w-12 h-12 bg-slate-100 text-slate-600 rounded-xl flex items-center justify-center mb-4">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
            </svg>
          </div>
          <h3 className="text-lg font-bold text-slate-800 mb-2">Integrações & APIs</h3>
          <p className="text-sm text-slate-500 flex-grow">
            Gateways de pagamento (PIX), servidor de e-mails corporativos e robô do WhatsApp.
          </p>
        </div>

        {/* 5. Saúde do Sistema */}
        <Link href="/sysadmin/banco" className="group bg-white rounded-2xl p-6 shadow-sm border border-slate-200 hover:shadow-md hover:border-blue-400 transition-all flex flex-col h-full">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-slate-800 mb-2">Saúde do Banco (DB)</h3>
          <p className="text-sm text-slate-500 flex-grow">
            Monitoramento de registros, armazenamento, módulos ativos e atividade recente do sistema.
          </p>
          <div className="mt-4 flex items-center text-sm font-semibold text-blue-600">
            Acessar painel <span className="ml-1 group-hover:translate-x-1 transition-transform">→</span>
          </div>
        </Link>

      </div>
    </div>
  );
}