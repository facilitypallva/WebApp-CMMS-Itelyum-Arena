-- Apply on an existing Supabase project to align asset/work-order maintenance logic.
-- This script makes the work order the source of truth for maintenance execution.

-- Intentionally not wrapped in a single transaction.
-- This patch may extend existing enum types (for example `user_role`),
-- and PostgreSQL requires new enum values to be committed before use.

ALTER TABLE facilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE technicians ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_orders ENABLE ROW LEVEL SECURITY;

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
DROP POLICY IF EXISTS "Authenticated users can insert locations" ON locations;
DROP POLICY IF EXISTS "Authenticated users can update locations" ON locations;
DROP POLICY IF EXISTS "Authenticated users can delete locations" ON locations;

CREATE POLICY "Authenticated users can read locations" ON locations
FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert locations" ON locations
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update locations" ON locations
FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete locations" ON locations
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

CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT,
    role TEXT NOT NULL DEFAULT 'LETTURA',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT profiles_role_check CHECK (role IN ('ADMIN', 'RESPONSABILE', 'TECNICO', 'LETTURA'))
);

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS full_name TEXT;

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS role TEXT;

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS is_active BOOLEAN;

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ;

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ;

DO $$
DECLARE
  role_type_name TEXT;
BEGIN
  SELECT c.udt_name
  INTO role_type_name
  FROM information_schema.columns c
  WHERE c.table_schema = 'public'
    AND c.table_name = 'profiles'
    AND c.column_name = 'role';

  IF role_type_name IS NOT NULL
     AND role_type_name <> 'text'
     AND EXISTS (
       SELECT 1
       FROM pg_type t
       WHERE t.typname = role_type_name
         AND t.typtype = 'e'
     ) THEN
    EXECUTE format('ALTER TYPE %I ADD VALUE IF NOT EXISTS %L', role_type_name, 'ADMIN');
    EXECUTE format('ALTER TYPE %I ADD VALUE IF NOT EXISTS %L', role_type_name, 'RESPONSABILE');
    EXECUTE format('ALTER TYPE %I ADD VALUE IF NOT EXISTS %L', role_type_name, 'TECNICO');
    EXECUTE format('ALTER TYPE %I ADD VALUE IF NOT EXISTS %L', role_type_name, 'LETTURA');

    EXECUTE format($sql$
      UPDATE profiles
      SET role = (
        CASE
          WHEN UPPER(role::TEXT) = 'ADMIN' THEN 'ADMIN'
          WHEN UPPER(role::TEXT) IN ('RESPONSABILE', 'MANAGER') THEN 'RESPONSABILE'
          WHEN UPPER(role::TEXT) IN ('TECNICO', 'TECHNICIAN') THEN 'TECNICO'
          WHEN UPPER(role::TEXT) IN ('LETTURA', 'VIEWER', 'READONLY', 'READ_ONLY') THEN 'LETTURA'
          ELSE 'LETTURA'
        END
      )::%I
    $sql$, role_type_name);
  END IF;
END $$;

UPDATE profiles
SET role = 'LETTURA'
WHERE role IS NULL
   OR role NOT IN ('ADMIN', 'RESPONSABILE', 'TECNICO', 'LETTURA');

UPDATE profiles
SET is_active = TRUE
WHERE is_active IS NULL;

UPDATE profiles
SET created_at = NOW()
WHERE created_at IS NULL;

UPDATE profiles
SET updated_at = NOW()
WHERE updated_at IS NULL;

ALTER TABLE profiles
ALTER COLUMN role SET DEFAULT 'LETTURA';

ALTER TABLE profiles
ALTER COLUMN role SET NOT NULL;

ALTER TABLE profiles
ALTER COLUMN is_active SET DEFAULT TRUE;

ALTER TABLE profiles
ALTER COLUMN is_active SET NOT NULL;

ALTER TABLE profiles
ALTER COLUMN created_at SET DEFAULT NOW();

ALTER TABLE profiles
ALTER COLUMN created_at SET NOT NULL;

ALTER TABLE profiles
ALTER COLUMN updated_at SET DEFAULT NOW();

ALTER TABLE profiles
ALTER COLUMN updated_at SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'profiles_role_check'
  ) THEN
    ALTER TABLE profiles
    ADD CONSTRAINT profiles_role_check
    CHECK (role IN ('ADMIN', 'RESPONSABILE', 'TECNICO', 'LETTURA'));
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_email ON profiles (email);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own profile or admins can read all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update profiles" ON profiles;

CREATE OR REPLACE FUNCTION handle_auth_user_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
    normalized_role TEXT;
    role_type_name TEXT;
