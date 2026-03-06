'use client'

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { updateMemberGeneral } from '@/features/members/actions/update-member';
import { updateMemberNotes } from '@/features/members/actions/update-member-notes';
import { updateMemberSpiritual } from '@/features/members/actions/update-member-spiritual';
import { updateMemberMinistries } from '@/features/members/actions/update-member-ministries';
import { useToast } from '@/features/core/components/ToastContext';

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

const availableMinistries = [
  { id: 'Louvor',       icon: '🎵', desc: 'Música e adoração' },
  { id: 'Kids',         icon: '🧸', desc: 'Ministério infantil' },
  { id: 'Recepção',     icon: '🤝', desc: 'Acolhimento e boas-vindas' },
  { id: 'Comunicação',  icon: '📸', desc: 'Mídias sociais e fotos' },
  { id: 'Intercessão',  icon: '🙏', desc: 'Grupo de oração' },
  { id: 'Diaconato',    icon: '🛡️', desc: 'Ordem e serviço' },
  { id: 'Sonoplastia',  icon: '🎛️', desc: 'Áudio, vídeo e projeção' },
  { id: 'Dança',        icon: '💃', desc: 'Artes e expressão corporal' },
];

export function ProfileTabs({ member, cells, logs = [], hasEditPermission, canSeeNotes }: ProfileTabsProps) {
  const router = useRouter();
  const { toast, dismiss } = useToast();

  const [activeTab, setActiveTab] = useState('geral');

  const [isPending, startTransition] = useTransition();
  const [isPendingSpiritual, startTransitionSpiritual] = useTransition();
  const [isPendingMinistries, startTransitionMinistries] = useTransition();
  const [isPendingNotes, startTransitionNotes] = useTransition();

  const [phoneValue, setPhoneValue] = useState(member.phone ?? '');
  const [selectedMinistries, setSelectedMinistries] = useState<string[]>(member.ministries ?? []);
  const [notesValue, setNotesValue] = useState(member.notes ?? '');

  const [logSearch, setLogSearch] = useState('');
  const [logFilter, setLogFilter] = useState('ALL');
  const [logLimit, setLogLimit] = useState(5);

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
    if (!hasEditPermission) return;
    setSelectedMinistries(prev =>
      prev.includes(ministryId) ? prev.filter(m => m !== ministryId) : [...prev, ministryId]
    );
  };

  const handleGeneralSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (phoneValue && phoneValue.length < 14) {
      toast('error', 'Digite um número de WhatsApp válido com DDD.');
      return;
    }
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const loadingId = toast('loading', 'Salvando dados gerais...');
      const result = await updateMemberGeneral(member.id, formData);
      dismiss(loadingId);
      if (result.error) toast('error', result.error);
      else {
        toast('success', 'Dados atualizados com sucesso!');
        router.refresh();
      }
    });
  };

  const handleSpiritualSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransitionSpiritual(async () => {
      const loadingId = toast('loading', 'Salvando trilha espiritual...');
      const result = await updateMemberSpiritual(member.id, formData);
      dismiss(loadingId);
      if (result.error) toast('error', result.error);
      else {
        toast('success', 'Trilha espiritual atualizada!');
        router.refresh();
      }
    });
  };

  const handleMinistriesSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    startTransitionMinistries(async () => {
      const loadingId = toast('loading', 'Salvando ministérios...');
      const result = await updateMemberMinistries(member.id, selectedMinistries);
      dismiss(loadingId);
      if (result.error) toast('error', result.error);
      else {
        toast('success', 'Ministérios atualizados!');
        router.refresh();
      }
    });
  };

  const handleNotesSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    startTransitionNotes(async () => {
      const loadingId = toast('loading', 'Salvando anotações...');
      const result = await updateMemberNotes(member.id, notesValue);
      dismiss(loadingId);
      if (result.error) toast('error', result.error);
      else {
        toast('success', 'Anotações salvas com segurança!');
        router.refresh();
      }
    });
  };

  const tabs = [
    { id: 'geral',      label: 'Dados Gerais' },
    { id: 'espiritual', label: 'Trilha Espiritual' },
    { id: 'ministerios',label: 'Ministérios' },
    ...(canSeeNotes ? [
      { id: 'anotacoes', label: 'Anotações' },
      { id: 'logs',      label: 'Histórico' },
    ] : []),
  ];

  const filteredLogs = logs.filter(log => {
    const term = logSearch.toLowerCase();
    const matchesSearch =
      !term ||
      log.actor_name.toLowerCase().includes(term) ||
      log.action.toLowerCase().includes(term);
    const matchesFilter =
      logFilter === 'ALL' ||
      (logFilter === 'CREATE' && log.action.includes('CREATE')) ||
      (logFilter === 'UPDATE' && log.action.includes('UPDATE'));
    return matchesSearch && matchesFilter;
  });

  const displayedLogs = filteredLogs.slice(0, logLimit);

  const inputClass = 'w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-slate-100 disabled:text-slate-500';
  const saveButtonClass = 'bg-slate-900 text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-slate-800 transition-colors disabled:opacity-50 flex items-center gap-2 shadow-sm';

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="flex border-b border-slate-200 overflow-x-auto">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-5 py-3.5 text-sm font-semibold whitespace-nowrap border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-blue-600 text-blue-600 bg-blue-50/50'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="p-6 md:p-8 bg-slate-50 min-h-[400px]">

        {/* ABA DADOS GERAIS */}
        {activeTab === 'geral' && (
          <div className="animate-in fade-in duration-300 max-w-3xl">
            <form onSubmit={handleGeneralSubmit}>
              <fieldset disabled={!hasEditPermission} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Nome Completo *</label>
                    <input type="text" name="fullName" defaultValue={member.full_name} required className={inputClass} />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">E-mail</label>
                    <input type="email" name="email" defaultValue={member.email ?? ''} placeholder="exemplo@email.com" className={inputClass} />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Contato (WhatsApp)</label>
                    <input type="text" name="phone" value={phoneValue} onChange={handlePhoneChange} placeholder="(XX) XXXXX-XXXX" className={inputClass} />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Data de Nascimento</label>
                    <input type="date" name="birthDate" defaultValue={member.birth_date ?? ''} className={inputClass} />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Gênero</label>
                    <select name="gender" defaultValue={member.gender ?? ''} className={inputClass}>
                      <option value="">Não informado</option>
                      <option value="Masculino">Masculino</option>
                      <option value="Feminino">Feminino</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Estado Civil</label>
                    <select name="maritalStatus" defaultValue={member.marital_status ?? ''} className={inputClass}>
                      <option value="">Não informado</option>
                      <option value="Solteiro(a)">Solteiro(a)</option>
                      <option value="Casado(a)">Casado(a)</option>
                      <option value="Divorciado(a)">Divorciado(a)</option>
                      <option value="Viúvo(a)">Viúvo(a)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Status</label>
                    <select name="status" defaultValue={member.status} className={inputClass}>
                      <option value="Visitante">Visitante</option>
                      <option value="Membro">Membro</option>
                      <option value="Inativo">Inativo</option>
                      <option value="Afastado">Afastado</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Célula</label>
                    <select name="cellId" defaultValue={member.cell_id ?? ''} className={inputClass}>
                      <option value="">Nenhuma</option>
                      {cells.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Endereço</label>
                  <input
                    type="text"
                    name="address"
                    defaultValue={member.address ?? ''}
                    placeholder="Rua, número, bairro, cidade..."
                    className={inputClass}
                  />
                </div>

                {hasEditPermission && (
                  <div className="flex justify-end pt-2">
                    <button type="submit" disabled={isPending} className={saveButtonClass}>
                      {isPending && (
                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                        </svg>
                      )}
                      {isPending ? 'Salvando...' : 'Salvar Alterações'}
                    </button>
                  </div>
                )}
              </fieldset>
            </form>
          </div>
        )}

        {/* ABA TRILHA ESPIRITUAL */}
        {activeTab === 'espiritual' && (
          <div className="animate-in fade-in duration-300 max-w-3xl">
            <form onSubmit={handleSpiritualSubmit}>
              <fieldset disabled={!hasEditPermission} className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Data de Batismo</label>
                  <input type="date" name="baptismDate" defaultValue={member.baptism_date ?? ''} className={inputClass} />
                </div>
                <div className="space-y-3">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" name="encounterCompleted" defaultChecked={member.encounter_completed} className="w-5 h-5 rounded accent-blue-600" />
                    <span className="text-sm font-semibold text-slate-700">Encontro com Deus realizado</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" name="discipleshipCompleted" defaultChecked={member.discipleship_completed} className="w-5 h-5 rounded accent-blue-600" />
                    <span className="text-sm font-semibold text-slate-700">Discipulado concluído</span>
                  </label>
                </div>
                {hasEditPermission && (
                  <div className="flex justify-end pt-2">
                    <button type="submit" disabled={isPendingSpiritual} className={saveButtonClass}>
                      {isPendingSpiritual && (
                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                        </svg>
                      )}
                      {isPendingSpiritual ? 'Salvando...' : 'Salvar Trilha'}
                    </button>
                  </div>
                )}
              </fieldset>
            </form>
          </div>
        )}

        {/* ABA MINISTÉRIOS */}
        {activeTab === 'ministerios' && (
          <div className="animate-in fade-in duration-300 max-w-3xl">
            <form onSubmit={handleMinistriesSubmit}>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                {availableMinistries.map(m => {
                  const isSelected = selectedMinistries.includes(m.id);
                  return (
                    <div
                      key={m.id}
                      onClick={() => toggleMinistry(m.id)}
                      className={`relative p-4 rounded-2xl border-2 text-center transition-all cursor-pointer select-none ${
                        !hasEditPermission ? 'cursor-default opacity-70' : ''
                      } ${
                        isSelected
                          ? 'border-blue-500 bg-blue-50 shadow-sm'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      {isSelected && (
                        <span className="absolute top-2 right-2 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                          <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                          </svg>
                        </span>
                      )}
                      <div className="text-2xl mb-1">{m.icon}</div>
                      <p className="text-xs font-bold text-slate-700">{m.id}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{m.desc}</p>
                    </div>
                  );
                })}
              </div>
              {hasEditPermission && (
                <div className="flex justify-end">
                  <button type="submit" disabled={isPendingMinistries} className={saveButtonClass}>
                    {isPendingMinistries && (
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                      </svg>
                    )}
                    {isPendingMinistries ? 'Salvando...' : 'Salvar Ministérios'}
                  </button>
                </div>
              )}
            </form>
          </div>
        )}

        {/* ABA ANOTAÇÕES */}
        {activeTab === 'anotacoes' && canSeeNotes && (
          <div className="animate-in fade-in duration-300 max-w-3xl">
            <div className="mb-4">
              <h3 className="text-base font-bold text-slate-800">Anotações Confidenciais</h3>
              <p className="text-sm text-slate-500 mt-0.5">Visível apenas para liderança. Registre acompanhamentos e histórico pastoral.</p>
            </div>
            <form onSubmit={handleNotesSubmit}>
              <fieldset disabled={!hasEditPermission}>
                <textarea
                  className="w-full h-48 p-4 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none resize-none disabled:bg-slate-100 disabled:text-slate-500"
                  placeholder="Ex: Em acompanhamento familiar devido a..."
                  value={notesValue}
                  onChange={e => setNotesValue(e.target.value)}
                />
                {hasEditPermission && (
                  <div className="mt-4 flex justify-end">
                    <button type="submit" disabled={isPendingNotes} className={saveButtonClass}>
                      {isPendingNotes && (
                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                        </svg>
                      )}
                      {isPendingNotes ? 'Guardando...' : 'Salvar Anotação'}
                    </button>
                  </div>
                )}
              </fieldset>
            </form>
          </div>
        )}

        {/* ABA HISTÓRICO */}
        {activeTab === 'logs' && canSeeNotes && (
          <div className="animate-in fade-in duration-300 max-w-4xl">
            <div className="mb-4">
              <h3 className="text-base font-bold text-slate-800">Audit Trail</h3>
              <p className="text-sm text-slate-500 mt-0.5">Rastreio completo de todas as alterações nesta ficha.</p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 mb-4">
              <input
                type="text"
                placeholder="Pesquisar por responsável ou ação..."
                value={logSearch}
                onChange={e => setLogSearch(e.target.value)}
                className="flex-1 px-4 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
              <select
                value={logFilter}
                onChange={e => setLogFilter(e.target.value)}
                className="px-4 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              >
                <option value="ALL">Todas as ações</option>
                <option value="CREATE">Criação</option>
                <option value="UPDATE">Edições</option>
              </select>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl divide-y divide-slate-50">
              {displayedLogs.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-sm">Nenhum registro encontrado.</div>
              ) : (
                displayedLogs.map(log => (
                  <div key={log.id} className="px-5 py-4 flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500 shrink-0">
                      {log.actor_name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-800">{log.actor_name}</p>
                      <p className="text-xs text-slate-500">{log.action} · {log.actor_role}</p>
                    </div>
                    <p className="text-xs text-slate-400 whitespace-nowrap shrink-0">
                      {new Date(log.created_at).toLocaleString('pt-BR')}
                    </p>
                  </div>
                ))
              )}
            </div>

            {filteredLogs.length > logLimit && (
              <div className="mt-4 text-center">
                <button
                  onClick={() => setLogLimit(prev => prev + 10)}
                  className="text-sm text-blue-600 hover:underline font-medium"
                >
                  Ver mais {filteredLogs.length - logLimit} registros
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}