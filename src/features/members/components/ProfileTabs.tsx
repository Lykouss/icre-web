'use client'

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { updateMemberGeneral } from '@/features/members/actions/update-member';
import { updateMemberNotes } from '@/features/members/actions/update-member-notes';
import { updateMemberSpiritual } from '@/features/members/actions/update-member-spiritual';
import { updateMemberMinistries } from '@/features/members/actions/update-member-ministries';
import { useToast } from '@/features/core/components/ToastContext';

export interface MemberProfileData {
  id: string; full_name: string; phone: string | null; status: string; notes: string | null;
  cells: { name: string } | null; cell_id?: string | null; email?: string | null;
  birth_date?: string | null; gender?: string | null; marital_status?: string | null;
  address?: string | null; baptism_date?: string | null; encounter_completed?: boolean;
  ministries?: string[]; discipleship_completed?: boolean;
}
interface Cell { id: string; name: string }
interface AuditLog { id: string; action: string; actor_name: string; actor_email?: string; actor_role?: string; created_at: string }
interface Props { member: MemberProfileData; cells: Cell[]; logs?: AuditLog[]; hasEditPermission: boolean; canSeeNotes: boolean }

/* ─── Ministry SVG icons (no emojis) ─────────────────────────── */
const MINISTRY_ICONS: Record<string, React.ReactNode> = {
  'Louvor': <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" /></svg>,
  'Kids': <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>,
  'Recepção': <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0m-3 6a1.5 1.5 0 00-3 0v2a7.5 7.5 0 0015 0v-5a1.5 1.5 0 00-3 0m-6-3V11m0-5.5v-1a1.5 1.5 0 013 0v1m0 0V11m0-5.5a1.5 1.5 0 013 0v3m0 0V11" /></svg>,
  'Comunicação': <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
  'Intercessão': <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>,
  'Diaconato': <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>,
  'Sonoplastia': <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M15.536 8.464a5 5 0 010 7.072M12 6a7.975 7.975 0 015.657 2.343M12 18a7.975 7.975 0 01-5.657-2.343M6.343 8.464a5 5 0 000 7.072M12 12h.01" /></svg>,
  'Dança': <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>,
};

const MINISTRIES = ['Louvor','Kids','Recepção','Comunicação','Intercessão','Diaconato','Sonoplastia','Dança'];
const MINISTRY_DESCS: Record<string, string> = { Louvor: 'Música e adoração', Kids: 'Ministério infantil', Recepção: 'Acolhimento', Comunicação: 'Mídias e fotos', Intercessão: 'Grupo de oração', Diaconato: 'Ordem e serviço', Sonoplastia: 'Áudio e projeção', Dança: 'Artes corporais' };

/* ─── Styles ──────────────────────────────────────────────────── */
const inputStyle = { background: 'var(--admin-surface-alt)', border: '1px solid var(--admin-border)' } as const;
const inputCls = 'w-full px-3.5 py-2.5 rounded-xl text-sm text-slate-200 placeholder-slate-600 outline-none transition-all disabled:opacity-50';
const focusFns = {
  onFocus: (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    e.target.style.borderColor = 'rgba(37,99,235,0.5)'; e.target.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.1)';
  },
  onBlur: (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    e.target.style.borderColor = 'var(--admin-border)'; e.target.style.boxShadow = 'none';
  },
};

function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block text-[11px] font-bold uppercase tracking-wide mb-1.5" style={{ color: 'var(--admin-text-secondary)' }}>
      {children}{required && <span className="text-red-400 ml-0.5 normal-case">*</span>}
    </label>
  );
}

function SaveButton({ loading, children }: { loading: boolean; children: React.ReactNode }) {
  return (
    <button type="submit" disabled={loading}
      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-50"
      style={{ background: 'var(--admin-accent)' }}
      onMouseEnter={e => { if (!loading) e.currentTarget.style.background = 'var(--admin-accent-hover)'; }}
      onMouseLeave={e => { e.currentTarget.style.background = 'var(--admin-accent)'; }}>
      {loading && (
        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
        </svg>
      )}
      {children}
    </button>
  );
}

