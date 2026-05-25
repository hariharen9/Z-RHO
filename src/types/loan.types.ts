// ============================================================
// ZRHO — Loan-specific types
// ============================================================

/** A single row in the amortization schedule */
export interface AmortizationRow {
  month: number;
  date: string; // ISO date string (first of month)
  emiAmount: number;
  principalComponent: number;
  interestComponent: number;
  outstandingBalance: number;
  status: 'paid' | 'current' | 'upcoming';
  paidDate?: string; // actual date paid, if paid
}

/** Computed loan stats (derived from loan + payments) */
export interface LoanStats {
  percentPaid: number;
  emisPaid: number;
  emisRemaining: number;
  totalInterestPaid: number;
  totalInterestRemaining: number;
  projectedPayoffDate: string;
  interestSaved: number;
}

/** What the prepayment impact calculator returns */
export interface PrepaymentImpact {
  newOutstanding: number;
  newTenureMonths: number;
  originalRemainingInterest: number;
  newRemainingInterest: number;
  interestSaved: number;
  originalRemainingMonths: number;
  monthsSaved: number;
}
