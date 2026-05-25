// ============================================================
// ZRHO — Dashboard: Summary Cards
// ============================================================

import { useDashboardStats } from '@/hooks/useDashboard';
import { useProfile } from '@/hooks/useProfile';
import { Card } from '@/components/ui/Card';
import { AmountDisplay } from '@/components/shared/AmountDisplay';
import { TrendingDown, CalendarCheck, CreditCard, Wallet } from 'lucide-react';

export function SummaryCards() {
  const { data: profile } = useProfile();
  const currency = profile?.default_currency ?? 'INR';
  const { data: stats, isLoading } = useDashboardStats(currency);

  if (isLoading || !stats) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="animate-pulse h-24" />
        ))}
      </div>
    );
  }

  const cards = [
    { label: 'Total Outstanding', value: stats.totalOutstandingDebt, icon: TrendingDown, color: 'text-red-400' },
    { label: "This Month's Obligations", value: stats.thisMonthObligations, icon: CalendarCheck, color: 'text-amber-400' },
    { label: 'Total Credit Limit', value: stats.totalCreditLimit, icon: CreditCard, color: 'text-blue-400' },
    { label: 'Available Credit', value: stats.totalAvailableCredit, icon: Wallet, color: 'text-green-400' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {cards.map((item) => (
        <Card key={item.label}>
          <div className="flex items-start justify-between mb-2">
            <p className="text-xs text-[var(--color-zrho-text-muted)]">{item.label}</p>
            <item.icon size={16} className={item.color} />
          </div>
          <AmountDisplay amount={item.value} currency={currency} size="lg" />
        </Card>
      ))}
    </div>
  );
}
