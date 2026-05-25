// ============================================================
// ZRHO — Cards: Cards List Page
// ============================================================

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { useCards } from '@/hooks/useCards';
import { CreditCardVisual } from './CreditCardVisual';
import { Button } from '@/components/ui/Button';
import { AmountDisplay } from '@/components/shared/AmountDisplay';
import { DateCountdown } from '@/components/shared/DateCountdown';
import { calculateBillDates } from '@/lib/calculations';
import { formatCurrency } from '@/lib/currency';
import { format, startOfMonth, addMonths } from 'date-fns';
import type { CardStatus } from '@/types/database.types';

export function CardsPage() {
  const [statusFilter, setStatusFilter] = useState<CardStatus | undefined>('active');
  const { data: cards, isLoading, error } = useCards(statusFilter);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Credit Cards</h1>
        <Link to="/cards/new">
          <Button size="sm">
            <Plus size={16} />
            Add Card
          </Button>
        </Link>
      </div>

      {/* Filter */}
      <div className="flex gap-2 mb-6">
        {(['active', 'closed', undefined] as (CardStatus | undefined)[]).map((status) => (
          <button
            key={status ?? 'all'}
            onClick={() => setStatusFilter(status)}
            className={`px-3 py-1.5 text-sm rounded-lg transition-colors
              ${statusFilter === status
                ? 'bg-[var(--color-zrho-accent)] text-white'
                : 'bg-[var(--color-zrho-surface-2)] text-[var(--color-zrho-text-muted)] hover:text-[var(--color-zrho-text)]'
              }`}
          >
            {status === undefined ? 'All' : status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>

      {isLoading && (
        <div className="text-center py-12 text-[var(--color-zrho-text-muted)]">Loading cards...</div>
      )}

      {error && (
        <div className="text-center py-12 text-red-400">Error: {(error as Error).message}</div>
      )}

      {cards && cards.length === 0 && (
        <div className="text-center py-12">
          <p className="text-[var(--color-zrho-text-muted)] mb-4">No credit cards yet</p>
          <Link to="/cards/new">
            <Button>Add Your First Card</Button>
          </Link>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {cards?.map((card) => {
          const now = new Date();
          const nextBillingMonth = format(
            now.getDate() > card.statement_day
              ? startOfMonth(addMonths(now, 1))
              : startOfMonth(now),
            'yyyy-MM-dd'
          );
          const { dueDate } = calculateBillDates(card.statement_day, card.due_day, nextBillingMonth);

          return (
            <Link key={card.id} to={`/cards/${card.id}`}>
              <div className="space-y-3">
                <CreditCardVisual card={card} compact />
                <div className="flex items-center justify-between text-sm px-1">
                  <div>
                    <p className="text-[var(--color-zrho-text-muted)]">Limit</p>
                    <p className="font-medium">{formatCurrency(card.credit_limit, card.currency)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[var(--color-zrho-text-muted)]">Next Due</p>
                    <DateCountdown dueDate={dueDate} />
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
