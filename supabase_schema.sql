-- =========================================================================
-- SUPABASE DATABASE SCHEMA: MyUang & EduTrack
-- Student Budget Manager & Academic Life OS
-- =========================================================================
-- Jalankan skrip ini di: Supabase Dashboard -> Project -> SQL Editor -> New Query
-- Skrip ini akan membuat tabel, relasi, dan kebijakan Row Level Security (RLS)
-- =========================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILES (Profil Mahasiswa)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  university TEXT DEFAULT 'Universitas Indonesia',
  major TEXT DEFAULT 'Teknik Informatika',
  current_semester INT DEFAULT 5,
  target_gpa NUMERIC(3, 2) DEFAULT 3.80,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. ACCOUNTS / DOMPET (Bank, E-Wallet, Cash)
CREATE TABLE IF NOT EXISTS public.accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('bank', 'ewallet', 'cash', 'investment')),
  balance NUMERIC(15, 2) DEFAULT 0,
  is_primary BOOLEAN DEFAULT FALSE,
  icon TEXT DEFAULT 'wallet',
  color TEXT DEFAULT '#1665D8',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. TRANSACTIONS (Pencatatan Keuangan)
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
  to_account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('expense', 'income', 'transfer')),
  amount NUMERIC(15, 2) NOT NULL,
  category TEXT NOT NULL,
  merchant TEXT,
  note TEXT,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. BUDGETS (Alokasi Anggaran Bulanan)
CREATE TABLE IF NOT EXISTS public.budgets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  period_label TEXT NOT NULL, -- e.g. "Sep 2026"
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  total_budget NUMERIC(15, 2) NOT NULL DEFAULT 0,
  category_budgets JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. BILLS (Tagihan Kost, UKT, Langganan)
CREATE TABLE IF NOT EXISTS public.bills (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  amount NUMERIC(15, 2) NOT NULL,
  due_date DATE NOT NULL,
  category TEXT DEFAULT 'Kost & Rumah',
  recurrence TEXT DEFAULT 'monthly' CHECK (recurrence IN ('once', 'monthly', 'semester')),
  is_paid BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. SAVINGS TARGETS (Target Tabungan / Wishlist Mahasiswa)
CREATE TABLE IF NOT EXISTS public.savings_targets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  target_amount NUMERIC(15, 2) NOT NULL,
  current_amount NUMERIC(15, 2) DEFAULT 0,
  deadline DATE,
  category TEXT DEFAULT 'Pendidikan',
  icon TEXT DEFAULT 'graduation-cap',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. SAVINGS HISTORY (Riwayat Setoran Tabungan)
CREATE TABLE IF NOT EXISTS public.savings_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  target_id UUID NOT NULL REFERENCES public.savings_targets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount NUMERIC(15, 2) NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. COURSES (Mata Kuliah)
CREATE TABLE IF NOT EXISTS public.courses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code TEXT,
  name TEXT NOT NULL,
  sks INT NOT NULL DEFAULT 3,
  lecturer TEXT,
  room TEXT,
  semester INT NOT NULL DEFAULT 5,
  day_of_week TEXT NOT NULL, -- 'Senin', 'Selasa', dll.
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  color TEXT DEFAULT '#1665D8',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. ASSIGNMENTS (Daftar & Pengingat Tugas Kuliah)
CREATE TABLE IF NOT EXISTS public.assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  deadline TIMESTAMPTZ NOT NULL,
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. COURSE NOTES (Catatan Perkuliahan / Materi)
CREATE TABLE IF NOT EXISTS public.course_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
  week_number INT DEFAULT 1,
  topic TEXT NOT NULL,
  content TEXT,
  material_url TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. ATTENDANCE (Catatan Presensi Mata Kuliah)
CREATE TABLE IF NOT EXISTS public.attendance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  meeting_number INT NOT NULL,
  date DATE DEFAULT CURRENT_DATE,
  status TEXT NOT NULL CHECK (status IN ('present', 'permission', 'sick', 'absent')),
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. GRADES (Rekap Nilai IPS & IPK)
CREATE TABLE IF NOT EXISTS public.grades (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  semester INT NOT NULL,
  course_name TEXT NOT NULL,
  sks INT NOT NULL DEFAULT 3,
  letter_grade TEXT NOT NULL, -- 'A', 'A-', 'B+', 'B', dll
  grade_point NUMERIC(3, 2) NOT NULL, -- 4.00, 3.75, 3.50, dll
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Setiap user hanya bisa membaca dan mengubah datanya sendiri
-- =========================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.savings_targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.savings_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grades ENABLE ROW LEVEL SECURITY;

-- Helper macro function for RLS
DO $$
DECLARE
  tbl TEXT;
  tbls TEXT[] := ARRAY[
    'profiles', 'accounts', 'transactions', 'budgets', 'bills',
    'savings_targets', 'savings_history', 'courses', 'assignments',
    'course_notes', 'attendance', 'grades'
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
