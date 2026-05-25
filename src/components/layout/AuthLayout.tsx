// ============================================================
// ZRHO — Layout: AuthLayout (Unauthenticated)
// ============================================================

import { Outlet } from 'react-router-dom';

export function AuthLayout() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-[var(--color-zrho-bg)]">
      <div className="w-full max-w-md flex-1 flex flex-col justify-center py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold tracking-tight">
            Z-<span className="text-[var(--color-zrho-accent)]">RHO</span>
          </h1>
          <p className="text-[var(--color-zrho-text-muted)] text-sm mt-1">Debt Management</p>
        </div>
        <div className="bg-[var(--color-zrho-surface)] border border-[var(--color-zrho-border)] rounded-xl p-6">
          <Outlet />
        </div>
      </div>
      <footer className="w-full py-4 text-center text-xs text-[var(--color-zrho-text-muted)] mt-auto">
        Built by{' '}
        <a
          href="https://hariharen.site"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[var(--color-zrho-accent)] hover:underline font-medium transition-colors"
        >
          Hariharen
        </a>
      </footer>
    </div>
  );
}
