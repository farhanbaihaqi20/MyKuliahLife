-- =========================================================================
-- MIGRATION: Add transaction_id & account_name to fuel_logs
-- MyKuliahLife Student Financial OS
-- =========================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'fuel_logs' AND column_name = 'transaction_id'
  ) THEN
    ALTER TABLE public.fuel_logs 
      ADD COLUMN transaction_id UUID REFERENCES public.transactions(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'fuel_logs' AND column_name = 'account_name'
  ) THEN
    ALTER TABLE public.fuel_logs 
      ADD COLUMN account_name TEXT;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_fuel_logs_transaction_id ON public.fuel_logs(transaction_id);
