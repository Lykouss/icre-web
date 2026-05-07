import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { isValidUuid } from '@/lib/action-validators';
import { ReceiptClient } from '@/features/portal/components/ReceiptClient';

export const revalidate = 0;

export default async function ComprovantePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isValidUuid(id)) notFound();

  const supabase = await createClient();

  const { data: raw, error } = await supabase
    .from('event_registrations')
    .select(`
      id, name, email, phone, status, payment_status,
      payment_method, payment_amount, paid_at,
      asaas_payment_id, asaas_invoice_url, ticket_signature,
      events!inner ( id, title, date, time, location, type, ticket_price )
    `)
    .eq('id', id)
    .single();

  if (error || !raw) notFound();

  if (raw.status !== 'confirmado') {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-slate-900/60 backdrop-blur-xl border border-white/8 rounded-3xl p-8 text-center">
          <div className="w-16 h-16 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-white mb-2">Ingresso pendente</h1>
          <p className="text-slate-400 text-sm">
            Este comprovante estará disponível após a confirmação (pagamento ou aprovação).
          </p>
        </div>
      </div>
    );
  }

  // Supabase pode retornar events como array ou objeto dependendo da query
  const eventData = Array.isArray(raw.events) ? raw.events[0] : raw.events;

  const registration = { ...raw, events: eventData ?? null };

  return <ReceiptClient registration={registration} />;
}