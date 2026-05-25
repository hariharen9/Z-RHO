-- ============================================================
-- ZRHO Migration 004: Credit Cards Table
-- ============================================================

-- Card network enum
CREATE TYPE public.card_network AS ENUM (
  'visa', 'mastercard', 'amex', 'rupay', 'other'
);

-- Card status enum
CREATE TYPE public.card_status AS ENUM (
  'active', 'closed'
);

-- Credit cards table
CREATE TABLE public.credit_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  bank TEXT NOT NULL,
  last_four CHAR(4) NOT NULL,
  card_network public.card_network NOT NULL DEFAULT 'visa',
  currency TEXT NOT NULL DEFAULT 'INR',
  credit_limit NUMERIC(15,2) NOT NULL,
  statement_day INTEGER NOT NULL CHECK (statement_day BETWEEN 1 AND 28),
  due_day INTEGER NOT NULL CHECK (due_day BETWEEN 1 AND 28),
  color TEXT NOT NULL DEFAULT '#6366f1',
  notes TEXT,
  status public.card_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_credit_cards_user_id ON public.credit_cards(user_id);
CREATE INDEX idx_credit_cards_status ON public.credit_cards(status);

-- Enable RLS
ALTER TABLE public.credit_cards ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own cards"
  ON public.credit_cards FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own cards"
  ON public.credit_cards FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own cards"
  ON public.credit_cards FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own cards"
  ON public.credit_cards FOR DELETE
  USING (auth.uid() = user_id);

-- Updated_at trigger
CREATE TRIGGER update_credit_cards_updated_at
  BEFORE UPDATE ON public.credit_cards
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
