import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/features/core/api/get-current-user';
import { getDbHealth } from '@/features/core/actions/db-health';
import { DbHealthClient } from '@/features/core/components/DbHealthClient';
import { PageHeader } from '@/features/core/components/AdminSidebarShell';

export const metadata = { title: 'Saúde do Banco — ICRE' };

export const dynamic = 'force-dynamic';

export default async function DbHealthPage() {
  const user = await getCurrentUser();
  if (!user?.isSysAdmin) redirect('/dashboard');

  const result = await getDbHealth();

  return (
    <div className="max-w-6xl mx-auto">
      <Link href="/sysadmin"
        className="inline-flex items-center gap-1.5 text-[12px] font-semibold mb-6 transition-colors"
        style={{ color: 'var(--admin-text-secondary)' }}
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Voltar para SysAdmin
      </Link>

      <PageHeader
        title="Saúde do Banco"
        description="Monitoramento de registros, armazenamento e atividade recente do sistema."
        badge={
          <span className="text-[9px] font-bold px-2 py-1 rounded-lg" style={{ background: 'rgba(245,158,11,0.1)', color: '#fbbf24', border: '1px solid rgba(245,158,11,0.2)' }}>SYSADMIN</span>
        }
        action={'generatedAt' in result ? (
          <span className="text-[11px] font-mono" style={{ color: 'var(--admin-text-muted)' }}>
            Atualizado às {new Date(result.generatedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </span>
        ) : undefined}
      />

      {'error' in result ? (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-red-700 text-sm">
          {result.error}
        </div>
      ) : (
        <DbHealthClient data={result} />
      )}
    </div>
  );
}