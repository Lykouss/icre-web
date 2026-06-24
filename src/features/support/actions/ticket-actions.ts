'use server'

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import type {
  Ticket,
  TicketMessage,
  TicketWithUser,
  TicketMessageWithSender,
  TicketUrgency,
  ActionResult,
} from '@/features/support/types';

const MAX_ATTACHMENTS_PER_MESSAGE = 3;
const MAX_ATTACHMENTS_PER_TICKET  = 15;

// ─────────────────────────────────────────────────────────────────────────────
// getUserTicket — busca o chamado aberto (não fechado) do usuário atual
// ─────────────────────────────────────────────────────────────────────────────

export async function getUserTicket(): Promise<ActionResult<{ ticket: Ticket; messages: TicketMessageWithSender[] } | null>> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Não autenticado.' };

  const { data: ticket, error: ticketError } = await supabase
    .from('support_tickets')
    .select('*')
    .eq('user_id', user.id)
    .neq('status', 'closed')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (ticketError) {
    console.error('[getUserTicket]', ticketError.message);
    return { error: 'Erro ao buscar chamado.' };
  }

  if (!ticket) return { data: null };

  const { data: messages, error: msgsError } = await supabase
    .from('support_ticket_messages')
    .select('*, profiles(full_name)')
    .eq('ticket_id', ticket.id)
    .order('created_at', { ascending: true });

  if (msgsError) {
    console.error('[getUserTicket:messages]', msgsError.message);
    return { error: 'Erro ao buscar mensagens.' };
  }

  return {
    data: {
      ticket: ticket as Ticket,
      messages: (messages ?? []) as TicketMessageWithSender[],
    },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// openTicket — abre um novo chamado
// ─────────────────────────────────────────────────────────────────────────────

export async function openTicket(
  subject: string,
  description: string,
  attachmentUrls: string[]
): Promise<ActionResult<{ ticketId: string }>> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Não autenticado.' };

  const cleanSubject     = subject.trim().slice(0, 120);
  const cleanDescription = description.trim().slice(0, 2000);
  const cleanUrls        = attachmentUrls.slice(0, MAX_ATTACHMENTS_PER_MESSAGE);

  if (cleanSubject.length < 5)     return { error: 'O assunto deve ter pelo menos 5 caracteres.' };
  if (cleanDescription.length < 10) return { error: 'A descrição deve ter pelo menos 10 caracteres.' };

  // Verifica se já tem chamado aberto
  const { count } = await supabase
    .from('support_tickets')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .neq('status', 'closed');

  if ((count ?? 0) > 0) {
    return { error: 'Você já possui um chamado em aberto. Finalize-o antes de abrir um novo.' };
  }

  const { data: ticket, error: insertError } = await supabase
    .from('support_tickets')
    .insert({
      user_id:     user.id,
      subject:     cleanSubject,
      description: cleanDescription,
      status:      'open',
      urgency:     'low',
    })
    .select('id')
    .single();

  if (insertError || !ticket) {
    console.error('[openTicket]', insertError?.message);
    return { error: 'Erro ao abrir chamado. Tente novamente.' };
  }

  // Insere a mensagem inicial com a descrição e possíveis anexos
  if (cleanDescription || cleanUrls.length > 0) {
    const { error: msgError } = await supabase
      .from('support_ticket_messages')
      .insert({
        ticket_id:       ticket.id,
        sender_id:       user.id,
        is_admin:        false,
        content:         cleanDescription,
        attachment_urls: cleanUrls,
      });

    if (msgError) {
      console.error('[openTicket:initial_msg]', msgError.message);
    }
  }

  return { data: { ticketId: ticket.id } };
}

// ─────────────────────────────────────────────────────────────────────────────
// sendUserMessage — envia mensagem num chamado existente
// ─────────────────────────────────────────────────────────────────────────────

