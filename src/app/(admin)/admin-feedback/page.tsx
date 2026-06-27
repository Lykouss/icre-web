import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/features/core/api/get-current-user';
import { AdminFeedbackDashboard } from '@/features/support/components/AdminFeedbackDashboard';

export const metadata: Metadata = {
  title: 'Feedbacks — Painel Admin | SIGE',
  description: 'Gerencie sugestões e relatos de bugs enviados pelos membros.',
};

const ALLOWED_ROLES = ['SYSADMIN', 'CHURCH_ADMIN', 'SUPPORT_ADMIN'];

export default async function AdminFeedbackPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  if (!user.roles.some(r => ALLOWED_ROLES.includes(r))) redirect('/dashboard');

  const isSysAdmin = user.roles.includes('SYSADMIN');

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.2)' }}
          >
            <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--admin-text-primary)' }}>
            Feedbacks & Bugs
          </h1>
        </div>
        <p className="text-sm text-slate-500 ml-12">
          Sugestões e relatos de bugs enviados pelos membros.
          {!isSysAdmin && ' Apenas SYSADMIN pode remover feedbacks permanentemente.'}
        </p>
      </div>

      <AdminFeedbackDashboard isSysAdmin={isSysAdmin} />
    </div>
  );
}
