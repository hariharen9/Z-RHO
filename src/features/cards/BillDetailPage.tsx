// ============================================================
// ZRHO — Cards: Bill Detail Page Overhaul
// ============================================================

import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  ShoppingBag, 
  Plane, 
  Cpu, 
  Tv, 
  Bolt, 
  UtensilsCrossed, 
  MoreHorizontal, 
  Calendar, 
  Zap, 
  Check,
  TrendingDown,
  DollarSign
} from 'lucide-react';
import { useBill } from '@/hooks/useBills';
import { useTransactions } from '@/hooks/useTransactions';
import { useCard } from '@/hooks/useCards';
import { MarkBillPaidModal } from './MarkBillPaidModal';
import { formatCurrency } from '@/lib/currency';
import { format, parseISO, differenceInDays } from 'date-fns';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';

const CATEGORY_ICONS: Record<string, any> = {
  'Food & Dining': UtensilsCrossed,
  'Travel & Transport': Plane,
  'Shopping & Retail': ShoppingBag,
  'Fuel': Bolt,
  'Bills & Utilities': Bolt,
  'Entertainment & Leisure': Tv,
  'Health & Medical': Bolt,
  'Subscriptions & Services': Cpu,
  'Education': Cpu,
  'Other': MoreHorizontal,
};

