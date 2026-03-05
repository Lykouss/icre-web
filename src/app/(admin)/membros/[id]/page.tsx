import React from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/features/core/api/get-current-user';
import { ProfileTabs } from '@/features/members/components/ProfileTabs';

// Importamos a nossa função de segurança do arquivo que acabamos de criar
import { canEditProfile } from '@/lib/rbac';

export default async function MemberProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  // Desempacotamos o ID da URL (Next.js 15+)
  const resolvedParams = await params;
  const memberId = resolvedParams.id;

  const supabase = await createClient();

  // 1. Busca os dados do membro
  const { data: member, error } = await supabase
    .from('members')
    .select('*, cells(name)')
    .eq('id', memberId)
    .single();

  if (error) {
    console.error('Erro ao abrir o perfil:', JSON.stringify(error, null, 2));
    return (
      <div className="max-w-5xl mx-auto p-8">
        <div className="bg-red-50 text-red-600 p-6 rounded-2xl border border-red-200">
          <h2 className="text-xl font-bold mb-2">Ops! Ocorreu um erro ao buscar o perfil.</h2>
          <p>Dê uma olhada no terminal do seu VS Code para ver o motivo exato.</p>
          <pre className="mt-4 text-sm bg-red-100 p-4 rounded-xl overflow-x-auto">{JSON.stringify(error, null, 2)}</pre>
          <Link href="/membros" className="inline-block mt-4 underline font-semibold">Voltar para a lista</Link>
        </div>
      </div>
    );
  }

  if (!member) {
    return (
      <div className="max-w-5xl mx-auto p-8 text-center">
        <h2 className="text-xl font-bold text-slate-800">Membro não encontrado.</h2>
        <Link href="/membros" className="text-blue-600 underline mt-2 inline-block">Voltar</Link>
      </div>
    );
  }

  // 2. Busca as Células
  const { data: cellsData } = await supabase.from('cells').select('id, name').order('name');
  const cellsList = cellsData || [];

  // 3. Busca os Logs
  const { data: logsData, error: logsError } = await supabase
    .from('audit_logs')
    .select('*')
    .eq('entity_name', 'members')
    .eq('entity_id', memberId)
    .order('created_at', { ascending: false });
    
  if (logsError) {
    console.error('Erro ao LER os logs:', JSON.stringify(logsError, null, 2));
  }
  const logsList = logsData || [];

  // 4. A LÓGICA DE RBAC (Segurança Nível Máximo 🔒)
  
  // PRIMEIRO: Busca o cargo do visitante (usuário logado) na tabela user_roles
  const { data: loggedInRoleData } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .single();

  const currentUserRole = loggedInRoleData?.role || (user.isSysAdmin ? 'SYSADMIN' : 'MEMBER');
  
  // SEGUNDO: Busca o cargo da pessoa da ficha (se ela tiver um login vinculado)
  let targetUserRole = 'MEMBER'; // Padrão
  if (member.user_id) {
    const { data: targetRoleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', member.user_id)
      .single();
    
    if (targetRoleData) targetUserRole = targetRoleData.role;
  }
  
  // Verifica se o usuário logado está olhando a PRÓPRIA ficha
  const isSelf = user.id === member.user_id;
  
  // Passamos pela nossa matriz rigorosa
  const { canEditProfile, canManageConfidentialNotes } = await import('@/lib/rbac');
  
  const hasEditPermission = canEditProfile(currentUserRole, targetUserRole, isSelf);
  const canSeeNotes = canManageConfidentialNotes(currentUserRole);

  // LOG PARA DEPURAR (Olhe no terminal do VS Code)
  console.log(`🛡️ RBAC -> Visitante: ${currentUserRole} | Alvo: ${targetUserRole} | Editar? ${hasEditPermission} | Notas? ${canSeeNotes}`);

  return (
    <div className="max-w-5xl mx-auto pb-12">
      {/* Botão Voltar */}
      <Link href="/membros" className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-slate-900 mb-6 transition-colors">
        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
        Voltar para Lista
      </Link>

      {/* Cabeçalho do Perfil (Fixo) */}
      <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center gap-6 mb-6 relative overflow-hidden">
        
        {!hasEditPermission && (
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-400 to-orange-500"></div>
        )}

        <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center text-3xl font-bold text-slate-400 border-4 border-white shadow-md flex-shrink-0">
          {member.full_name.charAt(0).toUpperCase()}
        </div>
        
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">{member.full_name}</h1>
            
            {!hasEditPermission && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200 text-xs font-bold" title="Você não tem permissão para editar esta ficha.">
                <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
                Somente Leitura
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-slate-500">
            <span className="flex items-center gap-1">
              <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path></svg>
              {member.phone || 'Sem contato'}
            </span>
            <span className="text-slate-300">•</span>
            <span className="flex items-center gap-1 font-medium text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-100">
              {member.cells?.name || 'Sem Célula'}
            </span>
          </div>
        </div>

        {/* Badge de Cargo (Atualizado para as novas cores e nomes) */}
        <div className={`px-4 py-2 text-white text-xs font-bold uppercase tracking-wider rounded-lg shadow-sm ${
          targetUserRole === 'SYSADMIN' ? 'bg-purple-600' :
          targetUserRole === 'CHURCH_ADMIN' ? 'bg-blue-600' : 
          targetUserRole === 'FINANCE_ADMIN' ? 'bg-emerald-600' : 
          targetUserRole === 'LEADER' ? 'bg-amber-600' : 'bg-slate-900'
        }`}>
          {targetUserRole.replace('_', ' ')}
        </div>
      </div>

      <ProfileTabs 
        member={member} 
        cells={cellsList} 
        logs={logsList} 
        hasEditPermission={hasEditPermission} 
        canSeeNotes={canSeeNotes}
      />
    </div>
  );
}