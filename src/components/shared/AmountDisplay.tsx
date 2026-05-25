// ============================================================
// ZRHO — Shared: AmountDisplay
// ============================================================

import { formatCurrency } from '@/lib/currency';

interface AmountDisplayProps {
  amount: number;
  currency?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const sizeStyles: Record<string, string> = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-xl font-semibold',
  xl: 'text-3xl font-bold',
};

export function AmountDisplay({
  amount,
  currency = 'INR',
  className = '',
  size = 'md',
}: AmountDisplayProps) {
  return (
    <span className={`${sizeStyles[size]} tabular-nums ${className}`}>
      {formatCurrency(amount, currency)}
    </span>
  );
}
