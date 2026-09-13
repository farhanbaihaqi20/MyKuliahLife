-- Migration: Tambah kolom account_number dan notes ke tabel accounts
-- Supabase Migration: 20260913074000_add_account_details.sql

ALTER TABLE public.accounts 
ADD COLUMN IF NOT EXISTS account_number TEXT,
ADD COLUMN IF NOT EXISTS notes TEXT;
