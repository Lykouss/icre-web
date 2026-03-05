import { getFeatureFlag } from '@/features/core/api/get-feature-flag';
import { getCurrentUser } from '@/features/core/api/get-current-user';
import { FeatureMaintenance } from '@/features/core/components/FeatureMaintenance';
import { NewMemberModal } from '@/features/members/components/NewMemberModal';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';

// 1. A Tipagem Oficial: Ensinamos ao TypeScript exatamente o que vem do banco (Sem "any"!)
interface MemberRecord {
  id: string;
  full_name: string;
  phone: string | null;
  status: string;
  // Como cada membro pertence a apenas 1 célula, o Supabase devolve um objeto simples (ou nulo)
  cells: { name: string } | null; 
}

export default async function MembrosPage() {
  const user = await getCurrentUser();
  const isActive = await getFeatureFlag('module_members', user);

  if (!isActive) {
    return <FeatureMaintenance featureName="Gestão de Membros" />;
  }

  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('members')
    .select(`
      id,
      full_name,
      phone,
      status,
      cells ( name )
    `)
    .order('full_name');

  if (error) {
    // 2. O truque do JSON.stringify: Força o terminal a ler o erro inteiro, em vez de mostrar "{}"
    console.error('Erro ao buscar membros:', JSON.stringify(error, null, 2));
  }

  // 3. Garantimos ao TypeScript que os dados respeitam a nossa interface
  const membersList = (data as unknown as MemberRecord[]) || [];

  // Busca as células ativas para alimentar o Modal
  const { data: cellsData } = await supabase.from('cells').select('id, name').order('name');
  const cellsList = cellsData || [];

  return (
    <div className="max-w-7xl mx-auto">
      
      {/* Cabeçalho e Ações Principais */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Secretaria e Membros</h1>
          <p className="text-slate-500 mt-1">Gira o registro de todas as pessoas da igreja e visitantes.</p>
        </div>

        {/* O nosso componente inteligente entra aqui! */}
        <NewMemberModal cells={cellsList} />
      </div>

      {/* Barra de Pesquisa e Filtros */}
      <div className="bg-white p-4 rounded-t-2xl border border-slate-200 border-b-0 flex flex-col sm:flex-row items-center gap-4">
        <div className="relative flex-1 w-full max-w-md">
          <svg className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
          </svg>
          <input 
            type="text" 
            placeholder="Pesquisar por nome ou contato..." 
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors text-sm"
          />
        </div>
        <button className="px-4 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl font-medium hover:bg-slate-50 transition-colors text-sm w-full sm:w-auto flex items-center justify-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"></path>
          </svg>
          Filtros
        </button>
      </div>

      {/* Tabela de Membros */}
      <div className="bg-white border border-slate-200 rounded-b-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                <th className="px-6 py-4">Nome Completo</th>
                <th className="px-6 py-4">Contato</th>
                <th className="px-6 py-4">Célula</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              
              {membersList.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 border border-slate-100">
                        <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path>
                        </svg>
                      </div>
                      <p className="text-lg font-bold text-slate-800">Nenhum membro encontrado</p>
                      <p className="text-sm mt-1 max-w-sm mx-auto">
                        A sua base de dados está limpa. Clique em &quot;Novo Registo&quot; no topo para adicionar a primeira pessoa da sua congregação.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                membersList.map((member) => (
                  <tr key={member.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-6 py-4 font-semibold text-slate-900">{member.full_name}</td>
                    <td className="px-6 py-4 text-slate-500">{member.phone || '—'}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 text-xs font-bold border border-blue-100">
                        {/* Agora o TypeScript sabe exatamente que 'cells' pode ser null ou ter um 'name' */}
                        {member.cells?.name || 'Sem Célula'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
                        member.status === 'Membro' ? 'bg-green-100 text-green-700' : 
                        member.status === 'Visitante' ? 'bg-amber-100 text-amber-700' : 
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {member.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link 
                        href={`/membros/${member.id}`}
                        className="inline-flex items-center text-blue-600 hover:text-blue-800 font-semibold text-sm transition-colors"
                      >
                        Ver Perfil
                        <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                        </svg>
                      </Link>
                    </td>
                  </tr>
                ))
              )}

            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}