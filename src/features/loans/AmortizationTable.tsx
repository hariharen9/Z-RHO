// ============================================================
// ZRHO — Loans: Amortization Table
// ============================================================

import type { AmortizationRow } from '@/types/loan.types';
import { Badge } from '@/components/ui/Badge';
import { formatCurrency } from '@/lib/currency';
import { formatDate } from '@/lib/dates';

interface AmortizationTableProps {
  schedule: AmortizationRow[];
  currency: string;
}

export function AmortizationTable({ schedule, currency }: AmortizationTableProps) {
  if (schedule.length === 0) return null;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[var(--color-zrho-border)]">
            <th className="text-left py-2 px-3 text-[var(--color-zrho-text-muted)] font-medium">#</th>
            <th className="text-left py-2 px-3 text-[var(--color-zrho-text-muted)] font-medium">Date</th>
            <th className="text-right py-2 px-3 text-[var(--color-zrho-text-muted)] font-medium">EMI</th>
            <th className="text-right py-2 px-3 text-[var(--color-zrho-text-muted)] font-medium">Principal</th>
            <th className="text-right py-2 px-3 text-[var(--color-zrho-text-muted)] font-medium">Interest</th>
            <th className="text-right py-2 px-3 text-[var(--color-zrho-text-muted)] font-medium">Outstanding</th>
            <th className="text-center py-2 px-3 text-[var(--color-zrho-text-muted)] font-medium">Status</th>
          </tr>
        </thead>
        <tbody>
          {schedule.map((row) => {
            const statusVariant =
              row.status === 'paid' ? 'success' : row.status === 'current' ? 'warning' : 'default';

            return (
              <tr
                key={row.month}
                className={`border-b border-[var(--color-zrho-border)]/50 
                  ${row.status === 'paid' ? 'bg-green-500/5' : ''}
                  ${row.status === 'current' ? 'bg-amber-500/5' : ''}
                `}
              >
                <td className="py-2 px-3">{row.month}</td>
                <td className="py-2 px-3 text-[var(--color-zrho-text-muted)]">
                  {formatDate(row.date, 'MMM yyyy')}
                </td>
                <td className="py-2 px-3 text-right tabular-nums">
                  {formatCurrency(row.emiAmount, currency)}
                </td>
                <td className="py-2 px-3 text-right tabular-nums">
                  {formatCurrency(row.principalComponent, currency)}
                </td>
                <td className="py-2 px-3 text-right tabular-nums">
                  {formatCurrency(row.interestComponent, currency)}
                </td>
                <td className="py-2 px-3 text-right tabular-nums font-medium">
                  {formatCurrency(row.outstandingBalance, currency)}
                </td>
                <td className="py-2 px-3 text-center">
                  <Badge variant={statusVariant}>
                    {row.status === 'paid' ? 'Paid' : row.status === 'current' ? 'Due' : 'Upcoming'}
                  </Badge>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
