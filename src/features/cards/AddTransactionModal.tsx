// ============================================================
// ZRHO — Cards: Add Transaction Modal
// ============================================================

import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { useCreateTransaction } from '@/hooks/useTransactions';
import { SPEND_CATEGORIES } from '@/types/card.types';
import { format } from 'date-fns';
import type { TransactionType } from '@/types/database.types';

interface AddTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  cardId: string;
  statementDay: number;
}

export function AddTransactionModal({
  isOpen,
  onClose,
  cardId,
  statementDay,
}: AddTransactionModalProps) {
  const [amount, setAmount] = useState('');
  const [txType, setTxType] = useState<TransactionType>('debit');
  const [category, setCategory] = useState<string>(SPEND_CATEGORIES[0]);
  const [merchant, setMerchant] = useState('');
  const [note, setNote] = useState('');
  const [txDate, setTxDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  const createTx = useCreateTransaction();

  const handleSubmit = async () => {
    if (!amount || parseFloat(amount) <= 0) return;

    await createTx.mutateAsync({
      card_id: cardId,
      amount: parseFloat(amount),
      transaction_type: txType,
      category,
      merchant: merchant || undefined,
      note: note || undefined,
      transaction_date: txDate,
      statement_day: statementDay,
    });

    // Reset and close
    setAmount('');
    setMerchant('');
    setNote('');
    setTxType('debit');
    setCategory(SPEND_CATEGORIES[0]);
    onClose();
  };

  const inputClass =
    'w-full px-3 py-2 bg-[var(--color-zrho-surface-2)] border border-[var(--color-zrho-border)] rounded-lg text-[var(--color-zrho-text)] outline-none';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Transaction">
      <div className="space-y-4">
        {/* Type Toggle */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setTxType('debit')}
            className={`flex-1 py-2 rounded-lg text-sm transition-colors ${
              txType === 'debit' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-[var(--color-zrho-surface-2)] text-[var(--color-zrho-text-muted)]'
            }`}
          >
            Debit (Spend)
          </button>
          <button
            type="button"
            onClick={() => setTxType('credit')}
            className={`flex-1 py-2 rounded-lg text-sm transition-colors ${
              txType === 'credit' ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-[var(--color-zrho-surface-2)] text-[var(--color-zrho-text-muted)]'
            }`}
          >
            Credit (Refund)
          </button>
        </div>

        {/* Amount */}
        <div>
          <label className="block text-sm text-[var(--color-zrho-text-muted)] mb-1">Amount</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className={inputClass}
            placeholder="0.00"
            step="0.01"
          />
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm text-[var(--color-zrho-text-muted)] mb-1">Category</label>
          <select value={category} onChange={(e) => setCategory(e.target.value)} className={inputClass}>
            {SPEND_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        {/* Merchant */}
        <div>
          <label className="block text-sm text-[var(--color-zrho-text-muted)] mb-1">Merchant (optional)</label>
          <input
            type="text"
            value={merchant}
            onChange={(e) => setMerchant(e.target.value)}
            className={inputClass}
            placeholder="e.g. Amazon, Swiggy"
          />
        </div>

        {/* Date */}
        <div>
          <label className="block text-sm text-[var(--color-zrho-text-muted)] mb-1">Date</label>
          <input
            type="date"
            value={txDate}
            onChange={(e) => setTxDate(e.target.value)}
            className={inputClass}
          />
        </div>

        {/* Note */}
        <div>
          <label className="block text-sm text-[var(--color-zrho-text-muted)] mb-1">Note (optional)</label>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className={inputClass}
            placeholder="What was this for?"
          />
        </div>

        <div className="flex gap-3 pt-2">
          <Button onClick={handleSubmit} loading={createTx.isPending} className="flex-1">
            Add Transaction
          </Button>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
        </div>
      </div>
    </Modal>
  );
}
