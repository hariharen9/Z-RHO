// ============================================================
// ZRHO — CC Bills Hooks (TanStack Query)
// ============================================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import type { CCBill, CCBillInsert, BillStatus } from '@/types/database.types';
import { calculateBillDates } from '@/lib/calculations';
import { format, startOfMonth } from 'date-fns';

const BILLS_KEY = 'cc_bills';
const CARDS_KEY = 'credit_cards';

/**
 * Fetch all bills for a card, ordered by billing_month desc.
 */
export function useBills(cardId: string | undefined) {
  const user = useAuthStore((s) => s.user);

  return useQuery({
    queryKey: [BILLS_KEY, cardId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cc_bills')
        .select('*')
        .eq('card_id', cardId!)
        .order('billing_month', { ascending: false });

      if (error) throw error;
      return data as CCBill[];
    },
    enabled: !!user && !!cardId,
  });
}

/**
 * Fetch a single bill by ID.
 */
export function useBill(billId: string | undefined) {
  const user = useAuthStore((s) => s.user);

  return useQuery({
    queryKey: [BILLS_KEY, 'detail', billId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cc_bills')
        .select('*')
        .eq('id', billId!)
        .single();

      if (error) throw error;
      return data as CCBill;
    },
    enabled: !!user && !!billId,
  });
}

/**
 * Get or create the current billing cycle for a card.
 */
export function useCurrentBill(cardId: string | undefined, statementDay?: number, dueDay?: number) {
  const user = useAuthStore((s) => s.user);

  return useQuery({
    queryKey: [BILLS_KEY, cardId, 'current'],
    queryFn: async () => {
      const currentMonth = format(startOfMonth(new Date()), 'yyyy-MM-dd');

      // Try to find existing bill for this month
      const { data: existing } = await supabase
        .from('cc_bills')
        .select('*')
        .eq('card_id', cardId!)
        .eq('billing_month', currentMonth)
        .single();

      if (existing) return existing as CCBill;

      // No bill exists for this month — don't auto-create, return null
      return null;
    },
    enabled: !!user && !!cardId,
  });
}

/**
 * Create a bill (new billing cycle).
 */
export function useCreateBill() {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);

  return useMutation({
    mutationFn: async (input: {
      card_id: string;
      billing_month: string;
      statement_day: number;
      due_day: number;
      opening_balance?: number;
      total_spends?: number;
      total_credits?: number;
      statement_amount?: number;
      minimum_due?: number;
      status?: BillStatus;
    }) => {
      if (!user) throw new Error('Not authenticated');

      const { statementDate, dueDate } = calculateBillDates(
        input.statement_day,
        input.due_day,
        input.billing_month
      );

      const billData: CCBillInsert = {
        card_id: input.card_id,
        user_id: user.id,
        billing_month: input.billing_month,
        statement_date: statementDate,
        due_date: dueDate,
        opening_balance: input.opening_balance ?? 0,
        total_spends: input.total_spends ?? 0,
        total_credits: input.total_credits ?? 0,
        statement_amount: input.statement_amount ?? 0,
        minimum_due: input.minimum_due ?? 0,
        paid_amount: null,
        paid_date: null,
        status: input.status ?? 'upcoming',
        notes: null,
      };

      const { data, error } = await supabase
        .from('cc_bills')
        .insert(billData)
        .select()
        .single();

      if (error) throw error;
      return data as CCBill;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [BILLS_KEY, variables.card_id] });
    },
  });
}

/**
 * Mark a bill as paid (full or partial).
 */
export function useMarkBillPaid() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      bill_id: string;
      card_id: string;
      paid_amount: number;
      paid_date: string;
      statement_amount: number;
    }) => {
      // 1. Fetch current bill state to retrieve existing accumulated paid_amount
      const { data: currentBill, error: fetchError } = await supabase
        .from('cc_bills')
        .select('paid_amount')
        .eq('id', input.bill_id)
        .single();

      if (fetchError) throw fetchError;

      const existingPaid = currentBill?.paid_amount ?? 0;
      const newPaidTotal = existingPaid + input.paid_amount;
      const status: BillStatus =
        newPaidTotal >= input.statement_amount ? 'paid' : 'partially_paid';

      const { data, error } = await supabase
        .from('cc_bills')
        .update({
          paid_amount: newPaidTotal,
          paid_date: input.paid_date,
          status,
        })
        .eq('id', input.bill_id)
        .select()
        .single();

      if (error) throw error;
      return data as CCBill;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [BILLS_KEY, variables.card_id] });
      queryClient.invalidateQueries({ queryKey: [BILLS_KEY, 'detail', variables.bill_id] });
      queryClient.invalidateQueries({ queryKey: [CARDS_KEY] });
    },
  });
}

/**
 * Update an existing bill statement's amounts and status.
 */
export function useUpdateBill() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      bill_id: string;
      card_id: string;
      opening_balance?: number;
      total_spends: number;
      total_credits: number;
      statement_amount: number;
      minimum_due: number;
      status?: BillStatus;
    }) => {
      const { data, error } = await supabase
        .from('cc_bills')
        .update({
          ...(input.opening_balance !== undefined ? { opening_balance: input.opening_balance } : {}),
          total_spends: input.total_spends,
          total_credits: input.total_credits,
          statement_amount: input.statement_amount,
          minimum_due: input.minimum_due,
          ...(input.status ? { status: input.status } : {}),
        })
        .eq('id', input.bill_id)
        .select()
        .single();

      if (error) throw error;
      return data as CCBill;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [BILLS_KEY, variables.card_id] });
      queryClient.invalidateQueries({ queryKey: [BILLS_KEY, 'detail', variables.bill_id] });
    },
  });
}
