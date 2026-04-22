BEGIN;

ALTER TABLE locations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can read locations" ON locations;
DROP POLICY IF EXISTS "Public can read locations" ON locations;

CREATE POLICY "Public can read locations" ON locations
FOR SELECT
USING (true);

COMMIT;
