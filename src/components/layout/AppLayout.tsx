// ============================================================
// ZRHO — Layout: AppLayout (Authenticated)
// ============================================================

import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { BottomTabBar } from './BottomTabBar';

export function AppLayout() {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto pb-20 md:pb-0 flex flex-col justify-between">
        <div className="max-w-6xl w-full mx-auto p-4 md:p-6 flex-1">
          <Outlet />
        </div>
        <footer className="w-full py-6 text-center text-xs text-slate-500 border-t border-slate-200/10 dark:border-slate-800/50 mt-auto">
          Built by{' '}
          <a
            href="https://hariharen.site"
            target="_blank"
            rel="noopener noreferrer"
            className="text-indigo-500 hover:text-indigo-400 font-medium transition-colors"
          >
            Hariharen
          </a>
        </footer>
      </main>
      <BottomTabBar />
    </div>
  );
}
