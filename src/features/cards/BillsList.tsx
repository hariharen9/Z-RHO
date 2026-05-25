// ============================================================
// ZRHO — Cards: Bills List
// ============================================================

import { Link } from 'react-router-dom';
import type { CCBill } from '@/types/database.types';
import { Badge } from '@/components/ui/Badge';
import { formatCurrency } from '@/lib/currency';
import { formatDate, formatMonthYear } from '@/lib/dates';

interface BillsListProps {
  bills: CCBill[];
  cardId: string;
  currency: string;
}

const statusVariants: Record<string, 'default' | 'success' | 'warning' | 'danger' | 'info'> = {
  upcoming: 'info',
  generated: 'warning',
  paid: 'success',
  overdue: 'danger',
  partially_paid: 'warning',
};

export function BillsList({ bills, cardId, currency }: BillsListProps) {
  if (bills.length === 0) {
    return <p className="text-[var(--color-zrho-text-muted)] text-sm py-4">No bills yet</p>;
  }

  return (
    <div className="space-y-2">
      {bills.map((bill) => (
        <Link key={bill.id} to={`/cards/${cardId}/bill/${bill.id}`}>
          <div className="flex items-center justify-between p-3 bg-[var(--color-zrho-surface-2)] rounded-lg hover:bg-[var(--color-zrho-border)] transition-colors">
            <div>
              <p className="text-sm font-medium">{formatMonthYear(bill.billing_month)}</p>
              <p className="text-xs text-[var(--color-zrho-text-muted)]">
                Due: {formatDate(bill.due_date)}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-sm font-semibold tabular-nums">
                  {formatCurrency(bill.statement_amount, currency)}
                </p>
                {bill.paid_amount !== null && (
                  <p className="text-xs text-green-400">
                    Paid: {formatCurrency(bill.paid_amount, currency)}
                  </p>
                )}
              </div>
              <Badge variant={statusVariants[bill.status] ?? 'default'}>
                {bill.status.replace('_', ' ')}
              </Badge>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
