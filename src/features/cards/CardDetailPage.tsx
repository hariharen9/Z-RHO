// ============================================================
// ZRHO — Cards: Card Detail Page
// ============================================================

import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Edit, Trash2, Plus } from 'lucide-react';
import { useCard, useDeleteCard, useUpdateCard } from '@/hooks/useCards';
import { useAllCardTransactions } from '@/hooks/useTransactions';
import { useBills } from '@/hooks/useBills';
import { calculateCCUtilization, calculateCurrentBalance, calculateBillDates, getDueInfo } from '@/lib/calculations';
import { formatCurrency } from '@/lib/currency';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { AmountDisplay } from '@/components/shared/AmountDisplay';
import { DateCountdown } from '@/components/shared/DateCountdown';
import { CreditCardVisual } from './CreditCardVisual';
import { TransactionList } from './TransactionList';
import { BillsList } from './BillsList';
import { AddTransactionModal } from './AddTransactionModal';
import { format, startOfMonth, addMonths } from 'date-fns';

export function CardDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: card, isLoading } = useCard(id);
  const { data: allTransactions = [] } = useAllCardTransactions(id);
  const { data: bills = [] } = useBills(id);
  const deleteCard = useDeleteCard();
  const updateCard = useUpdateCard();

  const [activeTab, setActiveTab] = useState<'transactions' | 'bills'>('transactions');
  const [showAddTx, setShowAddTx] = useState(false);

  if (isLoading) return <div className="text-center py-12 text-[var(--color-zrho-text-muted)]">Loading...</div>;
  if (!card) return <div className="text-center py-12 text-red-400">Card not found</div>;

  // Calculate stats
  const currentBalance = calculateCurrentBalance(allTransactions);
  const utilization = calculateCCUtilization(Math.max(0, currentBalance), card.credit_limit);
  const availableLimit = card.credit_limit - Math.max(0, currentBalance);

  // Next due date
  const now = new Date();
  const nextBillingMonth = format(
    now.getDate() > card.statement_day ? startOfMonth(addMonths(now, 1)) : startOfMonth(now),
    'yyyy-MM-dd'
  );
  const { statementDate, dueDate } = calculateBillDates(card.statement_day, card.due_day, nextBillingMonth);
  const dueInfo = getDueInfo(dueDate);

  const handleDelete = async () => {
    if (confirm('Delete this card and all its data? This cannot be undone.')) {
      await deleteCard.mutateAsync(card.id);
      navigate('/cards');
    }
  };

  const handleCloseCard = async () => {
    if (confirm('Mark this card as closed?')) {
      await updateCard.mutateAsync({ id: card.id, status: 'closed' });
    }
  };

  const utilizationColor =
    utilization < 30 ? 'text-green-400' : utilization < 60 ? 'text-amber-400' : 'text-red-400';

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/cards')} className="p-2 rounded-lg hover:bg-[var(--color-zrho-surface-2)]">
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{card.name}</h1>
          <p className="text-sm text-[var(--color-zrho-text-muted)]">{card.bank}</p>
        </div>
        <div className="flex gap-2">
          <Link to={`/cards/${card.id}/edit`}>
            <Button variant="ghost" size="sm"><Edit size={16} /></Button>
          </Link>
          <Button variant="ghost" size="sm" onClick={handleDelete}>
            <Trash2 size={16} className="text-red-400" />
          </Button>
        </div>
      </div>

      {/* Card Visual */}
      <CreditCardVisual card={card} />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6 mb-6">
        <Card>
          <p className="text-xs text-[var(--color-zrho-text-muted)]">Current Balance</p>
          <AmountDisplay amount={Math.max(0, currentBalance)} currency={card.currency} size="lg" />
        </Card>
        <Card>
          <p className="text-xs text-[var(--color-zrho-text-muted)]">Available Limit</p>
          <p className="text-lg font-semibold">{formatCurrency(Math.max(0, availableLimit), card.currency)}</p>
        </Card>
        <Card>
          <p className="text-xs text-[var(--color-zrho-text-muted)]">Utilization</p>
          <p className={`text-lg font-semibold ${utilizationColor}`}>{utilization.toFixed(1)}%</p>
        </Card>
        <Card>
          <p className="text-xs text-[var(--color-zrho-text-muted)]">Next Due</p>
          <DateCountdown dueDate={dueDate} />
        </Card>
      </div>

      {/* Actions */}
      <div className="flex gap-2 mb-6">
        <Button size="sm" onClick={() => setShowAddTx(true)}>
          <Plus size={16} /> Add Transaction
        </Button>
        {card.status === 'active' && (
          <Button size="sm" variant="secondary" onClick={handleCloseCard}>
            Close Card
          </Button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setActiveTab('transactions')}
          className={`px-4 py-2 text-sm rounded-lg ${
            activeTab === 'transactions'
              ? 'bg-[var(--color-zrho-accent)] text-white'
              : 'bg-[var(--color-zrho-surface-2)] text-[var(--color-zrho-text-muted)]'
          }`}
        >
          Transactions ({allTransactions.length})
        </button>
        <button
          onClick={() => setActiveTab('bills')}
          className={`px-4 py-2 text-sm rounded-lg ${
            activeTab === 'bills'
              ? 'bg-[var(--color-zrho-accent)] text-white'
              : 'bg-[var(--color-zrho-surface-2)] text-[var(--color-zrho-text-muted)]'
          }`}
        >
          Bills ({bills.length})
        </button>
      </div>

      {activeTab === 'transactions' && (
        <TransactionList transactions={allTransactions} currency={card.currency} />
      )}

      {activeTab === 'bills' && (
        <BillsList bills={bills} cardId={card.id} currency={card.currency} />
      )}

      {/* Add Transaction Modal */}
      <AddTransactionModal
        isOpen={showAddTx}
        onClose={() => setShowAddTx(false)}
        cardId={card.id}
        statementDay={card.statement_day}
      />
    </div>
  );
}
