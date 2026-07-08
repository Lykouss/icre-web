import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/features/core/api/get-current-user';
import { AdminMemberRow } from '@/features/members/components/types';
import { AdminMemberPanel } from '@/features/members/components/AdminMemberPanel';

export default async function AdminMemberPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  const user = await getCurrentUser();
  const hasAccess = user?.isSysAdmin || user?.roles.some(r => ['CHURCH_ADMIN'].includes(r));
  if (!hasAccess) {
    const { redirect } = await import('next/navigation');
    redirect('/dashboard');
  }

  const supabase = await createClient();

  // Try to find the member
  const { data, error } = await supabase
    .from('admin_users_view')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) {
    notFound();
  }

  const member = data as AdminMemberRow;

  return (
    <div className="max-w-5xl mx-auto pb-24">
      <AdminMemberPanel member={member} currentUserIsSysAdmin={!!user?.isSysAdmin} currentUserId={user!.id} />
    </div>
  );
}