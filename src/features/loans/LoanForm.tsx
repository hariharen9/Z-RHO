// ============================================================
// ZRHO — Loans: Add/Edit Loan Form
// ============================================================

import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCreateLoan, useLoan, useUpdateLoan } from '@/hooks/useLoans';
import { calculateEMI, calculateTotalInterest } from '@/lib/calculations';
import { calculateEndDate, formatDate } from '@/lib/dates';
import { formatCurrency } from '@/lib/currency';
import { Button } from '@/components/ui/Button';
import { LOAN_TYPE_LABELS } from '@/lib/constants';
import type { LoanType } from '@/types/database.types';

const loanSchema = z.object({
  name: z.string().min(1, 'Loan name is required'),
  lender: z.string().min(1, 'Lender is required'),
  loan_type: z.enum(['home', 'personal', 'car', 'education', 'business', 'other']),
  currency: z.string(),
  principal_amount: z.coerce.number().positive('Principal must be positive'),
  interest_rate: z.coerce.number().min(0).max(100, 'Rate must be 0-100'),
  tenure_months: z.coerce.number().int().positive('Tenure must be positive'),
  emi_amount: z.coerce.number().optional(),
  emi_day: z.coerce.number().int().min(1).max(28, 'EMI day must be 1-28'),
  start_date: z.string().min(1, 'Start date is required'),
  notes: z.string().optional(),
});

type LoanFormData = z.infer<typeof loanSchema>;

