import { useState, useRef, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { BottomTabBar } from './BottomTabBar';
import { Bell, Plus, Search, CalendarClock } from 'lucide-react';
import { useProfile } from '@/hooks/useProfile';
import { useAuthStore } from '@/store/authStore';
import { AddCCTransactionModal } from '@/features/cards/AddCCTransactionModal';
import { useUpcomingPayments } from '@/hooks/useDashboard';
import { formatCurrency } from '@/lib/currency';
import { format, parseISO } from 'date-fns';
import { AnimatePresence, motion } from 'framer-motion';

function NotificationBell({ urgentPayments, navigate }: { urgentPayments: any[], navigate: any }) {
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setNotifOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={notifRef}>
      <button
        onClick={() => setNotifOpen(!notifOpen)}
        className="relative rounded-full border border-border bg-surface p-2 transition hover:bg-surface-elevated active:scale-95 text-muted-foreground hover:text-foreground"
      >
        <Bell size={14} strokeWidth={1.75} />
        {urgentPayments.length > 0 && (
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-surface animate-pulse" />
        )}
      </button>

      <AnimatePresence>
        {notifOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 top-full mt-3 w-80 max-w-[calc(100vw-32px)] rounded-2xl border border-border bg-surface/95 p-4 shadow-2xl backdrop-blur-xl z-[100] origin-top-right"
          >
            <div className="flex items-center justify-between mb-4 px-1">
              <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Notifications</h3>
              <span className="text-[10px] font-medium bg-background px-2 py-0.5 rounded-full text-foreground border border-border">{urgentPayments.length} upcoming</span>
            </div>

            <div className="space-y-2 max-h-80 overflow-y-auto pr-1 custom-scrollbar">
              {urgentPayments.length === 0 ? (
                <div className="py-6 text-center text-muted-foreground flex flex-col items-center gap-2">
                  <Bell size={24} className="opacity-20" />
                  <span className="text-xs">No urgent payments due</span>
                </div>
              ) : (
                urgentPayments.map((payment: any) => (
                  <div
                    key={payment.id}
                    onClick={() => {
                      setNotifOpen(false);
                      navigate(`/${payment.type}s/${payment.linkedId}`);
                    }}
                    className="group flex flex-col gap-1.5 rounded-xl border border-transparent bg-background/50 p-3 transition hover:border-border hover:bg-surface-elevated cursor-pointer"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-foreground truncate max-w-[160px]">{payment.name}</span>
                      <span className="text-sm font-bold text-foreground">
                        {formatCurrency(payment.amount, payment.currency)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <CalendarClock size={12} />
                        {format(parseISO(payment.dueDate), 'MMM do')}
                      </span>
                      <span className={`font-semibold ${payment.status === 'danger' ? 'text-red-400' : 'text-yellow-400'}`}>
                        {payment.daysRemaining === 0 ? 'Due Today' : `Due in ${payment.daysRemaining} days`}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function AppLayout() {
  const location = useLocation();
  const currentPath = location.pathname;
  const navigate = useNavigate();

  const { data: profile } = useProfile();
  const { user } = useAuthStore();
  const currency = profile?.default_currency ?? 'INR';
  const avatarUrl = profile?.avatar_url || user?.user_metadata?.avatar_url;

  const [newTxOpen, setNewTxOpen] = useState(false);

  const { data: upcoming = [] } = useUpcomingPayments();
  const urgentPayments = upcoming.filter((p) => p.daysRemaining <= 7);

  // Determine section label for breadcrumbs
  const getBreadcrumbs = () => {
    if (currentPath.startsWith('/dashboard')) return { section: 'Dashboard', sub: 'Live' };
    if (currentPath.startsWith('/loans')) return { section: 'Loans', sub: 'All accounts' };
    if (currentPath.startsWith('/cards')) return { section: 'Cards', sub: 'All accounts' };
    if (currentPath.startsWith('/settings')) return { section: 'Settings', sub: 'Preferences' };
    return { section: 'Engine', sub: 'Active' };
  };

  const breadcrumbs = getBreadcrumbs();

  return (
    <div className="grid min-h-[100dvh] w-full grid-cols-1 lg:grid-cols-[260px_minmax(0,1fr)] bg-background text-foreground overflow-hidden">
      {/* Sidebar - Desktop */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex flex-col h-[100dvh] overflow-y-auto pb-28 lg:pb-0 relative">
        
        {/* Desktop Top Header Bar */}
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-border bg-background/70 px-8 py-4 backdrop-blur-xl max-lg:hidden">
          {/* Breadcrumbs */}
          <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground">
            <span>{breadcrumbs.section}</span>
            <span>·</span>
            <span className="text-foreground">{breadcrumbs.sub}</span>
          </div>

          {/* Right side controls */}
          <div className="flex items-center gap-2">
            <NotificationBell urgentPayments={urgentPayments} navigate={navigate} />

            {/* New Entry - opens CC Transaction Modal */}
            <button
              onClick={() => setNewTxOpen(true)}
              className="flex items-center gap-1.5 rounded-full bg-foreground px-4 py-2 text-xs font-semibold text-background transition hover:opacity-90 active:scale-95"
            >
              <Plus size={12} /> New entry
            </button>

            {/* User Profile Avatar with custom gradient */}
            <Link
              to="/settings"
              className="ml-2 h-8 w-8 rounded-full border border-border bg-gradient-to-br from-secondary to-background transition hover:scale-105 active:scale-95 flex items-center justify-center text-xs font-medium uppercase overflow-hidden"
              title="Settings"
            >
              {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                profile?.full_name ? profile.full_name.charAt(0) : 'U'
              )}
            </Link>
          </div>
        </header>

        {/* Mobile Header Bar */}
        <header className="relative z-50 flex items-center justify-between px-5 pb-4 pt-6 lg:hidden shrink-0 border-b border-border/40 bg-background/50 backdrop-blur-xl">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 overflow-hidden rounded-xl border border-border bg-surface">
              <img src="/zrho.png" alt="Z-RHO Logo" className="h-full w-full object-cover" />
            </div>
            <div>
              <div className="text-sm font-semibold tracking-[0.2em] text-foreground">Z-RHO</div>
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Liability engine</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <NotificationBell urgentPayments={urgentPayments} navigate={navigate} />
            <Link
              to="/settings"
              className="h-8 w-8 rounded-full border border-border bg-gradient-to-br from-secondary to-background transition hover:scale-105 active:scale-95 flex items-center justify-center text-xs font-medium uppercase overflow-hidden"
              title="Settings"
            >
              {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                profile?.full_name ? profile.full_name.charAt(0) : 'U'
              )}
            </Link>
          </div>
        </header>

        {/* Page Inner Container */}
        <main className="flex-1 px-4 py-6 md:px-8 md:py-8 w-full max-w-6xl mx-auto flex flex-col">
          <div className="flex-1">
            <Outlet />
          </div>

          {/* Premium minimalistic footer */}
          <footer className="w-full py-8 text-center text-[10px] uppercase tracking-widest text-muted-foreground border-t border-border/20 mt-12 max-lg:hidden">
            Engineered by{' '}
            <a
              href="https://hariharen.site"
              target="_blank"
              rel="noopener noreferrer"
              className="text-foreground hover:text-foreground/80 transition-colors font-semibold"
            >
              Hariharen
            </a>
          </footer>
        </main>
      </div>

      {/* Floating Bottom Tab Bar - Mobile */}
      <BottomTabBar />

      {/* CC Transaction Modal */}
      <AddCCTransactionModal isOpen={newTxOpen} onClose={() => setNewTxOpen(false)} />
    </div>
  );
}
