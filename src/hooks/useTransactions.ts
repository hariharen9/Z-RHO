// ============================================================
// ZRHO — CC Transactions Hooks (TanStack Query)
// ============================================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import type { CCTransaction, CCTransactionInsert, CCTransactionUpdate, CCTransactionWithCard } from '@/types/database.types';
import { determineBillingMonth } from '@/lib/calculations';

const TX_KEY = 'cc_transactions';
const BILLS_KEY = 'cc_bills';

interface TransactionFilters {
  billingMonth?: string;
  category?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}

/**
 * Fetch transactions for a card with optional filters.
 */
export function useTransactions(cardId: string | undefined, filters?: TransactionFilters) {
  const user = useAuthStore((s) => s.user);

  return useQuery({
    queryKey: [TX_KEY, cardId, filters],
    queryFn: async () => {
      let query = supabase
        .from('cc_transactions')
        .select('*')
        .eq('card_id', cardId!)
        .order('transaction_date', { ascending: false });

      if (filters?.billingMonth) {
        query = query.eq('billing_month', filters.billingMonth);
      }
      if (filters?.category) {
        query = query.eq('category', filters.category);
      }
      if (filters?.dateFrom) {
        query = query.gte('transaction_date', filters.dateFrom);
      }
      if (filters?.dateTo) {
        query = query.lte('transaction_date', filters.dateTo);
      }
      if (filters?.search) {
        query = query.or(
          `merchant.ilike.%${filters.search}%,note.ilike.%${filters.search}%`
        );
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as CCTransaction[];
    },
    enabled: !!user && !!cardId,
  });
}

/**
 * Fetch all transactions for a card (no filters) — used for balance calculation.
 */
export function useAllCardTransactions(cardId: string | undefined) {
  const user = useAuthStore((s) => s.user);

  return useQuery({
    queryKey: [TX_KEY, cardId, 'all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cc_transactions')
        .select('*')
        .eq('card_id', cardId!)
        .order('transaction_date', { ascending: false });

      if (error) throw error;
      return data as CCTransaction[];
    },
    enabled: !!user && !!cardId,
  });
}

/**
 * Fetch all transactions across all cards for the user.
 */
export function useGlobalTransactions(filters?: TransactionFilters) {
  const user = useAuthStore((s) => s.user);

  return useQuery({
    queryKey: [TX_KEY, 'global', filters],
    queryFn: async () => {
      let query = supabase
        .from('cc_transactions')
        .select(`
          *,
          credit_cards (
            id,
            name,
            bank,
            color,
            currency,
            last_four,
            card_network
          )
        `)
        .eq('user_id', user!.id)
        .order('transaction_date', { ascending: false });

      if (filters?.billingMonth) {
        query = query.eq('billing_month', filters.billingMonth);
      }
      if (filters?.category) {
        query = query.eq('category', filters.category);
      }
      if (filters?.dateFrom) {
        query = query.gte('transaction_date', filters.dateFrom);
      }
      if (filters?.dateTo) {
        query = query.lte('transaction_date', filters.dateTo);
      }
      if (filters?.search) {
        query = query.or(
          `merchant.ilike.%${filters.search}%,note.ilike.%${filters.search}%`
        );
      }

      const { data, error } = await query;
      if (error) throw error;
      return data; // Will be typed as any or we can cast it in the component. We defined CCTransactionWithCard.
    },
    enabled: !!user,
  });
}

/**
 * Create a transaction with auto-detected billing month.
 */
export function useCreateTransaction() {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);

  return useMutation({
    mutationFn: async (input: {
      card_id: string;
      amount: number;
      transaction_type: CCTransaction['transaction_type'];
      category: string;
      merchant?: string;
      note?: string;
      transaction_date: string;
      statement_day: number; // needed to auto-detect billing month
      billing_month?: string; // user override
    }) => {
      if (!user) throw new Error('Not authenticated');

      const billingMonth =
        input.billing_month ??
        determineBillingMonth(input.transaction_date, input.statement_day);

      const txData: CCTransactionInsert = {
        card_id: input.card_id,
        user_id: user.id,
        amount: input.amount,
        transaction_type: input.transaction_type,
        category: input.category,
        merchant: input.merchant ?? null,
        note: input.note ?? null,
        transaction_date: input.transaction_date,
        billing_month: billingMonth,
      };

      const { data, error } = await supabase
        .from('cc_transactions')
        .insert(txData)
        .select()
        .single();

      if (error) throw error;
      return data as CCTransaction;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [TX_KEY, variables.card_id] });
      queryClient.invalidateQueries({ queryKey: [BILLS_KEY, variables.card_id] });
    },
  });
}

/**
 * Update a transaction.
 */
export function useUpdateTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      card_id,
      ...updates
    }: CCTransactionUpdate & { id: string; card_id: string }) => {
      const { data, error } = await supabase
        .from('cc_transactions')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return { ...data, card_id } as CCTransaction;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [TX_KEY, data.card_id] });
      queryClient.invalidateQueries({ queryKey: [BILLS_KEY, data.card_id] });
    },
  });
}

/**
 * Delete a transaction.
 */
export function useDeleteTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, card_id }: { id: string; card_id: string }) => {
      const { error } = await supabase.from('cc_transactions').delete().eq('id', id);
      if (error) throw error;
      return { card_id };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [TX_KEY, data.card_id] });
      queryClient.invalidateQueries({ queryKey: [BILLS_KEY, data.card_id] });
    },
  });
}
