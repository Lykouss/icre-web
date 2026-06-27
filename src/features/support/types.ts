// ─── Support Module Types ────────────────────────────────────────────────────

export type TicketStatus = 'open' | 'in_progress' | 'waiting_user' | 'closed';
export type TicketUrgency = 'low' | 'medium' | 'high';
export type FeedbackType = 'bug' | 'suggestion';

// ─── Ticket ──────────────────────────────────────────────────────────────────

export interface Ticket {
  id: string;
  user_id: string;
  subject: string;
  description: string;
  status: TicketStatus;
  urgency: TicketUrgency;
  created_at: string;
  updated_at: string;
  closed_at: string | null;
}

export interface TicketWithUser extends Ticket {
  profiles: {
    full_name: string;
    email: string | null;
    created_at: string;
  } | null;
  unread_count?: number;
}

// ─── Ticket Message ──────────────────────────────────────────────────────────

export interface TicketMessage {
  id: string;
  ticket_id: string;
  sender_id: string;
  is_admin: boolean;
  content: string;
  attachment_urls: string[];
  created_at: string;
  read_at: string | null;
}

export interface TicketMessageWithSender extends TicketMessage {
  profiles: {
    full_name: string;
    photo_url?: string | null;
  } | null;
}

// ─── Feedback ────────────────────────────────────────────────────────────────

export interface Feedback {
  id: string;
  user_id: string;
  content: string;
  type: FeedbackType;
  created_at: string;
}

// ─── Action Results ──────────────────────────────────────────────────────────

export interface ActionResult<T = null> {
  data?: T;
  error?: string;
}

// ─── UI Helpers ──────────────────────────────────────────────────────────────

export const TICKET_STATUS_LABELS: Record<TicketStatus, string> = {
  open: 'Aberto',
  in_progress: 'Em Análise',
  waiting_user: 'Aguardando Você',
  closed: 'Encerrado',
};

export const TICKET_STATUS_COLORS: Record<TicketStatus, { bg: string; text: string; dot: string }> = {
  open:         { bg: 'rgba(37,99,235,0.15)',  text: '#93c5fd', dot: '#3b82f6' },
  in_progress:  { bg: 'rgba(245,158,11,0.15)', text: '#fcd34d', dot: '#f59e0b' },
  waiting_user: { bg: 'rgba(139,92,246,0.15)', text: '#c4b5fd', dot: '#8b5cf6' },
  closed:       { bg: 'rgba(100,116,139,0.15)',text: '#94a3b8', dot: '#64748b' },
};

export const TICKET_URGENCY_LABELS: Record<TicketUrgency, string> = {
  low: 'Baixa',
  medium: 'Média',
  high: 'Alta',
};

export const TICKET_URGENCY_COLORS: Record<TicketUrgency, { bg: string; text: string; dot: string }> = {
  low:    { bg: 'rgba(100,116,139,0.15)', text: '#94a3b8', dot: '#64748b' },
  medium: { bg: 'rgba(245,158,11,0.15)',  text: '#fcd34d', dot: '#f59e0b' },
  high:   { bg: 'rgba(239,68,68,0.15)',   text: '#fca5a5', dot: '#ef4444' },
};
