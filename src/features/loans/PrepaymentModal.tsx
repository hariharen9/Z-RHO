// ============================================================
// ZRHO — Loans: Prepayment Modal
// ============================================================

import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { useRecordPrepayment } from '@/hooks/useLoanPayments';
import { calculatePrepaymentImpact } from '@/lib/calculations';
import { formatCurrency } from '@/lib/currency';
import { format } from 'date-fns';
import type { PrepaymentType } from '@/types/database.types';

interface PrepaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  loanId: string;
  currentOutstanding: number;
  annualRate: number;
  emiAmount: number;
  remainingMonths: number;
  currency: string;
}

export function PrepaymentModal({
  isOpen,
  onClose,
  loanId,
  currentOutstanding,
  annualRate,
  emiAmount,
  remainingMonths,
  currency,
}: PrepaymentModalProps) {
  const [amount, setAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [prepaymentType, setPrepaymentType] = useState<PrepaymentType>('part_prepayment');
  const [notes, setNotes] = useState('');
  const recordPrepayment = useRecordPrepayment();

  const amountNum = parseFloat(amount) || 0;
  const isFullClosure = prepaymentType === 'full_closure';
  const effectiveAmount = isFullClosure ? currentOutstanding : amountNum;

  // Calculate impact preview
  const impact = effectiveAmount > 0 && effectiveAmount <= currentOutstanding
    ? calculatePrepaymentImpact(currentOutstanding, annualRate, emiAmount, effectiveAmount, remainingMonths)
    : null;

  const handleSubmit = async () => {
    if (effectiveAmount <= 0) return;

    await recordPrepayment.mutateAsync({
      loan_id: loanId,
      payment_date: paymentDate,
      amount: effectiveAmount,
      current_outstanding: currentOutstanding,
      annual_rate: annualRate,
      prepayment_type: prepaymentType,
      notes: notes || undefined,
    });
    onClose();
  };

  const inputClass =
    'w-full px-3 py-2 bg-[var(--color-zrho-surface-2)] border border-[var(--color-zrho-border)] rounded-lg text-[var(--color-zrho-text)] outline-none';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Prepayment">
      <div className="space-y-4">
        {/* Type */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setPrepaymentType('part_prepayment')}
            className={`flex-1 py-2 rounded-lg text-sm transition-colors ${
              prepaymentType === 'part_prepayment'
                ? 'bg-[var(--color-zrho-accent)] text-white'
                : 'bg-[var(--color-zrho-surface-2)] text-[var(--color-zrho-text-muted)]'
            }`}
          >
            Part Prepayment
          </button>
          <button
            type="button"
            onClick={() => setPrepaymentType('full_closure')}
            className={`flex-1 py-2 rounded-lg text-sm transition-colors ${
              prepaymentType === 'full_closure'
                ? 'bg-[var(--color-zrho-accent)] text-white'
                : 'bg-[var(--color-zrho-surface-2)] text-[var(--color-zrho-text-muted)]'
            }`}
          >
            Full Closure
          </button>
        </div>

        {/* Amount */}
        {!isFullClosure && (
          <div>
            <label className="block text-sm text-[var(--color-zrho-text-muted)] mb-1">Prepayment Amount</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className={inputClass}
              placeholder="e.g. 500000"
              max={currentOutstanding}
            />
            <p className="text-xs text-[var(--color-zrho-text-muted)] mt-1">
              Outstanding: {formatCurrency(currentOutstanding, currency)}
            </p>
          </div>
        )}

        {isFullClosure && (
          <div className="bg-[var(--color-zrho-surface-2)] rounded-lg p-3">
            <p className="text-sm text-[var(--color-zrho-text-muted)]">Closure Amount</p>
            <p className="text-xl font-bold">{formatCurrency(currentOutstanding, currency)}</p>
          </div>
        )}

        {/* Impact Preview */}
        {impact && (
          <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 space-y-2">
            <p className="text-sm font-medium text-green-400">Prepayment Impact</p>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <p className="text-[var(--color-zrho-text-muted)]">New Outstanding</p>
                <p className="font-medium">{formatCurrency(impact.newOutstanding, currency)}</p>
              </div>
              <div>
                <p className="text-[var(--color-zrho-text-muted)]">Interest Saved</p>
                <p className="font-medium text-green-400">{formatCurrency(impact.interestSaved, currency)}</p>
              </div>
              <div>
                <p className="text-[var(--color-zrho-text-muted)]">Months Saved</p>
                <p className="font-medium text-green-400">{impact.monthsSaved} months</p>
              </div>
              <div>
                <p className="text-[var(--color-zrho-text-muted)]">New Tenure</p>
                <p className="font-medium">{impact.newTenureMonths} months</p>
              </div>
            </div>
          </div>
        )}

        {/* Date + Notes */}
        <div>
          <label className="block text-sm text-[var(--color-zrho-text-muted)] mb-1">Payment Date</label>
          <input type="date" value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className="block text-sm text-[var(--color-zrho-text-muted)] mb-1">Notes</label>
          <input type="text" value={notes} onChange={(e) => setNotes(e.target.value)} className={inputClass} placeholder="Optional notes" />
        </div>

        <div className="flex gap-3 pt-2">
          <Button onClick={handleSubmit} loading={recordPrepayment.isPending} className="flex-1">
            {isFullClosure ? 'Close Loan' : 'Record Prepayment'}
          </Button>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
        </div>
      </div>
    </Modal>
  );
}
