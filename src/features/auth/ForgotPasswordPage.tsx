// ============================================================
// ZRHO — Auth: Forgot Password Page
// ============================================================

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/Button';

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const { resetPassword } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await resetPassword(email);
    setLoading(false);

    if (result.error) {
      setError(result.error);
    } else {
      setSent(true);
    }
  };

  if (sent) {
    return (
      <div className="text-center py-4">
        <h2 className="text-xl font-semibold mb-2">Check your email</h2>
        <p className="text-[var(--color-zrho-text-muted)] text-sm mb-4">
          We've sent a password reset link to <strong>{email}</strong>.
        </p>
        <Link to="/login" className="text-[var(--color-zrho-accent)] hover:underline text-sm">
          Back to Sign In
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-xl font-semibold mb-2">Reset Password</h2>
      <p className="text-[var(--color-zrho-text-muted)] text-sm mb-6">
        Enter your email and we'll send you a reset link.
      </p>

      {error && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm text-[var(--color-zrho-text-muted)] mb-1">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-3 py-2 bg-[var(--color-zrho-surface-2)] border border-[var(--color-zrho-border)] rounded-lg text-[var(--color-zrho-text)] focus:border-[var(--color-zrho-accent)] outline-none"
            placeholder="you@example.com"
          />
        </div>

        <Button type="submit" loading={loading} className="w-full">
          Send Reset Link
        </Button>
      </form>

      <p className="mt-4 text-center text-sm text-[var(--color-zrho-text-muted)]">
        <Link to="/login" className="text-[var(--color-zrho-accent)] hover:underline">
          Back to Sign In
        </Link>
      </p>
    </div>
  );
}
