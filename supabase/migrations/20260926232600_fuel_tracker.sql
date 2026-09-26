-- =========================================================================
-- MIGRATION: Fuel Tracker Tables (fuel_logs & fuel_settings)
-- MyKuliahLife Student Financial OS
-- =========================================================================

CREATE TABLE IF NOT EXISTS public.fuel_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  fuel_type TEXT NOT NULL CHECK (fuel_type IN ('pertalite', 'pertamax_90', 'pertamax_green', 'pertamax_turbo')),
  amount NUMERIC(15, 2) NOT NULL,
  liters NUMERIC(8, 3) NOT NULL,
  price_per_liter NUMERIC(10, 2) NOT NULL,
  station TEXT,
  odometer INT,
  tank_level NUMERIC(5, 2) DEFAULT 100,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.fuel_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  motor_name TEXT DEFAULT 'Motor Saya',
  motor_type TEXT DEFAULT 'Matic',
  tank_capacity NUMERIC(5, 2) DEFAULT 4.2,
  current_tank_level NUMERIC(5, 2) DEFAULT 50,
  current_odometer INT DEFAULT 0,
  province_slug TEXT DEFAULT 'jawa-timur',
  province_name TEXT DEFAULT 'Jawa Timur',
  last_price_sync TIMESTAMPTZ,
  fuel_prices JSONB NOT NULL DEFAULT '{
    "pertalite": 10000,
    "pertamax_90": 15950,
    "pertamax_green": 19150,
    "pertamax_turbo": 19600
  }'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Row Level Security (RLS)
ALTER TABLE public.fuel_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fuel_settings ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  DROP POLICY IF EXISTS "Users manage own fuel_logs" ON public.fuel_logs;
  CREATE POLICY "Users manage own fuel_logs" ON public.fuel_logs
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

  DROP POLICY IF EXISTS "Users manage own fuel_settings" ON public.fuel_settings;
  CREATE POLICY "Users manage own fuel_settings" ON public.fuel_settings
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_fuel_logs_user_date ON public.fuel_logs(user_id, date);
CREATE INDEX IF NOT EXISTS idx_fuel_settings_user ON public.fuel_settings(user_id);
