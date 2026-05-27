-- ============================================================
-- ZRHO Migration 003: Loan Payments Table
-- ============================================================

-- Prepayment type enum
CREATE TYPE public.prepayment_type AS ENUM (
  'part_prepayment', 'full_closure'
);

-- Loan payments table
CREATE TABLE public.loan_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  loan_id UUID NOT NULL REFERENCES public.loans(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  payment_date DATE NOT NULL,
  emi_month DATE NOT NULL,
  amount_paid NUMERIC(15,2) NOT NULL,
  principal_component NUMERIC(15,2) NOT NULL,
  interest_component NUMERIC(15,2) NOT NULL,
  is_prepayment BOOLEAN NOT NULL DEFAULT false,
  prepayment_type public.prepayment_type,
  outstanding_after NUMERIC(15,2) NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_loan_payments_loan_id ON public.loan_payments(loan_id);
CREATE INDEX idx_loan_payments_user_id ON public.loan_payments(user_id);
CREATE INDEX idx_loan_payments_emi_month ON public.loan_payments(emi_month);

-- Enable RLS
ALTER TABLE public.loan_payments ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own loan payments"
  ON public.loan_payments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own loan payments"
  ON public.loan_payments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own loan payments"
  ON public.loan_payments FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own loan payments"
  ON public.loan_payments FOR DELETE
  USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.update_loan_outstanding_on_payment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.loans
  SET current_outstanding = NEW.outstanding_after,
      status = CASE WHEN NEW.outstanding_after <= 0 THEN 'closed'::public.loan_status ELSE 'active'::public.loan_status END
  WHERE id = NEW.loan_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_loan_payment_insert
  AFTER INSERT ON public.loan_payments
  FOR EACH ROW EXECUTE FUNCTION public.update_loan_outstanding_on_payment();
