import { useState, useMemo, useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Plus,
  Minus,
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
  ChevronDown,
  ChevronUp,
  CheckCircle,
  HelpCircle,
} from 'lucide-react';
import { format } from 'date-fns';

import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Dropdown } from '@/components/ui/Dropdown';
import { DatePicker } from '@/components/ui/DatePicker';
import { BankLogo } from '@/components/shared/BankLogo';
import { useCreateTransaction } from '@/hooks/useTransactions';
import { useCards } from '@/hooks/useCards';
import { SPEND_CATEGORIES } from '@/types/card.types';
import type { TransactionType } from '@/types/database.types';

interface AddCCTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

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
  'Home & Living': <Home size={14} className="shrink-0" />,
  'Electronics & Gadgets': <Smartphone size={14} className="shrink-0" />,
  'Gifts & Donations': <Gift size={14} className="shrink-0" />,
  'Transfer & Payment': <Send size={14} className="shrink-0" />,
  'Other': <MoreHorizontal size={14} className="shrink-0" />,
};

export function AddCCTransactionModal({ isOpen, onClose }: AddCCTransactionModalProps) {
  const queryClient = useQueryClient();
  const createTx = useCreateTransaction();
  const { data: cards = [] } = useCards('active');

  const [selectedCardId, setSelectedCardId] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<string>(SPEND_CATEGORIES[0]);
  const [merchant, setMerchant] = useState('');
  const [showDetails, setShowDetails] = useState(false);
  const [txType, setTxType] = useState<TransactionType>('debit');
  const [txDate, setTxDate] = useState(() => format(new Date(), 'yyyy-MM-dd'));
  const [note, setNote] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [validationError, setValidationError] = useState('');

  const prevOpen = useRef(isOpen);

  useEffect(() => {
    if (isOpen && !prevOpen.current) {
      setSelectedCardId(cards[0]?.id ?? '');
      setAmount('');
      setCategory(SPEND_CATEGORIES[0]);
      setMerchant('');
      setShowDetails(false);
      setTxType('debit');
      setTxDate(format(new Date(), 'yyyy-MM-dd'));
      setNote('');
      setValidationError('');
      setShowSuccess(false);
    }
    prevOpen.current = isOpen;
  }, [isOpen, cards]);

  const selectedCard = useMemo(() => {
    return cards.find((c) => c.id === selectedCardId);
  }, [cards, selectedCardId]);

  const activeCurrency = selectedCard?.currency ?? 'INR';

  const cardOptions = useMemo(() => {
    return cards.map((c) => ({
      value: c.id,
      label: `${c.bank} ${c.name} (•••• ${c.last_four})`,
      icon: (
        <div className="h-4 w-4 rounded bg-background flex items-center justify-center border border-border/40 overflow-hidden shrink-0">
          <BankLogo bankName={c.bank} size={10} className="text-foreground" />
        </div>
      ),
    }));
  }, [cards]);

  const categoryOptions = useMemo(() => {
    return SPEND_CATEGORIES.map((cat) => ({
      value: cat,
      label: cat,
      icon: CATEGORY_ICONS[cat] ?? <HelpCircle size={14} />,
    }));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError('');

    if (!selectedCardId) {
      setValidationError('Please select a credit card.');
      return;
    }

    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      setValidationError('Please enter a valid amount.');
      return;
    }

    if (!selectedCard) return;

    try {
      await createTx.mutateAsync({
        card_id: selectedCardId,
        amount: numericAmount,
        transaction_type: txType,
        category,
        merchant: merchant.trim() || undefined,
        note: note.trim() || undefined,
        transaction_date: txDate,
        statement_day: selectedCard.statement_day,
      });

      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['credit_cards'] });

      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        onClose();
      }, 1500);
    } catch (err) {
      setValidationError(err instanceof Error ? err.message : 'Failed to save transaction.');
    }
  };

  const inputClass =
    'w-full px-4 py-3 bg-background/50 border border-border/80 rounded-2xl text-foreground focus:border-foreground/45 transition-all duration-300 outline-none backdrop-blur-md text-sm';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="New Transaction" maxWidth="max-w-xl">
      {cards.length === 0 ? (
        <div className="py-8 text-center">
          <Sparkles size={24} className="mx-auto text-muted-foreground/60 mb-2" />
          <h3 className="text-xs font-semibold text-foreground mb-1">No Active Cards</h3>
          <p className="text-[10px] text-muted-foreground leading-relaxed max-w-[220px] mx-auto">
            You need an active credit card to log spending. Add one on the credit cards screen.
          </p>
        </div>
      ) : (
        <div className="relative">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Dropdown
                label="Card Source"
                options={cardOptions}
                value={selectedCardId}
                onChange={setSelectedCardId}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="block text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">
                  Amount ({activeCurrency})
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-4 text-xs font-medium text-muted-foreground pointer-events-none">
                    {activeCurrency === 'INR' ? '\u20B9' : '$'}
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className={`${inputClass} pl-8 font-mono text-sm`}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Dropdown
                  label="Category"
                  options={categoryOptions}
                  value={category}
                  onChange={setCategory}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">
                Merchant / Payee
              </label>
              <input
                type="text"
                placeholder="e.g. Swiggy, Swell, Amazon, Uber"
                value={merchant}
                onChange={(e) => setMerchant(e.target.value)}
                className={inputClass}
              />
            </div>

            <div>
              <button
                type="button"
                onClick={() => setShowDetails(!showDetails)}
                className="flex items-center gap-1 text-[10px] font-semibold text-muted-foreground hover:text-foreground tracking-wider uppercase transition-colors outline-none cursor-pointer"
              >
                {showDetails ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
                <span>{showDetails ? 'Fewer details' : 'More details (date, note, type)'}</span>
              </button>

              <AnimatePresence initial={false}>
                {showDetails && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25, type: 'spring', stiffness: 220, damping: 22 }}
                    className="overflow-visible"
                  >
                    <div className="pt-3.5 pb-1.5 space-y-3.5 border-t border-border/20 mt-3">
                      <div className="space-y-1.5">
                        <label className="block text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">
                          Transaction Type
                        </label>
                        <div className="flex gap-2 rounded-xl bg-background/40 p-1 border border-border/60">
                          <button
                            type="button"
                            onClick={() => setTxType('debit')}
                            className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer flex items-center justify-center gap-1 ${
                              txType === 'debit'
                                ? 'bg-destructive/15 text-destructive border border-destructive/20 shadow-sm'
                                : 'text-muted-foreground hover:text-foreground'
                            }`}
                          >
                            <Minus size={10} />
                            <span>Spend (Debit)</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setTxType('credit')}
                            className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer flex items-center justify-center gap-1 ${
                              txType === 'credit'
                                ? 'bg-success/15 text-success border border-success/20 shadow-sm'
                                : 'text-muted-foreground hover:text-foreground'
                            }`}
                          >
                            <Plus size={10} />
                            <span>Refund (Credit)</span>
                          </button>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <DatePicker
                          label="Transaction Date"
                          value={txDate}
                          onChange={setTxDate}
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">
                          Note / Memo
                        </label>
                        <input
                          type="text"
                          placeholder="What was this spend for?"
                          value={note}
                          onChange={(e) => setNote(e.target.value)}
                          className={inputClass}
                        />
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <AnimatePresence>
              {validationError && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl p-2.5"
                >
                  {validationError}
                </motion.div>
              )}
            </AnimatePresence>

            <div className="pt-1 flex gap-2">
              <Button
                type="submit"
                loading={createTx.isPending}
                className="w-full h-11 text-xs uppercase tracking-widest font-bold font-sans rounded-2xl transition duration-300"
              >
                Log spend
              </Button>
            </div>
          </form>

          <AnimatePresence>
            {showSuccess && (
              <motion.div
                initial={{ opacity: 0, backdropFilter: 'blur(0px)' }}
                animate={{ opacity: 1, backdropFilter: 'blur(8px)' }}
                exit={{ opacity: 0, backdropFilter: 'blur(0px)' }}
                className="absolute inset-0 bg-background/60 flex flex-col items-center justify-center z-40 rounded-3xl"
              >
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1, transition: { type: 'spring', stiffness: 300, damping: 15 } }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  className="text-center space-y-2 p-6"
                >
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-success/20 text-success border border-success/30">
                    <CheckCircle size={22} />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-foreground">Transaction Logged</h3>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      Your balances have been updated.
                    </p>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </Modal>
  );
}
