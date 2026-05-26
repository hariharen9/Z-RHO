import { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { BottomTabBar } from './BottomTabBar';
import { Bell, Plus, Search } from 'lucide-react';
import { useProfile } from '@/hooks/useProfile';
import { AddCCTransactionModal } from '@/features/cards/AddCCTransactionModal';

export function AppLayout() {
  const location = useLocation();
  const currentPath = location.pathname;

  const { data: profile } = useProfile();
  const currency = profile?.default_currency ?? 'INR';

  const [newTxOpen, setNewTxOpen] = useState(false);

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
            {/* Search Input Box */}
            <div className="flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1.5 text-xs text-muted-foreground transition hover:border-foreground/20">
              <Search size={12} />
              <input
                placeholder="Search liabilities, plans…"
                className="w-48 bg-transparent outline-none placeholder:text-muted-foreground/60 focus:w-60 transition-all duration-300"
              />
              <kbd className="rounded border border-border bg-background px-1.5 py-0.5 text-[10px] tabular">⌘K</kbd>
            </div>

            {/* Notification Alert Button */}
            <button className="rounded-full border border-border bg-surface p-2 transition hover:bg-surface-elevated active:scale-95 text-muted-foreground hover:text-foreground">
              <Bell size={14} strokeWidth={1.75} />
            </button>

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
              className="ml-2 h-8 w-8 rounded-full border border-border bg-gradient-to-br from-secondary to-background transition hover:scale-105 active:scale-95 flex items-center justify-center text-xs font-medium uppercase"
              title="Settings"
            >
              {profile?.full_name ? profile.full_name.charAt(0) : 'U'}
            </Link>
          </div>
        </header>

        {/* Mobile Header Bar */}
        <header className="flex items-center justify-between px-5 pb-4 pt-6 lg:hidden shrink-0 border-b border-border/40 bg-background/50 backdrop-blur-xl">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 overflow-hidden rounded-xl border border-border bg-surface">
              <img src="/zrho.png" alt="Z-RHO Logo" className="h-full w-full object-cover" />
            </div>
            <div>
              <div className="text-sm font-semibold tracking-[0.2em] text-foreground">Z-RHO</div>
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Liability engine</div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Base currency</div>
            <div className="text-xs font-semibold text-foreground">{currency}</div>
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
