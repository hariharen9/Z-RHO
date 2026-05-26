// ============================================================
// ZRHO — Loans Hooks (TanStack Query)
// ============================================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import type { Loan, LoanInsert, LoanUpdate, LoanStatus } from '@/types/database.types';
import { calculateEMI, calculateTotalInterest } from '@/lib/calculations';
import { calculateEndDate } from '@/lib/dates';

const LOANS_KEY = 'loans';

/**
 * Fetch all loans for the current user.
 */
export function useLoans(status?: LoanStatus) {
  const user = useAuthStore((s) => s.user);

  return useQuery({
    queryKey: [LOANS_KEY, user?.id, status],
    queryFn: async () => {
      let query = supabase
        .from('loans')
        .select('*')
        .order('created_at', { ascending: false });

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Loan[];
    },
    enabled: !!user,
  });
}

/**
 * Fetch a single loan by ID.
 */
export function useLoan(id: string | undefined) {
  const user = useAuthStore((s) => s.user);

  return useQuery({
    queryKey: [LOANS_KEY, id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('loans')
        .select('*')
        .eq('id', id!)
        .single();
      if (error) throw error;
      return data as Loan;
    },
    enabled: !!user && !!id,
  });
}

/**
 * Create a new loan with auto-calculated derived fields.
 */
export function useCreateLoan() {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);

  return useMutation({
    mutationFn: async (input: {
      name: string;
      lender: string;
      loan_type: Loan['loan_type'];
      currency?: string;
      principal_amount: number;
      interest_rate: number;
      tenure_months: number;
      emi_amount?: number;
      emi_day: number;
      start_date: string;
      notes?: string;
    }) => {
      if (!user) throw new Error('Not authenticated');

      // Auto-calculate EMI if not provided or if coerced to 0/empty
      const emi = (input.emi_amount && input.emi_amount > 0)
        ? input.emi_amount
        : calculateEMI(input.principal_amount, input.interest_rate, input.tenure_months);

      const totalInterest = calculateTotalInterest(
        input.principal_amount,
        emi,
        input.tenure_months
      );

      const loanData: LoanInsert = {
        user_id: user.id,
        name: input.name,
        lender: input.lender,
        loan_type: input.loan_type,
        currency: input.currency ?? 'INR',
        principal_amount: input.principal_amount,
        current_outstanding: input.principal_amount,
        interest_rate: input.interest_rate,
        tenure_months: input.tenure_months,
        emi_amount: emi,
        emi_day: input.emi_day,
        start_date: input.start_date,
        end_date: calculateEndDate(input.start_date, input.tenure_months),
        total_interest_payable: totalInterest,
        total_amount_payable: input.principal_amount + totalInterest,
        notes: input.notes ?? null,
        status: 'active',
      };

      const { data, error } = await supabase
        .from('loans')
        .insert(loanData)
        .select()
        .single();

      if (error) throw error;
      return data as Loan;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [LOANS_KEY] });
    },
  });
}

/**
 * Update an existing loan.
 */
export function useUpdateLoan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: LoanUpdate & { id: string }) => {
      // Auto-calculate EMI on update if it is set to 0/empty
      if (updates.emi_amount !== undefined && updates.emi_amount <= 0) {
        const principal = updates.principal_amount;
        const rate = updates.interest_rate;
        const tenure = updates.tenure_months;
        if (principal !== undefined && rate !== undefined && tenure !== undefined) {
          updates.emi_amount = calculateEMI(principal, rate, tenure);
        } else {
          const { data: currentLoan } = await supabase
            .from('loans')
            .select('principal_amount, interest_rate, tenure_months')
            .eq('id', id)
            .single();
          if (currentLoan) {
            updates.emi_amount = calculateEMI(
              principal ?? currentLoan.principal_amount,
              rate ?? currentLoan.interest_rate,
              tenure ?? currentLoan.tenure_months
            );
          }
        }
      }

      const { data, error } = await supabase
        .from('loans')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as Loan;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [LOANS_KEY] });
      queryClient.setQueryData([LOANS_KEY, data.id], data);
    },
  });
}

/**
 * Delete a loan.
 */
export function useDeleteLoan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('loans').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [LOANS_KEY] });
    },
  });
}
