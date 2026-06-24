'use client'

import React, { useState, useTransition } from 'react';
import Link from 'next/link';
import type { TicketWithUser } from '@/features/support/types';
import {
  TICKET_STATUS_LABELS,
  TICKET_STATUS_COLORS,
  TICKET_URGENCY_LABELS,
  TICKET_URGENCY_COLORS,
} from '@/features/support/types';
import { MessageSquare, Clock, AlertTriangle, ChevronRight, Search, Bell } from 'lucide-react';

interface AdminSupportDashboardProps {
  tickets: TicketWithUser[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const diffM  = Math.floor(diffMs / 60000);
  if (diffM < 1)  return 'agora mesmo';
  if (diffM < 60) return `há ${diffM}min`;
  const diffH = Math.floor(diffM / 60);
  if (diffH < 24) return `há ${diffH}h`;
  const diffD = Math.floor(diffH / 24);
  return `há ${diffD}d`;
}

function StatusBadge({ status }: { status: TicketWithUser['status'] }) {
  const c = TICKET_STATUS_COLORS[status];
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold"
      style={{ background: c.bg, color: c.text }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: c.dot }} />
      {TICKET_STATUS_LABELS[status]}
    </span>
  );
}

function UrgencyBadge({ urgency }: { urgency: TicketWithUser['urgency'] }) {
  const c = TICKET_URGENCY_COLORS[urgency];
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide"
      style={{ background: c.bg, color: c.text }}
    >
      {TICKET_URGENCY_LABELS[urgency]}
    </span>
  );
}

// ─── Ticket Card ──────────────────────────────────────────────────────────────

function TicketCard({ ticket }: { ticket: TicketWithUser }) {
  const hasUnread = (ticket.unread_count ?? 0) > 0;

  return (
    <Link
      href={`/suporte/${ticket.id}`}
      className="block group"
    >
      <div
        className="px-5 py-4 rounded-xl transition-all duration-150 group-hover:scale-[1.005]"
        style={{
          background: hasUnread ? 'rgba(37,99,235,0.06)' : 'rgba(255,255,255,0.02)',
          border: `1px solid ${hasUnread ? 'rgba(37,99,235,0.2)' : 'rgba(255,255,255,0.07)'}`,
        }}
        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
        onMouseLeave={e => { e.currentTarget.style.background = hasUnread ? 'rgba(37,99,235,0.06)' : 'rgba(255,255,255,0.02)'; }}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5">
              <p className="text-[13px] font-semibold text-slate-100 truncate leading-tight">
                {ticket.subject}
              </p>
              {hasUnread && (
                <span
                  className="flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold shrink-0"
                  style={{ background: 'rgba(37,99,235,0.2)', color: '#93c5fd' }}
                >
                  <Bell className="w-2.5 h-2.5" />
                  {ticket.unread_count}
                </span>
              )}
            </div>
            <p className="text-[12px] text-slate-500 truncate">
              {(ticket.profiles as { full_name: string } | null)?.full_name ?? 'Usuário desconhecido'}
            </p>
          </div>
          <div className="flex flex-col items-end gap-2 shrink-0">
            <UrgencyBadge urgency={ticket.urgency} />
            <p className="text-[10px] text-slate-600 font-medium flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {timeAgo(ticket.updated_at)}
            </p>
          </div>
        </div>
        <div className="flex items-center justify-between mt-2">
          <StatusBadge status={ticket.status} />
          <ChevronRight className="w-4 h-4 text-slate-700 group-hover:text-slate-500 transition-colors" />
        </div>
      </div>
    </Link>
  );
}

// ─── Column ───────────────────────────────────────────────────────────────────

