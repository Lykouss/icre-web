import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/features/core/api/get-current-user';
import { getAllTickets } from '@/features/support/actions/admin-support-actions';
import { AdminSupportDashboard } from '@/features/support/components/AdminSupportDashboard';
import type { TicketWithUser } from '@/features/support/types';

export const metadata: Metadata = {
  title: 'Suporte — Painel Admin',
};

export default async function AdminSuportePage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const result = await getAllTickets();
  const tickets: TicketWithUser[] = result.data ?? [];

  const openCount = tickets.filter(t => t.status !== 'closed').length;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(37,99,235,0.12)', border: '1px solid rgba(37,99,235,0.2)' }}
          >
            <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z"/>
            </svg>
          </div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--admin-text-primary)' }}>
            Central de Suporte
          </h1>
          {openCount > 0 && (
            <span
              className="text-[10px] font-bold px-2 py-1 rounded-lg"
              style={{ background: 'rgba(37,99,235,0.1)', color: '#93c5fd', border: '1px solid rgba(37,99,235,0.2)' }}
            >
              {openCount} aberto{openCount !== 1 ? 's' : ''}
            </span>
          )}
        </div>
        <p className="text-sm max-w-2xl" style={{ color: 'var(--admin-text-secondary)' }}>
          Gerencie e responda aos chamados abertos pelos usuários.
        </p>
      </div>

      <AdminSupportDashboard tickets={tickets} />
    </div>
  );
}
