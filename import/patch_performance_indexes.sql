-- Performance indexes — run once on the Supabase project.
-- All use IF NOT EXISTS so re-running is safe.

-- work_orders: filtered by status in every list/dashboard query
CREATE INDEX IF NOT EXISTS idx_work_orders_status
  ON work_orders (status);

-- work_orders: composite for dashboard active-WO query (.in status + ORDER BY created_at)
CREATE INDEX IF NOT EXISTS idx_work_orders_status_created
  ON work_orders (status, created_at DESC);

-- work_orders: joined to assets on every select
CREATE INDEX IF NOT EXISTS idx_work_orders_asset_id
  ON work_orders (asset_id);

-- work_orders: joined to technicians on every select
CREATE INDEX IF NOT EXISTS idx_work_orders_technician_id
  ON work_orders (technician_id)
  WHERE technician_id IS NOT NULL;

-- work_orders: dashboard trend query filters on closed_at
CREATE INDEX IF NOT EXISTS idx_work_orders_closed_at
  ON work_orders (closed_at DESC)
  WHERE closed_at IS NOT NULL;

-- tickets: count query in dashboard + filter in TicketsQueue
CREATE INDEX IF NOT EXISTS idx_tickets_status
  ON tickets (status);

-- tickets: list ordered by created_at
CREATE INDEX IF NOT EXISTS idx_tickets_created_at
  ON tickets (created_at DESC);

-- tickets: joined to locations
CREATE INDEX IF NOT EXISTS idx_tickets_location_id
  ON tickets (location_id)
  WHERE location_id IS NOT NULL;

-- tickets: joined to assets
CREATE INDEX IF NOT EXISTS idx_tickets_asset_id
  ON tickets (asset_id)
  WHERE asset_id IS NOT NULL;

-- assets: filtered in AssetsTable and ScheduleView
CREATE INDEX IF NOT EXISTS idx_assets_status
  ON assets (status);

-- assets: joined to locations on every select
CREATE INDEX IF NOT EXISTS idx_assets_location_id
  ON assets (location_id);

-- audit_log: always ordered by created_at DESC
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at
  ON audit_log (created_at DESC);

-- audit_log: joined to profiles for user names
CREATE INDEX IF NOT EXISTS idx_audit_log_user_id
  ON audit_log (user_id);

-- audit_log: lookup by entity
CREATE INDEX IF NOT EXISTS idx_audit_log_entity
  ON audit_log (entity_type, entity_id);

-- technicians: joined to suppliers
CREATE INDEX IF NOT EXISTS idx_technicians_supplier_id
  ON technicians (supplier_id)
  WHERE supplier_id IS NOT NULL;
