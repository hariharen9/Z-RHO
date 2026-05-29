-- ============================================================
-- ZRHO Migration 010: Third Party Loans
-- ============================================================

ALTER TABLE public.loans 
ADD COLUMN is_third_party BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN third_party_name TEXT;

-- Index for filtering performance
CREATE INDEX idx_loans_is_third_party ON public.loans(is_third_party);
