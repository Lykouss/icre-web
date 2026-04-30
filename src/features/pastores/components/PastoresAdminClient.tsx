'use client'

import React, { useState, useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  createPastor,
  updatePastor,
  deletePastor,
  togglePastorActive,
} from '@/features/portal/actions/portal-actions';
import { useToast } from '@/features/core/components/ToastContext';
import type { Pastor } from '@/features/portal/types';

/* ─── Image preview input ─────────────────────────────────────── */

function PhotoInput({ src, name }: { src: string | null; name: string }) {
  const [preview, setPreview] = useState<string | null>(src);
  const inputRef = React.useRef<HTMLInputElement>(null);

  return (
    <div className="flex items-center gap-4">
      <div
        className="w-20 h-20 rounded-2xl overflow-hidden bg-slate-100 border-2 border-dashed border-slate-200 hover:border-blue-400 transition-colors cursor-pointer group shrink-0 flex items-center justify-center"
        onClick={() => inputRef.current?.click()}
      >
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="" className="w-full h-full object-cover object-top" />
        ) : (
          <svg className="w-7 h-7 text-slate-300 group-hover:text-blue-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        )}
      </div>
      <div className="min-w-0">
        <button type="button" onClick={() => inputRef.current?.click()}
          className="text-sm font-medium text-blue-600 hover:text-blue-500 transition-colors">
          {preview ? 'Trocar foto' : 'Selecionar foto'}
        </button>
        <p className="text-xs text-slate-400 mt-0.5">JPG, PNG ou WebP • máx. 3 MB</p>
        <input ref={inputRef} type="file" name={name} className="hidden" accept="image/jpeg,image/png,image/webp"
          onChange={e => {
            const f = e.target.files?.[0];
            if (f) setPreview(URL.createObjectURL(f));
          }} />
      </div>
    </div>
  );
}

/* ─── Toggle ──────────────────────────────────────────────────── */

function Toggle({ checked, onChange, disabled }: { checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <button type="button" role="switch" aria-checked={checked} disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative w-10 h-6 rounded-full transition-colors duration-200 ${checked ? 'bg-blue-600' : 'bg-slate-200'} disabled:opacity-50`}>
      <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${checked ? 'translate-x-4' : 'translate-x-0'}`} />
    </button>
  );
}

/* ─── Pastor Modal ────────────────────────────────────────────── */

