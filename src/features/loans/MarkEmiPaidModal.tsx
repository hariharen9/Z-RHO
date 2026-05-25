// ============================================================
// ZRHO — Loans: Mark EMI Paid Modal
// ============================================================

import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { AmountDisplay } from '@/components/shared/AmountDisplay';
import { useRecordPayment } from '@/hooks/useLoanPayments';
import { calculateEMIBreakdown } from '@/lib/calculations';
import { formatCurrency } from '@/lib/currency';
import { format, startOfMonth } from 'date-fns';

interface MarkEmiPaidModalProps {
  isOpen: boolean;
  onClose: () => void;
  loanId: string;
  emiAmount: number;
  currentOutstanding: number;
  annualRate: number;
  currency: string;
}

export function MarkEmiPaidModal({
  isOpen,
  onClose,
  loanId,
  emiAmount,
  currentOutstanding,
  annualRate,
  currency,
}: MarkEmiPaidModalProps) {
  const [paymentDate, setPaymentDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [notes, setNotes] = useState('');
  const recordPayment = useRecordPayment();

  const { principal, interest } = calculateEMIBreakdown(currentOutstanding, annualRate, emiAmount);
  const emiMonth = format(startOfMonth(new Date()), 'yyyy-MM-dd');

  const handleSubmit = async () => {
    await recordPayment.mutateAsync({
      loan_id: loanId,
      payment_date: paymentDate,
      emi_month: emiMonth,
      amount_paid: emiAmount,
      current_outstanding: currentOutstanding,
      annual_rate: annualRate,
      notes: notes || undefined,
    });
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Mark EMI as Paid">
      <div className="space-y-4">
        {/* Breakdown */}
        <div className="bg-[var(--color-zrho-surface-2)] rounded-lg p-4">
          <div className="flex justify-between mb-2">
            <span className="text-[var(--color-zrho-text-muted)]">EMI Amount</span>
            <AmountDisplay amount={emiAmount} currency={currency} size="md" />
          </div>
          <div className="flex justify-between mb-2">
            <span className="text-[var(--color-zrho-text-muted)]">Principal Component</span>
            <span className="text-green-400">{formatCurrency(principal, currency)}</span>
          </div>
          <div className="flex justify-between mb-2">
            <span className="text-[var(--color-zrho-text-muted)]">Interest Component</span>
            <span className="text-amber-400">{formatCurrency(interest, currency)}</span>
          </div>
          <hr className="border-[var(--color-zrho-border)] my-2" />
          <div className="flex justify-between">
            <span className="text-[var(--color-zrho-text-muted)]">Outstanding After</span>
            <span className="font-semibold">
              {formatCurrency(Math.max(0, currentOutstanding - principal), currency)}
            </span>
          </div>
        </div>

        {/* Payment Date */}
        <div>
          <label className="block text-sm text-[var(--color-zrho-text-muted)] mb-1">Payment Date</label>
          <input
            type="date"
            value={paymentDate}
            onChange={(e) => setPaymentDate(e.target.value)}
            className="w-full px-3 py-2 bg-[var(--color-zrho-surface-2)] border border-[var(--color-zrho-border)] rounded-lg text-[var(--color-zrho-text)] outline-none"
          />
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm text-[var(--color-zrho-text-muted)] mb-1">Notes (optional)</label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full px-3 py-2 bg-[var(--color-zrho-surface-2)] border border-[var(--color-zrho-border)] rounded-lg text-[var(--color-zrho-text)] outline-none"
            placeholder="e.g. Paid via auto-debit"
          />
        </div>

        <div className="flex gap-3 pt-2">
          <Button onClick={handleSubmit} loading={recordPayment.isPending} className="flex-1">
            Confirm Payment
          </Button>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </div>
    </Modal>
  );
}
