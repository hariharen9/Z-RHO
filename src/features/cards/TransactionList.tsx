// ============================================================
// ZRHO — Cards: Transaction List
// ============================================================

import { useState } from 'react';
import type { CCTransaction } from '@/types/database.types';
import { formatCurrency } from '@/lib/currency';
import { formatDate } from '@/lib/dates';
import { SPEND_CATEGORIES } from '@/types/card.types';

interface TransactionListProps {
  transactions: CCTransaction[];
  currency: string;
}

export function TransactionList({ transactions, currency }: TransactionListProps) {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  const filtered = transactions.filter((tx) => {
    if (categoryFilter && tx.category !== categoryFilter) return false;
    if (search) {
      const s = search.toLowerCase();
      return (
        (tx.merchant?.toLowerCase().includes(s)) ||
        (tx.note?.toLowerCase().includes(s)) ||
        tx.category.toLowerCase().includes(s)
      );
    }
    return true;
  });

  return (
    <div>
      {/* Filters */}
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search merchant or note..."
          className="flex-1 px-3 py-2 bg-[var(--color-zrho-surface-2)] border border-[var(--color-zrho-border)] rounded-lg text-sm text-[var(--color-zrho-text)] outline-none"
        />
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-3 py-2 bg-[var(--color-zrho-surface-2)] border border-[var(--color-zrho-border)] rounded-lg text-sm text-[var(--color-zrho-text)] outline-none"
        >
          <option value="">All Categories</option>
          {SPEND_CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <p className="text-[var(--color-zrho-text-muted)] text-sm py-4 text-center">
          No transactions found
        </p>
      ) : (
        <div className="space-y-1">
          {filtered.map((tx) => (
            <div
              key={tx.id}
              className="flex items-center justify-between p-3 rounded-lg hover:bg-[var(--color-zrho-surface-2)] transition-colors"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium truncate">
                    {tx.merchant || tx.category}
                  </span>
                  <span className="text-xs text-[var(--color-zrho-text-muted)] shrink-0">
                    {tx.category}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-[var(--color-zrho-text-muted)]">
                    {formatDate(tx.transaction_date)}
                  </span>
                  {tx.note && (
                    <span className="text-xs text-[var(--color-zrho-text-muted)] truncate">
                      · {tx.note}
                    </span>
                  )}
                </div>
              </div>
              <span
                className={`font-semibold text-sm tabular-nums ${
                  tx.transaction_type === 'debit' ? 'text-red-400' : 'text-green-400'
                }`}
              >
                {tx.transaction_type === 'debit' ? '-' : '+'}
                {formatCurrency(tx.amount, currency)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
