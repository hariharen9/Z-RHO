-- ============================================================
-- ZRHO Migration 006: Credit Card Bills Table
-- ============================================================

-- Bill status enum
CREATE TYPE public.bill_status AS ENUM (
  'upcoming', 'generated', 'paid', 'overdue', 'partially_paid'
);

-- CC Bills table
CREATE TABLE public.cc_bills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id UUID NOT NULL REFERENCES public.credit_cards(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  billing_month DATE NOT NULL,
  statement_date DATE NOT NULL,
  due_date DATE NOT NULL,
  opening_balance NUMERIC(15,2) NOT NULL DEFAULT 0,
  total_spends NUMERIC(15,2) NOT NULL DEFAULT 0,
  total_credits NUMERIC(15,2) NOT NULL DEFAULT 0,
  statement_amount NUMERIC(15,2) NOT NULL DEFAULT 0,
  minimum_due NUMERIC(15,2) NOT NULL DEFAULT 0,
  paid_amount NUMERIC(15,2),
  paid_date DATE,
  status public.bill_status NOT NULL DEFAULT 'upcoming',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_cc_bills_card_id ON public.cc_bills(card_id);
CREATE INDEX idx_cc_bills_user_id ON public.cc_bills(user_id);
CREATE INDEX idx_cc_bills_billing_month ON public.cc_bills(billing_month);
CREATE INDEX idx_cc_bills_status ON public.cc_bills(status);

-- Unique constraint: one bill per card per billing month
ALTER TABLE public.cc_bills
  ADD CONSTRAINT uq_cc_bills_card_month UNIQUE (card_id, billing_month);

-- Enable RLS
ALTER TABLE public.cc_bills ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own bills"
  ON public.cc_bills FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own bills"
  ON public.cc_bills FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own bills"
  ON public.cc_bills FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own bills"
  ON public.cc_bills FOR DELETE
  USING (auth.uid() = user_id);

-- Updated_at trigger
CREATE TRIGGER update_cc_bills_updated_at
  BEFORE UPDATE ON public.cc_bills
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
