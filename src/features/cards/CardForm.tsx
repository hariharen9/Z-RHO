// ============================================================
// ZRHO — Cards: Add/Edit Card Form
// ============================================================

import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCreateCard, useCard, useUpdateCard } from '@/hooks/useCards';
import { Button } from '@/components/ui/Button';
import { CARD_NETWORK_LABELS } from '@/lib/constants';

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
    'w-full px-3 py-2 bg-[var(--color-zrho-surface-2)] border border-[var(--color-zrho-border)] rounded-lg text-[var(--color-zrho-text)] focus:border-[var(--color-zrho-accent)] outline-none';

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">{isEdit ? 'Edit Card' : 'Add New Card'}</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-xl">
        <div>
          <label className="block text-sm text-[var(--color-zrho-text-muted)] mb-1">Card Name</label>
          <input {...register('name')} className={inputClass} placeholder="e.g. HDFC Regalia" />
          {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name.message}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-[var(--color-zrho-text-muted)] mb-1">Bank</label>
            <input {...register('bank')} className={inputClass} placeholder="e.g. HDFC Bank" />
            {errors.bank && <p className="text-red-400 text-xs mt-1">{errors.bank.message}</p>}
          </div>
          <div>
            <label className="block text-sm text-[var(--color-zrho-text-muted)] mb-1">Last 4 Digits</label>
            <input {...register('last_four')} className={inputClass} placeholder="1234" maxLength={4} />
            {errors.last_four && <p className="text-red-400 text-xs mt-1">{errors.last_four.message}</p>}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-[var(--color-zrho-text-muted)] mb-1">Card Network</label>
            <select {...register('card_network')} className={inputClass}>
              {Object.entries(CARD_NETWORK_LABELS).map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-[var(--color-zrho-text-muted)] mb-1">Credit Limit</label>
            <input {...register('credit_limit')} type="number" step="0.01" className={inputClass} placeholder="200000" />
            {errors.credit_limit && <p className="text-red-400 text-xs mt-1">{errors.credit_limit.message}</p>}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-[var(--color-zrho-text-muted)] mb-1">Statement Day (1-28)</label>
            <input {...register('statement_day')} type="number" min="1" max="28" className={inputClass} />
            {errors.statement_day && <p className="text-red-400 text-xs mt-1">{errors.statement_day.message}</p>}
          </div>
          <div>
            <label className="block text-sm text-[var(--color-zrho-text-muted)] mb-1">Due Day (1-28)</label>
            <input {...register('due_day')} type="number" min="1" max="28" className={inputClass} />
            {errors.due_day && <p className="text-red-400 text-xs mt-1">{errors.due_day.message}</p>}
          </div>
        </div>

        <div>
          <label className="block text-sm text-[var(--color-zrho-text-muted)] mb-1">Card Color</label>
          <input {...register('color')} type="color" className="w-16 h-10 rounded cursor-pointer bg-transparent border-none" />
        </div>

        <div>
          <label className="block text-sm text-[var(--color-zrho-text-muted)] mb-1">Notes (optional)</label>
          <textarea {...register('notes')} className={`${inputClass} min-h-[80px]`} />
        </div>

        <div className="flex gap-3 pt-4">
          <Button type="submit" loading={createCard.isPending || updateCard.isPending}>
            {isEdit ? 'Save Changes' : 'Add Card'}
          </Button>
          <Button type="button" variant="ghost" onClick={() => navigate(-1)}>Cancel</Button>
        </div>
      </form>
    </div>
  );
}
