'use client'

import React, { useState, useEffect, useTransition, useRef, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  getAllFeedbacks,
  updateFeedbackStatus,
  toggleFeedbackPin,
  saveFeedbackNotes,
  deleteFeedback,
} from '@/features/support/actions/admin-feedback-actions';
import type { FeedbackItem, FeedbackStatus } from '@/features/support/actions/admin-feedback-actions';
import { Pin, Bug, Lightbulb, Trash2, Save, ChevronDown, Loader2, Search, AlertTriangle } from 'lucide-react';

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<FeedbackStatus, { label: string; bg: string; text: string; dot: string }> = {
  pending:    { label: 'Pendente',    bg: 'rgba(245,158,11,0.12)', text: '#fbbf24', dot: '#f59e0b' },
  in_review:  { label: 'Em análise', bg: 'rgba(59,130,246,0.12)',  text: '#60a5fa', dot: '#3b82f6' },
  resolved:   { label: 'Resolvido',  bg: 'rgba(34,197,94,0.12)',   text: '#4ade80', dot: '#22c55e' },
  dismissed:  { label: 'Descartado', bg: 'rgba(100,116,139,0.12)', text: '#94a3b8', dot: '#64748b' },
};

const TYPE_CONFIG = {
  bug:        { label: 'Bug',        icon: Bug,       bg: 'rgba(239,68,68,0.12)',   text: '#f87171' },
  suggestion: { label: 'Sugestão',   icon: Lightbulb, bg: 'rgba(251,191,36,0.12)',  text: '#fbbf24' },
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: FeedbackStatus }) {
  const c = STATUS_CONFIG[status];
  return (
    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold" style={{ background: c.bg, color: c.text }}>
      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: c.dot }} />
      {c.label}
    </span>
  );
}

function TypeBadge({ type }: { type: FeedbackItem['type'] }) {
  const c = TYPE_CONFIG[type];
  const Icon = c.icon;
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold" style={{ background: c.bg, color: c.text }}>
      <Icon className="w-3 h-3" />
      {c.label}
    </span>
  );
}

// ─── Metric Card ─────────────────────────────────────────────────────────────

function MetricCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="rounded-xl px-4 py-3 flex flex-col gap-1" style={{ background: 'var(--admin-card)', border: '1px solid var(--admin-border)' }}>
      <span className="text-[11px] text-slate-500 font-medium">{label}</span>
      <span className="text-2xl font-bold" style={{ color }}>{value}</span>
    </div>
  );
}

// ─── Feedback Card ────────────────────────────────────────────────────────────