export function LoanForm() {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();

  const { data: existingLoan } = useLoan(id);
  const createLoan = useCreateLoan();
  const updateLoan = useUpdateLoan();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loanSchema),
    defaultValues: {
      loan_type: 'personal',
      currency: 'INR',
      emi_day: 5,
    },
  });

  // Populate form when editing
  useEffect(() => {
    if (existingLoan) {
      setValue('name', existingLoan.name);
      setValue('lender', existingLoan.lender);
      setValue('loan_type', existingLoan.loan_type);
      setValue('currency', existingLoan.currency);
      setValue('principal_amount', existingLoan.principal_amount);
      setValue('interest_rate', existingLoan.interest_rate);
      setValue('tenure_months', existingLoan.tenure_months);
      setValue('emi_amount', existingLoan.emi_amount);
      setValue('emi_day', existingLoan.emi_day);
      setValue('start_date', existingLoan.start_date);
      setValue('notes', existingLoan.notes ?? '');
    }
  }, [existingLoan, setValue]);

  // Watch for live EMI calculation
  const principal = Number(watch('principal_amount')) || 0;
  const rate = Number(watch('interest_rate')) || 0;
  const tenure = Number(watch('tenure_months')) || 0;
  const startDate = String(watch('start_date') || '');
  const currency = String(watch('currency') || 'INR');

  const calculatedEMI = principal > 0 && rate >= 0 && tenure > 0
    ? calculateEMI(principal, rate, tenure)
    : 0;

  const totalInterest = calculatedEMI > 0
    ? calculateTotalInterest(principal, calculatedEMI, tenure)
    : 0;

  const totalPayable = principal + totalInterest;
  const endDate = startDate && tenure > 0 ? calculateEndDate(startDate, tenure) : '';

  const onSubmit = async (data: any) => {
    try {
      if (isEdit) {
        await updateLoan.mutateAsync({ id, ...data });
        navigate(`/loans/${id}`);
      } else {
        const loan = await createLoan.mutateAsync(data);
        navigate(`/loans/${loan.id}`);
      }
    } catch (err) {
      console.error('Failed to save loan:', err);
    }
  };

  const inputClass =
    'w-full px-3 py-2 bg-[var(--color-zrho-surface-2)] border border-[var(--color-zrho-border)] rounded-lg text-[var(--color-zrho-text)] focus:border-[var(--color-zrho-accent)] outline-none';

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">{isEdit ? 'Edit Loan' : 'Add New Loan'}</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-xl">
        {/* Name */}
        <div>
          <label className="block text-sm text-[var(--color-zrho-text-muted)] mb-1">Loan Name</label>
          <input {...register('name')} className={inputClass} placeholder="e.g. Home Loan - SBI" />
          {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name.message}</p>}
        </div>

        {/* Lender */}
        <div>
          <label className="block text-sm text-[var(--color-zrho-text-muted)] mb-1">Lender</label>
          <input {...register('lender')} className={inputClass} placeholder="Bank / NBFC name" />
          {errors.lender && <p className="text-red-400 text-xs mt-1">{errors.lender.message}</p>}
        </div>

        {/* Loan Type */}
        <div>
          <label className="block text-sm text-[var(--color-zrho-text-muted)] mb-1">Loan Type</label>
          <select {...register('loan_type')} className={inputClass}>
            {Object.entries(LOAN_TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>

        {/* Principal + Rate + Tenure (grid) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm text-[var(--color-zrho-text-muted)] mb-1">Principal Amount</label>
            <input {...register('principal_amount')} type="number" step="0.01" className={inputClass} placeholder="1000000" />
            {errors.principal_amount && <p className="text-red-400 text-xs mt-1">{errors.principal_amount.message}</p>}
          </div>
          <div>
            <label className="block text-sm text-[var(--color-zrho-text-muted)] mb-1">Interest Rate (% p.a.)</label>
            <input {...register('interest_rate')} type="number" step="0.01" className={inputClass} placeholder="8.5" />
            {errors.interest_rate && <p className="text-red-400 text-xs mt-1">{errors.interest_rate.message}</p>}
          </div>
          <div>
            <label className="block text-sm text-[var(--color-zrho-text-muted)] mb-1">Tenure (months)</label>
            <input {...register('tenure_months')} type="number" className={inputClass} placeholder="240" />
            {errors.tenure_months && <p className="text-red-400 text-xs mt-1">{errors.tenure_months.message}</p>}
          </div>
        </div>

        {/* Live EMI Preview */}
        {calculatedEMI > 0 && (
          <div className="bg-[var(--color-zrho-accent)]/10 border border-[var(--color-zrho-accent)]/30 rounded-lg p-4">
            <p className="text-sm text-[var(--color-zrho-text-muted)] mb-1">Calculated Monthly EMI</p>
            <p className="text-2xl font-bold text-[var(--color-zrho-accent)]">
              {formatCurrency(calculatedEMI, currency)}
            </p>
            <div className="grid grid-cols-3 gap-4 mt-3 text-sm">
              <div>
                <p className="text-[var(--color-zrho-text-muted)]">Total Interest</p>
                <p className="font-medium">{formatCurrency(totalInterest, currency)}</p>
              </div>
              <div>
                <p className="text-[var(--color-zrho-text-muted)]">Total Payable</p>
                <p className="font-medium">{formatCurrency(totalPayable, currency)}</p>
              </div>
              <div>
                <p className="text-[var(--color-zrho-text-muted)]">End Date</p>
                <p className="font-medium">{endDate ? formatDate(endDate) : '—'}</p>
              </div>
            </div>
          </div>
        )}

        {/* EMI Override */}
        <div>
          <label className="block text-sm text-[var(--color-zrho-text-muted)] mb-1">
            EMI Amount (auto-calculated, override if needed)
          </label>
          <input
            {...register('emi_amount')}
            type="number"
            step="0.01"
            className={inputClass}
            placeholder={calculatedEMI > 0 ? String(calculatedEMI) : ''}
          />
        </div>

        {/* EMI Day + Start Date */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-[var(--color-zrho-text-muted)] mb-1">EMI Day (1-28)</label>
            <input {...register('emi_day')} type="number" min="1" max="28" className={inputClass} />
            {errors.emi_day && <p className="text-red-400 text-xs mt-1">{errors.emi_day.message}</p>}
          </div>
          <div>
            <label className="block text-sm text-[var(--color-zrho-text-muted)] mb-1">Start Date</label>
            <input {...register('start_date')} type="date" className={inputClass} />
            {errors.start_date && <p className="text-red-400 text-xs mt-1">{errors.start_date.message}</p>}
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm text-[var(--color-zrho-text-muted)] mb-1">Notes (optional)</label>
          <textarea {...register('notes')} className={`${inputClass} min-h-[80px]`} placeholder="Any additional notes..." />
        </div>

        {/* Submit */}
        <div className="flex gap-3 pt-4">
          <Button type="submit" loading={createLoan.isPending || updateLoan.isPending}>
            {isEdit ? 'Save Changes' : 'Create Loan'}
          </Button>
          <Button type="button" variant="ghost" onClick={() => navigate(-1)}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
