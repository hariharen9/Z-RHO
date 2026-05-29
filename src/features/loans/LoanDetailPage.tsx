import { useState, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { DatePicker } from '@/components/ui/DatePicker';
import {
  ArrowLeft,
  Edit,
  Trash2,
  Plus,
  X,
  TrendingDown,
  Calendar,
  Zap,
  Target,
  Flame,
  Check,
  Receipt,
  CircleDollarSign,
  PieChart,
  Home,
  Car,
  GraduationCap,
  Briefcase,
  User,
  Users,
  Coins,
} from 'lucide-react';

const categoryConfig: Record<
  string,
  {
    icon: any;
    color: string;
    bgColor: string;
    glowColor: string;
    label: string;
  }
> = {
  home: {
    icon: Home,
    color: 'text-sky-400',
    bgColor: 'bg-sky-500/10 border-sky-500/20',
    glowColor: 'rgba(56, 189, 248, 0.15)',
    label: 'Home Loan',
  },
  personal: {
    icon: User,
    color: 'text-pink-400',
    bgColor: 'bg-pink-500/10 border-pink-500/20',
    glowColor: 'rgba(244, 63, 94, 0.15)',
    label: 'Personal Loan',
  },
  car: {
    icon: Car,
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/10 border-amber-500/20',
    glowColor: 'rgba(251, 191, 36, 0.15)',
    label: 'Car Loan',
  },
  education: {
    icon: GraduationCap,
    color: 'text-violet-400',
    bgColor: 'bg-violet-500/10 border-violet-500/20',
    glowColor: 'rgba(167, 139, 250, 0.15)',
    label: 'Education Loan',
  },
  business: {
    icon: Briefcase,
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/10 border-emerald-500/20',
    glowColor: 'rgba(52, 211, 153, 0.15)',
    label: 'Business Loan',
  },
  other: {
    icon: Coins,
    color: 'text-indigo-400',
    bgColor: 'bg-indigo-500/10 border-indigo-500/20',
    glowColor: 'rgba(129, 140, 248, 0.15)',
    label: 'Other Loan',
  },
};

// Hooks & Calculations
import { useLoan, useUpdateLoan, useDeleteLoan } from '@/hooks/useLoans';
import { useCards } from '@/hooks/useCards';
import { useCreateTransaction } from '@/hooks/useTransactions';
import { useLoanPayments, useRecordPayment, useRecordPrepayment, useDeletePayment } from '@/hooks/useLoanPayments';
import {
  calculateLoanStats,
  generateAmortizationSchedule,
  calculatePrepaymentImpact,
  getNextEMIDate,
  getDueInfo,
  calculateEMI,
} from '@/lib/calculations';
import { formatCurrency, formatCompactCurrency } from '@/lib/currency';

// Dates
import { format, parseISO, differenceInDays } from 'date-fns';

import { AnimatedNumber } from '@/components/shared/AnimatedNumber';
import { Progress } from '@/components/shared/Progress';

type LoanTab = 'summary' | 'schedule' | 'insights';

export function LoanDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Queries
  const { data: loan, isLoading: loanLoading } = useLoan(id);
  const { data: payments = [], isLoading: paymentsLoading } = useLoanPayments(id);
  const { data: cards, isLoading: cardsLoading } = useCards();

  // Mutations
  const deleteLoan = useDeleteLoan();
  const updateLoan = useUpdateLoan();
  const recordRegularPayment = useRecordPayment();
  const recordPrepayment = useRecordPrepayment();
  const deletePayment = useDeletePayment();
  const createTransaction = useCreateTransaction();

  // States
  const [activeTab, setActiveTab] = useState<LoanTab>('summary');
  const [showPayEMI, setShowPayEMI] = useState(false);
  const [showPrepay, setShowPrepay] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showStatusConfirm, setShowStatusConfirm] = useState(false);
  const [paymentToDelete, setPaymentToDelete] = useState<{ id: string; amount: number; label: string } | null>(null);

  // Math Schedule & Stats
  const schedule = useMemo(() => {
    if (!loan) return [];
    return generateAmortizationSchedule(
      loan.principal_amount,
      loan.interest_rate,
      loan.tenure_months,
      loan.emi_amount,
      loan.start_date,
      payments
    );
  }, [loan, payments]);

  const stats = useMemo(() => {
    if (!loan) return null;
    return calculateLoanStats(loan, payments);
  }, [loan, payments]);

  const linkedCard = useMemo(() => {
    if (!loan?.linked_card_id || !cards) return null;
    return cards.find((c) => c.id === loan.linked_card_id) || null;
  }, [loan?.linked_card_id, cards]);

  // Extract next unpaid EMI month details
  const nextEMI = useMemo(() => {
    return schedule.find((r) => r.status !== 'paid');
  }, [schedule]);

  // Insights prepay what-if simulation scenarios
  const prepayScenarios = useMemo(() => {
    if (!loan || !stats) return [];
    
    const activeEmi = (loan.emi_amount && loan.emi_amount > 0)
      ? loan.emi_amount
      : calculateEMI(loan.principal_amount, loan.interest_rate, loan.tenure_months);

    // Scenarios based on currency
    const opts = [
      { label: '+5K / mo', extra: loan.currency === 'INR' ? 5000 : 50 },
      { label: '+10K / mo', extra: loan.currency === 'INR' ? 10000 : 100 },
      { label: '+25K / mo', extra: loan.currency === 'INR' ? 25000 : 250 },
    ];

    return opts.map((opt) => {
      const impact = calculatePrepaymentImpact(
        loan.current_outstanding,
        loan.interest_rate,
        activeEmi,
        opt.extra,
        stats.emisRemaining
      );
      return {
        label: opt.label,
        monthsSaved: impact.monthsSaved,
        interestSaved: impact.interestSaved,
      };
    });
  }, [loan, stats]);

  if (loanLoading || paymentsLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-44 w-full rounded-3xl bg-surface/50" />
        <div className="grid grid-cols-3 gap-3">
          <div className="h-20 bg-surface/50 rounded-2xl" />
          <div className="h-20 bg-surface/50 rounded-2xl" />
          <div className="h-20 bg-surface/50 rounded-2xl" />
        </div>
        <div className="h-72 w-full bg-surface/50 rounded-3xl" />
      </div>
    );
  }

  if (!loan || !stats) return <div className="text-center py-12 text-destructive">Loan not found</div>;

  const handleDelete = () => {
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    await deleteLoan.mutateAsync(loan.id);
    navigate('/loans');
  };

  const handleToggleStatus = () => {
    setShowStatusConfirm(true);
  };

  const handleToggleStatusConfirm = async () => {
    const nextStatus = loan.status === 'active' ? 'closed' : 'active';
    await updateLoan.mutateAsync({ id: loan.id, status: nextStatus });
  };

  // Completed payments calculations
  const totalRepaidAmount = stats.totalInterestPaid + (loan.principal_amount - loan.current_outstanding);
  const principalPaidRatio = totalRepaidAmount > 0 
    ? (loan.principal_amount - loan.current_outstanding) / totalRepaidAmount 
    : 0;

  const repayProgress = stats.percentPaid / 100;

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      
      {/* Detail Header Back Control Bar */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/loans')}
          className="p-2 rounded-full border border-border bg-surface text-muted-foreground hover:text-foreground transition active:scale-90"
        >
          <ArrowLeft size={16} />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            {loan.name}
            {linkedCard && (
              <span className="px-1.5 py-0.5 rounded text-[9px] uppercase tracking-wider font-bold bg-primary/10 text-primary border border-primary/20 flex items-center gap-1">
                <Zap size={10} /> CC EMI
              </span>
            )}
            {loan.is_third_party && (
              <span className="px-1.5 py-0.5 rounded text-[9px] uppercase tracking-wider font-bold bg-secondary/10 text-secondary border border-secondary/20 flex items-center gap-1">
                <Users size={10} /> Friend: {loan.third_party_name}
              </span>
            )}
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">{loan.lender} · Interest rate: {loan.interest_rate}% p.a.</p>
          {linkedCard && (
            <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1.5">
              Linked to: <span className="font-semibold text-foreground">{linkedCard.name} ({linkedCard.bank} •••• {linkedCard.last_four})</span>
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <Link to={`/loans/${loan.id}/edit`}>
            <button className="rounded-full border border-border bg-surface p-2.5 transition hover:bg-surface-elevated active:scale-95 text-muted-foreground hover:text-foreground">
              <Edit size={14} />
            </button>
          </Link>
          <button
            onClick={handleDelete}
            className="rounded-full border border-border bg-surface p-2.5 transition hover:bg-surface-elevated active:scale-95 text-destructive hover:bg-destructive/10"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Outstanding Summary Hero Card */}
      <div className="relative overflow-hidden rounded-3xl border border-border bg-surface p-6">
        {/* Ambient Top Glow reflection */}
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-64 opacity-50 transition-all duration-500"
          style={{
            background: `radial-gradient(80% 60% at 50% 0%, ${
              categoryConfig[loan.loan_type]?.glowColor || 'var(--foreground)'
            } 5%, transparent 70%)`,
          }}
        />

        {/* Subtle background watermark icon */}
        <div className="absolute right-[-20px] bottom-[-20px] pointer-events-none opacity-[0.03] text-foreground select-none z-0">
          {(() => {
            const IconComponent = categoryConfig[loan.loan_type]?.icon || Coins;
            return <IconComponent className="w-56 h-56 rotate-12" strokeWidth={1} />;
          })()}
        </div>

        <div className="relative z-10 flex items-center justify-between text-foreground">
          <div>
            <div className="text-[9px] uppercase tracking-widest text-muted-foreground font-semibold">Outstanding Balance</div>
            <div className="mt-1 text-3xl font-bold tabular">
              {formatCurrency(loan.current_outstanding, loan.currency)}
            </div>
            <div className="mt-1 text-[10px] text-muted-foreground">
              of {formatCurrency(loan.principal_amount, loan.currency)} Principal · {(repayProgress * 100).toFixed(1)}% repaid
            </div>
          </div>

          {/* Dynamic Category Icon Badge */}
          <div
            className={`flex items-center justify-center p-3.5 rounded-2xl border ${
              categoryConfig[loan.loan_type]?.bgColor || 'bg-border/10 border-border/20'
            } backdrop-blur-md shadow-inner shrink-0`}
          >
            {(() => {
              const IconComponent = categoryConfig[loan.loan_type]?.icon || Coins;
              return (
                <IconComponent
                  className={`w-6 h-6 ${categoryConfig[loan.loan_type]?.color || 'text-foreground'}`}
                  strokeWidth={1.8}
                />
              );
            })()}
          </div>
        </div>

        <div className="relative z-10 mt-6">
          <Progress value={repayProgress} />
        </div>
      </div>

      {/* Numerical Quick Stats Cards */}
      <div className="grid grid-cols-3 gap-2">
        <MiniCard label="APR" value={`${loan.interest_rate.toFixed(2)}%`} />
        <MiniCard label="Tenure" value={`${loan.tenure_months} months`} />
        <MiniCard label="EMIs left" value={`${stats.emisRemaining}`} />
      </div>

      {/* Unified Payment Trigger Buttons */}
      {loan.status === 'active' && (
        <div className="grid grid-cols-2 md:flex gap-2">
          {nextEMI ? (
            <button
              onClick={() => setShowPayEMI(true)}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-2xl bg-foreground py-3.5 text-xs font-semibold text-background transition hover:opacity-90 active:scale-[0.98]"
            >
              <Check size={13} /> {linkedCard ? 'Post EMI to Card' : `Pay EMI #${nextEMI.month}`} · {formatCurrency(nextEMI.emiAmount, loan.currency)}
            </button>
          ) : (
            <div className="flex flex-1 items-center justify-center bg-success/10 text-success rounded-2xl py-3.5 text-xs font-semibold">
              Loan fully settled 🎉
            </div>
          )}

          {loan.current_outstanding > 0 && (
            <button
              onClick={() => setShowPrepay(true)}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-2xl bg-surface border border-border py-3.5 text-xs font-semibold text-foreground transition hover:bg-surface-elevated active:scale-[0.98]"
            >
              <CircleDollarSign size={13} className="text-warning" /> Make Prepayment
            </button>
          )}

          <button
            onClick={handleToggleStatus}
            className="rounded-2xl bg-surface border border-border px-4 py-3.5 text-xs text-muted-foreground hover:text-foreground transition active:scale-95"
          >
            {loan.status === 'active' ? 'Archive Loan' : 'Unarchive Loan'}
          </button>
        </div>
      )}

      {/* Segment Tab Controller */}
      <div className="flex gap-1 rounded-full border border-border bg-surface p-1">
        {([
          { id: 'summary', label: 'Summary', icon: PieChart },
          { id: 'schedule', label: 'Schedule', icon: Calendar },
          { id: 'insights', label: 'Insights', icon: Flame },
        ] as { id: LoanTab; label: string; icon: typeof Flame }[]).map((tab) => {
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative flex-1 rounded-full px-3 py-2 text-xs font-medium transition ${
                active ? 'text-background font-semibold' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {active && (
                <motion.div
                  layoutId="loan-tab-pill"
                  className="absolute inset-0 rounded-full bg-foreground"
                  transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                />
              )}
              <span className="relative z-10 flex items-center justify-center gap-1.5">
                <tab.icon size={12} strokeWidth={2} /> {tab.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* CONTENT WIDGETS */}
      <div className="relative">
        <AnimatePresence mode="wait">
          
          {/* TAB 1: SUMMARY DATA */}
          {activeTab === 'summary' && (
            <motion.div
              key="sum"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="space-y-4"
            >
              {/* Cost splits visual bar */}
              <div className="rounded-3xl border border-border bg-surface p-5 space-y-4">
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                    Repayment component splits
                  </h3>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Ratio of principal repaid vs interest spent</p>
                </div>
                
                <div className="text-2xl font-bold tabular text-foreground">
                  {formatCurrency(totalRepaidAmount, loan.currency)}
                  <span className="text-xs text-muted-foreground font-medium ml-1">total paid to date</span>
                </div>

                <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                  <div className="flex h-full">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${principalPaidRatio * 100}%` }}
                      transition={{ type: 'spring', stiffness: 80, damping: 18 }}
                      className="bg-success h-full"
                    />
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(1 - principalPaidRatio) * 100}%` }}
                      transition={{ type: 'spring', stiffness: 80, damping: 18, delay: 0.05 }}
                      className="bg-warning h-full"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="rounded-2xl border border-border bg-background p-3">
                    <div className="flex items-center gap-1.5 text-[9px] uppercase tracking-widest text-muted-foreground font-semibold">
                      <span className="h-1.5 w-1.5 rounded-full bg-success" /> Principal Component Paid
                    </div>
                    <div className="mt-1 font-bold text-foreground">
                      {formatCurrency(loan.principal_amount - loan.current_outstanding, loan.currency)}
                    </div>
                  </div>
                  <div className="rounded-2xl border border-border bg-background p-3">
                    <div className="flex items-center gap-1.5 text-[9px] uppercase tracking-widest text-muted-foreground font-semibold">
                      <span className="h-1.5 w-1.5 rounded-full bg-warning" /> Interest Component Spent
                    </div>
                    <div className="mt-1 font-bold text-foreground">
                      {formatCurrency(stats.totalInterestPaid, loan.currency)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Payoff projected summary cards */}
              <div className="grid grid-cols-2 gap-3">
                <DetailBox label="Projected Payoff Date" value={stats.emisRemaining > 0 ? format(parseISO(stats.projectedPayoffDate), 'MMMM yyyy') : 'Fully paid'} Icon={Target} />
                <DetailBox label="Total Interest Remaining" value={formatCurrency(stats.totalInterestRemaining, loan.currency)} Icon={TrendingDown} />
              </div>

              {/* Repayment History Log */}
              <div className="rounded-3xl border border-border bg-surface p-5 space-y-4">
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                    Repayment History Log
                  </h3>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Manage and audit all logged EMI payments and prepayments</p>
                </div>

                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                  {payments.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-border p-6 text-center text-xs text-muted-foreground">
                      No payments recorded yet. Click "Pay EMI" above to get started!
                    </div>
                  ) : (
                    [...payments]
                      .sort((a, b) => new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime())
                      .map((p) => {
                        const dateParsed = p.payment_date ? parseISO(p.payment_date) : new Date();
                        return (
                          <div
                            key={p.id}
                            className="group flex items-center justify-between rounded-2xl border border-border bg-background p-3.5 hover:border-foreground/20 transition-all duration-200"
                          >
                            <div className="flex items-center gap-3">
                              <div
                                className={`grid h-8 w-8 shrink-0 place-items-center rounded-xl border ${
                                  p.is_prepayment
                                    ? 'border-warning/30 bg-warning/5 text-warning'
                                    : 'border-success/30 bg-success/5 text-success'
                                }`}
                              >
                                <Receipt size={14} />
                              </div>
                              <div className="min-w-0">
                                <div className="text-xs font-bold text-foreground flex flex-wrap items-center gap-2">
                                  {p.is_prepayment ? (
                                    <span className="px-1.5 py-0.5 rounded-md bg-warning/10 text-warning text-[8px] font-bold uppercase tracking-wider">
                                      Prepayment ({p.prepayment_type === 'full_closure' ? 'Full' : 'Part'})
                                    </span>
                                  ) : (
                                    <span className="px-1.5 py-0.5 rounded-md bg-success/10 text-success text-[8px] font-bold uppercase tracking-wider">
                                      EMI Payment
                                    </span>
                                  )}
                                  <span className="text-[10px] text-muted-foreground font-normal">
                                    {format(dateParsed, 'dd MMM yyyy')}
                                  </span>
                                </div>
                                <div className="text-[10px] text-muted-foreground mt-1 truncate">
                                  P: {formatCurrency(p.principal_component, loan.currency)}
                                  {p.interest_component > 0 && ` · I: ${formatCurrency(p.interest_component, loan.currency)}`}
                                  {p.notes && ` · "${p.notes}"`}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-3 text-right shrink-0">
                              <div>
                                <div className="text-xs font-bold text-foreground">
                                  {formatCurrency(p.amount_paid, loan.currency)}
                                </div>
                                <div className="text-[9px] text-muted-foreground mt-0.5">
                                  Bal: {formatCurrency(p.outstanding_after, loan.currency)}
                                </div>
                              </div>

                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setPaymentToDelete({
                                    id: p.id,
                                    amount: p.amount_paid,
                                    label: p.is_prepayment
                                      ? `Prepayment (${format(dateParsed, 'dd MMM yyyy')})`
                                      : `EMI Payment for ${format(dateParsed, 'dd MMM yyyy')}`,
                                  });
                                }}
                                className="p-1.5 rounded-lg border border-border bg-background hover:bg-destructive/10 text-destructive md:opacity-0 group-hover:opacity-100 transition-all duration-200"
                                title="Delete payment record"
                              >
                                <Trash2 size={11} />
                              </button>
                            </div>
                          </div>
                        );
                      })
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB 2: CHRONOLOGICAL AMORTIZATION TIMELINE */}
          {activeTab === 'schedule' && (
            <motion.div
              key="sch"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="divide-y divide-border/60 overflow-hidden rounded-3xl border border-border bg-surface"
            >
              {schedule.map((row) => {
                const matchingPayment = payments.find((p) => {
                  if (p.is_prepayment) return false;
                  const pMonth = p.emi_month ? format(parseISO(p.emi_month), 'yyyy-MM') : '';
                  const rMonth = row.date ? format(parseISO(row.date), 'yyyy-MM') : '';
                  return pMonth === rMonth;
                });

                return (
                  <div
                    key={row.month}
                    className={`group flex items-center justify-between px-5 py-3.5 text-xs transition-colors duration-200 hover:bg-surface-elevated/20 ${
                      row.status === 'paid' ? 'opacity-70 hover:opacity-100' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`grid h-6 w-6 place-items-center rounded-full text-[9px] font-bold tabular ${
                          row.status === 'paid'
                            ? 'bg-success/15 text-success'
                            : 'bg-secondary text-muted-foreground border border-border'
                        }`}
                      >
                        {row.status === 'paid' ? <Check size={11} /> : row.month}
                      </div>
                      <div>
                        <div className="font-semibold text-foreground flex items-center gap-2">
                          {format(parseISO(row.date), 'MMM yyyy')}
                          {row.status === 'paid' && (
                            <span className="px-1.5 py-0.5 rounded-md bg-success/10 text-success text-[8px] font-bold uppercase tracking-wider">
                              Paid
                            </span>
                          )}
                        </div>
                        <div className="text-[9px] text-muted-foreground mt-0.5">
                          P: {formatCurrency(row.principalComponent, loan.currency)} · I: {formatCurrency(row.interestComponent, loan.currency)}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4 text-right">
                      <div>
                        <div className="font-semibold text-foreground">
                          {formatCurrency(row.emiAmount, loan.currency)}
                        </div>
                        <div className="text-[9px] text-muted-foreground mt-0.5">
                          Bal: {formatCurrency(row.outstandingBalance, loan.currency)}
                        </div>
                      </div>

                      {row.status === 'paid' && matchingPayment && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setPaymentToDelete({
                              id: matchingPayment.id,
                              amount: matchingPayment.amount_paid,
                              label: `EMI Payment for ${format(parseISO(row.date), 'MMMM yyyy')}`,
                            });
                          }}
                          className="p-1.5 rounded-lg border border-border bg-background hover:bg-destructive/10 text-destructive md:opacity-0 group-hover:opacity-100 transition-all duration-200"
                          title="Delete EMI payment"
                        >
                          <Trash2 size={11} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </motion.div>
          )}

          {/* TAB 3: INSIGHTS SCENARIOS */}
          {activeTab === 'insights' && (
            <motion.div
              key="ins"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="space-y-4"
            >
              {/* Cost of Borrowing Card */}
              <div className="rounded-3xl border border-border bg-surface p-5 space-y-4">
                <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                  <Receipt size={13} /> Total Borrowing Cost Analytics
                </h3>
                <div className="text-2xl font-bold text-foreground">
                  {formatCurrency(loan.total_interest_payable, loan.currency)}
                  <span className="text-xs text-muted-foreground font-medium ml-1.5">expected interest overall</span>
                </div>
                <div className="text-[10px] text-muted-foreground leading-relaxed">
                  Historical savings to date: <span className="text-success font-bold">{formatCurrency(stats.interestSaved, loan.currency)}</span>. This was achieved by principal prepayments shortening your tenure schedules.
                </div>
                <div>
                  <div className="flex justify-between text-[10px] text-muted-foreground mb-1.5 font-semibold">
                    <span>Paid Interest Progress</span>
                    <span>{((stats.totalInterestPaid / (loan.total_interest_payable || 1)) * 100).toFixed(0)}%</span>
                  </div>
                  <Progress value={stats.totalInterestPaid / (loan.total_interest_payable || 1)} color="var(--color-warning)" />
                </div>
              </div>

              {/* Prepay What-If Scenarios List */}
              <div className="rounded-3xl border border-border bg-surface p-5 space-y-4">
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                    <Zap size={13} className="text-warning" /> Continuous Prepayment Scenarios
                  </h3>
                  <p className="text-[10px] text-muted-foreground mt-0.5">What-if projections for contributing additional cash each month</p>
                </div>

                {prepayScenarios.length > 0 ? (
                  <div className="space-y-2">
                    {prepayScenarios.map((scen: any) => (
                      <div
                        key={scen.label}
                        className="flex items-center justify-between rounded-2xl border border-border bg-background p-3.5"
                      >
                        <div className="text-xs font-bold text-foreground">{scen.label}</div>
                        <div className="text-right">
                          <div className="text-xs font-bold text-success">
                            −{formatCurrency(scen.interestSaved, loan.currency)}
                          </div>
                          <div className="text-[9px] text-muted-foreground mt-0.5">
                            {scen.monthsSaved} months tenure saved
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-xs text-muted-foreground py-2">Loan has been fully paid and closed.</div>
                )}
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      {/* POPUP MODAL 1: PAY MONTHLY EMI (SUPABASE ENHANCED) */}
      <AnimatePresence>
        {showPayEMI && nextEMI && (
          <PayEMIDialog
            loan={loan}
            nextEMI={nextEMI}
            onClose={() => setShowPayEMI(false)}
            onConfirm={async (extraAmount, paymentDate, notes) => {
              // Record standard EMI payment first
              await recordRegularPayment.mutateAsync({
                loan_id: loan.id,
                payment_date: paymentDate,
                emi_month: nextEMI.date,
                amount_paid: nextEMI.emiAmount,
                current_outstanding: loan.current_outstanding,
                annual_rate: loan.interest_rate,
                notes: notes || undefined,
              });

              // Record extra prepayment component if toggled
              if (extraAmount > 0) {
                await recordPrepayment.mutateAsync({
                  loan_id: loan.id,
                  payment_date: paymentDate,
                  amount: extraAmount,
                  current_outstanding: loan.current_outstanding - nextEMI.principalComponent, // balance after regular principal deduction
                  annual_rate: loan.interest_rate,
                  prepayment_type: 'part_prepayment',
                  notes: notes ? `Prepayment bonus: ${notes}` : 'EMI prepayment payload',
                });
              }

              // Post CC Transaction if this is a linked loan
              if (linkedCard) {
                await createTransaction.mutateAsync({
                  card_id: linkedCard.id,
                  amount: nextEMI.emiAmount + extraAmount,
                  transaction_type: 'debit',
                  category: 'EMI',
                  merchant: `${loan.name} EMI #${nextEMI.month}`,
                  note: `Auto-posted from Linked Loan: ${loan.name}`,
                  transaction_date: paymentDate,
                  statement_day: linkedCard.statement_day,
                });
              }

              setShowPayEMI(false);
            }}
          />
        )}
      </AnimatePresence>

      {/* POPUP MODAL 2: CUSTOM PREPAYMENT PRINCIPAL */}
      <AnimatePresence>
        {showPrepay && (
          <PrepayDialog
            loan={loan}
            stats={stats}
            onClose={() => setShowPrepay(false)}
            onConfirm={async (amountPaid, typePaid, datePaid, notesPaid) => {
              await recordPrepayment.mutateAsync({
                loan_id: loan.id,
                payment_date: datePaid,
                amount: amountPaid,
                current_outstanding: loan.current_outstanding,
                annual_rate: loan.interest_rate,
                prepayment_type: typePaid,
                notes: notesPaid || undefined,
              });
              setShowPrepay(false);
            }}
          />
        )}
      </AnimatePresence>

      <ConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Loan Profile"
        message="Are you sure you want to delete this loan profile and all associated repayment history? This is permanent and cannot be undone."
        confirmText="Delete permanently"
        variant="danger"
      />

      <ConfirmModal
        isOpen={showStatusConfirm}
        onClose={() => setShowStatusConfirm(false)}
        onConfirm={handleToggleStatusConfirm}
        title={loan.status === 'active' ? 'Archive Loan' : 'Unarchive Loan'}
        message={`Are you sure you want to mark this loan as ${loan.status === 'active' ? 'closed' : 'active'}?`}
        confirmText={loan.status === 'active' ? 'Archive' : 'Activate'}
        variant={loan.status === 'active' ? 'warning' : 'success'}
      />

      <ConfirmModal
        isOpen={!!paymentToDelete}
        onClose={() => setPaymentToDelete(null)}
        onConfirm={async () => {
          if (paymentToDelete) {
            await deletePayment.mutateAsync({ id: paymentToDelete.id, loan_id: loan.id });
            setPaymentToDelete(null);
          }
        }}
        title="Delete Repayment Record"
        message={`Are you sure you want to delete the record of "${
          paymentToDelete?.label || ''
        }" for ${
          paymentToDelete ? formatCurrency(paymentToDelete.amount, loan.currency) : ''
        }? This is permanent, cannot be undone, and will restore the loan's outstanding balance.`}
        confirmText="Delete record"
        variant="danger"
      />

    </div>
  );
}

/* ---------------- PRIVATE SUB WIDGET MINI STATS CARD ---------------- */

function MiniCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-surface-elevated/40 p-4 flex flex-col justify-between min-h-[76px] backdrop-blur">
      <div className="text-[9px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="mt-1.5 text-sm font-bold tabular text-foreground">
        {value}
      </div>
    </div>
  );
}

