'use client'

import { usePathname } from 'next/navigation';
import { PublicNavbar } from '@/features/portal/components/PublicNavbar';

const STANDALONE_PREFIXES = ['/login', '/cadastro', '/criar-pin'];

interface NavUser {
  fullName: string;
  photoUrl: string | null;
  isAdmin: boolean;
}

interface Props {
  navUser: NavUser | null;
  children: React.ReactNode;
}

export default function LayoutShell({ navUser, children }: Props) {
  const pathname = usePathname();
  const standalone = STANDALONE_PREFIXES.some(
    p => pathname === p || pathname.startsWith(p + '/')
  );

  if (standalone) {
    return <>{children}</>;
  }

  return (
    <>
      <PublicNavbar user={navUser} />
      {children}
    </>
  );
}