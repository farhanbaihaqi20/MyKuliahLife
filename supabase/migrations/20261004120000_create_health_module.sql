-- =========================================================================
-- MIGRATION: Modul SehatKu (Kesehatan) — Riwayat Dokter & Pengingat Obat
-- MyKuliahLife Student Financial OS
-- =========================================================================

-- -------------------------------------------------------------------------
-- 1. TABEL RIWAYAT KUNJUNGAN DOKTER
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.doctor_visits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  visit_date DATE NOT NULL DEFAULT CURRENT_DATE,
  doctor_name TEXT DEFAULT '',
  facility_name TEXT DEFAULT '',
  specialty TEXT DEFAULT '',
  diagnosis TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  cost NUMERIC(15, 2) NOT NULL DEFAULT 0,
  account_name TEXT,
  transaction_id UUID,
  next_visit_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Row Level Security (RLS)
ALTER TABLE public.doctor_visits ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  DROP POLICY IF EXISTS "Users manage own doctor visits" ON public.doctor_visits;
  CREATE POLICY "Users manage own doctor visits" ON public.doctor_visits
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_doctor_visits_user_id ON public.doctor_visits(user_id);
CREATE INDEX IF NOT EXISTS idx_doctor_visits_visit_date ON public.doctor_visits(user_id, visit_date);
CREATE INDEX IF NOT EXISTS idx_doctor_visits_next_visit ON public.doctor_visits(user_id, next_visit_date);

-- -------------------------------------------------------------------------
-- 2. TABEL OBAT & JADWAL MINUM
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.medications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  dosage TEXT DEFAULT '',
  form TEXT DEFAULT 'tablet' CHECK (form IN ('tablet', 'kapsul', 'sirup', 'salep', 'injeksi', 'lainnya')),
  instructions TEXT DEFAULT '',
  schedule_times JSONB NOT NULL DEFAULT '[]'::jsonb,
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE,
  stock_remaining INT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'stopped')),
  dose_logs JSONB NOT NULL DEFAULT '[]'::jsonb,
  doctor_visit_id UUID REFERENCES public.doctor_visits(id) ON DELETE SET NULL,
  cost NUMERIC(15, 2) NOT NULL DEFAULT 0,
  account_name TEXT,
  transaction_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Row Level Security (RLS)
ALTER TABLE public.medications ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  DROP POLICY IF EXISTS "Users manage own medications" ON public.medications;
  CREATE POLICY "Users manage own medications" ON public.medications
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_medications_user_id ON public.medications(user_id);
CREATE INDEX IF NOT EXISTS idx_medications_status ON public.medications(user_id, status);
CREATE INDEX IF NOT EXISTS idx_medications_start_date ON public.medications(user_id, start_date);
