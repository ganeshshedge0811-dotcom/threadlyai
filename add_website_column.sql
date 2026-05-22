-- Migration: Add website_url column to user_settings
-- Run this in your Supabase SQL editor (Dashboard → SQL Editor → New Query)

ALTER TABLE public.user_settings ADD COLUMN IF NOT EXISTS website_url VARCHAR(255);

-- Verify it worked:
-- SELECT column_name FROM information_schema.columns WHERE table_name = 'user_settings';
