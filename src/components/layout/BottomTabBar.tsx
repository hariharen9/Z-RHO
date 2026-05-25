// ============================================================
// ZRHO — Layout: Bottom Tab Bar (Mobile)
// ============================================================

import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Landmark, CreditCard, Settings } from 'lucide-react';

const tabs = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/loans', label: 'Loans', icon: Landmark },
  { to: '/cards', label: 'Cards', icon: CreditCard },
  { to: '/settings', label: 'Settings', icon: Settings },
];

export function BottomTabBar() {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[var(--color-zrho-surface)] border-t border-[var(--color-zrho-border)] safe-area-pb">
      <div className="flex justify-around">
        {tabs.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 py-2 px-3 min-w-[64px] text-xs transition-colors
              ${isActive
                ? 'text-[var(--color-zrho-accent)]'
                : 'text-[var(--color-zrho-text-muted)]'
              }`
            }
          >
            <tab.icon size={20} />
            <span>{tab.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
