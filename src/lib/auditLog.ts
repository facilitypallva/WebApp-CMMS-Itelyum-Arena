import { supabase } from './supabase';

export async function logAudit(
  userId: string,
  action: string,
  entityType: string,
  entityId: string,
  oldValue?: object | null,
  newValue?: object | null
) {
  await supabase.from('audit_log').insert({
    user_id: userId,
    action,
    entity_type: entityType,
    entity_id: entityId,
    old_value: oldValue ?? null,
    new_value: newValue ?? null,
  });
}
