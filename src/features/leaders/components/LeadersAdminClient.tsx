'use client'

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createLeader, updateLeader, toggleLeaderActive, deleteLeader } from '@/features/leaders/actions/leaders';
import { useToast } from '@/features/core/components/ToastContext';

export interface Leader {
  id:         string;
  name:       string;
  phone:      string | null;
  photo_url:  string | null;
  bio:        string | null;
  is_active:  boolean;
  sort_order: number;
  created_at: string;
}

/* ─── Helpers ─────────────────────────────────────────────────── */

function Toggle({ checked, onChange, disabled }: { checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative w-10 h-6 rounded-full transition-colors duration-200 ${checked ? 'bg-blue-600' : 'bg-slate-200'} disabled:opacity-50`}
    >
      <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${checked ? 'translate-x-4' : 'translate-x-0'}`} />
    </button>
  );
}

function PhotoPreview({ src, onChange }: { src: string | null; onChange: (url: string | null) => void }) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  return (
    <div
      className="relative w-24 h-24 rounded-2xl overflow-hidden border-2 border-dashed border-slate-200 hover:border-blue-400 transition-colors cursor-pointer group bg-slate-50 shrink-0"
      onClick={() => inputRef.current?.click()}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" className="w-full h-full object-cover" />
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 text-slate-400">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <span className="text-[10px]">Foto</span>
        </div>
      )}
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/15 transition-colors" />
      <input
        ref={inputRef} type="file" name="photo" className="hidden"
        accept="image/jpeg,image/png,image/webp"
        onChange={e => { const f = e.target.files?.[0]; if (f) onChange(URL.createObjectURL(f)); }}
      />
    </div>
  );
}

/* ─── Leader Modal ────────────────────────────────────────────── */

