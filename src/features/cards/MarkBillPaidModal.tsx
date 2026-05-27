// ============================================================
// ZRHO — Cards: Mark Bill Paid Modal
// ============================================================

import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { useMarkBillPaid } from '@/hooks/useBills';
import { useCard } from '@/hooks/useCards';
import { useCreateTransaction } from '@/hooks/useTransactions';
import { formatCurrency } from '@/lib/currency';
import { format } from 'date-fns';
import { DatePicker } from '@/components/ui/DatePicker';

interface MarkBillPaidModalProps {
  isOpen: boolean;
  onClose: () => void;
  billId: string;
  cardId: string;
  statementAmount: number;
  minimumDue: number;
  currency: string;
}

export function MarkBillPaidModal({
  isOpen,
  onClose,
  billId,
  cardId,
  statementAmount,
  minimumDue,
  currency,
}: MarkBillPaidModalProps) {
  const [paidAmount, setPaidAmount] = useState(String(statementAmount));
  const [paidDate, setPaidDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  
  const { data: card } = useCard(cardId);
  const markPaid = useMarkBillPaid();
  const createTx = useCreateTransaction();

  const handleSubmit = async () => {
    const amount = parseFloat(paidAmount);
    if (amount <= 0) return;

    // 1. Mark the bill paid in cc_bills
    await markPaid.mutateAsync({
      bill_id: billId,
      card_id: cardId,
      paid_amount: amount,
      paid_date: paidDate,
      statement_amount: statementAmount,
    });

    // 2. Automatically log a corresponding credit transaction in transactions
    if (card) {
      await createTx.mutateAsync({
        card_id: cardId,
        amount: amount,
        transaction_type: 'credit',
        category: 'Bills & Utilities',
        merchant: `Statement Payment — ${card.bank}`,
        note: `Cleared statement bill cycle`,
        transaction_date: paidDate,
        statement_day: card.statement_day,
      });
    }

    onClose();
  };

  const inputClass =
    'w-full px-4 py-3 bg-background/50 border border-border/80 rounded-2xl text-foreground focus:border-foreground/45 transition-all duration-300 outline-none text-sm';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Settle Statement Balance">
      <div className="space-y-4 pt-1">
        <div className="bg-surface-elevated/40 border border-border/80 rounded-2xl p-4 space-y-2 text-xs backdrop-blur">
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground font-semibold uppercase tracking-wider text-[9px]">Statement Bill Owed</span>
            <span className="font-bold text-foreground text-sm">{formatCurrency(statementAmount, currency)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground font-semibold uppercase tracking-wider text-[9px]">Minimum Due</span>
            <span className="font-semibold text-foreground text-xs">{formatCurrency(minimumDue, currency)}</span>
          </div>
        </div>

        <div className="space-y-2">
          <label className="block text-[9px] uppercase tracking-widest text-muted-foreground font-bold mb-1">
            Payment Settled Amount
          </label>
          <input
            type="number"
            value={paidAmount}
            onChange={(e) => setPaidAmount(e.target.value)}
            className={inputClass}
            step="0.01"
            placeholder="0.00"
          />
          <div className="flex gap-1.5 mt-1.5">
            <button
              type="button"
              onClick={() => setPaidAmount(String(minimumDue))}
              className="text-[10px] uppercase font-bold tracking-wider px-3 py-1.5 rounded-xl border border-border bg-surface text-muted-foreground hover:text-foreground hover:bg-surface-elevated transition active:scale-95 cursor-pointer"
            >
              Min Due
            </button>
            <button
              type="button"
              onClick={() => setPaidAmount(String(statementAmount))}
              className="text-[10px] uppercase font-bold tracking-wider px-3 py-1.5 rounded-xl border border-border bg-surface text-muted-foreground hover:text-foreground hover:bg-surface-elevated transition active:scale-95 cursor-pointer"
            >
              Full Amount
            </button>
          </div>
        </div>

        <DatePicker
          label="Repayment Record Date"
          value={paidDate}
          onChange={setPaidDate}
        />

        <div className="flex gap-3 pt-3 border-t border-border/30">
          <button 
            onClick={handleSubmit} 
            disabled={markPaid.isPending}
            className="flex-1 rounded-2xl py-3.5 font-bold text-xs bg-foreground text-background hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {markPaid.isPending && (
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            )}
            Confirm Settlement
          </button>
          <button 
            type="button"
            onClick={onClose}
            className="rounded-2xl px-5 border border-border bg-transparent hover:bg-surface-elevated text-foreground text-xs font-semibold transition active:scale-[0.98] cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </div>
    </Modal>
  );
}
