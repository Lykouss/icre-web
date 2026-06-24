import React from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/features/core/api/get-current-user';
import { getFeatureFlag } from '@/features/core/api/get-feature-flag';
import { MaintenanceScreen } from '@/features/core/components/MaintenanceScreen';
import { FirstAccessTracker } from '@/features/core/components/FirstAccessTracker';

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
  badgeBg: string;
  badgeColor: string;
  iconBg: string;
  iconColor: string;
  bar: string;
  levelColor: string;
}> = {
  violet: { cardActive: 'border-violet-500/30', badgeBg: 'rgba(139,92,246,0.15)', badgeColor: '#c4b5fd', iconBg: 'rgba(139,92,246,0.12)', iconColor: '#c4b5fd', bar: '#8b5cf6', levelColor: '#c4b5fd' },
  blue:   { cardActive: 'border-blue-500/30',   badgeBg: 'rgba(37,99,235,0.15)',  badgeColor: '#93c5fd', iconBg: 'rgba(37,99,235,0.12)',  iconColor: '#93c5fd', bar: '#3b82f6', levelColor: '#93c5fd' },
  emerald:{ cardActive: 'border-emerald-500/30', badgeBg: 'rgba(16,185,129,0.15)', badgeColor: '#6ee7b7', iconBg: 'rgba(16,185,129,0.12)', iconColor: '#6ee7b7', bar: '#10b981', levelColor: '#6ee7b7' },
  amber:  { cardActive: 'border-amber-500/30',  badgeBg: 'rgba(245,158,11,0.15)', badgeColor: '#fbbf24', iconBg: 'rgba(245,158,11,0.12)', iconColor: '#fbbf24', bar: '#f59e0b', levelColor: '#fbbf24' },
  slate:  { cardActive: 'border-slate-500/30',  badgeBg: 'rgba(100,116,139,0.15)', badgeColor: '#94a3b8', iconBg: 'rgba(100,116,139,0.12)', iconColor: '#94a3b8', bar: '#64748b', levelColor: '#94a3b8' },
};

/* ─── Page ──────────────────────────────────────────────────────── */

export default async function PermissionsPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const flag = await getFeatureFlag('module_permissions', user);
  if (!flag.isSysAdmin && (!flag.isActive || flag.status === 'manutencao')) {
    return <MaintenanceScreen featureName="Permissões" />;
  }

  const hasAccess = user?.isSysAdmin || user?.roles.some(r => ['CHURCH_ADMIN'].includes(r));
  if (!hasAccess) {
    const { redirect } = await import('next/navigation');
    redirect('/dashboard');
  }

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
      <FirstAccessTracker flagSlug="module_permissions" userId={user?.id} />

      {/* ── Header ── */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-100 tracking-tight">Níveis de Acesso</h1>
        <p className="text-sm mt-1.5 max-w-xl leading-relaxed" style={{ color: 'var(--admin-text-secondary)' }}>
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
              className={`relative rounded-2xl border-2 transition-all duration-200 ${
                isMyRole ? colors.cardActive : ''
              }`}
              style={{
                background: isMyRole ? `${colors.bar}0a` : 'var(--admin-surface)',
                borderColor: isMyRole ? `${colors.bar}50` : 'var(--admin-border)',
              }}
            >
              {isMyRole && (
                <div className="absolute top-0 right-0 text-[9px] font-bold tracking-widest uppercase px-3 py-1.5 rounded-bl-xl rounded-tr-2xl"
                  style={{ background: colors.badgeBg, color: colors.badgeColor }}>
                  Seu cargo
                </div>
              )}

              <div className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-11 h-11 shrink-0 rounded-xl flex items-center justify-center"
                    style={{ background: colors.iconBg, color: colors.iconColor, border: `1px solid ${colors.bar}30` }}>
                    {role.icon}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2 flex-wrap mb-0.5">
                      <h2 className="text-[15px] font-bold text-slate-100">{role.title}</h2>
                      <span className="text-[11px] font-medium" style={{ color: 'var(--admin-text-muted)' }}>{role.subtitle}</span>
                    </div>

                    <p className="text-[12px] mb-4 leading-relaxed" style={{ color: 'var(--admin-text-secondary)' }}>{role.description}</p>

                    <div className="flex items-center gap-3 mb-5">
                      <span className="text-[11px] font-medium shrink-0" style={{ color: 'var(--admin-text-muted)' }}>Nível de acesso</span>
                      <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--admin-surface-alt)' }}>
                        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${levelPct}%`, background: colors.bar }} />
                      </div>
                      <span className="text-[11px] font-bold shrink-0 tabular-nums" style={{ color: colors.levelColor }}>{levelPct}/100</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
                      {role.permissions.map((perm, idx) => (
                        <div key={idx} className="flex items-start gap-2">
                          {perm.granted ? (
                            <svg className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                            </svg>
                          ) : (
                            <svg className="w-4 h-4 text-red-500/60 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          )}
                          <span className="text-[12px] leading-relaxed" style={{ color: perm.granted ? 'var(--admin-text-primary)' : 'var(--admin-text-muted)' }}>
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
      <p className="mt-8 text-[11px] text-center" style={{ color: 'var(--admin-text-muted)' }}>
        As permissões são definidas pelos administradores do sistema e podem ser ajustadas conforme necessário.
      </p>
    </div>
  );
}