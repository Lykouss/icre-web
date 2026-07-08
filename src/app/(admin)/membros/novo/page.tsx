import { getCurrentUser } from '@/features/core/api/get-current-user';
import { PageHeader } from '@/features/core/components/AdminSidebarShell';
import { notFound, redirect } from 'next/navigation';
import { NewAccountForm } from '@/features/members/components/NewAccountForm';

export default async function NovoMembroPage() {
  const user = await getCurrentUser();
  const hasAccess = user?.isSysAdmin || user?.roles.some(r => ['CHURCH_ADMIN'].includes(r));
  
  if (!hasAccess) {
    redirect('/dashboard');
  }

  return (
    <div className="max-w-3xl mx-auto pb-24">
      <PageHeader 
        title="Nova Conta"
        description="Crie uma nova conta de membro ou administrador para a plataforma."
      />
      
      <div className="mt-8">
        <NewAccountForm isSysAdmin={!!user?.isSysAdmin} />
      </div>
    </div>
  );
}
