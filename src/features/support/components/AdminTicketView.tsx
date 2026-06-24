'use client'

import React, { useState, useTransition, useRef, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  adminSendMessage,
  updateTicketUrgency,
  updateTicketStatus,
  adminCloseTicket,
  markMessagesAsRead,
} from '@/features/support/actions/admin-support-actions';
import { getSignedUploadUrl } from '@/features/support/actions/ticket-actions';
import type { TicketWithUser, TicketMessageWithSender, TicketUrgency, TicketStatus } from '@/features/support/types';
import {
  TICKET_STATUS_LABELS,
  TICKET_STATUS_COLORS,
  TICKET_URGENCY_LABELS,
  TICKET_URGENCY_COLORS,
} from '@/features/support/types';
import { Send, Loader2, Paperclip, X, User, Mail, Calendar, ArrowLeft, ShieldAlert, CheckCircle } from 'lucide-react';
import Link from 'next/link';

// ─── Props ────────────────────────────────────────────────────────────────────

interface AdminTicketViewProps {
  ticket: TicketWithUser;
  initialMessages: TicketMessageWithSender[];
  userInfo: {
    full_name: string;
    email: string;
    created_at: string;
  };
  adminUserId: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
}

function StatusBadge({ status }: { status: TicketWithUser['status'] }) {
  const c = TICKET_STATUS_COLORS[status];
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold" style={{ background: c.bg, color: c.text }}>
      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: c.dot }} />
      {TICKET_STATUS_LABELS[status]}
    </span>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function AdminTicketView({
  ticket: initialTicket,
  initialMessages,
  userInfo,
  adminUserId,
}: AdminTicketViewProps) {
  const [ticket, setTicket]     = useState(initialTicket);
  const [messages, setMessages] = useState<TicketMessageWithSender[]>(initialMessages);
  const [inputValue, setInputValue] = useState('');
  const [isPending, startTransition]     = useTransition();
  const [closePending, startCloseTransition] = useTransition();
  const [error, setError]       = useState('');
  const [uploadedUrls, setUploadedUrls] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileRef         = useRef<HTMLInputElement>(null);
  const messagesEndRef  = useRef<HTMLDivElement>(null);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Mark messages read on mount
  useEffect(() => {
    markMessagesAsRead(ticket.id);
  }, [ticket.id]);

  // Realtime subscription
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`admin_ticket_${ticket.id}`)
      .on(
        'postgres_changes',
        {
          event:  'INSERT',
          schema: 'public',
          table:  'support_ticket_messages',
          filter: `ticket_id=eq.${ticket.id}`,
        },
        payload => {
          const newMsg = payload.new as TicketMessageWithSender;
          setMessages(prev => {
            if (prev.some(m => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event:  'UPDATE',
          schema: 'public',
          table:  'support_tickets',
          filter: `id=eq.${ticket.id}`,
        },
        payload => {
          setTicket(prev => ({ ...prev, ...(payload.new as TicketWithUser) }));
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [ticket.id]);

  // File upload
  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length || uploadedUrls.length >= 3) return;
    setUploading(true);
    const supabase = createClient();
    const urls: string[] = [];
    for (const file of files.slice(0, 3 - uploadedUrls.length)) {
      const result = await getSignedUploadUrl(file.name, file.type);
      if (result.error || !result.data) continue;
      const { signedUrl, path } = result.data;
      const res = await supabase.storage.from('support_attachments').uploadToSignedUrl(path, signedUrl, file);
      if (!res.error) urls.push(path);
    }
    setUploadedUrls(prev => [...prev, ...urls]);
    setUploading(false);
    if (fileRef.current) fileRef.current.value = '';
  }

  function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!inputValue.trim() && uploadedUrls.length === 0) return;
    setError('');
    startTransition(async () => {
      const result = await adminSendMessage(ticket.id, inputValue, uploadedUrls);
      if (result.error) { setError(result.error); return; }
      setInputValue('');
      setUploadedUrls([]);
      if (result.data) {
        setMessages(prev => {
          if (prev.some(m => m.id === result.data!.id)) return prev;
          return [...prev, result.data!];
        });
      }
    });
  }

  function handleUrgencyChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const newUrgency = e.target.value as TicketUrgency;
    startTransition(async () => {
      const result = await updateTicketUrgency(ticket.id, newUrgency);
      if (!result.error) setTicket(prev => ({ ...prev, urgency: newUrgency }));
    });
  }

  function handleStatusChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const newStatus = e.target.value as Exclude<TicketStatus, 'closed'>;
    startTransition(async () => {
      const result = await updateTicketStatus(ticket.id, newStatus);
      if (!result.error) setTicket(prev => ({ ...prev, status: newStatus }));
    });
  }

  function handleClose() {
    if (!confirm('Encerrar este chamado definitivamente?')) return;
    startCloseTransition(async () => {
      const result = await adminCloseTicket(ticket.id);
      if (result.error) { setError(result.error); return; }
      setTicket(prev => ({ ...prev, status: 'closed', closed_at: new Date().toISOString() }));
    });
  }

  const isClosed = ticket.status === 'closed';

  const selectStyle: React.CSSProperties = {
    background: 'var(--admin-surface-alt)',
    border: '1px solid var(--admin-border)',
    color: 'var(--admin-text-primary)',
  };

  return (
    <div className="flex flex-col lg:flex-row gap-5 h-full">

      {/* ── Left: Chat ─────────────────────────────────────────────────────── */}
      <div className="flex-1 min-w-0 flex flex-col" style={{ height: 'calc(100vh - 160px)' }}>
        {/* Chat Header */}
        <div
          className="flex items-center justify-between px-5 py-4 rounded-t-2xl shrink-0"
          style={{ background: 'var(--admin-surface)', border: '1px solid var(--admin-border)', borderBottom: 'none' }}
        >
          <div className="flex items-center gap-3 min-w-0">
            <Link
              href="/suporte"
              className="w-8 h-8 flex items-center justify-center rounded-xl text-slate-500 hover:text-slate-300 hover:bg-white/8 transition-all shrink-0"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div className="min-w-0">
              <h2 className="text-[15px] font-bold text-slate-100 truncate leading-tight">{ticket.subject}</h2>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {userInfo.full_name} · ID {ticket.id.slice(0, 8)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <StatusBadge status={ticket.status} />
          </div>
        </div>

        {/* Controls bar */}
        {!isClosed && (
          <div
            className="flex flex-wrap items-center gap-3 px-5 py-3 shrink-0"
            style={{ background: 'rgba(0,0,0,0.1)', border: '1px solid var(--admin-border)', borderTop: 'none', borderBottom: 'none' }}
          >
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-3.5 h-3.5 text-slate-600" />
              <select
                value={ticket.urgency}
                onChange={handleUrgencyChange}
                className="h-7 px-2 rounded-lg text-[12px] outline-none cursor-pointer"
                style={selectStyle}
              >
                <option value="low"    style={{ background: '#111d35' }}>⚪ Urgência: Baixa</option>
                <option value="medium" style={{ background: '#111d35' }}>🟡 Urgência: Média</option>
                <option value="high"   style={{ background: '#111d35' }}>🔴 Urgência: Alta</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={ticket.status}
                onChange={handleStatusChange}
                className="h-7 px-2 rounded-lg text-[12px] outline-none cursor-pointer"
                style={selectStyle}
              >
                <option value="open"         style={{ background: '#111d35' }}>Aberto</option>
                <option value="in_progress"  style={{ background: '#111d35' }}>Em Análise</option>
                <option value="waiting_user" style={{ background: '#111d35' }}>Aguardando Usuário</option>
              </select>
            </div>
            <button
              onClick={handleClose}
              disabled={closePending}
              className="flex items-center gap-1.5 h-7 px-3 rounded-lg text-[12px] font-semibold transition-all disabled:opacity-50 ml-auto"
              style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)' }}
            >
              {closePending ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3" />}
              Encerrar Chamado
            </button>
          </div>
        )}

        {/* Messages */}
        <div
          className="flex-1 overflow-y-auto px-5 py-4 space-y-4 portal-scroll"
          style={{ background: 'rgba(6,11,23,0.6)', border: '1px solid var(--admin-border)', borderTop: 'none', borderBottom: 'none' }}
        >
          {messages.map((msg, i) => {
            const isAdminMsg = msg.is_admin;
            const showDate =
              i === 0 ||
              new Date(msg.created_at).toDateString() !== new Date(messages[i - 1].created_at).toDateString();

            return (
              <React.Fragment key={msg.id}>
                {showDate && (
                  <div className="flex items-center gap-3 my-2">
                    <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
                    <span className="text-[10px] text-slate-600 font-medium">{formatDate(msg.created_at)}</span>
                    <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
                  </div>
                )}
                <div className={`flex ${isAdminMsg ? 'justify-end' : 'justify-start'}`}>
                  <div className="max-w-[75%] space-y-1">
                    {!isAdminMsg && (
                      <p className="text-[10px] font-semibold text-slate-500 px-1">
                        {userInfo.full_name}
                      </p>
                    )}
                    {isAdminMsg && (
                      <p className="text-[10px] font-semibold text-blue-400 text-right px-1">Você (Suporte)</p>
                    )}
                    <div
                      className="px-4 py-3 rounded-2xl text-[13px] leading-relaxed"
                      style={
                        isAdminMsg
                          ? { background: 'rgba(37,99,235,0.2)', color: '#dbeafe', border: '1px solid rgba(37,99,235,0.3)', borderBottomRightRadius: '4px' }
                          : { background: 'rgba(255,255,255,0.06)', color: '#cbd5e1', border: '1px solid rgba(255,255,255,0.08)', borderBottomLeftRadius: '4px' }
                      }
                    >
                      {msg.content}
                      {msg.attachment_urls.length > 0 && (
                        <div className="mt-2 space-y-1">
                          {msg.attachment_urls.map((url, ai) => (
                            <div key={ai} className="flex items-center gap-1.5 text-[11px] opacity-70">
                              <Paperclip className="w-3 h-3" />
                              <span className="truncate">{url.split('/').pop()}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <p className={`text-[10px] text-slate-700 px-1 ${isAdminMsg ? 'text-right' : 'text-left'}`}>
                      {formatTime(msg.created_at)}
                      {!isAdminMsg && msg.read_at && (
                        <span className="ml-1.5 text-blue-600/50">• lido</span>
                      )}
                    </p>
                  </div>
                </div>
              </React.Fragment>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Footer */}
        {isClosed ? (
          <div
            className="px-5 py-4 rounded-b-2xl text-center text-sm text-slate-500"
            style={{ background: 'var(--admin-surface)', border: '1px solid var(--admin-border)', borderTop: 'none' }}
          >
            Este chamado foi encerrado em {ticket.closed_at ? formatDate(ticket.closed_at) : '—'}.
          </div>
        ) : (
          <div
            className="rounded-b-2xl"
            style={{ background: 'var(--admin-surface)', border: '1px solid var(--admin-border)', borderTop: 'none' }}
          >
            {uploadedUrls.length > 0 && (
              <div className="flex flex-wrap gap-2 px-4 pt-3">
                {uploadedUrls.map((url, i) => (
                  <div key={i} className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] text-slate-400" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid var(--admin-border)' }}>
                    <Paperclip className="w-3 h-3" />
                    <span className="max-w-[100px] truncate">{url.split('/').pop()}</span>
                    <button onClick={() => setUploadedUrls(p => p.filter((_, j) => j !== i))} className="text-slate-600 hover:text-red-400 transition-colors">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            {error && (
              <div className="mx-4 mt-2 px-3 py-2 rounded-lg text-[12px] text-red-400" style={{ background: 'rgba(239,68,68,0.1)' }}>
                {error}
              </div>
            )}
            <form onSubmit={handleSend} className="flex items-end gap-2 p-3">
              <input ref={fileRef} type="file" className="hidden" accept=".png,.jpg,.jpeg,.webp,.pdf" multiple onChange={handleFileChange} />
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={uploading || uploadedUrls.length >= 3}
                className="p-2.5 rounded-xl text-slate-600 hover:text-slate-300 transition-colors disabled:opacity-40 shrink-0"
              >
                {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Paperclip className="w-5 h-5" />}
              </button>
              <input
                type="text"
                value={inputValue}
                onChange={e => setInputValue(e.target.value)}
                placeholder="Responder ao usuário…"
                className="flex-1 h-11 px-4 rounded-xl text-sm text-slate-200 placeholder-slate-600 outline-none transition-all"
                style={{ background: 'var(--admin-surface-alt)', border: '1px solid var(--admin-border)' }}
                onFocus={e => { e.currentTarget.style.borderColor = 'rgba(37,99,235,0.5)'; }}
                onBlur={e => { e.currentTarget.style.borderColor = 'var(--admin-border)'; }}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(e as unknown as React.FormEvent); } }}
              />
              <button
                type="submit"
                disabled={isPending || (!inputValue.trim() && uploadedUrls.length === 0)}
                className="w-11 h-11 flex items-center justify-center rounded-xl text-white transition-all disabled:opacity-40 shrink-0"
                style={{ background: 'var(--admin-accent)' }}
              >
                {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </form>
          </div>
        )}
      </div>

      {/* ── Right: User Sidebar ────────────────────────────────────────────── */}
      <div className="lg:w-72 shrink-0 space-y-4">
        {/* User Info Card */}
        <div
          className="rounded-2xl overflow-hidden"
          style={{ background: 'var(--admin-surface)', border: '1px solid var(--admin-border)' }}
        >
          <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--admin-border)' }}>
            <p className="text-[11px] font-bold uppercase tracking-wide" style={{ color: 'var(--admin-text-muted)' }}>
              Dados do Usuário
            </p>
          </div>
          <div className="p-4 space-y-4">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-300 font-bold text-sm shrink-0"
                style={{ background: 'rgba(37,99,235,0.15)', border: '1px solid rgba(37,99,235,0.2)' }}
              >
                {userInfo.full_name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-[13px] font-bold text-slate-100 truncate">{userInfo.full_name}</p>
                <p className="text-[10px] text-slate-600">Usuário</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <Mail className="w-3.5 h-3.5 text-slate-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-[10px] text-slate-600 mb-0.5">E-mail</p>
                  <p className="text-[12px] text-slate-300 break-all">{userInfo.email}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Calendar className="w-3.5 h-3.5 text-slate-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-[10px] text-slate-600 mb-0.5">Membro desde</p>
                  <p className="text-[12px] text-slate-300">
                    {userInfo.created_at ? formatDate(userInfo.created_at) : '—'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Ticket Info Card */}
        <div
          className="rounded-2xl overflow-hidden"
          style={{ background: 'var(--admin-surface)', border: '1px solid var(--admin-border)' }}
        >
          <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--admin-border)' }}>
            <p className="text-[11px] font-bold uppercase tracking-wide" style={{ color: 'var(--admin-text-muted)' }}>
              Info do Chamado
            </p>
          </div>
          <div className="p-4 space-y-3">
            <div>
              <p className="text-[10px] text-slate-600 mb-1">Status atual</p>
              <StatusBadge status={ticket.status} />
            </div>
            <div>
              <p className="text-[10px] text-slate-600 mb-1">Urgência</p>
              <span
                className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide"
                style={{ background: TICKET_URGENCY_COLORS[ticket.urgency].bg, color: TICKET_URGENCY_COLORS[ticket.urgency].text }}
              >
                {TICKET_URGENCY_LABELS[ticket.urgency]}
              </span>
            </div>
            <div>
              <p className="text-[10px] text-slate-600 mb-0.5">Aberto em</p>
              <p className="text-[12px] text-slate-400">{formatDate(ticket.created_at)}</p>
            </div>
            {ticket.closed_at && (
              <div>
                <p className="text-[10px] text-slate-600 mb-0.5">Encerrado em</p>
                <p className="text-[12px] text-slate-400">{formatDate(ticket.closed_at)}</p>
              </div>
            )}
            <div>
              <p className="text-[10px] text-slate-600 mb-0.5">Total de mensagens</p>
              <p className="text-[12px] text-slate-400">{messages.length}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
