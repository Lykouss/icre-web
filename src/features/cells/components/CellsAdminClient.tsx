'use client'

import React, { useState, useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createCell, updateCell, toggleCellActive, deleteCell } from '@/features/cells/actions/cells';
import { useToast } from '@/features/core/components/ToastContext';
import type { Cell, MeetingType, Leader } from '@/features/portal/types';

const MEETING_TYPES: { value: MeetingType; label: string; color: string }[] = [
  { value: 'presencial', label: 'Presencial', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  { value: 'online',     label: 'Online',     color: 'bg-blue-100 text-blue-700 border-blue-200'         },
  { value: 'hibrido',    label: 'Híbrido',    color: 'bg-violet-100 text-violet-700 border-violet-200'   },
];

function Toggle({ checked, onChange, disabled }: { checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <button type="button" role="switch" aria-checked={checked} disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative w-10 h-6 rounded-full transition-colors duration-200 ${checked ? 'bg-blue-600' : 'bg-slate-200'} disabled:opacity-50`}>
      <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${checked ? 'translate-x-4' : 'translate-x-0'}`} />
    </button>
  );
}

function ImagePreview({ src, placeholder, onChange, name, aspectClass = 'aspect-video' }: {
  src: string | null; placeholder: React.ReactNode; onChange: (url: string | null) => void; name: string; aspectClass?: string;
}) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  return (
    <div className={`relative ${aspectClass} rounded-xl overflow-hidden bg-slate-100 border-2 border-dashed border-slate-200 hover:border-blue-400 transition-colors cursor-pointer group`}
      onClick={() => inputRef.current?.click()}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" className="w-full h-full object-cover" />
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 text-slate-400">
          {placeholder}
          <span className="text-xs">Clique para selecionar</span>
        </div>
      )}
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
      <input ref={inputRef} type="file" name={name} className="hidden" accept="image/jpeg,image/png,image/webp"
        onChange={e => { const f = e.target.files?.[0]; if (f) onChange(URL.createObjectURL(f)); }} />
    </div>
  );
}

/* ─── Cell Modal ──────────────────────────────────────────────── */

