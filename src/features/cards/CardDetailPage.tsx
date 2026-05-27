import { useState, useMemo, useRef, useEffect } from 'react';
import type { CCTransaction } from '@/types/database.types';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { DatePicker } from '@/components/ui/DatePicker';
import { CardNetworkLogo } from '@/components/shared/CardNetworkLogo';
import { BankLogo } from '@/components/shared/BankLogo';
import {
  ArrowLeft,
  Edit,
  Edit2,
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

// Hooks & Calculations
import { useCard, useDeleteCard, useUpdateCard } from '@/hooks/useCards';
import { useAllCardTransactions, useCreateTransaction, useDeleteTransaction, useUpdateTransaction } from '@/hooks/useTransactions';
import { useBills, useMarkBillPaid, useCreateBill, useUpdateBill } from '@/hooks/useBills';
import { calculateCCUtilization, calculateCurrentBalance, calculateBillDates, getDueInfo, determineBillingMonth, calculateDaysRemaining } from '@/lib/calculations';
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
  const { data: bills = [], isLoading: billsLoading } = useBills(id);

  // Mutations
  const deleteCard = useDeleteCard();
  const updateCard = useUpdateCard();
  const markBillPaid = useMarkBillPaid();
  const deleteTx = useDeleteTransaction();
  const updateTx = useUpdateTransaction();
  const createBill = useCreateBill();
  const updateBill = useUpdateBill();
  const createTx = useCreateTransaction();

  // States
  const [activeTab, setActiveTab] = useState<CardTab>('overview');
  const [showAddTx, setShowAddTx] = useState(false);
  const [showPayBill, setShowPayBill] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showStatusConfirm, setShowStatusConfirm] = useState(false);
  const [txToDelete, setTxToDelete] = useState<string | null>(null);
  const [txToEdit, setTxToEdit] = useState<CCTransaction | null>(null);

  // 3D Pointer interactions for Physical Card representation
  const cardRef = useRef<HTMLDivElement>(null);
  const [rotate, setRotate] = useState({ x: 0, y: 0 });
  const [glare, setGlare] = useState({ x: 50, y: 50, opacity: 0 });

  // Stable ref so bills changes don't trigger sync re-run (prevents mutation loop)
  const billsRef = useRef<typeof bills>([]);
  useEffect(() => { billsRef.current = bills; });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const cardElement = cardRef.current;
    if (!cardElement) return;
    const rect = cardElement.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    const px = mouseX / width - 0.5;
    const py = mouseY / height - 0.5;
    
    const rotateX = -py * 16;
    const rotateY = px * 16;
    
    const glareX = (mouseX / width) * 100;
    const glareY = (mouseY / height) * 100;
    
    setRotate({ x: rotateX, y: rotateY });
    setGlare({ x: glareX, y: glareY, opacity: 0.22 });
  };

  const handleMouseLeave = () => {
    setRotate({ x: 0, y: 0 });
    setGlare(prev => ({ ...prev, opacity: 0 }));
  };

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

  // Automated Background statement synchronizer
  // Uses billsRef (not bills state) so bill mutations don't re-trigger this effect
  useEffect(() => {
    // Wait for both queries to settle before syncing — prevents INSERT race condition
    // when transactions loads before bills (would attempt to create already-existing bills)
    if (!card || transactions.length === 0 || billsLoading) return;

    let cancelled = false;

    const syncBills = async () => {
      try {
        const currentBills = billsRef.current;
        const groups = new Map<string, { spends: number; credits: number }>();

        for (const t of transactions) {
          const billingMonth = determineBillingMonth(t.transaction_date, card.statement_day);

          if (!groups.has(billingMonth)) {
            groups.set(billingMonth, { spends: 0, credits: 0 });
          }
          const group = groups.get(billingMonth)!;

          if (t.transaction_type === 'debit') {
            group.spends += t.amount;
          } else {
            // Exclude statement payments to prevent balance double-counting
            if (t.merchant?.toLowerCase().includes('statement payment')) continue;
            group.credits += t.amount;
          }
        }

        for (const [billingMonth, data] of groups.entries()) {
          if (cancelled) break;
          const existingBill = currentBills.find((b) => b.billing_month === billingMonth);
          const statementAmount = Math.max(0, data.spends - data.credits);
          const minimumDue = Math.round(statementAmount * 0.05 * 100) / 100;

          if (!existingBill) {
            await createBill.mutateAsync({
              card_id: card.id,
              billing_month: billingMonth,
              statement_day: card.statement_day,
              due_day: card.due_day,
              opening_balance: 0,
              total_spends: data.spends,
              total_credits: data.credits,
              statement_amount: statementAmount,
              minimum_due: minimumDue,
              status: statementAmount <= 0 ? 'paid' : 'generated',
            });
          } else {
            // Protect paid/partially_paid bills — never regress their status
            const isSettled = existingBill.status === 'paid' || existingBill.status === 'partially_paid';
            const nextStatus = isSettled
              ? existingBill.status
              : statementAmount <= 0
              ? 'paid'
              : 'generated';

            const roundedSpends = Math.round(data.spends * 100) / 100;
            const roundedCredits = Math.round(data.credits * 100) / 100;
            const roundedStatement = Math.round(statementAmount * 100) / 100;

            const amountsChanged =
              Math.abs(existingBill.total_spends - roundedSpends) > 0.01 ||
              Math.abs(existingBill.total_credits - roundedCredits) > 0.01 ||
              Math.abs(existingBill.statement_amount - roundedStatement) > 0.01;
            const statusChanged = existingBill.status !== nextStatus && !isSettled;

            if (amountsChanged || statusChanged) {
              await updateBill.mutateAsync({
                bill_id: existingBill.id,
                card_id: card.id,
                total_spends: roundedSpends,
                total_credits: roundedCredits,
                statement_amount: roundedStatement,
                minimum_due: minimumDue,
                status: nextStatus,
              });
            }
          }
        }
      } catch (err) {
        if (!cancelled) console.error('Failed to synchronize CC statements:', err);
      }
    };

    syncBills();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [card, transactions, billsLoading]); // bills excluded (uses billsRef); billsLoading ensures both queries settled

  // Billing Cycle Computations
  const billingDates = useMemo(() => {
    if (!card) return null;
    const now = new Date();
    const nextBillingMonth = format(
      now.getDate() > card.statement_day ? startOfMonth(addMonths(now, 1)) : startOfMonth(now),
      'yyyy-MM-dd'
    );
    const { statementDate, dueDate } = calculateBillDates(card.statement_day, card.due_day, nextBillingMonth);
    const daysToDue = calculateDaysRemaining(dueDate);
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

  // Current billing month — used for "Current" badge in billing history
  const currentBillingMonth = useMemo(() => {
    if (!card) return null;
    const now = new Date();
    return format(
      now.getDate() > card.statement_day ? startOfMonth(addMonths(now, 1)) : startOfMonth(now),
      'yyyy-MM-dd'
    );
  }, [card]);

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
      <div className="relative w-full flex items-center justify-center">
        {/* Dynamic Brand backlight Glow Halo */}
        <div 
          className="absolute -inset-1 rounded-[32px] blur-3xl opacity-25 transition-all duration-500 pointer-events-none z-0"
          style={{
            background: card.color,
            transform: rotate.x !== 0 ? 'scale(1.1)' : 'scale(1.0)',
            opacity: rotate.x !== 0 ? 0.4 : 0.25,
          }}
        />

        <div
          ref={cardRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          className="relative overflow-hidden rounded-3xl p-6 min-h-[220px] flex flex-col justify-between shadow-2xl border border-white/10 w-full z-10 cursor-pointer"
          style={{
            background: `linear-gradient(135deg, ${card.color} 0%, color-mix(in oklab, ${card.color} 45%, black) 100%)`,
            transform: `perspective(1000px) rotateX(${rotate.x}deg) rotateY(${rotate.y}deg) scale3d(${rotate.x !== 0 ? '1.01' : '1'}, ${rotate.y !== 0 ? '1.01' : '1'}, 1)`,
            transition: rotate.x === 0 ? 'transform 0.5s ease, box-shadow 0.5s ease, border-color 0.5s ease' : 'transform 0.1s ease-out, box-shadow 0.1s ease-out, border-color 0.1s ease-out',
            transformStyle: 'preserve-3d',
            borderColor: rotate.x !== 0 ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.1)',
            boxShadow: rotate.x !== 0 
              ? `0 30px 60px -15px color-mix(in oklab, ${card.color} 30%, rgba(0,0,0,0.6))` 
              : '0 15px 35px -10px rgba(0,0,0,0.4)',
          }}
        >
          {/* Specular glare reflection overlay */}
          <div 
            className="absolute inset-0 pointer-events-none transition-opacity duration-300 ease-out z-0" 
            style={{
              background: `radial-gradient(circle at ${glare.x}% ${glare.y}%, rgba(255,255,255,${glare.opacity}), transparent 45%)`,
            }}
          />
          {/* Light sheen layer reflection */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(255,255,255,0.12),transparent_60%)] pointer-events-none" />

          <div className="relative flex items-center justify-between text-white z-10" style={{ transform: 'translateZ(25px)' }}>
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

          <div className="relative flex items-end justify-between text-white mt-8" style={{ transform: 'translateZ(20px)' }}>
            <div className="flex items-center gap-4">
              {/* Metal smart chip */}
              <div className="relative w-9 h-7 rounded-md bg-gradient-to-tr from-amber-400 via-amber-200 to-amber-300 border border-amber-400/30 shadow-[inset_0_1px_2px_rgba(255,255,255,0.4)] flex flex-wrap justify-between p-1 opacity-95 shrink-0 overflow-hidden">
                <div className="absolute inset-0 grid grid-cols-3 grid-rows-2 gap-[1px] opacity-30 p-[1.5px] pointer-events-none">
                  <div className="border-r border-b border-black/80 rounded-[1px]" />
                  <div className="border-r border-b border-black/80" />
                  <div className="border-b border-black/80 rounded-[1px]" />
                  <div className="border-r border-black/80 rounded-[1px]" />
                  <div className="border-r border-black/80" />
                  <div className="border-black/80 rounded-[1px]" />
                </div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2.5 h-1.5 rounded-[2px] bg-amber-400/90 border border-amber-500/20 shadow-sm" />
              </div>
              <div>
                <div className="text-[9px] uppercase tracking-widest text-white/50 font-semibold">Current Outstanding</div>
                <div className="text-3xl font-bold tabular">
                  {formatCurrency(Math.max(0, currentBalance), card.currency)}
                </div>
              </div>
            </div>

            {/* Billing Cycle Rings Indicator */}
            {billingDates && (
              <div className="relative flex h-14 w-14 items-center justify-center shrink-0" style={{ transform: 'translateZ(20px)' }}>
                <svg width="56" height="56" className="-rotate-90">
                  <circle cx="28" cy="28" r="24" stroke="rgba(255,255,255,0.06)" strokeWidth="4" fill="none" />
                  <motion.circle
                    cx="28"
                    cy="28"
                    r="24"
                    stroke={
                      (!activeBill || activeBill.status === 'paid')
                        ? 'var(--color-success)'
                        : billingDates.daysToDue <= 5
                        ? 'var(--color-destructive)'
                        : 'rgba(255,255,255,0.7)'
                    }
                    strokeWidth="4"
                    fill="none"
                    strokeDasharray={2 * Math.PI * 24}
                    initial={{ strokeDashoffset: 2 * Math.PI * 24 }}
                    animate={{ strokeDashoffset: 2 * Math.PI * 24 * (1 - ((!activeBill || activeBill.status === 'paid') ? 1 : cycleProgress)) }}
                    transition={{ type: 'spring', stiffness: 60, damping: 18 }}
                    strokeLinecap="round"
                    className={(!activeBill || activeBill.status === 'paid') ? '' : billingDates.daysToDue <= 5 ? 'animate-[pulse_1.5s_infinite]' : ''}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  {(!activeBill || activeBill.status === 'paid') ? (
                    <Check size={18} className="text-white bg-white/20 p-0.5 rounded-full stroke-[3px]" />
                  ) : (
                    <>
                      <span className={`text-xs font-bold leading-none ${billingDates.daysToDue <= 5 ? 'text-destructive-foreground animate-pulse' : ''}`}>
                        {billingDates.daysToDue}d
                      </span>
                      <span className="text-[6px] uppercase tracking-widest text-white/50">due</span>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Numerical Financial Summary Boxes */}
      <div className="grid grid-cols-3 gap-2">
        <MiniCard
          label="Current Balance"
          value={formatCurrency(Math.max(0, currentBalance), card.currency)}
          accent={currentBalance > 0}
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

        <button
          onClick={() => setShowPayBill(true)}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-2xl bg-surface border border-border py-3.5 text-xs font-semibold text-foreground transition hover:bg-surface-elevated active:scale-[0.98] cursor-pointer"
        >
          <CircleDollarSign size={13} className="text-success" /> Record Repayment
        </button>

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
                    const isCurrentCycle = bill.billing_month === currentBillingMonth;
                    const statusColor =
                      bill.status === 'paid'
                        ? 'text-success'
                        : bill.status === 'partially_paid'
                        ? 'text-warning'
                        : 'text-orange-400';
                    return (
                      <Link
                        key={bill.id}
                        to={`/cards/${card.id}/bill/${bill.id}`}
                        className="flex items-center justify-between px-5 py-3.5 hover:bg-surface-elevated transition-colors text-xs text-left block"
                      >
                        <div>
                          <div className="font-semibold text-foreground flex items-center gap-2">
                            {format(monthDate, 'MMMM yyyy')}
                            {isCurrentCycle && (
                              <span className="text-[8px] uppercase font-bold tracking-wider bg-foreground/10 text-foreground px-1.5 py-0.5 rounded-full">
                                Current
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-muted-foreground mt-0.5">
                            {bill.due_date ? `Due: ${format(parseISO(bill.due_date), 'd MMM')} · ` : ''}
                            <span className={`${statusColor} font-medium`}>
                              {bill.status.replace(/_/g, ' ')}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-foreground">
                            {formatCurrency(bill.statement_amount, card.currency)}
                          </div>
                          {bill.paid_amount != null && bill.paid_amount > 0 && (
                            <div className="text-[10px] text-success mt-0.5">
                              Paid: {formatCurrency(bill.paid_amount, card.currency)}
                            </div>
                          )}
                        </div>
                      </Link>
                    );
                  })}
                  {bills.length === 0 && (
                    <div className="p-8 text-center space-y-2">
                      <div className="text-2xl">📋</div>
                      <div className="text-xs font-semibold text-foreground">No statements yet</div>
                      <div className="text-[10px] text-muted-foreground max-w-[200px] mx-auto leading-relaxed">
                        Add transactions above — billing cycles will be auto-generated from your spend history.
                      </div>
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
                <LayoutGroup>
                  <AnimatePresence mode="popLayout">
                    {transactions.map((t) => {
                      const branding = getMerchantBranding(t.merchant || undefined);
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
                          <div className="text-right flex items-center gap-2">
                            <div>
                              <div className={`text-sm font-semibold tabular ${isDebit ? 'text-foreground' : 'text-success'}`}>
                                {isDebit ? '−' : '+'}
                                {formatCurrency(t.amount, card.currency)}
                              </div>
                              {t.note && <div className="text-[10px] text-muted-foreground truncate max-w-[120px] mt-0.5">{t.note}</div>}
                            </div>
                            <button
                              onClick={() => setTxToEdit(t)}
                              className="p-1 rounded-md hover:bg-foreground/10 text-muted-foreground hover:text-foreground transition opacity-0 group-hover:opacity-100 lg:opacity-100"
                              title="Edit transaction"
                            >
                              <Edit2 size={12} />
                            </button>
                            <button
                              onClick={() => handleDeleteTransaction(t.id)}
                              className="p-1 rounded-md hover:bg-destructive/15 text-muted-foreground hover:text-destructive transition opacity-0 group-hover:opacity-100 lg:opacity-100"
                              title="Delete transaction"
                            >
                              <X size={12} />
                            </button>
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </LayoutGroup>
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

      {/* POPUP MODAL 2: EDIT TRANSACTION */}
      <AnimatePresence>
        {txToEdit && (
          <EditTxDialog
            card={card}
            transaction={txToEdit}
            onClose={() => setTxToEdit(null)}
            onSave={async (updates) => {
              const newBillingMonth = updates.transaction_date
                ? determineBillingMonth(updates.transaction_date, card.statement_day)
                : txToEdit.billing_month;
              await updateTx.mutateAsync({
                id: txToEdit.id,
                card_id: card.id,
                ...updates,
                billing_month: newBillingMonth,
              });
              setTxToEdit(null);
            }}
          />
        )}
      </AnimatePresence>

      {/* POPUP MODAL 3: RECORD CC REPAYMENT */}
      <AnimatePresence>
        {showPayBill && (
          <PayBillDialog
            card={card}
            bill={activeBill || {
              id: 'custom',
              statement_amount: Math.max(0, currentBalance),
              billing_month: format(new Date(), 'yyyy-MM-dd'),
            }}
            onClose={() => setShowPayBill(false)}
            onConfirm={async (amountPaid, datePaid) => {
              // 1. Update bill statement status to Paid if an active bill is present
              if (activeBill) {
                await markBillPaid.mutateAsync({
                  bill_id: activeBill.id,
                  card_id: card.id,
                  paid_amount: amountPaid,
                  paid_date: datePaid,
                  statement_amount: activeBill.statement_amount,
                });
              }
              // 2. Automatically log matching credit transaction to reduce balance
              await createTx.mutateAsync({
                card_id: card.id,
                amount: amountPaid,
                transaction_type: 'credit',
                category: 'Bills & Utilities',
                merchant: `Statement Payment — ${card.bank}`,
                note: activeBill 
                  ? `Cleared statement for ${format(parseISO(activeBill.billing_month), 'MMMM yyyy')}`
                  : `Custom repayment / prepayment settlement`,
                transaction_date: datePaid,
                statement_day: card.statement_day,
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
              dropUp
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
            dropUp
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

/* ---------------- DIALOG 3: EDIT TRANSACTION SHEET ---------------- */

function EditTxDialog({
  card,
  transaction,
  onClose,
  onSave,
}: {
  card: any;
  transaction: CCTransaction;
  onClose: () => void;
  onSave: (updates: Partial<CCTransaction>) => Promise<void>;
}) {
  const [amount, setAmount] = useState(transaction.amount.toString());
  const [txType, setTxType] = useState<'debit' | 'credit'>(transaction.transaction_type as 'debit' | 'credit');
  const [category, setCategory] = useState(transaction.category);
  const [merchant, setMerchant] = useState(transaction.merchant ?? '');
  const [note, setNote] = useState(transaction.note ?? '');
  const [date, setDate] = useState(transaction.transaction_date);
  const [saving, setSaving] = useState(false);

  const valid = amount && parseFloat(amount) > 0 && merchant.trim();

  const submit = async () => {
    if (!valid) return;
    setSaving(true);
    try {
      await onSave({
        amount: parseFloat(amount),
        transaction_type: txType,
        category,
        merchant: merchant.trim(),
        note: note.trim() || null,
        transaction_date: date,
      });
    } finally {
      setSaving(false);
    }
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
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-base font-bold text-foreground">Edit Transaction</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X size={16} />
          </button>
        </div>
        <p className="text-[10px] text-muted-foreground mb-4">
          ID: <span className="font-mono">{transaction.id.slice(0, 8)}…</span>
        </p>

        {/* Type Toggles */}
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
          {/* Amount */}
          <div className="rounded-2xl border border-border bg-background p-4">
            <div className="text-[9px] uppercase tracking-widest text-muted-foreground font-semibold">Amount</div>
            <div className="mt-1 flex items-center gap-2">
              <span className="text-muted-foreground font-semibold">{card.currency}</span>
              <input
                autoFocus
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-transparent text-2xl font-bold tabular outline-none text-foreground"
              />
            </div>
          </div>

          {/* Category */}
          <div className="rounded-2xl border border-border bg-background p-3.5">
            <label className="block text-[9px] uppercase tracking-widest text-muted-foreground font-semibold mb-1">
              Category
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

          {/* Merchant */}
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

          {/* Date + Note */}
          <div className="grid grid-cols-2 gap-3">
            <DatePicker
              label="Transaction Date"
              value={date}
              onChange={setDate}
              dropUp
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
          disabled={!valid || saving}
          className="mt-5 w-full rounded-2xl bg-foreground py-4 text-xs font-bold text-background transition hover:opacity-90 active:scale-[0.98] disabled:opacity-40"
        >
          {saving ? 'Saving…' : 'Save Changes'}
        </button>
      </motion.div>
    </div>
  );
}
