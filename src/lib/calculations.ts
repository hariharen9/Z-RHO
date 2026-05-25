// ============================================================
// ZRHO — THE MATH ENGINE
// All financial calculations: EMI, amortization, prepayment,
// utilization, billing cycles, due date logic
// ============================================================

import { addMonths, format, startOfMonth } from 'date-fns';
import type { Loan, LoanPayment } from '@/types/database.types';
import type { AmortizationRow, LoanStats, PrepaymentImpact } from '@/types/loan.types';

// ============================================================
// EMI CALCULATION (Standard Reducing Balance)
// EMI = P × r × (1 + r)^n / ((1 + r)^n - 1)
// ============================================================

/**
 * Calculate monthly EMI for a loan.
 * @param principal - Loan principal amount
 * @param annualRate - Annual interest rate in percentage (e.g. 8.5 for 8.5%)
 * @param tenureMonths - Total number of months
 * @returns Monthly EMI amount (rounded to 2 decimals)
 */
export function calculateEMI(
  principal: number,
  annualRate: number,
  tenureMonths: number
): number {
  if (principal <= 0 || tenureMonths <= 0) return 0;
  if (annualRate <= 0) return round2(principal / tenureMonths);

  const r = annualRate / 12 / 100; // monthly interest rate
  const n = tenureMonths;
  const powerTerm = Math.pow(1 + r, n);
  const emi = (principal * r * powerTerm) / (powerTerm - 1);
  return round2(emi);
}

// ============================================================
// AMORTIZATION SCHEDULE
// ============================================================

/**
 * Generate a full amortization schedule for a loan.
 * @param principal - Original principal
 * @param annualRate - Annual interest rate %
 * @param tenureMonths - Total tenure
 * @param emi - EMI amount (use calculateEMI if not overridden)
 * @param startDate - Loan start date (ISO string)
 * @param payments - Existing payments to mark rows as paid
 * @returns Array of AmortizationRow
 */
export function generateAmortizationSchedule(
  principal: number,
  annualRate: number,
  tenureMonths: number,
  emi: number,
  startDate: string,
  payments: LoanPayment[] = []
): AmortizationRow[] {
  const r = annualRate / 12 / 100;
  const schedule: AmortizationRow[] = [];
  let outstanding = principal;
  const start = new Date(startDate);
  const today = new Date();
  const currentMonth = format(startOfMonth(today), 'yyyy-MM-dd');

  // Build a set of paid emi_months for quick lookup
  const paidMonths = new Map<string, LoanPayment>();
  for (const p of payments) {
    if (!p.is_prepayment) {
      paidMonths.set(p.emi_month, p);
    }
  }

  for (let i = 0; i < tenureMonths; i++) {
    const monthDate = addMonths(start, i);
    const monthStr = format(startOfMonth(monthDate), 'yyyy-MM-dd');

    const interestComponent = round2(outstanding * r);
    let principalComponent = round2(emi - interestComponent);

    // Last month: adjust for rounding
    if (i === tenureMonths - 1) {
      principalComponent = round2(outstanding);
    }

    outstanding = round2(Math.max(0, outstanding - principalComponent));

    // Determine status
    const payment = paidMonths.get(monthStr);
    let status: AmortizationRow['status'] = 'upcoming';
    if (payment) {
      status = 'paid';
    } else if (monthStr === currentMonth) {
      status = 'current';
    } else if (monthDate < today) {
      // Past month but not paid — still show as current (overdue)
      status = 'current';
    }

    schedule.push({
      month: i + 1,
      date: monthStr,
      emiAmount: i === tenureMonths - 1 ? round2(interestComponent + principalComponent) : emi,
      principalComponent: payment ? payment.principal_component : principalComponent,
      interestComponent: payment ? payment.interest_component : interestComponent,
      outstandingBalance: payment ? payment.outstanding_after : outstanding,
      status,
      paidDate: payment?.payment_date,
    });

    // Use actual outstanding from payment if available
    if (payment) {
      outstanding = payment.outstanding_after;
    }
  }

  return schedule;
}

// ============================================================
// LOAN PROGRESS / STATS
// ============================================================

/**
 * Calculate comprehensive loan statistics from loan data + payments.
 */
