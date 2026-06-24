import { getFeatureFlag } from '@/features/core/api/get-feature-flag';
import { getCurrentUser } from '@/features/core/api/get-current-user';
import { MaintenanceScreen } from '@/features/core/components/MaintenanceScreen';
import { FirstAccessTracker } from '@/features/core/components/FirstAccessTracker';
import { PageHeader } from '@/features/core/components/AdminSidebarShell';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { DashboardStats, DashboardModules } from './DashboardClientCards';

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
      <DashboardStats stats={STATS} />

      {/* Quick links */}
      <div>
        <p className="text-[11px] font-bold uppercase tracking-widest mb-4" style={{ color: 'var(--admin-text-muted)' }}>
          Acesso rápido
        </p>
        <DashboardModules modules={MODULES} />
      </div>
    </div>
  );
}