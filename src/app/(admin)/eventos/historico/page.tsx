import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/features/core/api/get-current-user';
import { EventHistoryClient } from '@/features/events/components/EventHistoryClient';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export default async function EventHistoryPage() {
  const user = await getCurrentUser();

  if (!user || (!user.isSysAdmin && !user.roles.includes('CHURCH_ADMIN'))) {
    redirect('/dashboard');
  }

  const supabase = await createClient();

  // Buscar histórico sem joins problemáticos de FK — enriquecemos manualmente
  const { data: rawHistory } = await supabase
    .from('event_history')
    .select('id, event_id, action_type, details, created_at, actor_id, target_user_id')
    .order('created_at', { ascending: false })
    .limit(500);

  if (!rawHistory || rawHistory.length === 0) {
    return (
      <div className="p-6">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-800">Auditoria de Eventos</h1>
          <p className="text-sm text-slate-500 mt-1">Histórico imutável de transações, inscrições e check-ins.</p>
        </div>
        <EventHistoryClient initialHistory={[]} />
      </div>
    );
  }

  // Buscar nomes dos eventos únicos referenciados
  const eventIds = [...new Set(
    rawHistory.map(h => h.event_id).filter((id): id is string => !!id)
  )];
  const { data: events } = eventIds.length > 0
    ? await supabase.from('events').select('id, title').in('id', eventIds)
    : { data: [] };

  // Buscar nomes dos actores únicos referenciados (de profiles)
  const actorIds = [...new Set([
    ...rawHistory.map(h => h.actor_id),
    ...rawHistory.map(h => h.target_user_id),
  ].filter((id): id is string => !!id))];
  const { data: profiles } = actorIds.length > 0
    ? await supabase.from('profiles').select('id, full_name').in('id', actorIds)
    : { data: [] };

  const eventsMap = Object.fromEntries((events ?? []).map(e => [e.id, e]));
  const profilesMap = Object.fromEntries((profiles ?? []).map(p => [p.id, p]));

  const history = rawHistory.map(h => ({
    id: h.id,
    event_id: h.event_id,
    action_type: h.action_type,
    details: h.details,
    created_at: h.created_at,
    events: h.event_id ? { title: eventsMap[h.event_id]?.title ?? 'Desconhecido' } : null,
    actor: h.actor_id ? { full_name: profilesMap[h.actor_id]?.full_name ?? null } : null,
    target: h.target_user_id ? { full_name: profilesMap[h.target_user_id]?.full_name ?? null } : null,
  }));

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Auditoria de Eventos</h1>
          <p className="text-sm text-slate-500 mt-1">Histórico imutável de transações, inscrições e check-ins.</p>
        </div>
      </div>

      <EventHistoryClient initialHistory={history} />
    </div>
  );
}