export function calculateLoanStats(loan: Loan, payments: LoanPayment[]): LoanStats {
  const regularPayments = payments.filter((p) => !p.is_prepayment);
  const allPayments = payments;

  const emisPaid = regularPayments.length;
  const emisRemaining = Math.max(0, loan.tenure_months - emisPaid);

  const percentPaid = loan.principal_amount > 0
    ? round2(((loan.principal_amount - loan.current_outstanding) / loan.principal_amount) * 100)
    : 0;

  const totalInterestPaid = round2(
    allPayments.reduce((sum, p) => sum + p.interest_component, 0)
  );

  // Calculate remaining interest from current outstanding
  const r = loan.interest_rate / 12 / 100;
  let remainingInterest = 0;
  if (emisRemaining > 0 && loan.current_outstanding > 0) {
    let tempOutstanding = loan.current_outstanding;
    for (let i = 0; i < emisRemaining; i++) {
      const monthInterest = tempOutstanding * r;
      const monthPrincipal = loan.emi_amount - monthInterest;
      remainingInterest += monthInterest;
      tempOutstanding = Math.max(0, tempOutstanding - monthPrincipal);
    }
  }
  remainingInterest = round2(remainingInterest);

  const totalInterestRemaining = remainingInterest;

  // Projected payoff
  const projectedPayoffDate = emisRemaining > 0
    ? format(addMonths(new Date(), emisRemaining), 'yyyy-MM-dd')
    : format(new Date(), 'yyyy-MM-dd');

  // Interest saved = original total interest - (interest paid + remaining interest)
  const interestSaved = round2(
    Math.max(0, loan.total_interest_payable - (totalInterestPaid + totalInterestRemaining))
  );

  return {
    percentPaid,
    emisPaid,
    emisRemaining,
    totalInterestPaid,
    totalInterestRemaining,
    projectedPayoffDate,
    interestSaved,
  };
}

// ============================================================
// PREPAYMENT IMPACT
// ============================================================

/**
 * Calculate the impact of a prepayment on a loan.
 * Strategy: keep EMI same, reduce tenure.
 */
export function calculatePrepaymentImpact(
  currentOutstanding: number,
  annualRate: number,
  emi: number,
  prepaymentAmount: number,
  currentRemainingMonths: number
): PrepaymentImpact {
  const newOutstanding = round2(currentOutstanding - prepaymentAmount);
  const r = annualRate / 12 / 100;

  // Calculate new tenure with same EMI
  let newTenure = 0;
  if (newOutstanding > 0 && emi > 0 && r > 0) {
    // n = -log(1 - P*r/EMI) / log(1+r)
    const ratio = (newOutstanding * r) / emi;
    if (ratio < 1) {
      newTenure = Math.ceil(-Math.log(1 - ratio) / Math.log(1 + r));
    } else {
      // EMI doesn't cover interest — edge case
      newTenure = currentRemainingMonths;
    }
  }

  // Calculate remaining interest for original schedule
  let originalRemainingInterest = 0;
  {
    let temp = currentOutstanding;
    for (let i = 0; i < currentRemainingMonths; i++) {
      const mi = temp * r;
      originalRemainingInterest += mi;
      temp = Math.max(0, temp - (emi - mi));
    }
  }

  // Calculate remaining interest for new schedule
  let newRemainingInterest = 0;
  {
    let temp = newOutstanding;
    for (let i = 0; i < newTenure; i++) {
      const mi = temp * r;
      newRemainingInterest += mi;
      temp = Math.max(0, temp - (emi - mi));
    }
  }

  return {
    newOutstanding,
    newTenureMonths: newTenure,
    originalRemainingInterest: round2(originalRemainingInterest),
    newRemainingInterest: round2(newRemainingInterest),
    interestSaved: round2(originalRemainingInterest - newRemainingInterest),
    originalRemainingMonths: currentRemainingMonths,
    monthsSaved: currentRemainingMonths - newTenure,
  };
}

/**
 * Calculate the principal and interest components of an EMI payment
 * given the current outstanding balance.
 */
export function calculateEMIBreakdown(
  outstanding: number,
  annualRate: number,
  emi: number
): { principal: number; interest: number } {
  const r = annualRate / 12 / 100;
  const interest = round2(outstanding * r);
  const principal = round2(Math.min(emi - interest, outstanding));
  return { principal, interest };
}

// ============================================================
// TOTAL INTEREST
// ============================================================

export function calculateTotalInterest(
  principal: number,
  emi: number,
  tenureMonths: number
): number {
  return round2(emi * tenureMonths - principal);
}

