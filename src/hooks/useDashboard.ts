// ============================================================
// ZRHO — Dashboard Hooks (TanStack Query)
// Aggregates data from loans, cards, payments, and bills
// ============================================================

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import type { Loan, CreditCard, LoanPayment, CCBill } from '@/types/database.types';
import type { DashboardSummary, UpcomingPayment, MonthlyOutflow, DebtHistoryPoint } from '@/types/common.types';
import { getDueInfo, getNextEMIDate, calculateCurrentBalance } from '@/lib/calculations';
import { convertCurrency } from '@/lib/currency';
import { getLastNMonths, formatMonthYear } from '@/lib/dates';
import { format, startOfMonth, endOfMonth, addDays } from 'date-fns';

/**
 * Dashboard summary stats: total debt, obligations, credit limits.
 */
export function useDashboardStats(defaultCurrency: string = 'INR') {
  const user = useAuthStore((s) => s.user);

  return useQuery({
    queryKey: ['dashboard', 'stats', user?.id, defaultCurrency],
    queryFn: async (): Promise<DashboardSummary> => {
      // Fetch active loans
      const { data: loans } = await supabase
        .from('loans')
        .select('current_outstanding, emi_amount, currency')
        .eq('status', 'active');

      // Fetch active cards
      const { data: cards } = await supabase
        .from('credit_cards')
        .select('credit_limit, currency, id')
        .eq('status', 'active');

      // Fetch current month bills
      const monthStart = format(startOfMonth(new Date()), 'yyyy-MM-dd');
      const { data: bills } = await supabase
        .from('cc_bills')
        .select('statement_amount, status')
        .eq('billing_month', monthStart)
        .in('status', ['generated', 'upcoming', 'overdue', 'partially_paid']);

      // Calculate totals (convert everything to default currency)
      let totalDebt = 0;
      let monthlyEMIs = 0;

      for (const loan of (loans as Loan[]) ?? []) {
        totalDebt += convertCurrency(loan.current_outstanding, loan.currency, defaultCurrency);
        monthlyEMIs += convertCurrency(loan.emi_amount, loan.currency, defaultCurrency);
      }

      let totalCreditLimit = 0;
      for (const card of (cards as Pick<CreditCard, 'credit_limit' | 'currency' | 'id'>[]) ?? []) {
        totalCreditLimit += convertCurrency(card.credit_limit, card.currency, defaultCurrency);
      }

      let monthlyBills = 0;
      for (const bill of (bills as Pick<CCBill, 'statement_amount' | 'status'>[]) ?? []) {
        monthlyBills += bill.statement_amount; // assumes same currency for simplicity
      }

      return {
        totalOutstandingDebt: Math.round(totalDebt * 100) / 100,
        thisMonthObligations: Math.round((monthlyEMIs + monthlyBills) * 100) / 100,
        totalCreditLimit: Math.round(totalCreditLimit * 100) / 100,
        totalAvailableCredit: Math.round(totalCreditLimit * 100) / 100, // Will subtract balances when we have them
        currency: defaultCurrency,
      };
    },
    enabled: !!user,
    staleTime: 60_000, // 1 minute
  });
}

/**
 * Upcoming payments in the next 30 days.
 */
export function useUpcomingPayments() {
  const user = useAuthStore((s) => s.user);

  return useQuery({
    queryKey: ['dashboard', 'upcoming', user?.id],
    queryFn: async (): Promise<UpcomingPayment[]> => {
      const today = new Date();
      const thirtyDaysLater = format(addDays(today, 30), 'yyyy-MM-dd');
      const todayStr = format(today, 'yyyy-MM-dd');
      const payments: UpcomingPayment[] = [];

      // Active loans → next EMI dates
      const { data: loans } = await supabase
        .from('loans')
        .select('id, name, emi_amount, emi_day, currency')
        .eq('status', 'active');

      for (const loan of (loans as Pick<Loan, 'id' | 'name' | 'emi_amount' | 'emi_day' | 'currency'>[]) ?? []) {
        const nextDate = getNextEMIDate(loan.emi_day);
        if (nextDate <= thirtyDaysLater) {
          const due = getDueInfo(nextDate);
          payments.push({
            id: `loan-${loan.id}`,
            name: loan.name,
            type: 'loan',
            amount: loan.emi_amount,
            currency: loan.currency,
            dueDate: nextDate,
            daysRemaining: due.daysRemaining,
            status: due.status,
            linkedId: loan.id,
          });
        }
      }

      // Unpaid/upcoming bills
      const { data: bills } = await supabase
        .from('cc_bills')
        .select('id, card_id, statement_amount, due_date, status')
        .in('status', ['generated', 'upcoming', 'overdue', 'partially_paid'])
        .lte('due_date', thirtyDaysLater);

      // Get card names for bills
      const cardIds = [...new Set((bills ?? []).map((b: any) => b.card_id))];
      let cardMap: Record<string, string> = {};
      if (cardIds.length > 0) {
        const { data: cardNames } = await supabase
          .from('credit_cards')
          .select('id, name, currency')
          .in('id', cardIds);
        for (const c of (cardNames ?? []) as Pick<CreditCard, 'id' | 'name' | 'currency'>[]) {
          cardMap[c.id] = c.name;
        }
      }

      for (const bill of (bills as Pick<CCBill, 'id' | 'card_id' | 'statement_amount' | 'due_date' | 'status'>[]) ?? []) {
        const due = getDueInfo(bill.due_date);
        payments.push({
          id: `bill-${bill.id}`,
          name: cardMap[bill.card_id] ?? 'Card Bill',
          type: 'card',
          amount: bill.statement_amount,
          currency: 'INR',
          dueDate: bill.due_date,
          daysRemaining: due.daysRemaining,
          status: due.status,
          linkedId: bill.card_id,
        });
      }

      // Sort by days remaining
      return payments.sort((a, b) => a.daysRemaining - b.daysRemaining);
    },
    enabled: !!user,
    staleTime: 60_000,
  });
}

