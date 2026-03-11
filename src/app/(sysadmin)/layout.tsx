import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/features/core/api/get-current-user';

interface SysAdminLayoutProps {
  children: React.ReactNode;
}

export default async function SysAdminLayout({ children }: SysAdminLayoutProps) {
  const user = await getCurrentUser();

  if (!user?.isSysAdmin) {
    redirect('/dashboard');
  }

  return <>{children}</>;
}