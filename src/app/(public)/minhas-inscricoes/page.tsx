import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { TicketIcon, CalendarIcon, MapPinIcon } from 'lucide-react';

export const metadata = { title: 'Minhas Inscrições — ICRE' };

export default async function MinhasInscricoesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?returnTo=/minhas-inscricoes');
  }

  // Busca inscrições vinculadas ao membro/conta (usando member_id que agora é preenchido com user_id ou consultando emails)
  const { data: registrations } = await supabase
    .from('event_registrations')
    .select(`
      id,
      status,
      payment_status,
      ticket_signature,
      events (
        id,
        title,
        date,
        time,
        location,
        banner_url
      )
    `)
    .eq('member_id', user.id)
    .order('created_at', { ascending: false });

  return (
    <div className="min-h-screen bg-slate-950 pt-28 pb-16 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-black text-white mb-2">Minhas Inscrições</h1>
        <p className="text-slate-400 mb-10">Acompanhe seus ingressos e histórico de participação em eventos.</p>

        {(!registrations || registrations.length === 0) ? (
          <div className="bg-slate-900/50 border border-white/10 rounded-3xl p-12 text-center">
            <TicketIcon className="w-16 h-16 text-slate-700 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">Nenhuma inscrição encontrada</h2>
            <p className="text-slate-400 mb-6">Você ainda não se inscreveu em nenhum evento.</p>
            <Link href="/agenda" className="inline-flex bg-blue-600 hover:bg-blue-500 text-white font-bold px-6 py-3 rounded-xl transition-all">
              Ver agenda de eventos
            </Link>
          </div>
        ) : (
          <div className="grid gap-4">
            {registrations.map((reg) => {
              const event = reg.events as any;
              if (!event) return null;
              
              const isConfirmed = reg.status === 'confirmado';
              
              return (
                <div key={reg.id} className="bg-slate-900/60 border border-white/10 rounded-2xl p-5 flex flex-col md:flex-row gap-6 items-start md:items-center">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-white mb-2">{event.title}</h3>
                    <div className="flex flex-col sm:flex-row gap-3 sm:gap-6 text-sm text-slate-400">
                      {event.date && (
                        <div className="flex items-center gap-2">
                          <CalendarIcon className="w-4 h-4 text-slate-500" />
                          {format(new Date(event.date + 'T12:00:00'), "dd 'de' MMMM", { locale: ptBR })}
                          {event.time && ` às ${event.time.slice(0, 5)}`}
                        </div>
                      )}
                      {event.location && (
                        <div className="flex items-center gap-2">
                          <MapPinIcon className="w-4 h-4 text-slate-500" />
                          {event.location}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 w-full md:w-auto mt-4 md:mt-0 pt-4 md:pt-0 border-t border-white/10 md:border-t-0">
                    <div className="flex-1 md:flex-none">
                      {isConfirmed ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 text-xs font-bold border border-emerald-500/20">
                          Confirmado
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-500/10 text-amber-400 text-xs font-bold border border-amber-500/20">
                          {reg.payment_status === 'pendente' ? 'Aguardando Pagamento' : 'Cancelado'}
                        </span>
                      )}
                    </div>
                    
                    {isConfirmed && reg.ticket_signature && (
                      <Link 
                        href={`/comprovante/${reg.id}`}
                        className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold px-4 py-2 rounded-xl transition-all whitespace-nowrap"
                      >
                        Ver Ingresso
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
