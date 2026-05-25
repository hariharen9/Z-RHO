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
      <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
        <div className="max-w-6xl mx-auto p-4 md:p-6">
          <Outlet />
        </div>
      </main>
      <BottomTabBar />
    </div>
  );
}
