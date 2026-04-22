BEGIN;

ALTER TABLE tickets
ADD COLUMN IF NOT EXISTS code TEXT;

ALTER TABLE tickets
ADD COLUMN IF NOT EXISTS problem_category TEXT;

CREATE TABLE IF NOT EXISTS ticket_code_counters (
    scope TEXT PRIMARY KEY,
    last_value INTEGER NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'ticket_code_counters'
      AND column_name = 'year_suffix'
  ) AND NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'ticket_code_counters'
      AND column_name = 'scope'
  ) THEN
    ALTER TABLE ticket_code_counters RENAME COLUMN year_suffix TO scope;
  END IF;
END $$;

ALTER TABLE ticket_code_counters
ADD COLUMN IF NOT EXISTS scope TEXT;

ALTER TABLE ticket_code_counters
ADD COLUMN IF NOT EXISTS last_value INTEGER NOT NULL DEFAULT 0;

ALTER TABLE ticket_code_counters
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

UPDATE ticket_code_counters
SET scope = 'GLOBAL'
WHERE scope IS NULL OR BTRIM(scope) = '';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'ticket_code_counters_pkey'
      AND conrelid = 'ticket_code_counters'::regclass
  ) THEN
    ALTER TABLE ticket_code_counters
    ADD CONSTRAINT ticket_code_counters_pkey PRIMARY KEY (scope);
  END IF;
END $$;

WITH ranked_tickets AS (
  SELECT
    id,
    FORMAT(
      'TK-%s',
      LPAD(
        ROW_NUMBER() OVER (
          ORDER BY created_at, id
        )::TEXT,
        4,
        '0'
      )
    ) AS generated_code
  FROM tickets
  WHERE code IS NULL OR BTRIM(code) = ''
)
UPDATE tickets t
SET code = ranked_tickets.generated_code
FROM ranked_tickets
WHERE t.id = ranked_tickets.id;

INSERT INTO ticket_code_counters (scope, last_value, updated_at)
SELECT
  'GLOBAL',
  COALESCE(MAX(SUBSTRING(code FROM 4)::INTEGER), 0),
  NOW()
FROM tickets
WHERE code ~ '^TK-[0-9]{4,}$'
ON CONFLICT (scope)
DO UPDATE SET
  last_value = GREATEST(ticket_code_counters.last_value, EXCLUDED.last_value),
  updated_at = NOW();

CREATE UNIQUE INDEX IF NOT EXISTS idx_tickets_code ON tickets (code) WHERE code IS NOT NULL;

DROP TRIGGER IF EXISTS trg_tickets_assign_code ON tickets;

DO $$
DECLARE
  function_signature TEXT;
BEGIN
  FOR function_signature IN
    SELECT pg_get_function_identity_arguments(p.oid)
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname = 'next_ticket_code'
  LOOP
    EXECUTE FORMAT('DROP FUNCTION IF EXISTS public.next_ticket_code(%s)', function_signature);
  END LOOP;

  FOR function_signature IN
    SELECT pg_get_function_identity_arguments(p.oid)
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname = 'assign_ticket_code'
  LOOP
    EXECUTE FORMAT('DROP FUNCTION IF EXISTS public.assign_ticket_code(%s)', function_signature);
  END LOOP;
END $$;

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

CREATE TRIGGER trg_tickets_assign_code
BEFORE INSERT ON tickets
FOR EACH ROW
EXECUTE FUNCTION assign_ticket_code();

COMMIT;
