// ============================================================
// ZRHO — Dashboard: Charts (Debt Reduction + Monthly Outflow)
// ============================================================

import { useDebtHistory, useMonthlyOutflow } from '@/hooks/useDashboard';
import { Card } from '@/components/ui/Card';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';

export function DebtReductionChart() {
  const { data = [], isLoading } = useDebtHistory();

  if (isLoading) return <Card className="animate-pulse h-64" />;
  if (data.length === 0) return null;

  return (
    <Card>
      <h3 className="text-sm font-semibold mb-4">Debt Reduction (12 months)</h3>
      <ResponsiveContainer width="100%" height={250}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#2E2E3F" />
          <XAxis dataKey="month" tick={{ fill: '#8B8B9E', fontSize: 12 }} />
          <YAxis tick={{ fill: '#8B8B9E', fontSize: 12 }} />
          <Tooltip
            contentStyle={{ backgroundColor: '#1A1A24', border: '1px solid #2E2E3F', borderRadius: '8px' }}
            labelStyle={{ color: '#E8E8ED' }}
          />
          <Line type="monotone" dataKey="totalDebt" stroke="#6366f1" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </Card>
  );
}

export function MonthlyOutflowChart() {
  const { data = [], isLoading } = useMonthlyOutflow();

  if (isLoading) return <Card className="animate-pulse h-64" />;
  if (data.length === 0) return null;

  return (
    <Card>
      <h3 className="text-sm font-semibold mb-4">Monthly Outflow (6 months)</h3>
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#2E2E3F" />
          <XAxis dataKey="month" tick={{ fill: '#8B8B9E', fontSize: 12 }} />
          <YAxis tick={{ fill: '#8B8B9E', fontSize: 12 }} />
          <Tooltip
            contentStyle={{ backgroundColor: '#1A1A24', border: '1px solid #2E2E3F', borderRadius: '8px' }}
            labelStyle={{ color: '#E8E8ED' }}
          />
          <Legend />
          <Bar dataKey="emiPayments" name="EMI" stackId="a" fill="#6366f1" radius={[0, 0, 0, 0]} />
          <Bar dataKey="ccPayments" name="CC Bills" stackId="a" fill="#a855f7" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
}
