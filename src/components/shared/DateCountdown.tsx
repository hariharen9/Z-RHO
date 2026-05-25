// ============================================================
// ZRHO — Shared: DateCountdown
// ============================================================

import { getDueInfo } from '@/lib/calculations';

interface DateCountdownProps {
  dueDate: string;
  className?: string;
}

const statusColors: Record<string, string> = {
  safe: 'text-green-400',
  warning: 'text-amber-400',
  danger: 'text-red-400',
  overdue: 'text-red-500 font-semibold',
};

export function DateCountdown({ dueDate, className = '' }: DateCountdownProps) {
  const { label, status } = getDueInfo(dueDate);

  return (
    <span className={`text-sm ${statusColors[status]} ${className}`}>
      {label}
    </span>
  );
}
