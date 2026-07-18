import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { DownloadIcon, EyeIcon, TicketIcon, CalendarIcon, MapPinIcon, LockIcon } from 'lucide-react';
import { checkPdfRateLimit } from '@/features/portal/actions/pdf-actions';
import { getCurrentUser } from '@/features/core/api/get-current-user';
import { DownloadReceiptButton } from './DownloadReceiptButton';

export const metadata = { title: 'Meus Comprovantes — ICRE' };

export default async function ComprovantesPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login?returnTo=/minhas-inscricoes/comprovantes');

  const supabase = await createClient();

  const { data: registrations } = await supabase
    .from('event_registrations')
    .select(`id, status, payment_status, ticket_signature, created_at, events (id, title, date, time, location, banner_url)`)
    .or(`user_id.eq.${user.id},member_id.eq.${user.id}`)
    .eq('status', 'confirmado')
    .not('ticket_signature', 'is', null)
    .order('created_at', { ascending: false });

  const { allowed, remaining } = await checkPdfRateLimit(user.id);

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-blue-50/40 to-indigo-50/40 dark:from-slate-950 dark:via-slate-950 dark:to-slate-950 pt-28 pb-16 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-1">Meus Comprovantes</h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm">Baixe ou visualize seus ingressos confirmados.</p>
          </div>

          {/* Rate limit indicator */}
          <div className={`flex items-center gap-2 px-4 py-2 rounded-2xl border text-sm font-semibold ${
            remaining === 0
              ? 'border-red-500/30 bg-red-500/10 text-red-400'
              : remaining <= 2
              ? 'border-amber-500/30 bg-amber-500/10 text-amber-400'
              : 'border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 text-slate-500 dark:text-slate-400'
          }`}>
            <LockIcon className="w-4 h-4" />
            {remaining === 0
              ? 'Limite atingido (redefine em 1h)'
              : `${remaining} download${remaining !== 1 ? 's' : ''} disponíve${remaining !== 1 ? 'is' : 'l'} esta hora`}
          </div>
        </div>

        {(!registrations || registrations.length === 0) ? (
          <div className="bg-blue-100 dark:bg-slate-900/50 border border-blue-300/60 dark:border-white/10 rounded-3xl p-12 text-center">
            <TicketIcon className="w-16 h-16 text-slate-700 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Nenhum comprovante disponível</h2>
            <p className="text-slate-500 dark:text-slate-400 mb-6">Seus ingressos confirmados aparecerão aqui.</p>
            <Link href="/agenda" className="inline-flex bg-blue-600 hover:bg-blue-500 text-slate-900 dark:text-white font-bold px-6 py-3 rounded-xl transition-all">
              Ver agenda de eventos
            </Link>
          </div>
        ) : (
          <div className="grid gap-4">
            {registrations.map(reg => {
              const event = reg.events as any;
              if (!event) return null;

              return (
                <div key={reg.id} className="bg-blue-100 dark:bg-slate-900/60 border border-blue-300/60 dark:border-white/10 rounded-2xl overflow-hidden">
                  <div className="flex flex-col sm:flex-row gap-5 p-5">
                    {/* Event info */}
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">{event.title}</h3>
                      <div className="flex flex-col sm:flex-row gap-3 text-sm text-slate-500 dark:text-slate-400">
                        {event.date && (
                          <div className="flex items-center gap-1.5">
                            <CalendarIcon className="w-4 h-4 text-slate-500" />
                            {format(new Date(event.date + 'T12:00:00'), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                            {event.time && ` às ${event.time.slice(0, 5)}`}
                          </div>
                        )}
                        {event.location && (
                          <div className="flex items-center gap-1.5">
                            <MapPinIcon className="w-4 h-4 text-slate-500" />
                            {event.location}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-3 shrink-0">
                      <Link
                        href={`/comprovante/${reg.id}`}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-black/10 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:border-white/20 text-sm font-semibold transition-all"
                      >
                        <EyeIcon className="w-4 h-4" /> Visualizar
                      </Link>
                      <DownloadReceiptButton
                        registrationId={reg.id}
                        disabled={!allowed}
                        disabledReason={!allowed ? 'Limite de downloads atingido. Tente novamente em 1 hora.' : undefined}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-6 text-center">
          <Link href="/minhas-inscricoes" className="text-slate-500 hover:text-slate-600 dark:text-slate-300 text-sm transition-colors">
            ← Voltar para Minhas Inscrições
          </Link>
        </div>
      </div>
    </div>
  );
}
