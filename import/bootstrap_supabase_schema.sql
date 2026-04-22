-- Bootstrap schema for the CMMS app on a fresh Supabase project.
-- Run this file first in Supabase SQL Editor, then run generated_assets_import.sql.

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS facilities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    address TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    facility_id UUID REFERENCES facilities(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES locations(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    description TEXT,
    qr_code_id TEXT UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    location_id UUID REFERENCES locations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('Rivelazione incendi', 'Antincendio', 'Meccanico', 'Elettrico', 'TVCC')),
    brand TEXT,
    model TEXT,
    serial_number TEXT,
    installation_date DATE,
    last_verification DATE,
    verification_frequency_code TEXT,
    verification_frequency_days INTEGER NOT NULL DEFAULT 180,
    verification_frequency_months INTEGER NOT NULL DEFAULT 6,
    status TEXT NOT NULL DEFAULT 'IN REGOLA' CHECK (status IN ('SCADUTO', 'IN SCADENZA', 'IN REGOLA')),
    documents TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS suppliers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    contact_info JSONB,
    category TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS technicians (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    specialization TEXT,
    employment_type TEXT NOT NULL DEFAULT 'INTERNAL' CHECK (employment_type IN ('INTERNAL', 'EXTERNAL')),
    supplier_id UUID REFERENCES suppliers(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT,
    role TEXT NOT NULL DEFAULT 'LETTURA' CHECK (role IN ('ADMIN', 'RESPONSABILE', 'TECNICO', 'LETTURA')),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS work_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE,
    asset_id UUID REFERENCES assets(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('PROGRAMMED', 'CORRECTIVE', 'EXTRA')),
    status TEXT NOT NULL CHECK (status IN ('NEW', 'PLANNED', 'ASSIGNED', 'IN_PROGRESS', 'SUSPENDED', 'CLOSED', 'VALIDATED', 'ABANDONED')),
    priority TEXT NOT NULL CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    description TEXT,
    technician_id UUID REFERENCES technicians(id),
    supplier_id UUID REFERENCES suppliers(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    planned_date TIMESTAMPTZ,
    executed_at TIMESTAMPTZ,
    closed_at TIMESTAMPTZ,
    validation_date TIMESTAMPTZ,
    photos TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    cost DECIMAL(10, 2) NOT NULL DEFAULT 0,
    notes TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS work_order_code_counters (
    year_suffix TEXT PRIMARY KEY,
    last_value INTEGER NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ticket_code_counters (
    scope TEXT PRIMARY KEY,
    last_value INTEGER NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE,
    reporter_name TEXT NOT NULL,
    reporter_email TEXT NOT NULL,
    location_id UUID REFERENCES locations(id),
    asset_id UUID REFERENCES assets(id),
    problem_category TEXT,
    description TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'IN_PROGRESS', 'CLOSED')),
    photo_url TEXT,
    work_order_id UUID REFERENCES work_orders(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

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

CREATE TABLE IF NOT EXISTS audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id UUID NOT NULL,
    old_value JSONB,
    new_value JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_locations_facility_name ON locations (facility_id, name);
CREATE UNIQUE INDEX IF NOT EXISTS idx_assets_serial_number ON assets (serial_number) WHERE serial_number IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_email ON profiles (email);
CREATE INDEX IF NOT EXISTS idx_assets_location_id ON assets (location_id);
CREATE INDEX IF NOT EXISTS idx_work_orders_asset_id ON work_orders (asset_id);
CREATE INDEX IF NOT EXISTS idx_work_orders_executed_at ON work_orders (executed_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS idx_work_orders_code ON work_orders (code) WHERE code IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tickets_location_id ON tickets (location_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_tickets_code ON tickets (code) WHERE code IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_notifications_target_user_created_at ON notifications (target_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications (target_user_id, read_at) WHERE read_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON audit_log (created_at DESC);

CREATE OR REPLACE FUNCTION next_work_order_code(target_timestamp TIMESTAMPTZ DEFAULT NOW())
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    year_part TEXT;
    next_value INTEGER;
BEGIN
    year_part := TO_CHAR(COALESCE(target_timestamp, NOW()), 'YY');

    INSERT INTO work_order_code_counters (year_suffix, last_value, updated_at)
    VALUES (year_part, 1, NOW())
    ON CONFLICT (year_suffix)
    DO UPDATE SET
        last_value = work_order_code_counters.last_value + 1,
        updated_at = NOW()
    RETURNING last_value INTO next_value;

    RETURN 'WO-' || year_part || LPAD(next_value::TEXT, 3, '0');
END;
$$;

CREATE OR REPLACE FUNCTION assign_work_order_code()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NEW.code IS NULL OR BTRIM(NEW.code) = '' THEN
        NEW.code := next_work_order_code(COALESCE(NEW.created_at, NOW()));
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_work_orders_assign_code ON work_orders;
CREATE TRIGGER trg_work_orders_assign_code
BEFORE INSERT ON work_orders
FOR EACH ROW
EXECUTE FUNCTION assign_work_order_code();

CREATE OR REPLACE FUNCTION next_ticket_code()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    next_value INTEGER;
BEGIN
    INSERT INTO ticket_code_counters (scope, last_value, updated_at)
    VALUES ('GLOBAL', 1, NOW())
    ON CONFLICT (scope)
    DO UPDATE SET
        last_value = ticket_code_counters.last_value + 1,
        updated_at = NOW()
    RETURNING last_value INTO next_value;

    RETURN 'TK-' || LPAD(next_value::TEXT, 4, '0');
END;
$$;

CREATE OR REPLACE FUNCTION assign_ticket_code()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NEW.code IS NULL OR BTRIM(NEW.code) = '' THEN
        NEW.code := next_ticket_code();
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_tickets_assign_code ON tickets;
CREATE TRIGGER trg_tickets_assign_code
BEFORE INSERT ON tickets
FOR EACH ROW
EXECUTE FUNCTION assign_ticket_code();

CREATE OR REPLACE FUNCTION handle_auth_user_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
    normalized_role TEXT;
BEGIN
    normalized_role := UPPER(COALESCE(NEW.raw_app_meta_data ->> 'role', 'LETTURA'));

    IF normalized_role NOT IN ('ADMIN', 'RESPONSABILE', 'TECNICO', 'LETTURA') THEN
        normalized_role := 'LETTURA';
    END IF;

    INSERT INTO public.profiles (id, email, full_name, role, is_active, created_at, updated_at)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''),
        normalized_role,
        COALESCE((NEW.raw_user_meta_data ->> 'is_active')::BOOLEAN, TRUE),
        COALESCE(NEW.created_at, NOW()),
        NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        role = EXCLUDED.role,
        is_active = EXCLUDED.is_active,
        updated_at = NOW();

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_profile_created ON auth.users;
CREATE TRIGGER on_auth_user_profile_created
AFTER INSERT OR UPDATE OF email, raw_user_meta_data, raw_app_meta_data ON auth.users
FOR EACH ROW
EXECUTE FUNCTION handle_auth_user_profile();

INSERT INTO profiles (id, email, full_name, role, is_active, created_at, updated_at)
SELECT
    id,
    email,
    COALESCE(raw_user_meta_data ->> 'full_name', ''),
    CASE
        WHEN UPPER(COALESCE(raw_app_meta_data ->> 'role', 'LETTURA')) IN ('ADMIN', 'RESPONSABILE', 'TECNICO', 'LETTURA')
            THEN UPPER(COALESCE(raw_app_meta_data ->> 'role', 'LETTURA'))
        ELSE 'LETTURA'
    END,
    COALESCE((raw_user_meta_data ->> 'is_active')::BOOLEAN, TRUE),
    created_at,
    NOW()
FROM auth.users
ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role,
    is_active = EXCLUDED.is_active,
    updated_at = NOW();

CREATE OR REPLACE FUNCTION prevent_terminal_work_order_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF TG_OP = 'UPDATE'
       AND OLD.status IN ('VALIDATED', 'ABANDONED')
       AND NEW.status IS DISTINCT FROM OLD.status THEN
        RAISE EXCEPTION 'Lo stato % e finale e non puo essere modificato', OLD.status;
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_work_orders_prevent_terminal_status_change ON work_orders;
CREATE TRIGGER trg_work_orders_prevent_terminal_status_change
BEFORE UPDATE OF status ON work_orders
FOR EACH ROW
EXECUTE FUNCTION prevent_terminal_work_order_status_change();

CREATE OR REPLACE FUNCTION set_asset_status()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    next_verification_date DATE;
BEGIN
    IF NEW.last_verification IS NULL THEN
        NEW.status := 'SCADUTO';
        RETURN NEW;
    END IF;

    next_verification_date := (NEW.last_verification + NEW.verification_frequency_days)::DATE;

    IF next_verification_date < CURRENT_DATE THEN
        NEW.status := 'SCADUTO';
    ELSIF next_verification_date <= CURRENT_DATE + 30 THEN
        NEW.status := 'IN SCADENZA';
    ELSE
        NEW.status := 'IN REGOLA';
    END IF;

    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_assets_set_status ON assets;
CREATE TRIGGER trg_assets_set_status
BEFORE INSERT OR UPDATE OF last_verification, verification_frequency_days, verification_frequency_months, status
ON assets
FOR EACH ROW
EXECUTE FUNCTION set_asset_status();

CREATE OR REPLACE FUNCTION sync_asset_after_work_order()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    effective_execution_date DATE;
BEGIN
    IF NEW.asset_id IS NULL THEN
        RETURN NEW;
    END IF;

    IF NEW.status NOT IN ('CLOSED', 'VALIDATED') THEN
        RETURN NEW;
    END IF;

    effective_execution_date := COALESCE(
        NEW.executed_at::DATE,
        NEW.validation_date::DATE,
        NEW.closed_at::DATE
    );

    IF effective_execution_date IS NULL THEN
        RETURN NEW;
    END IF;

    UPDATE assets
    SET last_verification = effective_execution_date,
        updated_at = NOW()
    WHERE id = NEW.asset_id;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_work_orders_sync_asset ON work_orders;
CREATE TRIGGER trg_work_orders_sync_asset
AFTER INSERT OR UPDATE OF asset_id, status, executed_at, closed_at, validation_date
ON work_orders
FOR EACH ROW
EXECUTE FUNCTION sync_asset_after_work_order();

ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE facilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE technicians ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can read facilities" ON facilities;
DROP POLICY IF EXISTS "Authenticated users can insert facilities" ON facilities;
DROP POLICY IF EXISTS "Authenticated users can update facilities" ON facilities;
DROP POLICY IF EXISTS "Authenticated users can delete facilities" ON facilities;

CREATE POLICY "Authenticated users can read facilities" ON facilities
FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert facilities" ON facilities
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update facilities" ON facilities
FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete facilities" ON facilities
FOR DELETE USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can read locations" ON locations;
DROP POLICY IF EXISTS "Public can read locations" ON locations;
DROP POLICY IF EXISTS "Authenticated users can insert locations" ON locations;
DROP POLICY IF EXISTS "Authenticated users can update locations" ON locations;
DROP POLICY IF EXISTS "Authenticated users can delete locations" ON locations;

CREATE POLICY "Public can read locations" ON locations
FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert locations" ON locations
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update locations" ON locations
FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete locations" ON locations
FOR DELETE USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can read assets" ON assets;
DROP POLICY IF EXISTS "Authenticated users can insert assets" ON assets;
DROP POLICY IF EXISTS "Authenticated users can update assets" ON assets;
DROP POLICY IF EXISTS "Authenticated users can delete assets" ON assets;

CREATE POLICY "Authenticated users can read assets" ON assets
FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert assets" ON assets
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update assets" ON assets
FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete assets" ON assets
FOR DELETE USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can read technicians" ON technicians;
DROP POLICY IF EXISTS "Authenticated users can insert technicians" ON technicians;
DROP POLICY IF EXISTS "Authenticated users can update technicians" ON technicians;
DROP POLICY IF EXISTS "Authenticated users can delete technicians" ON technicians;

CREATE POLICY "Authenticated users can read technicians" ON technicians
FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert technicians" ON technicians
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update technicians" ON technicians
FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete technicians" ON technicians
FOR DELETE USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Users can read own profile or admins can read all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update profiles" ON profiles;

CREATE POLICY "Users can read own profile or admins can read all profiles" ON profiles
FOR SELECT USING (
    auth.uid() = id
    OR LOWER(COALESCE(auth.jwt() -> 'app_metadata' ->> 'role', '')) = 'admin'
);

CREATE POLICY "Admins can update profiles" ON profiles
FOR UPDATE USING (
    LOWER(COALESCE(auth.jwt() -> 'app_metadata' ->> 'role', '')) = 'admin'
);

DROP POLICY IF EXISTS "Authenticated users can read suppliers" ON suppliers;
DROP POLICY IF EXISTS "Authenticated users can insert suppliers" ON suppliers;
DROP POLICY IF EXISTS "Authenticated users can update suppliers" ON suppliers;
DROP POLICY IF EXISTS "Authenticated users can delete suppliers" ON suppliers;

CREATE POLICY "Authenticated users can read suppliers" ON suppliers
FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert suppliers" ON suppliers
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update suppliers" ON suppliers
FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete suppliers" ON suppliers
FOR DELETE USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can read work orders" ON work_orders;
DROP POLICY IF EXISTS "Authenticated users can insert work orders" ON work_orders;
DROP POLICY IF EXISTS "Authenticated users can update work orders" ON work_orders;
DROP POLICY IF EXISTS "Authenticated users can delete work orders" ON work_orders;

CREATE POLICY "Authenticated users can read work orders" ON work_orders
FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert work orders" ON work_orders
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update work orders" ON work_orders
FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete work orders" ON work_orders
FOR DELETE USING (
    auth.role() = 'authenticated'
    AND LOWER(COALESCE(auth.jwt() -> 'app_metadata' ->> 'role', auth.jwt() -> 'user_metadata' ->> 'role', '')) = 'admin'
);

DROP POLICY IF EXISTS "Public can create tickets" ON tickets;
DROP POLICY IF EXISTS "Authenticated users can read tickets" ON tickets;
DROP POLICY IF EXISTS "Authenticated users can update tickets" ON tickets;
DROP POLICY IF EXISTS "Authenticated users can delete tickets" ON tickets;

CREATE POLICY "Public can create tickets" ON tickets
FOR INSERT WITH CHECK (true);

CREATE POLICY "Authenticated users can read tickets" ON tickets
FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update tickets" ON tickets
FOR UPDATE USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete tickets" ON tickets
FOR DELETE USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Users can read own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;

CREATE POLICY "Users can read own notifications" ON notifications
FOR SELECT USING (auth.uid() = target_user_id);

CREATE POLICY "Users can update own notifications" ON notifications
FOR UPDATE USING (auth.uid() = target_user_id)
WITH CHECK (auth.uid() = target_user_id);

DROP POLICY IF EXISTS "Authenticated users can read audit log" ON audit_log;
DROP POLICY IF EXISTS "Authenticated users can insert audit log" ON audit_log;

CREATE POLICY "Authenticated users can read audit log" ON audit_log
FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert audit log" ON audit_log
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

COMMIT;
