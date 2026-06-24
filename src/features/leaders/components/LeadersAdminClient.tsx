'use client'

import React, { useState, useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createLeader, updateLeader, toggleLeaderActive, deleteLeader } from '@/features/leaders/actions/leaders';
import { useToast } from '@/features/core/components/ToastContext';
import { AdminEmptyState } from '@/features/core/components/AdminEmptyState';
import { AdminButton } from '@/features/core/components/AdminUI';

export interface Leader {
  id: string; name: string; phone: string | null; photo_url: string | null;
  bio: string | null; instagram_url?: string | null;
  is_active: boolean; sort_order: number; created_at: string;
}

const inputCls = 'w-full h-9 px-3 rounded-xl text-sm text-slate-200 placeholder-slate-600 outline-none transition-all';
const inputStyle = { background: 'var(--admin-surface-alt)', border: '1px solid var(--admin-border)' } as const;
const focusFns = {
  onFocus: (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    e.target.style.borderColor = 'rgba(37,99,235,0.5)'; e.target.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.1)';
  },
  onBlur: (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    e.target.style.borderColor = 'var(--admin-border)'; e.target.style.boxShadow = 'none';
  },
};

/* ─── Toggle ──────────────────────────────────────────────────── */
function Toggle({ checked, onChange, disabled }: { checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <button type="button" role="switch" aria-checked={checked} disabled={disabled}
      onClick={() => onChange(!checked)}
      className="relative w-9 h-5 rounded-full transition-colors duration-200 disabled:opacity-40"
      style={{ background: checked ? 'var(--admin-accent)' : 'var(--admin-surface-alt)', border: '1px solid var(--admin-border)' }}>
      <span className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full shadow transition-transform duration-200"
        style={{ background: checked ? '#fff' : 'rgba(255,255,255,0.3)', transform: checked ? 'translateX(16px)' : 'translateX(0)' }} />
    </button>
  );
}

/* ─── Photo Preview ───────────────────────────────────────────── */
function PhotoPreview({ src, onChange }: { src: string | null; onChange: (url: string | null) => void }) {
  const ref = React.useRef<HTMLInputElement>(null);
  return (
    <div
      className="relative w-24 h-24 rounded-2xl overflow-hidden cursor-pointer group shrink-0 transition-all"
      style={{ background: 'var(--admin-surface-alt)', border: '2px dashed var(--admin-border)' }}
      onClick={() => ref.current?.click()}
      onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(37,99,235,0.4)')}
      onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--admin-border)')}
    >
      {src
        // eslint-disable-next-line @next/next/no-img-element
        ? <img src={src} alt="" className="w-full h-full object-cover" />
        : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1" style={{ color: 'var(--admin-text-muted)' }}>
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span className="text-[9px] font-medium">Foto</span>
          </div>
        )}
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
      <input ref={ref} type="file" name="photo" className="hidden" accept="image/jpeg,image/png,image/webp"
        onChange={e => { const f = e.target.files?.[0]; if (f) onChange(URL.createObjectURL(f)); }} />
    </div>
  );
}

