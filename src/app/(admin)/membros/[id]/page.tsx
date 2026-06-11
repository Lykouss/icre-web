import React from 'react';
import Link from 'next/link';
import { redirect, notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/features/core/api/get-current-user';
import { ProfileTabs } from '@/features/members/components/ProfileTabs';
import { canEditProfile, canManageConfidentialNotes } from '@/lib/rbac';
import { isValidUuid } from '@/lib/action-validators';

export default async function MemberProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const { id: memberId } = await params;

  if (!isValidUuid(memberId)) notFound();

  const supabase = await createClient();

  const { data: member, error } = await supabase
    .from('members')
    .select('*, cells(name)')
    .eq('id', memberId)
    .single();

  if (error || !member) notFound();

  const { data: cellsData } = await supabase
    .from('cells')
    .select('id, name')
    .order('name');

  const { data: logsData } = await supabase
    .from('audit_logs')
    .select('*')
    .eq('entity_name', 'members')
    .eq('entity_id', memberId)
    .order('created_at', { ascending: false });

  const { data: loggedInRoleData } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .single();

  const currentUserRole = loggedInRoleData?.role ?? (user.isSysAdmin ? 'SYSADMIN' : 'MEMBER');

  let targetUserRole = 'MEMBER';
  if (member.user_id) {
    const { data: targetRoleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', member.user_id)
      .single();
    if (targetRoleData) targetUserRole = targetRoleData.role;
  }

  const isSelf = user.id === member.user_id;
  const hasEditPermission = canEditProfile(currentUserRole, targetUserRole, isSelf);
  const canSeeNotes = canManageConfidentialNotes(currentUserRole);

  return (
    <div className="max-w-5xl mx-auto pb-12">
      <Link
        href="/membros"
        className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-slate-900 mb-6 transition-colors"
      >
        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Voltar para Lista
      </Link>

      <div className="bg-white dark:bg-slate-800 p-6 md:p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center gap-6 mb-6 relative overflow-hidden">
        {!hasEditPermission && (
          <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-amber-400 to-orange-500" />
        )}

        <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center text-3xl font-bold text-slate-400 border-4 border-white shadow-md shrink-0">
          {member.full_name.charAt(0).toUpperCase()}
        </div>

        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">{member.full_name}</h1>
            {!hasEditPermission && (
              <span
                className="inline-flex items-center px-2.5 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200 text-xs font-bold"
                title="Você não tem permissão para editar esta ficha."
              >
                Somente leitura
              </span>
            )}
          </div>
          <p className="text-slate-500 mt-1">{member.status}</p>
        </div>
      </div>

      <ProfileTabs
        member={member}
        cells={cellsData ?? []}
        logs={logsData ?? []}
        hasEditPermission={hasEditPermission}
        canSeeNotes={canSeeNotes}
      />
    </div>
  );
}