// ============================================================
// ZRHO — Constants
// ============================================================

import type { CurrencyInfo } from '@/types/common.types';

// ---- Loan Types ----
export const LOAN_TYPE_LABELS: Record<string, string> = {
  home: 'Home Loan',
  personal: 'Personal Loan',
  car: 'Car Loan',
  education: 'Education Loan',
  business: 'Business Loan',
  other: 'Other',
};

// ---- Card Networks ----
export const CARD_NETWORK_LABELS: Record<string, string> = {
  visa: 'Visa',
  mastercard: 'Mastercard',
  amex: 'American Express',
  rupay: 'RuPay',
  other: 'Other',
};

// ---- Currencies ----
export const CURRENCIES: CurrencyInfo[] = [
  { code: 'INR', symbol: '₹', name: 'Indian Rupee', locale: 'en-IN', decimals: 2 },
  { code: 'USD', symbol: '$', name: 'US Dollar', locale: 'en-US', decimals: 2 },
  { code: 'EUR', symbol: '€', name: 'Euro', locale: 'de-DE', decimals: 2 },
  { code: 'GBP', symbol: '£', name: 'British Pound', locale: 'en-GB', decimals: 2 },
  { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham', locale: 'ar-AE', decimals: 2 },
  { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar', locale: 'en-SG', decimals: 2 },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar', locale: 'en-CA', decimals: 2 },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', locale: 'en-AU', decimals: 2 },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen', locale: 'ja-JP', decimals: 0 },
  { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc', locale: 'de-CH', decimals: 2 },
];

// ---- Exchange Rates (v1: hardcoded approx rates relative to INR) ----
// 1 unit of currency = X INR
export const EXCHANGE_RATES_TO_INR: Record<string, number> = {
  INR: 1,
  USD: 83.5,
  EUR: 91.0,
  GBP: 106.0,
  AED: 22.7,
  SGD: 62.5,
  CAD: 62.0,
  AUD: 55.0,
  JPY: 0.56,
  CHF: 94.0,
};

// ---- Spend Categories ----
export { SPEND_CATEGORIES } from '@/types/card.types';

// ---- Status Colors ----
export const STATUS_COLORS = {
  active: '#22c55e',
  closed: '#6b7280',
  paused: '#f59e0b',
  paid: '#22c55e',
  upcoming: '#6366f1',
  generated: '#f59e0b',
  overdue: '#ef4444',
  partially_paid: '#f97316',
} as const;

// ---- Due Date Thresholds ----
export const DUE_THRESHOLDS = {
  SAFE: 7,     // > 7 days = green
  WARNING: 3,  // 3-7 days = yellow
  // < 3 days = red
} as const;
