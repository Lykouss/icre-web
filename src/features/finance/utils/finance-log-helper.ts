import { SupabaseClient } from '@supabase/supabase-js';

interface LogPayload {
  supabase: SupabaseClient;
  action: string;
  actorId: string;
  actorName: string;
  actorRole: string;
  entityName: string;
  entityId?: string;
  oldData?: Record<string, unknown> | null;
  newData?: Record<string, unknown> | null;
}

export async function saveFinanceLog({
  supabase,
  action,
  actorId,
  actorName,
  actorRole,
  entityName,
  entityId,
  oldData = null,
  newData = null,
}: LogPayload) {
  const { error } = await supabase.from('finance_logs').insert({
    action,
    actor_id: actorId,
    actor_name: actorName,
    actor_role: actorRole,
    entity_name: entityName,
    entity_id: entityId ?? null,
    old_data: oldData,
    new_data: newData,
  });

  if (error) {
    console.error('Erro ao salvar log financeiro:', JSON.stringify(error, null, 2));
  }
}