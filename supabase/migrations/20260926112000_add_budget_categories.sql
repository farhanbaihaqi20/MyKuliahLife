-- =========================================================================
-- MIGRATION: Add budget_categories column to profiles
-- MyKuliahLife Student Financial OS
-- =========================================================================
-- Allows user-customized budget categories, custom allocations, and
-- categories like 'Kebutuhan Pribadi & Skincare' to be safely persisted
-- in Supabase without schema breaking changes.
-- =========================================================================

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS budget_categories JSONB;

COMMENT ON COLUMN public.profiles.budget_categories IS 'Custom budget categories array stored per user';
