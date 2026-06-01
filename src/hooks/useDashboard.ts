// ============================================================
// ZRHO — Dashboard Hooks (TanStack Query)
// Aggregates data from loans, cards, payments, and bills
// ============================================================

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import type { Loan, CreditCard, LoanPayment, CCBill, CCTransaction } from '@/types/database.types';
import type { DashboardSummary, UpcomingPayment, MonthlyOutflow, DebtHistoryPoint, CategorySpend } from '@/types/common.types';
import { getDueInfo, getNextEMIDate } from '@/lib/calculations';
import { convertCurrency } from '@/lib/currency';
import { getLastNMonths, formatMonthYear } from '@/lib/dates';
import { format, startOfMonth, addDays } from 'date-fns';

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
        .select('current_outstanding, emi_amount, currency, is_third_party')
        .eq('status', 'active');

      // Fetch active cards
      const { data: cards } = await supabase
        .from('credit_cards')
        .select('credit_limit, currency, id, name, color')
        .eq('status', 'active');

      // Group active card info by ID
      const cardMap = new Map<string, Pick<CreditCard, 'credit_limit' | 'currency' | 'id' | 'name' | 'color'>>();
      for (const card of (cards as Pick<CreditCard, 'credit_limit' | 'currency' | 'id' | 'name' | 'color'>[]) ?? []) {
        cardMap.set(card.id, card);
      }

      // Fetch active credit card transactions to compute current outstanding balance per card
      const { data: cardTransactions } = await supabase
        .from('cc_transactions')
        .select('card_id, amount, transaction_type');

      // Group card transactions by card ID
      const txsByCard = new Map<string, { amount: number; transaction_type: string }[]>();
      for (const tx of (cardTransactions ?? []) as { card_id: string; amount: number; transaction_type: string }[]) {
        const list = txsByCard.get(tx.card_id) ?? [];
        list.push(tx);
        txsByCard.set(tx.card_id, list);
      }

      // Fetch current month bills
      const monthStart = format(startOfMonth(new Date()), 'yyyy-MM-dd');
      const { data: bills } = await supabase
        .from('cc_bills')
        .select('card_id, statement_amount, status')
        .eq('billing_month', monthStart)
        .in('status', ['generated', 'upcoming', 'overdue', 'partially_paid']);

      // Calculate totals (convert everything to default currency)
      let totalDebt = 0;
      let monthlyEMIs = 0;

      for (const loan of (loans as Loan[]) ?? []) {
        if (loan.is_third_party) continue;
        totalDebt += convertCurrency(loan.current_outstanding, loan.currency, defaultCurrency);
        monthlyEMIs += convertCurrency(loan.emi_amount, loan.currency, defaultCurrency);
      }

      let totalCreditLimit = 0;
      let totalAvailableCredit = 0;
      const cardBreakdown: DashboardSummary['cardBreakdown'] = [];

      for (const card of (cards as Pick<CreditCard, 'credit_limit' | 'currency' | 'id' | 'name' | 'color'>[]) ?? []) {
        totalCreditLimit += convertCurrency(card.credit_limit, card.currency, defaultCurrency);

        const cardTxs = txsByCard.get(card.id) ?? [];
        const cardOutstanding = cardTxs.reduce((sum, tx) => {
          if (tx.transaction_type === 'debit') {
            return sum + tx.amount;
          } else {
            return sum - tx.amount;
          }
        }, 0);

        // Subtract active outstanding card balance from its limit to get available credit
        const available = Math.max(0, card.credit_limit - Math.max(0, cardOutstanding));
        totalAvailableCredit += convertCurrency(available, card.currency, defaultCurrency);

        const convertedOutstanding = convertCurrency(Math.max(0, cardOutstanding), card.currency, defaultCurrency);
        // Also add credit card outstanding to total debt
        totalDebt += convertedOutstanding;

        cardBreakdown.push({
          id: card.id,
          name: card.name,
          color: card.color,
          limit: convertCurrency(card.credit_limit, card.currency, defaultCurrency),
          outstanding: convertedOutstanding
        });
      }

      let monthlyBills = 0;
      for (const bill of (bills as Pick<CCBill, 'card_id' | 'statement_amount' | 'status'>[]) ?? []) {
        const card = cardMap.get(bill.card_id);
        const cardCurrency = card?.currency ?? defaultCurrency;
        monthlyBills += convertCurrency(bill.statement_amount, cardCurrency, defaultCurrency);
      }

      return {
        totalOutstandingDebt: Math.round(totalDebt * 100) / 100,
        thisMonthObligations: Math.round((monthlyEMIs + monthlyBills) * 100) / 100,
        totalCreditLimit: Math.round(totalCreditLimit * 100) / 100,
        totalAvailableCredit: Math.round(totalAvailableCredit * 100) / 100,
        currency: defaultCurrency,
        cardBreakdown,
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

      // Get card names & currencies for bills
      const cardIds = [...new Set((bills ?? []).map((b: any) => b.card_id))];
      let cardInfoMap: Record<string, { name: string; currency: string }> = {};
      if (cardIds.length > 0) {
        const { data: cardNames } = await supabase
          .from('credit_cards')
          .select('id, name, currency')
          .in('id', cardIds);
        for (const c of (cardNames ?? []) as Pick<CreditCard, 'id' | 'name' | 'currency'>[]) {
          cardInfoMap[c.id] = { name: c.name, currency: c.currency };
        }
      }

      for (const bill of (bills as Pick<CCBill, 'id' | 'card_id' | 'statement_amount' | 'due_date' | 'status'>[]) ?? []) {
        const due = getDueInfo(bill.due_date);
        const info = cardInfoMap[bill.card_id];
        payments.push({
          id: `bill-${bill.id}`,
          name: info?.name ?? 'Card Bill',
          type: 'card',
          amount: bill.statement_amount,
          currency: info?.currency ?? 'INR',
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
export function useDebtHistory(defaultCurrency: string = 'INR') {
  const user = useAuthStore((s) => s.user);

  return useQuery({
    queryKey: ['dashboard', 'debtHistory', user?.id, defaultCurrency],
    queryFn: async (): Promise<DebtHistoryPoint[]> => {
      const months = getLastNMonths(12);
      const points: DebtHistoryPoint[] = [];

      // Fetch all loans (active and closed)
      const { data: loans } = await supabase
        .from('loans')
        .select('id, principal_amount, start_date, currency, is_third_party');

      // Fetch all loan payments
      const { data: payments } = await supabase
        .from('loan_payments')
        .select('emi_month, outstanding_after, loan_id')
        .order('emi_month', { ascending: true });

      const paymentsByLoan = new Map<string, Pick<LoanPayment, 'emi_month' | 'outstanding_after'>[]>();
      for (const p of (payments ?? []) as Pick<LoanPayment, 'emi_month' | 'outstanding_after' | 'loan_id'>[]) {
        const list = paymentsByLoan.get(p.loan_id) ?? [];
        list.push({ emi_month: p.emi_month, outstanding_after: p.outstanding_after });
        paymentsByLoan.set(p.loan_id, list);
      }

      for (const monthStr of months) {
        let totalDebtForMonth = 0;

        for (const loan of (loans as Loan[]) ?? []) {
          if (loan.is_third_party) continue;

          const loanStartMonthStr = format(startOfMonth(new Date(loan.start_date)), 'yyyy-MM-dd');
          
          if (loanStartMonthStr > monthStr) {
            // Loan has not started yet in this month
            continue;
          }

          const loanPayments = paymentsByLoan.get(loan.id) ?? [];
          // Find all payments on or before this month
          const pastPayments = loanPayments.filter(
            (p) => format(startOfMonth(new Date(p.emi_month)), 'yyyy-MM-dd') <= monthStr
          );

          let outstanding = loan.principal_amount;

          if (pastPayments.length > 0) {
            // Group by month to find the latest payment month
            const byMonth = new Map<string, number>();
            for (const p of pastPayments) {
              const pMonthStr = format(startOfMonth(new Date(p.emi_month)), 'yyyy-MM-dd');
              const currentMin = byMonth.get(pMonthStr) ?? Infinity;
              byMonth.set(pMonthStr, Math.min(currentMin, p.outstanding_after));
            }

            // Find the latest payment month key
            const sortedPaymentMonths = Array.from(byMonth.keys()).sort();
            const latestMonthKey = sortedPaymentMonths[sortedPaymentMonths.length - 1];
            outstanding = byMonth.get(latestMonthKey) ?? loan.principal_amount;
          }

          totalDebtForMonth += convertCurrency(outstanding, loan.currency, defaultCurrency);
        }

        points.push({
          month: formatMonthYear(monthStr),
          totalDebt: Math.round(totalDebtForMonth * 100) / 100,
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
export function useMonthlyOutflow(defaultCurrency: string = 'INR') {
  const user = useAuthStore((s) => s.user);

  return useQuery({
    queryKey: ['dashboard', 'outflow', user?.id, defaultCurrency],
    queryFn: async (): Promise<MonthlyOutflow[]> => {
      const months = getLastNMonths(6);
      const outflows: MonthlyOutflow[] = [];

      // Fetch all loans to map currency and third-party status
      const { data: loans } = await supabase
        .from('loans')
        .select('id, currency, is_third_party');
      const loanCurrencyMap = new Map<string, string>();
      const thirdPartyLoanIds = new Set<string>();
      for (const l of loans ?? []) {
        loanCurrencyMap.set(l.id, l.currency);
        if (l.is_third_party) thirdPartyLoanIds.add(l.id);
      }

      // Fetch all cards to map currency
      const { data: cards } = await supabase
        .from('credit_cards')
        .select('id, currency');
      const cardCurrencyMap = new Map<string, string>();
      for (const c of cards ?? []) {
        cardCurrencyMap.set(c.id, c.currency);
      }

      // Get loan payments with loan_id by month
      const { data: loanPayments } = await supabase
        .from('loan_payments')
        .select('emi_month, amount_paid, loan_id')
        .gte('emi_month', months[0]);

      // Get CC bill payments with card_id by month
      const { data: billPayments } = await supabase
        .from('cc_bills')
        .select('billing_month, paid_amount, card_id')
        .not('paid_amount', 'is', null)
        .gte('billing_month', months[0]);

      for (const month of months) {
        let emiTotal = 0;
        for (const p of (loanPayments ?? []) as Pick<LoanPayment, 'emi_month' | 'amount_paid' | 'loan_id'>[]) {
          if (thirdPartyLoanIds.has(p.loan_id)) continue;
          if (format(startOfMonth(new Date(p.emi_month)), 'yyyy-MM-dd') === month) {
            const loanCurrency = loanCurrencyMap.get(p.loan_id) ?? defaultCurrency;
            emiTotal += convertCurrency(p.amount_paid, loanCurrency, defaultCurrency);
          }
        }

        let ccTotal = 0;
        for (const b of (billPayments ?? []) as Pick<CCBill, 'billing_month' | 'paid_amount' | 'card_id'>[]) {
          if (b.billing_month === month) {
            const cardCurrency = cardCurrencyMap.get(b.card_id) ?? defaultCurrency;
            ccTotal += convertCurrency(b.paid_amount ?? 0, cardCurrency, defaultCurrency);
          }
        }

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

/**
 * Spend per category for the current month.
 */
export function useCurrentMonthCategorySpends(defaultCurrency: string = 'INR') {
  const user = useAuthStore((s) => s.user);

  return useQuery({
    queryKey: ['dashboard', 'categorySpends', user?.id, defaultCurrency],
    queryFn: async (): Promise<CategorySpend[]> => {
      const startOfThisMonth = format(startOfMonth(new Date()), 'yyyy-MM-dd');

      // Fetch all credit cards to get their currency mapping
      const { data: cards } = await supabase
        .from('credit_cards')
        .select('id, currency');
      const cardCurrencyMap = new Map<string, string>();
      for (const c of cards ?? []) {
        cardCurrencyMap.set(c.id, c.currency);
      }

      // Fetch debit transactions for current month
      const { data: transactions } = await supabase
        .from('cc_transactions')
        .select('amount, category, card_id')
        .eq('transaction_type', 'debit')
        .gte('transaction_date', startOfThisMonth);

      const sumsByCategory = new Map<string, number>();

      for (const tx of (transactions as Pick<CCTransaction, 'amount' | 'category' | 'card_id'>[]) ?? []) {
        const cardCurrency = cardCurrencyMap.get(tx.card_id) ?? defaultCurrency;
        const convertedAmount = convertCurrency(tx.amount, cardCurrency, defaultCurrency);
        const currentSum = sumsByCategory.get(tx.category) ?? 0;
        sumsByCategory.set(tx.category, currentSum + convertedAmount);
      }

      const results: CategorySpend[] = [];
      for (const [category, amount] of sumsByCategory.entries()) {
        results.push({
          category,
          amount: Math.round(amount * 100) / 100,
          currency: defaultCurrency,
        });
      }

      // Sort descending by amount
      return results.sort((a, b) => b.amount - a.amount);
    },
    enabled: !!user,
    staleTime: 60_000,
  });
}
