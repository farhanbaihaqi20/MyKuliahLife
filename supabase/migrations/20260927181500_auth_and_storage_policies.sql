-- =========================================================================
-- MIGRATION: Email Check RPC & Storage Avatar Policies
-- =========================================================================

-- 1. Function to check if an email exists in auth.users
CREATE OR REPLACE FUNCTION public.check_email_exists(target_email text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM auth.users WHERE LOWER(email) = LOWER(TRIM(target_email))
  );
END;
$$;

-- Allow anon and authenticated callers to execute check_email_exists
GRANT EXECUTE ON FUNCTION public.check_email_exists(text) TO anon, authenticated;

-- 2. Ensure Storage Bucket 'avatars' is created and public
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 3. Storage Row Level Security (RLS) policies on storage.objects
DROP POLICY IF EXISTS "Public avatars access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload avatars" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update their avatars" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete their avatars" ON storage.objects;

-- Allow public read of avatars
CREATE POLICY "Public avatars access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');

-- Allow authenticated users to upload avatar to avatars bucket
CREATE POLICY "Authenticated users can upload avatars"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'avatars');

-- Allow authenticated users to update their avatar
CREATE POLICY "Authenticated users can update their avatars"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'avatars');

-- Allow authenticated users to delete their avatar
CREATE POLICY "Authenticated users can delete their avatars"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'avatars');

-- 4. Ensure avatar_url column exists in public.profiles table for multi-browser sync
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;

