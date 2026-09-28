-- =========================================================================
-- MIGRATION: Ultimate Security Hardening & Zero-Trust Data Integrity (v4.0)
-- 1. Tutup Celah User Enumeration di Supabase Storage (SELECT Policy)
-- 2. Trigger Immutabilitas Ownership (Cegah modifikasi user_id & profile id)
-- 3. Check Constraints Lengkap pada Semua Kolom yang Belum Tervalidasi
-- 4. Perlindungan Search Path Hijacking (CWE-426) & Revoke Create on Public
-- =========================================================================

-- 1. TUTUP CELAH USER ENUMERATION DI SUPABASE STORAGE
-- Kebijakan lama memperbolehkan SELECT public pada bucket 'avatars',
-- sehingga penyerang bisa menjalankan .list() untuk memanen seluruh UUID pengguna.
DROP POLICY IF EXISTS "Public avatars access" ON storage.objects;
DROP POLICY IF EXISTS "Users can only read their own avatar" ON storage.objects;

CREATE POLICY "Users can only read their own avatar"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'avatars' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 2. PERLINDUNGAN SEARCH PATH & FUNGSI IMMUTABILITAS OWNERSHIP
-- Mencegah penyerang mengubah relasi user_id pada record melalui REST API (Burp Suite/Postman)

CREATE OR REPLACE FUNCTION public.prevent_user_id_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NEW.user_id <> OLD.user_id THEN
    RAISE EXCEPTION 'Pelanggaran Keamanan: Kolom user_id bersifat permanen (immutable) dan tidak dapat dimanipulasi.';
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.prevent_profile_id_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NEW.id <> OLD.id THEN
    RAISE EXCEPTION 'Pelanggaran Keamanan: Kolom id profil bersifat permanen (immutable) dan tidak dapat dimanipulasi.';
  END IF;
  RETURN NEW;
END;
$$;

-- Pasang Trigger Immutabilitas pada Seluruh Tabel
DO $$
DECLARE
  tbl TEXT;
  tbls TEXT[] := ARRAY[
    'accounts', 'transactions', 'courses', 'assignments',
    'course_notes', 'attendance', 'bills', 'savings_targets',
    'fuel_logs', 'fuel_settings'
  ];
BEGIN
  -- Profiles id immutability
  DROP TRIGGER IF EXISTS trg_prevent_profile_id_change ON public.profiles;
  CREATE TRIGGER trg_prevent_profile_id_change
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.prevent_profile_id_change();

  -- Other tables user_id immutability
  FOREACH tbl IN ARRAY tbls LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS trg_prevent_%I_user_id_change ON public.%I', tbl, tbl);
    EXECUTE format('CREATE TRIGGER trg_prevent_%I_user_id_change BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.prevent_user_id_change()', tbl, tbl);
  END LOOP;
END $$;

-- 3. CHECK CONSTRAINTS LENGKAP (ANTI XSS, ANTI FORMAT INJECTION, ANTI STORAGE DOS)