function DetailBox({ label, value, Icon }: { label: string; value: string; Icon: any }) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-4">
      <div className="flex items-center gap-1.5 text-[9px] uppercase tracking-widest text-muted-foreground font-semibold">
        <Icon size={12} strokeWidth={2} /> {label}
      </div>
      <div className="mt-1.5 font-bold text-foreground text-sm">{value}</div>
    </div>
  );
}

/* ---------------- DIALOG 1: RECORD MONTHLY EMI SHEET ---------------- */

function PayEMIDialog({
  loan,
  nextEMI,
  onClose,
  onConfirm,
}: {
  loan: any;
  nextEMI: any;
  onClose: () => void;
  onConfirm: (extra: number, date: string, notes: string) => void;
}) {
  const [extraOn, setExtraOn] = useState(false);
  const [extraStr, setExtraStr] = useState(loan.currency === 'INR' ? '10,000' : '200');
  const [payDate, setPayDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [notes, setNotes] = useState('');

  const extraVal = extraOn ? parseFloat(extraStr.replace(/,/g, '')) || 0 : 0;

  const activeEmi = (loan.emi_amount && loan.emi_amount > 0)
    ? loan.emi_amount
    : calculateEMI(loan.principal_amount, loan.interest_rate, loan.tenure_months);

  // Real prepay impact calculation inside log sheet
  const sim = useMemo(() => {
    const baseline = calculatePrepaymentImpact(
      loan.current_outstanding,
      loan.interest_rate,
      activeEmi,
      0,
      12 // placeholder
    );
    const withExtra = calculatePrepaymentImpact(
      loan.current_outstanding,
      loan.interest_rate,
      activeEmi,
      extraVal,
      12
    );
    return {
      monthsSaved: baseline.monthsSaved - withExtra.monthsSaved, // approximate
      interestSaved: Math.max(0, baseline.interestSaved - withExtra.interestSaved),
    };
  }, [extraVal, loan, activeEmi]);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={onClose} />
      
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 320 }}
        className="relative z-10 w-full max-w-lg rounded-t-3xl border border-border bg-surface p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] shadow-2xl"
      >
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-border" />
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-foreground">Log Scheduled EMI Payment</h3>
            <p className="text-[10px] text-muted-foreground">Month {nextEMI.month} · {format(parseISO(nextEMI.date), 'MMMM yyyy')}</p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X size={16} />
          </button>
        </div>

        <div className="space-y-3">
          {/* Base EMI Card */}
          <div className="rounded-2xl border border-border bg-background p-4">
            <div className="text-[9px] uppercase tracking-widest text-muted-foreground font-semibold">Scheduled EMI amount</div>
            <div className="text-2xl font-bold tabular text-foreground mt-1">
              {formatCurrency(nextEMI.emiAmount, loan.currency)}
            </div>
            <div className="mt-2 flex justify-between text-[10px] text-muted-foreground tabular font-semibold">
              <span>Principal Portion: {formatCurrency(nextEMI.principalComponent, loan.currency)}</span>
              <span>Interest Portion: {formatCurrency(nextEMI.interestComponent, loan.currency)}</span>
            </div>
          </div>

          {/* Payment Date Input */}
          <div className="grid grid-cols-2 gap-3">
            <DatePicker
              label="Record Payment Date"
              value={payDate}
              onChange={setPayDate}
            />
            <div className="rounded-2xl border border-border bg-background p-3.5 flex flex-col justify-center">
              <label className="block text-[9px] uppercase tracking-widest text-muted-foreground font-semibold mb-1">
                Short Notes
              </label>
              <input
                placeholder="Log details..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-transparent text-xs outline-none text-foreground placeholder:text-muted-foreground/30"
              />
            </div>
          </div>

          {/* Extra Principal Payment Toggle */}
          <div className="rounded-2xl border border-border bg-background p-4 flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-foreground">Add Extra Principal Component?</div>
              <div className="text-[10px] text-muted-foreground mt-0.5">Reduces loan tenure and interest charges</div>
            </div>
            <button
              onClick={() => setExtraOn(!extraOn)}
              className={`relative h-5 w-9 rounded-full transition-all ${extraOn ? 'bg-success' : 'bg-secondary'}`}
            >
              <motion.div
                animate={{ x: extraOn ? 18 : 2 }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                className="absolute top-0.5 h-4 w-4 rounded-full bg-foreground"
              />
            </button>
          </div>

          {/* Prepayment Input Block */}
          {extraOn && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              className="rounded-2xl border border-border bg-background p-4 space-y-3"
            >
              <div className="text-[9px] uppercase tracking-widest text-muted-foreground font-semibold">Extra Principal Contribution</div>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground font-semibold">{loan.currency}</span>
                <input
                  type="text"
                  value={extraStr}
                  onChange={(e) => setExtraStr(e.target.value)}
                  className="w-full bg-transparent text-xl font-bold tabular outline-none text-foreground"
                />
              </div>
            </motion.div>
          )}
        </div>

        <button
          onClick={() => onConfirm(extraVal, payDate, notes)}
          className="mt-5 w-full rounded-2xl bg-foreground py-4 text-xs font-bold text-background transition hover:opacity-90 active:scale-[0.98]"
        >
          Log EMI Payment
        </button>
      </motion.div>
    </div>
  );
}