function LeaderModal({
  editing, cells, linkedCellId, isPending, onClose, onSubmit,
}: {
  editing: Leader | null;
  cells: { id: string; name: string }[];
  linkedCellId: string | null;
  isPending: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
}) {
  const [photoSrc, setPhotoSrc] = useState<string | null>(editing?.photo_url ?? null);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
          <h2 className="text-lg font-bold text-slate-900">
            {editing ? 'Editar Líder' : 'Novo Líder'}
          </h2>
          <button onClick={onClose} className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form key={editing?.id ?? 'new'} onSubmit={onSubmit}>
          <div className="p-6 space-y-5">

            {/* Foto + Nome em linha */}
            <div className="flex items-start gap-4">
              <PhotoPreview src={photoSrc} onChange={setPhotoSrc} />
              <div className="flex-1 space-y-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Nome Completo *</label>
                  <input
                    name="name" defaultValue={editing?.name} required
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                    placeholder="Ex: João da Silva"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Telefone / WhatsApp</label>
                  <input
                    name="phone" defaultValue={editing?.phone ?? ''}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                    placeholder="(00) 00000-0000"
                  />
                </div>
              </div>
            </div>

            {/* Vinculação de célula */}
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Célula Vinculada</label>
              <select name="cell_id" defaultValue={linkedCellId ?? ''} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 bg-white">
                <option value="">— Nenhuma Célula Selecionada —</option>
                {cells.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>

            {/* Bio */}
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Bio / Descrição</label>
              <textarea
                name="bio" rows={3} defaultValue={editing?.bio ?? ''}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 resize-none"
                placeholder="Breve descrição sobre o líder..."
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50/50">
            <button type="button" onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors">
              Cancelar
            </button>
            <button type="submit" disabled={isPending}
              className="px-5 py-2 text-sm font-bold bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2">
              {isPending && <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/></svg>}
              {editing ? 'Salvar alterações' : 'Criar Líder'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ─── Leader Card ─────────────────────────────────────────────── */

function LeaderCard({
  leader, cellName, canManage, isSysAdmin, onEdit, onToggle, toggling, onDelete,
}: {
  leader: Leader; cellName: string | null; canManage: boolean; isSysAdmin: boolean;
  onEdit: () => void; onToggle: () => void; toggling: boolean; onDelete: () => void;
}) {
  return (
    <div className={`bg-white rounded-2xl border overflow-hidden flex flex-col transition-all duration-200 hover:shadow-md ${leader.is_active ? 'border-slate-200' : 'border-slate-200 opacity-60'}`}>
      {/* Header com foto */}
      <div className="relative bg-gradient-to-br from-slate-100 to-slate-200 h-32 flex items-center justify-center overflow-hidden">
        {leader.photo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={leader.photo_url} alt={leader.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
            <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="p-4 flex flex-col flex-1">
        <h3 className="font-bold text-slate-900 text-sm mb-1">{leader.name}</h3>
        {leader.phone && (
          <p className="text-xs text-slate-500 mb-2 flex items-center gap-1">
            <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            {leader.phone}
          </p>
        )}
        {leader.bio && <p className="text-xs text-slate-400 line-clamp-2 mb-3 leading-relaxed">{leader.bio}</p>}
        {cellName && (
          <div className="flex items-center gap-1.5 mt-auto mb-3 text-xs text-slate-500 bg-slate-50 p-2 rounded-lg">
            <svg className="w-3.5 h-3.5 text-blue-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
            <span className="truncate">{cellName}</span>
          </div>
        )}

        {canManage && (
          <div className="flex items-center justify-between pt-3 border-t border-slate-100 mt-auto">
            <div className="flex items-center gap-2">
              <Toggle checked={leader.is_active} onChange={onToggle} disabled={toggling} />
              <span className="text-xs text-slate-500">{leader.is_active ? 'Ativo' : 'Inativo'}</span>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={onEdit} className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors" title="Editar">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
              {isSysAdmin && (
                <button onClick={onDelete} className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors" title="Remover">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Main Component ──────────────────────────────────────────── */

interface Props {
  initialLeaders: Leader[];
  cells: { id: string; name: string; leader1_id?: string | null; leader2_id?: string | null }[];
  canManage: boolean;
  isSysAdmin: boolean;
}

export function LeadersAdminClient({ initialLeaders, cells, canManage, isSysAdmin }: Props) {
  const router = useRouter();
  const { toast, dismiss } = useToast();
  const [leaders, setLeaders] = useState(initialLeaders);
  const [isOpen, setIsOpen] = useState(false);
  const [editing, setEditing] = useState<Leader | null>(null);
  const [isPending, startTransition] = useTransition();
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const openCreate = () => { setEditing(null); setIsOpen(true); };
  const openEdit = (l: Leader) => { setEditing(l); setIsOpen(true); };

  const getLinkedCell = (leaderId: string) => cells.find(c => c.leader1_id === leaderId || c.leader2_id === leaderId);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const toastId = toast('loading', editing ? 'Salvando líder...' : 'Criando líder...');
      const result = editing
        ? await updateLeader(editing.id, formData)
        : await createLeader(formData);
      dismiss(toastId);
      const err = 'error' in result ? result.error : null;
      if (err) { toast('error', err); return; }
      toast('success', editing ? 'Líder atualizado!' : 'Líder criado com sucesso!');
      setIsOpen(false);
      router.refresh();
    });
  };

  const handleToggle = (leader: Leader) => {
    setTogglingId(leader.id);
    startTransition(async () => {
      const result = await toggleLeaderActive(leader.id, !leader.is_active);
      setTogglingId(null);
      const err = 'error' in result ? result.error : null;
      if (err) { toast('error', err); return; }
      setLeaders(prev => prev.map(l => l.id === leader.id ? { ...l, is_active: !l.is_active } : l));
    });
  };

  const handleDelete = (leader: Leader) => {
    if (!confirm(`Remover "${leader.name}"? Esta ação também desvinculará o líder de todas as células.`)) return;
    startTransition(async () => {
      const toastId = toast('loading', 'Removendo...');
      const result = await deleteLeader(leader.id);
      dismiss(toastId);
      const err = 'error' in result ? result.error : null;
      if (err) { toast('error', err); return; }
      toast('success', 'Líder removido.');
      setLeaders(prev => prev.filter(l => l.id !== leader.id));
    });
  };

  const filtered = leaders.filter(l =>
    !search ||
    l.name.toLowerCase().includes(search.toLowerCase()) ||
    (l.phone?.toLowerCase() ?? '').includes(search.toLowerCase())
  );

  const activeCount = leaders.filter(l => l.is_active).length;

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Líderes</h1>
          <p className="text-slate-500 mt-1.5 text-sm">
            Gerencie os líderes de células — vincule-os às células no módulo de Células.
          </p>
        </div>
        {canManage && (
          <button
            onClick={openCreate}
            className="shrink-0 flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold rounded-xl transition-colors shadow-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
            Novo Líder
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Total',    value: leaders.length,             color: 'text-slate-600', bg: 'bg-slate-50 border-slate-200' },
          { label: 'Ativos',   value: activeCount,                color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200' },
          { label: 'Inativos', value: leaders.length - activeCount, color: 'text-amber-600',   bg: 'bg-amber-50 border-amber-200' },
        ].map(s => (
          <div key={s.label} className={`rounded-xl border p-4 ${s.bg}`}>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Buscar por nome ou telefone..."
          className="w-full pl-9 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
        />
      </div>

      {/* Grid or Empty */}
      {filtered.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50">
          <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <p className="text-slate-700 font-semibold mb-1">
            {search ? 'Nenhum líder encontrado' : 'Nenhum líder cadastrado'}
          </p>
          <p className="text-slate-400 text-sm mb-6">
            {search ? 'Tente outros termos de busca.' : 'Cadastre o primeiro líder para vinculá-lo a uma célula.'}
          </p>
          {canManage && !search && (
            <button onClick={openCreate} className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold rounded-xl transition-colors">
              Cadastrar primeiro líder
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filtered.map(leader => {
            const linked = getLinkedCell(leader.id);
            return (
              <LeaderCard
                key={leader.id}
                leader={leader}
                cellName={linked?.name ?? null}
                canManage={canManage}
                isSysAdmin={isSysAdmin}
                onEdit={() => openEdit(leader)}
                onToggle={() => handleToggle(leader)}
                toggling={togglingId === leader.id}
                onDelete={() => handleDelete(leader)}
              />
            );
          })}
        </div>
      )}

      {/* Modal */}
      {isOpen && (
        <LeaderModal
          editing={editing}
          cells={cells}
          linkedCellId={editing ? getLinkedCell(editing.id)?.id ?? null : null}
          isPending={isPending}
          onClose={() => setIsOpen(false)}
          onSubmit={handleSubmit}
        />
      )}
    </div>
  );
}
