import { supabase } from './supabase';

export function logAudit(
  userId: string,
  action: string,
  entityType: string,
  entityId: string,
  oldValue?: object | null,
  newValue?: object | null
): void {
  void supabase.from('audit_log').insert({
    user_id: userId,
    action,
    entity_type: entityType,
    entity_id: entityId,
    old_value: oldValue ?? null,
    new_value: newValue ?? null,
  }).then(({ error }) => {
    if (error) console.error('Audit log failed', { action, entityType, entityId, error });
  });
}
