// ============================================================
// ZRHO — Cards: Mark Bill Paid Modal
// ============================================================

import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { useMarkBillPaid } from '@/hooks/useBills';
import { formatCurrency } from '@/lib/currency';
import { format } from 'date-fns';

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
  const markPaid = useMarkBillPaid();

  const handleSubmit = async () => {
    const amount = parseFloat(paidAmount);
    if (amount <= 0) return;

    await markPaid.mutateAsync({
      bill_id: billId,
      card_id: cardId,
      paid_amount: amount,
      paid_date: paidDate,
      statement_amount: statementAmount,
    });
    onClose();
  };

  const inputClass =
    'w-full px-3 py-2 bg-[var(--color-zrho-surface-2)] border border-[var(--color-zrho-border)] rounded-lg text-[var(--color-zrho-text)] outline-none';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Record Payment">
      <div className="space-y-4">
        <div className="bg-[var(--color-zrho-surface-2)] rounded-lg p-3 space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-[var(--color-zrho-text-muted)]">Statement Amount</span>
            <span className="font-medium">{formatCurrency(statementAmount, currency)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[var(--color-zrho-text-muted)]">Minimum Due</span>
            <span>{formatCurrency(minimumDue, currency)}</span>
          </div>
        </div>

        <div>
          <label className="block text-sm text-[var(--color-zrho-text-muted)] mb-1">Amount Paid</label>
          <input
            type="number"
            value={paidAmount}
            onChange={(e) => setPaidAmount(e.target.value)}
            className={inputClass}
            step="0.01"
          />
          <div className="flex gap-2 mt-2">
            <button
              type="button"
              onClick={() => setPaidAmount(String(minimumDue))}
              className="text-xs px-2 py-1 rounded bg-[var(--color-zrho-surface-2)] text-[var(--color-zrho-text-muted)] hover:text-[var(--color-zrho-text)]"
            >
              Min Due
            </button>
            <button
              type="button"
              onClick={() => setPaidAmount(String(statementAmount))}
              className="text-xs px-2 py-1 rounded bg-[var(--color-zrho-surface-2)] text-[var(--color-zrho-text-muted)] hover:text-[var(--color-zrho-text)]"
            >
              Full Amount
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm text-[var(--color-zrho-text-muted)] mb-1">Payment Date</label>
          <input type="date" value={paidDate} onChange={(e) => setPaidDate(e.target.value)} className={inputClass} />
        </div>

        <div className="flex gap-3 pt-2">
          <Button onClick={handleSubmit} loading={markPaid.isPending} className="flex-1">
            Record Payment
          </Button>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
        </div>
      </div>
    </Modal>
  );
}
