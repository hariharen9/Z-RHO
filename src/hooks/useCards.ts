// ============================================================
// ZRHO — Credit Cards Hooks (TanStack Query)
// ============================================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import type { CreditCard, CreditCardInsert, CreditCardUpdate, CardStatus } from '@/types/database.types';

const CARDS_KEY = 'credit_cards';

/**
 * Fetch all credit cards for the current user.
 */
export function useCards(status?: CardStatus) {
  const user = useAuthStore((s) => s.user);

  return useQuery({
    queryKey: [CARDS_KEY, user?.id, status],
    queryFn: async () => {
      let query = supabase
        .from('credit_cards')
        .select('*')
        .order('created_at', { ascending: false });

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as CreditCard[];
    },
    enabled: !!user,
  });
}

/**
 * Fetch a single card by ID.
 */
export function useCard(id: string | undefined) {
  const user = useAuthStore((s) => s.user);

  return useQuery({
    queryKey: [CARDS_KEY, id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('credit_cards')
        .select('*')
        .eq('id', id!)
        .single();
      if (error) throw error;
      return data as CreditCard;
    },
    enabled: !!user && !!id,
  });
}

/**
 * Create a new credit card.
 */
export function useCreateCard() {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);

  return useMutation({
    mutationFn: async (input: Omit<CreditCardInsert, 'user_id'>) => {
      if (!user) throw new Error('Not authenticated');

      const cardData: CreditCardInsert = {
        ...input,
        user_id: user.id,
      };

      const { data, error } = await supabase
        .from('credit_cards')
        .insert(cardData)
        .select()
        .single();

      if (error) throw error;
      return data as CreditCard;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CARDS_KEY] });
    },
  });
}

/**
 * Update an existing card.
 */
export function useUpdateCard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: CreditCardUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from('credit_cards')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as CreditCard;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [CARDS_KEY] });
      queryClient.setQueryData([CARDS_KEY, data.id], data);
    },
  });
}

/**
 * Delete a card.
 */
export function useDeleteCard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('credit_cards').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CARDS_KEY] });
    },
  });
}
