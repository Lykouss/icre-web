'use server'

import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/features/core/api/get-current-user';
import type {
  TicketWithUser,
  TicketMessageWithSender,
  TicketUrgency,
  TicketStatus,
  ActionResult,
} from '@/features/support/types';

const ADMIN_ROLES = ['SYSADMIN', 'CHURCH_ADMIN', 'LEADER', 'FINANCE_ADMIN'] as const;

async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user || !user.roles.some(r => (ADMIN_ROLES as ReadonlyArray<string>).includes(r))) {
    return null;
  }
  return user;
}

// ─────────────────────────────────────────────────────────────────────────────
// getAllTickets — lista todos os tickets com contagem de mensagens não lidas
// ─────────────────────────────────────────────────────────────────────────────

export async function getAllTickets(): Promise<ActionResult<TicketWithUser[]>> {
  const admin = await requireAdmin();
  if (!admin) return { error: 'Acesso negado.' };

  const supabase = await createClient();

  const { data, error } = await supabase
    .from('support_tickets')
    .select(`
      *,
      profiles:user_id (
        full_name,
        created_at
      )
    `)
    .order('urgency', { ascending: false })
    .order('updated_at', { ascending: true });

  if (error) {
    console.error('[getAllTickets]', error.message);
    return { error: 'Erro ao buscar chamados.' };
  }

  // Busca contagem de mensagens não lidas por ticket (mensagens de usuário sem read_at)
  const { data: unreadCounts } = await supabase
    .from('support_ticket_messages')
    .select('ticket_id')
    .eq('is_admin', false)
    .is('read_at', null);

  const unreadMap = new Map<string, number>();
  for (const row of unreadCounts ?? []) {
    const id = row.ticket_id as string;
    unreadMap.set(id, (unreadMap.get(id) ?? 0) + 1);
  }

  const tickets = (data ?? []).map(t => ({
    ...t,
    unread_count: unreadMap.get(t.id) ?? 0,
  })) as TicketWithUser[];

  return { data: tickets };
}

// ─────────────────────────────────────────────────────────────────────────────
// getTicketWithMessages — detalhe do ticket para visão do admin
// ─────────────────────────────────────────────────────────────────────────────

export interface TicketDetail {
  ticket: TicketWithUser;
  messages: TicketMessageWithSender[];
  userInfo: {
    full_name: string;
    email: string;
    created_at: string;
  };
}

export async function getTicketWithMessages(
  ticketId: string
): Promise<ActionResult<TicketDetail>> {
  const admin = await requireAdmin();
  if (!admin) return { error: 'Acesso negado.' };

  const supabase = await createClient();

  const [ticketRes, messagesRes] = await Promise.all([
    supabase
      .from('support_tickets')
      .select(`
        *,
        profiles:user_id (
          full_name,
          created_at
        )
      `)
      .eq('id', ticketId)
      .single(),
    supabase
      .from('support_ticket_messages')
      .select('*, profiles:sender_id(full_name)')
      .eq('ticket_id', ticketId)
      .order('created_at', { ascending: true }),
  ]);

  if (ticketRes.error || !ticketRes.data) {
    return { error: 'Chamado não encontrado.' };
  }

  // Busca email via admin SDK (auth.users não é acessível via cliente normal)
  const { createAdminClient } = await import('@/lib/supabase/admin');
  const adminClient = await createAdminClient();

  const { data: authUserData } = await adminClient.auth.admin.getUserById(
    ticketRes.data.user_id as string
  );

  const userInfo = {
    full_name:  (ticketRes.data.profiles as { full_name: string; created_at: string } | null)?.full_name ?? 'Usuário',
    email:      authUserData?.user?.email ?? '—',
    created_at: authUserData?.user?.created_at ?? '',
  };

  return {
    data: {
      ticket:   ticketRes.data as TicketWithUser,
      messages: (messagesRes.data ?? []) as TicketMessageWithSender[],
      userInfo,
    },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// adminSendMessage — admin responde ao chamado
// ─────────────────────────────────────────────────────────────────────────────

export async function adminSendMessage(
  ticketId: string,
  content: string,
  attachmentUrls: string[] = []
): Promise<ActionResult<TicketMessageWithSender>> {
  const admin = await requireAdmin();
  if (!admin) return { error: 'Acesso negado.' };

  const cleanContent = content.trim().slice(0, 4000);
  if (!cleanContent && attachmentUrls.length === 0) {
    return { error: 'A mensagem não pode estar vazia.' };
  }

  const supabase = await createClient();

  // Verifica que o ticket existe e não está fechado
  const { data: ticket } = await supabase
    .from('support_tickets')
    .select('id, status')
    .eq('id', ticketId)
    .neq('status', 'closed')
    .single();

  if (!ticket) return { error: 'Chamado não encontrado ou já encerrado.' };

  const { data: message, error: msgError } = await supabase
    .from('support_ticket_messages')
    .insert({
      ticket_id:       ticketId,
      sender_id:       admin.id,
      is_admin:        true,
      content:         cleanContent || '(arquivo enviado)',
      attachment_urls: attachmentUrls.slice(0, 3),
    })
    .select('*, profiles:sender_id(full_name)')
    .single();

  if (msgError || !message) {
    console.error('[adminSendMessage]', msgError?.message);
    return { error: 'Erro ao enviar mensagem.' };
  }

  // Ao admin responder, status passa para 'waiting_user'
  await supabase
    .from('support_tickets')
    .update({ status: 'waiting_user' })
    .eq('id', ticketId)
    .eq('status', 'open');

  return { data: message as TicketMessageWithSender };
}

// ─────────────────────────────────────────────────────────────────────────────
// updateTicketUrgency — admin altera urgência do chamado
// ─────────────────────────────────────────────────────────────────────────────

export async function updateTicketUrgency(
  ticketId: string,
  urgency: TicketUrgency
): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!admin) return { error: 'Acesso negado.' };

  const validUrgencies: TicketUrgency[] = ['low', 'medium', 'high'];
  if (!validUrgencies.includes(urgency)) return { error: 'Urgência inválida.' };

  const supabase = await createClient();

  const { error } = await supabase
    .from('support_tickets')
    .update({ urgency })
    .eq('id', ticketId)
    .neq('status', 'closed');

  if (error) {
    console.error('[updateTicketUrgency]', error.message);
    return { error: 'Erro ao atualizar urgência.' };
  }

  return {};
}

