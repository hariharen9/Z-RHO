-- ============================================================
-- ZRHO Migration 005: Credit Card Transactions Table
-- ============================================================

-- Transaction type enum
CREATE TYPE public.transaction_type AS ENUM (
  'debit', 'credit'
);

-- CC Transactions table
CREATE TABLE public.cc_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id UUID NOT NULL REFERENCES public.credit_cards(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount NUMERIC(15,2) NOT NULL CHECK (amount > 0),
  transaction_type public.transaction_type NOT NULL DEFAULT 'debit',
  category TEXT NOT NULL DEFAULT 'Other',
  merchant TEXT,
  note TEXT,
  transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
  billing_month DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_cc_transactions_card_id ON public.cc_transactions(card_id);
CREATE INDEX idx_cc_transactions_user_id ON public.cc_transactions(user_id);
CREATE INDEX idx_cc_transactions_billing_month ON public.cc_transactions(billing_month);
CREATE INDEX idx_cc_transactions_date ON public.cc_transactions(transaction_date);

-- Enable RLS
ALTER TABLE public.cc_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own transactions"
  ON public.cc_transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own transactions"
  ON public.cc_transactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own transactions"
  ON public.cc_transactions FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own transactions"
  ON public.cc_transactions FOR DELETE
  USING (auth.uid() = user_id);