function CellModal({ editing, leaders, isPending, onClose, onSubmit }: {
  editing: Cell | null; leaders: Leader[]; isPending: boolean;
  onClose: () => void; onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
}) {
  const [bannerSrc, setBannerSrc] = useState<string | null>(editing?.image_url ?? null);
  const activeLeaders = leaders.filter(l => l.is_active !== false);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
          <h2 className="text-lg font-bold text-slate-900">{editing ? 'Editar Célula' : 'Nova Célula'}</h2>
          <button onClick={onClose} className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <form key={editing?.id ?? 'new'} onSubmit={onSubmit} className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-6">

            {/* Banner */}
            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Banner da Célula</h3>
              <ImagePreview src={bannerSrc} onChange={setBannerSrc} name="image" aspectClass="aspect-video"
                placeholder={<svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>}
              />
            </div>

            {/* Líderes */}
            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Líderes</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Líder 1</label>
                  <select name="leader1_id" defaultValue={editing?.leader1_id ?? ''} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 bg-white">
                    <option value="">— Nenhum —</option>
                    {activeLeaders.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Líder 2 (casal)</label>
                  <select name="leader2_id" defaultValue={editing?.leader2_id ?? ''} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 bg-white">
                    <option value="">— Nenhum —</option>
                    {activeLeaders.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {/* Informações */}
            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Informações</h3>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Nome da Célula *</label>
                <input name="name" defaultValue={editing?.name} required
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                  placeholder="Ex: Célula Renovação" />
              </div>
            </div>

            {/* Encontros */}
            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Encontros</h3>
              <div className="mb-3">
                <label className="block text-xs font-medium text-slate-600 mb-1.5">Tipo de Encontro</label>
                <div className="flex gap-2">
                  {MEETING_TYPES.map(t => (
                    <label key={t.value} className="flex-1 cursor-pointer">
                      <input type="radio" name="meeting_type" value={t.value} defaultChecked={editing ? editing.meeting_type === t.value : t.value === 'presencial'} className="peer sr-only" />
                      <div className={`text-center py-2 text-xs font-semibold rounded-lg border-2 peer-checked:${t.color} border-slate-200 peer-checked:border-current transition-all cursor-pointer hover:border-slate-300`}>{t.label}</div>
                    </label>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Dia(s) da Semana</label>
                  <input name="meeting_days" defaultValue={editing?.meeting_days ?? ''} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400" placeholder="Ex: Terças-feiras" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Horário</label>
                  <input name="meeting_time" defaultValue={editing?.meeting_time ?? ''} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400" placeholder="Ex: 19h30" />
                </div>
              </div>
            </div>

            {/* Localização */}
            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Localização</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Bairro</label>
                  <input name="neighborhood" defaultValue={editing?.neighborhood ?? ''} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400" placeholder="Ex: Centro" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Endereço</label>
                  <input name="address" defaultValue={editing?.address ?? ''} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400" placeholder="Rua, número..." />
                </div>
              </div>
            </div>

            {/* Contato */}
            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Contato e Redes</h3>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">WhatsApp</label>
                  <input name="contact_whatsapp" defaultValue={editing?.contact_whatsapp ?? ''} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400" placeholder="(00) 00000-0000" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Telefone</label>
                  <input name="contact_phone" defaultValue={editing?.contact_phone ?? ''} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400" placeholder="(00) 0000-0000" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">E-mail</label>
                  <input name="contact_email" type="email" defaultValue={editing?.contact_email ?? ''} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400" placeholder="celula@..." />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Instagram (@)</label>
                  <input name="instagram_url" type="url" defaultValue={editing?.instagram_url ?? ''} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400" placeholder="https://instagram.com/celula..." />
                </div>
              </div>
            </div>

            {/* Descrição */}
            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Descrição</h3>
              <textarea name="description" rows={3} defaultValue={editing?.description ?? ''}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 resize-none"
                placeholder="Conte um pouco sobre este grupo, quem frequenta, o propósito..." />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50/50 shrink-0">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors">Cancelar</button>
            <button type="submit" disabled={isPending} className="px-5 py-2 text-sm font-bold bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2">
              {isPending && <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/></svg>}
              {editing ? 'Salvar alterações' : 'Criar Célula'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ─── Cell Detail Modal ───────────────────────────────────────── */

function CellDetailModal({ cell, leader1, leader2, onClose, onEdit }: {
  cell: Cell; leader1: Leader | null; leader2: Leader | null; onClose: () => void; onEdit: () => void;
}) {
  const typeObj = MEETING_TYPES.find(t => t.value === cell.meeting_type) ?? MEETING_TYPES[0];
  const cellLeaders = [leader1, leader2].filter(Boolean) as Leader[];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>

        {/* Banner */}
        <div className="relative h-44 bg-gradient-to-br from-slate-200 to-slate-300 overflow-hidden rounded-t-2xl shrink-0">
          {cell.image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={cell.image_url} alt={cell.name} className="w-full h-full object-cover" />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <svg className="w-14 h-14 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
            </div>
          )}
          <button onClick={onClose} className="absolute top-3 right-3 p-2 bg-black/40 hover:bg-black/60 text-white rounded-full transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
          <span className={`absolute top-3 left-3 text-[10px] font-bold px-2 py-1 rounded-full border ${typeObj.color}`}>{typeObj.label}</span>
        </div>

        <div className="p-6 space-y-5">
          <div className="flex items-start justify-between gap-3">
            <h2 className="text-2xl font-bold text-slate-900">{cell.name}</h2>
            <button onClick={() => { onClose(); onEdit(); }} className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
              Editar
            </button>
          </div>

          {/* Líderes */}
          {cellLeaders.length > 0 && (
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Líderes</p>
              <div className="flex gap-3">
                {cellLeaders.map(l => (
                  <div key={l.id} className="flex items-center gap-2 bg-slate-50 rounded-xl px-3 py-2">
                    {l.photo_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={l.photo_url} alt={l.name} className="w-8 h-8 rounded-full object-cover ring-2 ring-white" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                        <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{l.name}</p>
                      {l.phone && <p className="text-xs text-slate-500">{l.phone}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Encontros */}
          {(cell.meeting_days || cell.meeting_time) && (
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <svg className="w-4 h-4 text-slate-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              {[cell.meeting_days, cell.meeting_time].filter(Boolean).join(' · ')}
            </div>
          )}

          {/* Localização */}
          {(cell.neighborhood || cell.address) && (
            <div className="flex items-start gap-2 text-sm text-slate-600">
              <svg className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              <span>{[cell.neighborhood, cell.address].filter(Boolean).join(' — ')}</span>
            </div>
          )}

          {/* Contatos */}
          <div className="flex flex-wrap gap-2">
            {cell.contact_whatsapp && (
              <a href={`https://wa.me/${cell.contact_whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noreferrer"
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg font-medium hover:bg-emerald-100 transition-colors">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                {cell.contact_whatsapp}
              </a>
            )}
            {cell.contact_phone && (
              <span className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-slate-50 text-slate-600 border border-slate-200 rounded-lg font-medium">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                {cell.contact_phone}
              </span>
            )}
            {cell.contact_email && (
              <a href={`mailto:${cell.contact_email}`} className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-slate-50 text-slate-600 border border-slate-200 rounded-lg font-medium hover:bg-slate-100 transition-colors">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                {cell.contact_email}
              </a>
            )}
            {cell.instagram_url && (
              <a href={cell.instagram_url} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-fuchsia-50 text-fuchsia-700 border border-fuchsia-200 rounded-lg font-medium hover:bg-fuchsia-100 transition-colors">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
                Instagram
              </a>
            )}
          </div>

          {/* Descrição */}
          {cell.description && (
            <p className="text-sm text-slate-600 leading-relaxed border-t border-slate-100 pt-4">{cell.description}</p>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Cell Card ───────────────────────────────────────────────── */

function CellCard({ cell, leader1, leader2, canManage, isSysAdmin, onEdit, onDetail, onToggle, toggling, onDelete }: {
  cell: Cell; leader1: Leader | null; leader2: Leader | null;
  canManage: boolean; isSysAdmin: boolean;
  onEdit: () => void; onDetail: () => void; onToggle: () => void; toggling: boolean; onDelete: () => void;
}) {
  const typeObj = MEETING_TYPES.find(t => t.value === cell.meeting_type) ?? MEETING_TYPES[0];
  const cellLeaders = [leader1, leader2].filter(Boolean) as Leader[];

  return (
    <div className={`bg-white rounded-2xl border overflow-hidden flex flex-col transition-all duration-200 hover:shadow-md ${cell.is_active ? 'border-slate-200' : 'border-slate-200 opacity-60'}`}>
      {/* Banner */}
      <div className="relative aspect-video bg-slate-100 overflow-hidden cursor-pointer" onClick={onDetail}>
        {cell.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={cell.image_url} alt={cell.name} className="w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200">
            <svg className="w-10 h-10 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
          </div>
        )}
        <span className={`absolute top-2 left-2 text-[10px] font-bold px-2 py-0.5 rounded-full border ${typeObj.color}`}>{typeObj.label}</span>
      </div>

      <div className="p-4 flex flex-col flex-1">
        <button onClick={onDetail} className="text-left mb-2">
          <h3 className="font-bold text-slate-900 text-sm leading-tight hover:text-blue-600 transition-colors">{cell.name}</h3>
          {cellLeaders.length > 0 && (
            <div className="flex items-center gap-1 mt-1">
              {cellLeaders.map(l => (
                <div key={l.id} className="flex items-center gap-1">
                  {l.photo_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={l.photo_url} alt={l.name} className="w-4 h-4 rounded-full object-cover" />
                  ) : (
                    <div className="w-4 h-4 rounded-full bg-blue-100 flex items-center justify-center">
                      <svg className="w-2.5 h-2.5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                    </div>
                  )}
                  <span className="text-xs text-slate-500">{l.name}</span>
                  {l !== cellLeaders[cellLeaders.length - 1] && <span className="text-slate-300 mx-0.5">&</span>}
                </div>
              ))}
            </div>
          )}
        </button>

        {cell.description && <p className="text-xs text-slate-500 line-clamp-2 mb-3 leading-relaxed">{cell.description}</p>}

        <div className="space-y-1 mb-3 mt-auto">
          {(cell.meeting_days || cell.meeting_time) && (
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              {[cell.meeting_days, cell.meeting_time].filter(Boolean).join(' · ')}
            </div>
          )}
          {cell.neighborhood && (
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              {cell.neighborhood}
            </div>
          )}
        </div>

        {canManage && (
          <div className="flex items-center justify-between pt-3 border-t border-slate-100">
            <div className="flex items-center gap-2">
              <Toggle checked={cell.is_active} onChange={onToggle} disabled={toggling} />
              <span className="text-xs text-slate-500">{cell.is_active ? 'Ativa' : 'Inativa'}</span>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={onEdit} className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors" title="Editar">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
              </button>
              {isSysAdmin && (
                <button onClick={onDelete} className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors" title="Remover">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
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
  initialCells: Cell[];
  leaders: Leader[];
  canManage: boolean;
  isSysAdmin: boolean;
}

export function CellsAdminClient({ initialCells, leaders, canManage, isSysAdmin }: Props) {
  const router = useRouter();
  const { toast, dismiss } = useToast();
  const [cells, setCells] = useState(initialCells);
  const [isOpen, setIsOpen] = useState(false);
  const [editing, setEditing] = useState<Cell | null>(null);
  const [detailCell, setDetailCell] = useState<Cell | null>(null);
  const [isPending, startTransition] = useTransition();
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  // Sincronizar as props com o state ao recarregar (ex: router.refresh)
  useEffect(() => {
    setCells(initialCells);
  }, [initialCells]);

  const openCreate = () => { setEditing(null); setIsOpen(true); };
  const openEdit   = (c: Cell) => { setEditing(c); setIsOpen(true); };

  const getLeader = (id: string | null | undefined) => leaders.find(l => l.id === id) ?? null;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const toastId = toast('loading', editing ? 'Salvando célula...' : 'Criando célula...');
      const result = editing ? await updateCell(editing.id, formData) : await createCell(formData);
      dismiss(toastId);
      const err = 'error' in result ? result.error : null;
      if (err) { toast('error', err); return; }
      toast('success', editing ? 'Célula atualizada!' : 'Célula criada com sucesso!');
      setIsOpen(false);
      router.refresh();
    });
  };

  const handleToggle = (cell: Cell) => {
    setTogglingId(cell.id);
    startTransition(async () => {
      const result = await toggleCellActive(cell.id, !cell.is_active);
      setTogglingId(null);
      const err = 'error' in result ? result.error : null;
      if (err) { toast('error', err); return; }
      setCells(prev => prev.map(c => c.id === cell.id ? { ...c, is_active: !c.is_active } : c));
    });
  };

  const handleDelete = (cell: Cell) => {
    if (!confirm(`Remover "${cell.name}"? Esta ação ocultará a célula do portal.`)) return;
    startTransition(async () => {
      const toastId = toast('loading', 'Removendo...');
      const result = await deleteCell(cell.id);
      dismiss(toastId);
      const err = 'error' in result ? result.error : null;
      if (err) { toast('error', err); return; }
      toast('success', 'Célula removida do portal.');
      setCells(prev => prev.filter(c => c.id !== cell.id));
    });
  };

  const filtered = cells.filter(c =>
    !search ||
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.neighborhood?.toLowerCase() ?? '').includes(search.toLowerCase())
  );

  const activeCount   = cells.filter(c => c.is_active).length;
  const inactiveCount = cells.length - activeCount;

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Células</h1>
          <p className="text-slate-500 mt-1.5 text-sm">Gerencie os grupos de célula e suas informações exibidas no portal público.</p>
        </div>
        {canManage && (
          <button onClick={openCreate} className="shrink-0 flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold rounded-xl transition-colors shadow-sm">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
            Nova Célula
          </button>
        )}
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Total',    value: cells.length,   color: 'text-slate-600',   bg: 'bg-slate-50 border-slate-200' },
          { label: 'Ativas',   value: activeCount,    color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200' },
          { label: 'Inativas', value: inactiveCount,  color: 'text-amber-600',   bg: 'bg-amber-50 border-amber-200' },
        ].map(s => (
          <div key={s.label} className={`rounded-xl border p-4 ${s.bg}`}>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="relative mb-6">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por nome ou bairro..."
          className="w-full pl-9 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400" />
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50">
          <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
          </div>
          <p className="text-slate-700 font-semibold mb-1">{search ? 'Nenhuma célula encontrada' : 'Nenhuma célula cadastrada'}</p>
          <p className="text-slate-400 text-sm mb-6">{search ? 'Tente outros termos de busca.' : 'Crie a primeira célula para exibi-la no portal.'}</p>
          {canManage && !search && (
            <button onClick={openCreate} className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold rounded-xl transition-colors">Criar primeira célula</button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map(cell => (
            <CellCard
              key={cell.id}
              cell={cell}
              leader1={getLeader(cell.leader1_id)}
              leader2={getLeader(cell.leader2_id)}
              canManage={canManage}
              isSysAdmin={isSysAdmin}
              onEdit={() => openEdit(cell)}
              onDetail={() => setDetailCell(cell)}
              onToggle={() => handleToggle(cell)}
              toggling={togglingId === cell.id}
              onDelete={() => handleDelete(cell)}
            />
          ))}
        </div>
      )}

      {isOpen && (
        <CellModal editing={editing} leaders={leaders} isPending={isPending} onClose={() => setIsOpen(false)} onSubmit={handleSubmit} />
      )}

      {detailCell && (
        <CellDetailModal
          cell={detailCell}
          leader1={getLeader(detailCell.leader1_id)}
          leader2={getLeader(detailCell.leader2_id)}
          onClose={() => setDetailCell(null)}
          onEdit={() => { setDetailCell(null); openEdit(detailCell); }}
        />
      )}
    </div>
  );
}
