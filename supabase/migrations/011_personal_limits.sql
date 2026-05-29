-- ============================================================
-- ZRHO Migration 011: Personal Spending Limits
-- ============================================================

ALTER TABLE public.credit_cards 
ADD COLUMN personal_limit NUMERIC;