-- 3.1 Course Notes Table: Validasi URL Materi & Panjang Judul
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_course_notes_material_url_safe') THEN
    ALTER TABLE public.course_notes ADD CONSTRAINT check_course_notes_material_url_safe CHECK (
      material_url IS NULL OR (
        length(material_url) <= 1000 
        AND material_url ~* '^https?://'
      )
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_course_notes_course_name_len') THEN
    ALTER TABLE public.course_notes ADD CONSTRAINT check_course_notes_course_name_len CHECK (
      course_name IS NULL OR length(course_name) <= 200
    );
  END IF;
END $$;

-- 3.2 Courses Table: Format Waktu, Hari, Nilai Huruf, dan Warna
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_course_grade_letter_len') THEN
    ALTER TABLE public.courses ADD CONSTRAINT check_course_grade_letter_len CHECK (
      grade_letter IS NULL OR length(grade_letter) <= 10
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_course_day_of_week_valid') THEN
    ALTER TABLE public.courses ADD CONSTRAINT check_course_day_of_week_valid CHECK (
      day_of_week IN ('Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu')
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_course_start_time_format') THEN
    ALTER TABLE public.courses ADD CONSTRAINT check_course_start_time_format CHECK (
      start_time ~ '^[0-2][0-9]:[0-5][0-9]$'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_course_end_time_format') THEN
    ALTER TABLE public.courses ADD CONSTRAINT check_course_end_time_format CHECK (
      end_time ~ '^[0-2][0-9]:[0-5][0-9]$'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_course_color_format') THEN
    ALTER TABLE public.courses ADD CONSTRAINT check_course_color_format CHECK (
      color IS NULL OR (length(color) <= 35 AND color ~* '^#[0-9a-fA-F]{3,8}$|^rgba?\([0-9,\. ]+\)$|^hsla?\([0-9%,\. ]+\)$')
    );
  END IF;
END $$;

-- 3.3 Accounts Table: Validasi Format Warna & Panjang Icon
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_account_color_format') THEN
    ALTER TABLE public.accounts ADD CONSTRAINT check_account_color_format CHECK (
      color IS NULL OR (length(color) <= 35 AND color ~* '^#[0-9a-fA-F]{3,8}$|^rgba?\([0-9,\. ]+\)$|^hsla?\([0-9%,\. ]+\)$')
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_account_icon_len') THEN
    ALTER TABLE public.accounts ADD CONSTRAINT check_account_icon_len CHECK (
      icon IS NULL OR length(icon) <= 20
    );
  END IF;
END $$;

-- 3.4 Transactions Table: Tanggal Valid & Panjang Field Tambahan
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_transaction_date_range') THEN
    ALTER TABLE public.transactions ADD CONSTRAINT check_transaction_date_range CHECK (
      date BETWEEN '2000-01-01' AND '2100-12-31'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_transaction_account_name_len') THEN
    ALTER TABLE public.transactions ADD CONSTRAINT check_transaction_account_name_len CHECK (
      account_name IS NULL OR length(account_name) <= 100
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_transaction_icon_len') THEN
    ALTER TABLE public.transactions ADD CONSTRAINT check_transaction_icon_len CHECK (
      icon IS NULL OR length(icon) <= 20
    );
  END IF;
END $$;

-- 3.5 Bills Table: Batasan Jatuh Tempo
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_bill_due_date_len') THEN
    ALTER TABLE public.bills ADD CONSTRAINT check_bill_due_date_len CHECK (
      length(due_date) <= 50
    );
  END IF;
END $$;

-- 3.6 Savings Targets Table: Batasan Tanggal & Icon
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_savings_deadline_range') THEN
    ALTER TABLE public.savings_targets ADD CONSTRAINT check_savings_deadline_range CHECK (
      deadline IS NULL OR deadline BETWEEN '2000-01-01' AND '2100-12-31'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_savings_icon_len') THEN
    ALTER TABLE public.savings_targets ADD CONSTRAINT check_savings_icon_len CHECK (
      icon IS NULL OR length(icon) <= 20
    );
  END IF;
END $$;

-- 3.7 Fuel Logs & Settings Tables
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_fuel_log_date_range') THEN
    ALTER TABLE public.fuel_logs ADD CONSTRAINT check_fuel_log_date_range CHECK (
      date BETWEEN '2000-01-01' AND '2100-12-31'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_fuel_log_odometer_range') THEN
    ALTER TABLE public.fuel_logs ADD CONSTRAINT check_fuel_log_odometer_range CHECK (
      odometer IS NULL OR (odometer >= 0 AND odometer <= 9999999)
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_fuel_log_tank_level_range') THEN
    ALTER TABLE public.fuel_logs ADD CONSTRAINT check_fuel_log_tank_level_range CHECK (
      tank_level IS NULL OR (tank_level >= 0 AND tank_level <= 100)
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_fuel_settings_province_slug_len') THEN
    ALTER TABLE public.fuel_settings ADD CONSTRAINT check_fuel_settings_province_slug_len CHECK (
      province_slug IS NULL OR length(province_slug) <= 100
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_fuel_settings_province_name_len') THEN
    ALTER TABLE public.fuel_settings ADD CONSTRAINT check_fuel_settings_province_name_len CHECK (
      province_name IS NULL OR length(province_name) <= 150
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_fuel_settings_prices_size') THEN
    ALTER TABLE public.fuel_settings ADD CONSTRAINT check_fuel_settings_prices_size CHECK (
      pg_column_size(fuel_prices) <= 5000
    );
  END IF;
END $$;

-- 3.8 Anti-JSON Bloat DoS pada Profiles Table
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_profile_unlocked_semesters_size') THEN
    ALTER TABLE public.profiles ADD CONSTRAINT check_profile_unlocked_semesters_size CHECK (
      pg_column_size(unlocked_semesters) <= 10000
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_profile_budget_categories_size') THEN
    ALTER TABLE public.profiles ADD CONSTRAINT check_profile_budget_categories_size CHECK (
      budget_categories IS NULL OR pg_column_size(budget_categories) <= 65536
    );
  END IF;
END $$;

-- 4. REVOKE CREATE ON SCHEMA PUBLIC FROM PUBLIC
-- Mencegah entitas anon/publik membuat relasi atau fungsi pada skema public
REVOKE CREATE ON SCHEMA public FROM PUBLIC;
