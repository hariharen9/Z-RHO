// ============================================================
// ZRHO — Cards: Add/Edit Card Form
// ============================================================

import { useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, CreditCard, Sparkles, ShieldCheck, Heart } from 'lucide-react';
import { useCreateCard, useCard, useUpdateCard } from '@/hooks/useCards';
import { Button } from '@/components/ui/Button';
import { CARD_NETWORK_LABELS } from '@/lib/constants';
import { Dropdown } from '@/components/ui/Dropdown';
import type { DropdownOption } from '@/components/ui/Dropdown';
import { CardNetworkLogo } from '@/components/shared/CardNetworkLogo';
import { BankLogo } from '@/components/shared/BankLogo';

const colorSwatches = [
  { name: 'Indigo Royale', value: '#6366f1' },
  { name: 'Ocean Breeze', value: '#0ea5e9' },
  { name: 'Teal Eclipse', value: '#14b8a6' },
  { name: 'Emerald Wealth', value: '#10b981' },
  { name: 'Sunset Amber', value: '#f59e0b' },
  { name: 'Bronze Luxury', value: '#b45309' },
  { name: 'Rose Crimson', value: '#f43f5e' },
  { name: 'Purple Velvet', value: '#a855f7' },
  { name: 'Midnight Cyber', value: '#334155' },
  { name: 'Carbon Obsidian', value: '#1e293b' },
];

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

const networkOptions: DropdownOption[] = Object.entries(CARD_NETWORK_LABELS).map(([value, label]) => ({
  value,
  label,
}));

const cardSchema = z.object({
  name: z.string().min(1, 'Card name is required'),
  bank: z.string().min(1, 'Bank is required'),
  last_four: z.string().length(4, 'Must be 4 digits').regex(/^\d{4}$/, 'Must be digits'),
  card_network: z.enum(['visa', 'mastercard', 'amex', 'rupay', 'other']),
  currency: z.string(),
  credit_limit: z.coerce.number().positive('Credit limit must be positive'),
  statement_day: z.coerce.number().int().min(1).max(28, 'Must be 1-28'),
  due_day: z.coerce.number().int().min(1).max(28, 'Must be 1-28'),
  color: z.string(),
  notes: z.string().optional(),
});

type CardFormData = z.infer<typeof cardSchema>;

