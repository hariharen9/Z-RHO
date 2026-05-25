// ============================================================
// ZRHO — Currency Formatting & Conversion
// ============================================================

import { CURRENCIES, EXCHANGE_RATES_TO_INR } from '@/lib/constants';

/**
 * Format a number as currency string using Intl.NumberFormat.
 */
export function formatCurrency(
  amount: number,
  currencyCode: string = 'INR'
): string {
  const currencyInfo = CURRENCIES.find((c) => c.code === currencyCode);
  const locale = currencyInfo?.locale ?? 'en-IN';

  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: currencyInfo?.decimals ?? 2,
      maximumFractionDigits: currencyInfo?.decimals ?? 2,
    }).format(amount);
  } catch {
    // Fallback for unsupported currencies
    const symbol = currencyInfo?.symbol ?? currencyCode;
    return `${symbol}${amount.toFixed(2)}`;
  }
}

/**
 * Format a large number in compact form (e.g., ₹12.5L, ₹1.2Cr for INR).
 */
export function formatCompactCurrency(
  amount: number,
  currencyCode: string = 'INR'
): string {
  if (currencyCode === 'INR') {
    if (amount >= 1_00_00_000) {
      return `₹${(amount / 1_00_00_000).toFixed(2)}Cr`;
    }
    if (amount >= 1_00_000) {
      return `₹${(amount / 1_00_000).toFixed(2)}L`;
    }
    if (amount >= 1_000) {
      return `₹${(amount / 1_000).toFixed(1)}K`;
    }
    return formatCurrency(amount, currencyCode);
  }

  // For other currencies, use standard compact notation
  const currencyInfo = CURRENCIES.find((c) => c.code === currencyCode);
  const locale = currencyInfo?.locale ?? 'en-US';
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currencyCode,
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(amount);
}

/**
 * Convert amount from one currency to another using hardcoded rates.
 * All conversions go through INR as the base.
 */
export function convertCurrency(
  amount: number,
  fromCurrency: string,
  toCurrency: string
): number {
  if (fromCurrency === toCurrency) return amount;

  const fromRate = EXCHANGE_RATES_TO_INR[fromCurrency] ?? 1;
  const toRate = EXCHANGE_RATES_TO_INR[toCurrency] ?? 1;

  // Convert: from → INR → to
  const inINR = amount * fromRate;
  return Math.round((inINR / toRate) * 100) / 100;
}

/**
 * Get the currency symbol for a given code.
 */
export function getCurrencySymbol(currencyCode: string): string {
  return CURRENCIES.find((c) => c.code === currencyCode)?.symbol ?? currencyCode;
}