export async function sendUserMessage(
  ticketId: string,
  content: string,
  attachmentUrls: string[]
): Promise<ActionResult<TicketMessage>> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Não autenticado.' };

  const cleanContent = content.trim().slice(0, 4000);
  const cleanUrls    = attachmentUrls.slice(0, MAX_ATTACHMENTS_PER_MESSAGE);

  if (!cleanContent && cleanUrls.length === 0) {
    return { error: 'A mensagem não pode estar vazia.' };
  }

  // Verifica que o ticket pertence ao usuário e está aberto
  const { data: ticket } = await supabase
    .from('support_tickets')
    .select('id, user_id, status')
    .eq('id', ticketId)
    .eq('user_id', user.id)
    .neq('status', 'closed')
    .single();

  if (!ticket) return { error: 'Chamado não encontrado ou já encerrado.' };

  // Rate limit: 5 mensagens por minuto
  const { data: allowed } = await supabase.rpc('rpc_check_chat_rate_limit', {
    p_ticket_id:  ticketId,
    p_sender_id:  user.id,
  });

  if (!allowed) {
    return { error: 'Limite de mensagens atingido. Aguarde um minuto antes de enviar mais.' };
  }

  // Verifica limite global de anexos por chamado (15 no total)
  if (cleanUrls.length > 0) {
    const { count: existingAttachCount } = await supabase
      .from('support_ticket_messages')
      .select('id', { count: 'exact', head: true })
      .eq('ticket_id', ticketId);

    // Contagem aproximada — para exatidão real seria necessário unnest no banco
    // Aqui verificamos de forma simples se ultrapassamos o limite de mensagens com anexo
    if ((existingAttachCount ?? 0) >= MAX_ATTACHMENTS_PER_TICKET) {
      return { error: 'Limite de anexos por chamado atingido (máx. 15 arquivos).' };
    }
  }

  const { data: message, error: insertError } = await supabase
    .from('support_ticket_messages')
    .insert({
      ticket_id:       ticketId,
      sender_id:       user.id,
      is_admin:        false,
      content:         cleanContent || '(arquivo enviado)',
      attachment_urls: cleanUrls,
    })
    .select('*')
    .single();

  if (insertError || !message) {
    console.error('[sendUserMessage]', insertError?.message);
    return { error: 'Erro ao enviar mensagem. Tente novamente.' };
  }

  // Ao usuário responder, status passa para 'open' (saindo de waiting_user)
  if (ticket.status === 'waiting_user') {
    await supabase
      .from('support_tickets')
      .update({ status: 'open' })
      .eq('id', ticketId);
  }

  return { data: message as TicketMessage };
}

// ─────────────────────────────────────────────────────────────────────────────
// closeUserTicket — usuário fecha seu próprio chamado
// ─────────────────────────────────────────────────────────────────────────────

export async function closeUserTicket(ticketId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Não autenticado.' };

  const { error } = await supabase
    .from('support_tickets')
    .update({ status: 'closed', closed_at: new Date().toISOString() })
    .eq('id', ticketId)
    .eq('user_id', user.id)
    .neq('status', 'closed');

  if (error) {
    console.error('[closeUserTicket]', error.message);
    return { error: 'Erro ao encerrar chamado.' };
  }

  return {};
}

// ─────────────────────────────────────────────────────────────────────────────
// getSignedUploadUrl — gera URL assinada para upload de arquivo
// ─────────────────────────────────────────────────────────────────────────────

export async function getSignedUploadUrl(
  fileName: string,
  fileType: string
): Promise<ActionResult<{ token: string; path: string }>> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Não autenticado.' };

  const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'application/pdf'];
  if (!allowedTypes.includes(fileType)) {
    return { error: 'Tipo de arquivo não permitido. Use PNG, JPG, WEBP ou PDF.' };
  }

  const sanitizedName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 100);
  const path = `${user.id}/${Date.now()}_${sanitizedName}`;

  const { data, error } = await supabase.storage
    .from('support_attachments')
    .createSignedUploadUrl(path);

  if (error || !data) {
    console.error('[getSignedUploadUrl]', error?.message);
    return { error: 'Erro ao preparar upload.' };
  }

  return { data: { token: data.token, path } };
}

// ─────────────────────────────────────────────────────────────────────────────
// getPublicUrl — retorna URL pública assinada para download de anexo
// ─────────────────────────────────────────────────────────────────────────────

export async function getFileSignedUrl(path: string): Promise<ActionResult<{ url: string }>> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Não autenticado.' };

  const { data, error } = await supabase.storage
    .from('support_attachments')
    .createSignedUrl(path, 3600); // 1 hora

  if (error || !data) {
    return { error: 'Arquivo não encontrado.' };
  }

  return { data: { url: data.signedUrl } };
}

// ─────────────────────────────────────────────────────────────────────────────
// markAdminMessagesAsRead — usuário marca as mensagens do admin como lidas
// ─────────────────────────────────────────────────────────────────────────────

export async function markAdminMessagesAsRead(ticketId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Não autenticado.' };

  const { error } = await supabase
    .from('support_ticket_messages')
    .update({ read_at: new Date().toISOString() })
    .eq('ticket_id', ticketId)
    .eq('is_admin', true)
    .is('read_at', null);

  if (error) {
    console.error('[markAdminMessagesAsRead]', error.message);
    return { error: 'Erro ao atualizar status de leitura.' };
  }

  return {};
}
