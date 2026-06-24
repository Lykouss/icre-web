import type { Metadata } from 'next';
import { redirect, notFound } from 'next/navigation';
import { getCurrentUser } from '@/features/core/api/get-current-user';
import { getTicketWithMessages } from '@/features/support/actions/admin-support-actions';
import { AdminTicketView } from '@/features/support/components/AdminTicketView';

export const metadata: Metadata = {
  title: 'Chamado — Suporte Admin',
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminTicketPage({ params }: PageProps) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const result = await getTicketWithMessages(id);

  if (result.error || !result.data) {
    notFound();
  }

  const { ticket, messages, userInfo } = result.data;

  return (
    <div className="max-w-7xl mx-auto h-full">
      <AdminTicketView
        ticket={ticket}
        initialMessages={messages}
        userInfo={userInfo}
        adminUserId={user.id}
      />
    </div>
  );
}
