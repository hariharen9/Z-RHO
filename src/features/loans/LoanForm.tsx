// ============================================================
// ZRHO — Loans: Add/Edit Loan Form
// ============================================================

import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Landmark,
  Sparkles,
  TrendingDown,
  Target,
  Zap,
  Home,
  Car,
  GraduationCap,
  Briefcase,
  User,
  Coins,
  CreditCard,
  Info
} from 'lucide-react';
import { useCreateLoan, useLoan, useUpdateLoan } from '@/hooks/useLoans';
import { useCards } from '@/hooks/useCards';

const categoryConfig: Record<
  string,
  {
    icon: any;
    color: string;
    bgColor: string;
    glowColor: string;
    label: string;
    typicalRate: string;
  }
> = {
  home: {
    icon: Home,
    color: 'text-sky-400',
    bgColor: 'bg-sky-500/10 border-sky-500/20',
    glowColor: 'rgba(56, 189, 248, 0.15)',
    label: 'Home Loan',
    typicalRate: '~7%–10% (house acts as collateral)',
  },
  personal: {
    icon: User,
    color: 'text-pink-400',
    bgColor: 'bg-pink-500/10 border-pink-500/20',
    glowColor: 'rgba(244, 63, 94, 0.15)',
    label: 'Personal Loan',
    typicalRate: '~10%–30% (unsecured high risk)',
  },
  car: {
    icon: Car,
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/10 border-amber-500/20',
    glowColor: 'rgba(251, 191, 36, 0.15)',
    label: 'Car Loan',
    typicalRate: '~7.5%–11% (vehicle acts as collateral)',
  },
  education: {
    icon: GraduationCap,
    color: 'text-violet-400',
    bgColor: 'bg-violet-500/10 border-violet-500/20',
    glowColor: 'rgba(167, 139, 250, 0.15)',
    label: 'Education Loan',
    typicalRate: '~7%–13% (subsidized/course dependent)',
  },
  business: {
    icon: Briefcase,
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/10 border-emerald-500/20',
    glowColor: 'rgba(52, 211, 153, 0.15)',
    label: 'Business Loan',
    typicalRate: '~10%–25% (depends on history/collateral)',
  },
  other: {
    icon: Coins,
    color: 'text-indigo-400',
    bgColor: 'bg-indigo-500/10 border-indigo-500/20',
    glowColor: 'rgba(129, 140, 248, 0.15)',
    label: 'Other Loan',
    typicalRate: '~8%–36%+ (varies widely)',
  },
};
import { calculateEMI, calculateTotalInterest } from '@/lib/calculations';
import { calculateEndDate, formatDate } from '@/lib/dates';
import { formatCurrency, numberToWordsCompact } from '@/lib/currency';
import { Button } from '@/components/ui/Button';
import { LOAN_TYPE_LABELS } from '@/lib/constants';
import { Dropdown } from '@/components/ui/Dropdown';
import type { DropdownOption } from '@/components/ui/Dropdown';
import { DatePicker } from '@/components/ui/DatePicker';

const loanTypeOptions: DropdownOption[] = Object.entries(LOAN_TYPE_LABELS).map(([value, label]) => ({
  value,
  label,
}));

const currencyOptions: DropdownOption[] = [
  { value: 'INR', label: 'INR (₹)' },
  { value: 'USD', label: 'USD ($)' },
  { value: 'EUR', label: 'EUR (€)' },
  { value: 'GBP', label: 'GBP (£)' },
  { value: 'SGD', label: 'SGD (S$)' },
  { value: 'CAD', label: 'CAD (C$)' },
  { value: 'AUD', label: 'AUD (A$)' },
  { value: 'AED', label: 'AED (AED)' },
  { value: 'JPY', label: 'JPY (¥)' },
  { value: 'CHF', label: 'CHF (CHF)' },
];

const loanSchema = z.object({
  name: z.string().min(1, 'Loan name is required'),
  lender: z.string().min(1, 'Lender is required'),
  loan_type: z.enum(['home', 'personal', 'car', 'education', 'business', 'other']),
  currency: z.string(),
  principal_amount: z.coerce.number().positive('Principal must be positive'),
  interest_rate: z.coerce.number().min(0).max(100, 'Rate must be 0-100'),
  tenure_months: z.coerce.number().int().positive('Tenure must be positive'),
  emi_amount: z.coerce.number().optional(),
  emi_day: z.coerce.number().int().min(1).max(31, 'EMI day must be 1-31'),
  start_date: z.string().min(1, 'Start date is required'),
  notes: z.string().optional(),
  linked_card_id: z.string().nullable().optional(),
  is_third_party: z.boolean().default(false),
  third_party_name: z.string().nullable().optional(),
});

