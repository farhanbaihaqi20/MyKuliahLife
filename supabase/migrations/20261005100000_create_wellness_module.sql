-- =========================================================================
-- MIGRATION: Modul SehatKu (Wellness) — Air Minum, Tidur, BMI, & Mood
-- MyKuliahLife Student Financial & Academic OS
-- =========================================================================

CREATE TABLE IF NOT EXISTS public.user_wellness (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  water_intake_target INT NOT NULL DEFAULT 2000,
  water_intake_logs JSONB NOT NULL DEFAULT '[]'::jsonb,
  sleep_logs JSONB NOT NULL DEFAULT '[]'::jsonb,
  bmi_logs JSONB NOT NULL DEFAULT '[]'::jsonb,
  mood_logs JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Row Level Security (RLS)
ALTER TABLE public.user_wellness ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  DROP POLICY IF EXISTS "Users manage own wellness data" ON public.user_wellness;
  CREATE POLICY "Users manage own wellness data" ON public.user_wellness
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_wellness_user_id ON public.user_wellness(user_id);
