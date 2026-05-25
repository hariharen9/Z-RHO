// ============================================================
// ZRHO — Loans: Payment History
// ============================================================

import type { LoanPayment } from '@/types/database.types';
import { Badge } from '@/components/ui/Badge';
import { formatCurrency } from '@/lib/currency';
import { formatDate } from '@/lib/dates';

interface LoanPaymentHistoryProps {
  payments: LoanPayment[];
  currency: string;
}

export function LoanPaymentHistory({ payments, currency }: LoanPaymentHistoryProps) {
  if (payments.length === 0) {
    return (
      <p className="text-[var(--color-zrho-text-muted)] text-sm py-4">
        No payments recorded yet.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {payments.map((payment) => (
        <div
          key={payment.id}
          className="flex items-center justify-between p-3 bg-[var(--color-zrho-surface-2)] rounded-lg"
        >
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">{formatDate(payment.payment_date)}</span>
              {payment.is_prepayment && (
                <Badge variant="info">Prepayment</Badge>
              )}
            </div>
            <p className="text-xs text-[var(--color-zrho-text-muted)] mt-1">
              Principal: {formatCurrency(payment.principal_component, currency)} ·
              Interest: {formatCurrency(payment.interest_component, currency)}
            </p>
            {payment.notes && (
              <p className="text-xs text-[var(--color-zrho-text-muted)] mt-0.5">{payment.notes}</p>
            )}
          </div>
          <div className="text-right">
            <p className="font-semibold">{formatCurrency(payment.amount_paid, currency)}</p>
            <p className="text-xs text-[var(--color-zrho-text-muted)]">
              Bal: {formatCurrency(payment.outstanding_after, currency)}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