/* ---------------- DIALOG 2: CUSTOM PREPAYMENT SHEET ---------------- */

function PrepayDialog({
  loan,
  stats,
  onClose,
  onConfirm,
}: {
  loan: any;
  stats: any;
  onClose: () => void;
  onConfirm: (amt: number, type: 'part_prepayment' | 'full_closure', date: string, notes: string) => void;
}) {
  const [prepayAmt, setPrepayAmt] = useState(loan.currency === 'INR' ? '25000' : '500');
  const [type, setType] = useState<'part_prepayment' | 'full_closure'>('part_prepayment');
  const [payDate, setPayDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [notes, setNotes] = useState('');

  const numericPrepay = parseFloat(prepayAmt) || 0;
  const isFullClosure = type === 'full_closure';

  // Automatically set prepayment amount to current outstanding if full closure
  const finalPrepayAmt = isFullClosure ? loan.current_outstanding : numericPrepay;

  const activeEmi = (loan.emi_amount && loan.emi_amount > 0)
    ? loan.emi_amount
    : calculateEMI(loan.principal_amount, loan.interest_rate, loan.tenure_months);

  // Real prepayment impact calculation inside prepay modal
  const sim = useMemo(() => {
    if (isFullClosure) return { interestSaved: Math.max(0, stats.totalInterestRemaining), monthsSaved: stats.emisRemaining };
    return calculatePrepaymentImpact(
      loan.current_outstanding,
      loan.interest_rate,
      activeEmi,
      finalPrepayAmt,
      stats.emisRemaining
    );
  }, [finalPrepayAmt, isFullClosure, loan, stats, activeEmi]);

  const valid = finalPrepayAmt > 0 && finalPrepayAmt <= loan.current_outstanding;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={onClose} />
      
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 320 }}
        className="relative z-10 w-full max-w-lg rounded-t-3xl border border-border bg-surface p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] shadow-2xl"
      >
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-border" />
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-foreground">Make Principal Prepayment</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X size={16} />
          </button>
        </div>

        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setType('part_prepayment')}
            className={`flex-1 py-2 rounded-xl text-xs font-semibold border transition ${
              !isFullClosure
                ? 'border-warning/40 bg-warning/10 text-warning'
                : 'border-border bg-background text-muted-foreground'
            }`}
          >
            Partial Prepay (Tenure Reduction)
          </button>
          <button
            onClick={() => setType('full_closure')}
            className={`flex-1 py-2 rounded-xl text-xs font-semibold border transition ${
              isFullClosure
                ? 'border-success/40 bg-success/10 text-success'
                : 'border-border bg-background text-muted-foreground'
            }`}
          >
            Full Loan Closure (Settle Outstanding)
          </button>
        </div>

        <div className="space-y-3">
          {/* Prepayment amount */}
          <div className="rounded-2xl border border-border bg-background p-4">
            <div className="text-[9px] uppercase tracking-widest text-muted-foreground font-semibold">Prepayment Amount</div>
            <div className="mt-1 flex items-center gap-2">
              <span className="text-muted-foreground font-semibold">{loan.currency}</span>
              <input
                disabled={isFullClosure}
                type="number"
                value={isFullClosure ? loan.current_outstanding : prepayAmt}
                onChange={(e) => setPrepayAmt(e.target.value)}
                className="w-full bg-transparent text-2xl font-bold tabular outline-none text-foreground placeholder:text-muted-foreground/30 disabled:opacity-75"
              />
            </div>
          </div>

          {/* Impact Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-success/10 border border-success/35 p-3">
              <div className="flex items-center gap-1 text-[9px] uppercase tracking-widest text-success font-semibold">
                <TrendingDown size={10} /> Interest Saved
              </div>
              <div className="mt-1 font-bold text-success text-sm tabular">
                {formatCurrency(sim.interestSaved, loan.currency)}
              </div>
            </div>
            <div className="rounded-2xl bg-secondary border border-border p-3">
              <div className="flex items-center gap-1 text-[9px] uppercase tracking-widest text-muted-foreground font-semibold">
                <Zap size={10} /> Months Saved
              </div>
              <div className="mt-1 font-bold text-foreground text-sm tabular">
                {sim.monthsSaved} months
              </div>
            </div>
          </div>

          {/* Record payment date & notes */}
          <div className="grid grid-cols-2 gap-3">
            <DatePicker
              label="Prepayment Record Date"
              value={payDate}
              onChange={setPayDate}
            />
            <div className="rounded-2xl border border-border bg-background p-3.5 flex flex-col justify-center">
              <label className="block text-[9px] uppercase tracking-widest text-muted-foreground font-semibold mb-1">
                Short Notes
              </label>
              <input
                placeholder="Log details..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-transparent text-xs outline-none text-foreground placeholder:text-muted-foreground/30"
              />
            </div>
          </div>
        </div>

        <button
          onClick={() => valid && onConfirm(finalPrepayAmt, type, payDate, notes)}
          disabled={!valid}
          className="mt-5 w-full rounded-2xl bg-foreground py-4 text-xs font-bold text-background transition hover:opacity-90 active:scale-[0.98] disabled:opacity-40"
        >
          Confirm Prepayment Settle
        </button>
      </motion.div>
    </div>
  );
}
