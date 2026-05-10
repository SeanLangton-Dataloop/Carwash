-- ============================================================
-- Migration: Add pay_type and monthly_salary columns to staff
-- ============================================================

ALTER TABLE public.staff
  ADD COLUMN IF NOT EXISTS pay_type TEXT NOT NULL DEFAULT 'daily_rate'
    CHECK (pay_type IN ('daily_rate', 'monthly_salary'));

ALTER TABLE public.staff
  ADD COLUMN IF NOT EXISTS monthly_salary NUMERIC(10,2);

-- daily_rate is only relevant when pay_type = 'daily_rate'
-- monthly_salary is only relevant when pay_type = 'monthly_salary'
-- All existing staff default to 'daily_rate' (preserves existing behaviour)
