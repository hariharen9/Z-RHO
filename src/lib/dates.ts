// ============================================================
// ZRHO — Date Utilities
// ============================================================

import {
  format,
  formatDistanceToNow,
  parseISO,
  isValid,
  startOfMonth,
  addMonths,
} from 'date-fns';

/**
 * Format a date string to a readable format.
 */
export function formatDate(
  dateStr: string | Date,
  fmt: string = 'dd MMM yyyy'
): string {
  const date = typeof dateStr === 'string' ? parseISO(dateStr) : dateStr;
  if (!isValid(date)) return '—';
  return format(date, fmt);
}

/**
 * Format as "Mon YYYY" for display (e.g., "Jan 2025").
 */
export function formatMonthYear(dateStr: string | Date): string {
  return formatDate(dateStr, 'MMM yyyy');
}

/**
 * Get relative time string (e.g., "3 days ago", "in 5 days").
 */
export function formatRelativeDate(dateStr: string | Date): string {
  const date = typeof dateStr === 'string' ? parseISO(dateStr) : dateStr;
  if (!isValid(date)) return '—';
  return formatDistanceToNow(date, { addSuffix: true });
}

/**
 * Get the first day of the month containing the given date.
 */
export function getMonthStart(dateStr: string | Date): string {
  const date = typeof dateStr === 'string' ? parseISO(dateStr) : dateStr;
  return format(startOfMonth(date), 'yyyy-MM-dd');
}

/**
 * Get an array of month start dates for the last N months (including current).
 */
export function getLastNMonths(n: number): string[] {
  const months: string[] = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i--) {
    months.push(format(addMonths(startOfMonth(now), -i), 'yyyy-MM-dd'));
  }
  return months;
}

/**
 * Parse a date string safely, returning null if invalid.
 */
export function safeParse(dateStr: string): Date | null {
  try {
    const date = parseISO(dateStr);
    return isValid(date) ? date : null;
  } catch {
    return null;
  }
}

/**
 * Calculate end date from start date + tenure months.
 */
export function calculateEndDate(startDate: string, tenureMonths: number): string {
  const start = parseISO(startDate);
  return format(addMonths(start, tenureMonths), 'yyyy-MM-dd');
}
