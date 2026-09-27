-- =========================================================================
-- SUPABASE FRESH MIGRATION: MyKuliahLife
-- Student Financial & Academic Life OS
-- =========================================================================
-- Hapus seluruh skema dan tabel database lama, lalu inisialisasi tabel baru yang
-- bersih, modular, teroptimasi, dan terlindungi penuh dengan Row Level Security (RLS).
-- =========================================================================

-- 0. TEARDOWN LENGKAP: Hapus semua tabel lama (CASCADE)
DROP TABLE IF EXISTS public.savings_history CASCADE;
DROP TABLE IF EXISTS public.savings_targets CASCADE;
DROP TABLE IF EXISTS public.bills CASCADE;
DROP TABLE IF EXISTS public.budgets CASCADE;
DROP TABLE IF EXISTS public.transactions CASCADE;
DROP TABLE IF EXISTS public.accounts CASCADE;
DROP TABLE IF EXISTS public.attendance CASCADE;
DROP TABLE IF EXISTS public.course_notes CASCADE;
DROP TABLE IF EXISTS public.assignments CASCADE;
DROP TABLE IF EXISTS public.grades CASCADE;
DROP TABLE IF EXISTS public.courses CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- Aktifkan ekstensi UUID generator
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =========================================================================
-- 1. PROFILES (Profil Mahasiswa & Pengaturan Keuangan/Semester Global)
-- =========================================================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT 'Mahasiswa',
  university TEXT DEFAULT 'Universitas',
  major TEXT DEFAULT 'Program Studi',
  active_semester INT NOT NULL DEFAULT 1,
  unlocked_semesters JSONB NOT NULL DEFAULT '[1]'::jsonb,
  target_gpa NUMERIC(3, 2) DEFAULT 3.80,
  start_day_of_month INT NOT NULL DEFAULT 1,
  monthly_budget NUMERIC(15, 2) NOT NULL DEFAULT 1500000,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =========================================================================
-- 2. ACCOUNTS (Dompet & Rekening Keuangan)
-- =========================================================================
CREATE TABLE public.accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'bank' CHECK (type IN ('bank', 'ewallet', 'cash', 'investment')),
  balance NUMERIC(15, 2) NOT NULL DEFAULT 0,
  icon TEXT DEFAULT '💳',
  color TEXT DEFAULT '#1665D8',
  is_primary BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =========================================================================
-- 3. TRANSACTIONS (Riwayat Transaksi Pengeluaran, Pemasukan, & Transfer)
-- =========================================================================
CREATE TABLE public.transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
  account_name TEXT,
  type TEXT NOT NULL CHECK (type IN ('expense', 'income', 'transfer')),
  amount NUMERIC(15, 2) NOT NULL,
  category TEXT NOT NULL,
  merchant TEXT,
  note TEXT,
  icon TEXT DEFAULT '💸',
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =========================================================================
-- 4. COURSES (Mata Kuliah Akademik per Semester & Rekap Nilai)
-- =========================================================================
CREATE TABLE public.courses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  semester INT NOT NULL DEFAULT 1,
  code TEXT DEFAULT 'MK',
  name TEXT NOT NULL,
  sks INT NOT NULL DEFAULT 3,
  lecturer TEXT DEFAULT 'Dosen Pengampu',
  room TEXT DEFAULT 'Ruang Kuliah',
  day_of_week TEXT NOT NULL DEFAULT 'Senin',
  start_time TEXT NOT NULL DEFAULT '08:00',
  end_time TEXT NOT NULL DEFAULT '10:30',
  color TEXT DEFAULT '#1665D8',
  grade_letter TEXT DEFAULT 'E',
  grade_point NUMERIC(3, 2) DEFAULT 0.0,
  is_graded BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =========================================================================
-- 5. ASSIGNMENTS (Daftar & Pengingat Tugas Kuliah)
-- =========================================================================
CREATE TABLE public.assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
  course_name TEXT,
  semester INT NOT NULL DEFAULT 1,
  title TEXT NOT NULL,
  description TEXT,
  deadline TIMESTAMPTZ NOT NULL,
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =========================================================================
-- 6. COURSE NOTES (Catatan Materi & Kuliah per Pertemuan)
-- =========================================================================
CREATE TABLE public.course_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
  course_name TEXT,
  semester INT NOT NULL DEFAULT 1,
  week_number INT NOT NULL DEFAULT 1,
  topic TEXT NOT NULL,
  content TEXT,
  material_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =========================================================================
-- 7. ATTENDANCE (Presensi 16 Pertemuan per Mata Kuliah)
-- =========================================================================
CREATE TABLE public.attendance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  meeting_number INT NOT NULL CHECK (meeting_number BETWEEN 1 AND 16),
  status TEXT NOT NULL DEFAULT 'present' CHECK (status IN ('present', 'permission', 'sick', 'absent', 'unrecorded')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, course_id, meeting_number)
);

-- =========================================================================
-- 8. BILLS (Pencatatan Tagihan Rutin Mahasiswa)
-- =========================================================================
CREATE TABLE public.bills (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  amount NUMERIC(15, 2) NOT NULL,
  due_date TEXT NOT NULL,
  category TEXT DEFAULT 'Kost & Rumah',
  is_paid BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =========================================================================
-- 9. SAVINGS TARGETS (Target Celengan & Rencana Tabungan)
-- =========================================================================
CREATE TABLE public.savings_targets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  target_amount NUMERIC(15, 2) NOT NULL,
  current_amount NUMERIC(15, 2) NOT NULL DEFAULT 0,
  deadline DATE,
  category TEXT DEFAULT 'Pendidikan',
  icon TEXT DEFAULT '🎯',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =========================================================================
-- 10. ROW LEVEL SECURITY (RLS) & AUTOMATIC SECURITY POLICIES
-- =========================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.savings_targets ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE
  tbl TEXT;
  tbls TEXT[] := ARRAY[
    'profiles', 'accounts', 'transactions', 'courses', 'assignments',
    'course_notes', 'attendance', 'bills', 'savings_targets'
  ];
BEGIN
  FOREACH tbl IN ARRAY tbls LOOP
    EXECUTE format('DROP POLICY IF EXISTS "Users manage own %I" ON public.%I', tbl, tbl);
    IF tbl = 'profiles' THEN
      EXECUTE format('CREATE POLICY "Users manage own %I" ON public.%I FOR ALL USING (auth.uid() = id) WITH CHECK (auth.uid() = id)', tbl, tbl);
    ELSE
      EXECUTE format('CREATE POLICY "Users manage own %I" ON public.%I FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id)', tbl, tbl);
    END IF;
  END LOOP;
END $$;

-- =========================================================================
-- 11. INDEXES UNTUK KECEPATAN & EFISIENSI KUERI
-- =========================================================================
CREATE INDEX IF NOT EXISTS idx_accounts_user ON public.accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_date ON public.transactions(user_id, date);
CREATE INDEX IF NOT EXISTS idx_courses_user_semester ON public.courses(user_id, semester);
CREATE INDEX IF NOT EXISTS idx_assignments_user_semester ON public.assignments(user_id, semester);
CREATE INDEX IF NOT EXISTS idx_course_notes_user_semester ON public.course_notes(user_id, semester);
CREATE INDEX IF NOT EXISTS idx_attendance_user_course ON public.attendance(user_id, course_id);
