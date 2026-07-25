-- Phase 6 Migrations: Storage Bucket for WhatsApp Media

-- Create the storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('whatsapp_media', 'whatsapp_media', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access to the bucket
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'whatsapp_media' );

-- Allow authenticated users to insert/upload files
CREATE POLICY "Auth Insert"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'whatsapp_media' 
    AND auth.role() = 'authenticated'
);

-- Allow service role to do everything
CREATE POLICY "Service Role Full Access"
ON storage.objects FOR ALL
USING ( bucket_id = 'whatsapp_media' );
