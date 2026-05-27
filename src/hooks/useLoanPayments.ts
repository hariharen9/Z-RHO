// ============================================================
// ZRHO — Loan Payments Hooks (TanStack Query)
// ============================================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import type { LoanPayment, LoanPaymentInsert, PrepaymentType } from '@/types/database.types';
import { calculateEMIBreakdown } from '@/lib/calculations';

const PAYMENTS_KEY = 'loan_payments';
const LOANS_KEY = 'loans';

/**
 * Fetch all payments for a loan, ordered by emi_month.
 */
export function useLoanPayments(loanId: string | undefined) {
  const user = useAuthStore((s) => s.user);

  return useQuery({
    queryKey: [PAYMENTS_KEY, loanId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('loan_payments')
        .select('*')
        .eq('loan_id', loanId!)
        .order('emi_month', { ascending: true });

      if (error) throw error;
      return data as LoanPayment[];
    },
    enabled: !!user && !!loanId,
  });
}

/**
 * Record a regular EMI payment.
 * Automatically calculates principal/interest breakdown.
 */
export function useRecordPayment() {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);

  return useMutation({
    mutationFn: async (input: {
      loan_id: string;
      payment_date: string;
      emi_month: string;
      amount_paid: number;
      current_outstanding: number;
      annual_rate: number;
      notes?: string;
    }) => {
      if (!user) throw new Error('Not authenticated');

      // Calculate breakdown
      const { principal, interest } = calculateEMIBreakdown(
        input.current_outstanding,
        input.annual_rate,
        input.amount_paid
      );

      const outstandingAfter = Math.round(
        (input.current_outstanding - principal) * 100
      ) / 100;

      const payment: LoanPaymentInsert = {
        loan_id: input.loan_id,
        user_id: user.id,
        payment_date: input.payment_date,
        emi_month: input.emi_month,
        amount_paid: input.amount_paid,
        principal_component: principal,
        interest_component: interest,
        is_prepayment: false,
        prepayment_type: null,
        outstanding_after: Math.max(0, outstandingAfter),
        notes: input.notes ?? null,
      };

      const { data, error } = await supabase
        .from('loan_payments')
        .insert(payment)
        .select()
        .single();

      if (error) throw error;

      // If outstanding balance hits 0 or less, mark the loan as closed
      if (outstandingAfter <= 0) {
        await supabase
          .from('loans')
          .update({ status: 'closed', current_outstanding: 0 })
          .eq('id', input.loan_id);
      }

      return data as LoanPayment;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [PAYMENTS_KEY, variables.loan_id] });
      queryClient.invalidateQueries({ queryKey: [LOANS_KEY] });
    },
  });
}

/**
 * Record a prepayment (partial or full closure).
 */
export function useRecordPrepayment() {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);

  return useMutation({
    mutationFn: async (input: {
      loan_id: string;
      payment_date: string;
      amount: number;
      current_outstanding: number;
      annual_rate: number;
      prepayment_type: PrepaymentType;
      notes?: string;
    }) => {
      if (!user) throw new Error('Not authenticated');

      // For prepayments, entire amount goes to principal
      // (interest for the month is assumed paid in regular EMI)
      const outstandingAfter = Math.max(
        0,
        Math.round((input.current_outstanding - input.amount) * 100) / 100
      );

      const payment: LoanPaymentInsert = {
        loan_id: input.loan_id,
        user_id: user.id,
        payment_date: input.payment_date,
        emi_month: input.payment_date, // prepayment month = payment date month
        amount_paid: input.amount,
        principal_component: input.amount,
        interest_component: 0,
        is_prepayment: true,
        prepayment_type: input.prepayment_type,
        outstanding_after: outstandingAfter,
        notes: input.notes ?? null,
      };

      const { data, error } = await supabase
        .from('loan_payments')
        .insert(payment)
        .select()
        .single();

      if (error) throw error;

      // If full closure, also update loan status
      if (input.prepayment_type === 'full_closure') {
        await supabase
          .from('loans')
          .update({ status: 'closed', current_outstanding: 0 })
          .eq('id', input.loan_id);
      }

      return data as LoanPayment;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [PAYMENTS_KEY, variables.loan_id] });
      queryClient.invalidateQueries({ queryKey: [LOANS_KEY] });
    },
  });
}

/**
 * Delete a payment (regular or prepayment) and recalculate outstanding balance.
 */
export function useDeletePayment() {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);

  return useMutation({
    mutationFn: async (input: { id: string; loan_id: string }) => {
      if (!user) throw new Error('Not authenticated');

      // 1. Delete payment
      const { data: deletedPayment, error: deleteError } = await supabase
        .from('loan_payments')
        .delete()
        .eq('id', input.id)
        .select()
        .single();

      if (deleteError) throw deleteError;

      // 2. Fetch all remaining payments for this loan to re-calculate current outstanding
      const { data: remainingPayments, error: fetchError } = await supabase
        .from('loan_payments')
        .select('principal_component')
        .eq('loan_id', input.loan_id);

      if (fetchError) throw fetchError;

      const { data: loanData, error: loanFetchError } = await supabase
        .from('loans')
        .select('principal_amount')
        .eq('id', input.loan_id)
        .single();

      if (loanFetchError) throw loanFetchError;

      const totalPrincipalPaid = (remainingPayments || []).reduce(
        (sum, p) => sum + Number(p.principal_component),
        0
      );

      const newOutstanding = Math.max(0, Number(loanData.principal_amount) - totalPrincipalPaid);

      // 3. Update loan's current outstanding
      // If we deleted a full closure payment or the new outstanding is greater than 0, reopen the loan
      const isFullClosure = deletedPayment.prepayment_type === 'full_closure';
      const updatePayload: any = {
        current_outstanding: newOutstanding,
      };
      if (isFullClosure || newOutstanding > 0) {
        updatePayload.status = 'active';
      }

      const { error: updateError } = await supabase
        .from('loans')
        .update(updatePayload)
        .eq('id', input.loan_id);

      if (updateError) throw updateError;

      return deletedPayment as LoanPayment;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [PAYMENTS_KEY, variables.loan_id] });
      queryClient.invalidateQueries({ queryKey: [LOANS_KEY] });
    },
  });
}
