-- =========================================================================
-- MIGRATION: Add debt_id and support debt types in transactions
-- MyKuliahLife Student Financial OS
-- =========================================================================

DO $$
BEGIN
  -- 1. Drop existing type check constraint and update with debt_out & debt_in
  ALTER TABLE public.transactions DROP CONSTRAINT IF EXISTS transactions_type_check;
  
  ALTER TABLE public.transactions 
    ADD CONSTRAINT transactions_type_check 
    CHECK (type IN ('expense', 'income', 'transfer', 'debt_out', 'debt_in'));

  -- 2. Add debt_id foreign key column to link transactions directly to debts
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'transactions' AND column_name = 'debt_id'
  ) THEN
    ALTER TABLE public.transactions 
      ADD COLUMN debt_id UUID REFERENCES public.debts(id) ON DELETE CASCADE;
  END IF;
END $$;

-- 3. Create index for fast lookups and deletion cascading
CREATE INDEX IF NOT EXISTS idx_transactions_debt_id ON public.transactions(debt_id);
