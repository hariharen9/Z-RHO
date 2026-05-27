// ============================================================
// ZRHO — Ledger Export Center Utility
// ============================================================

import { supabase } from '@/lib/supabase';
import { convertCurrency, formatCurrency } from '@/lib/currency';
import { format, parseISO } from 'date-fns';

const csvEscape = (val: any): string => {
  if (val === null || val === undefined) return '';
  const str = String(val);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

/**
 * High-performance, client-side data fetcher & formatting pipeline
 * Exports user data as CSV, JSON, or vector PDF reports
 */
export async function exportLedgerData(
  type: 'cards' | 'loans',
  formatType: 'csv' | 'json' | 'pdf',
  targetCurrency: string = 'INR'
): Promise<void> {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    throw new Error('User session not found. Please sign in to export.');
  }

  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const displayDate = format(new Date(), 'dd MMMM yyyy');

  if (type === 'loans') {
    // ------------------------------------------------------------
    // LOANS EXPORT PIPELINE
    // ------------------------------------------------------------
    const { data: loans, error: loansError } = await supabase
      .from('loans')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (loansError) throw loansError;
    if (!loans || loans.length === 0) {
      throw new Error('No loans found to export.');
    }

    const { data: payments, error: paymentsError } = await supabase
      .from('loan_payments')
      .select('*')
      .eq('user_id', user.id)
      .order('payment_date', { ascending: true });

    if (paymentsError) throw paymentsError;

    // Join and enrich loans in memory
    const enrichedLoans = loans.map((loan) => {
      const loanPayments = (payments || []).filter((p) => p.loan_id === loan.id);
      const totalAmountPaid = loanPayments.reduce((sum, p) => sum + Number(p.amount_paid), 0);
      const principalPaid = loanPayments.reduce((sum, p) => sum + Number(p.principal_component), 0);
      const interestPaid = loanPayments.reduce((sum, p) => sum + Number(p.interest_component), 0);
      const paymentsCount = loanPayments.filter((p) => !p.is_prepayment).length;
      const prepaymentsCount = loanPayments.filter((p) => p.is_prepayment).length;

      return {
        ...loan,
        payments: loanPayments,
        summary: {
          totalAmountPaid,
          principalPaid,
          interestPaid,
          paymentsCount,
          prepaymentsCount,
          progressPercent: loan.principal_amount > 0 
            ? Math.round(((loan.principal_amount - loan.current_outstanding) / loan.principal_amount) * 100)
            : 0,
        },
      };
    });

    if (formatType === 'json') {
      // 1. JSON Export
      const blob = new Blob([JSON.stringify(enrichedLoans, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `zrho_loans_export_${todayStr}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } else if (formatType === 'csv') {
      // 2. CSV Export
      const headers = [
        'Loan ID',
        'Loan Name',
        'Lender',
        'Loan Type',
        'Currency',
        'Principal Amount',
        'Current Outstanding',
        'Interest Rate %',
        'Tenure (Months)',
        'Monthly EMI',
        'Due Day',
        'Start Date',
        'End Date',
        'Total Interest Payable',
        'Total Amount Payable',
        'Status',
        'Total Payments Recorded',
        'Prepayments Count',
        'Total Amount Paid',
        'Principal Paid',
        'Interest Paid',
        'Notes',
      ];

      const csvRows = [
        headers.join(','),
        ...enrichedLoans.map((l) => [
          l.id,
          l.name,
          l.lender,
          l.loan_type,
          l.currency,
          l.principal_amount,
          l.current_outstanding,
          l.interest_rate,
          l.tenure_months,
          l.emi_amount,
          l.emi_day,
          l.start_date,
          l.end_date,
          l.total_interest_payable,
          l.total_amount_payable,
          l.status,
          l.summary.paymentsCount,
          l.summary.prepaymentsCount,
          l.summary.totalAmountPaid,
          l.summary.principalPaid,
          l.summary.interestPaid,
          l.notes ?? '',
        ].map(csvEscape).join(',')),
      ];

      const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `zrho_loans_export_${todayStr}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } else if (formatType === 'pdf') {
      // 3. PDF Export (Vector HTML Hidden IFrame Printing)
      const totalOutstanding = enrichedLoans.reduce(
        (sum, l) => sum + convertCurrency(Number(l.current_outstanding), l.currency, targetCurrency),
        0
      );
      const totalPrincipal = enrichedLoans.reduce(
        (sum, l) => sum + convertCurrency(Number(l.principal_amount), l.currency, targetCurrency),
        0
      );
      const totalEMIs = enrichedLoans.reduce(
        (sum, l) => l.status === 'active' ? sum + convertCurrency(Number(l.emi_amount), l.currency, targetCurrency) : sum,
        0
      );

      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Z-RHO Financial Report — Loans</title>
          <style>
            @media print {
              @page { size: A4 portrait; margin: 15mm; }
              body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            }
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
              color: #1f2937;
              background: #ffffff;
              line-height: 1.4;
              font-size: 11px;
            }
            .header {
              border-bottom: 2px solid #e5e7eb;
              padding-bottom: 12px;
              margin-bottom: 20px;
              display: flex;
              justify-content: space-between;
              align-items: flex-end;
            }
            .logo-area h1 {
              font-size: 20px;
              font-weight: 800;
              letter-spacing: 0.15em;
              color: #4f46e5;
              margin: 0;
            }
            .logo-area p {
              font-size: 9px;
              text-transform: uppercase;
              letter-spacing: 0.05em;
              color: #6b7280;
              margin: 2px 0 0 0;
            }
            .date-area {
              text-align: right;
              font-size: 10px;
              color: #6b7280;
            }
            .title {
              font-size: 16px;
              font-weight: 700;
              color: #111827;
              margin-top: 15px;
              margin-bottom: 15px;
            }
            .stats-grid {
              display: grid;
              grid-template-columns: repeat(3, 1fr);
              gap: 12px;
              margin-bottom: 25px;
            }
            .stat-card {
              background: #f9fafb;
              border: 1px solid #e5e7eb;
              border-radius: 8px;
              padding: 12px;
            }
            .stat-label {
              font-size: 8px;
              font-weight: 700;
              text-transform: uppercase;
              letter-spacing: 0.05em;
              color: #6b7280;
            }
            .stat-value {
              font-size: 14px;
              font-weight: 700;
              color: #111827;
              margin-top: 4px;
            }
            .section-title {
              font-size: 11px;
              font-weight: 700;
              text-transform: uppercase;
              letter-spacing: 0.05em;
              color: #374151;
              border-left: 3px solid #4f46e5;
              padding-left: 6px;
              margin: 20px 0 10px 0;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 20px;
            }
            th {
              background: #f3f4f6;
              color: #374151;
              font-weight: 700;
              text-align: left;
              padding: 6px 8px;
              border-bottom: 1px solid #d1d5db;
              font-size: 9px;
              text-transform: uppercase;
              letter-spacing: 0.02em;
            }
            td {
              padding: 7px 8px;
              border-bottom: 1px solid #e5e7eb;
            }
            tr:nth-child(even) td {
              background: #f9fafb;
            }
            .badge {
              display: inline-block;
              padding: 2px 6px;
              border-radius: 9999px;
              font-size: 8px;
              font-weight: 700;
              text-transform: uppercase;
            }
            .badge-active { background: #d1fae5; color: #065f46; }
            .badge-closed { background: #f3f4f6; color: #374151; }
            
            .progress-bar-bg {
              background: #e5e7eb;
              border-radius: 9999px;
              height: 5px;
              width: 70px;
              display: inline-block;
              vertical-align: middle;
              margin-right: 6px;
              overflow: hidden;
            }
            .progress-bar-fill {
              background: #4f46e5;
              height: 100%;
              border-radius: 9999px;
            }
            .loan-detail-card {
              border: 1px solid #e5e7eb;
              border-radius: 8px;
              padding: 12px;
              margin-bottom: 15px;
              page-break-inside: avoid;
            }
            .loan-detail-title {
              font-size: 12px;
              font-weight: 700;
              color: #111827;
              margin-bottom: 8px;
              display: flex;
              justify-content: space-between;
            }
            .grid-2 {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 15px;
            }
            .detail-label {
              font-size: 9px;
              color: #6b7280;
            }
            .detail-value {
              font-weight: 600;
              color: #374151;
            }
            .page-break {
              page-break-before: always;
            }
            .footer {
              text-align: center;
              font-size: 9px;
              color: #9ca3af;
              margin-top: 30px;
              border-top: 1px solid #e5e7eb;
              padding-top: 10px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="logo-area">
              <h1>Z-RHO</h1>
              <p>Know your money · Personal Finance OS</p>
            </div>
            <div class="date-area">
              Report Date: <strong>${displayDate}</strong>
            </div>
          </div>

          <div class="title">Active Loan Liabilities Summary</div>

          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-label">Total Outstanding Debt</div>
              <div class="stat-value">${formatCurrency(totalOutstanding, targetCurrency)}</div>
            </div>
            <div class="stat-card">
              <div class="stat-label">Original Principal Liabilities</div>
              <div class="stat-value">${formatCurrency(totalPrincipal, targetCurrency)}</div>
            </div>
            <div class="stat-card">
              <div class="stat-label">Monthly EMI Commitments</div>
              <div class="stat-value">${formatCurrency(totalEMIs, targetCurrency)}</div>
            </div>
          </div>

          <div class="section-title">Loan Liabilities Registry</div>
          <table>
            <thead>
              <tr>
                <th>Loan Description</th>
                <th>Lender / Bank</th>
                <th>Principal</th>
                <th>Outstanding</th>
                <th>Rate</th>
                <th>EMI</th>
                <th>Progress</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${enrichedLoans.map((l) => `
                <tr>
                  <td style="font-weight:600;">${l.name}</td>
                  <td>${l.lender}</td>
                  <td>${formatCurrency(Number(l.principal_amount), l.currency)}</td>
                  <td style="font-weight:600;color:#111827;">${formatCurrency(Number(l.current_outstanding), l.currency)}</td>
                  <td>${l.interest_rate}%</td>
                  <td>${formatCurrency(Number(l.emi_amount), l.currency)}/mo</td>
                  <td>
                    <div class="progress-bar-bg">
                      <div class="progress-bar-fill" style="width: ${l.summary.progressPercent}%"></div>
                    </div>
                    <strong>${l.summary.progressPercent}%</strong>
                  </td>
                  <td>
                    <span class="badge ${l.status === 'active' ? 'badge-active' : 'badge-closed'}">
                      ${l.status}
                    </span>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="page-break"></div>

          <div class="section-title">Individual Loan Repayment Schedules</div>
          ${enrichedLoans.map((l) => `
            <div class="loan-detail-card">
              <div class="loan-detail-title">
                <span>${l.name} (${l.lender})</span>
                <span class="badge ${l.status === 'active' ? 'badge-active' : 'badge-closed'}">${l.status}</span>
              </div>
              <div class="grid-2" style="margin-bottom: 8px;">
                <div>
                  <table style="margin-bottom:0; font-size:10px;">
                    <tr><td class="detail-label">Original Principal</td><td class="detail-value">${formatCurrency(Number(l.principal_amount), l.currency)}</td></tr>
                    <tr><td class="detail-label">Current Outstanding</td><td class="detail-value">${formatCurrency(Number(l.current_outstanding), l.currency)}</td></tr>
                    <tr><td class="detail-label">Interest Rate (p.a.)</td><td class="detail-value">${l.interest_rate}%</td></tr>
                    <tr><td class="detail-label">Tenure Duration</td><td class="detail-value">${l.tenure_months} Months</td></tr>
                  </table>
                </div>
                <div>
                  <table style="margin-bottom:0; font-size:10px;">
                    <tr><td class="detail-label">Disbursement Date</td><td class="detail-value">${format(parseISO(l.start_date), 'd MMM yyyy')}</td></tr>
                    <tr><td class="detail-label">Maturity Date</td><td class="detail-value">${format(parseISO(l.end_date), 'd MMM yyyy')}</td></tr>
                    <tr><td class="detail-label">Total Amount Paid</td><td class="detail-value">${formatCurrency(l.summary.totalAmountPaid, l.currency)}</td></tr>
                    <tr><td class="detail-label">Payments count</td><td class="detail-value">${l.summary.paymentsCount} EMIs · ${l.summary.prepaymentsCount} Prepayments</td></tr>
                  </table>
                </div>
              </div>
              ${l.notes ? `<div style="font-size: 9px; color: #6b7280; padding: 4px 6px; border-left: 2px solid #d1d5db; margin-bottom:8px; background:#f9fafb;">Note: ${l.notes}</div>` : ''}
              
              <div style="font-size: 9px; font-weight:700; text-transform:uppercase; color:#4b5563; margin-top:10px; margin-bottom:5px;">Recent Repayments History</div>
              ${l.payments.length === 0 
                ? '<div style="font-size:10px; color:#9ca3af; font-style:italic;">No payments logged yet for this loan account.</div>'
                : `
                  <table style="font-size:10px; margin-bottom:0;">
                    <thead>
                      <tr>
                        <th style="padding: 4px;">Date Paid</th>
                        <th style="padding: 4px;">Billing Month</th>
                        <th style="padding: 4px;">Amount Paid</th>
                        <th style="padding: 4px;">Principal Component</th>
                        <th style="padding: 4px;">Interest Component</th>
                        <th style="padding: 4px;">Outstanding Balance</th>
                        <th style="padding: 4px;">Type</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${l.payments.slice(-8).map((p: any) => `
                        <tr>
                          <td style="padding: 4px;">${format(parseISO(p.payment_date), 'd MMM yyyy')}</td>
                          <td style="padding: 4px;">${format(parseISO(p.emi_month), 'MMMM yyyy')}</td>
                          <td style="padding: 4px;font-weight:600;color:#111827;">${formatCurrency(Number(p.amount_paid), l.currency)}</td>
                          <td style="padding: 4px;">${formatCurrency(Number(p.principal_component), l.currency)}</td>
                          <td style="padding: 4px;">${formatCurrency(Number(p.interest_component), l.currency)}</td>
                          <td style="padding: 4px;">${formatCurrency(Number(p.outstanding_after), l.currency)}</td>
                          <td style="padding: 4px;">
                            <span style="font-size:8px; font-weight:700; text-transform:uppercase; color: ${p.is_prepayment ? '#7c3aed' : '#2563eb'}">
                              ${p.is_prepayment ? 'Prepayment' : 'EMI'}
                            </span>
                          </td>
                        </tr>
                      `).join('')}
                    </tbody>
                  </table>
                `
              }
            </div>
          `).join('')}

          <div class="footer">
            Generated automatically by <strong>Z-RHO Personal Finance OS</strong> · End of Report
          </div>
        </body>
        </html>
      `;

      triggerHiddenIFramePrint('Z-RHO_Loans_Report', htmlContent);
    }
  } else {
    // ------------------------------------------------------------
    // CREDIT CARDS EXPORT PIPELINE
    // ------------------------------------------------------------
    const { data: cards, error: cardsError } = await supabase
      .from('credit_cards')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (cardsError) throw cardsError;
    if (!cards || cards.length === 0) {
      throw new Error('No credit cards found to export.');
    }

    const { data: transactions, error: txError } = await supabase
      .from('cc_transactions')
      .select('*')
      .eq('user_id', user.id)
      .order('transaction_date', { ascending: false });

    if (txError) throw txError;

    const { data: bills, error: billsError } = await supabase
      .from('cc_bills')
      .select('*')
      .eq('user_id', user.id)
      .order('billing_month', { ascending: false });

    if (billsError) throw billsError;

    // Join and enrich cards in memory
    const enrichedCards = cards.map((card) => {
      const cardTx = (transactions || []).filter((t) => t.card_id === card.id);
      const cardBills = (bills || []).filter((b) => b.card_id === card.id);

      // Current balance is sum of debits (spend) minus sum of credits (payment/refund)
      const debitsSum = cardTx.filter(t => t.transaction_type === 'debit').reduce((sum, t) => sum + Number(t.amount), 0);
      const creditsSum = cardTx.filter(t => t.transaction_type === 'credit').reduce((sum, t) => sum + Number(t.amount), 0);
      const calculatedBalance = debitsSum - creditsSum;

      return {
        ...card,
        transactions: cardTx,
        bills: cardBills,
        summary: {
          calculatedBalance,
          availableCredit: Math.max(0, Number(card.credit_limit) - calculatedBalance),
          utilizationPercent: card.credit_limit > 0
            ? Math.min(100, Math.max(0, Math.round((calculatedBalance / card.credit_limit) * 100)))
            : 0,
          totalTxCount: cardTx.length,
          totalBillsCount: cardBills.length,
        },
      };
    });

    if (formatType === 'json') {
      // 1. JSON Export
      const blob = new Blob([JSON.stringify(enrichedCards, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `zrho_credit_cards_export_${todayStr}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } else if (formatType === 'csv') {
      // 2. CSV Export (Transaction Spending Ledger)
      const headers = [
        'Card Name',
        'Issuing Bank',
        'Last 4 Digits',
        'Card Network',
        'Credit Limit',
        'Card Currency',
        'Transaction Date',
        'Merchant',
        'Category',
        'Transaction Type',
        'Amount',
        'Billing Month Cycle',
        'Transaction Note',
      ];

      const csvRows: string[] = [headers.join(',')];

      enrichedCards.forEach((c) => {
        if (c.transactions.length === 0) {
          // Put one row for metadata if card has no transactions
          csvRows.push([
            c.name,
            c.bank,
            c.last_four ?? '',
            c.card_network,
            c.credit_limit,
            c.currency,
            '',
            'No transactions logged',
            '',
            '',
            '',
            '',
            '',
          ].map(csvEscape).join(','));
        } else {
          c.transactions.forEach((t: any) => {
            csvRows.push([
              c.name,
              c.bank,
              c.last_four ?? '',
              c.card_network,
              c.credit_limit,
              c.currency,
              t.transaction_date,
              t.merchant ?? 'General Entry',
              t.category,
              t.transaction_type,
              t.amount,
              t.billing_month ? t.billing_month.split('T')[0] : '',
              t.note ?? '',
            ].map(csvEscape).join(','));
          });
        }
      });

      const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `zrho_credit_cards_export_${todayStr}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } else if (formatType === 'pdf') {
      // 3. PDF Export (Vector HTML Hidden IFrame Printing)
      const totalLimit = enrichedCards.reduce(
        (sum, c) => sum + convertCurrency(Number(c.credit_limit), c.currency, targetCurrency),
        0
      );
      const totalBalance = enrichedCards.reduce(
        (sum, c) => sum + convertCurrency(Number(c.summary.calculatedBalance), c.currency, targetCurrency),
        0
      );
      const totalAvailable = Math.max(0, totalLimit - totalBalance);
      const netUtilization = totalLimit > 0 ? Math.round((totalBalance / totalLimit) * 100) : 0;

      // Extract spending categories breakdown
      const categoryTotals: Record<string, number> = {};
      let absoluteSpendInTarget = 0;

      transactions.forEach((tx) => {
        if (tx.transaction_type === 'debit') {
          // Find matching card for currency
          const card = cards.find(c => c.id === tx.card_id);
          const currency = card?.currency || 'INR';
          const convertedVal = convertCurrency(Number(tx.amount), currency, targetCurrency);
          
          categoryTotals[tx.category] = (categoryTotals[tx.category] || 0) + convertedVal;
          absoluteSpendInTarget += convertedVal;
        }
      });

      const sortedCategories = Object.entries(categoryTotals)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8); // Top 8 categories

      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Z-RHO Financial Report — Credit Cards</title>
          <style>
            @media print {
              @page { size: A4 portrait; margin: 15mm; }
              body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            }
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
              color: #1f2937;
              background: #ffffff;
              line-height: 1.4;
              font-size: 11px;
            }
            .header {
              border-bottom: 2px solid #e5e7eb;
              padding-bottom: 12px;
              margin-bottom: 20px;
              display: flex;
              justify-content: space-between;
              align-items: flex-end;
            }
            .logo-area h1 {
              font-size: 20px;
              font-weight: 800;
              letter-spacing: 0.15em;
              color: #4f46e5;
              margin: 0;
            }
            .logo-area p {
              font-size: 9px;
              text-transform: uppercase;
              letter-spacing: 0.05em;
              color: #6b7280;
              margin: 2px 0 0 0;
            }
            .date-area {
              text-align: right;
              font-size: 10px;
              color: #6b7280;
            }
            .title {
              font-size: 16px;
              font-weight: 700;
              color: #111827;
              margin-top: 15px;
              margin-bottom: 15px;
            }
            .stats-grid {
              display: grid;
              grid-template-columns: repeat(4, 1fr);
              gap: 12px;
              margin-bottom: 25px;
            }
            .stat-card {
              background: #f9fafb;
              border: 1px solid #e5e7eb;
              border-radius: 8px;
              padding: 12px;
            }
            .stat-label {
              font-size: 8px;
              font-weight: 700;
              text-transform: uppercase;
              letter-spacing: 0.05em;
              color: #6b7280;
            }
            .stat-value {
              font-size: 13px;
              font-weight: 700;
              color: #111827;
              margin-top: 4px;
            }
            .section-title {
              font-size: 11px;
              font-weight: 700;
              text-transform: uppercase;
              letter-spacing: 0.05em;
              color: #374151;
              border-left: 3px solid #4f46e5;
              padding-left: 6px;
              margin: 20px 0 10px 0;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 20px;
            }
            th {
              background: #f3f4f6;
              color: #374151;
              font-weight: 700;
              text-align: left;
              padding: 6px 8px;
              border-bottom: 1px solid #d1d5db;
              font-size: 9px;
              text-transform: uppercase;
              letter-spacing: 0.02em;
            }
            td {
              padding: 7px 8px;
              border-bottom: 1px solid #e5e7eb;
            }
            tr:nth-child(even) td {
              background: #f9fafb;
            }
            .badge {
              display: inline-block;
              padding: 2px 6px;
              border-radius: 9999px;
              font-size: 8px;
              font-weight: 700;
              text-transform: uppercase;
            }
            .badge-active { background: #d1fae5; color: #065f46; }
            .badge-danger { background: #fee2e2; color: #991b1b; }
            .badge-warn { background: #fef3c7; color: #92400e; }
            
            .bar-bg {
              background: #e5e7eb;
              border-radius: 4px;
              height: 10px;
              width: 100%;
              overflow: hidden;
              margin-top: 4px;
            }
            .bar-fill {
              height: 100%;
              border-radius: 4px;
            }
            .grid-2 {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 15px;
            }
            .card-item {
              border: 1px solid #e5e7eb;
              border-radius: 8px;
              padding: 10px;
              margin-bottom: 10px;
              page-break-inside: avoid;
            }
            .card-network-tag {
              font-size: 8px;
              font-weight: 700;
              text-transform: uppercase;
              color: #6b7280;
            }
            .page-break {
              page-break-before: always;
            }
            .footer {
              text-align: center;
              font-size: 9px;
              color: #9ca3af;
              margin-top: 30px;
              border-top: 1px solid #e5e7eb;
              padding-top: 10px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="logo-area">
              <h1>Z-RHO</h1>
              <p>Know your money · Personal Finance OS</p>
            </div>
            <div class="date-area">
              Report Date: <strong>${displayDate}</strong>
            </div>
          </div>

          <div class="title">Active Credit Cards Liability Summary</div>

          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-label">Net Credit Limit</div>
              <div class="stat-value">${formatCurrency(totalLimit, targetCurrency)}</div>
            </div>
            <div class="stat-card">
              <div class="stat-label">Net Outstanding Balance</div>
              <div class="stat-value" style="color: #991b1b;">${formatCurrency(totalBalance, targetCurrency)}</div>
            </div>
            <div class="stat-card">
              <div class="stat-label">Available Liquidity</div>
              <div class="stat-value" style="color: #065f46;">${formatCurrency(totalAvailable, targetCurrency)}</div>
            </div>
            <div class="stat-card">
              <div class="stat-label">Net Utilization Rate</div>
              <div class="stat-value">${netUtilization}%</div>
            </div>
          </div>

          <div class="section-title">Credit Accounts Registry</div>
          <table>
            <thead>
              <tr>
                <th>Credit Card Name</th>
                <th>Associated Bank</th>
                <th>Card Network</th>
                <th>Outstanding Balance</th>
                <th>Limit Capacity</th>
                <th>Utilization bar</th>
                <th>Statement / Due</th>
              </tr>
            </thead>
            <tbody>
              ${enrichedCards.map((c) => {
                const u = c.summary.utilizationPercent;
                const utColor = u > 60 ? '#ef4444' : u > 30 ? '#f59e0b' : '#10b981';
                const badgeClass = u > 60 ? 'badge-danger' : u > 30 ? 'badge-warn' : 'badge-active';
                return `
                  <tr>
                    <td style="font-weight:600;">${c.name} (..${c.last_four || 'XXXX'})</td>
                    <td>${c.bank}</td>
                    <td class="card-network-tag">${c.card_network}</td>
                    <td style="font-weight:700;color:${calculatedBalanceStyle(c.summary.calculatedBalance)}">${formatCurrency(c.summary.calculatedBalance, c.currency)}</td>
                    <td>${formatCurrency(Number(c.credit_limit), c.currency)}</td>
                    <td>
                      <span class="badge ${badgeClass}">${u}%</span>
                      <div class="bar-bg">
                        <div class="bar-fill" style="width: ${u}%; background-color: ${utColor};"></div>
                      </div>
                    </td>
                    <td>Day ${c.statement_day} / Day ${c.due_day}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>

          <div class="grid-2" style="margin-top: 25px;">
            <div>
              <div class="section-title">Top Expense Categories</div>
              ${sortedCategories.length === 0
                ? '<div style="font-size:10px; color:#9ca3af; font-style:italic;">No recorded spend debits to categorize.</div>'
                : `
                  <table>
                    <thead>
                      <tr>
                        <th>Category</th>
                        <th>Expenses (${targetCurrency})</th>
                        <th>Share</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${sortedCategories.map(([cat, val]) => {
                        const share = absoluteSpendInTarget > 0 ? Math.round((val / absoluteSpendInTarget) * 100) : 0;
                        return `
                          <tr>
                            <td style="font-weight:600;">${cat}</td>
                            <td>${formatCurrency(val, targetCurrency)}</td>
                            <td><strong>${share}%</strong></td>
                          </tr>
                        `;
                      }).join('')}
                    </tbody>
                  </table>
                `
              }
            </div>
            <div>
              <div class="section-title">Liability Accounts breakdown</div>
              ${enrichedCards.map((c) => `
                <div class="card-item" style="border-left: 3px solid ${c.color || '#4f46e5'}">
                  <div style="font-weight:700; font-size:10px;">${c.name}</div>
                  <div style="font-size:9px; color:#6b7280; margin-top:2px;">
                    Limit: ${formatCurrency(Number(c.credit_limit), c.currency)} · 
                    Unbilled: ${formatCurrency(c.summary.calculatedBalance, c.currency)}
                  </div>
                  <div style="font-size:9px; color:#6b7280; margin-top:1px;">
                    Statement cycles: ${c.summary.totalBillsCount} statements generated · ${c.summary.totalTxCount} transactions logged
                  </div>
                </div>
              `).join('')}
            </div>
          </div>

          <div class="page-break"></div>

          <div class="section-title">Recent Spending Ledger (Top 25 Entries)</div>
          ${transactions.length === 0
            ? '<div style="font-size:10px; color:#9ca3af; font-style:italic;">No logged credit card transactions found.</div>'
            : `
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Account</th>
                    <th>Merchant Entity</th>
                    <th>Category</th>
                    <th>Type</th>
                    <th>Transaction Amount</th>
                    <th>Note</th>
                  </tr>
                </thead>
                <tbody>
                  ${transactions.slice(0, 25).map((t) => {
                    const card = cards.find(c => c.id === t.card_id);
                    const cardName = card ? card.name : 'CC';
                    const isDebit = t.transaction_type === 'debit';
                    return `
                      <tr>
                        <td>${format(parseISO(t.transaction_date), 'dd MMM yyyy')}</td>
                        <td style="font-size:9px;color:#6b7280;">${cardName}</td>
                        <td style="font-weight:600;">${t.merchant ?? 'General Entry'}</td>
                        <td>${t.category}</td>
                        <td>
                          <span style="font-size:8px;font-weight:700;text-transform:uppercase;color:${isDebit ? '#dc2626' : '#16a34a'};">
                            ${t.transaction_type}
                          </span>
                        </td>
                        <td style="font-weight:700;color:${isDebit ? '#dc2626' : '#16a34a'};">${formatCurrency(Number(t.amount), card?.currency)}</td>
                        <td style="font-size:9px;color:#6b7280;max-width:120px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${t.note ?? ''}</td>
                      </tr>
                    `;
                  }).join('')}
                </tbody>
              </table>
            `
          }

          <div class="footer">
            Generated automatically by <strong>Z-RHO Personal Finance OS</strong> · End of Report
          </div>
        </body>
        </html>
      `;

      triggerHiddenIFramePrint('Z-RHO_CreditCards_Report', htmlContent);
    }
  }
}

function calculatedBalanceStyle(bal: number): string {
  return bal > 0 ? '#991b1b' : '#065f46';
}

/**
 * Creates a sandboxed dynamic iframe to perform vector-based system printing
 */
function triggerHiddenIFramePrint(fileName: string, htmlContent: string): void {
  const iframe = document.createElement('iframe');
  iframe.name = 'zrho_pdf_iframe';
  iframe.style.position = 'absolute';
  iframe.style.width = '0px';
  iframe.style.height = '0px';
  iframe.style.border = 'none';
  iframe.style.left = '-9999px';
  iframe.style.top = '-9999px';
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document || iframe.contentDocument;
  if (!doc) {
    throw new Error('Failed to open A4 sandboxed document iframe for printing.');
  }

  doc.open();
  doc.write(htmlContent);
  doc.close();

  iframe.contentWindow?.focus();
  
  // Wait a short bit to ensure rendering is complete, then trigger native print
  setTimeout(() => {
    iframe.contentWindow?.print();
    // Safely remove the frame after system dialog triggers
    setTimeout(() => {
      document.body.removeChild(iframe);
    }, 1000);
  }, 350);
}
