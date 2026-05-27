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
import { Home, Car, GraduationCap, Briefcase, User, Coins } from 'lucide-react';

const categoryConfig: Record<
  string,
  {
    icon: any;
    color: string;
    bgColor: string;
  }
> = {
  home: {
    icon: Home,
    color: 'text-sky-400',
    bgColor: 'bg-sky-500/10 border-sky-500/20',
  },
  personal: {
    icon: User,
    color: 'text-pink-400',
    bgColor: 'bg-pink-500/10 border-pink-500/20',
  },
  car: {
    icon: Car,
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/10 border-amber-500/20',
  },
  education: {
    icon: GraduationCap,
    color: 'text-violet-400',
    bgColor: 'bg-violet-500/10 border-violet-500/20',
  },
  business: {
    icon: Briefcase,
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/10 border-emerald-500/20',
  },
  other: {
    icon: Coins,
    color: 'text-indigo-400',
    bgColor: 'bg-indigo-500/10 border-indigo-500/20',
  },
};

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
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            {/* Glassmorphic Category Icon */}
            <div
              className={`flex items-center justify-center p-2.5 rounded-xl border ${
                categoryConfig[loan.loan_type]?.bgColor || 'bg-border/10 border-border/20'
              } backdrop-blur-md shrink-0`}
            >
              {(() => {
                const IconComponent = categoryConfig[loan.loan_type]?.icon || Coins;
                return (
                  <IconComponent
                    className={`w-4 h-4 ${categoryConfig[loan.loan_type]?.color || 'text-foreground'}`}
                    strokeWidth={1.8}
                  />
                );
              })()}
            </div>
            <div>
              <h3 className="font-semibold text-[var(--color-zrho-text)] leading-tight">{loan.name}</h3>
              <p className="text-xs text-[var(--color-zrho-text-muted)] mt-0.5">{loan.lender}</p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0">
            <Badge variant={statusVariant} className="text-[9px] uppercase tracking-wider">{loan.status}</Badge>
            <span className="text-[10px] text-[var(--color-zrho-text-muted)]">
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