export function ProfileTabs({ member, cells, logs = [], hasEditPermission, canSeeNotes }: Props) {
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
    let v = e.target.value.replace(/\D/g, '');
    if (v.length <= 11) { v = v.replace(/^(\d{2})(\d)/g, '($1) $2'); v = v.replace(/(\d)(\d{4})$/, '$1-$2'); }
    if (v.length > 15) v = v.substring(0, 15);
    setPhoneValue(v);
  };

  const toggleMinistry = (id: string) => {
    if (!hasEditPermission) return;
    setSelectedMinistries(prev => prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]);
  };

  const handleGeneralSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (phoneValue && phoneValue.length < 14) { toast('error', 'Digite um número de WhatsApp válido com DDD.'); return; }
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const id = toast('loading', 'Salvando…');
      const result = await updateMemberGeneral(member.id, formData);
      dismiss(id);
      if (result.error) toast('error', result.error);
      else { toast('success', 'Dados atualizados!'); router.refresh(); }
    });
  };

  const handleSpiritualSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransitionSpiritual(async () => {
      const id = toast('loading', 'Salvando trilha…');
      const result = await updateMemberSpiritual(member.id, formData);
      dismiss(id);
      if (result.error) toast('error', result.error);
      else { toast('success', 'Trilha atualizada!'); router.refresh(); }
    });
  };

  const handleMinistriesSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    startTransitionMinistries(async () => {
      const id = toast('loading', 'Salvando ministérios…');
      const result = await updateMemberMinistries(member.id, selectedMinistries);
      dismiss(id);
      if (result.error) toast('error', result.error);
      else { toast('success', 'Ministérios atualizados!'); router.refresh(); }
    });
  };

  const handleNotesSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    startTransitionNotes(async () => {
      const id = toast('loading', 'Salvando anotações…');
      const result = await updateMemberNotes(member.id, notesValue);
      dismiss(id);
      if (result.error) toast('error', result.error);
      else { toast('success', 'Anotações salvas!'); router.refresh(); }
    });
  };

  const tabs = [
    { id: 'geral',       label: 'Dados Gerais' },
    { id: 'espiritual',  label: 'Trilha Espiritual' },
    { id: 'ministerios', label: 'Ministérios' },
    ...(canSeeNotes ? [{ id: 'anotacoes', label: 'Anotações' }, { id: 'logs', label: 'Histórico' }] : []),
  ];

  const filteredLogs = logs.filter(log => {
    const term = logSearch.toLowerCase();
    const matchSearch = !term || log.actor_name.toLowerCase().includes(term) || log.action.toLowerCase().includes(term);
    const matchFilter = logFilter === 'ALL' || (logFilter === 'CREATE' && log.action.includes('CREATE')) || (logFilter === 'UPDATE' && log.action.includes('UPDATE'));
    return matchSearch && matchFilter;
  });
  const displayedLogs = filteredLogs.slice(0, logLimit);

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--admin-surface)', border: '1px solid var(--admin-border)' }}>
      {/* Tab bar */}
      <div className="flex overflow-x-auto" style={{ borderBottom: '1px solid var(--admin-border)' }}>
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className="px-5 py-3.5 text-[13px] font-semibold whitespace-nowrap border-b-2 transition-all"
            style={activeTab === tab.id
              ? { borderColor: 'var(--admin-accent)', color: '#93c5fd', background: 'rgba(37,99,235,0.06)' }
              : { borderColor: 'transparent', color: 'var(--admin-text-secondary)', background: 'transparent' }}
            onMouseEnter={e => { if (activeTab !== tab.id) e.currentTarget.style.color = 'var(--admin-text-primary)'; }}
            onMouseLeave={e => { if (activeTab !== tab.id) e.currentTarget.style.color = 'var(--admin-text-secondary)'; }}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="p-6 md:p-8 min-h-[420px]" style={{ background: 'rgba(0,0,0,0.1)' }}>

        {/* ── DADOS GERAIS ─────────────────────────────────────── */}
        {activeTab === 'geral' && (
          <div className="animate-in fade-in duration-300 max-w-3xl">
            <form onSubmit={handleGeneralSubmit}>
              <fieldset disabled={!hasEditPermission} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {[
                    { name: 'fullName',   label: 'Nome Completo', required: true, type: 'text',  val: member.full_name,    ph: '' },
                    { name: 'email',      label: 'E-mail',        required: false, type: 'email', val: member.email ?? '',   ph: 'exemplo@email.com' },
                    { name: 'birthDate',  label: 'Nascimento',    required: false, type: 'date',  val: member.birth_date ?? '', ph: '' },
                  ].map(f => (
                    <div key={f.name}>
                      <FieldLabel required={f.required}>{f.label}</FieldLabel>
                      <input type={f.type} name={f.name} defaultValue={f.val} required={f.required} placeholder={f.ph}
                        className={inputCls} style={inputStyle} {...focusFns} />
                    </div>
                  ))}

                  {/* Phone - controlled */}
                  <div>
                    <FieldLabel>Contato (WhatsApp)</FieldLabel>
                    <input type="text" name="phone" value={phoneValue} onChange={handlePhoneChange} placeholder="(XX) XXXXX-XXXX"
                      className={inputCls} style={inputStyle} {...focusFns} />
                  </div>

                  {/* Selects */}
                  {([
                    { name: 'gender', label: 'Gênero', val: member.gender ?? '', opts: [['', 'Não informado'], ['Masculino', 'Masculino'], ['Feminino', 'Feminino']] },
                    { name: 'maritalStatus', label: 'Estado Civil', val: member.marital_status ?? '', opts: [['', 'Não informado'], ['Solteiro(a)', 'Solteiro(a)'], ['Casado(a)', 'Casado(a)'], ['Divorciado(a)', 'Divorciado(a)'], ['Viúvo(a)', 'Viúvo(a)']] },
                    { name: 'status', label: 'Status', val: member.status, opts: [['Visitante', 'Visitante'], ['Congregante', 'Congregante'], ['Membro', 'Membro'], ['Inativo', 'Inativo'], ['Afastado', 'Afastado']] },
                    { name: 'cellId', label: 'Célula', val: member.cell_id ?? '', opts: [['', 'Nenhuma'], ...cells.map(c => [c.id, c.name])] },
                  ] as const).map(f => (
                    <div key={f.name}>
                      <FieldLabel>{f.label}</FieldLabel>
                      <select name={f.name} defaultValue={f.val} className={`${inputCls} cursor-pointer`} style={inputStyle} {...focusFns}>
                        {f.opts.map(([v, l]) => <option key={v} value={v} style={{ background: '#111d35' }}>{l}</option>)}
                      </select>
                    </div>
                  ))}
                </div>

                {/* Address full-width */}
                <div>
                  <FieldLabel>Endereço</FieldLabel>
                  <input type="text" name="address" defaultValue={member.address ?? ''} placeholder="Rua, número, bairro, cidade…"
                    className={inputCls} style={inputStyle} {...focusFns} />
                </div>

                {hasEditPermission && (
                  <div className="flex justify-end pt-2">
                    <SaveButton loading={isPending}>{isPending ? 'Salvando…' : 'Salvar Alterações'}</SaveButton>
                  </div>
                )}
              </fieldset>
            </form>
          </div>
        )}

        {/* ── TRILHA ESPIRITUAL ─────────────────────────────────── */}
        {activeTab === 'espiritual' && (
          <div className="animate-in fade-in duration-300 max-w-3xl">
            <form onSubmit={handleSpiritualSubmit}>
              <fieldset disabled={!hasEditPermission} className="space-y-6">
                <div>
                  <FieldLabel>Data de Batismo</FieldLabel>
                  <input type="date" name="baptismDate" defaultValue={member.baptism_date ?? ''} className={inputCls + ' max-w-xs'} style={inputStyle} {...focusFns} />
                </div>
                <div className="space-y-3">
                  {[
                    { name: 'encounterCompleted', label: 'Encontro com Deus realizado', checked: member.encounter_completed },
                    { name: 'discipleshipCompleted', label: 'Discipulado concluído', checked: member.discipleship_completed },
                  ].map(f => (
                    <label key={f.name} className="flex items-center gap-3 cursor-pointer group">
                      <div className="relative w-5 h-5">
                        <input type="checkbox" name={f.name} defaultChecked={f.checked}
                          className="peer w-5 h-5 rounded accent-blue-500 cursor-pointer" />
                      </div>
                      <span className="text-sm font-semibold text-slate-300 group-hover:text-slate-100 transition-colors">{f.label}</span>
                    </label>
                  ))}
                </div>
                {hasEditPermission && (
                  <div className="flex justify-end pt-2">
                    <SaveButton loading={isPendingSpiritual}>{isPendingSpiritual ? 'Salvando…' : 'Salvar Trilha'}</SaveButton>
                  </div>
                )}
              </fieldset>
            </form>
          </div>
        )}

        {/* ── MINISTÉRIOS ───────────────────────────────────────── */}
        {activeTab === 'ministerios' && (
          <div className="animate-in fade-in duration-300 max-w-3xl">
            <form onSubmit={handleMinistriesSubmit}>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                {MINISTRIES.map(id => {
                  const isSelected = selectedMinistries.includes(id);
                  return (
                    <button key={id} type="button"
                      onClick={() => toggleMinistry(id)}
                      className={`relative p-4 rounded-2xl border-2 text-center transition-all select-none ${!hasEditPermission ? 'cursor-default opacity-60' : 'cursor-pointer'}`}
                      style={isSelected
                        ? { background: 'rgba(37,99,235,0.12)', borderColor: 'rgba(37,99,235,0.5)', boxShadow: '0 0 0 1px rgba(37,99,235,0.15)' }
                        : { background: 'var(--admin-surface-alt)', borderColor: 'var(--admin-border)' }}>
                      {isSelected && (
                        <span className="absolute top-2 right-2 w-4 h-4 rounded-full flex items-center justify-center" style={{ background: 'var(--admin-accent)' }}>
                          <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                          </svg>
                        </span>
                      )}
                      <div className={`flex justify-center mb-2 ${isSelected ? 'text-blue-400' : 'text-slate-500'}`}>
                        {MINISTRY_ICONS[id]}
                      </div>
                      <p className={`text-[11px] font-bold ${isSelected ? 'text-slate-200' : 'text-slate-400'}`}>{id}</p>
                      <p className="text-[10px] mt-0.5" style={{ color: 'var(--admin-text-muted)' }}>{MINISTRY_DESCS[id]}</p>
                    </button>
                  );
                })}
              </div>
              {hasEditPermission && (
                <div className="flex justify-end">
                  <SaveButton loading={isPendingMinistries}>{isPendingMinistries ? 'Salvando…' : 'Salvar Ministérios'}</SaveButton>
                </div>
              )}
            </form>
          </div>
        )}

        {/* ── ANOTAÇÕES ─────────────────────────────────────────── */}
        {activeTab === 'anotacoes' && canSeeNotes && (
          <div className="animate-in fade-in duration-300 max-w-3xl">
            <div className="mb-4">
              <h3 className="text-[15px] font-bold text-slate-100">Anotações Confidenciais</h3>
              <p className="text-[12px] mt-0.5" style={{ color: 'var(--admin-text-secondary)' }}>Visível apenas para liderança. Registre acompanhamentos e histórico pastoral.</p>
            </div>
            <form onSubmit={handleNotesSubmit}>
              <fieldset disabled={!hasEditPermission}>
                <textarea
                  className="w-full h-48 p-4 rounded-xl text-sm text-slate-200 placeholder-slate-600 outline-none resize-none transition-all disabled:opacity-50"
                  style={inputStyle}
                  placeholder="Ex: Em acompanhamento familiar devido a…"
                  value={notesValue}
                  onChange={e => setNotesValue(e.target.value)}
                  onFocus={e => { e.target.style.borderColor = 'rgba(37,99,235,0.5)'; e.target.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.1)'; }}
                  onBlur={e => { e.target.style.borderColor = 'var(--admin-border)'; e.target.style.boxShadow = 'none'; }}
                />
                {hasEditPermission && (
                  <div className="mt-4 flex justify-end">
                    <SaveButton loading={isPendingNotes}>{isPendingNotes ? 'Guardando…' : 'Salvar Anotação'}</SaveButton>
                  </div>
                )}
              </fieldset>
            </form>
          </div>
        )}

        {/* ── HISTÓRICO ─────────────────────────────────────────── */}
        {activeTab === 'logs' && canSeeNotes && (
          <div className="animate-in fade-in duration-300 max-w-4xl">
            <div className="mb-5">
              <h3 className="text-[15px] font-bold text-slate-100">Audit Trail</h3>
              <p className="text-[12px] mt-0.5" style={{ color: 'var(--admin-text-secondary)' }}>Rastreio completo de todas as alterações nesta ficha.</p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 mb-4">
              <div className="relative flex-1">
                <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-600 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input type="text" placeholder="Pesquisar por responsável ou ação…"
                  value={logSearch} onChange={e => setLogSearch(e.target.value)}
                  className="w-full h-9 pl-9 pr-4 rounded-xl text-sm text-slate-200 placeholder-slate-600 outline-none transition-all"
                  style={{ background: 'var(--admin-surface-alt)', border: '1px solid var(--admin-border)' }}
                  onFocus={e => { e.target.style.borderColor = 'rgba(37,99,235,0.5)'; e.target.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.1)'; }}
                  onBlur={e => { e.target.style.borderColor = 'var(--admin-border)'; e.target.style.boxShadow = 'none'; }}
                />
              </div>
              <select value={logFilter} onChange={e => setLogFilter(e.target.value)}
                className="h-9 px-3 rounded-xl text-sm text-slate-200 outline-none cursor-pointer"
                style={{ background: 'var(--admin-surface-alt)', border: '1px solid var(--admin-border)' }}>
                <option value="ALL" style={{ background: '#111d35' }}>Todas as ações</option>
                <option value="CREATE" style={{ background: '#111d35' }}>Criação</option>
                <option value="UPDATE" style={{ background: '#111d35' }}>Edições</option>
              </select>
            </div>

            <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid var(--admin-border)', background: 'var(--admin-surface)' }}>
              {displayedLogs.length === 0 ? (
                <div className="py-12 text-center text-sm font-medium" style={{ color: 'var(--admin-text-muted)' }}>
                  Nenhum registro encontrado.
                </div>
              ) : (
                displayedLogs.map((log, i) => (
                  <div key={log.id} className="px-5 py-4 flex items-start gap-4"
                    style={i > 0 ? { borderTop: '1px solid var(--admin-border)' } : undefined}>
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center text-[11px] font-bold text-blue-400 shrink-0"
                      style={{ background: 'var(--admin-accent-dim)' }}>
                      {log.actor_name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold text-slate-200">{log.actor_name}</p>
                      <p className="text-[11px] mt-0.5" style={{ color: 'var(--admin-text-secondary)' }}>{log.action} · {log.actor_role}</p>
                    </div>
                    <p className="text-[11px] font-mono whitespace-nowrap shrink-0" style={{ color: 'var(--admin-text-muted)' }}>
                      {new Date(log.created_at).toLocaleString('pt-BR')}
                    </p>
                  </div>
                ))
              )}
            </div>

            {filteredLogs.length > logLimit && (
              <div className="mt-4 text-center">
                <button onClick={() => setLogLimit(p => p + 10)}
                  className="text-sm font-semibold transition-colors"
                  style={{ color: 'var(--admin-accent)' }}>
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