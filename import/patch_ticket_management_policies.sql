BEGIN;

ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can update tickets" ON tickets;
DROP POLICY IF EXISTS "Authenticated users can delete tickets" ON tickets;

CREATE POLICY "Authenticated users can update tickets" ON tickets
FOR UPDATE
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete tickets" ON tickets
FOR DELETE
USING (auth.role() = 'authenticated');

COMMIT;