BEGIN
    normalized_role := UPPER(COALESCE(NEW.raw_app_meta_data ->> 'role', 'LETTURA'));

    IF normalized_role NOT IN ('ADMIN', 'RESPONSABILE', 'TECNICO', 'LETTURA') THEN
        normalized_role := 'LETTURA';
    END IF;

    SELECT c.udt_name
    INTO role_type_name
    FROM information_schema.columns c
    WHERE c.table_schema = 'public'
      AND c.table_name = 'profiles'
      AND c.column_name = 'role';

    IF role_type_name IS NOT NULL
       AND role_type_name <> 'text'
       AND EXISTS (
         SELECT 1
         FROM pg_type t
         WHERE t.typname = role_type_name
           AND t.typtype = 'e'
       ) THEN
      EXECUTE format(
        'INSERT INTO public.profiles (
            id,
            email,
            full_name,
            role,
            is_active,
            created_at,
            updated_at
        )
        VALUES ($1, $2, $3, $4::%I, $5, $6, NOW())
        ON CONFLICT (id) DO UPDATE SET
            email = EXCLUDED.email,
            full_name = EXCLUDED.full_name,
            role = EXCLUDED.role,
            is_active = EXCLUDED.is_active,
            updated_at = NOW()',
        role_type_name
      )
      USING
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''),
        normalized_role,
        COALESCE((NEW.raw_user_meta_data ->> 'is_active')::BOOLEAN, TRUE),
        COALESCE(NEW.created_at, NOW());
    ELSE
      INSERT INTO public.profiles (
          id,
          email,
          full_name,
          role,
          is_active,
          created_at,
          updated_at
      )
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
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_auth_users_profile_sync ON auth.users;
CREATE TRIGGER trg_auth_users_profile_sync
AFTER INSERT OR UPDATE OF email, raw_user_meta_data, raw_app_meta_data ON auth.users
FOR EACH ROW
EXECUTE FUNCTION handle_auth_user_profile();

DO $$
DECLARE
  role_type_name TEXT;
BEGIN
  SELECT c.udt_name
  INTO role_type_name
  FROM information_schema.columns c
  WHERE c.table_schema = 'public'
    AND c.table_name = 'profiles'
    AND c.column_name = 'role';

  IF role_type_name IS NOT NULL
     AND role_type_name <> 'text'
     AND EXISTS (
       SELECT 1
       FROM pg_type t
       WHERE t.typname = role_type_name
         AND t.typtype = 'e'
     ) THEN
    EXECUTE format($sql$
      INSERT INTO profiles (id, email, full_name, role, is_active, created_at, updated_at)
      SELECT
          u.id,
          u.email,
          COALESCE(u.raw_user_meta_data ->> 'full_name', ''),
          (
            CASE
              WHEN UPPER(COALESCE(u.raw_app_meta_data ->> 'role', 'LETTURA')) IN ('ADMIN', 'RESPONSABILE', 'TECNICO', 'LETTURA')
                THEN UPPER(COALESCE(u.raw_app_meta_data ->> 'role', 'LETTURA'))
              ELSE 'LETTURA'
            END
          )::%I,
          COALESCE((u.raw_user_meta_data ->> 'is_active')::BOOLEAN, TRUE),
          COALESCE(u.created_at, NOW()),
          NOW()
      FROM auth.users u
      ON CONFLICT (id) DO UPDATE SET
          email = EXCLUDED.email,
          full_name = EXCLUDED.full_name,
          role = EXCLUDED.role,
          is_active = EXCLUDED.is_active,
          updated_at = NOW()
    $sql$, role_type_name);
  ELSE
    INSERT INTO profiles (id, email, full_name, role, is_active, created_at, updated_at)
    SELECT
        u.id,
        u.email,
        COALESCE(u.raw_user_meta_data ->> 'full_name', ''),
        CASE
            WHEN UPPER(COALESCE(u.raw_app_meta_data ->> 'role', 'LETTURA')) IN ('ADMIN', 'RESPONSABILE', 'TECNICO', 'LETTURA')
                THEN UPPER(COALESCE(u.raw_app_meta_data ->> 'role', 'LETTURA'))
            ELSE 'LETTURA'
        END,
        COALESCE((u.raw_user_meta_data ->> 'is_active')::BOOLEAN, TRUE),
        COALESCE(u.created_at, NOW()),
        NOW()
    FROM auth.users u
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        role = EXCLUDED.role,
        is_active = EXCLUDED.is_active,
        updated_at = NOW();
  END IF;
END $$;

