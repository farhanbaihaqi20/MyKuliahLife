-- =========================================================================
-- MIGRATION: Utang & Piutang (Debts & Receivables) Table
-- MyKuliahLife Student Financial OS
-- =========================================================================

CREATE TABLE IF NOT EXISTS public.debts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('receivable', 'payable')),
  affects_balance BOOLEAN NOT NULL DEFAULT true,
  person_name TEXT NOT NULL,
  person_avatar TEXT DEFAULT '🧑',
  description TEXT DEFAULT '',
  total_amount NUMERIC(15, 2) NOT NULL,
  remaining_amount NUMERIC(15, 2) NOT NULL,
  account_name TEXT,
  created_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'settled')),
  settled_date DATE,
  payments JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Row Level Security (RLS)
ALTER TABLE public.debts ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  DROP POLICY IF EXISTS "Users manage own debts" ON public.debts;
  CREATE POLICY "Users manage own debts" ON public.debts
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_debts_user_id ON public.debts(user_id);
CREATE INDEX IF NOT EXISTS idx_debts_status ON public.debts(user_id, status);
CREATE INDEX IF NOT EXISTS idx_debts_type ON public.debts(user_id, type);
CREATE INDEX IF NOT EXISTS idx_debts_created_date ON public.debts(user_id, created_date);