// ============================================================
// CREDIT CARD UTILIZATION
// ============================================================

export function calculateCCUtilization(
  currentBalance: number,
  creditLimit: number
): number {
  if (creditLimit <= 0) return 0;
  return round2((currentBalance / creditLimit) * 100);
}

/**
 * Calculate the current balance (unbilled) for a card from transactions.
 * Balance = sum(debits) - sum(credits) for the current billing cycle.
 */
export function calculateCurrentBalance(
  transactions: { amount: number; transaction_type: 'debit' | 'credit' }[]
): number {
  return round2(
    transactions.reduce((sum, t) => {
      return t.transaction_type === 'debit' ? sum + t.amount : sum - t.amount;
    }, 0)
  );
}

// ============================================================
// BILLING CYCLE LOGIC
// ============================================================

/**
 * Determine which billing month a transaction belongs to.
 * If transaction_date <= statement_date of current cycle, it's this cycle.
 * Otherwise, it's the next cycle.
 *
 * @param transactionDate - The date of the transaction (ISO string or Date)
 * @param statementDay - Day of month the statement is generated (1-28)
 * @returns ISO date string of the first day of the billing month
 */
export function determineBillingMonth(
  transactionDate: string | Date,
  statementDay: number
): string {
  const txDate = new Date(transactionDate);
  const txDay = txDate.getDate();
  const txMonth = txDate.getMonth();
  const txYear = txDate.getFullYear();

  if (txDay <= statementDay) {
    // Belongs to this month's billing cycle
    return format(new Date(txYear, txMonth, 1), 'yyyy-MM-dd');
  } else {
    // Belongs to next month's billing cycle
    return format(addMonths(new Date(txYear, txMonth, 1), 1), 'yyyy-MM-dd');
  }
}

/**
 * Calculate statement date and due date for a given billing month.
 */
export function calculateBillDates(
  statementDay: number,
  dueDay: number,
  billingMonth: string | Date
): { statementDate: string; dueDate: string } {
  const bm = new Date(billingMonth);
  const year = bm.getFullYear();
  const month = bm.getMonth();

  // Statement date is statement_day of billing month
  const statementDate = new Date(year, month, statementDay);

  // Due date: if due_day > statement_day, same month; otherwise next month
  let dueDate: Date;
  if (dueDay > statementDay) {
    dueDate = new Date(year, month, dueDay);
  } else {
    dueDate = new Date(year, month + 1, dueDay);
  }

  return {
    statementDate: format(statementDate, 'yyyy-MM-dd'),
    dueDate: format(dueDate, 'yyyy-MM-dd'),
  };
}

// ============================================================
// DUE DATE LOGIC
// ============================================================

/**
 * Calculate days until due and return status info.
 */
export function getDueInfo(dueDate: string | Date): {
  daysRemaining: number;
  label: string;
  status: 'safe' | 'warning' | 'danger' | 'overdue';
} {
  const due = new Date(dueDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);

  const diffMs = due.getTime() - today.getTime();
  const daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (daysRemaining < 0) {
    return {
      daysRemaining,
      label: `${Math.abs(daysRemaining)} day${Math.abs(daysRemaining) !== 1 ? 's' : ''} overdue`,
      status: 'overdue',
    };
  }
  if (daysRemaining === 0) {
    return { daysRemaining: 0, label: 'Due Today', status: 'danger' };
  }
  if (daysRemaining === 1) {
    return { daysRemaining: 1, label: 'Due Tomorrow', status: 'danger' };
  }
  if (daysRemaining <= 3) {
    return { daysRemaining, label: `Due in ${daysRemaining} days`, status: 'danger' };
  }
  if (daysRemaining <= 7) {
    return { daysRemaining, label: `Due in ${daysRemaining} days`, status: 'warning' };
  }
  return { daysRemaining, label: `Due in ${daysRemaining} days`, status: 'safe' };
}

// ============================================================
// NEXT EMI DATE
// ============================================================

/**
 * Get the next EMI date from today, given the emi_day.
 */
export function getNextEMIDate(emiDay: number): string {
  const today = new Date();
  const thisMonth = new Date(today.getFullYear(), today.getMonth(), emiDay);

  if (thisMonth > today) {
    return format(thisMonth, 'yyyy-MM-dd');
  }
  return format(addMonths(thisMonth, 1), 'yyyy-MM-dd');
}

// ============================================================
// UTILITY
// ============================================================

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
