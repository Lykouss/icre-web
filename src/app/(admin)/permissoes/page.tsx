import React from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/features/core/api/get-current-user';
import { getFeatureFlag } from '@/features/core/api/get-feature-flag';
import { FeatureMaintenance } from '@/features/core/components/FeatureMaintenance';

/* ─── Role definitions ──────────────────────────────────────────── */

const ROLES_DATA = [
  {
    id: 'SYSADMIN',
    title: 'Administrador do Sistema',
    subtitle: 'SysAdmin',
    level: 100,
    accentColor: 'violet',
    description: 'Acesso total e irrestrito a todos os módulos e configurações da plataforma.',
    permissions: [
      { label: 'Gestão completa de todos os perfis', granted: true },
      { label: 'Leitura e escrita de anotações confidenciais', granted: true },
      { label: 'Configuração e administração do módulo financeiro', granted: true },
      { label: 'Promoção e rebaixamento de cargos de outros usuários', granted: true },
    ],
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75"
          d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
      </svg>
    ),
  },
  {
    id: 'CHURCH_ADMIN',
    title: 'Administrador da Igreja',
    subtitle: 'Pastores / Secretaria',
    level: 80,
    accentColor: 'blue',
    description: 'Gestão geral da congregação, focada em pessoas e processos estruturais.',
    permissions: [
      { label: 'Edição de perfis (exceto contas SysAdmin)', granted: true },
      { label: 'Leitura e escrita de anotações confidenciais e histórico pastoral', granted: true },
      { label: 'Gerenciamento de células, ministérios e trilha espiritual', granted: true },
      { label: 'Visualização de relatórios e dashboards gerais', granted: true },
    ],
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75"
          d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
  },
  {
    id: 'FINANCE_ADMIN',
    title: 'Administrador Financeiro',
    subtitle: 'Tesouraria',
    level: 60,
    accentColor: 'emerald',
    description: 'Controle completo sobre as finanças, com acesso restrito a dados pessoais.',
    permissions: [
      { label: 'Acesso total a lançamentos, dízimos e ofertas', granted: true },
      { label: 'Leitura básica de perfis (apenas dados de contato)', granted: true },
      { label: 'Geração de relatórios financeiros e fechamento de caixa', granted: true },
      { label: 'Acesso a anotações confidenciais da secretaria', granted: false },
    ],
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75"
          d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    id: 'LEADER',
    title: 'Líder',
    subtitle: 'Célula / Departamento',
    level: 40,
    accentColor: 'amber',
    description: 'Gestão focada no rebanho local e acompanhamento próximo da comunidade.',
    permissions: [
      { label: 'Gerenciamento de relatórios e encontros da própria célula', granted: true },
      { label: 'Visualização de dados básicos de contato dos membros', granted: true },
      { label: 'Acesso a anotações confidenciais da secretaria', granted: false },
      { label: 'Acesso ao módulo financeiro', granted: false },
    ],
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75"
          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    id: 'MEMBER',
    title: 'Membro',
    subtitle: 'Visitante / Usuário padrão',
    level: 10,
    accentColor: 'slate',
    description: 'Acesso padrão à plataforma para acompanhamento e uso pessoal.',
    permissions: [
      { label: 'Edição das próprias informações de perfil', granted: true },
      { label: 'Acompanhamento da própria trilha espiritual e ministérios', granted: true },
      { label: 'Visualização ou edição de dados de outros membros', granted: false },
      { label: 'Acesso a áreas administrativas ou financeiras', granted: false },
    ],
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75"
          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
  },
];

/* ─── Accent colour maps ────────────────────────────────────────── */

