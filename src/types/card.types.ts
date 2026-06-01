// ============================================================
// ZRHO — Card-specific types
// ============================================================

/** Spend categories for credit card transactions */
export const SPEND_CATEGORIES = [
  'Food & Dining',
  'Travel & Transport',
  'Shopping & Retail',
  'Fuel',
  'Bills & Utilities',
  'Entertainment & Leisure',
  'Health & Medical',
  'Subscriptions & Services',
  'Education',
  'Home & Housing',
  'Groceries & essentials',
  'Electronics & Gadgets',
  'Gifts & Donations',
  'Transfer & Payment',
  'Other',
] as const;

export type SpendCategory = (typeof SPEND_CATEGORIES)[number];

/** Card stats computed from transactions + bills */
export interface CardStats {
  currentBalance: number;
  availableLimit: number;
  utilizationPercent: number;
  nextStatementDate: string;
  nextDueDate: string;
  daysUntilDue: number;
}

/** Spending breakdown by category */
export interface CategoryBreakdown {
  category: string;
  amount: number;
  percentage: number;
  count: number;
}

/** Monthly spending summary for charts */
export interface MonthlySpending {
  month: string;
  totalSpends: number;
  totalCredits: number;
  net: number;
}
