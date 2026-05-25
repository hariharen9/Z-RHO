// ============================================================
// ZRHO — Loans: LoanCard (compact card for list view)
// ============================================================

import { Link } from 'react-router-dom';
import type { Loan } from '@/types/database.types';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { AmountDisplay } from '@/components/shared/AmountDisplay';
import { DateCountdown } from '@/components/shared/DateCountdown';
import { getNextEMIDate } from '@/lib/calculations';
import { LOAN_TYPE_LABELS } from '@/lib/constants';

interface LoanCardProps {
  loan: Loan;
}

export function LoanCard({ loan }: LoanCardProps) {
  const percentPaid =
    loan.principal_amount > 0
      ? ((loan.principal_amount - loan.current_outstanding) / loan.principal_amount) * 100
      : 0;

  const nextEMIDate = getNextEMIDate(loan.emi_day);

  const statusVariant =
    loan.status === 'active' ? 'success' : loan.status === 'paused' ? 'warning' : 'default';

  return (
    <Link to={`/loans/${loan.id}`}>
      <Card className="hover:border-[var(--color-zrho-accent)] transition-colors">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="font-semibold text-[var(--color-zrho-text)]">{loan.name}</h3>
            <p className="text-sm text-[var(--color-zrho-text-muted)]">{loan.lender}</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={statusVariant}>{loan.status}</Badge>
            <span className="text-xs text-[var(--color-zrho-text-muted)]">
              {LOAN_TYPE_LABELS[loan.loan_type]}
            </span>
          </div>
        </div>

        <div className="flex items-end justify-between mb-3">
          <div>
            <p className="text-xs text-[var(--color-zrho-text-muted)]">Outstanding</p>
            <AmountDisplay amount={loan.current_outstanding} currency={loan.currency} size="lg" />
          </div>
          <div className="text-right">
            <p className="text-xs text-[var(--color-zrho-text-muted)]">of</p>
            <AmountDisplay amount={loan.principal_amount} currency={loan.currency} size="sm" />
          </div>
        </div>

        <ProgressBar value={percentPaid} />

        <div className="flex items-center justify-between mt-3 text-sm">
          <div>
            <span className="text-[var(--color-zrho-text-muted)]">Next EMI: </span>
            <AmountDisplay amount={loan.emi_amount} currency={loan.currency} size="sm" />
          </div>
          <DateCountdown dueDate={nextEMIDate} />
        </div>

        <div className="mt-2 text-xs text-[var(--color-zrho-text-muted)]">
          Rate: {loan.interest_rate}% p.a.
        </div>
      </Card>
    </Link>
  );
}