CREATE POLICY "Users can read own profile or admins can read all profiles" ON profiles
FOR SELECT USING (
  auth.uid() = id
  OR LOWER(COALESCE(auth.jwt() -> 'app_metadata' ->> 'role', auth.jwt() -> 'user_metadata' ->> 'role', '')) = 'admin'
);

CREATE POLICY "Admins can update profiles" ON profiles
FOR UPDATE USING (
  LOWER(COALESCE(auth.jwt() -> 'app_metadata' ->> 'role', auth.jwt() -> 'user_metadata' ->> 'role', '')) = 'admin'
);

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

ALTER TABLE work_orders
ADD COLUMN IF NOT EXISTS executed_at TIMESTAMPTZ;

ALTER TABLE work_orders
ADD COLUMN IF NOT EXISTS code TEXT;

ALTER TABLE assets
ADD COLUMN IF NOT EXISTS verification_frequency_code TEXT;

ALTER TABLE assets
ADD COLUMN IF NOT EXISTS verification_frequency_days INTEGER;

CREATE TABLE IF NOT EXISTS work_order_code_counters (
    year_suffix TEXT PRIMARY KEY,
    last_value INTEGER NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE work_orders
DROP CONSTRAINT IF EXISTS work_orders_status_check;

ALTER TABLE work_orders
ADD CONSTRAINT work_orders_status_check
CHECK (status IN ('NEW', 'PLANNED', 'ASSIGNED', 'IN_PROGRESS', 'SUSPENDED', 'CLOSED', 'VALIDATED', 'ABANDONED'));

ALTER TABLE technicians
ADD COLUMN IF NOT EXISTS employment_type TEXT;

ALTER TABLE technicians
ADD COLUMN IF NOT EXISTS supplier_id UUID REFERENCES suppliers(id);

UPDATE technicians
SET employment_type = CASE
  WHEN supplier_id IS NOT NULL THEN 'EXTERNAL'
  ELSE 'INTERNAL'
END
WHERE employment_type IS NULL;

ALTER TABLE technicians
ALTER COLUMN employment_type SET DEFAULT 'INTERNAL';

UPDATE technicians
SET employment_type = 'INTERNAL'
WHERE employment_type NOT IN ('INTERNAL', 'EXTERNAL') OR employment_type IS NULL;

ALTER TABLE technicians
ALTER COLUMN employment_type SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'technicians_employment_type_check'
  ) THEN
    ALTER TABLE technicians
    ADD CONSTRAINT technicians_employment_type_check
    CHECK (employment_type IN ('INTERNAL', 'EXTERNAL'));
  END IF;
END $$;

UPDATE assets
SET verification_frequency_days = COALESCE(verification_frequency_days, verification_frequency_months * 30, 180)
WHERE verification_frequency_days IS NULL;

ALTER TABLE assets
ALTER COLUMN verification_frequency_days SET NOT NULL;

ALTER TABLE assets
ALTER COLUMN verification_frequency_days SET DEFAULT 180;

WITH ranked_work_orders AS (
  SELECT
    id,
    FORMAT(
      'WO-%s%s',
      TO_CHAR(created_at, 'YY'),
      LPAD(
        ROW_NUMBER() OVER (
          PARTITION BY TO_CHAR(created_at, 'YY')
          ORDER BY created_at, id
        )::TEXT,
        3,
        '0'
      )
    ) AS generated_code
  FROM work_orders
  WHERE code IS NULL OR BTRIM(code) = ''
)
UPDATE work_orders wo
SET code = ranked_work_orders.generated_code
FROM ranked_work_orders
WHERE wo.id = ranked_work_orders.id;

INSERT INTO work_order_code_counters (year_suffix, last_value, updated_at)
SELECT
  SUBSTRING(code FROM 4 FOR 2) AS year_suffix,
  MAX(SUBSTRING(code FROM 6)::INTEGER) AS last_value,
  NOW()
FROM work_orders
WHERE code ~ '^WO-[0-9]{2}[0-9]{3,}$'
GROUP BY SUBSTRING(code FROM 4 FOR 2)
ON CONFLICT (year_suffix)
DO UPDATE SET
  last_value = GREATEST(work_order_code_counters.last_value, EXCLUDED.last_value),
  updated_at = NOW();

CREATE INDEX IF NOT EXISTS idx_work_orders_executed_at ON work_orders (executed_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS idx_work_orders_code ON work_orders (code) WHERE code IS NOT NULL;

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
        NEW.updated_at := NOW();
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

UPDATE work_orders
SET executed_at = COALESCE(executed_at, validation_date, closed_at)
WHERE executed_at IS NULL
  AND (validation_date IS NOT NULL OR closed_at IS NOT NULL);

UPDATE assets
SET updated_at = NOW();

-- End of patch.
