import { useState, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { DatePicker } from '@/components/ui/DatePicker';
import { CardNetworkLogo } from '@/components/shared/CardNetworkLogo';
import { BankLogo } from '@/components/shared/BankLogo';
import {
  ArrowLeft,
  Edit,
  Trash2,
  Plus,
  X,
  TrendingDown,
  Calendar,
  Zap,
  MoreHorizontal,
  UtensilsCrossed,
  Cpu,
  Plane,
  Fuel,
  Bolt,
  ShoppingBag,
  Tv,
  HeartPulse,
  Award,
  CircleDollarSign,
  Briefcase,
  ChevronRight,
  Check,
} from 'lucide-react';

// Hooks & Calculations
import { useCard, useDeleteCard, useUpdateCard } from '@/hooks/useCards';
import { useAllCardTransactions, useCreateTransaction, useDeleteTransaction } from '@/hooks/useTransactions';
import { useBills, useMarkBillPaid } from '@/hooks/useBills';
import { calculateCCUtilization, calculateCurrentBalance, calculateBillDates, getDueInfo } from '@/lib/calculations';
import { formatCurrency, formatCompactCurrency } from '@/lib/currency';
import { CARD_NETWORK_LABELS } from '@/lib/constants';

// Components & UI Elements
import { Progress } from '@/components/shared/Progress';
import { AnimatedNumber } from '@/components/shared/AnimatedNumber';

// dates
import { format, parseISO, differenceInDays, startOfMonth, addMonths } from 'date-fns';

type CardTab = 'overview' | 'transactions' | 'insights';

const CATEGORY_ICONS: Record<string, any> = {
  'Food & Dining': UtensilsCrossed,
  'Travel & Transport': Plane,
  'Shopping & Retail': ShoppingBag,
  'Fuel': Fuel,
  'Bills & Utilities': Bolt,
  'Entertainment & Leisure': Tv,
  'Health & Medical': HeartPulse,
  'Subscriptions & Services': Cpu,
  'Education': Briefcase,
  'Other': MoreHorizontal,
};

export function CardDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Queries
  const { data: card, isLoading: cardLoading } = useCard(id);
  const { data: transactions = [] } = useAllCardTransactions(id);
  const { data: bills = [] } = useBills(id);

  // Mutations
  const deleteCard = useDeleteCard();
  const updateCard = useUpdateCard();
  const markBillPaid = useMarkBillPaid();
  const deleteTx = useDeleteTransaction();

  // States
  const [activeTab, setActiveTab] = useState<CardTab>('overview');
  const [showAddTx, setShowAddTx] = useState(false);
  const [showPayBill, setShowPayBill] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showStatusConfirm, setShowStatusConfirm] = useState(false);
  const [txToDelete, setTxToDelete] = useState<string | null>(null);

  // Calculate Balances & Ratios
  const currentBalance = useMemo(() => calculateCurrentBalance(transactions), [transactions]);
  const utilizationRate = useMemo(() => {
    if (!card) return 0;
    return calculateCCUtilization(Math.max(0, currentBalance), card.credit_limit) / 100;
  }, [card, currentBalance]);

  const availableLimit = useMemo(() => {
    if (!card) return 0;
    return Math.max(0, card.credit_limit - Math.max(0, currentBalance));
  }, [card, currentBalance]);

  // Billing Cycle Computations
  const billingDates = useMemo(() => {
    if (!card) return null;
    const now = new Date();
    const nextBillingMonth = format(
      now.getDate() > card.statement_day ? startOfMonth(addMonths(now, 1)) : startOfMonth(now),
      'yyyy-MM-dd'
    );
    const { statementDate, dueDate } = calculateBillDates(card.statement_day, card.due_day, nextBillingMonth);
    const daysToDue = differenceInDays(new Date(dueDate), now);
    return {
      statementDate,
      dueDate,
      daysToDue,
    };
  }, [card]);

  // Extract primary unpaid bill
  const activeBill = useMemo(() => {
    return bills.find((b) => b.status !== 'paid');
  }, [bills]);

  // Compute spend analytics
  const insights = useMemo(() => {
    const byCat = new Map<string, number>();
    const byMerchant = new Map<string, number>();
    let total = 0;

    for (const t of transactions) {
      if (t.transaction_type === 'debit') {
        byCat.set(t.category, (byCat.get(t.category) ?? 0) + t.amount);
        if (t.merchant) {
          byMerchant.set(t.merchant, (byMerchant.get(t.merchant) ?? 0) + t.amount);
        }
        total += t.amount;
      }
    }

    const categories = [...byCat.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([cat, amt]) => ({
        category: cat,
        amount: amt,
        percentage: total > 0 ? amt / total : 0,
      }));

    const merchants = [...byMerchant.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([merchant, amt]) => ({
        merchant,
        amount: amt,
      }));

    return { categories, merchants, total };
  }, [transactions]);

  if (cardLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-48 w-full rounded-3xl bg-surface/50" />
        <div className="h-10 w-64 bg-surface/50 rounded-full" />
        <div className="h-44 w-full bg-surface/50 rounded-3xl" />
      </div>
    );
  }

  if (!card) return <div className="text-center py-12 text-destructive">Card not found</div>;

  const handleDelete = () => {
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    await deleteCard.mutateAsync(card.id);
    navigate('/cards');
  };

  const handleToggleStatus = () => {
    setShowStatusConfirm(true);
  };

  const handleToggleStatusConfirm = async () => {
    const nextStatus = card.status === 'active' ? 'closed' : 'active';
    await updateCard.mutateAsync({ id: card.id, status: nextStatus });
  };

  const handleDeleteTransaction = (txId: string) => {
    setTxToDelete(txId);
  };

  const handleDeleteTxConfirm = async () => {
    if (txToDelete) {
      await deleteTx.mutateAsync({ id: txToDelete, card_id: card.id });
      setTxToDelete(null);
    }
  };

  // Cycle Progress (30-day percentage estimate)
  const cycleProgress = billingDates ? Math.min(1, Math.max(0, (30 - billingDates.daysToDue) / 30)) : 0;

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      
      {/* Detail Header Back Buttons */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/cards')}
          className="p-2 rounded-full border border-border bg-surface text-muted-foreground hover:text-foreground transition active:scale-90"
        >
          <ArrowLeft size={16} />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold tracking-tight text-foreground">{card.name}</h1>
          <p className="text-xs text-muted-foreground">{card.bank} · •••• {card.last_four}</p>
        </div>
        <div className="flex gap-2">
          <Link to={`/cards/${card.id}/edit`}>
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

      {/* Credit Card Physical Visualization Frame */}
      <div
        className="relative overflow-hidden rounded-3xl p-6 min-h-[220px] flex flex-col justify-between shadow-2xl border border-white/10"
        style={{
          background: `linear-gradient(135deg, ${card.color} 0%, color-mix(in oklab, ${card.color} 45%, black) 100%)`,
        }}
      >
        {/* Light sheen layer reflection */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(255,255,255,0.18),transparent_60%)] pointer-events-none" />

        <div className="relative flex items-center justify-between text-white z-10">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-white/10 backdrop-blur border border-white/15 flex items-center justify-center shrink-0">
              <BankLogo bankName={card.bank} size={20} className="text-white" />
            </div>
            <div>
              <div className="text-sm font-bold tracking-wide leading-tight">{card.name}</div>
              <div className="text-[10px] uppercase tracking-widest opacity-75 font-semibold font-sans leading-none mt-1">
                {card.bank}
              </div>
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur border border-white/15 px-3.5 py-2 rounded-xl flex items-center justify-center shrink-0">
            <CardNetworkLogo network={card.card_network} size={20} className="text-white" />
          </div>
        </div>

        <div className="relative flex items-end justify-between text-white mt-8">
          <div>
            <div className="text-[9px] uppercase tracking-widest text-white/50 font-semibold">Current Outstanding</div>
            <div className="text-3xl font-bold tabular">
              {formatCurrency(Math.max(0, currentBalance), card.currency)}
            </div>
          </div>

          {/* Billing Cycle Rings Indicator */}
          {billingDates && (
            <div className="relative flex h-14 w-14 items-center justify-center">
              <svg width="56" height="56" className="-rotate-90">
                <circle cx="28" cy="28" r="24" stroke="rgba(255,255,255,0.06)" strokeWidth="4" fill="none" />
                <motion.circle
                  cx="28"
                  cy="28"
                  r="24"
                  stroke={billingDates.daysToDue <= 5 ? 'var(--color-destructive)' : 'rgba(255,255,255,0.7)'}
                  strokeWidth="4"
                  fill="none"
                  strokeDasharray={2 * Math.PI * 24}
                  initial={{ strokeDashoffset: 2 * Math.PI * 24 }}
                  animate={{ strokeDashoffset: 2 * Math.PI * 24 * (1 - cycleProgress) }}
                  transition={{ type: 'spring', stiffness: 60, damping: 18 }}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className={`text-xs font-bold leading-none ${billingDates.daysToDue <= 5 ? 'text-destructive-foreground' : ''}`}>
                  {billingDates.daysToDue}d
                </span>
                <span className="text-[6px] uppercase tracking-widest text-white/50">due</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Numerical Financial Summary Boxes */}
      <div className="grid grid-cols-3 gap-2">
        <MiniCard
          label="Statement balance"
          value={activeBill ? formatCurrency(activeBill.statement_amount, card.currency) : formatCurrency(0, card.currency)}
          accent={activeBill && activeBill.statement_amount > 0}
        />
        <MiniCard
          label="Available Limit"
          value={formatCurrency(availableLimit, card.currency)}
        />
        <MiniCard
          label="Repay Utilization"
          value={`${(utilizationRate * 100).toFixed(1)}%`}
          accent={utilizationRate > 0.3}
        />
      </div>

      {/* Main Action Triggers */}
      <div className="grid grid-cols-2 md:flex gap-2">
        <button
          onClick={() => setShowAddTx(true)}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-2xl bg-foreground py-3.5 text-xs font-semibold text-background transition hover:opacity-90 active:scale-[0.98]"
        >
          <Plus size={13} /> Add Transaction
        </button>

        {activeBill && activeBill.status !== 'paid' && (
          <button
            onClick={() => setShowPayBill(true)}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-2xl bg-surface border border-border py-3.5 text-xs font-semibold text-foreground transition hover:bg-surface-elevated active:scale-[0.98]"
          >
            <CircleDollarSign size={13} className="text-success" /> Clear Statement
          </button>
        )}

        <button
          onClick={handleToggleStatus}
          className="rounded-2xl bg-surface border border-border px-4 py-3.5 text-xs text-muted-foreground hover:text-foreground transition active:scale-95"
        >
          {card.status === 'active' ? 'Freeze Card' : 'Unfreeze Card'}
        </button>
      </div>

      {/* tab view switcher */}
      <div className="flex gap-1 rounded-full border border-border bg-surface p-1">
        {([
          { id: 'overview', label: 'Cycle' },
          { id: 'transactions', label: 'History' },
          { id: 'insights', label: 'Insights' },
        ] as { id: CardTab; label: string }[]).map((tab) => {
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
                  layoutId="card-detail-pill"
                  className="absolute inset-0 rounded-full bg-foreground"
                  transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                />
              )}
              <span className="relative z-10">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* CONTENT WIDGETS */}
      <div className="relative">
        <AnimatePresence mode="wait">
          
          {/* TAB 1: CYCLE OVERVIEW */}
          {activeTab === 'overview' && (
            <motion.div
              key="ov"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="space-y-4"
            >
              <div className="rounded-3xl border border-border bg-surface p-5 space-y-4">
                <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  Statement schedule
                </h3>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <DetailRow label="Statement Generation Day" value={`${card.statement_day}th of month`} />
                  <DetailRow label="Repayment Due Day" value={`${card.due_day}th of month`} />
                  <DetailRow label="Cycle limit" value={formatCurrency(card.credit_limit, card.currency)} />
                  <DetailRow label="Base Currency" value={card.currency} />
                </div>
              </div>

              {/* Bills Statement History List */}
              <div className="rounded-3xl border border-border bg-surface">
                <header className="border-b border-border px-5 py-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  Billing cycle history
                </header>
                <div className="divide-y divide-border/60">
                  {bills.map((bill) => {
                    const monthDate = bill.billing_month ? parseISO(bill.billing_month) : new Date();
                    return (
                      <div key={bill.id} className="flex items-center justify-between px-5 py-3.5 text-xs">
                        <div>
                          <div className="font-semibold text-foreground">{format(monthDate, 'MMMM yyyy')}</div>
                          <div className="text-[10px] text-muted-foreground mt-0.5">
                            Due: {format(parseISO(bill.due_date), 'd MMM')} · status:{' '}
                            <span className={bill.status === 'paid' ? 'text-success font-medium' : 'text-warning font-medium'}>
                              {bill.status}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-foreground">
                            {formatCurrency(bill.statement_amount, card.currency)}
                          </div>
                          {bill.paid_amount && (
                            <div className="text-[10px] text-success mt-0.5">
                              Paid: {formatCurrency(bill.paid_amount, card.currency)}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  {bills.length === 0 && (
                    <div className="p-6 text-center text-xs text-muted-foreground">
                      No billing cycle reports generated yet.
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB 2: TRANSACTION HISTORY */}
          {activeTab === 'transactions' && (
            <motion.div
              key="tx"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="space-y-3"
            >
              <div className="divide-y divide-border overflow-hidden rounded-3xl border border-border bg-surface">
                {transactions.map((t) => {
                  const Icon = CATEGORY_ICONS[t.category] ?? MoreHorizontal;
                  const isDebit = t.transaction_type === 'debit';
                  return (
                    <div key={t.id} className="flex items-center gap-3 px-4 py-3.5 hover:bg-surface-elevated transition">
                      <div
                        className={`grid h-9 w-9 place-items-center rounded-full ${
                          isDebit ? 'bg-secondary text-muted-foreground' : 'bg-success/10 text-success'
                        }`}
                      >
                        <Icon size={14} strokeWidth={2} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="truncate text-sm font-medium text-foreground">{t.merchant ?? 'General Entry'}</div>
                        <div className="text-[10px] text-muted-foreground mt-0.5">
                          {t.category} · {format(parseISO(t.transaction_date), 'd MMM yyyy')}
                        </div>
                      </div>
                      <div className="text-right flex items-center gap-3">
                        <div>
                          <div className={`text-sm font-semibold tabular ${isDebit ? 'text-foreground' : 'text-success'}`}>
                            {isDebit ? '−' : '+'}
                            {formatCurrency(t.amount, card.currency)}
                          </div>
                          {t.note && <div className="text-[10px] text-muted-foreground truncate max-w-[120px] mt-0.5">{t.note}</div>}
                        </div>
                        <button
                          onClick={() => handleDeleteTransaction(t.id)}
                          className="p-1 rounded-md hover:bg-destructive/15 text-muted-foreground hover:text-destructive transition opacity-0 group-hover:opacity-100 lg:opacity-100"
                          title="Delete transaction"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    </div>
                  );
                })}
                {transactions.length === 0 && (
                  <div className="p-12 text-center text-xs text-muted-foreground">
                    No transaction entries recorded yet. Click "+ Add Transaction" to log spends.
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* TAB 3: SPEND INSIGHTS ANALYTICS */}
          {activeTab === 'insights' && (
            <motion.div
              key="ins"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="grid md:grid-cols-2 gap-4"
            >
              {/* Spent by Category */}
              <div className="rounded-3xl border border-border bg-surface p-5">
                <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">
                  Repay splits by category
                </h3>
                <div className="space-y-3">
                  {insights.categories.map((cat) => {
                    const Icon = CATEGORY_ICONS[cat.category] ?? MoreHorizontal;
                    return (
                      <div key={cat.category} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <Icon size={12} className="text-muted-foreground" />
                            <span className="text-foreground font-medium">{cat.category}</span>
                          </div>
                          <span className="tabular text-muted-foreground">
                            {formatCurrency(cat.amount, card.currency)} · {(cat.percentage * 100).toFixed(0)}%
                          </span>
                        </div>
                        <Progress value={cat.percentage} height={3} color="var(--color-foreground)" />
                      </div>
                    );
                  })}
                  {insights.categories.length === 0 && (
                    <div className="text-center py-6 text-xs text-muted-foreground">No categorical spend detected yet</div>
                  )}
                </div>
              </div>

              {/* Leaderboard Merchants */}
              <div className="rounded-3xl border border-border bg-surface p-5 flex flex-col justify-between">
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">
                    Top 5 spent merchants
                  </h3>
                  <div className="divide-y divide-border/60">
                    {insights.merchants.map((m, index) => (
                      <div key={m.merchant} className="flex items-center justify-between py-2.5 text-xs">
                        <div className="flex items-center gap-3">
                          <span className="grid h-5 w-5 place-items-center rounded-full bg-secondary text-[9px] font-bold tabular text-muted-foreground">
                            {index + 1}
                          </span>
                          <span className="font-medium text-foreground">{m.merchant}</span>
                        </div>
                        <span className="tabular font-semibold text-foreground">
                          {formatCurrency(m.amount, card.currency)}
                        </span>
                      </div>
                    ))}
                    {insights.merchants.length === 0 && (
                      <div className="text-center py-6 text-xs text-muted-foreground">No merchants recorded yet</div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      {/* POPUP MODAL 1: ADD TRANSACTION (SUPABASE INSPIRED) */}
      <AnimatePresence>
        {showAddTx && (
          <AddTxDialog
            card={card}
            onClose={() => setShowAddTx(false)}
            statementDay={card.statement_day}
          />
        )}
      </AnimatePresence>

      {/* POPUP MODAL 2: CLEAR CC BILL STATEMENT */}
      <AnimatePresence>
        {showPayBill && activeBill && (
          <PayBillDialog
            card={card}
            bill={activeBill}
            onClose={() => setShowPayBill(false)}
            onConfirm={async (amountPaid, datePaid) => {
              await markBillPaid.mutateAsync({
                bill_id: activeBill.id,
                card_id: card.id,
                paid_amount: amountPaid,
                paid_date: datePaid,
                statement_amount: activeBill.statement_amount,
              });
              setShowPayBill(false);
            }}
          />
        )}
      </AnimatePresence>

      <ConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Credit Card"
        message="Are you sure you want to delete this credit card and all associated transaction records? This action is permanent and cannot be undone."
        confirmText="Delete permanently"
        variant="danger"
      />

      <ConfirmModal
        isOpen={showStatusConfirm}
        onClose={() => setShowStatusConfirm(false)}
        onConfirm={handleToggleStatusConfirm}
        title={card.status === 'active' ? 'Freeze Card' : 'Unfreeze Card'}
        message={`Are you sure you want to mark this card as ${card.status === 'active' ? 'closed' : 'active'}?`}
        confirmText={card.status === 'active' ? 'Freeze' : 'Activate'}
        variant={card.status === 'active' ? 'warning' : 'success'}
      />

      <ConfirmModal
        isOpen={txToDelete !== null}
        onClose={() => setTxToDelete(null)}
        onConfirm={handleDeleteTxConfirm}
        title="Delete Transaction"
        message="Are you sure you want to delete this transaction entry? The credit card outstanding balance will automatically recalculate."
        confirmText="Delete"
        variant="danger"
      />

    </div>
  );
}

/* ---------------- PRIVATE WIDGET MINI STATS CARD ---------------- */

function MiniCard({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className={`rounded-2xl border border-border p-4 flex flex-col justify-between min-h-[76px] ${
      accent ? 'bg-destructive/10' : 'bg-surface-elevated/40'
    } backdrop-blur`}>
      <div className="text-[9px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className={`mt-1.5 text-sm font-bold tabular ${accent ? 'text-destructive' : 'text-foreground'}`}>
        {value}
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-background p-3.5">
      <div className="text-[9px] uppercase tracking-widest text-muted-foreground font-semibold">{label}</div>
      <div className="mt-1 font-semibold text-foreground text-sm">{value}</div>
    </div>
  );
}

/* ---------------- DIALOG 1: ADD TRANSACTION SHEET ---------------- */

function AddTxDialog({ card, onClose, statementDay }: { card: any; onClose: () => void; statementDay: number }) {
  const createTx = useCreateTransaction();

  const [amount, setAmount] = useState('');
  const [txType, setTxType] = useState<'debit' | 'credit'>('debit');
  const [category, setCategory] = useState<string>(Object.keys(CATEGORY_ICONS)[0]);
  const [merchant, setMerchant] = useState('');
  const [note, setNote] = useState('');
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  const valid = amount && parseFloat(amount) > 0 && merchant.trim();

  const submit = async () => {
    if (!valid) return;
    await createTx.mutateAsync({
      card_id: card.id,
      amount: parseFloat(amount),
      transaction_type: txType,
      category,
      merchant: merchant.trim(),
      note: note.trim() || undefined,
      transaction_date: date,
      statement_day: statementDay,
    });
    onClose();
  };

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
          <h3 className="text-base font-bold text-foreground">Log Card Transaction</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X size={16} />
          </button>
        </div>

        {/* Spends Type Toggles */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setTxType('debit')}
            className={`flex-1 py-2 rounded-xl text-xs font-semibold border transition ${
              txType === 'debit'
                ? 'border-destructive/40 bg-destructive/10 text-red-400'
                : 'border-border bg-background text-muted-foreground'
            }`}
          >
            Debit (Spend)
          </button>
          <button
            onClick={() => setTxType('credit')}
            className={`flex-1 py-2 rounded-xl text-xs font-semibold border transition ${
              txType === 'credit'
                ? 'border-success/40 bg-success/10 text-success'
                : 'border-border bg-background text-muted-foreground'
            }`}
          >
            Credit (Refund/Payment)
          </button>
        </div>

        <div className="space-y-3">
          {/* Amount field */}
          <div className="rounded-2xl border border-border bg-background p-4">
            <div className="text-[9px] uppercase tracking-widest text-muted-foreground font-semibold">Transaction Amount</div>
            <div className="mt-1 flex items-center gap-2">
              <span className="text-muted-foreground font-semibold">{card.currency}</span>
              <input
                autoFocus
                type="number"
                placeholder="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-transparent text-2xl font-bold tabular outline-none text-foreground placeholder:text-muted-foreground/30"
              />
            </div>
          </div>

          {/* Category SELECT dropdown */}
          <div className="rounded-2xl border border-border bg-background p-3.5">
            <label className="block text-[9px] uppercase tracking-widest text-muted-foreground font-semibold mb-1">
              Select Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-transparent text-sm outline-none text-foreground"
            >
              {Object.keys(CATEGORY_ICONS).map((cat) => (
                <option key={cat} value={cat} className="bg-surface">
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Merchant Text */}
          <div className="rounded-2xl border border-border bg-background p-3.5">
            <label className="block text-[9px] uppercase tracking-widest text-muted-foreground font-semibold mb-1">
              Merchant / Payee
            </label>
            <input
              placeholder="e.g. Amazon, Uber, Blinkit"
              value={merchant}
              onChange={(e) => setMerchant(e.target.value)}
              className="w-full bg-transparent text-sm outline-none text-foreground placeholder:text-muted-foreground/30"
            />
          </div>

          {/* Note & Date Fields side-by-side */}
          <div className="grid grid-cols-2 gap-3">
            <DatePicker
              label="Transaction Date"
              value={date}
              onChange={setDate}
            />
            <div className="rounded-2xl border border-border bg-background p-3.5 flex flex-col justify-center">
              <label className="block text-[9px] uppercase tracking-widest text-muted-foreground font-semibold mb-1">
                Short Notes
              </label>
              <input
                placeholder="Details..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full bg-transparent text-xs outline-none text-foreground placeholder:text-muted-foreground/30"
              />
            </div>
          </div>
        </div>

        <button
          onClick={submit}
          disabled={!valid || createTx.isPending}
          className="mt-5 w-full rounded-2xl bg-foreground py-4 text-xs font-bold text-background transition hover:opacity-90 active:scale-[0.98] disabled:opacity-40"
        >
          Confirm Transaction Log
        </button>
      </motion.div>
    </div>
  );
}

/* ---------------- DIALOG 2: CLEAR STATEMENT SHEET ---------------- */

function PayBillDialog({ card, bill, onClose, onConfirm }: { card: any; bill: any; onClose: () => void; onConfirm: (amt: number, date: string) => void }) {
  const [paymentAmount, setPaymentAmount] = useState(bill.statement_amount.toString());
  const [payDate, setPayDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  const valid = paymentAmount && parseFloat(paymentAmount) > 0;

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
          <h3 className="text-base font-bold text-foreground">Clear Credit Card Statement</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X size={16} />
          </button>
        </div>

        <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
          Log statement payments to avoid APR interest penalty rates on your revolving debt.
        </p>

        <div className="space-y-3">
          {/* Payment amount */}
          <div className="rounded-2xl border border-border bg-background p-4">
            <div className="text-[9px] uppercase tracking-widest text-muted-foreground font-semibold">Statement Amount Owed</div>
            <div className="mt-1 flex items-center gap-2">
              <span className="text-muted-foreground font-semibold">{card.currency}</span>
              <input
                autoFocus
                type="number"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                className="w-full bg-transparent text-2xl font-bold tabular outline-none text-foreground"
              />
            </div>
            <div className="mt-2 text-[10px] text-muted-foreground">
              Total bill generated for cycle month: {format(parseISO(bill.billing_month), 'MMMM yyyy')}
            </div>
          </div>

          {/* Payment Date */}
          <DatePicker
            label="Payment Record Date"
            value={payDate}
            onChange={setPayDate}
          />
        </div>

        <button
          onClick={() => valid && onConfirm(parseFloat(paymentAmount), payDate)}
          disabled={!valid}
          className="mt-5 w-full rounded-2xl bg-foreground py-4 text-xs font-bold text-background transition hover:opacity-90 active:scale-[0.98] disabled:opacity-40"
        >
          Confirm Statement Settlement
        </button>
      </motion.div>
    </div>
  );
}
