import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LayoutDashboard, Landmark, CreditCard, Settings } from 'lucide-react';

const tabs = [
  { to: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  { to: '/loans', label: 'Loans', icon: Landmark },
  { to: '/cards', label: 'Cards', icon: CreditCard },
  { to: '/settings', label: 'Settings', icon: Settings },
];

export function BottomTabBar() {
  const location = useLocation();
  const currentPath = location.pathname;

  return (
    <nav
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40 pb-[max(0.5rem,env(safe-area-inset-bottom))]"
      style={{ background: 'linear-gradient(180deg, transparent, #000 30%)' }}
    >
      <div className="mx-4 flex items-center justify-around rounded-full border border-border/80 bg-surface/90 px-2 py-2 backdrop-blur-xl max-w-lg md:mx-auto">
        {tabs.map(({ to, label, icon: Icon }) => {
          const isActive = currentPath.startsWith(to);

          return (
            <Link
              key={to}
              to={to}
              className={`relative flex flex-1 flex-col items-center gap-0.5 rounded-full px-2 py-2 transition-all active:scale-95 ${
                isActive ? 'text-foreground font-medium' : 'text-muted-foreground'
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="nav-pill"
                  className="absolute inset-0 rounded-full bg-surface-elevated border border-border/40"
                  transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                />
              )}
              
              <Icon size={18} strokeWidth={1.75} className="relative z-10" />
              <span className="relative z-10 text-[9px] font-medium tracking-wide">
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
