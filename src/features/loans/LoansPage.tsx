// ============================================================
// ZRHO — Loans: Loans List Page
// ============================================================

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { useLoans } from '@/hooks/useLoans';
import { LoanCard } from './LoanCard';
import { Button } from '@/components/ui/Button';
import type { LoanStatus } from '@/types/database.types';

export function LoansPage() {
  const [statusFilter, setStatusFilter] = useState<LoanStatus | undefined>('active');
  const { data: loans, isLoading, error } = useLoans(statusFilter);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Loans</h1>
        <Link to="/loans/new">
          <Button size="sm">
            <Plus size={16} />
            Add Loan
          </Button>
        </Link>
      </div>

      {/* Status Toggle */}
      <div className="flex gap-2 mb-6">
        {(['active', 'closed', undefined] as (LoanStatus | undefined)[]).map((status) => (
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

      {/* Content */}
      {isLoading && (
        <div className="text-center py-12 text-[var(--color-zrho-text-muted)]">Loading loans...</div>
      )}

      {error && (
        <div className="text-center py-12 text-red-400">
          Error loading loans: {(error as Error).message}
        </div>
      )}

      {loans && loans.length === 0 && (
        <div className="text-center py-12">
          <p className="text-[var(--color-zrho-text-muted)] mb-4">No loans yet</p>
          <Link to="/loans/new">
            <Button>Add Your First Loan</Button>
          </Link>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {loans?.map((loan) => (
          <LoanCard key={loan.id} loan={loan} />
        ))}
      </div>
    </div>
  );
}