function PastorModal({
  editing, isPending, onClose, onSubmit,
}: {
  editing: Pastor | null;
  isPending: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
}) {
  const [chars, setChars] = useState(editing?.bio?.length ?? 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
          <h2 className="text-lg font-bold text-slate-900">
            {editing ? 'Editar Liderança' : 'Novo(a) Líder'}
          </h2>
          <button onClick={onClose} className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form key={editing?.id ?? 'new'} onSubmit={onSubmit} className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-5">

            {/* Foto */}
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Foto</label>
              <PhotoInput src={editing?.photo_url ?? null} name="photo" />
            </div>

            {/* Nome e cargo */}
            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Identificação</label>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Nome Completo *</label>
                <input name="name" defaultValue={editing?.name} required
                  className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                  placeholder="Ex: Pastor João Silva" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Cargo / Função *</label>
                  <input name="role" defaultValue={editing?.role} required
                    className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                    placeholder="Ex: Pastor Titular" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Instagram (@)</label>
                  <input name="instagram_url" type="url" defaultValue={editing?.instagram_url ?? ''}
                    className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                    placeholder="https://instagram.com/pastor..." />
                </div>
              </div>
            </div>

            {/* Bio */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-medium text-slate-600">Biografia</label>
                <span className={`text-xs ${chars > 550 ? 'text-amber-500' : 'text-slate-400'}`}>{chars}/600</span>
              </div>
              <textarea name="bio" rows={4} maxLength={600}
                defaultValue={editing?.bio ?? ''}
                onChange={e => setChars(e.target.value.length)}
                className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 resize-none"
                placeholder="Uma breve descrição sobre o líder, sua história e ministério..." />
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50/50 shrink-0">
            <button type="button" onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors">
              Cancelar
            </button>
            <button type="submit" disabled={isPending}
              className="px-5 py-2 text-sm font-bold bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2">
              {isPending && <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/></svg>}
              {editing ? 'Salvar alterações' : 'Adicionar Líder'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ─── Pastor Card ─────────────────────────────────────────────── */

function PastorCard({
  pastor, canManage, isSysAdmin, onEdit, onToggle, toggling, onDelete,
}: {
  pastor: Pastor; canManage: boolean; isSysAdmin: boolean;
  onEdit: () => void; onToggle: () => void; toggling: boolean; onDelete: () => void;
}) {
  return (
    <div className={`bg-white rounded-2xl border p-4 flex flex-col sm:flex-row items-center gap-5 transition-all duration-200 hover:shadow-md hover:border-blue-200 ${pastor.is_active ? 'border-slate-200' : 'border-slate-200 opacity-60 bg-slate-50'}`}>
      {/* Photo */}
      <div className="w-24 h-24 sm:w-20 sm:h-20 shrink-0 rounded-full sm:rounded-2xl bg-slate-100 overflow-hidden relative shadow-inner ring-4 ring-slate-50 sm:ring-0">
        {pastor.photo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={pastor.photo_url} alt={pastor.name} className="w-full h-full object-cover object-top" />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
            <svg className="w-12 h-12 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.25" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/20 to-transparent sm:hidden" />
      </div>

      {/* Body */}
      <div className="flex-1 flex flex-col text-center sm:text-left min-w-0 w-full">
        <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-1">{pastor.role}</p>
        <h3 className="font-bold text-slate-900 text-lg leading-tight mb-1 truncate">{pastor.name}</h3>
        
        {pastor.instagram_url && (
          <a href={pastor.instagram_url} target="_blank" rel="noreferrer" className="text-xs font-medium text-fuchsia-600 mb-2 inline-flex items-center justify-center sm:justify-start gap-1 hover:underline">
            <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
            Instagram
          </a>
        )}
        {pastor.bio ? (
          <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed max-w-2xl">{pastor.bio}</p>
        ) : (
          <p className="text-xs text-slate-400 italic">Sem biografia cadastrada.</p>
        )}
      </div>

      {/* Actions */}
      {canManage && (
        <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-3 sm:gap-2 w-full sm:w-auto pt-4 sm:pt-0 border-t sm:border-t-0 border-slate-100 mt-2 sm:mt-0 shrink-0">
          <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
            <Toggle checked={pastor.is_active} onChange={onToggle} disabled={toggling} />
            <span className="text-xs font-medium text-slate-600">{pastor.is_active ? 'Visível' : 'Oculto'}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <button onClick={onEdit} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-blue-600 hover:bg-blue-50 transition-colors" title="Editar">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Editar
            </button>
            {isSysAdmin && (
              <button onClick={onDelete} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-red-600 hover:bg-red-50 transition-colors" title="Remover">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Excluir
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Main ────────────────────────────────────────────────────── */

interface Props {
  initialPastors: Pastor[];
  canManage: boolean;
  isSysAdmin: boolean;
}

export function PastoresAdminClient({ initialPastors, canManage, isSysAdmin }: Props) {
  const router = useRouter();
  const { toast, dismiss } = useToast();
  const [pastors, setPastors] = useState(initialPastors);
  const [isOpen, setIsOpen] = useState(false);
  const [editing, setEditing] = useState<Pastor | null>(null);
  const [isPending, startTransition] = useTransition();
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  // Sincronizar as props com o state ao recarregar
  useEffect(() => {
    setPastors(initialPastors);
  }, [initialPastors]);

  const openCreate = () => { setEditing(null); setIsOpen(true); };
  const openEdit   = (p: Pastor) => { setEditing(p); setIsOpen(true); };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const toastId = toast('loading', editing ? 'Salvando...' : 'Adicionando líder...');
      const result = editing
        ? await updatePastor(editing.id, formData)
        : await createPastor(formData);
      dismiss(toastId);
      const err = 'error' in result ? result.error : null;
      if (err) { toast('error', err); return; }
      toast('success', editing ? 'Líder atualizado!' : 'Líder adicionado com sucesso!');
      setIsOpen(false);
      router.refresh();
    });
  };

  const handleToggle = (pastor: Pastor) => {
    setTogglingId(pastor.id);
    startTransition(async () => {
      const result = await togglePastorActive(pastor.id, !pastor.is_active);
      setTogglingId(null);
      const err = 'error' in result ? result.error : null;
      if (err) { toast('error', err); return; }
      setPastors(prev => prev.map(p => p.id === pastor.id ? { ...p, is_active: !p.is_active } : p));
    });
  };

  const handleDelete = (pastor: Pastor) => {
    if (!confirm(`Tem certeza que deseja EXCLUIR DEFINITIVAMENTE "${pastor.name}"? Esta ação não pode ser desfeita e removerá o pastor do banco de dados.`)) return;
    startTransition(async () => {
      const toastId = toast('loading', 'Excluindo...');
      const result = await deletePastor(pastor.id);
      dismiss(toastId);
      const err = 'error' in result ? result.error : null;
      if (err) { toast('error', err); return; }
      toast('success', 'Pastor excluído permanentemente.');
      setPastors(prev => prev.filter(p => p.id !== pastor.id));
    });
  };

  const filtered = pastors.filter(p =>
    !search ||
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.role.toLowerCase().includes(search.toLowerCase())
  );

  const visibleCount = pastors.filter(p => p.is_active).length;
  const hiddenCount  = pastors.length - visibleCount;

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Liderança</h1>
          <p className="text-slate-500 mt-1.5 text-sm">
            Gerencie os pastores e líderes exibidos na seção de liderança do portal.
          </p>
        </div>
        {canManage && (
          <button onClick={openCreate}
            className="shrink-0 flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold rounded-xl transition-colors shadow-sm">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
            Adicionar Líder
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Total',    value: pastors.length, color: 'text-slate-600',   bg: 'bg-slate-50 border-slate-200'    },
          { label: 'Visíveis', value: visibleCount,   color: 'text-blue-600',    bg: 'bg-blue-50 border-blue-200'      },
          { label: 'Ocultos',  value: hiddenCount,    color: 'text-slate-400',   bg: 'bg-slate-50 border-slate-200'    },
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
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Buscar por nome ou cargo..."
          className="w-full pl-9 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400" />
      </div>

      {/* Grid or Empty */}
      {filtered.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50">
          <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <p className="text-slate-700 font-semibold mb-1">
            {search ? 'Nenhum líder encontrado' : 'Nenhum líder cadastrado'}
          </p>
          <p className="text-slate-400 text-sm mb-6">
            {search ? 'Tente outros termos.' : 'Adicione os pastores e líderes para exibi-los no portal.'}
          </p>
          {canManage && !search && (
            <button onClick={openCreate} className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold rounded-xl transition-colors">
              Adicionar primeiro líder
            </button>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {filtered.map(p => (
            <PastorCard
              key={p.id}
              pastor={p}
              canManage={canManage}
              isSysAdmin={isSysAdmin}
              onEdit={() => openEdit(p)}
              onToggle={() => handleToggle(p)}
              toggling={togglingId === p.id}
              onDelete={() => handleDelete(p)}
            />
          ))}
        </div>
      )}

      {/* Modal */}
      {isOpen && (
        <PastorModal
          editing={editing}
          isPending={isPending}
          onClose={() => setIsOpen(false)}
          onSubmit={handleSubmit}
        />
      )}
    </div>
  );
}
