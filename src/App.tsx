// ============================================================
// ZRHO — Root App Component + Routes
// ============================================================

import { Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';

// Layouts
import { AppLayout } from '@/components/layout/AppLayout';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { ProtectedRoute } from '@/features/auth/ProtectedRoute';

// Auth Pages
import { LoginPage } from '@/features/auth/LoginPage';
import { SignupPage } from '@/features/auth/SignupPage';
import { ForgotPasswordPage } from '@/features/auth/ForgotPasswordPage';

// Feature Pages
import { DashboardPage } from '@/features/dashboard/DashboardPage';
import { LoansPage } from '@/features/loans/LoansPage';
import { LoanForm } from '@/features/loans/LoanForm';
import { LoanDetailPage } from '@/features/loans/LoanDetailPage';
import { CardsPage } from '@/features/cards/CardsPage';
import { CardForm } from '@/features/cards/CardForm';
import { CardDetailPage } from '@/features/cards/CardDetailPage';
import { BillDetailPage } from '@/features/cards/BillDetailPage';
import { SettingsPage } from '@/features/settings/SettingsPage';

export function App() {
  const initialize = useAuthStore((s) => s.initialize);
  const initialized = useAuthStore((s) => s.initialized);
  const theme = useUIStore((s) => s.theme);

  // Initialize auth on mount
  useEffect(() => {
    if (!initialized) {
      initialize();
    }
  }, [initialize, initialized]);

  // Apply theme on mount
  useEffect(() => {
    const root = document.documentElement;
    const isDark =
      theme === 'dark' ||
      (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    root.classList.toggle('dark', isDark);
    root.classList.toggle('light', !isDark);
  }, [theme]);

  return (
    <Routes>
      {/* Public auth routes */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      </Route>

      {/* Protected app routes */}
      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<DashboardPage />} />

        {/* Loans */}
        <Route path="/loans" element={<LoansPage />} />
        <Route path="/loans/new" element={<LoanForm />} />
        <Route path="/loans/:id" element={<LoanDetailPage />} />
        <Route path="/loans/:id/edit" element={<LoanForm />} />

        {/* Cards */}
        <Route path="/cards" element={<CardsPage />} />
        <Route path="/cards/new" element={<CardForm />} />
        <Route path="/cards/:id" element={<CardDetailPage />} />
        <Route path="/cards/:id/edit" element={<CardForm />} />
        <Route path="/cards/:id/bill/:billId" element={<BillDetailPage />} />

        {/* Settings */}
        <Route path="/settings" element={<SettingsPage />} />
      </Route>

      {/* Root redirect */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
