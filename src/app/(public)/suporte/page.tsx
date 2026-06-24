import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { SupportClient } from '@/features/support/components/SupportClient';
import type { Ticket, TicketMessageWithSender } from '@/features/support/types';

export const metadata: Metadata = {
  title: 'Suporte Técnico — ICRE',
  description: 'Abra um chamado de suporte e nossa equipe responderá em breve.',
};

export default async function SuportePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  // Busca ticket ativo (não fechado) do usuário
  const { data: ticket } = await supabase
    .from('support_tickets')
    .select('*')
    .eq('user_id', user.id)
    .neq('status', 'closed')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  let messages: TicketMessageWithSender[] = [];

  if (ticket) {
    const { data: msgs } = await supabase
      .from('support_ticket_messages')
      .select('*, profiles:sender_id(full_name)')
      .eq('ticket_id', ticket.id)
      .order('created_at', { ascending: true });

    messages = (msgs ?? []) as TicketMessageWithSender[];
  }

  return (
    <SupportClient
      userId={user.id}
      initialTicket={ticket as Ticket | null}
      initialMessages={messages}
    />
  );
}