// ─────────────────────────────────────────────────────────────────────────────
// adminCloseTicket — admin encerra o chamado
// ─────────────────────────────────────────────────────────────────────────────

export async function adminCloseTicket(ticketId: string): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!admin) return { error: 'Acesso negado.' };

  const supabase = await createClient();

  const { error } = await supabase
    .from('support_tickets')
    .update({ status: 'closed', closed_at: new Date().toISOString() })
    .eq('id', ticketId)
    .neq('status', 'closed');

  if (error) {
    console.error('[adminCloseTicket]', error.message);
    return { error: 'Erro ao encerrar chamado.' };
  }

  return {};
}

// ─────────────────────────────────────────────────────────────────────────────
// markMessagesAsRead — marca mensagens do usuário como lidas pelo admin
// ─────────────────────────────────────────────────────────────────────────────

export async function markMessagesAsRead(ticketId: string): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!admin) return { error: 'Acesso negado.' };

  const supabase = await createClient();

  const { error } = await supabase
    .from('support_ticket_messages')
    .update({ read_at: new Date().toISOString() })
    .eq('ticket_id', ticketId)
    .eq('is_admin', false)
    .is('read_at', null);

  if (error) {
    console.error('[markMessagesAsRead]', error.message);
    return { error: 'Erro ao marcar mensagens como lidas.' };
  }

  return {};
}

// ─────────────────────────────────────────────────────────────────────────────
// updateTicketStatus — admin muda status manualmente
// ─────────────────────────────────────────────────────────────────────────────

export async function updateTicketStatus(
  ticketId: string,
  status: Exclude<TicketStatus, 'closed'>
): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!admin) return { error: 'Acesso negado.' };

  const validStatuses: Exclude<TicketStatus, 'closed'>[] = ['open', 'in_progress', 'waiting_user'];
  if (!validStatuses.includes(status)) return { error: 'Status inválido.' };

  const supabase = await createClient();

  const { error } = await supabase
    .from('support_tickets')
    .update({ status })
    .eq('id', ticketId)
    .neq('status', 'closed');

  if (error) {
    console.error('[updateTicketStatus]', error.message);
    return { error: 'Erro ao atualizar status.' };
  }

  return {};
}

// ─────────────────────────────────────────────────────────────────────────────
// getPendingTicketsCount — retorna contagem de chamados abertos e não respondidos
// ─────────────────────────────────────────────────────────────────────────────

export async function getPendingTicketsCount(): Promise<number> {
  const admin = await requireAdmin();
  if (!admin) return 0;

  const supabase = await createClient();

  const { count, error } = await supabase
    .from('support_tickets')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'open');

  if (error) {
    console.error('[getPendingTicketsCount]', error.message);
    return 0;
  }

  return count ?? 0;
}
