import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getCurrentUser } from '@/features/core/api/get-current-user';
import { listUsersWithRoles } from '@/features/core/actions/admin-access';
import { AccessManager } from '@/features/core/components/AccessManager';
import { PageHeader } from '@/features/core/components/AdminSidebarShell';
 
export default async function AcessosPage() {
  const user = await getCurrentUser();
  if (!user?.isSysAdmin) redirect('/dashboard');
 
  const users = await listUsersWithRoles();
 
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
        title="Segurança & Acessos"
        description="Gerencie cargos administrativos (RBAC). Apenas SysAdmins podem acessar esta área."
        badge={
          <span className="text-[9px] font-bold px-2 py-1 rounded-lg" style={{ background: 'rgba(245,158,11,0.1)', color: '#fbbf24', border: '1px solid rgba(245,158,11,0.2)' }}>SYSADMIN</span>
        }
      />

      <AccessManager users={users} />
    </div>
  );
}