function Column({
  title,
  tickets,
  color,
  icon,
}: {
  title: string;
  tickets: TicketWithUser[];
  color: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-w-0">
      {/* Column Header */}
      <div
        className="flex items-center justify-between px-4 py-3 rounded-xl mb-3"
        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
      >
        <div className="flex items-center gap-2">
          <span style={{ color }}>{icon}</span>
          <span className="text-[13px] font-bold text-slate-200">{title}</span>
        </div>
        <span
          className="text-[11px] font-bold px-2 py-0.5 rounded-full"
          style={{ background: `${color}20`, color }}
        >
          {tickets.length}
        </span>
      </div>

      {/* Cards */}
      <div className="space-y-2 flex-1">
        {tickets.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center py-10 rounded-xl text-center"
            style={{ background: 'rgba(255,255,255,0.01)', border: '1px dashed rgba(255,255,255,0.06)' }}
          >
            <MessageSquare className="w-6 h-6 text-slate-700 mb-2" />
            <p className="text-[12px] text-slate-700">Nenhum chamado</p>
          </div>
        ) : (
          tickets.map(t => <TicketCard key={t.id} ticket={t} />)
        )}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function AdminSupportDashboard({ tickets }: AdminSupportDashboardProps) {
  const [search, setSearch] = useState('');
  const [urgencyFilter, setUrgencyFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');

  // Filter and sort
  const filtered = tickets.filter(t => {
    if (t.status === 'closed') return false;
    if (urgencyFilter !== 'all' && t.urgency !== urgencyFilter) return false;
    if (search) {
      const term = search.toLowerCase();
      const name = (t.profiles as { full_name: string } | null)?.full_name?.toLowerCase() ?? '';
      return t.subject.toLowerCase().includes(term) || name.includes(term);
    }
    return true;
  });

  // Sort: urgency HIGH first, then by wait time (oldest updated_at first)
  const urgencyOrder: Record<string, number> = { high: 0, medium: 1, low: 2 };
  const sorted = [...filtered].sort((a, b) => {
    const urgDiff = (urgencyOrder[a.urgency] ?? 2) - (urgencyOrder[b.urgency] ?? 2);
    if (urgDiff !== 0) return urgDiff;
    return new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime();
  });

  const pending     = sorted.filter(t => t.status === 'open');
  const inProgress  = sorted.filter(t => t.status === 'in_progress');
  const waitingUser = sorted.filter(t => t.status === 'waiting_user');

  const totalUnread = tickets.reduce((sum, t) => sum + (t.unread_count ?? 0), 0);

  return (
    <div>
      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Abertos', value: tickets.filter(t => t.status !== 'closed').length, color: '#3b82f6' },
          { label: 'Pendentes', value: tickets.filter(t => t.status === 'open').length, color: '#f59e0b' },
          { label: 'Em Atendimento', value: tickets.filter(t => t.status === 'in_progress').length, color: '#10b981' },
          { label: 'Não Lidos', value: totalUnread, color: '#f87171' },
        ].map(stat => (
          <div
            key={stat.label}
            className="px-5 py-4 rounded-2xl"
            style={{ background: 'var(--admin-surface)', border: '1px solid var(--admin-border)' }}
          >
            <p className="text-[11px] font-semibold uppercase tracking-wide mb-1" style={{ color: 'var(--admin-text-muted)' }}>
              {stat.label}
            </p>
            <p className="text-2xl font-black" style={{ color: stat.color }}>
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div
        className="flex flex-col sm:flex-row gap-3 mb-5 p-4 rounded-2xl"
        style={{ background: 'var(--admin-surface)', border: '1px solid var(--admin-border)' }}
      >
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-600 pointer-events-none" />
          <input
            type="text"
            placeholder="Buscar por assunto ou usuário…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full h-9 pl-9 pr-4 rounded-xl text-sm text-slate-200 placeholder-slate-600 outline-none transition-all"
            style={{ background: 'var(--admin-surface-alt)', border: '1px solid var(--admin-border)' }}
            onFocus={e => { e.currentTarget.style.borderColor = 'rgba(37,99,235,0.5)'; }}
            onBlur={e => { e.currentTarget.style.borderColor = 'var(--admin-border)'; }}
          />
        </div>
        <select
          value={urgencyFilter}
          onChange={e => setUrgencyFilter(e.target.value as typeof urgencyFilter)}
          className="h-9 px-3 rounded-xl text-[13px] text-slate-200 outline-none cursor-pointer"
          style={{ background: 'var(--admin-surface-alt)', border: '1px solid var(--admin-border)' }}
        >
          <option value="all" style={{ background: '#111d35' }}>Todas as urgências</option>
          <option value="high" style={{ background: '#111d35' }}>🔴 Alta</option>
          <option value="medium" style={{ background: '#111d35' }}>🟡 Média</option>
          <option value="low" style={{ background: '#111d35' }}>⚪ Baixa</option>
        </select>
      </div>

      {/* Alert for high urgency */}
      {tickets.filter(t => t.urgency === 'high' && t.status !== 'closed').length > 0 && (
        <div
          className="flex items-start gap-3 px-5 py-3.5 rounded-xl mb-5"
          style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}
        >
          <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
          <p className="text-[13px] text-red-300">
            <strong>{tickets.filter(t => t.urgency === 'high' && t.status !== 'closed').length}</strong>{' '}
            chamado(s) com urgência <strong>Alta</strong> aguardando atenção.
          </p>
        </div>
      )}

      {/* Kanban */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <Column
          title="Pendentes"
          tickets={pending}
          color="#3b82f6"
          icon={<MessageSquare className="w-4 h-4" />}
        />
        <Column
          title="Em Atendimento"
          tickets={inProgress}
          color="#10b981"
          icon={<Clock className="w-4 h-4" />}
        />
        <Column
          title="Aguardando Usuário"
          tickets={waitingUser}
          color="#8b5cf6"
          icon={<Bell className="w-4 h-4" />}
        />
      </div>
    </div>
  );
}
