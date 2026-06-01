// ============================================================
// ZRHO — Cards: Transaction List (Enhanced)
// ============================================================

import { useState, useMemo } from 'react';
import type { CCTransaction, CCTransactionWithCard, CreditCard } from '@/types/database.types';
import { formatCurrency, convertCurrency } from '@/lib/currency';
import { formatDate } from '@/lib/dates';
import { SPEND_CATEGORIES } from '@/types/card.types';
import { BankLogo } from '@/components/shared/BankLogo';
import { useProfile } from '@/hooks/useProfile';
import { format, subDays, startOfMonth, isAfter, parseISO } from 'date-fns';
import { Dropdown } from '@/components/ui/Dropdown';
import type { DropdownOption } from '@/components/ui/Dropdown';
import { EditCCTransactionModal } from './EditCCTransactionModal';
import {
  Calendar,
  Tag,
  CreditCard as CardIcon,
  Clock,
  Utensils,
  Car,
  ShoppingBag,
  Fuel,
  Lightbulb,
  Film,
  HeartPulse,
  Rss,
  GraduationCap,
  Home,
  Smartphone,
  Gift,
  Send,
  MoreHorizontal,
  HelpCircle,
} from 'lucide-react';

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  'Food & Dining': <Utensils size={14} className="shrink-0" />,
  'Travel & Transport': <Car size={14} className="shrink-0" />,
  'Shopping & Retail': <ShoppingBag size={14} className="shrink-0" />,
  'Fuel': <Fuel size={14} className="shrink-0" />,
  'Bills & Utilities': <Lightbulb size={14} className="shrink-0" />,
  'Entertainment & Leisure': <Film size={14} className="shrink-0" />,
  'Health & Medical': <HeartPulse size={14} className="shrink-0" />,
  'Subscriptions & Services': <Rss size={14} className="shrink-0" />,
  'Education': <GraduationCap size={14} className="shrink-0" />,
  'Home & Housing': <Home size={14} className="shrink-0" />,
  'Groceries & essentials': <ShoppingBag size={14} className="shrink-0" />,
  'Electronics & Gadgets': <Smartphone size={14} className="shrink-0" />,
  'Gifts & Donations': <Gift size={14} className="shrink-0" />,
  'Transfer & Payment': <Send size={14} className="shrink-0" />,
  'Other': <MoreHorizontal size={14} className="shrink-0" />,
};

type Tx = CCTransaction | CCTransactionWithCard;

interface TransactionListProps {
  transactions: Tx[];
  cards?: CreditCard[]; // Optional, passed if we want to show card filter
  currency?: string; // If provided, forces display in this currency. If not, uses native tx currency or global default.
  showCardContext?: boolean; // Whether to show the bank logo / card name
}

type DateRange = 'all' | 'this_month' | 'last_30' | 'last_90';