export function CardForm() {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();

  const { data: existingCard } = useCard(id);
  const createCard = useCreateCard();
  const updateCard = useUpdateCard();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    control,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(cardSchema),
    defaultValues: {
      card_network: 'visa',
      currency: 'INR',
      color: '#6366f1',
      statement_day: 1,
      due_day: 20,
    },
  });

  // Watch fields in real-time to update the mock physical card
  const watchName = watch('name') || 'CARD NAME';
  const watchBank = watch('bank') || 'BANK NAME';
  const watchLastFour = watch('last_four') || '••••';
  const watchNetwork = watch('card_network') || 'visa';
  const watchColor = watch('color') || '#6366f1';
  const watchLimit = Number(watch('credit_limit')) || 0;
  const watchCurrency = watch('currency') || 'INR';

  useEffect(() => {
    if (existingCard) {
      setValue('name', existingCard.name);
      setValue('bank', existingCard.bank);
      setValue('last_four', existingCard.last_four);
      setValue('card_network', existingCard.card_network);
      setValue('currency', existingCard.currency);
      setValue('credit_limit', existingCard.credit_limit);
      setValue('statement_day', existingCard.statement_day);
      setValue('due_day', existingCard.due_day);
      setValue('color', existingCard.color);
      setValue('notes', existingCard.notes ?? '');
    }
  }, [existingCard, setValue]);

  const onSubmit = async (data: any) => {
    try {
      if (isEdit) {
        await updateCard.mutateAsync({ id, ...data });
        navigate(`/cards/${id}`);
      } else {
        const card = await createCard.mutateAsync({
          ...data,
          status: 'active',
          notes: data.notes ?? null,
        });
        navigate(`/cards/${card.id}`);
      }
    } catch (err) {
      console.error('Failed to save card:', err);
    }
  };

  const inputClass =
    'w-full px-4 py-3 bg-background/50 border border-border/80 rounded-2xl text-foreground focus:border-foreground/45 transition-all duration-300 outline-none backdrop-blur-md text-sm';

  const gradientBg = `linear-gradient(135deg, ${watchColor} 0%, color-mix(in oklab, ${watchColor} 45%, black) 100%)`;

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Title & Back bar */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-full border border-border bg-surface text-muted-foreground hover:text-foreground transition active:scale-90"
        >
          <ArrowLeft size={16} />
        </button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {isEdit ? 'Modify Credit Liability' : 'Onboard New Credit Card'}
          </h1>
          <p className="text-xs text-muted-foreground">
            {isEdit ? 'Update your card billing terms' : 'Add card parameters to track transactions and bills'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Form Inputs inside Glass Container */}
        <div className="lg:col-span-7 rounded-3xl border border-border bg-surface p-6 space-y-6 backdrop-blur">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

            {/* Card Name */}
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-1.5">
                Card Name / Product Title
              </label>
              <input
                {...register('name')}
                className={inputClass}
                placeholder="e.g. HDFC Regalia, ICICI Amazon"
              />
              {errors.name && <p className="text-red-400 text-xs mt-1 font-medium">{errors.name.message}</p>}
            </div>

            {/* Bank + Last 4 digits */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-1.5">
                  Issuing Bank
                </label>
                <input
                  {...register('bank')}
                  className={inputClass}
                  placeholder="e.g. HDFC Bank"
                />
                {errors.bank && <p className="text-red-400 text-xs mt-1 font-medium">{errors.bank.message}</p>}
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-1.5">
                  Last 4 Digits
                </label>
                <input
                  {...register('last_four')}
                  className={inputClass}
                  placeholder="e.g. 5678"
                  maxLength={4}
                />
                {errors.last_four && <p className="text-red-400 text-xs mt-1 font-medium">{errors.last_four.message}</p>}
              </div>
            </div>

            {/* Card Network + Credit Limit */}
            <div className="grid grid-cols-2 gap-4">
              <Controller
                control={control}
                name="card_network"
                render={({ field }) => (
                  <Dropdown
                    label="Network Processor"
                    options={networkOptions}
                    value={field.value}
                    onChange={field.onChange}
                  />
                )}
              />
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-1.5">
                  Total Credit Limit
                </label>
                <input
                  {...register('credit_limit')}
                  type="number"
                  step="0.01"
                  className={inputClass}
                  placeholder="e.g. 500000"
                />
                {errors.credit_limit && <p className="text-red-400 text-xs mt-1 font-medium">{errors.credit_limit.message}</p>}
              </div>
            </div>

            {/* Billing Cycle Details (Statement & Due Days) */}
            <div className="rounded-2xl bg-background border border-border p-4 space-y-4">
              <div>
                <div className="text-[10px] font-bold text-foreground uppercase tracking-widest">Billing Terms Setup</div>
                <p className="text-[9px] text-muted-foreground mt-0.5">Define your monthly billing statement dates</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[9px] uppercase tracking-widest text-muted-foreground font-semibold mb-1">
                    Statement Day (1-28)
                  </label>
                  <input
                    {...register('statement_day')}
                    type="number"
                    min="1"
                    max="28"
                    className="w-full px-3 py-2.5 bg-surface border border-border rounded-xl text-foreground focus:border-foreground/30 outline-none text-xs"
                  />
                  {errors.statement_day && <p className="text-red-400 text-xs mt-1 font-medium">{errors.statement_day.message}</p>}
                </div>
                <div>
                  <label className="block text-[9px] uppercase tracking-widest text-muted-foreground font-semibold mb-1">
                    Due Day (1-28)
                  </label>
                  <input
                    {...register('due_day')}
                    type="number"
                    min="1"
                    max="28"
                    className="w-full px-3 py-2.5 bg-surface border border-border rounded-xl text-foreground focus:border-foreground/30 outline-none text-xs"
                  />
                  {errors.due_day && <p className="text-red-400 text-xs mt-1 font-medium">{errors.due_day.message}</p>}
                </div>
              </div>
            </div>

            {/* Currency + Card Color Swatches */}
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

              <div>
                <label className="block text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-2.5">
                  Select Card Theme
                </label>
                <div className="grid grid-cols-5 sm:grid-cols-10 gap-2.5">
                  {colorSwatches.map((swatch) => {
                    const isActive = watchColor.toLowerCase() === swatch.value.toLowerCase();
                    return (
                      <button
                        key={swatch.value}
                        type="button"
                        onClick={() => setValue('color', swatch.value)}
                        className={`h-9 w-full rounded-xl transition-all duration-300 relative border cursor-pointer ${isActive
                            ? 'border-white scale-110 shadow-lg shadow-white/5'
                            : 'border-border/60 hover:scale-105'
                          }`}
                        style={{
                          background: `linear-gradient(135deg, ${swatch.value} 0%, color-mix(in oklab, ${swatch.value} 45%, black) 100%)`,
                        }}
                        title={swatch.name}
                      >
                        {isActive && (
                          <motion.span
                            layoutId="activeSwatch"
                            className="absolute inset-0 rounded-xl border-2 border-white flex items-center justify-center"
                            transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                          >
                            <span className="h-1.5 w-1.5 rounded-full bg-white" />
                          </motion.span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-1.5">
                Internal Remarks (optional)
              </label>
              <textarea
                {...register('notes')}
                className={`${inputClass} min-h-[90px]`}
                placeholder="Write card features, rewards or specific codes..."
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t border-border/40">
              <Button
                type="submit"
                loading={createCard.isPending || updateCard.isPending}
                style={{
                  background: `linear-gradient(135deg, ${watchColor} 0%, color-mix(in oklab, ${watchColor} 75%, black) 100%)`,
                  boxShadow: `0 8px 24px -6px color-mix(in oklab, ${watchColor} 50%, transparent)`,
                }}
                className="flex-1 rounded-2xl py-3.5 font-bold text-xs text-white border border-white/10 hover:brightness-110 active:scale-[0.98] transition-all"
              >
                {isEdit ? 'Save Changes' : 'Onboard Card'}
              </Button>
              <Button type="button" variant="ghost" onClick={() => navigate(-1)} className="rounded-2xl px-5 border border-border hover:bg-surface-elevated text-xs font-semibold">
                Cancel
              </Button>
            </div>
          </form>
        </div>

        {/* Right Column: Floating Mock Card Sticky Live Preview */}
        <div className="lg:col-span-5 lg:sticky lg:top-6 space-y-6">
          <div className="rounded-3xl border border-border bg-surface p-6 space-y-6 flex flex-col items-center">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground self-start flex items-center gap-1.5">
              <Sparkles size={13} className="text-indigo-400" /> Real-time Card Mockup
            </h3>

            {/* MOCK CREDIT CARD DISPLAY */}
            <AnimatePresence mode="wait">
              <motion.div
                key={watchColor}
                style={{ background: gradientBg }}
                className="relative h-48 w-full max-w-sm rounded-3xl p-6 text-white shadow-2xl flex flex-col justify-between overflow-hidden border border-white/10 card-shine"
                initial={{ scale: 0.96, opacity: 0, y: 6 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.96, opacity: 0, y: -6 }}
                transition={{ type: 'spring', stiffness: 350, damping: 26 }}
              >
                {/* Gloss lighting layer reflection */}
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(255,255,255,0.18),transparent_60%)] pointer-events-none" />

                <div className="flex justify-between items-start z-10">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-xl bg-white/10 backdrop-blur border border-white/15 flex items-center justify-center shrink-0">
                      <BankLogo bankName={watchBank} size={18} className="text-white" />
                    </div>
                    <div>
                      <div className="text-[9px] uppercase tracking-widest opacity-75 font-semibold font-sans leading-none">{watchBank}</div>
                      <div className="text-sm font-bold mt-0.5 tracking-wide leading-tight">{watchName}</div>
                    </div>
                  </div>
                  <div className="bg-white/10 backdrop-blur border border-white/15 px-3 py-1.5 rounded-xl flex items-center justify-center shrink-0">
                    <CardNetworkLogo network={watchNetwork} size={18} className="text-white" />
                  </div>
                </div>

                <div className="z-10 mt-6 flex justify-start items-center gap-4">
                  {/* Metal Smart Chip Mock */}
                  <div className="w-10 h-7.5 rounded-lg bg-gradient-to-tr from-amber-200/50 to-amber-400/30 border border-amber-300/20 backdrop-blur flex flex-col justify-center px-1.5 space-y-0.5 select-none opacity-95 shrink-0">
                    <span className="h-0.5 bg-black/15 w-full rounded" />
                    <span className="h-0.5 bg-black/15 w-full rounded" />
                    <span className="h-0.5 bg-black/15 w-full rounded" />
                  </div>
                  <div className="text-lg tracking-[0.25em] font-mono tabular select-none">
                    •••• •••• •••• {watchLastFour}
                  </div>
                </div>

                <div className="flex justify-between items-end z-10 font-sans">
                  <div>
                    <div className="text-[8px] uppercase tracking-widest opacity-60">Credit Limit</div>
                    <div className="text-sm font-bold mt-0.5 font-mono tabular">
                      {watchLimit > 0 ? `${watchCurrency} ${watchLimit.toLocaleString()}` : '—'}
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    <Heart size={14} className="text-red-500 fill-red-500 animate-pulse" />
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Privacy Badge */}
            <div className="w-full p-4 rounded-2xl bg-background border border-border/80 flex items-start gap-3">
              <ShieldCheck size={16} className="text-success shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-semibold text-foreground">Zero card numbers stored</h4>
                <p className="text-[10px] text-muted-foreground leading-relaxed mt-0.5">
                  We enforce local processing constraints. Only the bank name, color profiles, network type, and the last 4 digits are recorded to isolated databases.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
