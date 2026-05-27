import { useState, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Plus, CreditCard, Check, Zap, Calendar, TrendingDown } from 'lucide-react';
import { useCards } from '@/hooks/useCards';
import { useAllCardTransactions } from '@/hooks/useTransactions';
import { useBills } from '@/hooks/useBills';
import { calculateCCUtilization, calculateCurrentBalance, calculateBillDates, getDueInfo, calculateDaysRemaining } from '@/lib/calculations';
import { formatCurrency, formatCompactCurrency } from '@/lib/currency';
import { CARD_NETWORK_LABELS } from '@/lib/constants';
import { Progress } from '@/components/shared/Progress';
import { format, startOfMonth, addMonths, parseISO, differenceInDays } from 'date-fns';
import type { CardStatus } from '@/types/database.types';
import { motion, AnimatePresence } from 'framer-motion';

export function CardsPage() {
  const [statusFilter, setStatusFilter] = useState<CardStatus | undefined>('active');
  const { data: cards = [], isLoading, error } = useCards(statusFilter);

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <div className="flex items-end justify-between px-1">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Credit Cards</h1>
          <p className="text-xs text-muted-foreground">
            {cards.length} {statusFilter ?? 'total'} active revolving assets
          </p>
        </div>
        <Link to="/cards/new" className="md:hidden">
          <button className="rounded-full border border-border bg-surface p-3 transition hover:bg-surface-elevated active:scale-90 text-foreground">
            <Plus size={16} />
          </button>
        </Link>
      </div>

      {/* Filter and Add Row */}
      <div className="flex items-center justify-between gap-4">
        {/* Modern Filter Badges */}
        <div className="flex gap-1 rounded-full border border-border bg-surface p-1 max-w-xs flex-1 justify-between items-center">
          {([
            { id: 'active', label: 'Active' },
            { id: 'closed', label: 'Closed' },
            { id: undefined, label: 'All' },
          ] as { id: CardStatus | undefined; label: string }[]).map((tab) => {
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
                    layoutId="card-filter-pill"
                    className="absolute inset-0 rounded-full bg-foreground"
                    transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                  />
                )}
                <span className="relative z-10">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Desktop add button, aligned right */}
        <Link to="/cards/new" className="max-md:hidden">
          <button className="flex items-center gap-1.5 rounded-full bg-foreground px-4.5 py-2.5 text-xs font-bold text-background transition hover:opacity-90 active:scale-95 cursor-pointer">
            <Plus size={13} /> Add new card
          </button>
        </Link>
      </div>

      {/* Loading States */}
      {isLoading && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse h-48 w-full rounded-3xl bg-surface/50" />
          ))}
        </div>
      )}

      {error && (
        <div className="text-center py-12 text-destructive bg-destructive/5 rounded-3xl border border-destructive/20">
          Error loading credit cards: {(error as Error).message}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && cards.length === 0 && (
        <div className="text-center py-16 border border-dashed border-border rounded-3xl bg-surface/30">
          <CreditCard className="mx-auto h-12 w-12 text-muted-foreground/60 stroke-1 mb-4" />
          <p className="text-sm text-muted-foreground mb-4">No credit cards found</p>
          <Link to="/cards/new">
            <button className="rounded-full bg-foreground px-5 py-2.5 text-xs font-semibold text-background transition hover:opacity-90 active:scale-95">
              Add Your First Card
            </button>
          </Link>
        </div>
      )}

      {/* Responsive Card Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <AnimatePresence mode="popLayout">
          {cards.map((card, index) => (
            <CardGridItem key={card.id} card={card} index={index} />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

/* ---------------- CARD ITEM SUBCOMPONENT ---------------- */

function CardGridItem({ card, index }: { card: any; index: number }) {
  // Query all transactions to calculate actual balances and utilization
  const { data: transactions = [] } = useAllCardTransactions(card.id);
  const { data: bills = [] } = useBills(card.id);

  // Math conversions
  const currentBalance = useMemo(() => {
    return calculateCurrentBalance(transactions);
  }, [transactions]);

  const utilizationRate = useMemo(() => {
    return calculateCCUtilization(Math.max(0, currentBalance), card.credit_limit) / 100;
  }, [currentBalance, card.credit_limit]);

  const availableLimit = useMemo(() => {
    return Math.max(0, card.credit_limit - Math.max(0, currentBalance));
  }, [card.credit_limit, currentBalance]);

  // Billing due indicators
  const now = new Date();
  const nextBillingMonth = format(
    now.getDate() > card.statement_day ? startOfMonth(addMonths(now, 1)) : startOfMonth(now),
    'yyyy-MM-dd'
  );
  const { dueDate } = calculateBillDates(card.statement_day, card.due_day, nextBillingMonth);
  const daysToDue = calculateDaysRemaining(dueDate);

  const urgentDue = daysToDue <= 5;

  // 3D Pointer interactions
  const cardRef = useRef<HTMLAnchorElement>(null);
  const [rotate, setRotate] = useState({ x: 0, y: 0 });
  const [glare, setGlare] = useState({ x: 50, y: 50, opacity: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLAnchorElement>) => {
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
      className="relative flex items-center justify-center"
    >
      {/* Dynamic Brand Backlight Glow Halo */}
      <div 
        className="absolute -inset-1 rounded-[32px] blur-3xl opacity-20 transition-all duration-500 pointer-events-none z-0"
        style={{
          background: card.color,
          transform: rotate.x !== 0 ? 'scale(1.15)' : 'scale(1.0)',
          opacity: rotate.x !== 0 ? 0.35 : 0.20,
        }}
      />

      <Link
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        to={`/cards/${card.id}`}
        className="group relative block overflow-hidden rounded-3xl border border-border p-5 text-left transition flex flex-col justify-between min-h-[210px] w-full z-10"
        style={{
          background: `radial-gradient(130% 70% at 0% 0%, ${card.color} 30%, color-mix(in oklab, ${card.color} 50%, black) 100%)`,
          transform: `perspective(1000px) rotateX(${rotate.x}deg) rotateY(${rotate.y}deg) scale3d(${rotate.x !== 0 ? '1.02' : '1'}, ${rotate.y !== 0 ? '1.02' : '1'}, 1)`,
          transition: rotate.x === 0 ? 'transform 0.5s ease, box-shadow 0.5s ease, border-color 0.5s ease' : 'transform 0.1s ease-out, box-shadow 0.1s ease-out, border-color 0.1s ease-out',
          transformStyle: 'preserve-3d',
          borderColor: rotate.x !== 0 ? 'rgba(255,255,255,0.25)' : 'var(--color-border)',
          boxShadow: rotate.x !== 0 
            ? `0 20px 40px -12px color-mix(in oklab, ${card.color} 35%, rgba(0,0,0,0.6))` 
            : '0 8px 24px -8px rgba(0,0,0,0.4)',
        }}
      >
        {/* Specular glare reflection overlay */}
        <div 
          className="absolute inset-0 pointer-events-none transition-opacity duration-300 ease-out z-0" 
          style={{
            background: `radial-gradient(circle at ${glare.x}% ${glare.y}%, rgba(255,255,255,${glare.opacity}), transparent 45%)`,
          }}
        />
        <div className="pointer-events-none absolute inset-0 opacity-20 bg-gradient-to-br from-white/10 to-transparent" />

        {/* Card Identity */}
        <div className="relative z-10 flex items-start justify-between" style={{ transform: 'translateZ(25px)' }}>
          <div>
            <div className="text-sm font-semibold tracking-wide text-white group-hover:text-white/95">
              {card.name}
            </div>
            <div className="mt-0.5 text-[9px] uppercase tracking-[0.2em] text-white/50">
              {card.bank} · •••• {card.last_four}
            </div>
          </div>
          <span
            className={`rounded-full px-2 py-0.5 text-[9px] font-semibold tabular ${
              urgentDue ? 'bg-destructive/20 text-red-300 border border-destructive/30' : 'bg-white/5 text-white/70 border border-white/10'
            }`}
          >
            {daysToDue < 0
              ? `${Math.abs(daysToDue)}d overdue`
              : daysToDue === 0
              ? 'Due today'
              : `Due in ${daysToDue}d`}
          </span>
        </div>

        {/* Financial Outstanding Balances */}
        <div className="relative z-10 mt-8 flex items-end justify-between" style={{ transform: 'translateZ(20px)' }}>
          <div>
            <div className="text-[9px] uppercase tracking-widest text-white/40 font-semibold">Current balance</div>
            <div className="text-2xl font-bold tabular text-white">
              {formatCurrency(Math.max(0, currentBalance), card.currency)}
            </div>
          </div>
          <div className="text-right">
            <div className="text-[9px] uppercase tracking-widest text-white/40 font-semibold">Available</div>
            <div className="text-xs font-semibold text-white/80 tabular">
              {formatCompactCurrency(availableLimit, card.currency)}
            </div>
          </div>
        </div>

        {/* Progress Bar (Repayment/Utilization) */}
        <div className="relative z-10 mt-4" style={{ transform: 'translateZ(15px)' }}>
          <Progress
            value={utilizationRate}
            height={4}
            color={utilizationRate > 0.3 ? 'var(--color-warning)' : 'var(--color-success)'}
          />
          <div className="mt-2 flex justify-between text-[10px] text-white/50 font-semibold tabular">
            <span>{(utilizationRate * 100).toFixed(0)}% util</span>
            <span>Limit {formatCompactCurrency(card.credit_limit, card.currency)}</span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