export function TransactionList({ transactions, cards, currency, showCardContext }: TransactionListProps) {
  const { data: profile } = useProfile();
  const defaultCurrency = profile?.default_currency ?? 'INR';
  const targetCurrency = currency ?? defaultCurrency;

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [cardFilter, setCardFilter] = useState('');
  const [dateRange, setDateRange] = useState<DateRange>('all');
  const [editingTx, setEditingTx] = useState<Tx | null>(null);

  const dateOptions: DropdownOption[] = useMemo(() => [
    { value: 'all', label: 'All Time', icon: <Clock size={14} className="shrink-0" /> },
    { value: 'this_month', label: 'This Month', icon: <Calendar size={14} className="shrink-0" /> },
    { value: 'last_30', label: 'Last 30 Days', icon: <Calendar size={14} className="shrink-0" /> },
    { value: 'last_90', label: 'Last 90 Days', icon: <Calendar size={14} className="shrink-0" /> },
  ], []);

  const categoryOptions: DropdownOption[] = useMemo(() => [
    { value: '', label: 'All Categories', icon: <Tag size={14} className="shrink-0" /> },
    ...SPEND_CATEGORIES.map((cat) => ({
      value: cat,
      label: cat,
      icon: CATEGORY_ICONS[cat] ?? <HelpCircle size={14} className="shrink-0" />,
    })),
  ], []);

  const cardOptions: DropdownOption[] = useMemo(() => {
    if (!cards) return [];
    return [
      { value: '', label: 'All Cards', icon: <CardIcon size={14} className="shrink-0" /> },
      ...cards.map((c) => ({
        value: c.id,
        label: `${c.bank} ${c.name}`,
        icon: (
          <div className="h-4 w-4 rounded bg-background flex items-center justify-center border border-border/40 overflow-hidden shrink-0">
            <BankLogo bankName={c.bank} size={10} className="text-foreground" />
          </div>
        ),
      })),
    ];
  }, [cards]);

  const filtered = useMemo(() => {
    return transactions.filter((tx) => {
      // 1. Category
      if (categoryFilter && tx.category !== categoryFilter) return false;
      
      // 2. Card
      if (cardFilter) {
        if ('credit_cards' in tx && tx.credit_cards?.id !== cardFilter) return false;
        if (!('credit_cards' in tx) && tx.card_id !== cardFilter) return false;
      }

      // 3. Search
      if (search) {
        const s = search.toLowerCase();
        const matchesMerchant = tx.merchant?.toLowerCase().includes(s);
        const matchesNote = tx.note?.toLowerCase().includes(s);
        const matchesCategory = tx.category.toLowerCase().includes(s);
        let matchesCard = false;
        if ('credit_cards' in tx && tx.credit_cards) {
          matchesCard = tx.credit_cards.name.toLowerCase().includes(s) || tx.credit_cards.bank.toLowerCase().includes(s);
        }
        if (!matchesMerchant && !matchesNote && !matchesCategory && !matchesCard) return false;
      }

      // 4. Date Range
      if (dateRange !== 'all') {
        const txDate = parseISO(tx.transaction_date);
        const today = new Date();
        if (dateRange === 'this_month') {
          if (!isAfter(txDate, startOfMonth(today))) return false;
        } else if (dateRange === 'last_30') {
          if (!isAfter(txDate, subDays(today, 30))) return false;
        } else if (dateRange === 'last_90') {
          if (!isAfter(txDate, subDays(today, 90))) return false;
        }
      }

      return true;
    });
  }, [transactions, categoryFilter, cardFilter, search, dateRange]);

  // Calculate summary
  const totalSpend = useMemo(() => {
    return filtered.reduce((sum, tx) => {
      if (tx.transaction_type === 'debit') {
        let txCurrency = targetCurrency;
        if ('credit_cards' in tx && tx.credit_cards) {
          txCurrency = tx.credit_cards.currency;
        } else if (cards) {
          const c = cards.find(c => c.id === tx.card_id);
          if (c) txCurrency = c.currency;
        }
        return sum + convertCurrency(Number(tx.amount), txCurrency, targetCurrency);
      }
      return sum;
    }, 0);
  }, [filtered, targetCurrency, cards]);

  return (
    <div className="space-y-4">
      {/* Summary Header */}
      {showCardContext && (
        <div className="flex items-center justify-between p-4 rounded-2xl bg-surface-elevated border border-border">
          <div>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Total Spend</h3>
            <div className="text-xl font-bold tabular-nums text-foreground mt-1">
              {formatCurrency(totalSpend, targetCurrency)}
            </div>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-muted-foreground bg-background px-2 py-1 rounded-md border border-border">
              {filtered.length} {filtered.length === 1 ? 'Transaction' : 'Transactions'}
            </span>
          </div>
        </div>
      )}

      {/* Advanced Filters */}
      <div className="flex flex-col gap-2">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search merchant, note, or card..."
          className="w-full px-4 py-3 bg-surface-elevated border border-border rounded-xl text-sm text-foreground outline-none focus:border-foreground/30 transition-colors"
        />
        
        <div className="flex flex-wrap gap-2 pb-1">
          <Dropdown
            size="compact"
            options={dateOptions}
            value={dateRange}
            onChange={(val) => setDateRange(val as DateRange)}
          />

          <Dropdown
            size="compact"
            options={categoryOptions}
            value={categoryFilter}
            onChange={setCategoryFilter}
          />

          {showCardContext && cards && cards.length > 0 && (
            <Dropdown
              size="compact"
              options={cardOptions}
              value={cardFilter}
              onChange={setCardFilter}
              className="max-w-[160px]"
            />
          )}
        </div>
      </div>

      {/* Transaction List */}
      {filtered.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-border rounded-2xl bg-surface/30">
          <p className="text-sm text-muted-foreground">No transactions found</p>
        </div>
      ) : (
        <div className="space-y-1">
          {filtered.map((tx) => {
            const hasCardContext = 'credit_cards' in tx && !!tx.credit_cards;
            const txCurrency = hasCardContext 
              ? (tx as CCTransactionWithCard).credit_cards.currency 
              : (currency ?? defaultCurrency);
            
            return (
              <div
                key={tx.id}
                onClick={() => setEditingTx(tx)}
                className="cursor-pointer flex items-center justify-between p-3 rounded-xl hover:bg-surface-elevated transition-colors border border-transparent hover:border-border/50 group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {showCardContext && hasCardContext && (
                    <div 
                      className="h-10 w-10 rounded-lg flex items-center justify-center shrink-0 border border-white/10"
                      style={{ background: `linear-gradient(135deg, ${(tx as CCTransactionWithCard).credit_cards.color}40, transparent)` }}
                    >
                      <BankLogo bankName={(tx as CCTransactionWithCard).credit_cards.bank} size={16} className="text-foreground" />
                    </div>
                  )}
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold truncate text-foreground">
                        {tx.merchant || tx.category}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-[10px] text-muted-foreground bg-surface-elevated px-1.5 py-0.5 rounded">
                        {tx.category}
                      </span>
                      <span className="text-[10px] text-muted-foreground/60">•</span>
                      <span className="text-[10px] text-muted-foreground">
                        {formatDate(tx.transaction_date)}
                      </span>
                    </div>
                    {tx.note && (
                      <div className="text-[10px] text-muted-foreground/80 truncate mt-1 italic">
                        "{tx.note}"
                      </div>
                    )}
                  </div>
                </div>

                <div className="text-right shrink-0 ml-4">
                  <div
                    className={`font-bold text-sm tabular-nums ${
                      tx.transaction_type === 'debit' ? 'text-foreground' : 'text-success'
                    }`}
                  >
                    {tx.transaction_type === 'debit' ? '' : '+'}
                    {formatCurrency(tx.amount, txCurrency)}
                  </div>
                  {showCardContext && hasCardContext && (
                    <div className="text-[9px] uppercase tracking-widest text-muted-foreground font-semibold mt-1">
                      {(tx as CCTransactionWithCard).credit_cards.bank} ••{(tx as CCTransactionWithCard).credit_cards.last_four}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Edit Modal */}
      <EditCCTransactionModal
        isOpen={!!editingTx}
        onClose={() => setEditingTx(null)}
        transaction={editingTx}
      />
    </div>
  );
}
