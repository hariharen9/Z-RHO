// ============================================================
// ZRHO — Dashboard Page
// ============================================================

import { SummaryCards } from './SummaryCards';
import { UpcomingPayments } from './UpcomingPayments';
import { LoansOverview, CardsOverview } from './Overviews';
import { DebtReductionChart, MonthlyOutflowChart } from './Charts';

export function DashboardPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      {/* Summary Stats */}
      <SummaryCards />

      {/* Upcoming Payments */}
      <section>
        <h2 className="text-lg font-semibold mb-3">Upcoming Payments</h2>
        <UpcomingPayments />
      </section>

      {/* Loans + Cards Overviews */}
      <div className="grid md:grid-cols-2 gap-6">
        <LoansOverview />
        <CardsOverview />
      </div>

      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-6">
        <DebtReductionChart />
        <MonthlyOutflowChart />
      </div>
    </div>
  );
}
