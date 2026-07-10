import { redirect, notFound } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { isValidUuid } from '@/lib/action-validators';
import { ReceiptClient } from '@/features/portal/components/ReceiptClient';
import { getCurrentUser } from '@/features/core/api/get-current-user';

export const revalidate = 0;

export default async function ComprovantePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isValidUuid(id)) notFound();

  const supabaseServer = await createClient(); // For auth
  const supabaseAdmin = await createAdminClient();

  const { data: raw, error } = await supabaseAdmin
    .from('event_registrations')
    .select(`
      id, name, email, phone, status, payment_status, member_id,
      payment_method, payment_amount, paid_at,
      asaas_payment_id, asaas_invoice_url, ticket_signature,
      events!inner ( id, title, date, time, location, type, ticket_price )
    `)
    .eq('id', id)
    .single();

  if (error || !raw) notFound();

  const { data: { user: authUser } } = await supabaseServer.auth.getUser();
  const user = await getCurrentUser();
  if (!user || !authUser) {
    redirect(`/login?returnTo=/comprovante/${id}`);
  }

  const { data: memberData } = await supabaseServer
    .from('members')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle();
  const memberId = memberData?.id;

  const isOwner = (memberId && raw.member_id === memberId) || (raw.email && authUser.email && raw.email === authUser.email);
  const isAdmin = user.isSysAdmin || user.roles.includes('CHURCH_ADMIN');

  if (!isOwner && !isAdmin) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-950 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-slate-50 dark:bg-slate-900/60 backdrop-blur-xl border border-black/5 dark:border-white/8 rounded-3xl p-8 text-center">
          <div className="w-16 h-16 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Acesso Negado</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            Este comprovante pertence a outro usuário e não pode ser visualizado por você.
          </p>
        </div>
      </div>
    );
  }

  if (raw.status !== 'confirmado') {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-950 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-slate-50 dark:bg-slate-900/60 backdrop-blur-xl border border-black/5 dark:border-white/8 rounded-3xl p-8 text-center">
          <div className="w-16 h-16 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Ingresso pendente</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">
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