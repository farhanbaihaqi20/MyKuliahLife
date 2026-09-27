-- =========================================================================
-- MIGRATION: Security Hardening (Storage Path Isolation & Anti-Enumeration)
-- =========================================================================

-- 1. Anti-Email Enumeration: Cabut izin eksekusi dari role 'anon'
-- Pengguna publik/belum login tidak lagi bisa memanggil fungsi pengecekan email ini
REVOKE EXECUTE ON FUNCTION public.check_email_exists(text) FROM anon;
GRANT EXECUTE ON FUNCTION public.check_email_exists(text) TO authenticated;

-- 2. Storage Hardening: Perketat Row Level Security (RLS) pada bucket 'avatars'
-- Drop kebijakan lama yang masih longgar
DROP POLICY IF EXISTS "Authenticated users can upload avatars" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update their avatars" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete their avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can only upload their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can only update their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can only delete their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Public avatars access" ON storage.objects;

-- 2.1 Akses Baca Publik (Semua orang bisa melihat foto avatar yang di-share)
CREATE POLICY "Public avatars access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');

-- 2.2 Upload Policy: Pengguna hanya boleh mengunggah file ke foldernya sendiri (folder nama = auth.uid())
CREATE POLICY "Users can only upload their own avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 2.3 Update Policy: Pengguna hanya boleh memperbarui foto di foldernya sendiri
CREATE POLICY "Users can only update their own avatar"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 2.4 Delete Policy: Pengguna hanya boleh menghapus foto di foldernya sendiri
CREATE POLICY "Users can only delete their own avatar"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);