/**
 * Debt reduction history over the last 12 months (for line chart).
 */
export function useDebtHistory() {
  const user = useAuthStore((s) => s.user);

  return useQuery({
    queryKey: ['dashboard', 'debtHistory', user?.id],
    queryFn: async (): Promise<DebtHistoryPoint[]> => {
      const months = getLastNMonths(12);
      const points: DebtHistoryPoint[] = [];

      // Get all loan payments to reconstruct outstanding over time
      const { data: payments } = await supabase
        .from('loan_payments')
        .select('emi_month, outstanding_after, loan_id')
        .order('emi_month', { ascending: true });

      // Get current loan outstandings
      const { data: loans } = await supabase
        .from('loans')
        .select('id, current_outstanding, principal_amount')
        .eq('status', 'active');

      const loanMap = new Map<string, number>();
      for (const loan of (loans ?? []) as Pick<Loan, 'id' | 'current_outstanding' | 'principal_amount'>[]) {
        loanMap.set(loan.id, loan.current_outstanding);
      }

      // Build outstanding at each month end from payments
      const paymentsByMonth = new Map<string, number>();
      for (const payment of (payments ?? []) as Pick<LoanPayment, 'emi_month' | 'outstanding_after' | 'loan_id'>[]) {
        const monthKey = format(startOfMonth(new Date(payment.emi_month)), 'yyyy-MM-dd');
        // Sum outstanding across all loans for this month
        const existing = paymentsByMonth.get(monthKey) ?? 0;
        paymentsByMonth.set(monthKey, existing + payment.outstanding_after);
      }

      // Fallback: use current outstanding for months without data
      const totalCurrent = Array.from(loanMap.values()).reduce((s, v) => s + v, 0);

      for (const month of months) {
        points.push({
          month: formatMonthYear(month),
          totalDebt: paymentsByMonth.get(month) ?? totalCurrent,
        });
      }

      return points;
    },
    enabled: !!user,
    staleTime: 300_000, // 5 minutes
  });
}

/**
 * Monthly outflow for the last 6 months (for bar chart).
 */
export function useMonthlyOutflow() {
  const user = useAuthStore((s) => s.user);

  return useQuery({
    queryKey: ['dashboard', 'outflow', user?.id],
    queryFn: async (): Promise<MonthlyOutflow[]> => {
      const months = getLastNMonths(6);
      const outflows: MonthlyOutflow[] = [];

      // Get loan payments by month
      const { data: loanPayments } = await supabase
        .from('loan_payments')
        .select('emi_month, amount_paid')
        .gte('emi_month', months[0]);

      // Get CC bill payments by month
      const { data: billPayments } = await supabase
        .from('cc_bills')
        .select('billing_month, paid_amount')
        .not('paid_amount', 'is', null)
        .gte('billing_month', months[0]);

      for (const month of months) {
        const emiTotal = ((loanPayments ?? []) as Pick<LoanPayment, 'emi_month' | 'amount_paid'>[])
          .filter((p) => format(startOfMonth(new Date(p.emi_month)), 'yyyy-MM-dd') === month)
          .reduce((sum, p) => sum + p.amount_paid, 0);

        const ccTotal = ((billPayments ?? []) as Pick<CCBill, 'billing_month' | 'paid_amount'>[])
          .filter((b) => b.billing_month === month)
          .reduce((sum, b) => sum + (b.paid_amount ?? 0), 0);

        outflows.push({
          month: formatMonthYear(month),
          emiPayments: Math.round(emiTotal * 100) / 100,
          ccPayments: Math.round(ccTotal * 100) / 100,
          total: Math.round((emiTotal + ccTotal) * 100) / 100,
        });
      }

      return outflows;
    },
    enabled: !!user,
    staleTime: 300_000,
  });
}
