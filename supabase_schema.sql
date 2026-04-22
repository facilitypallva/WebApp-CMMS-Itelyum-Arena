# DATABASE SCHEMA - SUPABASE (POSTGRESQL)

-- Facilities Table
CREATE TABLE facilities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    address TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Locations Table (Gerarchica)
CREATE TABLE locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    facility_id UUID REFERENCES facilities(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES locations(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    description TEXT,
    qr_code_id TEXT UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Assets Table
CREATE TABLE assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    location_id UUID REFERENCES locations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('Rivelazione incendi', 'Antincendio', 'Meccanico', 'Elettrico', 'TVCC')),
    brand TEXT,
    model TEXT,
    serial_number TEXT,
    installation_date DATE,
    last_verification DATE,
    verification_frequency_months INTEGER NOT NULL DEFAULT 6,
    status TEXT DEFAULT 'IN REGOLA', -- SCADUTO, IN SCADENZA, IN REGOLA
    documents TEXT[], -- Array of Google Drive links
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Technicians Table
CREATE TABLE technicians (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    specialization TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Suppliers Table
CREATE TABLE suppliers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    contact_info JSONB,
    category TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Work Orders Table
CREATE TABLE work_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_id UUID REFERENCES assets(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('PROGRAMMED', 'CORRECTIVE', 'EXTRA')),
    status TEXT NOT NULL CHECK (status IN ('NEW', 'PLANNED', 'ASSIGNED', 'IN_PROGRESS', 'SUSPENDED', 'CLOSED', 'VALIDATED')),
    priority TEXT NOT NULL CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    description TEXT,
    technician_id UUID REFERENCES technicians(id),
    supplier_id UUID REFERENCES suppliers(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    planned_date TIMESTAMPTZ,
    closed_at TIMESTAMPTZ,
    validation_date TIMESTAMPTZ,
    photos TEXT[], -- Drive links
    cost DECIMAL(10, 2),
    notes TEXT
);

-- Tickets Table (Public)
CREATE TABLE ticket_code_counters (
    scope TEXT PRIMARY KEY,
    last_value INTEGER NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE,
    reporter_name TEXT NOT NULL,
    reporter_email TEXT NOT NULL,
    location_id UUID REFERENCES locations(id),
    asset_id UUID REFERENCES assets(id), -- Optional, can be assigned later
    problem_category TEXT,
    description TEXT NOT NULL,
    status TEXT DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'IN_PROGRESS', 'CLOSED')),
    photo_url TEXT,
    work_order_id UUID REFERENCES work_orders(id), -- Mandatory link once processed
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Audit Log Table
CREATE TABLE audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL, -- Link to auth.users
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id UUID NOT NULL,
    old_value JSONB,
    new_value JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS (Row Level Security) Examples
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;

-- Tickets can be inserted by anyone (public form)
CREATE POLICY "Public can create tickets" ON tickets FOR INSERT WITH CHECK (true);
CREATE POLICY "Only authenticated can read tickets" ON tickets FOR SELECT USING (auth.role() = 'authenticated');

-- Assets/Work Orders only for authenticated
CREATE POLICY "Only authenticated can manage assets" ON assets ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Only authenticated can manage work orders" ON work_orders ALL USING (auth.role() = 'authenticated');

-- Functions (Auto-calculate next verification)
CREATE OR REPLACE FUNCTION update_asset_next_verification()
RETURNS TRIGGER AS $$
BEGIN
    -- This logic would be handled in the app for more complex scenarios, 
    -- but SQL can manage the base status.
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

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
