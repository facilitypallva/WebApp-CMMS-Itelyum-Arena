CREATE TABLE vehicle_booking_code_counters (
    scope TEXT PRIMARY KEY,
    last_value INTEGER NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE vehicles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    facility_id UUID REFERENCES facilities(id),
    brand TEXT NOT NULL,
    model TEXT NOT NULL,
    plate TEXT NOT NULL UNIQUE,
    year INTEGER,
    vehicle_type TEXT CHECK (vehicle_type IN ('auto', 'furgone', 'bus', 'altro')),
    fuel_type TEXT CHECK (fuel_type IN ('benzina', 'diesel', 'elettrico', 'ibrido', 'gpl')),
    current_km INTEGER DEFAULT 0,
    photo_url TEXT,
    assignment_type TEXT NOT NULL CHECK (assignment_type IN ('staff', 'giocatore', 'sharing')),
    status TEXT NOT NULL DEFAULT 'disponibile' CHECK (status IN ('disponibile', 'in_uso', 'manutenzione', 'fuori_servizio')),
    sharing_link_slug TEXT UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE vehicle_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id UUID REFERENCES vehicles(id) ON DELETE CASCADE,
    assigned_to_name TEXT NOT NULL,
    assigned_to_role TEXT,
    assignment_category TEXT CHECK (assignment_category IN ('staff', 'giocatore')),
    season TEXT,
    substitute_vehicle_id UUID REFERENCES vehicles(id),
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE vehicle_deadlines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id UUID REFERENCES vehicles(id) ON DELETE CASCADE,
    deadline_type TEXT NOT NULL CHECK (deadline_type IN ('assicurazione', 'revisione', 'bollo', 'tagliando')),
    expiry_date DATE,
    next_km INTEGER,
    document_url TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE vehicle_maintenances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id UUID REFERENCES vehicles(id) ON DELETE CASCADE,
    maintenance_type TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    notes TEXT,
    completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE vehicle_bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id UUID REFERENCES vehicles(id),
    booking_code TEXT UNIQUE,
    requester_name TEXT NOT NULL,
    requester_surname TEXT NOT NULL,
    requester_email TEXT NOT NULL,
    departure TEXT NOT NULL,
    destination TEXT NOT NULL,
    trip_date DATE NOT NULL,
    departure_time TIME NOT NULL,
    return_time TIME,
    reason TEXT NOT NULL,
    signature_name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    fm_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_vehicles_plate ON vehicles(plate);
CREATE INDEX idx_vehicle_assignments_vehicle_id ON vehicle_assignments(vehicle_id);
CREATE INDEX idx_vehicle_deadlines_vehicle_id ON vehicle_deadlines(vehicle_id);
CREATE INDEX idx_vehicle_maintenances_vehicle_id ON vehicle_maintenances(vehicle_id);
CREATE INDEX idx_vehicle_bookings_vehicle_id ON vehicle_bookings(vehicle_id);

ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_deadlines ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_maintenances ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read vehicles" ON vehicles
FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert vehicles" ON vehicles
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update vehicles" ON vehicles
FOR UPDATE USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete vehicles" ON vehicles
FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can read vehicle assignments" ON vehicle_assignments
FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert vehicle assignments" ON vehicle_assignments
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update vehicle assignments" ON vehicle_assignments
FOR UPDATE USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete vehicle assignments" ON vehicle_assignments
FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can read vehicle deadlines" ON vehicle_deadlines
FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert vehicle deadlines" ON vehicle_deadlines
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update vehicle deadlines" ON vehicle_deadlines
FOR UPDATE USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete vehicle deadlines" ON vehicle_deadlines
FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can read vehicle maintenances" ON vehicle_maintenances
FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert vehicle maintenances" ON vehicle_maintenances
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update vehicle maintenances" ON vehicle_maintenances
FOR UPDATE USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete vehicle maintenances" ON vehicle_maintenances
FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Public can create vehicle bookings" ON vehicle_bookings
FOR INSERT WITH CHECK (true);

CREATE POLICY "Authenticated users can read vehicle bookings" ON vehicle_bookings
FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update vehicle bookings" ON vehicle_bookings
FOR UPDATE USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

CREATE OR REPLACE FUNCTION update_vehicles_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_vehicles_updated_at ON vehicles;
CREATE TRIGGER trg_vehicles_updated_at
BEFORE UPDATE ON vehicles
FOR EACH ROW
EXECUTE FUNCTION update_vehicles_updated_at();

CREATE OR REPLACE FUNCTION next_vehicle_booking_code()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    next_value INTEGER;
BEGIN
    INSERT INTO vehicle_booking_code_counters (scope, last_value, updated_at)
    VALUES ('GLOBAL', 1, NOW())
    ON CONFLICT (scope)
    DO UPDATE SET
        last_value = vehicle_booking_code_counters.last_value + 1,
        updated_at = NOW()
    RETURNING last_value INTO next_value;

    RETURN 'PV-' || LPAD(next_value::TEXT, 3, '0');
END;
$$;

CREATE OR REPLACE FUNCTION assign_vehicle_booking_code()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NEW.booking_code IS NULL OR BTRIM(NEW.booking_code) = '' THEN
        NEW.booking_code := next_vehicle_booking_code();
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_vehicle_bookings_assign_code ON vehicle_bookings;
CREATE TRIGGER trg_vehicle_bookings_assign_code
BEFORE INSERT ON vehicle_bookings
FOR EACH ROW
EXECUTE FUNCTION assign_vehicle_booking_code();

NOTIFY pgrst, 'reload schema';
