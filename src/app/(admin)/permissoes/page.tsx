import React from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/features/core/api/get-current-user';

// 1. O nosso dicionário visual e de permissões
const ROLES_DATA = [
  {
    id: 'SYSADMIN',
    title: 'SysAdmin (Dono do Sistema)',
    level: 100,
    icon: '👑',
    colorTheme: 'text-purple-700 bg-purple-50 border-purple-200',
    iconBg: 'bg-purple-100',
    description: 'Acesso total e irrestrito aos bastidores da plataforma.',
    permissions: [
      'Edita e exclui qualquer perfil do sistema',
      'Lê e escreve anotações confidenciais de todos',
      'Acesso total e configuração do módulo financeiro',
      'Pode promover ou rebaixar os cargos de outros usuários'
    ]
  },
  {
    id: 'CHURCH_ADMIN',
    title: 'Administrador (Pastores / Secretaria)',
    level: 80,
    icon: '👔',
    colorTheme: 'text-blue-700 bg-blue-50 border-blue-200',
    iconBg: 'bg-blue-100',
    description: 'Gestão geral da igreja, focada em pessoas e processos estruturais.',
    permissions: [
      'Edita todos os perfis (exceto do SysAdmin)',
      'Lê e escreve anotações confidenciais e histórico pastoral',
      'Gerencia células, trilha espiritual e ministérios',
      'Visualiza relatórios e dashboards gerais da igreja'
    ]
  },
  {
    id: 'FINANCE_ADMIN',
    title: 'Financeiro (Tesouraria)',
    level: 60,
    icon: '💰',
    colorTheme: 'text-emerald-700 bg-emerald-50 border-emerald-200',
    iconBg: 'bg-emerald-100',
    description: 'Controle absoluto sobre as finanças, com acesso restrito a dados pessoais.',
    permissions: [
      'Acesso total aos lançamentos, dízimos e ofertas',
      'Leitura básica de perfis de membros (apenas para contato)',
      'Geração de relatórios financeiros e fechamento de caixa',
      'NÃO possui acesso a anotações confidenciais'
    ]
  },
  {
    id: 'LEADER',
    title: 'Líder de Célula / Departamento',
    level: 40,
    icon: '👥',
    colorTheme: 'text-amber-700 bg-amber-50 border-amber-200',
    iconBg: 'bg-amber-100',
    description: 'Gestão focada no rebanho local e no acompanhamento próximo.',
    permissions: [
      'Gerencia relatórios e encontros da sua própria célula',
      'Visualiza dados básicos de contato dos membros da igreja',
      'NÃO possui acesso a anotações confidenciais da secretaria',
      'NÃO possui acesso ao módulo financeiro'
    ]
  },
  {
    id: 'MEMBER',
    title: 'Membro / Visitante',
    level: 10,
    icon: '👤',
    colorTheme: 'text-slate-700 bg-slate-50 border-slate-200',
    iconBg: 'bg-slate-200',
    description: 'Acesso padrão à plataforma para acompanhamento pessoal.',
    permissions: [
      'Edita apenas as próprias informações de perfil (se vinculado)',
      'Acompanha a própria trilha espiritual e ministérios',
      'NÃO edita ou visualiza detalhes de outros membros',
      'NÃO acessa áreas administrativas ou financeiras'
    ]
  }
];

export default async function PermissionsPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const supabase = await createClient();

  // 2. Descobre o cargo real da pessoa
  const { data: roleData } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .single();

  const currentUserRole = roleData?.role || (user.isSysAdmin ? 'SYSADMIN' : 'MEMBER');

  // 3. Acha o "peso" do usuário atual para podermos filtrar a lista
  const currentRoleConfig = ROLES_DATA.find(r => r.id === currentUserRole);
  const currentUserLevel = currentRoleConfig?.level || 10;

  // 4. A REGRA DE OURO: Filtra para mostrar apenas cargos com nível MENOR OU IGUAL ao dele!
  const visibleRoles = ROLES_DATA.filter(role => role.level <= currentUserLevel);

  return (
    <div className="max-w-4xl mx-auto p-6 md:p-8 pb-12">
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Níveis de Acesso</h1>
        <p className="text-slate-500 mt-2 text-lg">
          Entenda as permissões e limites do seu cargo e das funções abaixo da sua liderança.
        </p>
      </div>

      <div className="space-y-6">
        {visibleRoles.map((role) => {
          const isMyRole = role.id === currentUserRole;

          return (
            <div 
              key={role.id} 
              className={`relative overflow-hidden rounded-2xl border-2 transition-all duration-300 hover:shadow-md ${
                isMyRole ? role.colorTheme : 'bg-white border-slate-200'
              }`}
            >
              {/* Etiqueta "Seu Cargo" */}
              {isMyRole && (
                <div className="absolute top-0 right-0 bg-slate-900 text-white text-xs font-bold px-4 py-1.5 rounded-bl-xl shadow-sm z-10">
                  SEU CARGO ATUAL
                </div>
              )}

              <div className="p-6 md:p-8 flex flex-col md:flex-row gap-6 items-start">
                
                {/* Ícone Redondo */}
                <div className={`w-16 h-16 shrink-0 rounded-2xl flex items-center justify-center text-3xl shadow-sm border border-white/50 ${role.iconBg}`}>
                  {role.icon}
                </div>

                {/* Conteúdo */}
                <div className="flex-1 w-full">
                  <div className="mb-4">
                    <h2 className={`text-2xl font-bold ${isMyRole ? '' : 'text-slate-800'}`}>
                      {role.title}
                    </h2>
                    <p className={`mt-1 font-medium ${isMyRole ? 'opacity-90' : 'text-slate-500'}`}>
                      {role.description}
                    </p>
                  </div>

                  <div className="bg-white/60 backdrop-blur-sm rounded-xl p-5 border border-white/40 shadow-inner">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                      O que este cargo pode fazer:
                    </h3>
                    <ul className="space-y-2.5">
                      {role.permissions.map((perm, idx) => (
                        <li key={idx} className="flex items-start gap-2.5 text-sm font-medium text-slate-700">
                          {/* Ícone de check ou X baseado no texto */}
                          <span className="mt-0.5 shrink-0">
                            {perm.startsWith('NÃO') ? (
                              <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"></path></svg>
                            ) : (
                              <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7"></path></svg>
                            )}
                          </span>
                          <span className={perm.startsWith('NÃO') ? 'text-slate-500' : ''}>
                            {perm}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>

                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}