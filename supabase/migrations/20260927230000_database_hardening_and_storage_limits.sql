-- =========================================================================
-- MIGRATION: Database Hardening & Storage Limits (v2.0)
-- Menutup celah eksploitasi Storage (DoS & Stored XSS) serta manipulasi REST API (Burp Suite)
-- =========================================================================

-- 1. STORAGE LIMITS: Batasi Bucket 'avatars' (Maksimal 2MB & Hanya Gambar Valid)
-- Mencegah penyerang mengunggah file HTML/SVG (XSS) atau file ratusan MB (Storage DoS)
UPDATE storage.buckets
SET 
  file_size_limit = 2097152, -- 2 MB
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp']
WHERE id = 'avatars';

-- 2. INTEGRITAS DATA: Tambahkan CHECK Constraint pada Kolom Finansial & Akademik
-- Mencegah manipulasi data via direct REST API / Postman / Burp Suite

-- 2.1 Transaksi: Nominal harus lebih besar dari 0
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'check_transaction_amount_positive'
  ) THEN
    ALTER TABLE public.transactions
      ADD CONSTRAINT check_transaction_amount_positive CHECK (amount > 0);
  END IF;
END $$;

-- 2.2 Mata Kuliah: SKS wajar (1 - 12) & Semester valid (1 - 14)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'check_course_sks_range'
  ) THEN
    ALTER TABLE public.courses
      ADD CONSTRAINT check_course_sks_range CHECK (sks BETWEEN 1 AND 12);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'check_course_semester_range'
  ) THEN
    ALTER TABLE public.courses
      ADD CONSTRAINT check_course_semester_range CHECK (semester BETWEEN 1 AND 14);
  END IF;
END $$;

-- 2.3 Target Tabungan: Target harus > 0 & Tabungan saat ini >= 0
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'check_savings_target_positive'
  ) THEN
    ALTER TABLE public.savings_targets
      ADD CONSTRAINT check_savings_target_positive CHECK (target_amount > 0);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'check_savings_current_non_negative'
  ) THEN
    ALTER TABLE public.savings_targets
      ADD CONSTRAINT check_savings_current_non_negative CHECK (current_amount >= 0);
  END IF;
END $$;

-- 2.4 Tagihan: Nominal tagihan tidak boleh negatif
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'check_bill_amount_non_negative'
  ) THEN
    ALTER TABLE public.bills
      ADD CONSTRAINT check_bill_amount_non_negative CHECK (amount >= 0);
  END IF;
END $$;

-- 2.5 Catatan BBM: Nominal & liter harus lebih besar dari 0
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'check_fuel_log_amount_positive'
  ) THEN
    ALTER TABLE public.fuel_logs
      ADD CONSTRAINT check_fuel_log_amount_positive CHECK (amount > 0);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'check_fuel_log_liters_positive'
  ) THEN
    ALTER TABLE public.fuel_logs
      ADD CONSTRAINT check_fuel_log_liters_positive CHECK (liters > 0);
  END IF;
END $$;
