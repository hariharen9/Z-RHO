// ============================================================
// ZRHO — Layout: Sidebar (Desktop)
// ============================================================

import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Landmark, CreditCard, Settings, ChevronLeft, ChevronRight } from 'lucide-react';
import { useUIStore } from '@/store/uiStore';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/loans', label: 'Loans', icon: Landmark },
  { to: '/cards', label: 'Cards', icon: CreditCard },
  { to: '/settings', label: 'Settings', icon: Settings },
];

export function Sidebar() {
  const { sidebarOpen, toggleSidebar } = useUIStore();

  return (
    <aside
      className={`hidden md:flex flex-col h-full bg-[var(--color-zrho-surface)] border-r border-[var(--color-zrho-border)] transition-all duration-300
        ${sidebarOpen ? 'w-60' : 'w-16'}`}
    >
      {/* Logo */}
      <div className="flex items-center justify-between p-4 border-b border-[var(--color-zrho-border)]">
        {sidebarOpen && (
          <span className="text-xl font-bold tracking-tight">
            Z-<span className="text-[var(--color-zrho-accent)]">RHO</span>
          </span>
        )}
        <button
          onClick={toggleSidebar}
          className="p-1 rounded-lg hover:bg-[var(--color-zrho-surface-2)] transition-colors"
          aria-label="Toggle sidebar"
        >
          {sidebarOpen ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 mx-2 rounded-lg transition-colors text-sm
              ${isActive
                ? 'bg-[var(--color-zrho-accent)]/10 text-[var(--color-zrho-accent)]'
                : 'text-[var(--color-zrho-text-muted)] hover:bg-[var(--color-zrho-surface-2)] hover:text-[var(--color-zrho-text)]'
              }`
            }
          >
            <item.icon size={20} />
            {sidebarOpen && <span>{item.label}</span>}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
