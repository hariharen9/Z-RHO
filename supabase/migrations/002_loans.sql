-- ============================================================
-- ZRHO Migration 002: Loans Table
-- ============================================================

-- Loan type enum
CREATE TYPE public.loan_type AS ENUM (
  'home', 'personal', 'car', 'education', 'business', 'other'
);

-- Loan status enum
CREATE TYPE public.loan_status AS ENUM (
  'active', 'closed', 'paused'
);

-- Loans table
CREATE TABLE public.loans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  lender TEXT NOT NULL,
  loan_type public.loan_type NOT NULL DEFAULT 'personal',
  currency TEXT NOT NULL DEFAULT 'INR',
  principal_amount NUMERIC(15,2) NOT NULL,
  current_outstanding NUMERIC(15,2) NOT NULL,
  interest_rate NUMERIC(6,4) NOT NULL,
  tenure_months INTEGER NOT NULL,
  emi_amount NUMERIC(15,2) NOT NULL,
  emi_day INTEGER NOT NULL CHECK (emi_day BETWEEN 1 AND 31),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  total_interest_payable NUMERIC(15,2) NOT NULL,
  total_amount_payable NUMERIC(15,2) NOT NULL,
  notes TEXT,
  status public.loan_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_loans_user_id ON public.loans(user_id);
CREATE INDEX idx_loans_status ON public.loans(status);
CREATE INDEX idx_loans_user_status ON public.loans(user_id, status);

-- Enable RLS
ALTER TABLE public.loans ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own loans"
  ON public.loans FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own loans"
  ON public.loans FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own loans"
  ON public.loans FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own loans"
  ON public.loans FOR DELETE
  USING (auth.uid() = user_id);

-- Updated_at trigger
CREATE TRIGGER update_loans_updated_at
  BEFORE UPDATE ON public.loans
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
