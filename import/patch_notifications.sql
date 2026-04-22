BEGIN;

CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    target_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'SYSTEM' CHECK (type IN ('TICKET', 'WORK_ORDER', 'SYSTEM')),
    entity_type TEXT NOT NULL DEFAULT 'system' CHECK (entity_type IN ('ticket', 'work_order', 'system')),
    entity_id UUID,
    read_at TIMESTAMPTZ,
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_target_user_created_at
ON notifications (target_user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_unread
ON notifications (target_user_id, read_at)
WHERE read_at IS NULL;

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;

CREATE POLICY "Users can read own notifications" ON notifications
FOR SELECT
USING (auth.uid() = target_user_id);

CREATE POLICY "Users can update own notifications" ON notifications
FOR UPDATE
USING (auth.uid() = target_user_id)
WITH CHECK (auth.uid() = target_user_id);

COMMIT;