/* ─── Leader Modal ────────────────────────────────────────────── */
function LeaderModal({ editing, cells, linkedCellId, isPending, onClose, onSubmit }: {
  editing: Leader | null; cells: { id: string; name: string }[];
  linkedCellId: string | null; isPending: boolean;
  onClose: () => void; onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
}) {
  const [photoSrc, setPhotoSrc] = useState<string | null>(editing?.photo_url ?? null);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={onClose} />
      <div
        className="relative w-full max-w-lg rounded-2xl shadow-2xl flex flex-col overflow-hidden"
        style={{ background: 'var(--admin-surface)', border: '1px solid var(--admin-border-strong)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid var(--admin-border)' }}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center text-blue-400" style={{ background: 'var(--admin-accent-dim)', border: '1px solid var(--admin-accent-border)' }}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h2 className="text-[15px] font-bold text-slate-100">{editing ? 'Editar Líder' : 'Novo Líder'}</h2>
          </div>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg transition-all" style={{ color: 'var(--admin-text-muted)' }}
            onMouseEnter={e => { e.currentTarget.style.color = 'var(--admin-text-primary)'; e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--admin-text-muted)'; e.currentTarget.style.background = 'transparent'; }}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form key={editing?.id ?? 'new'} onSubmit={onSubmit}>
          <div className="p-6 space-y-5">
            {/* Foto + campos em linha */}
            <div className="flex items-start gap-4">
              <PhotoPreview src={photoSrc} onChange={setPhotoSrc} />
              <div className="flex-1 space-y-3">
                {[
                  { name: 'name', label: 'Nome Completo', required: true, val: editing?.name, ph: 'Ex: João da Silva', type: 'text' },
                  { name: 'phone', label: 'Telefone / WhatsApp', required: false, val: editing?.phone ?? '', ph: '(00) 00000-0000', type: 'text' },
                  { name: 'instagram_url', label: 'Instagram (URL)', required: false, val: editing?.instagram_url ?? '', ph: 'https://instagram.com/lider...', type: 'url' },
                ].map(f => (
                  <div key={f.name}>
                    <label className="block text-[11px] font-semibold mb-1.5" style={{ color: 'var(--admin-text-secondary)' }}>
                      {f.label}{f.required && <span className="text-red-400 ml-0.5">*</span>}
                    </label>
                    <input name={f.name} type={f.type} defaultValue={f.val ?? ''} required={f.required}
                      placeholder={f.ph} className={inputCls} style={inputStyle} {...focusFns} />
                  </div>
                ))}
              </div>
            </div>

            {/* Célula vinculada */}
            <div>
              <label className="block text-[11px] font-semibold mb-1.5" style={{ color: 'var(--admin-text-secondary)' }}>Célula Vinculada</label>
              <select name="cell_id" defaultValue={linkedCellId ?? ''} className={`${inputCls} cursor-pointer`} style={inputStyle} {...focusFns}>
                <option value="">— Nenhuma Célula —</option>
                {cells.map(c => <option key={c.id} value={c.id} style={{ background: '#111d35' }}>{c.name}</option>)}
              </select>
            </div>

            {/* Bio */}
            <div>
              <label className="block text-[11px] font-semibold mb-1.5" style={{ color: 'var(--admin-text-secondary)' }}>Bio / Descrição</label>
              <textarea name="bio" rows={3} defaultValue={editing?.bio ?? ''}
                placeholder="Breve descrição sobre o líder…"
                className="w-full px-3 py-2.5 rounded-xl text-sm text-slate-200 placeholder-slate-600 outline-none transition-all resize-none"
                style={inputStyle} {...focusFns} />
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 px-6 py-4" style={{ borderTop: '1px solid var(--admin-border)', background: 'rgba(0,0,0,0.15)' }}>
            <AdminButton type="button" variant="ghost" onClick={onClose}>Cancelar</AdminButton>
            <AdminButton type="submit" variant="primary" loading={isPending}>
              {editing ? 'Salvar alterações' : 'Criar Líder'}
            </AdminButton>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ─── Leader Card ─────────────────────────────────────────────── */
function LeaderCard({ leader, cellName, canManage, isSysAdmin, onEdit, onToggle, toggling, onDelete }: {
  leader: Leader; cellName: string | null; canManage: boolean; isSysAdmin: boolean;
  onEdit: () => void; onToggle: () => void; toggling: boolean; onDelete: () => void;
}) {
  return (
    <div
      className={`rounded-2xl overflow-hidden flex flex-col transition-all duration-200 hover:-translate-y-0.5 ${!leader.is_active ? 'opacity-50' : ''}`}
      style={{ background: 'var(--admin-surface)', border: '1px solid var(--admin-border)', boxShadow: '0 2px 8px rgba(0,0,0,0.25)' }}
      onMouseEnter={e => { if (leader.is_active) e.currentTarget.style.borderColor = 'rgba(37,99,235,0.3)'; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--admin-border)'; }}
    >
      {/* Photo header */}
      <div className="relative h-36 overflow-hidden flex items-center justify-center" style={{ background: 'var(--admin-surface-alt)' }}>
        {leader.photo_url
          // eslint-disable-next-line @next/next/no-img-element
          ? <img src={leader.photo_url} alt={leader.name} className="w-full h-full object-cover" />
          : (
            <div className="flex flex-col items-center gap-2">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-blue-400" style={{ background: 'var(--admin-accent-dim)', border: '1px solid var(--admin-accent-border)' }}>
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
            </div>
          )}
        <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-black/50 to-transparent" />
      </div>

      <div className="p-4 flex flex-col flex-1">
        <h3 className="font-bold text-slate-200 text-[13px] mb-1">{leader.name}</h3>

        {leader.phone && (
          <p className="text-[11px] flex items-center gap-1.5 mb-1" style={{ color: 'var(--admin-text-secondary)' }}>
            <svg className="w-3 h-3 text-slate-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            {leader.phone}
          </p>
        )}

        {leader.instagram_url && (
          <a href={leader.instagram_url} target="_blank" rel="noreferrer"
            className="text-[11px] flex items-center gap-1.5 mb-2 hover:text-purple-300 transition-colors" style={{ color: '#c4b5fd' }}>
            <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <rect width="20" height="20" x="2" y="2" rx="5" ry="5" /><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" /><line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
            </svg>
            Instagram
          </a>
        )}

        {leader.bio && (
          <p className="text-[11px] line-clamp-2 mb-3 leading-relaxed" style={{ color: 'var(--admin-text-muted)' }}>{leader.bio}</p>
        )}

        {cellName && (
          <div className="flex items-center gap-1.5 mt-auto mb-3 text-[11px] px-2.5 py-1.5 rounded-xl"
            style={{ background: 'var(--admin-surface-alt)', border: '1px solid var(--admin-border)', color: 'var(--admin-text-secondary)' }}>
            <svg className="w-3.5 h-3.5 text-blue-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <span className="truncate">{cellName}</span>
          </div>
        )}

        {canManage && (
          <div className="flex items-center justify-between pt-3 mt-auto" style={{ borderTop: '1px solid var(--admin-border)' }}>
            <div className="flex items-center gap-2">
              <Toggle checked={leader.is_active} onChange={onToggle} disabled={toggling} />
              <span className="text-[11px]" style={{ color: 'var(--admin-text-secondary)' }}>
                {leader.is_active ? 'Ativo' : 'Inativo'}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={onEdit} title="Editar" className="p-1.5 rounded-lg transition-all" style={{ color: 'var(--admin-text-muted)' }}
                onMouseEnter={e => { e.currentTarget.style.color = '#93c5fd'; e.currentTarget.style.background = 'rgba(37,99,235,0.1)'; }}
                onMouseLeave={e => { e.currentTarget.style.color = 'var(--admin-text-muted)'; e.currentTarget.style.background = 'transparent'; }}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
              {isSysAdmin && (
                <button onClick={onDelete} title="Remover" className="p-1.5 rounded-lg transition-all" style={{ color: 'var(--admin-text-muted)' }}
                  onMouseEnter={e => { e.currentTarget.style.color = '#f87171'; e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; }}
                  onMouseLeave={e => { e.currentTarget.style.color = 'var(--admin-text-muted)'; e.currentTarget.style.background = 'transparent'; }}>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
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

/* ─── Main ────────────────────────────────────────────────────── */
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

  useEffect(() => { setLeaders(initialLeaders); }, [initialLeaders]);

  const getLinkedCell = (leaderId: string) => cells.find(c => c.leader1_id === leaderId || c.leader2_id === leaderId);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const id = toast('loading', editing ? 'Salvando líder…' : 'Criando líder…');
      const result = editing ? await updateLeader(editing.id, formData) : await createLeader(formData);
      dismiss(id);
      const err = 'error' in result ? result.error : null;
      if (err) { toast('error', err); return; }
      toast('success', editing ? 'Líder atualizado!' : 'Líder criado!');
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
    if (!confirm(`Remover "${leader.name}"? Esta ação desvinculará o líder de todas as células.`)) return;
    startTransition(async () => {
      const id = toast('loading', 'Removendo…');
      const result = await deleteLeader(leader.id);
      dismiss(id);
      const err = 'error' in result ? result.error : null;
      if (err) { toast('error', err); return; }
      toast('success', 'Líder removido.');
      setLeaders(prev => prev.filter(l => l.id !== leader.id));
    });
  };

  const filtered = leaders.filter(l =>
    !search || l.name.toLowerCase().includes(search.toLowerCase()) ||
    (l.phone?.toLowerCase() ?? '').includes(search.toLowerCase())
  );

  const activeCount = leaders.filter(l => l.is_active).length;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total',    value: leaders.length,              color: '#3b82f6' },
          { label: 'Ativos',   value: activeCount,                 color: '#10b981' },
          { label: 'Inativos', value: leaders.length - activeCount, color: '#f59e0b' },
        ].map(s => (
          <div key={s.label} className="rounded-2xl p-4" style={{ background: 'var(--admin-surface)', border: '1px solid var(--admin-border)' }}>
            <p className="text-2xl font-black" style={{ color: s.color }}>{s.value}</p>
            <p className="text-[11px] font-semibold uppercase tracking-wide mt-0.5" style={{ color: 'var(--admin-text-secondary)' }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center">
        <div className="relative flex-1 w-full">
          <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-600 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por nome ou telefone…"
            className="w-full h-9 pl-9 pr-4 rounded-xl text-sm text-slate-200 placeholder-slate-600 outline-none transition-all"
            style={{ background: 'var(--admin-surface-alt)', border: '1px solid var(--admin-border)' }}
            onFocus={e => { e.target.style.borderColor = 'rgba(37,99,235,0.5)'; e.target.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.1)'; }}
            onBlur={e => { e.target.style.borderColor = 'var(--admin-border)'; e.target.style.boxShadow = 'none'; }}
          />
        </div>
        {canManage && (
          <AdminButton variant="primary" className="shrink-0"
            icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>}
            onClick={() => { setEditing(null); setIsOpen(true); }}>
            Novo Líder
          </AdminButton>
        )}
      </div>

      {/* Grid / Empty */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl" style={{ border: '1px dashed var(--admin-border-strong)', background: 'var(--admin-surface)' }}>
          <AdminEmptyState
            icon={search ? 'search' : 'members'}
            title={search ? 'Nenhum líder encontrado' : 'Nenhum líder cadastrado'}
            description={search ? 'Tente outros termos.' : 'Cadastre o primeiro líder para vinculá-lo a uma célula.'}
            action={canManage && !search ? (
              <AdminButton variant="primary"
                icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>}
                onClick={() => { setEditing(null); setIsOpen(true); }}>
                Cadastrar primeiro líder
              </AdminButton>
            ) : undefined}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filtered.map(leader => {
            const linked = getLinkedCell(leader.id);
            return (
              <LeaderCard key={leader.id} leader={leader} cellName={linked?.name ?? null}
                canManage={canManage} isSysAdmin={isSysAdmin}
                onEdit={() => { setEditing(leader); setIsOpen(true); }}
                onToggle={() => handleToggle(leader)}
                toggling={togglingId === leader.id}
                onDelete={() => handleDelete(leader)}
              />
            );
          })}
        </div>
      )}

      {isOpen && (
        <LeaderModal editing={editing} cells={cells}
          linkedCellId={editing ? getLinkedCell(editing.id)?.id ?? null : null}
          isPending={isPending} onClose={() => setIsOpen(false)} onSubmit={handleSubmit} />
      )}
    </div>
  );
}
