import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Landmark, Check, ChevronRight } from 'lucide-react';
import { useLoans } from '@/hooks/useLoans';
import { useLoanPayments } from '@/hooks/useLoanPayments';
import { calculateLoanStats } from '@/lib/calculations';
import { formatCurrency, formatCompactCurrency } from '@/lib/currency';
import { Progress } from '@/components/shared/Progress';
import type { LoanStatus } from '@/types/database.types';
import { motion, AnimatePresence } from 'framer-motion';

export function LoansPage() {
  const [statusFilter, setStatusFilter] = useState<LoanStatus | undefined>('active');
  const { data: loans = [], isLoading, error } = useLoans(statusFilter);

  // Compute overall totals
  const totalOutstanding = useMemo(() => {
    return loans.reduce((sum, l) => sum + l.current_outstanding, 0);
  }, [loans]);

  const defaultCurrency = loans[0]?.currency ?? 'INR';

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <div className="flex items-end justify-between px-1">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Loans</h1>
          <p className="text-xs text-muted-foreground">
            {loans.length} active installment liabilities
          </p>
        </div>
        <div className="text-right max-md:hidden">
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">Total Outstanding</div>
          <div className="text-lg font-bold text-foreground tabular">
            {formatCompactCurrency(totalOutstanding, defaultCurrency)}
          </div>
        </div>
        <Link to="/loans/new" className="md:hidden">
          <button className="rounded-full border border-border bg-surface p-3 transition hover:bg-surface-elevated active:scale-90 text-foreground">
            <Plus size={16} />
          </button>
        </Link>
      </div>

      {/* Modern Filter Badges */}
      <div className="flex gap-1 rounded-full border border-border bg-surface p-1 max-w-xs justify-between items-center">
        {([
          { id: 'active', label: 'Active' },
          { id: 'closed', label: 'Closed' },
          { id: undefined, label: 'All' },
        ] as { id: LoanStatus | undefined; label: string }[]).map((tab) => {
          const active = statusFilter === tab.id;
          return (
            <button
              key={tab.label}
              onClick={() => setStatusFilter(tab.id)}
              className={`relative flex-1 rounded-full px-3 py-1.5 text-xs font-medium transition ${
                active ? 'text-background font-semibold' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {active && (
                <motion.div
                  layoutId="loan-filter-pill"
                  className="absolute inset-0 rounded-full bg-foreground"
                  transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                />
              )}
              <span className="relative z-10">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Desktop addition trigger button */}
      <div className="max-md:hidden flex justify-start">
        <Link to="/loans/new">
          <button className="flex items-center gap-1.5 rounded-full bg-foreground px-4 py-2.5 text-xs font-semibold text-background transition hover:opacity-90 active:scale-95">
            <Plus size={12} /> Add new loan
          </button>
        </Link>
      </div>

      {/* Loading states */}
      {isLoading && (
        <div className="grid gap-6 md:grid-cols-2">
          {[1, 2].map((i) => (
            <div key={i} className="animate-pulse h-48 w-full rounded-3xl bg-surface/50" />
          ))}
        </div>
      )}

      {error && (
        <div className="text-center py-12 text-destructive bg-destructive/5 rounded-3xl border border-destructive/20">
          Error loading installment loans: {(error as Error).message}
        </div>
      )}

      {/* Empty States */}
      {!isLoading && loans.length === 0 && (
        <div className="text-center py-16 border border-dashed border-border rounded-3xl bg-surface/30">
          <Landmark className="mx-auto h-12 w-12 text-muted-foreground/60 stroke-1 mb-4" />
          <p className="text-sm text-muted-foreground mb-4">No active loans found</p>
          <Link to="/loans/new">
            <button className="rounded-full bg-foreground px-5 py-2.5 text-xs font-semibold text-background transition hover:opacity-90 active:scale-95">
              Add Your First Loan
            </button>
          </Link>
        </div>
      )}

      {/* Loan Grid Display */}
      <div className="grid gap-4 md:grid-cols-2">
        <AnimatePresence mode="popLayout">
          {loans.map((loan, index) => (
            <LoanGridItem key={loan.id} loan={loan} index={index} />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

/* ---------------- PRIVATE GRID ITEM COMPONENT ---------------- */

function LoanGridItem({ loan, index }: { loan: any; index: number }) {
  // Query payments internally to get live amortization breakdown
  const { data: payments = [] } = useLoanPayments(loan.id);

  const stats = useMemo(() => {
    return calculateLoanStats(loan, payments);
  }, [loan, payments]);

  const repaidRate = stats.percentPaid / 100;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{
        type: 'spring',
        stiffness: 380,
        damping: 34,
        opacity: { duration: 0.2 }
      }}
    >
      <Link
        to={`/loans/${loan.id}`}
        className="group relative block overflow-hidden rounded-3xl border border-border bg-surface p-6 text-left transition hover:border-foreground/30 active:scale-[0.99] flex flex-col justify-between min-h-[210px] w-full"
      >
        <div className="flex items-start justify-between">
          <div>
            <div className="text-sm font-semibold tracking-wide text-foreground group-hover:text-primary transition-colors">
              {loan.name}
            </div>
            <div className="text-[10px] text-muted-foreground mt-0.5">{loan.lender}</div>
          </div>
          <ChevronRight
            size={16}
            className="text-muted-foreground transition group-hover:translate-x-0.5"
          />
        </div>

        <div className="mt-8 flex items-end justify-between">
          <div>
            <div className="text-[9px] uppercase tracking-widest text-muted-foreground font-semibold">Outstanding</div>
            <div className="text-2xl font-bold tabular text-foreground">
              {formatCurrency(loan.current_outstanding, loan.currency)}
            </div>
          </div>
          <div className="text-right">
            <div className="text-[9px] uppercase tracking-widest text-muted-foreground font-semibold">APR</div>
            <div className="text-base font-semibold tabular text-foreground">{loan.interest_rate.toFixed(2)}%</div>
          </div>
        </div>

        <div className="mt-4">
          <Progress value={repaidRate} />
          <div className="mt-2 flex justify-between text-[10px] text-muted-foreground font-semibold tabular">
            <span>
              {stats.emisPaid} / {loan.tenure_months} EMIs Paid
            </span>
            <span>
              EMI: {formatCurrency(loan.emi_amount, loan.currency)}
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
