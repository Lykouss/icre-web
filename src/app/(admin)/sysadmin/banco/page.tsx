import Link        from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentUser }  from '@/features/core/api/get-current-user';
import { getDbHealth }     from '@/features/core/actions/db-health';
import { DbHealthClient }  from '@/features/core/components/DbHealthClient';

export const metadata = { title: 'Saúde do Banco — ICRE' };

export const dynamic = 'force-dynamic';

export default async function DbHealthPage() {
  const user = await getCurrentUser();
  if (!user?.isSysAdmin) redirect('/dashboard');

  const result = await getDbHealth();

  return (
    <div className="max-w-6xl mx-auto">
      <Link
        href="/sysadmin"
        className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-slate-900 mb-6 transition-colors"
      >
        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Voltar para SysAdmin
      </Link>

      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Saúde do Banco</h1>
          <p className="text-slate-500 mt-2">
            Monitoramento de registros, armazenamento e atividade do sistema.
          </p>
        </div>
        {'generatedAt' in result && (
          <p className="text-xs text-slate-400 shrink-0 pt-1">
            Atualizado às{' '}
            {new Date(result.generatedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </p>
        )}
      </div>

      {'error' in result ? (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/30 rounded-2xl p-6 text-red-700 dark:text-red-300 text-sm">
          {result.error}
        </div>
      ) : (
        <DbHealthClient data={result} />
      )}
    </div>
  );
}