const accentMap: Record<string, {
  cardActive: string;
  badge: string;
  icon: string;
  iconRing: string;
  bar: string;
  level: string;
}> = {
  violet: {
    cardActive: 'border-violet-200 bg-violet-50/60',
    badge:      'bg-violet-600 text-white',
    icon:       'bg-violet-100 text-violet-600',
    iconRing:   'ring-violet-200',
    bar:        'bg-violet-500',
    level:      'text-violet-700',
  },
  blue: {
    cardActive: 'border-blue-200 bg-blue-50/60',
    badge:      'bg-blue-600 text-white',
    icon:       'bg-blue-100 text-blue-600',
    iconRing:   'ring-blue-200',
    bar:        'bg-blue-500',
    level:      'text-blue-700',
  },
  emerald: {
    cardActive: 'border-emerald-200 bg-emerald-50/60',
    badge:      'bg-emerald-600 text-white',
    icon:       'bg-emerald-100 text-emerald-600',
    iconRing:   'ring-emerald-200',
    bar:        'bg-emerald-500',
    level:      'text-emerald-700',
  },
  amber: {
    cardActive: 'border-amber-200 bg-amber-50/60',
    badge:      'bg-amber-500 text-white',
    icon:       'bg-amber-100 text-amber-600',
    iconRing:   'ring-amber-200',
    bar:        'bg-amber-400',
    level:      'text-amber-700',
  },
  slate: {
    cardActive: 'border-slate-200 bg-slate-50',
    badge:      'bg-slate-600 text-white',
    icon:       'bg-slate-100 text-slate-600',
    iconRing:   'ring-slate-200',
    bar:        'bg-slate-400',
    level:      'text-slate-600',
  },
};

/* ─── Page ──────────────────────────────────────────────────────── */

export default async function PermissionsPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const isActive = await getFeatureFlag('module_permissions', user);
  if (!isActive) return <FeatureMaintenance featureName="Módulo de Cargos" />;

  const supabase = await createClient();

  const { data: roleData } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .single();

  const currentUserRole = roleData?.role || (user.isSysAdmin ? 'SYSADMIN' : 'MEMBER');
  const currentRoleConfig = ROLES_DATA.find(r => r.id === currentUserRole);
  const currentUserLevel = currentRoleConfig?.level ?? 10;

  const visibleRoles = ROLES_DATA.filter(role => role.level <= currentUserLevel);

  return (
    <div className="max-w-4xl mx-auto">

      {/* ── Header ── */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Níveis de Acesso</h1>
        <p className="text-slate-500 mt-1.5 text-base leading-relaxed max-w-xl">
          Entenda as permissões atribuídas a cada cargo e o que cada função da equipe pode visualizar ou editar.
        </p>
      </div>

      {/* ── Cards ── */}
      <div className="space-y-4">
        {visibleRoles.map((role) => {
          const isMyRole = role.id === currentUserRole;
          const colors = accentMap[role.accentColor];
          const levelPct = role.level;

          return (
            <div
              key={role.id}
              className={`relative rounded-2xl border transition-all duration-200 ${
                isMyRole
                  ? `${colors.cardActive} shadow-sm`
                  : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-sm'
              }`}
            >
              {/* "Seu cargo" badge */}
              {isMyRole && (
                <div className={`absolute top-0 right-0 text-[10px] font-bold tracking-widest uppercase px-3 py-1.5 rounded-bl-xl rounded-tr-2xl ${colors.badge}`}>
                  Seu cargo
                </div>
              )}

              <div className="p-6">
                <div className="flex items-start gap-4">

                  {/* Icon */}
                  <div className={`w-11 h-11 shrink-0 rounded-xl flex items-center justify-center ring-1 ${colors.icon} ${colors.iconRing}`}>
                    {role.icon}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">

                    {/* Title row */}
                    <div className="flex items-baseline gap-2 flex-wrap mb-0.5">
                      <h2 className="text-base font-bold text-slate-900">{role.title}</h2>
                      <span className="text-xs font-medium text-slate-400">{role.subtitle}</span>
                    </div>

                    {/* Description */}
                    <p className="text-sm text-slate-500 mb-4 leading-relaxed">{role.description}</p>

                    {/* Level bar */}
                    <div className="flex items-center gap-3 mb-5">
                      <span className="text-xs font-medium text-slate-400 shrink-0">Nível de acesso</span>
                      <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${colors.bar}`}
                          style={{ width: `${levelPct}%` }}
                        />
                      </div>
                      <span className={`text-xs font-bold shrink-0 tabular-nums ${colors.level}`}>{levelPct}/100</span>
                    </div>

                    {/* Permissions grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
                      {role.permissions.map((perm, idx) => (
                        <div key={idx} className="flex items-start gap-2">
                          {perm.granted ? (
                            <svg className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                            </svg>
                          ) : (
                            <svg className="w-4 h-4 text-red-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          )}
                          <span className={`text-sm ${perm.granted ? 'text-slate-700' : 'text-slate-400'}`}>
                            {perm.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Footer note ── */}
      <p className="mt-8 text-xs text-slate-400 text-center">
        As permissões são definidas pelos administradores do sistema e podem ser ajustadas conforme necessário.
      </p>
    </div>
  );
}