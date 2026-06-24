import { getFeatureFlag } from '@/features/core/api/get-feature-flag';
import { getCurrentUser } from '@/features/core/api/get-current-user';
import { MaintenanceScreen } from '@/features/core/components/MaintenanceScreen';
import { FirstAccessTracker } from '@/features/core/components/FirstAccessTracker';
import { PageHeader } from '@/features/core/components/AdminSidebarShell';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';

interface QuickStat {
  label: string;
  value: string | number;
  sub: string;
  color: string;
  href: string;
  icon: React.ReactNode;
}

export default async function DashboardPage() {
  const user = await getCurrentUser();
  const flag = await getFeatureFlag('module_dashboard', user);

  if (!flag.isSysAdmin && (!flag.isActive || flag.status === 'manutencao')) {
    return <MaintenanceScreen featureName="Dashboard" />;
  }

  // Busca rápida de métricas
  const supabase = await createClient();
  const [
    { count: membersCount },
    { count: activeCellsCount },
    { data: nextEventData },
  ] = await Promise.all([
    supabase.from('members').select('id', { count: 'exact', head: true }).in('status', ['Membro', 'Congregante']),
    supabase.from('cells').select('id', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('events').select('id, title, date, time').eq('status', 'publicado').gte('date', new Date().toISOString().slice(0,10)).order('date', { ascending: true }).limit(1),
  ]);

  const nextEvent = nextEventData?.[0];

  const STATS = [
    {
      label: 'Membros ativos',
      value: membersCount ?? '—',
      sub: 'Membros e congregantes',
      color: '#3b82f6',
      href: '/membros',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
    },
    {
      label: 'Células ativas',
      value: activeCellsCount ?? '—',
      sub: 'Grupos ativos cadastrados',
      color: '#10b981',
      href: '/celulas',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
    },
    {
      label: 'Próximo evento',
      value: nextEvent ? new Date(nextEvent.date + 'T12:00:00').toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' }) : '—',
      sub: nextEvent?.title ?? 'Nenhum agendado',
      color: '#8b5cf6',
      href: '/eventos',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
    },
  ];

  const MODULES = [
    { label: 'Financeiro',       href: '/financeiro', color: '#10b981', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg> },
    { label: 'Membros',          href: '/membros',    color: '#3b82f6', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/></svg> },
    { label: 'Eventos',          href: '/eventos',    color: '#8b5cf6', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg> },
    { label: 'Células',          href: '/celulas',    color: '#f59e0b', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg> },
    { label: 'Líderes',          href: '/lideres',    color: '#ef4444', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/></svg> },
    { label: 'Site Público',     href: '/portal',     color: '#06b6d4', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"/></svg> },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <FirstAccessTracker flagSlug="module_dashboard" userId={user?.id} />

      <PageHeader
        title={`Olá, ${user?.fullName.split(' ')[0] ?? 'usuário'}`}
        description="Bem-vindo ao SIGE-Web. Aqui está um resumo rápido do sistema."
      />

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {STATS.map(stat => (
          <Link
            key={stat.href}
            href={stat.href}
            className="group rounded-2xl p-5 transition-all duration-200 hover:-translate-y-0.5"
            style={{
              background: 'var(--admin-surface)',
              border: '1px solid var(--admin-border)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
            }}
            onMouseEnter={(e: React.MouseEvent<HTMLAnchorElement>) => {
              e.currentTarget.style.borderColor = `${stat.color}40`;
              e.currentTarget.style.boxShadow = `0 8px 24px rgba(0,0,0,0.3), 0 0 0 1px ${stat.color}25`;
            }}
            onMouseLeave={(e: React.MouseEvent<HTMLAnchorElement>) => {
              e.currentTarget.style.borderColor = 'var(--admin-border)';
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.2)';
            }}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wide mb-2" style={{ color: 'var(--admin-text-secondary)' }}>
                  {stat.label}
                </p>
                <p className="text-3xl font-black text-slate-100 leading-none mb-1">{stat.value}</p>
                <p className="text-[11px] truncate" style={{ color: 'var(--admin-text-muted)' }}>{stat.sub}</p>
              </div>
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-105"
                style={{ background: `${stat.color}18`, border: `1px solid ${stat.color}30`, color: stat.color }}
              >
                {stat.icon}
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Quick links */}
      <div>
        <p className="text-[11px] font-bold uppercase tracking-widest mb-4" style={{ color: 'var(--admin-text-muted)' }}>
          Acesso rápido
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {MODULES.map(m => (
            <Link
              key={m.href}
              href={m.href}
              className="group flex flex-col items-center justify-center gap-3 p-5 rounded-2xl transition-all duration-200 text-center hover:-translate-y-0.5"
              style={{
                background: 'var(--admin-surface)',
                border: '1px solid var(--admin-border)',
              }}
              onMouseEnter={(e: React.MouseEvent<HTMLAnchorElement>) => {
                e.currentTarget.style.borderColor = `${m.color}40`;
                e.currentTarget.style.background = `${m.color}08`;
              }}
              onMouseLeave={(e: React.MouseEvent<HTMLAnchorElement>) => {
                e.currentTarget.style.borderColor = 'var(--admin-border)';
                e.currentTarget.style.background = 'var(--admin-surface)';
              }}
            >
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center transition-transform duration-200 group-hover:scale-110"
                style={{ background: `${m.color}18`, border: `1px solid ${m.color}30`, color: m.color }}
              >
                {m.icon}
              </div>
              <span className="text-[12px] font-semibold text-slate-400 group-hover:text-slate-200 transition-colors leading-tight">
                {m.label}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}