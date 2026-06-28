'use client'

import React, { useState, useTransition, useRef, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  openTicket,
  sendUserMessage,
  closeUserTicket,
  getSignedUploadUrl,
  markAdminMessagesAsRead,
} from '@/features/support/actions/ticket-actions';
import type { Ticket, TicketMessageWithSender } from '@/features/support/types';
import {
  TICKET_STATUS_LABELS,
  TICKET_STATUS_COLORS,
  TICKET_URGENCY_LABELS,
  TICKET_URGENCY_COLORS,
} from '@/features/support/types';
import { Paperclip, Send, X, AlertTriangle, MessageSquare, Plus, Loader2 } from 'lucide-react';
import { AttachmentButton } from '@/features/support/components/AttachmentViewer';


// ─── Types ────────────────────────────────────────────────────────────────────

interface SupportClientProps {
  userId: string;
  initialTicket: Ticket | null;
  initialMessages: TicketMessageWithSender[];
}

// ─── Badge Component ──────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: Ticket['status'] }) {
  const c = TICKET_STATUS_COLORS[status];
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold"
      style={{ background: c.bg, color: c.text }}
    >
      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: c.dot }} />
      {TICKET_STATUS_LABELS[status]}
    </span>
  );
}

function UrgencyBadge({ urgency }: { urgency: Ticket['urgency'] }) {
  const c = TICKET_URGENCY_COLORS[urgency];
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold"
      style={{ background: c.bg, color: c.text }}
    >
      {TICKET_URGENCY_LABELS[urgency]}
    </span>
  );
}

// ─── Open Ticket Modal ────────────────────────────────────────────────────────

function OpenTicketModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: (ticket: Ticket, messages: TicketMessageWithSender[]) => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [subject, setSubject]       = useState('');
  const [description, setDescription] = useState('');
  const [error, setError]           = useState('');
  const [uploadingFiles, setUploadingFiles] = useState<File[]>([]);
  const [uploadedUrls, setUploadedUrls]     = useState<string[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const allFiles = Array.from(e.target.files ?? []);
    
    // Validar tamanho (5MB)
    const validFiles = allFiles.filter(f => f.size <= 5 * 1024 * 1024);
    if (validFiles.length < allFiles.length) {
      setError('Alguns arquivos excederam o limite de 5MB e foram descartados.');
    }

    const remaining = 3 - uploadedUrls.length;
    if (validFiles.length === 0 || remaining <= 0) return;

    const toUpload = validFiles.slice(0, remaining);
    setUploadingFiles(toUpload);

    const supabase = createClient();
    const urls: string[] = [];

    for (const file of toUpload) {
      const result = await getSignedUploadUrl(file.name, file.type);
      if (result.error || !result.data) {
        setError(result.error ?? 'Erro no upload.');
        continue;
      }
      const { token, path } = result.data;
      const uploadRes = await supabase.storage.from('support_attachments').uploadToSignedUrl(path, token, file);
      if (uploadRes.error) {
        setError('Erro ao enviar arquivo: ' + uploadRes.error.message);
        continue;
      }
      urls.push(path);
    }

    setUploadedUrls(prev => [...prev, ...urls]);
    setUploadingFiles([]);
    if (fileRef.current) fileRef.current.value = '';
  }

  function removeAttachment(idx: number) {
    setUploadedUrls(prev => prev.filter((_, i) => i !== idx));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    startTransition(async () => {
      const result = await openTicket(subject, description, uploadedUrls);
      if (result.error) { setError(result.error); return; }
      // Recarrega a página para buscar o ticket recém criado
      window.location.reload();
    });
  }

  const inputStyle: React.CSSProperties = {
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.1)',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div
        className="relative w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden"
        style={{ background: '#0d1526', border: '1px solid rgba(255,255,255,0.12)', animation: 'modal-in 0.25s ease-out' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(37,99,235,0.15)', border: '1px solid rgba(37,99,235,0.3)' }}>
              <MessageSquare className="w-4.5 h-4.5 text-blue-400" />
            </div>
            <div>
              <h2 className="text-[15px] font-bold text-slate-100">Abrir Novo Chamado</h2>
              <p className="text-[11px] text-slate-500">Descreva o que aconteceu</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl text-slate-500 hover:text-slate-300 hover:bg-white/8 transition-all">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-1.5">
            <label className="block text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              Assunto <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              required
              value={subject}
              onChange={e => setSubject(e.target.value)}
              placeholder="Ex.: Não consigo acessar meu comprovante"
              maxLength={120}
              className="w-full h-10 px-4 rounded-xl text-sm text-slate-200 placeholder-slate-600 outline-none transition-all"
              style={inputStyle}
              onFocus={e => { e.currentTarget.style.borderColor = 'rgba(59,130,246,0.5)'; }}
              onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              Descrição <span className="text-red-400">*</span>
            </label>
            <textarea
              required
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Breve descrição do que aconteceu…"
              rows={4}
              maxLength={2000}
              className="w-full px-4 py-3 rounded-xl text-sm text-slate-200 placeholder-slate-600 outline-none transition-all resize-none"
              style={inputStyle}
              onFocus={e => { e.currentTarget.style.borderColor = 'rgba(59,130,246,0.5)'; }}
              onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}
            />
            <p className="text-right text-[11px] text-slate-600">{description.length}/2000</p>
          </div>

          {/* Attachments */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                Anexos <span className="text-slate-600 normal-case font-normal">(opcional, máx. 3)</span>
              </label>
              {uploadedUrls.length < 3 && (
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  disabled={uploadingFiles.length > 0}
                  className="flex items-center gap-1.5 text-[12px] font-semibold text-blue-400 hover:text-blue-300 transition-colors disabled:opacity-50"
                >
                  <Paperclip className="w-3.5 h-3.5" />
                  Adicionar arquivo
                </button>
              )}
            </div>
            <input
              ref={fileRef}
              type="file"
              className="hidden"
              accept=".png,.jpg,.jpeg,.webp,.pdf"
              multiple
              onChange={handleFileChange}
            />
            {uploadingFiles.length > 0 && (
              <div className="flex items-center gap-2 text-[12px] text-slate-500">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Enviando {uploadingFiles.length} arquivo(s)…
              </div>
            )}
            {uploadedUrls.length > 0 && (
              <div className="space-y-1">
                {uploadedUrls.map((url, i) => (
                  <div key={i} className="flex items-center justify-between px-3 py-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                    <span className="text-[12px] text-slate-400 truncate">{url.split('/').pop()}</span>
                    <button type="button" onClick={() => removeAttachment(i)} className="ml-2 text-slate-600 hover:text-red-400 transition-colors">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {error && (
            <div className="flex items-center gap-2 px-4 py-3 rounded-xl text-[13px] font-medium text-red-400" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
              <AlertTriangle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isPending}
            className="w-full h-11 flex items-center justify-center gap-2 rounded-xl font-semibold text-sm text-white transition-all disabled:opacity-50"
            style={{ background: 'var(--admin-accent, #2563eb)' }}
          >
            {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {isPending ? 'Abrindo chamado…' : 'Abrir Chamado'}
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── Avatar Component ─────────────────────────────────────────────────────────

function MsgAvatar({ name, avatarUrl, isAdmin }: { name: string; avatarUrl?: string | null; isAdmin: boolean }) {
  const initials = name.trim().split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase() || '?';
  const bg = isAdmin ? 'rgba(37,99,235,0.25)' : 'rgba(100,116,139,0.25)';
  return (
    <div
      className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-[11px] font-bold text-white overflow-hidden"
      style={{ background: bg, border: `1.5px solid ${isAdmin ? 'rgba(37,99,235,0.4)' : 'rgba(100,116,139,0.4)'}` }}
    >
      {avatarUrl
        // eslint-disable-next-line @next/next/no-img-element
        ? <img src={avatarUrl} alt={name} className="w-full h-full object-cover" />
        : initials
      }
    </div>
  );
}

// ─── Chat Interface ───────────────────────────────────────────────────────────

function ChatInterface({
  userId,
  ticket,
  initialMessages,
}: {
  userId: string;
  ticket: Ticket;
  initialMessages: TicketMessageWithSender[];
}) {
  const [messages, setMessages] = useState<TicketMessageWithSender[]>(initialMessages);
  const [inputValue, setInputValue] = useState('');
  const [isPending, startTransition] = useTransition();
  const [isClosed, setIsClosed]     = useState(false);
  const [closePending, startCloseTransition] = useTransition();
  const [error, setError]           = useState('');
  const [uploadedUrls, setUploadedUrls] = useState<string[]>([]);
  const [uploading, setUploading]   = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileRef        = useRef<HTMLInputElement>(null);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Mark admin messages as read
  useEffect(() => {
    const hasUnreadAdmin = messages.some(m => m.is_admin && !m.read_at);
    if (hasUnreadAdmin) {
      markAdminMessagesAsRead(ticket.id).then(() => {
        setMessages(prev => prev.map(m => (m.is_admin && !m.read_at ? { ...m, read_at: new Date().toISOString() } : m)));
      });
    }
  }, [messages, ticket.id]);

  // Realtime: ao receber um INSERT, buscamos a mensagem completa (com profiles) do banco
  useEffect(() => {
    const supabase = createClient();

    async function fetchAndAppend(msgId: string) {
      const { data } = await supabase
        .from('support_ticket_messages')
        .select('*, profiles(full_name, photo_url)')
        .eq('id', msgId)
        .single();
      if (!data) return;
      setMessages(prev => {
        if (prev.some(m => m.id === data.id)) return prev;
        return [...prev, data as TicketMessageWithSender];
      });
    }

    const channel = supabase
      .channel(`ticket_chat_${ticket.id}`)
      .on(
        'postgres_changes',
        {
          event:  'INSERT',
          schema: 'public',
          table:  'support_ticket_messages',
          filter: `ticket_id=eq.${ticket.id}`,
        },
        payload => { fetchAndAppend((payload.new as { id: string }).id); }
      )
      .on(
        'postgres_changes',
        {
          event:  'UPDATE',
          schema: 'public',
          table:  'support_ticket_messages',
          filter: `ticket_id=eq.${ticket.id}`,
        },
        payload => {
          const updated = payload.new as TicketMessageWithSender;
          setMessages(prev => prev.map(m => m.id === updated.id ? { ...m, ...updated } : m));
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          // Subscription confirmed
        }
      });

    return () => { supabase.removeChannel(channel); };
  }, [ticket.id]);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const allFiles = Array.from(e.target.files ?? []);
    
    // Validar tamanho (5MB)
    const validFiles = allFiles.filter(f => f.size <= 5 * 1024 * 1024);
    if (validFiles.length < allFiles.length) {
      setError('Alguns arquivos excederam o limite de 5MB e foram descartados.');
    }

    const remaining = 3 - uploadedUrls.length;
    if (!validFiles.length || remaining <= 0) return;

    setUploading(true);
    const supabase = createClient();
    const urls: string[] = [];

    for (const file of validFiles.slice(0, remaining)) {
      const result = await getSignedUploadUrl(file.name, file.type);
      if (result.error || !result.data) continue;
      const { token, path } = result.data;
      const res = await supabase.storage.from('support_attachments').uploadToSignedUrl(path, token, file);
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
    const contentToSend = inputValue;
    const urlsToSend = uploadedUrls;
    setInputValue('');
    setUploadedUrls([]);
    startTransition(async () => {
      const result = await sendUserMessage(ticket.id, contentToSend, urlsToSend);
      if (result.error) {
        setError(result.error);
        setInputValue(contentToSend);
        setUploadedUrls(urlsToSend);
        return;
      }
      if (result.data) {
        setMessages(prev => {
          if (prev.some(m => m.id === result.data!.id)) return prev;
          return [...prev, result.data!];
        });
      }
    });
  }

  function handleClose() {
    if (!confirm('Tem certeza que deseja encerrar este chamado?')) return;
    startCloseTransition(async () => {
      const result = await closeUserTicket(ticket.id);
      if (result.error) { setError(result.error); return; }
      setIsClosed(true);
    });
  }

  const isTicketClosed = ticket.status === 'closed' || isClosed;

  function formatTime(iso: string) {
    return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
  }

  return (
    <div className="flex flex-col h-full" style={{ maxHeight: 'calc(100vh - 200px)', minHeight: '500px' }}>
      {/* Header */}
      <div
        className="flex items-center justify-between px-5 py-4 rounded-t-2xl"
        style={{ background: 'rgba(13,21,38,1)', border: '1px solid rgba(255,255,255,0.08)', borderBottom: 'none' }}
      >
        <div>
          <h2 className="text-[15px] font-bold text-slate-100 leading-tight">{ticket.subject}</h2>
          <div className="flex items-center gap-2 mt-1.5">
            <StatusBadge status={ticket.status} />
            <UrgencyBadge urgency={ticket.urgency} />
          </div>
        </div>
        {!isTicketClosed && (
          <button
            onClick={handleClose}
            disabled={closePending}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12px] font-semibold transition-all disabled:opacity-50"
            style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)' }}
          >
            {closePending ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
            Encerrar chamado
          </button>
        )}
      </div>

      {/* Messages */}
      <div
        className="flex-1 overflow-y-auto px-4 py-4 space-y-3 portal-scroll"
        style={{ background: 'rgba(6,11,23,0.8)', border: '1px solid rgba(255,255,255,0.06)', borderTop: 'none', borderBottom: 'none' }}
      >
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center py-12">
            <MessageSquare className="w-10 h-10 text-slate-700 mb-3" />
            <p className="text-slate-500 text-sm">Nenhuma mensagem ainda.</p>
            <p className="text-slate-700 text-xs mt-1">Descreva seu problema no campo abaixo.</p>
          </div>
        )}

        {messages.map((msg, i) => {
          const isOwn = msg.sender_id === userId && !msg.is_admin;
          const senderName = msg.is_admin ? 'Suporte ICRE' : (msg.profiles?.full_name ?? 'Usuário');
          const avatarUrl = (msg.profiles as { full_name: string; photo_url?: string | null } | null)?.photo_url;
          const showDate =
            i === 0 ||
            new Date(msg.created_at).toDateString() !==
              new Date(messages[i - 1].created_at).toDateString();
          const showAvatar =
            i === messages.length - 1 ||
            messages[i + 1]?.sender_id !== msg.sender_id ||
            messages[i + 1]?.is_admin !== msg.is_admin;

          return (
            <React.Fragment key={msg.id}>
              {showDate && (
                <div className="flex items-center gap-3 my-3">
                  <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
                  <span className="text-[10px] text-slate-600 font-medium">{formatDate(msg.created_at)}</span>
                  <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
                </div>
              )}

              <div className={`flex items-end gap-2 ${isOwn ? 'justify-end' : 'justify-start'}`}>
                {/* Avatar esquerda (não-próprio) */}
                {!isOwn && (
                  <div className="w-8 shrink-0">
                    {showAvatar
                      ? <MsgAvatar name={senderName} avatarUrl={avatarUrl} isAdmin={msg.is_admin} />
                      : <div className="w-8" />
                    }
                  </div>
                )}

                <div className="max-w-[72%] space-y-0.5">
                  {/* Nome do remetente */}
                  {!isOwn && showAvatar && (
                    <p className={`text-[10px] font-semibold px-1 ${msg.is_admin ? 'text-blue-400' : 'text-slate-400'}`}>
                      {senderName}
                    </p>
                  )}
                  {isOwn && showAvatar && (
                    <p className="text-[10px] font-semibold text-slate-400 px-1 text-right">Você</p>
                  )}

                  {/* Bolha da mensagem */}
                  <div
                    className="px-4 py-2.5 rounded-2xl text-[13px] leading-relaxed"
                    style={
                      isOwn
                        ? { background: 'rgba(37,99,235,0.25)', color: '#dbeafe', border: '1px solid rgba(37,99,235,0.3)', borderBottomRightRadius: '4px' }
                        : { background: 'rgba(255,255,255,0.06)', color: '#cbd5e1', border: '1px solid rgba(255,255,255,0.08)', borderBottomLeftRadius: '4px' }
                    }
                  >
                    {msg.content}
                    {msg.attachment_urls.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {msg.attachment_urls.map((url, ai) => (
                          <AttachmentButton key={ai} rawPath={url} />
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Timestamp */}
                  <p className={`text-[10px] text-slate-700 px-1 ${isOwn ? 'text-right' : 'text-left'}`}>
                    {formatTime(msg.created_at)}
                  </p>
                </div>

                {/* Avatar direita (próprio) */}
                {isOwn && (
                  <div className="w-8 shrink-0">
                    {showAvatar
                      ? <MsgAvatar name="Você" avatarUrl={null} isAdmin={false} />
                      : <div className="w-8" />
                    }
                  </div>
                )}
              </div>
            </React.Fragment>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Footer */}
      {isTicketClosed ? (
        <div
          className="px-5 py-4 rounded-b-2xl text-center text-sm text-slate-500"
          style={{ background: 'rgba(13,21,38,1)', border: '1px solid rgba(255,255,255,0.08)', borderTop: 'none' }}
        >
          Este chamado foi encerrado.
        </div>
      ) : (
        <div
          className="rounded-b-2xl"
          style={{ background: 'rgba(13,21,38,1)', border: '1px solid rgba(255,255,255,0.08)', borderTop: 'none' }}
        >
          {uploadedUrls.length > 0 && (
            <div className="flex flex-wrap gap-2 px-4 pt-3">
              {uploadedUrls.map((url, i) => (
                <div key={i} className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] text-slate-400" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}>
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
              title="Anexar arquivo"
            >
              {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Paperclip className="w-5 h-5" />}
            </button>
            <input
              type="text"
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              placeholder="Digite sua mensagem…"
              className="flex-1 h-11 px-4 rounded-xl text-sm text-slate-200 placeholder-slate-600 outline-none transition-all"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
              onFocus={e => { e.currentTarget.style.borderColor = 'rgba(59,130,246,0.4)'; }}
              onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(e as unknown as React.FormEvent); } }}
            />
            <button
              type="submit"
              disabled={isPending || (!inputValue.trim() && uploadedUrls.length === 0)}
              className="w-11 h-11 flex items-center justify-center rounded-xl text-white transition-all disabled:opacity-40 shrink-0"
              style={{ background: 'var(--admin-accent, #2563eb)' }}
            >
              {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

// ─── No Ticket State ──────────────────────────────────────────────────────────

function NoTicketState({ onOpenModal }: { onOpenModal: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div
        className="w-20 h-20 rounded-2xl flex items-center justify-center mb-6"
        style={{ background: 'rgba(37,99,235,0.12)', border: '1px solid rgba(37,99,235,0.2)' }}
      >
        <MessageSquare className="w-9 h-9 text-blue-400" />
      </div>
      <h2 className="text-xl font-bold text-slate-100 mb-2">Precisa de ajuda específica?</h2>
      <p className="text-slate-400 text-sm max-w-sm mb-6 leading-relaxed">
        Abra um chamado e nossa equipe responderá em breve.
      </p>

      {/* Alerta de regras */}
      <div
        className="flex items-start gap-3 px-5 py-4 rounded-2xl text-left max-w-md mb-8"
        style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' }}
      >
        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        <div>
          <p className="text-[13px] font-semibold text-amber-300 mb-1">Atenção</p>
          <p className="text-[12px] text-amber-200/70 leading-relaxed">
            Só é permitido ter <strong className="text-amber-200">1 (um) chamado aberto</strong> por vez.
            Chamados sem interação do usuário por <strong className="text-amber-200">15 dias</strong> são encerrados automaticamente.
          </p>
        </div>
      </div>

      <button
        onClick={onOpenModal}
        className="flex items-center gap-2 px-8 py-3 rounded-xl font-bold text-white transition-all hover:scale-105"
        style={{ background: 'var(--admin-accent, #2563eb)', boxShadow: '0 4px 20px rgba(37,99,235,0.3)' }}
        onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 4px 30px rgba(37,99,235,0.5)')}
        onMouseLeave={e => (e.currentTarget.style.boxShadow = '0 4px 20px rgba(37,99,235,0.3)')}
      >
        <Plus className="w-5 h-5" />
        Abrir Novo Chamado
      </button>
    </div>
  );
}

// ─── Main Export ──────────────────────────────────────────────────────────────

export function SupportClient({ userId, initialTicket, initialMessages }: SupportClientProps) {
  const [showModal, setShowModal] = useState(false);

  return (
    <div
      className="min-h-screen"
      style={{
        background: 'radial-gradient(ellipse 80% 50% at 50% 0%, rgba(37,99,235,0.08) 0%, transparent 60%), #060b17',
      }}
    >
      <div className="max-w-3xl mx-auto px-4 pt-32 pb-16">
        {/* Page Header */}
        <div className="mb-8">
          <div
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[12px] font-semibold mb-4"
            style={{ background: 'rgba(37,99,235,0.15)', color: '#93c5fd', border: '1px solid rgba(37,99,235,0.25)' }}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            Suporte Técnico
          </div>
          <h1 className="text-3xl font-black text-white">Seus Chamados</h1>
          <p className="text-slate-400 mt-1">Fale diretamente com nossa equipe de suporte.</p>
        </div>

        {initialTicket ? (
          <ChatInterface
            userId={userId}
            ticket={initialTicket}
            initialMessages={initialMessages}
          />
        ) : (
          <NoTicketState onOpenModal={() => setShowModal(true)} />
        )}
      </div>

      {showModal && (
        <OpenTicketModal
          onClose={() => setShowModal(false)}
          onSuccess={() => setShowModal(false)}
        />
      )}
    </div>
  );
}
