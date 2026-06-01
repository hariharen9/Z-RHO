// ============================================================
// ZRHO — Common types
// ============================================================

export interface CurrencyInfo {
  code: string;
  symbol: string;
  name: string;
  locale: string;
  decimals: number;
}

export type DueStatus = 'safe' | 'warning' | 'danger' | 'overdue';

export interface DueInfo {
  daysRemaining: number;
  label: string;
  status: DueStatus;
}

/** For upcoming payments section on dashboard */
export interface UpcomingPayment {
  id: string;
  name: string;
  type: 'loan' | 'card';
  amount: number;
  currency: string;
  dueDate: string;
  daysRemaining: number;
  status: DueStatus;
  linkedId: string; // loan.id or card.id for navigation
}

export interface DashboardSummary {
  totalOutstandingDebt: number;
  thisMonthObligations: number;
  totalCreditLimit: number;
  totalAvailableCredit: number;
  currency: string;
  cardBreakdown: Array<{
    id: string;
    name: string;
    color: string;
    limit: number;
    outstanding: number;
  }>;
}

/** Category spend data */
export interface CategorySpend {
  category: string;
  amount: number;
  currency: string;
}

/** Monthly outflow data for chart */
export interface MonthlyOutflow {
  month: string;
  emiPayments: number;
  ccPayments: number;
  total: number;
}

/** Debt history point for chart */
export interface DebtHistoryPoint {
  month: string;
  totalDebt: number;
}
