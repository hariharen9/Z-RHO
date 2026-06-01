import { useState, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Plus, CreditCard, Check, ChevronRight } from 'lucide-react';
import { useCards } from '@/hooks/useCards';
import { useAllCardTransactions, useGlobalTransactions } from '@/hooks/useTransactions';
import { useBills } from '@/hooks/useBills';
import { calculateCurrentBalance, calculateBillDates, calculateDaysRemaining } from '@/lib/calculations';
import { formatCurrency } from '@/lib/currency';
import { CardNetworkLogo } from '@/components/shared/CardNetworkLogo';
import { BankLogo } from '@/components/shared/BankLogo';
import { format, startOfMonth, addMonths, parseISO } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { TransactionList } from './TransactionList';

export function CardsPage() {
  const [activeTab, setActiveTab] = useState<'cards' | 'transactions'>('cards');
  const { data: cards = [], isLoading, error } = useCards();
  const { data: globalTransactions = [], isLoading: txLoading } = useGlobalTransactions();

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <div className="flex items-end justify-between px-1">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Credit Cards</h1>
          <p className="text-xs text-muted-foreground">
            {activeTab === 'cards' 
              ? `${cards.length} active revolving assets`
              : `${globalTransactions.length} total transactions logged`
            }
          </p>
        </div>
        <Link to="/cards/new">
          <button className="flex items-center justify-center gap-1.5 rounded-full bg-foreground p-3 md:px-4.5 md:py-2.5 text-xs font-bold text-background transition hover:opacity-90 active:scale-95 cursor-pointer">
            <Plus size={14} />
            <span className="hidden md:inline">Add new card</span>
          </button>
        </Link>
      </div>

      {/* Tab Switcher */}
      <div className="flex p-1 bg-surface-elevated rounded-xl border border-border">
        <button
          onClick={() => setActiveTab('cards')}
          className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${
            activeTab === 'cards' ? 'bg-foreground text-background shadow-md' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          My Cards
        </button>
        <button
          onClick={() => setActiveTab('transactions')}
          className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${
            activeTab === 'transactions' ? 'bg-foreground text-background shadow-md' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          All Transactions
        </button>
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
      {activeTab === 'cards' && !isLoading && cards.length === 0 && (
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

      {/* Main Content Area */}
      {activeTab === 'cards' ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence mode="popLayout">
            {cards.map((card, index) => (
              <CardGridItem key={card.id} card={card} index={index} />
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <div className="mt-4">
          {txLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="animate-pulse h-20 w-full rounded-2xl bg-surface/50" />
              ))}
            </div>
          ) : (
            <TransactionList 
              transactions={globalTransactions} 
              cards={cards} 
              showCardContext={true} 
            />
          )}
        </div>
      )}
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
  const dueDateParsed = parseISO(dueDate);
  const dueMonth = format(dueDateParsed, 'MMM').toUpperCase();
  const dueDay = format(dueDateParsed, 'd');

  const urgentDue = daysToDue <= 5;

  // Bill payment status
  const activeBill = useMemo(() => {
    return bills.find((b: any) => b.status !== 'paid');
  }, [bills]);

  const billStatusLabel = useMemo(() => {
    if (!activeBill) return 'Fully Paid';
    if (activeBill.status === 'partially_paid') return 'Partially Paid';
    if (activeBill.status === 'overdue') return 'Overdue';
    return 'Pending';
  }, [activeBill]);

  const isBillPaid = !activeBill || activeBill.status === 'paid';

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
    
    const rotateX = -py * 12;
    const rotateY = px * 12;
    
    const glareX = (mouseX / width) * 100;
    const glareY = (mouseY / height) * 100;
    
    setRotate({ x: rotateX, y: rotateY });
    setGlare({ x: glareX, y: glareY, opacity: 0.15 });
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
      {/* Subtle ambient glow */}
      <div 
        className="absolute -inset-2 rounded-[32px] blur-3xl transition-all duration-500 pointer-events-none z-0"
        style={{
          background: card.color,
          opacity: rotate.x !== 0 ? 0.18 : 0.08,
          transform: rotate.x !== 0 ? 'scale(1.1)' : 'scale(1.0)',
        }}
      />

      <Link
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        to={`/cards/${card.id}`}
        className="group relative block overflow-hidden rounded-2xl text-left w-full z-10"
        style={{
          background: `linear-gradient(135deg, ${card.color} 0%, color-mix(in oklab, ${card.color} 65%, black) 100%)`,
          transform: `perspective(1000px) rotateX(${rotate.x}deg) rotateY(${rotate.y}deg) scale3d(${rotate.x !== 0 ? '1.02' : '1'}, ${rotate.y !== 0 ? '1.02' : '1'}, 1)`,
          transition: rotate.x === 0 ? 'transform 0.5s ease, box-shadow 0.5s ease' : 'transform 0.1s ease-out, box-shadow 0.1s ease-out',
          transformStyle: 'preserve-3d',
          boxShadow: rotate.x !== 0 
            ? `0 20px 50px -10px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.08), inset 0 1px 0 rgba(255,255,255,0.06)` 
            : '0 8px 30px -8px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.05), inset 0 1px 0 rgba(255,255,255,0.04)',
        }}
      >
        {/* Specular glare reflection overlay */}
        <div 
          className="absolute inset-0 pointer-events-none transition-opacity duration-300 ease-out z-0 rounded-2xl" 
          style={{
            background: `radial-gradient(circle at ${glare.x}% ${glare.y}%, rgba(255,255,255,${glare.opacity}), transparent 50%)`,
          }}
        />

        {/* Subtle top-left light sheen */}
        <div className="pointer-events-none absolute inset-0 rounded-2xl" style={{
          background: 'radial-gradient(ellipse 80% 50% at 10% 10%, rgba(255,255,255,0.04), transparent)',
        }} />

        {/* === NETWORK BADGE — Top Center === */}
        <div className="relative z-10 flex justify-center pt-3.5 pb-0" style={{ transform: 'translateZ(30px)' }}>
          <div className="flex items-center gap-1.5 bg-white/[0.07] backdrop-blur-sm border border-white/[0.08] rounded-full px-3 py-1">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_4px_rgba(52,211,153,0.6)]" />
            <CardNetworkLogo network={card.card_network} size={11} className="text-white/90" />
          </div>
        </div>

        {/* === BANK NAME + CARD NAME + LAST FOUR === */}
        <div className="relative z-10 flex items-start justify-between px-5 pt-3 pb-0" style={{ transform: 'translateZ(25px)' }}>
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0" style={{
              background: `linear-gradient(135deg, ${card.color}40, ${card.color}15)`,
              border: `1px solid ${card.color}30`,
            }}>
              <BankLogo bankName={card.bank} size={14} className="text-white" />
            </div>
            <div className="min-w-0">
              <div className="text-[10px] uppercase tracking-[0.15em] text-white/40 font-medium leading-none">{card.bank}</div>
              <div className="text-sm font-semibold text-white/90 tracking-wide mt-0.5 truncate">{card.name}</div>
            </div>
          </div>
          <div className="flex items-center gap-1 text-white/50 shrink-0 mt-0.5">
            <span className="text-[11px] font-mono tracking-wider">····{card.last_four}</span>
            <ChevronRight size={12} className="text-white/25" />
          </div>
        </div>

        {/* === SEPARATOR LINE === */}
        <div className="mx-5 mt-3.5 border-t border-white/[0.06]" />

        {/* === TOTAL OUTSTANDING + AVAILABLE LIMIT === */}
        <div className="relative z-10 flex items-start justify-between px-5 pt-3.5 pb-0" style={{ transform: 'translateZ(20px)' }}>
          <div>
            <div className="flex items-center gap-1">
              <span className="text-[10px] text-white/40 font-medium tracking-wide">Total Outstanding</span>
              <ChevronRight size={10} className="text-white/20" />
            </div>
            <div className="text-xl font-bold tabular text-white mt-0.5 tracking-tight">
              {formatCurrency(Math.max(0, currentBalance), card.currency)}
            </div>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-1 justify-end">
              <span className="text-[10px] text-white/40 font-medium tracking-wide">Available Limit</span>
              <ChevronRight size={10} className="text-white/20" />
            </div>
            <div className="text-base font-bold tabular text-white/80 mt-0.5 tracking-tight">
              {formatCurrency(availableLimit, card.currency)}
            </div>
          </div>
        </div>

        {/* === BILL STATUS STRIP — Bottom === */}
        <div className="relative z-10 mx-3 mt-4 mb-3 rounded-xl overflow-hidden" style={{ 
          transform: 'translateZ(15px)',
          background: 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.02) 100%)',
          border: '1px solid rgba(255,255,255,0.06)',
        }}>
          <div className="flex items-center gap-0 px-0.5 py-0.5">
            {/* Date Block */}
            <div className="flex flex-col items-center justify-center px-3 py-2 rounded-lg shrink-0" style={{
              background: `linear-gradient(135deg, ${card.color}30, ${card.color}15)`,
              minWidth: '48px',
            }}>
              <span className="text-[8px] font-bold uppercase tracking-widest text-white/70 leading-none">{dueMonth}</span>
              <span className="text-lg font-bold text-white leading-tight mt-px">{dueDay}</span>
            </div>

            {/* Bill Info */}
            <div className="flex-1 px-3 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-white/50 font-medium">Bill</span>
                <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-sm tracking-wide ${
                  isBillPaid 
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20' 
                    : urgentDue
                    ? 'bg-red-500/15 text-red-400 border border-red-500/20'
                    : 'bg-amber-500/15 text-amber-400 border border-amber-500/20'
                }`}>
                  {billStatusLabel}
                </span>
              </div>
              <div className="text-[11px] text-white/70 font-semibold mt-0.5">
                {daysToDue < 0
                  ? <span className="text-red-400">Overdue by {Math.abs(daysToDue)}d</span>
                  : daysToDue === 0
                  ? <span className="text-amber-400">Due today</span>
                  : <>Upcoming in <span className="text-white/90">{daysToDue}d</span></>
                }
              </div>
            </div>

            {/* Pay Early Button */}
            {!isBillPaid && (
              <div 
                className="shrink-0 mr-1 rounded-lg px-3 py-2 text-[10px] font-bold tracking-wide transition-colors"
                style={{
                  background: `linear-gradient(135deg, ${card.color}, color-mix(in oklab, ${card.color} 70%, black))`,
                  color: 'white',
                }}
              >
                Pay Early
              </div>
            )}

            {isBillPaid && (
              <div className="shrink-0 mr-1 flex items-center gap-1 rounded-lg px-3 py-2 bg-emerald-500/10 border border-emerald-500/15">
                <Check size={10} className="text-emerald-400" />
                <span className="text-[10px] font-bold text-emerald-400 tracking-wide">Paid</span>
              </div>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
