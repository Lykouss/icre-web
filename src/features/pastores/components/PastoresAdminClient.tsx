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
import { AdminEmptyState } from '@/features/core/components/AdminEmptyState';
import { AdminButton } from '@/features/core/components/AdminUI';
import type { Pastor } from '@/features/portal/types';

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
        ? <img src={src} alt="" className="w-full h-full object-cover object-top" />
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

/* ─── Pastor Modal ────────────────────────────────────────────── */

function PastorModal({
  editing, isPending, onClose, onSubmit,
}: {
  editing: Pastor | null;
  isPending: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
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
            <h2 className="text-[15px] font-bold text-slate-100">{editing ? 'Editar Pastor(a)' : 'Novo(a) Pastor(a)'}</h2>
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
            <div className="flex flex-col sm:flex-row items-start gap-4">
              <PhotoPreview src={photoSrc} onChange={setPhotoSrc} />
              <div className="flex-1 space-y-3 w-full">
                <div>
                  <label className="block text-[11px] font-semibold mb-1.5" style={{ color: 'var(--admin-text-secondary)' }}>Nome Completo *</label>
                  <input name="name" defaultValue={editing?.name} required placeholder="Ex: Pastor João Silva"
                    className={inputCls} style={inputStyle} {...focusFns} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold mb-1.5" style={{ color: 'var(--admin-text-secondary)' }}>Cargo / Função *</label>
                    <input name="role" defaultValue={editing?.role} required placeholder="Ex: Pastor Titular"
                      className={inputCls} style={inputStyle} {...focusFns} />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold mb-1.5" style={{ color: 'var(--admin-text-secondary)' }}>Instagram (URL)</label>
                    <input name="instagram_url" type="url" defaultValue={editing?.instagram_url ?? ''} placeholder="https://instagram.com/pastor..."
                      className={inputCls} style={inputStyle} {...focusFns} />
                  </div>
                </div>
              </div>
            </div>

            {/* Bio */}
            <div>
              <label className="block text-[11px] font-semibold mb-1.5" style={{ color: 'var(--admin-text-secondary)' }}>Biografia</label>
              <textarea name="bio" rows={4} maxLength={600} defaultValue={editing?.bio ?? ''}
                placeholder="Uma breve descrição sobre o pastor, sua história e ministério..."
                className="w-full px-3 py-2.5 rounded-xl text-sm text-slate-200 placeholder-slate-600 outline-none transition-all resize-none"
                style={inputStyle} {...focusFns} />
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 px-6 py-4" style={{ borderTop: '1px solid var(--admin-border)', background: 'rgba(0,0,0,0.15)' }}>
            <AdminButton type="button" variant="ghost" onClick={onClose}>Cancelar</AdminButton>
            <AdminButton type="submit" variant="primary" loading={isPending}>
              {editing ? 'Salvar alterações' : 'Adicionar Pastor(a)'}
            </AdminButton>
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
    <div
      className={`rounded-2xl overflow-hidden flex flex-col sm:flex-row transition-all duration-200 hover:-translate-y-0.5 ${!pastor.is_active ? 'opacity-50' : ''}`}
      style={{ background: 'var(--admin-surface)', border: '1px solid var(--admin-border)', boxShadow: '0 2px 8px rgba(0,0,0,0.25)' }}
      onMouseEnter={e => { if (pastor.is_active) e.currentTarget.style.borderColor = 'rgba(37,99,235,0.3)'; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--admin-border)'; }}
    >
      {/* Photo side */}
      <div className="relative w-full sm:w-32 h-40 sm:h-auto overflow-hidden shrink-0 flex items-center justify-center" style={{ background: 'var(--admin-surface-alt)' }}>
        {pastor.photo_url
          // eslint-disable-next-line @next/next/no-img-element
          ? <img src={pastor.photo_url} alt={pastor.name} className="w-full h-full object-cover object-top" />
          : (
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center text-blue-400" style={{ background: 'var(--admin-accent-dim)', border: '1px solid var(--admin-accent-border)' }}>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
            </div>
          )}
        <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-black/50 to-transparent sm:hidden" />
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-1 min-w-0 w-full">
        <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-1">{pastor.role}</p>
        <h3 className="font-bold text-slate-100 text-[15px] mb-1 truncate">{pastor.name}</h3>
        
        {pastor.instagram_url && (
          <a href={pastor.instagram_url} target="_blank" rel="noreferrer"
            className="text-[11px] flex items-center gap-1.5 mb-2 hover:text-purple-300 transition-colors w-max" style={{ color: '#c4b5fd' }}>
            <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
            Instagram
          </a>
        )}
        {pastor.bio ? (
          <p className="text-[11px] line-clamp-2 leading-relaxed max-w-2xl" style={{ color: 'var(--admin-text-muted)' }}>{pastor.bio}</p>
        ) : (
          <p className="text-[11px] italic" style={{ color: 'var(--admin-text-muted)' }}>Sem biografia cadastrada.</p>
        )}

        {/* Actions */}
        {canManage && (
          <div className="flex items-center justify-between pt-3 mt-auto w-full" style={{ borderTop: '1px solid var(--admin-border)' }}>
            <div className="flex items-center gap-2">
              <Toggle checked={pastor.is_active} onChange={onToggle} disabled={toggling} />
              <span className="text-[11px]" style={{ color: 'var(--admin-text-secondary)' }}>
                {pastor.is_active ? 'Visível' : 'Oculto'}
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
      const toastId = toast('loading', editing ? 'Salvando...' : 'Adicionando pastor...');
      const result = editing
        ? await updatePastor(editing.id, formData)
        : await createPastor(formData);
      dismiss(toastId);
      const err = 'error' in result ? result.error : null;
      if (err) { toast('error', err); return; }
      toast('success', editing ? 'Pastor atualizado!' : 'Pastor adicionado com sucesso!');
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
    if (!confirm(`Tem certeza que deseja EXCLUIR DEFINITIVAMENTE "${pastor.name}"? Esta ação não pode ser desfeita.`)) return;
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
    <div className="w-full space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total',    value: pastors.length, color: '#3b82f6' },
          { label: 'Visíveis', value: visibleCount,   color: '#10b981' },
          { label: 'Ocultos',  value: hiddenCount,    color: '#f59e0b' },
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
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nome ou cargo..."
            className="w-full h-9 pl-9 pr-4 rounded-xl text-sm text-slate-200 placeholder-slate-600 outline-none transition-all"
            style={{ background: 'var(--admin-surface-alt)', border: '1px solid var(--admin-border)' }}
            onFocus={e => { e.target.style.borderColor = 'rgba(37,99,235,0.5)'; e.target.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.1)'; }}
            onBlur={e => { e.target.style.borderColor = 'var(--admin-border)'; e.target.style.boxShadow = 'none'; }}
          />
        </div>
        {canManage && (
          <AdminButton variant="primary" className="shrink-0"
            icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>}
            onClick={openCreate}>
            Novo Pastor
          </AdminButton>
        )}
      </div>

      {/* Grid or Empty */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl" style={{ border: '1px dashed var(--admin-border-strong)', background: 'var(--admin-surface)' }}>
          <AdminEmptyState
            icon={search ? 'search' : 'members'}
            title={search ? 'Nenhum pastor encontrado' : 'Nenhum pastor cadastrado'}
            description={search ? 'Tente outros termos.' : 'Adicione os pastores para exibi-los no portal.'}
            action={canManage && !search ? (
              <AdminButton variant="primary"
                icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>}
                onClick={openCreate}>
                Adicionar primeiro pastor
              </AdminButton>
            ) : undefined}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
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
