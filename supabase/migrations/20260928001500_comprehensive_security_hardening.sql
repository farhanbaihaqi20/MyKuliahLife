-- =========================================================================
-- MIGRATION: Comprehensive Security Hardening & Strict Data Integrity (v3.0)
-- Menutup celah email enumeration, manipulasi data via REST API / Burp Suite,
-- eksploitasi ekstensi storage, dan storage bloat DoS.
-- =========================================================================

-- 1. TUTUP CELAH EMAIL ENUMERATION / HARVESTING
-- Hapus fungsi check_email_exists secara permanen dari schema public
-- agar penyerang (bahkan authenticated user) tidak bisa brute force/harvest email pengguna lain.
DROP FUNCTION IF EXISTS public.check_email_exists(text);

-- 2. STORAGE RLS HARDENING: Validasi Ekstensi Gambar secara Ketat di Level Database
-- Memastikan file yang diunggah/diperbarui HANYA berekstensi jpg, jpeg, png, atau webp
DROP POLICY IF EXISTS "Users can only upload their own avatar" ON storage.objects;
CREATE POLICY "Users can only upload their own avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' 
  AND (storage.foldername(name))[1] = auth.uid()::text
  AND LOWER(storage.extension(name)) IN ('jpg', 'jpeg', 'png', 'webp')
);

DROP POLICY IF EXISTS "Users can only update their own avatar" ON storage.objects;
CREATE POLICY "Users can only update their own avatar"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars' 
  AND (storage.foldername(name))[1] = auth.uid()::text
  AND LOWER(storage.extension(name)) IN ('jpg', 'jpeg', 'png', 'webp')
);

-- 3. INTEGRITAS DATA & CHECK CONSTRAINTS LENGKAP (ANTI-TAMPERING & ANTI-STORAGE DOS)

-- 3.1 Profiles Table
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_profile_active_semester_range') THEN
    ALTER TABLE public.profiles ADD CONSTRAINT check_profile_active_semester_range CHECK (active_semester BETWEEN 1 AND 14);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_profile_target_gpa_range') THEN
    ALTER TABLE public.profiles ADD CONSTRAINT check_profile_target_gpa_range CHECK (target_gpa BETWEEN 0.00 AND 4.00);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_profile_start_day_range') THEN
    ALTER TABLE public.profiles ADD CONSTRAINT check_profile_start_day_range CHECK (start_day_of_month BETWEEN 1 AND 31);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_profile_monthly_budget_range') THEN
    ALTER TABLE public.profiles ADD CONSTRAINT check_profile_monthly_budget_range CHECK (monthly_budget >= 0 AND monthly_budget <= 1000000000);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_profile_string_lengths') THEN
    ALTER TABLE public.profiles ADD CONSTRAINT check_profile_string_lengths CHECK (
      length(full_name) <= 150 AND 
      (university IS NULL OR length(university) <= 200) AND 
      (major IS NULL OR length(major) <= 150)
    );
  END IF;
END $$;

-- 3.2 Courses Table
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_course_grade_point_range') THEN
    ALTER TABLE public.courses ADD CONSTRAINT check_course_grade_point_range CHECK (grade_point BETWEEN 0.00 AND 4.00);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_course_string_lengths') THEN
    ALTER TABLE public.courses ADD CONSTRAINT check_course_string_lengths CHECK (
      length(name) <= 200 AND
      (code IS NULL OR length(code) <= 30) AND
      (lecturer IS NULL OR length(lecturer) <= 200) AND
      (room IS NULL OR length(room) <= 100)
    );
  END IF;
END $$;

-- 3.3 Assignments Table
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_assignment_semester_range') THEN
    ALTER TABLE public.assignments ADD CONSTRAINT check_assignment_semester_range CHECK (semester BETWEEN 1 AND 14);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_assignment_string_lengths') THEN
    ALTER TABLE public.assignments ADD CONSTRAINT check_assignment_string_lengths CHECK (
      length(title) <= 250 AND
      (description IS NULL OR length(description) <= 5000)
    );
  END IF;
END $$;

-- 3.4 Course Notes Table
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_course_notes_semester_range') THEN
    ALTER TABLE public.course_notes ADD CONSTRAINT check_course_notes_semester_range CHECK (semester BETWEEN 1 AND 14);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_course_notes_week_range') THEN
    ALTER TABLE public.course_notes ADD CONSTRAINT check_course_notes_week_range CHECK (week_number BETWEEN 1 AND 32);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_course_notes_string_lengths') THEN
    ALTER TABLE public.course_notes ADD CONSTRAINT check_course_notes_string_lengths CHECK (
      length(topic) <= 250 AND
      (content IS NULL OR length(content) <= 50000)
    );
  END IF;
