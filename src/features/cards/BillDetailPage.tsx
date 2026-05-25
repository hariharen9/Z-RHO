// ============================================================
// ZRHO — Cards: Bill Detail Page
// ============================================================

import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useBill } from '@/hooks/useBills';
import { useTransactions } from '@/hooks/useTransactions';
import { useCard } from '@/hooks/useCards';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { AmountDisplay } from '@/components/shared/AmountDisplay';
import { DateCountdown } from '@/components/shared/DateCountdown';
import { TransactionList } from './TransactionList';
import { MarkBillPaidModal } from './MarkBillPaidModal';
import { formatCurrency } from '@/lib/currency';
import { formatDate, formatMonthYear } from '@/lib/dates';

export function BillDetailPage() {
  const { id: cardId, billId } = useParams<{ id: string; billId: string }>();
  const navigate = useNavigate();
  const { data: bill, isLoading } = useBill(billId);
  const { data: card } = useCard(cardId);
  const { data: transactions = [] } = useTransactions(cardId, {
    billingMonth: bill?.billing_month,
  });
  const [showPayModal, setShowPayModal] = useState(false);

  if (isLoading) return <div className="text-center py-12 text-[var(--color-zrho-text-muted)]">Loading...</div>;
  if (!bill || !card) return <div className="text-center py-12 text-red-400">Bill not found</div>;

  const statusVariant: Record<string, 'default' | 'success' | 'warning' | 'danger' | 'info'> = {
    upcoming: 'info', generated: 'warning', paid: 'success', overdue: 'danger', partially_paid: 'warning',
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(`/cards/${cardId}`)} className="p-2 rounded-lg hover:bg-[var(--color-zrho-surface-2)]">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-xl font-bold">{card.name} — {formatMonthYear(bill.billing_month)}</h1>
          <p className="text-sm text-[var(--color-zrho-text-muted)]">
            Statement: {formatDate(bill.statement_date)} · Due: {formatDate(bill.due_date)}
          </p>
        </div>
      </div>

      {/* Bill Summary */}
      <Card className="mb-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-xs text-[var(--color-zrho-text-muted)]">Statement Amount</p>
            <AmountDisplay amount={bill.statement_amount} currency={card.currency} size="lg" />
          </div>
          <div>
            <p className="text-xs text-[var(--color-zrho-text-muted)]">Minimum Due</p>
            <p className="text-lg font-semibold">{formatCurrency(bill.minimum_due, card.currency)}</p>
          </div>
          <div>
            <p className="text-xs text-[var(--color-zrho-text-muted)]">Due Date</p>
            <p className="text-lg font-semibold">{formatDate(bill.due_date)}</p>
            <DateCountdown dueDate={bill.due_date} />
          </div>
          <div>
            <p className="text-xs text-[var(--color-zrho-text-muted)]">Status</p>
            <Badge variant={statusVariant[bill.status] ?? 'default'}>{bill.status.replace('_', ' ')}</Badge>
          </div>
        </div>

        {bill.paid_amount !== null && (
          <div className="mt-4 p-3 bg-green-500/10 rounded-lg">
            <p className="text-sm text-green-400">
              Paid {formatCurrency(bill.paid_amount, card.currency)} on {formatDate(bill.paid_date!)}
            </p>
          </div>
        )}

        {bill.status !== 'paid' && (
          <Button className="mt-4" onClick={() => setShowPayModal(true)}>
            Mark as Paid
          </Button>
        )}
      </Card>

      {/* Spending Breakdown */}
      <Card className="mb-6">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-xs text-[var(--color-zrho-text-muted)]">Total Spends</p>
            <p className="text-lg font-semibold text-red-400">{formatCurrency(bill.total_spends, card.currency)}</p>
          </div>
          <div>
            <p className="text-xs text-[var(--color-zrho-text-muted)]">Total Credits</p>
            <p className="text-lg font-semibold text-green-400">{formatCurrency(bill.total_credits, card.currency)}</p>
          </div>
          <div>
            <p className="text-xs text-[var(--color-zrho-text-muted)]">Opening Balance</p>
            <p className="text-lg font-semibold">{formatCurrency(bill.opening_balance, card.currency)}</p>
          </div>
        </div>
      </Card>

      {/* Transactions in this cycle */}
      <h2 className="text-lg font-semibold mb-3">Transactions</h2>
      <TransactionList transactions={transactions} currency={card.currency} />

      {/* Pay Modal */}
      <MarkBillPaidModal
        isOpen={showPayModal}
        onClose={() => setShowPayModal(false)}
        billId={bill.id}
        cardId={card.id}
        statementAmount={bill.statement_amount}
        minimumDue={bill.minimum_due}
        currency={card.currency}
      />
    </div>
  );
}