type LoanFormData = z.infer<typeof loanSchema>;

export function LoanForm() {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();

  const [tenureUnit, setTenureUnit] = useState<'months' | 'years'>('months');

  const { data: existingLoan } = useLoan(id);
  const { data: cards } = useCards();
  const createLoan = useCreateLoan();
  const updateLoan = useUpdateLoan();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    control,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loanSchema),
    defaultValues: {
      loan_type: 'personal',
      currency: 'INR',
      emi_day: 5,
      linked_card_id: null,
      is_third_party: false,
      third_party_name: null,
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
      setValue('linked_card_id', existingLoan.linked_card_id ?? null);
      setValue('is_third_party', existingLoan.is_third_party ?? false);
      setValue('third_party_name', existingLoan.third_party_name ?? null);

      if (existingLoan.tenure_months % 12 === 0) {
        setTenureUnit('years');
      } else {
        setTenureUnit('months');
      }
    }
  }, [existingLoan, setValue]);

  // Watch for live EMI calculation
  const principal = Number(watch('principal_amount')) || 0;
  const rate = Number(watch('interest_rate')) || 0;
  const tenure = Number(watch('tenure_months')) || 0;
  const startDate = String(watch('start_date') || '');
  const currency = String(watch('currency') || 'INR');
  const watchName = watch('name') || 'LOAN PROFILE';
  const watchLender = watch('lender') || 'LENDER';
  const loanType = watch('loan_type') || 'personal';
  const linkedCardId = watch('linked_card_id');

  const cardOptions: DropdownOption[] = useMemo(() => {
    if (!cards) return [{ value: '', label: 'None' }];
    return [
      { value: '', label: 'None (Standalone Loan)' },
      ...cards.map((c) => ({
        value: c.id,
        label: `${c.name} (${c.bank} •••• ${c.last_four})`,
      })),
    ];
  }, [cards]);

  const calculatedEMI = useMemo(() => {
    return principal > 0 && rate >= 0 && tenure > 0
      ? calculateEMI(principal, rate, tenure)
      : 0;
  }, [principal, rate, tenure]);

  const totalInterest = useMemo(() => {
    return calculatedEMI > 0
      ? calculateTotalInterest(principal, calculatedEMI, tenure)
      : 0;
  }, [principal, calculatedEMI, tenure]);

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
    'w-full px-4 py-3 bg-background/50 border border-border/80 rounded-2xl text-foreground focus:border-foreground/45 transition-all duration-300 outline-none backdrop-blur-md text-sm';

  const principalRatio = totalPayable > 0 ? principal / totalPayable : 1;
  const interestRatio = 1 - principalRatio;

  const isThirdParty = watch('is_third_party');

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Title & Back Bar */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-full border border-border bg-surface text-muted-foreground hover:text-foreground transition active:scale-90"
        >
          <ArrowLeft size={16} />
        </button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {isEdit ? 'Modify Liability Terms' : 'Register Installment Loan'}
          </h1>
          <p className="text-xs text-muted-foreground">
            {isEdit ? 'Update principal, interest or start dates' : 'Track home, car, education or personal loans'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Glassmorphism input controls */}
        <div className="lg:col-span-7 rounded-3xl border border-border bg-surface p-6 space-y-6 backdrop-blur">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            
            {/* Loan Name */}
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-1.5">
                Loan Title
              </label>
              <input
                {...register('name')}
                className={inputClass}
                placeholder="e.g. SBI Home Loan, Education Loan"
              />
              {errors.name && <p className="text-red-400 text-xs mt-1 font-medium">{errors.name.message}</p>}
            </div>

            {/* Lender */}
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-1.5">
                Lender / Creditor
              </label>
              <input
                {...register('lender')}
                className={inputClass}
                placeholder="e.g. State Bank of India, HDFC Bank"
              />
              {errors.lender && <p className="text-red-400 text-xs mt-1 font-medium">{errors.lender.message}</p>}
            </div>

            {/* Loan Type + Currency */}
            <div className="grid grid-cols-2 gap-4">
              <Controller
                control={control}
                name="loan_type"
                render={({ field }) => (
                  <Dropdown
                    label="Loan Category"
                    options={loanTypeOptions}
                    value={field.value}
                    onChange={field.onChange}
                  />
                )}
              />
              <Controller
                control={control}
                name="currency"
                render={({ field }) => (
                  <Dropdown
                    label="Currency ISO"
                    options={currencyOptions}
                    value={field.value}
                    onChange={field.onChange}
                  />
                )}
              />
            </div>

            {/* Linked Credit Card (Optional) */}
            <div className="bg-surface-elevated/30 p-4 rounded-2xl border border-border/50">
              <Controller
                control={control}
                name="linked_card_id"
                render={({ field }) => (
                  <Dropdown
                    label="Linked Credit Card (Optional - For CC EMIs)"
                    options={cardOptions}
                    value={field.value || ''}
                    onChange={(val) => field.onChange(val || null)}
                  />
                )}
              />
              <AnimatePresence>
                {linkedCardId && (
                  <motion.div
                    initial={{ opacity: 0, height: 0, marginTop: 0 }}
                    animate={{ opacity: 1, height: 'auto', marginTop: 12 }}
                    exit={{ opacity: 0, height: 0, marginTop: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="flex items-start gap-2 text-[11px] text-muted-foreground bg-primary/5 p-3 rounded-xl border border-primary/10">
                      <Info size={14} className="text-primary shrink-0 mt-0.5" />
                      <p>
                        This loan's outstanding principal will be <strong className="text-foreground">deducted from this card's available limit</strong>. EMI payments will be posted to the card's ledger.
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Friend's Loan / Third Party */}
            <div className="bg-surface/50 p-4 rounded-2xl border border-border/50">
              <label className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  {...register('is_third_party')}
                  className="w-4 h-4 rounded text-primary focus:ring-primary/50 border-border bg-background transition-colors"
                />
                <div className="flex flex-col">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-foreground group-hover:text-primary transition-colors">This is a Friend's Loan (Third-Party)</span>
                  <span className="text-[10px] text-muted-foreground mt-0.5">Exclude from your personal net-worth tracking, but keep CC limit blocked.</span>
                </div>
              </label>

              <AnimatePresence>
                {isThirdParty && (
                  <motion.div
                    initial={{ opacity: 0, height: 0, marginTop: 0 }}
                    animate={{ opacity: 1, height: 'auto', marginTop: 16 }}
                    exit={{ opacity: 0, height: 0, marginTop: 0 }}
                    className="overflow-hidden"
                  >
                    <div>
                      <label className="block text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-1.5">
                        Friend's Name
                      </label>
                      <input
                        {...register('third_party_name')}
                        type="text"
                        className={inputClass}
                        placeholder="e.g. Alex"
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Principal + Interest Rate + Tenure */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-1.5">
                  Principal Amount
                </label>
                <input
                  {...register('principal_amount')}
                  type="number"
                  step="0.01"
                  className={inputClass}
                  placeholder="e.g. 1500000"
                />
                {errors.principal_amount ? (
                  <p className="text-red-400 text-xs mt-1 font-medium">{errors.principal_amount.message}</p>
                ) : principal >= 1000 ? (
                  <p className="text-[10px] text-muted-foreground font-medium mt-1.5 px-1 tracking-wide">
                    {numberToWordsCompact(principal, currency)}
                  </p>
                ) : null}
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-1.5">
                  Interest Rate (% p.a.)
                </label>
                <input
                  {...register('interest_rate')}
                  type="number"
                  step="0.01"
                  className={inputClass}
                  placeholder="e.g. 8.5"
                />
                {errors.interest_rate ? (
                  <p className="text-red-400 text-xs mt-1 font-medium">{errors.interest_rate.message}</p>
                ) : (
                  <p className="text-[10px] text-muted-foreground font-medium mt-1.5 px-1 tracking-wide">
                    Typical: {categoryConfig[loanType]?.typicalRate || '—'}
                  </p>
                )}
              </div>
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">
                    Tenure
                  </label>
                  <div className="flex bg-background/80 p-0.5 rounded-lg border border-border/50 text-[9px] font-bold uppercase tracking-wider">
                    <button
                      type="button"
                      onClick={() => setTenureUnit('months')}
                      className={`px-2 py-0.5 rounded-md transition-all duration-200 ${
                        tenureUnit === 'months'
                          ? 'bg-surface text-foreground shadow-sm'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      Months
                    </button>
                    <button
                      type="button"
                      onClick={() => setTenureUnit('years')}
                      className={`px-2 py-0.5 rounded-md transition-all duration-200 ${
                        tenureUnit === 'years'
                          ? 'bg-surface text-foreground shadow-sm'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      Years
                    </button>
                  </div>
                </div>
                <input
                  type="number"
                  step="any"
                  value={
                    tenure > 0
                      ? tenureUnit === 'years'
                        ? tenure % 12 === 0
                          ? tenure / 12
                          : parseFloat((tenure / 12).toFixed(2))
                        : tenure
                      : ''
                  }
                  onChange={(e) => {
                    const val = parseFloat(e.target.value) || 0;
                    setValue(
                      'tenure_months',
                      tenureUnit === 'years'
                        ? Math.round(val * 12)
                        : Math.round(val),
                      {
                        shouldValidate: true,
                        shouldDirty: true,
                      }
                    );
                  }}
                  className={inputClass}
                  placeholder={tenureUnit === 'years' ? 'e.g. 5' : 'e.g. 24'}
                />
                {errors.tenure_months ? (
                  <p className="text-red-400 text-xs mt-1 font-medium">{errors.tenure_months.message}</p>
                ) : tenure > 0 ? (
                  <p className="text-[10px] text-muted-foreground font-medium mt-1.5 px-1 tracking-wide">
                    {tenureUnit === 'years'
                      ? `Equivalent to ${tenure} months`
                      : `Equivalent to ${
                          tenure % 12 === 0
                            ? `${tenure / 12} years`
                            : `${parseFloat((tenure / 12).toFixed(2))} years`
                        }`}
                  </p>
                ) : null}
              </div>
            </div>

            {/* Optional EMI amount override */}
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-1.5">
                EMI Amount Override (optional)
              </label>
              <input
                {...register('emi_amount')}
                type="number"
                step="0.01"
                className={inputClass}
                placeholder={calculatedEMI > 0 ? `Auto calculates to: ${calculatedEMI}` : 'Enter custom monthly EMI if different'}
              />
              <p className="text-[9px] text-muted-foreground mt-1">Leave empty to auto-calculate mathematically.</p>
            </div>

            {/* EMI Day + Start Date */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-1.5">
                  EMI Payment Day (1-31)
                </label>
                <input
                  {...register('emi_day')}
                  type="number"
                  min="1"
                  max="31"
                  className={inputClass}
                />
                {errors.emi_day && <p className="text-red-400 text-xs mt-1 font-medium">{errors.emi_day.message}</p>}
              </div>
              <Controller
                control={control}
                name="start_date"
                render={({ field }) => (
                  <DatePicker
                    label="First payment start date"
                    value={field.value}
                    onChange={field.onChange}
                    error={errors.start_date?.message}
                  />
                )}
              />
            </div>

            {/* Notes */}
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-1.5">
                Additional Notes (optional)
              </label>
              <textarea
                {...register('notes')}
                className={`${inputClass} min-h-[90px]`}
                placeholder="Include reference loan ID or bank representative contact..."
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t border-border/40">
              <Button
                type="submit"
                loading={createLoan.isPending || updateLoan.isPending}
                className="flex-1 rounded-2xl py-3.5 font-bold text-xs bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-[0_8px_24px_-6px_rgba(16,185,129,0.3)] border border-emerald-400/20 transition-all active:scale-[0.98]"
              >
                {isEdit ? 'Save Changes' : 'Register Loan'}
              </Button>
              <Button type="button" variant="ghost" onClick={() => navigate(-1)} className="rounded-2xl px-5 border border-border hover:bg-surface-elevated text-xs font-semibold">
                Cancel
              </Button>
            </div>

          </form>
        </div>

        {/* Right Column: Cost visualizer preview */}
        <div className="lg:col-span-5 lg:sticky lg:top-6 space-y-6">
          <div className="rounded-3xl border border-border bg-surface p-6 space-y-6 flex flex-col items-center">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground self-start flex items-center gap-1.5">
              <Sparkles size={13} className="text-warning" /> Live Cost Projection
            </h3>

            {/* DYNAMIC METRIC SUMMARY HERO CARD */}
            <div className="relative overflow-hidden rounded-3xl border border-border bg-background p-6 w-full space-y-6">
              {/* Glow backdrop reflections */}
              <div
                className="pointer-events-none absolute inset-x-0 top-0 h-44 opacity-25 transition-all duration-500"
                style={{
                  background: `radial-gradient(80% 60% at 50% 0%, ${categoryConfig[loanType]?.glowColor || 'var(--foreground)'} 5%, transparent 70%)`,
                }}
              />

              {/* Subtle background watermark icon */}
              <div className="absolute right-[-20px] bottom-[-20px] pointer-events-none opacity-[0.03] text-foreground select-none z-0">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={loanType}
                    initial={{ opacity: 0, scale: 0.6, rotate: 30 }}
                    animate={{ opacity: 1, scale: 1, rotate: 12 }}
                    exit={{ opacity: 0, scale: 0.6, rotate: 30 }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                  >
                    {(() => {
                      const IconComponent = categoryConfig[loanType]?.icon || Coins;
                      return <IconComponent className="w-48 h-48" strokeWidth={1} />;
                    })()}
                  </motion.div>
                </AnimatePresence>
              </div>

              <div className="flex justify-between items-start relative z-10">
                <div className="space-y-1">
                  <div className="text-[9px] uppercase tracking-widest text-muted-foreground font-semibold">Estimated Monthly EMI</div>
                  <div className="mt-1 text-3xl font-bold tabular text-foreground">
                    {formatCurrency(calculatedEMI, currency)}
                  </div>
                  <div className="mt-1 text-[10px] text-muted-foreground">
                    {watchName} · {watchLender}
                  </div>
                </div>

                {/* Dynamic Category Icon with Framer Motion for premium smooth transitions */}
                <AnimatePresence mode="wait">
                  <motion.div
                    key={loanType}
                    initial={{ opacity: 0, scale: 0.8, rotate: -15 }}
                    animate={{ opacity: 1, scale: 1, rotate: 0 }}
                    exit={{ opacity: 0, scale: 0.8, rotate: 15 }}
                    transition={{ duration: 0.35, ease: 'easeOut' }}
                    className={`flex items-center justify-center p-3 rounded-2xl border ${categoryConfig[loanType]?.bgColor || 'bg-border/10 border-border/20'} backdrop-blur-md shadow-inner`}
                  >
                    {(() => {
                      const IconComponent = categoryConfig[loanType]?.icon || Coins;
                      return <IconComponent className={`w-6 h-6 ${categoryConfig[loanType]?.color || 'text-foreground'}`} strokeWidth={1.8} />;
                    })()}
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Cost split progress bar */}
              <div className="relative z-10 space-y-2">
                <div className="flex justify-between text-[10px] text-muted-foreground font-semibold uppercase tracking-widest">
                  <span>Interest split ratio</span>
                  <span>{calculatedEMI > 0 ? `${(interestRatio * 100).toFixed(0)}%` : '0%'}</span>
                </div>
                
                <div className="h-2 w-full overflow-hidden rounded-full bg-secondary flex">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${principalRatio * 100}%` }}
                    transition={{ type: 'spring', stiffness: 80, damping: 18 }}
                    className="bg-success h-full"
                  />
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${interestRatio * 100}%` }}
                    transition={{ type: 'spring', stiffness: 80, damping: 18, delay: 0.05 }}
                    className="bg-warning h-full"
                  />
                </div>
              </div>

              <div className="relative z-10 grid grid-cols-2 gap-3 text-xs">
                <div className="rounded-2xl border border-border bg-surface p-3.5 flex flex-col justify-between">
                  <div className="flex items-center gap-1.5 text-[9px] uppercase tracking-widest text-success font-semibold">
                    <span className="h-1.5 w-1.5 rounded-full bg-success" /> Principal
                  </div>
                  <div className="mt-2.5 font-bold text-foreground text-sm tabular">
                    {formatCurrency(principal, currency)}
                  </div>
                </div>
                <div className="rounded-2xl border border-border bg-surface p-3.5 flex flex-col justify-between">
                  <div className="flex items-center gap-1.5 text-[9px] uppercase tracking-widest text-warning font-semibold">
                    <span className="h-1.5 w-1.5 rounded-full bg-warning" /> Interest spent
                  </div>
                  <div className="mt-2.5 font-bold text-foreground text-sm tabular">
                    {formatCurrency(totalInterest, currency)}
                  </div>
                </div>
              </div>
            </div>

            {/* Projection Details */}
            <div className="w-full space-y-2.5">
              <DetailField label="Total Borrowing Cost" value={formatCurrency(totalPayable, currency)} Icon={TrendingDown} />
              <DetailField label="Projected Settlement" value={endDate ? formatDate(endDate) : '—'} Icon={Target} />
              <DetailField label="Monthly payments" value={tenure > 0 ? `${tenure} EMIs` : '—'} Icon={Zap} />
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

function DetailField({ label, value, Icon }: { label: string; value: string; Icon: any }) {
  return (
    <div className="rounded-2xl border border-border/80 bg-background/50 p-4.5 flex justify-between items-center text-xs w-full">
      <div className="flex items-center gap-2 text-muted-foreground font-semibold uppercase tracking-widest text-[9px]">
        <Icon size={12} strokeWidth={2} /> {label}
      </div>
      <div className="font-bold text-foreground text-xs">{value}</div>
    </div>
  );
}