END $$;

-- 3.5 Transactions Table
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_transaction_amount_max') THEN
    ALTER TABLE public.transactions ADD CONSTRAINT check_transaction_amount_max CHECK (amount <= 1000000000000);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_transaction_string_lengths') THEN
    ALTER TABLE public.transactions ADD CONSTRAINT check_transaction_string_lengths CHECK (
      length(category) <= 100 AND
      (merchant IS NULL OR length(merchant) <= 200) AND
      (note IS NULL OR length(note) <= 2000)
    );
  END IF;
END $$;

-- 3.6 Accounts Table
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_account_balance_range') THEN
    ALTER TABLE public.accounts ADD CONSTRAINT check_account_balance_range CHECK (balance >= -1000000000000 AND balance <= 1000000000000);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_account_string_lengths') THEN
    ALTER TABLE public.accounts ADD CONSTRAINT check_account_string_lengths CHECK (
      length(name) <= 100 AND
      (account_number IS NULL OR length(account_number) <= 100)
    );
  END IF;
END $$;

-- 3.7 Bills Table
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_bill_amount_max') THEN
    ALTER TABLE public.bills ADD CONSTRAINT check_bill_amount_max CHECK (amount <= 1000000000000);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_bill_string_lengths') THEN
    ALTER TABLE public.bills ADD CONSTRAINT check_bill_string_lengths CHECK (
      length(name) <= 200 AND
      (category IS NULL OR length(category) <= 100)
    );
  END IF;
END $$;

-- 3.8 Savings Targets Table
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_savings_target_max') THEN
    ALTER TABLE public.savings_targets ADD CONSTRAINT check_savings_target_max CHECK (target_amount <= 1000000000000);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_savings_current_max') THEN
    ALTER TABLE public.savings_targets ADD CONSTRAINT check_savings_current_max CHECK (current_amount <= 1000000000000);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_savings_string_lengths') THEN
    ALTER TABLE public.savings_targets ADD CONSTRAINT check_savings_string_lengths CHECK (
      length(title) <= 200 AND
      (category IS NULL OR length(category) <= 100)
    );
  END IF;
END $$;

-- 3.9 Fuel Tracker Tables
DO $$
BEGIN
  -- fuel_logs
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_fuel_log_amount_max') THEN
    ALTER TABLE public.fuel_logs ADD CONSTRAINT check_fuel_log_amount_max CHECK (amount <= 100000000);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_fuel_log_liters_max') THEN
    ALTER TABLE public.fuel_logs ADD CONSTRAINT check_fuel_log_liters_max CHECK (liters <= 1000);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_fuel_log_price_range') THEN
    ALTER TABLE public.fuel_logs ADD CONSTRAINT check_fuel_log_price_range CHECK (price_per_liter > 0 AND price_per_liter <= 1000000);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_fuel_log_string_lengths') THEN
    ALTER TABLE public.fuel_logs ADD CONSTRAINT check_fuel_log_string_lengths CHECK (
      (station IS NULL OR length(station) <= 150) AND
      (note IS NULL OR length(note) <= 1000)
    );
  END IF;

  -- fuel_settings
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_fuel_settings_tank_capacity_range') THEN
    ALTER TABLE public.fuel_settings ADD CONSTRAINT check_fuel_settings_tank_capacity_range CHECK (tank_capacity > 0 AND tank_capacity <= 200);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_fuel_settings_tank_level_range') THEN
    ALTER TABLE public.fuel_settings ADD CONSTRAINT check_fuel_settings_tank_level_range CHECK (current_tank_level BETWEEN 0 AND 100);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_fuel_settings_odometer_range') THEN
    ALTER TABLE public.fuel_settings ADD CONSTRAINT check_fuel_settings_odometer_range CHECK (current_odometer >= 0 AND current_odometer <= 9999999);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_fuel_settings_string_lengths') THEN
    ALTER TABLE public.fuel_settings ADD CONSTRAINT check_fuel_settings_string_lengths CHECK (
      (motor_name IS NULL OR length(motor_name) <= 100) AND
      (motor_type IS NULL OR length(motor_type) <= 100)
    );
  END IF;
END $$;
