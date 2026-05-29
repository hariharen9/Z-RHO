-- ============================================================
-- ZRHO Migration 009: Linked Loans
-- ============================================================

-- Add linked_card_id to loans table to support CC EMIs
ALTER TABLE public.loans 
ADD COLUMN linked_card_id UUID REFERENCES public.credit_cards(id) ON DELETE SET NULL;

-- Index for performance when calculating available limit per card
CREATE INDEX idx_loans_linked_card_id ON public.loans(linked_card_id);
