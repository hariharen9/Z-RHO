import { useMemo, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingDown,
  Calendar,
  Activity,
  Zap,
  Sparkles,
  Flame,
  ArrowUpRight,
  AlertTriangle,
  Home,
  Car,
  GraduationCap,
  Briefcase,
  User,
  Coins,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';

// Hooks
import { useProfile } from '@/hooks/useProfile';
import {
  useDashboardStats,
  useUpcomingPayments,
  useDebtHistory,
  useMonthlyOutflow,
} from '@/hooks/useDashboard';
import { useLoans } from '@/hooks/useLoans';
import { useCards } from '@/hooks/useCards';
import { useLoanPayments } from '@/hooks/useLoanPayments';

// Components & Helpers
import { AnimatedNumber } from '@/components/shared/AnimatedNumber';
import { Progress } from '@/components/shared/Progress';
import { formatCurrency, formatCompactCurrency, numberToWordsCompact } from '@/lib/currency';
import { calculateLoanStats, calculatePrepaymentImpact, calculateEMI, calculateTotalInterest } from '@/lib/calculations';

// Recharts
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

export function DashboardPage() {
  const navigate = useNavigate();
  const { data: profile } = useProfile();
  const currency = profile?.default_currency ?? 'INR';

  // Live Queries
  const { data: stats, isLoading: statsLoading } = useDashboardStats(currency);
  const { data: upcoming = [] } = useUpcomingPayments();
  const { data: loans = [], isLoading: loansLoading } = useLoans('active');
  const { data: cards = [], isLoading: cardsLoading } = useCards('active');
  const { data: debtHistory = [], isLoading: historyLoading } = useDebtHistory(currency);
  const { data: outflow = [], isLoading: outflowLoading } = useMonthlyOutflow(currency);

  // Pick top loan by APR for Avalanche tracker
  const rankedLoansByAPR = useMemo(() => {
    return [...loans].sort((a, b) => b.interest_rate - a.interest_rate);
  }, [loans]);

  const topLoan = rankedLoansByAPR[0];
  const { data: topLoanPayments = [] } = useLoanPayments(topLoan?.id);

  // Range Slider state for Avalanche
  const [extraPrepayment, setExtraPrepayment] = useState(currency === 'INR' ? 10000 : 250);

  // Calculate overall debt free progress
  const totals = useMemo(() => {
    const totalPrincipal = loans.reduce((sum, l) => sum + l.principal_amount, 0);
    const outstandingLoans = loans.reduce((sum, l) => sum + l.current_outstanding, 0);
    // Since cards have credit limits, overall paid progress is based on loans
    const progress = totalPrincipal > 0 ? 1 - outstandingLoans / totalPrincipal : 0;
    return {
      outstandingLoans,
      progress,
    };
  }, [loans]);

  // Dynamic calculations for Avalanche Prepayment Impact
  const avalancheSavings = useMemo(() => {
    if (!topLoan) return { monthsSaved: 0, interestSaved: 0 };
    const loanStats = calculateLoanStats(topLoan, topLoanPayments);
    const impact = calculatePrepaymentImpact(
      topLoan.current_outstanding,
      topLoan.interest_rate,
      topLoan.emi_amount,
      extraPrepayment,
      loanStats.emisRemaining
    );
    return {
      monthsSaved: impact.monthsSaved,
      interestSaved: impact.interestSaved,
    };
  }, [topLoan, topLoanPayments, extraPrepayment]);

  // Extract sparkline points from history query
  const sparkPoints = useMemo(() => {
    if (debtHistory.length < 2) return [];
    return debtHistory.map((pt) => pt.totalDebt);
  }, [debtHistory]);

  const totalUpcomingSum = useMemo(() => {
    return upcoming.reduce((sum, p) => sum + p.amount, 0);
  }, [upcoming]);

  const utilizationRate = useMemo(() => {
    if (!stats || stats.totalCreditLimit <= 0) return 0;
    // utilization = outstanding card debt / credit limit
    // In Supabase schema, outstanding is computed from stats
    const creditCardOutstanding = Math.max(0, stats.totalOutstandingDebt - totals.outstandingLoans);
    return creditCardOutstanding / stats.totalCreditLimit;
  }, [stats, totals.outstandingLoans]);

  const cardOutstandingSum = useMemo(() => {
    if (!stats) return 0;
    return Math.max(0, stats.totalOutstandingDebt - totals.outstandingLoans);
  }, [stats, totals.outstandingLoans]);

  if (statsLoading || loansLoading || cardsLoading || historyLoading || outflowLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-44 w-full rounded-3xl bg-surface/50" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 rounded-3xl bg-surface/50" />
          ))}
        </div>
        <div className="grid lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 h-72 rounded-3xl bg-surface/50" />
          <div className="h-72 rounded-3xl bg-surface/50" />
        </div>
      </div>
    );
  }

  const sliderMax = currency === 'INR' ? 50000 : 1000;
  const sliderStep = currency === 'INR' ? 1000 : 50;

  return (
    <div className="space-y-6">

      {/* SECTION 1: HERO & KPI TILES */}
      <div className="grid grid-cols-12 gap-4">

        {/* Total Liability Giant Card with Sparkline */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative col-span-12 overflow-hidden rounded-3xl border border-border card-shine p-7 xl:col-span-8 flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                Total Net Liability · {currency}
              </span>
              <span className="flex items-center gap-1 rounded-full border border-border bg-background/60 px-2 py-0.5 text-[10px] text-success">
                <TrendingDown size={10} /> {(totals.progress * 100).toFixed(1)}% Repaid
              </span>
            </div>

            <div className="mt-4 flex items-end justify-between gap-8">
              <div>
                <AnimatedNumber
                  value={stats?.totalOutstandingDebt ?? 0}
                  currency={currency}
                  className="text-4xl md:text-[56px] font-semibold leading-none tracking-tight text-foreground"
                />
                <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-warning" />
                    Loans {formatCurrency(totals.outstandingLoans, currency)}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-info" />
                    Cards {formatCurrency(cardOutstandingSum, currency)}
                  </span>
                </div>
              </div>

              {/* Sparkline Graph */}
              {sparkPoints.length >= 2 && (
                <Sparkline points={sparkPoints} className="hidden h-24 w-64 md:block text-foreground" />
              )}
            </div>
          </div>

          <div className="mt-6">
            <Progress value={totals.progress} />
          </div>
        </motion.div>

        {/* KPI Grid */}
        <div className="col-span-12 grid grid-cols-2 gap-4 xl:col-span-4">
          <KpiCard
            label="Credit utilization"
            value={`${(utilizationRate * 100).toFixed(1)}%`}
            hint={`of ${formatCompactCurrency(stats?.totalCreditLimit ?? 0, currency)}`}
            accent={utilizationRate > 0.3 ? 'warning' : 'success'}
            Icon={Zap}
          />
          <KpiCard
            label="Active liabilities"
            value={`${loans.length + cards.length}`}
            hint={`${loans.length} loans · ${cards.length} cards`}
            Icon={Activity}
          />
          <KpiCard
            label="Upcoming 30d"
            value={formatCurrency(totalUpcomingSum, currency)}
            hint={`${upcoming.length} due items`}
            Icon={Calendar}
          />
          <KpiCard
            label="Highest APR"
            value={topLoan ? `${topLoan.interest_rate.toFixed(2)}%` : '—'}
            hint={topLoan?.name ?? ''}
            accent="warning"
            Icon={Flame}
          />
        </div>
      </div>

      {/* SECTION 2: LOANS PORTFOLIO & UPCOMING TIMELINE */}
      <div className="grid grid-cols-12 gap-4">

        {/* Active Loan Portfolio Container */}
        <section className="col-span-12 overflow-hidden rounded-3xl border border-border bg-surface xl:col-span-8 flex flex-col justify-between">
          <div>
            <header className="flex items-center justify-between border-b border-border px-6 py-4">
              <div>
                <h2 className="text-sm font-semibold">Active Loan Portfolio</h2>
                <p className="text-[11px] text-muted-foreground">Sorted by outstanding balance</p>
              </div>
              <Link to="/loans" className="text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-0.5">
                View all <ArrowUpRight size={11} />
              </Link>
            </header>

            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[500px]">
                <thead className="text-[10px] uppercase tracking-widest text-muted-foreground border-b border-border">
                  <tr>
                    <th className="px-6 py-3 text-left font-normal">Loan</th>
                    <th className="px-3 py-3 text-right font-normal">Outstanding</th>
                    <th className="px-3 py-3 text-right font-normal">APR</th>
                    <th className="px-3 py-3 text-left font-normal">Progress</th>
                    <th className="px-6 py-3 text-right font-normal">Next EMI</th>
                  </tr>
                </thead>
                <tbody>
                  {[...loans]
                    .sort((a, b) => b.current_outstanding - a.current_outstanding)
                    .map((l) => {
                      const pct = l.principal_amount > 0 ? (l.principal_amount - l.current_outstanding) / l.principal_amount : 0;
                      return (
                        <tr
                          key={l.id}
                          onClick={() => navigate(`/loans/${l.id}`)}
                          className="cursor-pointer border-b border-border/40 transition hover:bg-surface-elevated"
                        >
                          <td className="px-6 py-4">
                            <div className="font-medium text-foreground">{l.name}</div>
                            <div className="text-[11px] text-muted-foreground">
                              {l.lender} · {l.tenure_months}m
                            </div>
                          </td>
                          <td className="px-3 py-4 text-right tabular text-foreground font-medium">
                            {formatCompactCurrency(l.current_outstanding, l.currency)}
                          </td>
                          <td className="px-3 py-4 text-right tabular text-muted-foreground">
                            {l.interest_rate.toFixed(2)}%
                          </td>
                          <td className="px-3 py-4">
                            <div className="flex items-center gap-2">
                              <div className="w-24">
                                <Progress value={pct} height={4} />
                              </div>
                              <span className="text-[11px] tabular text-muted-foreground">
                                {(pct * 100).toFixed(0)}%
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="text-foreground font-semibold">
                              {formatCurrency(l.emi_amount, l.currency)}
                            </div>
                            <div className="text-[10px] text-muted-foreground">
                              Day {l.emi_day}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  {loans.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-xs text-muted-foreground">
                        No active installment loans found. Click "+ New entry" to create one.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Right column: Quick Log Spend & Timeline */}
        <div className="col-span-12 xl:col-span-4 flex flex-col gap-4">
          {/* Chronological Timeline Dues */}
          <section className="rounded-3xl border border-border bg-surface p-6 flex flex-col justify-between flex-1">
            <div>
              <header className="flex items-center justify-between border-b border-border/40 pb-3">
                <h2 className="text-sm font-semibold">Next 30 Days</h2>
                <span className="text-xs text-muted-foreground tabular">
                  {formatCurrency(totalUpcomingSum, currency)} due
                </span>
              </header>

              <div className="mt-4 space-y-3 max-h-[300px] overflow-y-auto pr-1">
                {upcoming.length === 0 && (
                  <div className="rounded-2xl border border-dashed border-border p-8 text-center text-xs text-muted-foreground">
                    No dues found in next 30 days 🎉
                  </div>
                )}
                {upcoming.map((u, i) => {
                  const isOverdue = u.daysRemaining < 0;
                  const urgent = u.daysRemaining <= 3;
                  const dateParsed = u.dueDate ? parseISO(u.dueDate) : new Date();

                  return (
                    <motion.div
                      key={u.id}
                      initial={{ opacity: 0, x: 8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.03 }}
                      onClick={() => {
                        if (u.type === 'loan') navigate(`/loans/${u.linkedId}`);
                        else navigate(`/cards/${u.linkedId}`);
                      }}
                      className="group flex items-center gap-3 rounded-2xl border border-border bg-background p-3 transition hover:border-foreground/30 cursor-pointer"
                    >
                      {/* Calendar Tile */}
                      <div
                        className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl border ${isOverdue || urgent
                          ? 'border-destructive/40 bg-destructive/10 text-destructive'
                          : 'border-border bg-surface text-muted-foreground'
                          }`}
                      >
                        <div className="text-center">
                          <div className="text-[9px] uppercase tracking-widest leading-none">
                            {format(dateParsed, 'MMM')}
                          </div>
                          <div className="text-sm font-semibold tabular leading-none mt-0.5">
                            {format(dateParsed, 'd')}
                          </div>
                        </div>
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="truncate text-xs font-semibold text-foreground group-hover:text-primary transition-colors">
                          {u.name}
                        </div>
                        <div className="text-[10px] text-muted-foreground mt-0.5">
                          {u.type === 'loan' ? 'EMI' : 'Bill'} ·{' '}
                          {isOverdue
                            ? `${Math.abs(u.daysRemaining)}d overdue`
                            : u.daysRemaining === 0
                              ? 'Due today'
                              : `${u.daysRemaining} days left`}
                        </div>
                      </div>

                      <div className="text-xs font-semibold tabular text-foreground">
                        {formatCurrency(u.amount, u.currency)}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* SECTION 3: RECHARTS & AVALANCHE CALCULATOR */}
      <div className="grid grid-cols-12 gap-4">

        {/* Avalanche Interactive Prepayment Slider */}
        <section className="col-span-12 rounded-3xl border border-border bg-surface p-6 xl:col-span-5 flex flex-col justify-between">
          <div>
            <header className="flex items-center justify-between border-b border-border/40 pb-3">
              <div>
                <h2 className="flex items-center gap-2 text-sm font-semibold">
                  <Sparkles size={14} className="text-warning animate-pulse" /> Avalanche Tracker
                </h2>
                <p className="text-[11px] text-muted-foreground">Prepay your highest-interest rate liability first</p>
              </div>
            </header>

            {topLoan ? (
              <div className="mt-4 space-y-4">
                <div className="rounded-2xl border border-border bg-background p-4">
                  <div className="text-[9px] uppercase tracking-widest text-muted-foreground">Target Loan</div>
                  <div className="mt-1 flex items-baseline justify-between">
                    <div className="text-sm font-medium text-foreground">{topLoan.name}</div>
                    <div className="text-sm font-semibold tabular text-warning">{topLoan.interest_rate.toFixed(2)}% APR</div>
                  </div>
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between text-[11px] text-muted-foreground">
                    <span>Monthly Extra Principal</span>
                    <span className="tabular text-foreground font-semibold">
                      {formatCurrency(extraPrepayment, currency)}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={sliderMax}
                    step={sliderStep}
                    value={extraPrepayment}
                    onChange={(e) => setExtraPrepayment(parseInt(e.target.value))}
                    className="w-full accent-foreground cursor-pointer bg-secondary h-1 rounded-full appearance-none outline-none"
                  />
                </div>

                <AnimatePresence mode="wait">
                  <motion.div
                    key={Math.round(avalancheSavings.interestSaved)}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="grid grid-cols-2 gap-3"
                  >
                    <div className="rounded-2xl border border-success/30 bg-success/5 p-4">
                      <div className="text-[9px] uppercase tracking-widest text-success font-semibold">Interest Saved</div>
                      <div className="mt-1 text-xl font-bold tabular text-success">
                        {formatCurrency(avalancheSavings.interestSaved, topLoan.currency)}
                      </div>
                    </div>
                    <div className="rounded-2xl border border-border bg-background p-4">
                      <div className="text-[9px] uppercase tracking-widest text-muted-foreground">Months Shorter</div>
                      <div className="mt-1 text-xl font-bold tabular text-foreground">
                        {avalancheSavings.monthsSaved}
                      </div>
                    </div>
                  </motion.div>
                </AnimatePresence>

                {utilizationRate > 0.3 && (
                  <div className="flex items-center gap-2 rounded-2xl border border-warning/30 bg-warning/5 p-3 text-[10px] text-warning leading-relaxed">
                    <AlertTriangle size={13} className="shrink-0" />
                    Credit utilization is above 30%. Consider allocating cash to statement balances before loans.
                  </div>
                )}
              </div>
            ) : (
              <div className="mt-8 rounded-2xl border border-dashed border-border p-8 text-center text-xs text-muted-foreground">
                No active loans found. Create a loan to enable Avalanche tracking!
              </div>
            )}
          </div>
        </section>

        {/* Graphical Charts Section */}
        <section className="col-span-12 xl:col-span-7 grid md:grid-cols-2 gap-4">

          {/* Chart 1: Debt History */}
          {debtHistory.length > 0 && (
            <div className="rounded-3xl border border-border bg-surface p-5">
              <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">
                Debt history (12m)
              </h3>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={debtHistory}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} opacity={0.3} />
                  <XAxis dataKey="month" tick={{ fill: '#8B8B9E', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#8B8B9E', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#121212',
                      border: '1px solid var(--color-border)',
                      borderRadius: '12px',
                    }}
                    labelStyle={{ color: '#E8E8ED', fontSize: 11, fontWeight: 'bold' }}
                    itemStyle={{ color: '#6366f1', fontSize: 11 }}
                    formatter={(val) => [formatCurrency(Number(val), currency), 'Balance']}
                  />
                  <Line
                    type="monotone"
                    dataKey="totalDebt"
                    stroke="var(--color-foreground)"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Chart 2: Stacked Outflows */}
          {outflow.length > 0 && (
            <div className="rounded-3xl border border-border bg-surface p-5">
              <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">
                Outflow Split (6m)
              </h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={outflow}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} opacity={0.3} />
                  <XAxis dataKey="month" tick={{ fill: '#8B8B9E', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#8B8B9E', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#121212',
                      border: '1px solid var(--color-border)',
                      borderRadius: '12px',
                    }}
                    labelStyle={{ color: '#E8E8ED', fontSize: 11, fontWeight: 'bold' }}
                    itemStyle={{ fontSize: 11 }}
                    formatter={(val) => formatCurrency(Number(val), currency)}
                  />
                  <Legend verticalAlign="top" height={36} iconType="circle" iconSize={6} wrapperStyle={{ fontSize: 10 }} />
                  <Bar dataKey="emiPayments" name="EMI Payments" stackId="a" fill="var(--color-foreground)" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="ccPayments" name="Card Bills" stackId="a" fill="#6366f1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </section>
      </div>

      {/* SECTION 4: INTERACTIVE LOAN CALCULATOR */}
      <div className="grid grid-cols-12 gap-4">
        <DashboardCalculator currency={currency} />
      </div>

    </div>
  );
}

// Sparkline SVG Component
function Sparkline({ points, className }: { points: number[]; className?: string }) {
  if (points.length < 2) return null;
  const max = Math.max(...points);
  const min = Math.min(...points);
  const w = 280,
    h = 96;
  const dx = w / (points.length - 1);
  const norm = (v: number) => h - ((v - min) / (max - min || 1)) * h;
  const d = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${i * dx},${norm(p)}`).join(' ');
  const area = `${d} L${w},${h} L0,${h} Z`;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className={className} preserveAspectRatio="none">
      <defs>
        <linearGradient id="sparkFill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.25" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#sparkFill)" className="text-foreground/40" />
      <path d={d} fill="none" stroke="currentColor" strokeWidth={1.5} className="text-foreground" />
    </svg>
  );
}

// Reusable KPI Card helper
function KpiCard({
  label,
  value,
  hint,
  accent,
  Icon,
}: {
  label: string;
  value: string;
  hint?: string;
  accent?: 'success' | 'warning';
  Icon: typeof Activity;
}) {
  return (
    <div className="rounded-3xl border border-border bg-surface p-5 flex flex-col justify-between min-h-[110px]">
      <div className="flex items-center justify-between">
        <span className="text-[9px] uppercase tracking-widest text-muted-foreground">{label}</span>
        <Icon
          size={13}
          strokeWidth={1.75}
          className={
            accent === 'warning'
              ? 'text-warning'
              : accent === 'success'
                ? 'text-success'
                : 'text-muted-foreground'
          }
        />
      </div>
      <div className="mt-3">
        <div
          className={`text-xl font-bold tabular text-foreground ${accent === 'warning' ? 'text-warning' : ''
            }`}
        >
          {value}
        </div>
        {hint && <div className="mt-0.5 text-[10px] text-muted-foreground truncate">{hint}</div>}
      </div>
    </div>
  );
}

const calculatorCategoryConfig: Record<
  string,
  {
    icon: any;
    color: string;
    bgColor: string;
    glowColor: string;
    label: string;
    typicalRate: string;
  }
> = {
  home: {
    icon: Home,
    color: 'text-sky-400',
    bgColor: 'bg-sky-500/10 border-sky-500/20',
    glowColor: 'rgba(56, 189, 248, 0.15)',
    label: 'Home Loan',
    typicalRate: '~7%–10% (house acts as collateral)',
  },
  personal: {
    icon: User,
    color: 'text-pink-400',
    bgColor: 'bg-pink-500/10 border-pink-500/20',
    glowColor: 'rgba(244, 63, 94, 0.15)',
    label: 'Personal Loan',
    typicalRate: '~10%–30% (unsecured, higher risk)',
  },
  car: {
    icon: Car,
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/10 border-amber-500/20',
    glowColor: 'rgba(251, 191, 36, 0.15)',
    label: 'Car Loan',
    typicalRate: '~7.5%–11% (vehicle as collateral)',
  },
  education: {
    icon: GraduationCap,
    color: 'text-violet-400',
    bgColor: 'bg-violet-500/10 border-violet-500/20',
    glowColor: 'rgba(167, 139, 250, 0.15)',
    label: 'Education Loan',
    typicalRate: '~7%–13% (subsidized/course dependent)',
  },
  business: {
    icon: Briefcase,
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/10 border-emerald-500/20',
    glowColor: 'rgba(52, 211, 153, 0.15)',
    label: 'Business Loan',
    typicalRate: '~10%–25% (depends on history/collateral)',
  },
  other: {
    icon: Coins,
    color: 'text-indigo-400',
    bgColor: 'bg-indigo-500/10 border-indigo-500/20',
    glowColor: 'rgba(129, 140, 248, 0.15)',
    label: 'Other Loan',
    typicalRate: '~8%–36%+ (varies widely)',
  },
};

function DashboardCalculator({ currency }: { currency: string }) {
  const [calcPrincipal, setCalcPrincipal] = useState<number>(currency === 'INR' ? 1000000 : 10000);
  const [calcRate, setCalcRate] = useState<number>(8.5);
  const [calcTenure, setCalcTenure] = useState<number>(180);
  const [calcTenureUnit, setCalcTenureUnit] = useState<'months' | 'years'>('months');
  const [calcCategory, setCalcCategory] = useState<string>('home');

  const calculatedEMI = useMemo(() => {
    return calcPrincipal > 0 && calcRate >= 0 && calcTenure > 0
      ? calculateEMI(calcPrincipal, calcRate, calcTenure)
      : 0;
  }, [calcPrincipal, calcRate, calcTenure]);

  const totalInterest = useMemo(() => {
    return calculatedEMI > 0
      ? calculateTotalInterest(calcPrincipal, calculatedEMI, calcTenure)
      : 0;
  }, [calcPrincipal, calculatedEMI, calcTenure]);

  const totalPayable = calcPrincipal + totalInterest;
  const principalRatio = totalPayable > 0 ? calcPrincipal / totalPayable : 1;
  const interestRatio = 1 - principalRatio;

  const inputClass =
    'w-full px-4 py-2.5 bg-background/50 border border-border/80 rounded-xl text-foreground focus:border-foreground/45 transition-all duration-300 outline-none backdrop-blur-md text-xs';

  return (
    <section className="rounded-3xl border border-border bg-surface p-6 col-span-12 space-y-6">
      <header className="flex items-center justify-between border-b border-border/40 pb-3">
        <div>
          <h2 className="flex items-center gap-2 text-sm font-semibold">
            <Sparkles size={14} className="text-warning" /> Loan Calculator
          </h2>
          <p className="text-[11px] text-muted-foreground">Simulate loan options in real-time</p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left Column: Slider & Input Controls */}
        <div className="lg:col-span-7 space-y-5">
          {/* Category Dropdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-1.5">
                Category
              </label>
              <select
                value={calcCategory}
                onChange={(e) => setCalcCategory(e.target.value)}
                className="w-full px-3 py-2 bg-background/50 border border-border/80 rounded-xl text-foreground focus:border-foreground/45 transition-all duration-300 outline-none backdrop-blur-md text-xs font-medium cursor-pointer"
              >
                <option value="home">Home Loan</option>
                <option value="personal">Personal Loan</option>
                <option value="car">Car Loan</option>
                <option value="education">Education Loan</option>
                <option value="business">Business Loan</option>
                <option value="other">Other</option>
              </select>
            </div>

            {/* Rate context hint */}
            <div className="flex flex-col justify-end">
              <span className="text-[9px] uppercase tracking-widest text-muted-foreground mb-1">
                Category Guidelines
              </span>
              <span className="text-[10px] text-foreground font-medium bg-background/40 py-2 px-3 border border-border/30 rounded-xl truncate">
                {calculatorCategoryConfig[calcCategory]?.typicalRate}
              </span>
            </div>
          </div>

          {/* Principal Amount Input */}
          <div>
            <label className="block text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-1.5">
              Principal Amount ({currency})
            </label>
            <input
              type="number"
              value={calcPrincipal || ''}
              onChange={(e) => setCalcPrincipal(parseFloat(e.target.value) || 0)}
              className={inputClass}
              placeholder="e.g. 1000000"
            />
            {calcPrincipal >= 1000 && (
              <p className="text-[10px] text-muted-foreground font-medium mt-1.5 px-1 tracking-wide">
                {numberToWordsCompact(calcPrincipal, currency)}
              </p>
            )}
          </div>

          {/* Interest Rate & Tenure */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-1.5">
                Interest Rate (% p.a.)
              </label>
              <input
                type="number"
                step="0.01"
                value={calcRate || ''}
                onChange={(e) => setCalcRate(parseFloat(e.target.value) || 0)}
                className={inputClass}
                placeholder="e.g. 8.5"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">
                  Tenure
                </label>
                <div className="flex bg-background/80 p-0.5 rounded-lg border border-border/50 text-[9px] font-bold uppercase tracking-wider">
                  <button
                    type="button"
                    onClick={() => setCalcTenureUnit('months')}
                    className={`px-2 py-0.5 rounded-md transition-all duration-200 ${calcTenureUnit === 'months'
                      ? 'bg-surface text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                      }`}
                  >
                    Months
                  </button>
                  <button
                    type="button"
                    onClick={() => setCalcTenureUnit('years')}
                    className={`px-2 py-0.5 rounded-md transition-all duration-200 ${calcTenureUnit === 'years'
                      ? 'bg-surface text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                      }`}
                  >
                    Years
                  </button>
                </div>
              </div>
              <input
                type="number"
                step="any"
                value={
                  calcTenure > 0
                    ? calcTenureUnit === 'years'
                      ? calcTenure % 12 === 0
                        ? calcTenure / 12
                        : parseFloat((calcTenure / 12).toFixed(2))
                      : calcTenure
                    : ''
                }
                onChange={(e) => {
                  const val = parseFloat(e.target.value) || 0;
                  setCalcTenure(
                    calcTenureUnit === 'years'
                      ? Math.round(val * 12)
                      : Math.round(val)
                  );
                }}
                className={inputClass}
                placeholder={calcTenureUnit === 'years' ? 'e.g. 5' : 'e.g. 24'}
              />
              {calcTenure > 0 && (
                <p className="text-[10px] text-muted-foreground font-medium mt-1.5 px-1 tracking-wide">
                  {calcTenureUnit === 'years'
                    ? `Equivalent to ${calcTenure} months`
                    : `Equivalent to ${calcTenure % 12 === 0
                      ? `${calcTenure / 12} years`
                      : `${parseFloat((calcTenure / 12).toFixed(2))} years`
                    }`}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Premium Metric summary */}
        <div className="lg:col-span-5 flex flex-col items-center">
          {/* DYNAMIC METRIC SUMMARY HERO CARD */}
          <div className="relative overflow-hidden rounded-3xl border border-border bg-background p-6 w-full space-y-6 flex-1 flex flex-col justify-between">
            {/* Glow backdrop reflections */}
            <div
              className="pointer-events-none absolute inset-x-0 top-0 h-44 opacity-25 transition-all duration-500"
              style={{
                background: `radial-gradient(80% 60% at 50% 0%, ${calculatorCategoryConfig[calcCategory]?.glowColor || 'rgba(255, 255, 255, 0.15)'
                  } 5%, transparent 70%)`,
              }}
            />

            {/* Subtle background watermark icon */}
            <div className="absolute right-[-20px] bottom-[-20px] pointer-events-none opacity-[0.03] text-foreground select-none z-0">
              <AnimatePresence mode="wait">
                <motion.div
                  key={calcCategory}
                  initial={{ opacity: 0, scale: 0.6, rotate: 30 }}
                  animate={{ opacity: 1, scale: 1, rotate: 12 }}
                  exit={{ opacity: 0, scale: 0.6, rotate: 30 }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                >
                  {(() => {
                    const IconComponent = calculatorCategoryConfig[calcCategory]?.icon || Coins;
                    return <IconComponent className="w-48 h-48" strokeWidth={1} />;
                  })()}
                </motion.div>
              </AnimatePresence>
            </div>

            <div className="flex justify-between items-start relative z-10">
              <div className="space-y-1">
                <div className="text-[9px] uppercase tracking-widest text-muted-foreground font-semibold">Estimated Monthly EMI</div>
                <div className="mt-1 text-2xl font-bold tabular text-foreground">
                  {formatCurrency(calculatedEMI, currency)}
                </div>
                <div className="mt-1 text-[10px] text-muted-foreground">
                  {calculatorCategoryConfig[calcCategory]?.label} Sandbox Simulation
                </div>
              </div>

              {/* Dynamic Category Icon */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={calcCategory}
                  initial={{ opacity: 0, scale: 0.8, rotate: -15 }}
                  animate={{ opacity: 1, scale: 1, rotate: 0 }}
                  exit={{ opacity: 0, scale: 0.8, rotate: 15 }}
                  transition={{ duration: 0.35, ease: 'easeOut' }}
                  className={`flex items-center justify-center p-2.5 rounded-xl border ${calculatorCategoryConfig[calcCategory]?.bgColor || 'bg-border/10 border-border/20'
                    } backdrop-blur-md shadow-inner`}
                >
                  {(() => {
                    const IconComponent = calculatorCategoryConfig[calcCategory]?.icon || Coins;
                    return (
                      <IconComponent
                        className={`w-5.5 h-5.5 ${calculatorCategoryConfig[calcCategory]?.color || 'text-foreground'
                          }`}
                        strokeWidth={1.8}
                      />
                    );
                  })()}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Cost split progress bar */}
            <div className="relative z-10 space-y-2">
              <div className="flex justify-between text-[10px] text-muted-foreground font-semibold uppercase tracking-widest">
                <span>Interest split ratio</span>
                <span>{calculatedEMI > 0 ? `${(interestRatio * 100).toFixed(0)}%` : '0%'}</span>
              </div>

              <div className="h-2 w-full overflow-hidden rounded-full bg-secondary flex">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${principalRatio * 100}%` }}
                  transition={{ type: 'spring', stiffness: 80, damping: 18 }}
                  className="bg-success h-full"
                />
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${interestRatio * 100}%` }}
                  transition={{ type: 'spring', stiffness: 80, damping: 18, delay: 0.05 }}
                  className="bg-warning h-full"
                />
              </div>
            </div>

            {/* Split Metrics */}
            <div className="relative z-10 grid grid-cols-2 gap-3 text-xs">
              <div className="rounded-2xl border border-border bg-surface p-3 flex flex-col justify-between">
                <div className="flex items-center gap-1.5 text-[9px] uppercase tracking-widest text-success font-semibold">
                  <span className="h-1.5 w-1.5 rounded-full bg-success" /> Principal
                </div>
                <div className="mt-2 font-bold text-foreground text-xs tabular">
                  {formatCurrency(calcPrincipal, currency)}
                </div>
              </div>

              <div className="rounded-2xl border border-border bg-surface p-3 flex flex-col justify-between">
                <div className="flex items-center gap-1.5 text-[9px] uppercase tracking-widest text-warning font-semibold">
                  <span className="h-1.5 w-1.5 rounded-full bg-warning" /> Total Interest
                </div>
                <div className="mt-2 font-bold text-foreground text-xs tabular">
                  {formatCurrency(totalInterest, currency)}
                </div>
              </div>
            </div>

            {/* Lifetime Cost Row */}
            <div className="relative z-10 flex justify-between items-center bg-surface/50 border border-border/40 p-3 rounded-2xl text-[10px] uppercase font-bold tracking-wider">
              <span className="text-muted-foreground">Total Lifetime Outflow</span>
              <span className="text-foreground text-xs tabular">{formatCurrency(totalPayable, currency)}</span>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
}
