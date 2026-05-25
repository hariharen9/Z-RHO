// ============================================================
// ZRHO — Dashboard: Upcoming Payments
// ============================================================

import { useNavigate } from 'react-router-dom';
import { useUpcomingPayments } from '@/hooks/useDashboard';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { formatCurrency } from '@/lib/currency';
import { formatDate } from '@/lib/dates';

const statusColors: Record<string, 'success' | 'warning' | 'danger'> = {
  safe: 'success',
  warning: 'warning',
  danger: 'danger',
  overdue: 'danger',
};

export function UpcomingPayments() {
  const { data: payments = [], isLoading } = useUpcomingPayments();
  const navigate = useNavigate();

  if (isLoading) return <Card className="animate-pulse h-32" />;

  if (payments.length === 0) {
    return (
      <Card>
        <p className="text-sm text-[var(--color-zrho-text-muted)]">No upcoming payments in the next 30 days 🎉</p>
      </Card>
    );
  }

  return (
    <div className="space-y-2">
      {payments.map((payment) => (
        <Card
          key={payment.id}
          onClick={() => {
            if (payment.type === 'loan') navigate(`/loans/${payment.linkedId}`);
            else navigate(`/cards/${payment.linkedId}`);
          }}
          className="cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{payment.name}</span>
                <Badge variant={payment.type === 'loan' ? 'info' : 'default'}>
                  {payment.type === 'loan' ? 'EMI' : 'Bill'}
                </Badge>
              </div>
              <p className="text-xs text-[var(--color-zrho-text-muted)] mt-0.5">
                {formatDate(payment.dueDate)}
              </p>
            </div>
            <div className="text-right">
              <p className="font-semibold text-sm">{formatCurrency(payment.amount, payment.currency)}</p>
              <Badge variant={statusColors[payment.status]}>
                {payment.daysRemaining < 0
                  ? `${Math.abs(payment.daysRemaining)}d overdue`
                  : payment.daysRemaining === 0
                  ? 'Today'
                  : `${payment.daysRemaining}d`}
              </Badge>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
