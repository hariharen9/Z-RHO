// ============================================================
// ZRHO — Database Types (hand-written to match Supabase schema)
// ============================================================

export type LoanType = 'home' | 'personal' | 'car' | 'education' | 'business' | 'other';
export type LoanStatus = 'active' | 'closed' | 'paused';
export type PrepaymentType = 'part_prepayment' | 'full_closure';
export type CardNetwork = 'visa' | 'mastercard' | 'amex' | 'rupay' | 'other';
export type CardStatus = 'active' | 'closed';
export type TransactionType = 'debit' | 'credit';
export type BillStatus = 'upcoming' | 'generated' | 'paid' | 'overdue' | 'partially_paid';

// ---- Row types (what you get back from SELECT) ----

export interface Profile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  default_currency: string;
  created_at: string;
  updated_at: string;
}

export interface Loan {
  id: string;
  user_id: string;
  name: string;
  lender: string;
  loan_type: LoanType;
  currency: string;
  principal_amount: number;
  current_outstanding: number;
  interest_rate: number;
  tenure_months: number;
  emi_amount: number;
  emi_day: number;
  start_date: string;
  end_date: string;
  total_interest_payable: number;
  total_amount_payable: number;
  notes: string | null;
  status: LoanStatus;
  created_at: string;
  updated_at: string;
}

export interface LoanPayment {
  id: string;
  loan_id: string;
  user_id: string;
  payment_date: string;
  emi_month: string;
  amount_paid: number;
  principal_component: number;
  interest_component: number;
  is_prepayment: boolean;
  prepayment_type: PrepaymentType | null;
  outstanding_after: number;
  notes: string | null;
  created_at: string;
}

export interface CreditCard {
  id: string;
  user_id: string;
  name: string;
  bank: string;
  last_four: string;
  card_network: CardNetwork;
  currency: string;
  credit_limit: number;
  statement_day: number;
  due_day: number;
  color: string;
  notes: string | null;
  status: CardStatus;
  created_at: string;
  updated_at: string;
}

export interface CCTransaction {
  id: string;
  card_id: string;
  user_id: string;
  amount: number;
  transaction_type: TransactionType;
  category: string;
  merchant: string | null;
  note: string | null;
  transaction_date: string;
  billing_month: string;
  created_at: string;
}

export interface CCBill {
  id: string;
  card_id: string;
  user_id: string;
  billing_month: string;
  statement_date: string;
  due_date: string;
  opening_balance: number;
  total_spends: number;
  total_credits: number;
  statement_amount: number;
  minimum_due: number;
  paid_amount: number | null;
  paid_date: string | null;
  status: BillStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// ---- Insert types (what you send for INSERT) ----

export type LoanInsert = Omit<Loan, 'id' | 'created_at' | 'updated_at'>;
export type LoanUpdate = Partial<Omit<Loan, 'id' | 'user_id' | 'created_at' | 'updated_at'>>;

export type LoanPaymentInsert = Omit<LoanPayment, 'id' | 'created_at'>;

export type CreditCardInsert = Omit<CreditCard, 'id' | 'created_at' | 'updated_at'>;
export type CreditCardUpdate = Partial<Omit<CreditCard, 'id' | 'user_id' | 'created_at' | 'updated_at'>>;

export type CCTransactionInsert = Omit<CCTransaction, 'id' | 'created_at'>;
export type CCTransactionUpdate = Partial<Omit<CCTransaction, 'id' | 'user_id' | 'card_id' | 'created_at'>>;

export type CCBillInsert = Omit<CCBill, 'id' | 'created_at' | 'updated_at'>;
export type CCBillUpdate = Partial<Omit<CCBill, 'id' | 'user_id' | 'card_id' | 'created_at' | 'updated_at'>>;
