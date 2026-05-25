// ============================================================
// ZRHO — Loans: Loan Detail Page
// ============================================================

import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Edit, Trash2, ArrowLeft } from 'lucide-react';
import { useLoan, useUpdateLoan, useDeleteLoan } from '@/hooks/useLoans';
import { useLoanPayments } from '@/hooks/useLoanPayments';
import { calculateLoanStats, generateAmortizationSchedule, getNextEMIDate, getDueInfo } from '@/lib/calculations';
import { formatCurrency } from '@/lib/currency';
import { formatDate } from '@/lib/dates';
import { LOAN_TYPE_LABELS } from '@/lib/constants';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { AmountDisplay } from '@/components/shared/AmountDisplay';
import { DateCountdown } from '@/components/shared/DateCountdown';
import { AmortizationTable } from './AmortizationTable';
import { LoanPaymentHistory } from './LoanPaymentHistory';
import { MarkEmiPaidModal } from './MarkEmiPaidModal';
import { PrepaymentModal } from './PrepaymentModal';

export function LoanDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: loan, isLoading } = useLoan(id);
  const { data: payments = [] } = useLoanPayments(id);
  const deleteLoan = useDeleteLoan();
  const updateLoan = useUpdateLoan();

  const [showEmiModal, setShowEmiModal] = useState(false);
  const [showPrepaymentModal, setShowPrepaymentModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'schedule' | 'history'>('schedule');

  if (isLoading) {
    return <div className="text-center py-12 text-[var(--color-zrho-text-muted)]">Loading...</div>;
  }

  if (!loan) {
    return <div className="text-center py-12 text-red-400">Loan not found</div>;
  }

  const stats = calculateLoanStats(loan, payments);
  const schedule = generateAmortizationSchedule(
    loan.principal_amount,
    loan.interest_rate,
    loan.tenure_months,
    loan.emi_amount,
    loan.start_date,
    payments
  );

  const nextEMIDate = getNextEMIDate(loan.emi_day);
  const nextEMIDue = getDueInfo(nextEMIDate);

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this loan? This cannot be undone.')) {
      await deleteLoan.mutateAsync(loan.id);
      navigate('/loans');
    }
  };

  const handleCloseLoan = async () => {
    if (confirm('Mark this loan as closed?')) {
      await updateLoan.mutateAsync({ id: loan.id, status: 'closed' });
    }
  };

  const statusVariant =
    loan.status === 'active' ? 'success' : loan.status === 'paused' ? 'warning' : 'default';

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/loans')} className="p-2 rounded-lg hover:bg-[var(--color-zrho-surface-2)]">
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">{loan.name}</h1>
            <Badge variant={statusVariant}>{loan.status}</Badge>
          </div>
          <p className="text-sm text-[var(--color-zrho-text-muted)]">
            {loan.lender} · {LOAN_TYPE_LABELS[loan.loan_type]}
          </p>
        </div>
        <div className="flex gap-2">
          <Link to={`/loans/${loan.id}/edit`}>
            <Button variant="ghost" size="sm"><Edit size={16} /></Button>
          </Link>
          <Button variant="ghost" size="sm" onClick={handleDelete}>
            <Trash2 size={16} className="text-red-400" />
          </Button>
        </div>
      </div>

      {/* Outstanding + Progress */}
      <Card className="mb-6">
        <div className="flex items-end justify-between mb-4">
          <div>
            <p className="text-sm text-[var(--color-zrho-text-muted)]">Outstanding Balance</p>
            <AmountDisplay amount={loan.current_outstanding} currency={loan.currency} size="xl" />
          </div>
          <div className="text-right">
            <p className="text-sm text-[var(--color-zrho-text-muted)]">Original Principal</p>
            <AmountDisplay amount={loan.principal_amount} currency={loan.currency} size="md" />
          </div>
        </div>
        <ProgressBar value={stats.percentPaid} color="var(--color-zrho-success)" />
        <p className="text-xs text-[var(--color-zrho-text-muted)] mt-1">
          {loan.interest_rate}% p.a. · {loan.tenure_months} months
        </p>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <Card>
          <p className="text-xs text-[var(--color-zrho-text-muted)]">EMIs Paid</p>
          <p className="text-lg font-semibold">{stats.emisPaid} / {loan.tenure_months}</p>
        </Card>
        <Card>
          <p className="text-xs text-[var(--color-zrho-text-muted)]">Interest Paid</p>
          <p className="text-lg font-semibold">{formatCurrency(stats.totalInterestPaid, loan.currency)}</p>
        </Card>
        <Card>
          <p className="text-xs text-[var(--color-zrho-text-muted)]">Interest Remaining</p>
          <p className="text-lg font-semibold">{formatCurrency(stats.totalInterestRemaining, loan.currency)}</p>
        </Card>
        <Card>
          <p className="text-xs text-[var(--color-zrho-text-muted)]">Interest Saved</p>
          <p className="text-lg font-semibold text-green-400">{formatCurrency(stats.interestSaved, loan.currency)}</p>
        </Card>
      </div>

      {/* Next EMI */}
      {loan.status === 'active' && (
        <Card className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[var(--color-zrho-text-muted)]">Next EMI</p>
              <AmountDisplay amount={loan.emi_amount} currency={loan.currency} size="lg" />
              <div className="flex items-center gap-2 mt-1">
                <span className="text-sm text-[var(--color-zrho-text-muted)]">{formatDate(nextEMIDate)}</span>
                <DateCountdown dueDate={nextEMIDate} />
              </div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={() => setShowEmiModal(true)}>
                Mark as Paid
              </Button>
              <Button size="sm" variant="secondary" onClick={() => setShowPrepaymentModal(true)}>
                Prepay
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Close Loan Action */}
      {loan.status === 'active' && (
        <div className="mb-6">
          <Button variant="secondary" size="sm" onClick={handleCloseLoan}>
            Close Loan
          </Button>
        </div>
      )}

      {/* Tabs: Schedule / History */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setActiveTab('schedule')}
          className={`px-4 py-2 text-sm rounded-lg ${
            activeTab === 'schedule'
              ? 'bg-[var(--color-zrho-accent)] text-white'
              : 'bg-[var(--color-zrho-surface-2)] text-[var(--color-zrho-text-muted)]'
          }`}
        >
          Amortization Schedule
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`px-4 py-2 text-sm rounded-lg ${
            activeTab === 'history'
              ? 'bg-[var(--color-zrho-accent)] text-white'
              : 'bg-[var(--color-zrho-surface-2)] text-[var(--color-zrho-text-muted)]'
          }`}
        >
          Payment History ({payments.length})
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'schedule' && (
        <Card>
          <AmortizationTable schedule={schedule} currency={loan.currency} />
        </Card>
      )}

      {activeTab === 'history' && (
        <LoanPaymentHistory payments={payments} currency={loan.currency} />
      )}

      {/* Modals */}
      <MarkEmiPaidModal
        isOpen={showEmiModal}
        onClose={() => setShowEmiModal(false)}
        loanId={loan.id}
        emiAmount={loan.emi_amount}
        currentOutstanding={loan.current_outstanding}
        annualRate={loan.interest_rate}
        currency={loan.currency}
      />

      <PrepaymentModal
        isOpen={showPrepaymentModal}
        onClose={() => setShowPrepaymentModal(false)}
        loanId={loan.id}
        currentOutstanding={loan.current_outstanding}
        annualRate={loan.interest_rate}
        emiAmount={loan.emi_amount}
        remainingMonths={stats.emisRemaining}
        currency={loan.currency}
      />
    </div>
  );
}
