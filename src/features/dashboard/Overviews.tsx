// ============================================================
// ZRHO — Dashboard: Overview sections (Loans + Cards)
// ============================================================

import { Link } from 'react-router-dom';
import { useLoans } from '@/hooks/useLoans';
import { useCards } from '@/hooks/useCards';
import { Card } from '@/components/ui/Card';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { AmountDisplay } from '@/components/shared/AmountDisplay';
import { DateCountdown } from '@/components/shared/DateCountdown';
import { getNextEMIDate, calculateCCUtilization, calculateBillDates } from '@/lib/calculations';
import { formatCurrency } from '@/lib/currency';
import { format, startOfMonth, addMonths } from 'date-fns';

export function LoansOverview() {
  const { data: loans = [], isLoading } = useLoans('active');

  if (isLoading) return <Card className="animate-pulse h-32" />;
  if (loans.length === 0) return null;

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold">Active Loans</h3>
        <Link to="/loans" className="text-xs text-[var(--color-zrho-accent)] hover:underline">View all</Link>
      </div>
      <div className="space-y-2">
        {loans.slice(0, 5).map((loan) => {
          const pct = loan.principal_amount > 0
            ? ((loan.principal_amount - loan.current_outstanding) / loan.principal_amount) * 100
            : 0;
          return (
            <Link key={loan.id} to={`/loans/${loan.id}`}>
              <Card className="cursor-pointer">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="text-sm font-medium">{loan.name}</p>
                    <p className="text-xs text-[var(--color-zrho-text-muted)]">{loan.lender}</p>
                  </div>
                  <AmountDisplay amount={loan.current_outstanding} currency={loan.currency} size="sm" />
                </div>
                <ProgressBar value={pct} showLabel={false} />
                <div className="flex items-center justify-between mt-2 text-xs text-[var(--color-zrho-text-muted)]">
                  <span>EMI: {formatCurrency(loan.emi_amount, loan.currency)}</span>
                  <DateCountdown dueDate={getNextEMIDate(loan.emi_day)} />
                </div>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export function CardsOverview() {
  const { data: cards = [], isLoading } = useCards('active');

  if (isLoading) return <Card className="animate-pulse h-32" />;
  if (cards.length === 0) return null;

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold">Credit Cards</h3>
        <Link to="/cards" className="text-xs text-[var(--color-zrho-accent)] hover:underline">View all</Link>
      </div>
      <div className="space-y-2">
        {cards.slice(0, 5).map((card) => {
          const now = new Date();
          const nextBM = format(
            now.getDate() > card.statement_day ? startOfMonth(addMonths(now, 1)) : startOfMonth(now),
            'yyyy-MM-dd'
          );
          const { dueDate } = calculateBillDates(card.statement_day, card.due_day, nextBM);

          return (
            <Link key={card.id} to={`/cards/${card.id}`}>
              <Card className="cursor-pointer">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{card.name}</p>
                    <p className="text-xs text-[var(--color-zrho-text-muted)]">{card.bank} · •••• {card.last_four}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-[var(--color-zrho-text-muted)]">Limit</p>
                    <p className="text-sm font-medium">{formatCurrency(card.credit_limit, card.currency)}</p>
                    <DateCountdown dueDate={dueDate} />
                  </div>
                </div>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
