import { useLocation, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LayoutDashboard, Landmark, CreditCard, Settings } from 'lucide-react';
import { useLoans } from '@/hooks/useLoans';
import { useCards } from '@/hooks/useCards';
import { useDashboardStats } from '@/hooks/useDashboard';
import { useProfile } from '@/hooks/useProfile';
import { formatCompactCurrency } from '@/lib/currency';

export function Sidebar() {
  const location = useLocation();
  const currentPath = location.pathname;

  // Retrieve user currency and stats
  const { data: profile } = useProfile();
  const currency = profile?.default_currency ?? 'INR';
  const { data: stats } = useDashboardStats(currency);

  // Retrieve counts for active items
  const { data: loans = [] } = useLoans('active');
  const { data: cards = [] } = useCards('active');

  const navItems = [
    { to: '/dashboard', label: 'Overview', icon: LayoutDashboard },
    { to: '/loans', label: 'Loans', icon: Landmark, badge: loans.length },
    { to: '/cards', label: 'Cards', icon: CreditCard, badge: cards.length },
    { to: '/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="sticky top-0 z-30 flex h-[100dvh] w-64 flex-col border-r border-border bg-surface/40 backdrop-blur-xl max-lg:hidden">
      {/* Brand Logo Header */}
      <div className="flex items-center gap-3 px-6 pt-7">
        <div className="h-9 w-9 overflow-hidden rounded-xl border border-border bg-background">
          <img src="/zrho.png" alt="Z-RHO Logo" className="h-full w-full object-cover" />
        </div>
        <div className="relative group cursor-default">
          <div className="text-sm font-semibold tracking-[0.22em] text-foreground">Z-RHO</div>
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Know your money</div>
          {/* Name tooltip */}
          <div className="pointer-events-none absolute left-0 top-full mt-2 w-56 rounded-xl border border-border bg-surface shadow-2xl p-3 text-[10px] leading-relaxed text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-50">
            <span className="text-foreground font-bold tracking-widest text-[11px]">Z-RHO</span> is a word play on
            {" "}<span className="text-foreground font-semibold">ZERO</span> — ground-zero awareness of your finances.
            <div className="mt-1.5 pt-1.5 border-t border-border/60">
              <span className="text-foreground font-semibold">ρ (Rho)</span> is the Greek symbol for
              {" "}density &amp; correlation — used in finance to measure risk relationships.
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="mt-10 space-y-1 px-3 flex-1">
        {navItems.map(({ to, label, icon: Icon, badge }) => {
          const active = currentPath.startsWith(to);

          return (
            <Link
              key={to}
              to={to}
              className={`group relative flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-sm transition-colors duration-200 ${
                active ? 'text-foreground font-medium' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {active && (
                <motion.div
                  layoutId="side-pill"
                  className="absolute inset-0 rounded-2xl bg-surface-elevated border border-border"
                  transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                />
              )}
              
              <Icon size={16} strokeWidth={1.75} className="relative z-10" />
              <span className="relative z-10 flex-1 text-left">{label}</span>
              
              {badge !== undefined && badge > 0 && (
                <span className="relative z-10 rounded-full bg-secondary px-2 py-0.5 text-[10px] tabular text-muted-foreground">
                  {badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Net Liability Bottom Card */}
      <div className="mt-auto m-4 rounded-2xl border border-border bg-background p-4">
        <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Net liability</div>
        <div className="mt-1 text-xl font-semibold tabular text-foreground">
          {stats ? formatCompactCurrency(stats.totalOutstandingDebt, currency) : '—'}
        </div>
        <div className="mt-3 h-px bg-border" />
        <div className="mt-3 flex items-center justify-between text-[11px] text-muted-foreground">
          <span>Base currency</span>
          <span className="tabular text-foreground">{currency}</span>
        </div>
      </div>
    </aside>
  );
}