const MERCHANT_BRANDING: Record<string, { icon: any; color: string; bg: string }> = {
  amazon: { icon: ShoppingBag, color: 'text-amber-500', bg: 'bg-amber-500/10' },
  uber: { icon: Plane, color: 'text-white', bg: 'bg-black border border-white/10' },
  spotify: { icon: Cpu, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
  netflix: { icon: Tv, color: 'text-red-600', bg: 'bg-red-600/10' },
  apple: { icon: Cpu, color: 'text-slate-300', bg: 'bg-slate-300/10' },
  google: { icon: Bolt, color: 'text-blue-500', bg: 'bg-blue-500/10' },
  starbucks: { icon: UtensilsCrossed, color: 'text-green-700', bg: 'bg-green-700/10' },
  swiggy: { icon: UtensilsCrossed, color: 'text-orange-500', bg: 'bg-orange-500/10' },
  zomato: { icon: UtensilsCrossed, color: 'text-red-500', bg: 'bg-red-500/10' },
  blinkit: { icon: ShoppingBag, color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
};

const getMerchantBranding = (merchantName: string = '') => {
  const norm = merchantName.toLowerCase().trim();
  for (const [key, branding] of Object.entries(MERCHANT_BRANDING)) {
    if (norm.includes(key)) {
      return branding;
    }
  }
  return null;
};

export function BillDetailPage() {
  const { id: cardId, billId } = useParams<{ id: string; billId: string }>();
  const navigate = useNavigate();

  // Queries
  const { data: bill, isLoading: billLoading } = useBill(billId);
  const { data: card, isLoading: cardLoading } = useCard(cardId);
  const { data: transactions = [] } = useTransactions(cardId, {
    billingMonth: bill?.billing_month,
  });

  const [showPayModal, setShowPayModal] = useState(false);

  // Math conversions
  const isPaid = bill?.status === 'paid';
  const daysToDue = useMemo(() => {
    if (!bill) return 0;
    return differenceInDays(parseISO(bill.due_date), new Date());
  }, [bill]);

  if (billLoading || cardLoading) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto animate-pulse">
        <div className="h-10 w-64 bg-surface/50 rounded-full" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-surface/50 rounded-3xl" />
          ))}
        </div>
        <div className="h-48 bg-surface/50 rounded-3xl" />
      </div>
    );
  }

  if (!bill || !card) {
    return <div className="text-center py-12 text-destructive">Statement Bill details not found</div>;
  }

  const billingMonthName = bill.billing_month ? format(parseISO(bill.billing_month), 'MMMM yyyy') : '';

  return (
    <div className="relative w-full max-w-4xl mx-auto pb-12 space-y-6">
      {/* Color-Matched Ambient Glow */}
      <div 
        className="absolute top-0 left-1/2 -translate-x-1/2 w-80 h-80 rounded-full blur-3xl opacity-[0.12] pointer-events-none z-0"
        style={{ background: card.color }}
      />

      {/* Header back navigation bar */}
      <div className="relative flex items-center gap-3 z-10">
        <button
          onClick={() => navigate(`/cards/${cardId}`)}
          className="p-2 rounded-full border border-border bg-surface text-muted-foreground hover:text-foreground transition active:scale-90"
        >
          <ArrowLeft size={16} />
        </button>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">
            {card.name} — Statement Cycle
          </h1>
          <p className="text-xs text-muted-foreground">
            Month: <span className="font-semibold text-foreground">{billingMonthName}</span>
          </p>
        </div>
      </div>

      {/* Primary Settlement Status Summary Cards */}
      <div className="relative grid grid-cols-2 md:grid-cols-4 gap-3 z-10">
        
        {/* Stat 1: Statement Owed */}
        <div className="rounded-2xl border border-border bg-surface-elevated/45 backdrop-blur p-4 flex flex-col justify-between min-h-[96px]">
          <div className="text-[9px] uppercase tracking-widest text-muted-foreground font-semibold">Statement Bill</div>
          <div className="mt-2 text-xl font-bold text-foreground tabular-nums">
            {formatCurrency(bill.statement_amount, card.currency)}
          </div>
          <div className="text-[9px] text-muted-foreground mt-1">
            Generated: {format(parseISO(bill.statement_date), 'd MMM yyyy')}
          </div>
        </div>

        {/* Stat 2: Minimum Due */}
        <div className="rounded-2xl border border-border bg-surface-elevated/45 backdrop-blur p-4 flex flex-col justify-between min-h-[96px]">
          <div className="text-[9px] uppercase tracking-widest text-muted-foreground font-semibold">Minimum Due</div>
          <div className="mt-2 text-xl font-bold text-foreground tabular-nums">
            {formatCurrency(bill.minimum_due, card.currency)}
          </div>
          <div className="text-[9px] text-muted-foreground mt-1">
            5% of total statement statement
          </div>
        </div>

        {/* Stat 3: Countdown deadline badge */}
        <div className={`rounded-2xl border border-border bg-surface-elevated/45 backdrop-blur p-4 flex flex-col justify-between min-h-[96px] ${
          isPaid ? 'border-success/20' : daysToDue <= 5 ? 'border-destructive/35 bg-destructive/5' : ''
        }`}>
          <div className="text-[9px] uppercase tracking-widest text-muted-foreground font-semibold">Repayment Status</div>
          <div className="mt-2 flex items-center gap-1.5">
            {isPaid ? (
              <span className="text-sm font-bold text-success flex items-center gap-1">
                <Check size={14} className="stroke-[3px]" /> Fully Paid
              </span>
            ) : daysToDue < 0 ? (
              <span className="text-sm font-bold text-destructive animate-pulse">
                {Math.abs(daysToDue)}d overdue
              </span>
            ) : daysToDue === 0 ? (
              <span className="text-sm font-bold text-destructive animate-pulse">
                Due Today
              </span>
            ) : (
              <span className={`text-sm font-bold ${daysToDue <= 5 ? 'text-warning animate-pulse' : 'text-foreground'}`}>
                Due in {daysToDue}d
              </span>
            )}
          </div>
          <div className="text-[9px] text-muted-foreground mt-1">
            Due date: {format(parseISO(bill.due_date), 'd MMM yyyy')}
          </div>
        </div>

        {/* Stat 4: Payment Settlements Action */}
        <div className="rounded-2xl border border-border bg-surface-elevated/45 backdrop-blur p-4 flex flex-col justify-between min-h-[96px]">
          <div className="text-[9px] uppercase tracking-widest text-muted-foreground font-semibold">Cycle Settled</div>
          <div className="mt-2">
            {isPaid ? (
              <div className="text-xs font-semibold text-success tabular-nums">
                Paid: {formatCurrency(bill.paid_amount || 0, card.currency)}
              </div>
            ) : (
              <button
                onClick={() => setShowPayModal(true)}
                className="w-full py-1.5 px-3 rounded-xl bg-foreground text-background text-xs font-bold transition hover:opacity-90 active:scale-[0.97]"
              >
                Pay Bill Now
              </button>
            )}
          </div>
          <div className="text-[9px] text-muted-foreground mt-1">
            {bill.paid_date ? `Settled on: ${format(parseISO(bill.paid_date), 'd MMM')}` : 'No payments recorded'}
          </div>
        </div>

      </div>

      {/* Numerical Cycle Spent Breakdown Card */}
      <div className="relative rounded-3xl border border-border bg-surface p-5 z-10">
        <header className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">
          Statement cycle balance details
        </header>
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-2xl border border-border bg-background p-3.5">
            <div className="text-[9px] uppercase tracking-widest text-muted-foreground font-semibold">Opening Balance</div>
            <div className="mt-1 font-bold text-foreground text-sm tabular-nums">
              {formatCurrency(bill.opening_balance, card.currency)}
            </div>
          </div>
          <div className="rounded-2xl border border-border bg-background p-3.5">
            <div className="text-[9px] uppercase tracking-widest text-muted-foreground font-semibold">Total Spends (+)</div>
            <div className="mt-1 font-bold text-destructive text-sm tabular-nums">
              {formatCurrency(bill.total_spends, card.currency)}
            </div>
          </div>
          <div className="rounded-2xl border border-border bg-background p-3.5">
            <div className="text-[9px] uppercase tracking-widest text-muted-foreground font-semibold">Total Credits (−)</div>
            <div className="mt-1 font-bold text-success text-sm tabular-nums">
              {formatCurrency(bill.total_credits, card.currency)}
            </div>
          </div>
        </div>
      </div>

      {/* Cycle Transactions List */}
      <div className="relative space-y-3 z-10">
        <h3 className="text-sm font-semibold text-foreground tracking-tight px-1">
          Transactions in this cycle ({transactions.length})
        </h3>
        
        <div className="divide-y divide-border overflow-hidden rounded-3xl border border-border bg-surface">
          <LayoutGroup>
            <AnimatePresence mode="popLayout">
              {transactions.map((t) => {
                const branding = getMerchantBranding(t.merchant);
                const Icon = branding?.icon ?? (CATEGORY_ICONS[t.category] ?? MoreHorizontal);
                const isDebit = t.transaction_type === 'debit';
                
                return (
                  <motion.div
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.96 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                    key={t.id}
                    className="flex items-center gap-3 px-4 py-3.5 hover:bg-surface-elevated transition group"
                  >
                    <div
                      className={`grid h-9 w-9 place-items-center rounded-full shrink-0 ${
                        branding 
                          ? `${branding.bg} ${branding.color}`
                          : isDebit 
                          ? 'bg-secondary text-muted-foreground' 
                          : 'bg-success/10 text-success'
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
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </LayoutGroup>
          {transactions.length === 0 && (
            <div className="p-12 text-center text-xs text-muted-foreground">
              No transactions logged for this statement month cycle.
            </div>
          )}
        </div>
      </div>

      {/* Statement payment record modal */}
      {showPayModal && (
        <MarkBillPaidModal
          isOpen={showPayModal}
          onClose={() => setShowPayModal(false)}
          billId={bill.id}
          cardId={card.id}
          statementAmount={bill.statement_amount}
          minimumDue={bill.minimum_due}
          currency={card.currency}
        />
      )}

    </div>
  );
}
