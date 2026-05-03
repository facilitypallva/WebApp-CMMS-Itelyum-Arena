INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'vehicles',
    'vehicles',
    TRUE,
    10485760,
    ARRAY['image/png', 'image/jpeg']
)
ON CONFLICT (id) DO UPDATE SET
    public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Public can read vehicle images" ON storage.objects;
CREATE POLICY "Public can read vehicle images" ON storage.objects
FOR SELECT USING (bucket_id = 'vehicles');

DROP POLICY IF EXISTS "Authenticated users can upload vehicle images" ON storage.objects;
CREATE POLICY "Authenticated users can upload vehicle images" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'vehicles' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can update vehicle images" ON storage.objects;
CREATE POLICY "Authenticated users can update vehicle images" ON storage.objects
FOR UPDATE USING (bucket_id = 'vehicles' AND auth.role() = 'authenticated')
WITH CHECK (bucket_id = 'vehicles' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can delete vehicle images" ON storage.objects;
CREATE POLICY "Authenticated users can delete vehicle images" ON storage.objects
FOR DELETE USING (bucket_id = 'vehicles' AND auth.role() = 'authenticated');
