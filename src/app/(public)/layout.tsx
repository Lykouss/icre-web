import { PublicNavbar } from '@/features/portal/components/PublicNavbar';
import { PublicFooter } from '@/features/portal/components/PublicFooter';

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <PublicNavbar />
      <div className="pt-16 flex-1">
        {children}
      </div>
      <PublicFooter />
    </div>
  );
}