// ============================================================
// ZRHO — THE MATH ENGINE
// All financial calculations: EMI, amortization, prepayment,
// utilization, billing cycles, due date logic
// ============================================================

import { addMonths, format, startOfMonth, parseISO } from 'date-fns';
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
  const start = typeof startDate === 'string' ? parseISO(startDate) : new Date(startDate);
  const today = new Date();
  const currentMonth = format(startOfMonth(today), 'yyyy-MM-dd');

  let activeEmi = emi;
  if (!activeEmi || activeEmi <= 0) {
    activeEmi = calculateEMI(principal, annualRate, tenureMonths);
  }

  for (let i = 0; i < tenureMonths; i++) {
    const monthDate = addMonths(start, i);
    const monthStr = format(startOfMonth(monthDate), 'yyyy-MM-dd');

    const isSettled = round2(outstanding) <= 0;
    const interestComponent = isSettled ? 0 : round2(outstanding * r);
    let principalComponent = isSettled ? 0 : round2(activeEmi - interestComponent);

    if (isSettled) {
      principalComponent = 0;
    } else if (outstanding < principalComponent) {
      principalComponent = round2(outstanding);
    }

    // Last month: adjust for rounding
    if (i === tenureMonths - 1 && !isSettled) {
      principalComponent = round2(outstanding);
    }

    const currentEmiAmount = isSettled ? 0 : round2(interestComponent + principalComponent);

    // Get all payments in this month (both regular and prepayments)
    const monthPayments = payments.filter((p) => {
      const pDate = p.is_prepayment ? p.payment_date : (p.emi_month || p.payment_date);
      return format(startOfMonth(parseISO(pDate)), 'yyyy-MM-dd') === monthStr;
    });

    const regularPayment = monthPayments.find((p) => !p.is_prepayment);

    let nextOutstanding = outstanding;
    if (monthPayments.length > 0) {
      nextOutstanding = Math.min(...monthPayments.map((p) => p.outstanding_after));
    } else {
      nextOutstanding = round2(Math.max(0, outstanding - principalComponent));
    }

    // Determine status: if regular payment was recorded, or if outstanding was already 0
    let status: AmortizationRow['status'] = 'upcoming';
    if (regularPayment || isSettled) {
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
      emiAmount: regularPayment ? regularPayment.amount_paid : currentEmiAmount,
      principalComponent: regularPayment ? regularPayment.principal_component : principalComponent,
      interestComponent: regularPayment ? regularPayment.interest_component : interestComponent,
      outstandingBalance: nextOutstanding,
      status,
      paidDate: regularPayment?.payment_date,
    });

    outstanding = nextOutstanding;
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

  let activeEmi = loan.emi_amount;
  if (!activeEmi || activeEmi <= 0) {
    activeEmi = calculateEMI(loan.principal_amount, loan.interest_rate, loan.tenure_months);
  }
  
  // Calculate emisRemaining dynamically based on remaining principal
  const r = loan.interest_rate / 12 / 100;
  let emisRemaining = Math.max(0, loan.tenure_months - emisPaid);
  if (loan.current_outstanding <= 0 || loan.status === 'closed') {
    emisRemaining = 0;
  } else if (loan.current_outstanding > 0 && activeEmi > 0) {
    if (r > 0) {
      const ratio = (loan.current_outstanding * r) / activeEmi;
      if (ratio < 1) {
        emisRemaining = Math.ceil(-Math.log(1 - ratio) / Math.log(1 + r));
      }
    } else {
      emisRemaining = Math.ceil(loan.current_outstanding / activeEmi);
    }
  }

  const percentPaid = loan.principal_amount > 0
    ? Math.min(100, round2(((loan.principal_amount - Math.max(0, loan.current_outstanding)) / loan.principal_amount) * 100))
    : 0;

  const totalInterestPaid = round2(
    allPayments.reduce((sum, p) => sum + p.interest_component, 0)
  );

  // Calculate remaining interest from current outstanding
  let remainingInterest = 0;
  if (emisRemaining > 0 && loan.current_outstanding > 0 && r > 0 && activeEmi > 0) {
    let tempOutstanding = loan.current_outstanding;
    for (let i = 0; i < emisRemaining; i++) {
      const monthInterest = tempOutstanding * r;
      const monthPrincipal = activeEmi - monthInterest;
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

  // Self-healing: if emi is 0 or less, approximate the EMI from outstanding over remaining months
  let activeEmi = emi;
  if (activeEmi <= 0 && currentOutstanding > 0 && r > 0 && currentRemainingMonths > 0) {
    const powerTerm = Math.pow(1 + r, currentRemainingMonths);
    activeEmi = round2((currentOutstanding * r * powerTerm) / (powerTerm - 1));
  }
  // Fallback to simple division if rate is 0
  if (activeEmi <= 0 && currentOutstanding > 0 && currentRemainingMonths > 0) {
    activeEmi = round2(currentOutstanding / currentRemainingMonths);
  }

  // Calculate new tenure with same EMI
  let newTenure = 0;
  if (newOutstanding > 0 && activeEmi > 0) {
    if (r > 0) {
      // n = -log(1 - P*r/EMI) / log(1+r)
      const ratio = (newOutstanding * r) / activeEmi;
      if (ratio < 1) {
        newTenure = Math.ceil(-Math.log(1 - ratio) / Math.log(1 + r));
      } else {
        // EMI doesn't cover interest — edge case
        newTenure = currentRemainingMonths;
      }
    } else {
      newTenure = Math.ceil(newOutstanding / activeEmi);
    }
  }

  // Calculate remaining interest for original schedule
  let originalRemainingInterest = 0;
  {
    let temp = currentOutstanding;
    for (let i = 0; i < currentRemainingMonths; i++) {
      const mi = temp * r;
      originalRemainingInterest += mi;
      temp = Math.max(0, temp - (activeEmi - mi));
    }
  }

  // Calculate remaining interest for new schedule
  let newRemainingInterest = 0;
  {
    let temp = newOutstanding;
    for (let i = 0; i < newTenure; i++) {
      const mi = temp * r;
      newRemainingInterest += mi;
      temp = Math.max(0, temp - (activeEmi - mi));
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
  const txDate = typeof transactionDate === 'string' ? parseISO(transactionDate) : new Date(transactionDate);
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
  const bm = typeof billingMonth === 'string' ? parseISO(billingMonth) : new Date(billingMonth);
  const year = bm.getFullYear();
  const month = bm.getMonth();

  // Statement date is statement_day of billing month
  const lastDayOfStmtMonth = new Date(year, month + 1, 0).getDate();
  const statementDate = new Date(year, month, Math.min(statementDay, lastDayOfStmtMonth));

  // Due date: if due_day > statement_day, same month; otherwise next month
  let dueDate: Date;
  if (dueDay > statementDay) {
    const lastDay = new Date(year, month + 1, 0).getDate();
    dueDate = new Date(year, month, Math.min(dueDay, lastDay));
  } else {
    const lastDay = new Date(year, month + 2, 0).getDate();
    dueDate = new Date(year, month + 1, Math.min(dueDay, lastDay));
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
  const due = typeof dueDate === 'string' ? parseISO(dueDate) : new Date(dueDate);
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
  today.setHours(0, 0, 0, 0);

  let thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const lastDayOfThisMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  thisMonth.setDate(Math.min(emiDay, lastDayOfThisMonth));

  if (thisMonth > today) {
    return format(thisMonth, 'yyyy-MM-dd');
  }
  
  let nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
  const lastDayOfNextMonth = new Date(nextMonth.getFullYear(), nextMonth.getMonth() + 1, 0).getDate();
  nextMonth.setDate(Math.min(emiDay, lastDayOfNextMonth));
  
  return format(nextMonth, 'yyyy-MM-dd');
}

// ============================================================
// UTILITY
// ============================================================

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