function FeedbackCard({
  item,
  isSysAdmin,
  onPin,
  onStatusChange,
  onDelete,
}: {
  item: FeedbackItem;
  isSysAdmin: boolean;
  onPin: (id: string, pinned: boolean) => void;
  onStatusChange: (id: string, status: FeedbackStatus) => void;
  onDelete: (id: string) => void;
}) {
  const [noteText, setNoteText]     = useState(item.admin_notes ?? '');
  const [noteSaved, setNoteSaved]   = useState(false);
  const [notesPending, startNotes]  = useTransition();
  const [pinPending, startPin]      = useTransition();
  const [statusPending, startStatus] = useTransition();
  const [expanded, setExpanded]     = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isPinned = item.is_pinned;

  // Auto-save notes on change (debounced 1.5s)
  useEffect(() => {
    if (noteText === (item.admin_notes ?? '')) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      startNotes(async () => {
        await saveFeedbackNotes(item.id, noteText);
        setNoteSaved(true);
        setTimeout(() => setNoteSaved(false), 2000);
      });
    }, 1500);
    return () => { if (saveTimer.current) clearTimeout(saveTimer.current); };
  }, [noteText, item.admin_notes, item.id]);

  const userInitial = (item.profiles?.full_name ?? '?').charAt(0).toUpperCase();

  return (
    <div
      className="rounded-xl overflow-hidden transition-all"
      style={{
        background: isPinned ? 'rgba(251,191,36,0.04)' : 'var(--admin-card)',
        border: isPinned ? '1px solid rgba(251,191,36,0.2)' : '1px solid var(--admin-border)',
        boxShadow: isPinned ? '0 0 0 1px rgba(251,191,36,0.08)' : 'none',
      }}
    >
      {/* Header */}
      <div className="flex items-start gap-3 p-4">
        {/* Avatar */}
        <div
          className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-xs font-bold text-white"
          style={{
            background: item.profiles?.photo_url ? 'transparent' : 'rgba(100,116,139,0.3)',
            border: '1.5px solid rgba(100,116,139,0.3)',
            overflow: 'hidden',
          }}
        >
          {item.profiles?.photo_url
            // eslint-disable-next-line @next/next/no-img-element
            ? <img src={item.profiles.photo_url} alt={item.profiles.full_name} className="w-full h-full object-cover" />
            : userInitial
          }
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-1.5 mb-1">
            <span className="text-[12px] font-semibold text-slate-200">{item.profiles?.full_name ?? 'Usuário'}</span>
            <TypeBadge type={item.type} />
            <StatusBadge status={item.status} />
            {isPinned && (
              <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-amber-400">
                <Pin className="w-2.5 h-2.5 fill-current" /> Afixado
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-500">{formatDate(item.created_at)}</p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Pin toggle */}
          <button
            title={isPinned ? 'Desafixar' : 'Afixar'}
            onClick={() => startPin(async () => { await toggleFeedbackPin(item.id, !isPinned); onPin(item.id, !isPinned); })}
            disabled={pinPending}
            className={`p-1.5 rounded-lg transition-all ${isPinned ? 'text-amber-400 bg-amber-400/10' : 'text-slate-600 hover:text-amber-400 hover:bg-amber-400/10'}`}
          >
            {pinPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Pin className={`w-3.5 h-3.5 ${isPinned ? 'fill-current' : ''}`} />}
          </button>

          {/* Status dropdown */}
          <div className="relative group/status">
            <button
              className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] text-slate-400 hover:text-slate-200 transition-colors"
              style={{ border: '1px solid rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.03)' }}
            >
              {statusPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <ChevronDown className="w-3 h-3" />}
              Status
            </button>
            <div className="absolute right-0 top-full mt-1 z-30 opacity-0 pointer-events-none group-hover/status:opacity-100 group-hover/status:pointer-events-auto transition-all rounded-xl overflow-hidden"
              style={{ background: 'var(--admin-surface)', border: '1px solid var(--admin-border)', boxShadow: '0 8px 32px rgba(0,0,0,0.4)', minWidth: '130px' }}
            >
              {(Object.keys(STATUS_CONFIG) as FeedbackStatus[]).map(s => (
                <button
                  key={s}
                  onClick={() => startStatus(async () => { await updateFeedbackStatus(item.id, s); onStatusChange(item.id, s); })}
                  disabled={item.status === s}
                  className="flex items-center gap-2 w-full px-3 py-2 text-[11px] text-left hover:bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: STATUS_CONFIG[s].dot }} />
                  {STATUS_CONFIG[s].label}
                </button>
              ))}
            </div>
          </div>

          {/* Delete (sysadmin only) */}
          {isSysAdmin && (
            confirmDelete ? (
              <button
                onClick={() => onDelete(item.id)}
                className="px-2 py-1 rounded-lg text-[10px] font-bold text-red-300 transition-all"
                style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)' }}
              >
                Confirmar
              </button>
            ) : (
              <button
                title="Remover"
                onClick={() => setConfirmDelete(true)}
                onBlur={() => setTimeout(() => setConfirmDelete(false), 150)}
                className="p-1.5 rounded-lg text-slate-700 hover:text-red-400 hover:bg-red-400/10 transition-all"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )
          )}

          {/* Expand */}
          <button
            onClick={() => setExpanded(e => !e)}
            className="p-1.5 rounded-lg text-slate-600 hover:text-slate-300 transition-colors"
          >
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${expanded ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 pb-3">
        <p className="text-[13px] text-slate-300 leading-relaxed bg-white/[0.03] rounded-lg p-3" style={{ border: '1px solid rgba(255,255,255,0.05)' }}>
          {item.content}
        </p>
      </div>

      {/* Notes (expanded) */}
      {expanded && (
        <div className="px-4 pb-4 space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Anotações internas (privadas)</label>
            <div className="flex items-center gap-1.5">
              {notesPending && <Loader2 className="w-3 h-3 animate-spin text-slate-500" />}
              {noteSaved && !notesPending && <span className="text-[10px] text-emerald-400 flex items-center gap-1"><Save className="w-3 h-3" /> Salvo</span>}
            </div>
          </div>
          <textarea
            value={noteText}
            onChange={e => setNoteText(e.target.value)}
            placeholder="Adicione comentários internos sobre este feedback…"
            rows={3}
            maxLength={2000}
            className="w-full resize-none text-[12px] text-slate-300 placeholder-slate-600 rounded-lg px-3 py-2 outline-none transition-colors"
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.07)',
            }}
          />
        </div>
      )}
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────

