'use client'

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { updateMemberGeneral } from '@/features/members/actions/update-member';
import { updateMemberNotes } from '@/features/members/actions/update-member-notes';
import { updateMemberSpiritual } from '@/features/members/actions/update-member-spiritual';
import { updateMemberMinistries } from '@/features/members/actions/update-member-ministries';

// --- INTERFACES ---
export interface MemberProfileData {
  id: string;
  full_name: string;
  phone: string | null;
  status: string;
  notes: string | null;
  cells: { name: string } | null;
  cell_id?: string | null;
  email?: string | null;
  birth_date?: string | null;
  gender?: string | null;
  marital_status?: string | null;
  address?: string | null;
  baptism_date?: string | null;
  encounter_completed?: boolean;
  ministries?: string[];
  discipleship_completed?: boolean;
}

interface Cell {
  id: string;
  name: string;
}

interface AuditLog {
  id: string;
  action: string;
  actor_name: string;
  actor_email?: string;
  actor_role?: string;
  created_at: string;
}

interface ProfileTabsProps {
  member: MemberProfileData;
  cells: Cell[];
  logs?: AuditLog[];
  hasEditPermission: boolean;
  canSeeNotes: boolean;
}

// --- COMPONENTE PRINCIPAL ---
export function ProfileTabs({ member, cells, logs = [], hasEditPermission, canSeeNotes }: ProfileTabsProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('geral');
  
  // Estados - Dados Gerais
  const [isPending, startTransition] = useTransition();
  const [phoneValue, setPhoneValue] = useState(member.phone || '');

  // Estados - Trilha Espiritual
  const [isPendingSpiritual, startTransitionSpiritual] = useTransition();

  // Estados - Ministérios
  const [selectedMinistries, setSelectedMinistries] = useState<string[]>(member.ministries || []);
  const [isPendingMinistries, startTransitionMinistries] = useTransition();

  // Estados - Anotações
  const [notesValue, setNotesValue] = useState(member.notes || '');
  const [isPendingNotes, startTransitionNotes] = useTransition();

  // Estados - Logs (Filtros e Paginação)
  const [logSearch, setLogSearch] = useState('');
  const [logFilter, setLogFilter] = useState('ALL');
  const [logLimit, setLogLimit] = useState(5);

  // Lista fixa de ministérios
  const availableMinistries = [
    { id: 'Louvor', icon: '🎵', desc: 'Música e adoração' },
    { id: 'Kids', icon: '🧸', desc: 'Ministério infantil' },
    { id: 'Recepção', icon: '🤝', desc: 'Acolhimento e boas-vindas' },
    { id: 'Comunicação', icon: '📸', desc: 'Mídias sociais e fotos' },
    { id: 'Intercessão', icon: '🙏', desc: 'Grupo de oração' },
    { id: 'Diaconato', icon: '🛡️', desc: 'Ordem e serviço' },
    { id: 'Sonoplastia', icon: '🎛️', desc: 'Áudio, vídeo e projeção' },
    { id: 'Dança', icon: '💃', desc: 'Artes e expressão corporal' },
  ];

  // --- HANDLERS (Funções de Ação) ---
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length <= 11) {
      value = value.replace(/^(\d{2})(\d)/g, '($1) $2');
      value = value.replace(/(\d)(\d{4})$/, '$1-$2');
    }
    if (value.length > 15) value = value.substring(0, 15);
    setPhoneValue(value);
  };

  const toggleMinistry = (ministryId: string) => {
    // Trava de segurança no clique do Div
    if (!hasEditPermission) return; 

    setSelectedMinistries(prev => 
      prev.includes(ministryId) 
        ? prev.filter(m => m !== ministryId) 
        : [...prev, ministryId]
    );
  };

  const handleGeneralSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    if (phoneValue && phoneValue.length < 14) {
      alert('Por favor, digite um número de WhatsApp válido com DDD.');
      return;
    }
    
    startTransition(async () => {
      const result = await updateMemberGeneral(member.id, formData);
      if (result.error) alert(result.error);
      else router.refresh();
    });
  };

  const handleSpiritualSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransitionSpiritual(async () => {
      const result = await updateMemberSpiritual(member.id, formData);
      if (result.error) alert(result.error);
      else {
        router.refresh();
        alert('Trilha espiritual atualizada!');
      }
    });
  };

  const handleMinistriesSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    startTransitionMinistries(async () => {
      const result = await updateMemberMinistries(member.id, selectedMinistries);
      if (result.error) alert(result.error);
      else {
        router.refresh();
        alert('Ministérios atualizados com sucesso!');
      }
    });
  };

  const handleNotesSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    startTransitionNotes(async () => {
      const result = await updateMemberNotes(member.id, notesValue);
      if (result.error) alert(result.error);
      else {
        router.refresh(); 
        alert('Anotações salvas com segurança!');
      }
    });
  };

  // --- LÓGICA DOS LOGS ---
  const filteredLogs = logs.filter((log) => {
    const matchesSearch = log.actor_name.toLowerCase().includes(logSearch.toLowerCase()) || 
                          (log.actor_email && log.actor_email.toLowerCase().includes(logSearch.toLowerCase()));
    const matchesFilter = logFilter === 'ALL' || log.action === logFilter;
    return matchesSearch && matchesFilter;
  });
  const displayedLogs = filteredLogs.slice(0, logLimit);

  // --- CONFIGURAÇÃO DAS ABAS ---
  const tabs = [
    { id: 'geral', label: 'Dados Gerais', show: true },
    { id: 'espiritual', label: 'Trilha Espiritual', show: true },
    { id: 'ministerios', label: 'Ministérios e Escalas', show: true },
    { id: 'anotacoes', label: 'Anotações (Privado)', show: canSeeNotes },
    { id: 'logs', label: 'Histórico (Logs)', show: canSeeNotes },
  ];

  return (
    <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
      
      {/* NAVEGAÇÃO DAS ABAS */}
      <div className="flex overflow-x-auto border-b border-slate-200 custom-scrollbar">
        {tabs.map((tab) => {
          if (!tab.show) return null;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-4 text-sm font-semibold whitespace-nowrap transition-colors border-b-2 ${
                activeTab === tab.id ? 'border-blue-600 text-blue-600 bg-blue-50/50' : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="p-6 md:p-8 bg-slate-50 min-h-[400px]">
        
        {/* ================= ABA 1: DADOS GERAIS ================= */}
        {activeTab === 'geral' && (
          <div className="animate-in fade-in duration-300 max-w-3xl">
            <form onSubmit={handleGeneralSubmit}>
              <fieldset disabled={!hasEditPermission} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Nome Completo *</label>
                    <input type="text" name="fullName" defaultValue={member.full_name} required className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-slate-100 disabled:text-slate-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">E-mail</label>
                    <input type="email" name="email" defaultValue={member.email || ''} placeholder="exemplo@email.com" className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-slate-100 disabled:text-slate-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Contato (WhatsApp)</label>
                    <input type="text" name="phone" value={phoneValue} onChange={handlePhoneChange} placeholder="(XX) XXXXX-XXXX" className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-slate-100 disabled:text-slate-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Data de Nascimento</label>
                    <input type="date" name="birthDate" defaultValue={member.birth_date || ''} className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-slate-100 disabled:text-slate-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Gênero</label>
                    <select name="gender" defaultValue={member.gender || ''} className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-slate-100 disabled:text-slate-500">
                      <option value="">Não informado</option>
                      <option value="Masculino">Masculino</option>
                      <option value="Feminino">Feminino</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Estado Civil</label>
                    <select name="maritalStatus" defaultValue={member.marital_status || ''} className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-slate-100 disabled:text-slate-500">
                      <option value="">Não informado</option>
                      <option value="Solteiro(a)">Solteiro(a)</option>
                      <option value="Casado(a)">Casado(a)</option>
                      <option value="Divorciado(a)">Divorciado(a)</option>
                      <option value="Viúvo(a)">Viúvo(a)</option>
                    </select>
                  </div>
                </div>

                <div className="border-t border-slate-200 pt-6 mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Status na Igreja</label>
                    <select name="status" defaultValue={member.status} className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-slate-100 disabled:text-slate-500">
                      <option value="Visitante">Visitante</option>
                      <option value="Congregante">Congregante</option>
                      <option value="Membro">Membro</option>
                      <option value="Afastado">Afastado</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Célula Atual</label>
                    <select name="cellId" defaultValue={member.cell_id || ''} className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-slate-100 disabled:text-slate-500">
                      <option value="">Nenhuma</option>
                      {cells.map(cell => (
                        <option key={cell.id} value={cell.id}>{cell.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {hasEditPermission && (
                  <div className="flex justify-end pt-4">
                    <button type="submit" disabled={isPending} className="px-6 py-2.5 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center shadow-sm hover:shadow-md">
                      {isPending ? 'Salvando...' : 'Salvar Alterações'}
                    </button>
                  </div>
                )}
              </fieldset>
            </form>
          </div>
        )}

        {/* ================= ABA 2: TRILHA ESPIRITUAL ================= */}
        {activeTab === 'espiritual' && (
          <div className="animate-in fade-in duration-300 max-w-3xl">
            <div className="mb-6">
              <h3 className="text-lg font-bold text-slate-800">Trilha Espiritual</h3>
              <p className="text-sm text-slate-500">Acompanhe a jornada de consolidação e maturidade do membro.</p>
            </div>

            <form onSubmit={handleSpiritualSubmit} className="bg-white p-6 md:p-8 rounded-2xl border border-slate-200 shadow-sm">
              <fieldset disabled={!hasEditPermission} className="space-y-6">
                <div className="max-w-md">
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Data de Batismo nas Águas</label>
                  <input 
                    type="date" 
                    name="baptismDate" 
                    defaultValue={member.baptism_date || ''} 
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-slate-700 disabled:bg-slate-100 disabled:text-slate-400" 
                  />
                </div>

                <div className="w-full h-px bg-slate-100 my-6"></div>

                <div className="space-y-4">
                  <label className={`flex items-start gap-3 p-4 border border-slate-200 rounded-xl transition-colors ${hasEditPermission ? 'hover:bg-slate-50 cursor-pointer' : 'opacity-70 cursor-not-allowed'}`}>
                    <div className="flex items-center h-6">
                      <input 
                        type="checkbox" 
                        name="encounterCompleted" 
                        defaultChecked={member.encounter_completed}
                        className="w-5 h-5 text-blue-600 bg-slate-100 border-slate-300 rounded focus:ring-blue-500 disabled:opacity-50" 
                      />
                    </div>
                    <div>
                      <span className="block font-semibold text-slate-800">Encontro com Deus</span>
                      <span className="block text-sm text-slate-500">Participou do retiro espiritual de consolidação.</span>
                    </div>
                  </label>

                  <label className={`flex items-start gap-3 p-4 border border-slate-200 rounded-xl transition-colors ${hasEditPermission ? 'hover:bg-slate-50 cursor-pointer' : 'opacity-70 cursor-not-allowed'}`}>
                    <div className="flex items-center h-6">
                      <input 
                        type="checkbox" 
                        name="discipleshipCompleted" 
                        defaultChecked={member.discipleship_completed}
                        className="w-5 h-5 text-blue-600 bg-slate-100 border-slate-300 rounded focus:ring-blue-500 disabled:opacity-50" 
                      />
                    </div>
                    <div>
                      <span className="block font-semibold text-slate-800">Curso de Discipulado</span>
                      <span className="block text-sm text-slate-500">Concluiu as classes fundamentais da igreja.</span>
                    </div>
                  </label>
                </div>

                {hasEditPermission && (
                  <div className="flex justify-end pt-4">
                    <button type="submit" disabled={isPendingSpiritual} className="px-6 py-2.5 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center shadow-sm">
                      {isPendingSpiritual ? 'Salvando...' : 'Salvar Trilha'}
                    </button>
                  </div>
                )}
              </fieldset>
            </form>
          </div>
        )}

        {/* ================= ABA 3: MINISTÉRIOS ================= */}
        {activeTab === 'ministerios' && (
          <div className="animate-in fade-in duration-300 max-w-4xl">
            <div className="mb-6">
              <h3 className="text-lg font-bold text-slate-800">Atuação na Igreja</h3>
              <p className="text-sm text-slate-500">Selecione os ministérios e departamentos onde o membro serve atualmente.</p>
            </div>

            <form onSubmit={handleMinistriesSubmit} className="bg-white p-6 md:p-8 rounded-2xl border border-slate-200 shadow-sm">
              <fieldset disabled={!hasEditPermission}>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                  {availableMinistries.map((min) => {
                    const isSelected = selectedMinistries.includes(min.id);
                    return (
                      <div 
                        key={min.id}
                        onClick={() => toggleMinistry(min.id)}
                        className={`relative flex items-start gap-4 p-4 rounded-xl border-2 transition-all ${
                          !hasEditPermission ? 'cursor-not-allowed opacity-75' : 'cursor-pointer hover:border-blue-300 hover:bg-slate-50'
                        } ${isSelected ? 'border-blue-600 bg-blue-50/50 shadow-sm' : 'border-slate-200'}`}
                      >
                        <div className="text-2xl mt-1">{min.icon}</div>
                        <div>
                          <span className={`block font-bold ${isSelected ? 'text-blue-900' : 'text-slate-800'}`}>{min.id}</span>
                          <span className="block text-xs text-slate-500 mt-0.5">{min.desc}</span>
                        </div>
                        {isSelected && (
                          <div className="absolute top-3 right-3 text-blue-600">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="flex justify-between items-center pt-6 border-t border-slate-100">
                  <p className="text-sm font-medium text-slate-500">
                    {selectedMinistries.length} ministério(s) selecionado(s)
                  </p>
                  {hasEditPermission && (
                    <button type="submit" disabled={isPendingMinistries} className="px-6 py-2.5 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center shadow-sm">
                      {isPendingMinistries ? 'Salvando...' : 'Salvar Ministérios'}
                    </button>
                  )}
                </div>
              </fieldset>
            </form>
          </div>
        )}
        
        {/* ================= ABA 4: ANOTAÇÕES ================= */}
        {activeTab === 'anotacoes' && canSeeNotes && (
          <div className="animate-in fade-in duration-300 max-w-3xl">
            <h3 className="text-lg font-bold text-slate-800 mb-4">Anotações Confidenciais</h3>
            <p className="text-sm text-slate-500 mb-6 border-l-4 border-amber-400 pl-3 bg-amber-50 py-2 rounded-r-lg">
              <strong>Área Restrita:</strong> Apenas a liderança tem acesso a esta secção. Utilize para registrar acompanhamentos, histórico pastoral ou conselhos importantes.
            </p>
            
            <form onSubmit={handleNotesSubmit}>
              <fieldset disabled={!hasEditPermission}>
                <textarea 
                  className="w-full h-48 p-4 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none resize-none custom-scrollbar disabled:bg-slate-100 disabled:text-slate-500"
                  placeholder="Ex: Em acompanhamento familiar devido a..."
                  value={notesValue}
                  onChange={(e) => setNotesValue(e.target.value)}
                />
                {hasEditPermission && (
                  <div className="mt-4 flex justify-end">
                    <button type="submit" disabled={isPendingNotes} className="bg-slate-900 text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-slate-800 transition-colors disabled:opacity-50 flex items-center shadow-sm">
                      {isPendingNotes ? 'Guardando...' : 'Salvar Anotação'}
                    </button>
                  </div>
                )}
              </fieldset>
            </form>
          </div>
        )}

        {/* ================= ABA 5: LOGS ================= */}
        {activeTab === 'logs' && canSeeNotes && (
          <div className="animate-in fade-in duration-300 max-w-4xl">
            <div className="mb-6">
              <h3 className="text-lg font-bold text-slate-800">Audit Trail (Histórico)</h3>
              <p className="text-sm text-slate-500">Rastreio completo e seguro de todas as alterações.</p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 mb-6 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
              <input 
                type="text" 
                placeholder="Pesquisar por nome ou e-mail..." 
                value={logSearch}
                onChange={(e) => setLogSearch(e.target.value)}
                className="flex-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <select 
                value={logFilter}
                onChange={(e) => setLogFilter(e.target.value)}
                className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="ALL">Todas as Ações</option>
                <option value="CREATE">Apenas Criação</option>
                <option value="UPDATE">Apenas Edições</option>
              </select>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-6">
              {displayedLogs.length === 0 ? (
                <p className="text-slate-500 text-sm text-center py-4">Nenhum registo encontrado com estes filtros.</p>
              ) : (
                <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent">
                  {displayedLogs.map((log) => {
                    const dataFormatada = new Intl.DateTimeFormat('pt-BR', {
                      day: '2-digit', month: '2-digit', year: 'numeric',
                      hour: '2-digit', minute: '2-digit'
                    }).format(new Date(log.created_at));

                    const isCreate = log.action === 'CREATE';

                    return (
                      <div key={log.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                        <div className={`flex items-center justify-center w-10 h-10 rounded-full border-4 border-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 ${
                          isCreate ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'
                        }`}>
                          {isCreate ? (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
                          ) : (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                          )}
                        </div>
                        
                        <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border border-slate-200 bg-slate-50 shadow-sm hover:shadow-md transition-shadow">
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <span className="font-bold text-slate-800 text-sm">{log.actor_name}</span>
                              <span className="ml-2 inline-block px-2 py-0.5 bg-slate-200 text-slate-600 text-xs rounded-md font-semibold">
                                {log.actor_role || 'Desconhecido'}
                              </span>
                            </div>
                            <span className="text-xs font-medium text-slate-400">{dataFormatada}</span>
                          </div>
                          <p className="text-xs text-slate-500 mb-2 truncate" title={log.actor_email || ''}>
                            {log.actor_email || 'Sem e-mail registado'}
                          </p>
                          <p className="text-sm text-slate-700 bg-white p-2 rounded border border-slate-100">
                            {isCreate ? 'Criou a ficha no sistema.' : 
                             (log.action === 'UPDATE_NOTES' ? 'Atualizou as anotações confidenciais.' : 
                             (log.action === 'UPDATE_SPIRITUAL' ? 'Atualizou a trilha espiritual (Batismo/Cursos).' : 
                             (log.action === 'UPDATE_MINISTRIES' ? 'Atualizou as áreas de atuação (Ministérios).' : 
                             'Atualizou os dados gerais da ficha.')))}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {filteredLogs.length > logLimit && (
                <div className="mt-8 flex justify-center">
                  <button 
                    onClick={() => setLogLimit(prev => prev + 5)}
                    className="px-6 py-2 bg-white border border-slate-300 text-slate-700 font-semibold rounded-full hover:bg-slate-50 hover:text-blue-600 transition-colors shadow-sm"
                  >
                    Ver logs mais antigos...
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}