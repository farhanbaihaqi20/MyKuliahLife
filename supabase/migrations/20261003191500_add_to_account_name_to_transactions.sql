-- =========================================================================
-- MIGRATION: Add to_account_name column for inter-account transfers
-- MyKuliahLife Student Financial OS
-- =========================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'transactions' AND column_name = 'to_account_name'
  ) THEN
    ALTER TABLE public.transactions 
      ADD COLUMN to_account_name TEXT;
  END IF;
END $$;

-- Create index for fast account transaction filtering and balance tracking
CREATE INDEX IF NOT EXISTS idx_transactions_to_account_name ON public.transactions(to_account_name);
