import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getCurrentUser } from '@/features/core/api/get-current-user';
import { listUsersWithRoles } from '@/features/core/actions/admin-access';
import { AccessManager } from '@/features/core/components/AccessManager';
 
export default async function AcessosPage() {
  const user = await getCurrentUser();
  if (!user?.isSysAdmin) redirect('/dashboard');
 
  const users = await listUsersWithRoles();
 
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
 
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Segurança & Acessos</h1>
        <p className="text-slate-500 mt-2">
          Gerencie cargos administrativos. Apenas SysAdmins podem acessar esta área.
        </p>
      </div>
 
      <AccessManager users={users} />
    </div>
  );
}