export function AdminFeedbackDashboard({ isSysAdmin }: { isSysAdmin: boolean }) {
  const [items, setItems]         = useState<FeedbackItem[]>([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [filterType, setFilterType] = useState<'all' | 'bug' | 'suggestion'>('all');
  const [filterStatus, setFilterStatus] = useState<FeedbackStatus | 'all'>('all');

  const fetchAll = useCallback(async () => {
    const result = await getAllFeedbacks();
    if (result.data) setItems(result.data);
    setLoading(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Realtime: novo feedback sem refresh
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel('rt_feedback_dashboard')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'feedback' }, () => fetchAll())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchAll]);

  function handlePin(id: string, pinned: boolean) {
    setItems(prev => prev.map(i => i.id === id ? { ...i, is_pinned: pinned } : i)
      .sort((a, b) => Number(b.is_pinned) - Number(a.is_pinned) || new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    );
  }

  function handleStatusChange(id: string, status: FeedbackStatus) {
    setItems(prev => prev.map(i => i.id === id ? { ...i, status } : i));
  }

  async function handleDelete(id: string) {
    const result = await deleteFeedback(id);
    if (!result.error) setItems(prev => prev.filter(i => i.id !== id));
  }

  // Metrics
  const total      = items.length;
  const bugs       = items.filter(i => i.type === 'bug').length;
  const suggestions = items.filter(i => i.type === 'suggestion').length;
  const pending    = items.filter(i => i.status === 'pending').length;
  const resolved   = items.filter(i => i.status === 'resolved').length;

  // Filter & search
  const filtered = items.filter(i => {
    if (filterType !== 'all'   && i.type   !== filterType)   return false;
    if (filterStatus !== 'all' && i.status !== filterStatus) return false;
    if (search && !i.content.toLowerCase().includes(search.toLowerCase())
      && !(i.profiles?.full_name ?? '').toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const pinned   = filtered.filter(i => i.is_pinned);
  const unpinned = filtered.filter(i => !i.is_pinned);

  return (
    <div className="space-y-6">
      {/* Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <MetricCard label="Total"      value={total}       color="#94a3b8" />
        <MetricCard label="Bugs"       value={bugs}        color="#f87171" />
        <MetricCard label="Sugestões"  value={suggestions} color="#fbbf24" />
        <MetricCard label="Pendentes"  value={pending}     color="#fb923c" />
        <MetricCard label="Resolvidos" value={resolved}    color="#4ade80" />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div
          className="flex items-center gap-2 flex-1 min-w-[200px] px-3 py-2 rounded-xl"
          style={{ background: 'var(--admin-card)', border: '1px solid var(--admin-border)' }}
        >
          <Search className="w-3.5 h-3.5 text-slate-500 shrink-0" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar feedbacks ou usuários…"
            className="flex-1 bg-transparent text-[13px] text-slate-200 placeholder-slate-600 outline-none"
          />
        </div>

        {/* Type filter */}
        <div className="flex rounded-xl overflow-hidden" style={{ border: '1px solid var(--admin-border)' }}>
          {(['all', 'bug', 'suggestion'] as const).map(t => (
            <button key={t} onClick={() => setFilterType(t)}
              className={`px-3 py-2 text-[11px] font-semibold transition-colors ${filterType === t ? 'text-blue-300 bg-blue-500/15' : 'text-slate-500 hover:text-slate-300'}`}
              style={{ background: filterType === t ? undefined : 'var(--admin-card)' }}
            >
              {t === 'all' ? 'Todos' : t === 'bug' ? '🐛 Bugs' : '💡 Sugestões'}
            </button>
          ))}
        </div>

        {/* Status filter */}
        <div className="flex rounded-xl overflow-hidden" style={{ border: '1px solid var(--admin-border)' }}>
          {(['all', 'pending', 'in_review', 'resolved', 'dismissed'] as const).map(s => (
            <button key={s} onClick={() => setFilterStatus(s)}
              className={`px-3 py-2 text-[11px] font-semibold transition-colors ${filterStatus === s ? 'text-blue-300 bg-blue-500/15' : 'text-slate-500 hover:text-slate-300'}`}
              style={{ background: filterStatus === s ? undefined : 'var(--admin-card)' }}
            >
              {s === 'all' ? 'Todos status' : STATUS_CONFIG[s].label}
            </button>
          ))}
        </div>
      </div>

      {loading && (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-slate-500" />
        </div>
      )}

      {!loading && items.length === 0 && (
        <div className="flex flex-col items-center py-16 text-slate-600">
          <AlertTriangle className="w-10 h-10 mb-3" />
          <p className="text-sm">Nenhum feedback recebido ainda.</p>
        </div>
      )}

      {/* Pinned section */}
      {!loading && pinned.length > 0 && (
        <div>
          <h3 className="text-[11px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5 mb-3">
            <Pin className="w-3 h-3 fill-current" /> Afixados ({pinned.length})
          </h3>
          <div className="space-y-3">
            {pinned.map(item => (
              <FeedbackCard key={item.id} item={item} isSysAdmin={isSysAdmin}
                onPin={handlePin} onStatusChange={handleStatusChange} onDelete={handleDelete} />
            ))}
          </div>
        </div>
      )}

      {/* Main list */}
      {!loading && unpinned.length > 0 && (
        <div>
          {pinned.length > 0 && (
            <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-3">
              Todos os feedbacks ({unpinned.length})
            </h3>
          )}
          <div className="space-y-3">
            {unpinned.map(item => (
              <FeedbackCard key={item.id} item={item} isSysAdmin={isSysAdmin}
                onPin={handlePin} onStatusChange={handleStatusChange} onDelete={handleDelete} />
            ))}
          </div>
        </div>
      )}

      {!loading && filtered.length === 0 && items.length > 0 && (
        <div className="text-center py-10 text-slate-600 text-sm">
          Nenhum resultado para os filtros aplicados.
        </div>
      )}
    </div>
  );
}
