// ============================================================
// ZRHO — Auth: Signup Page
// ============================================================

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/Button';

export function SignupPage() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signUp, signInWithGoogle } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      setLoading(false);
      return;
    }

    const result = await signUp(email, password, fullName);
    setLoading(false);

    if (result.error) {
      setError(result.error);
    } else {
      setSuccess(true);
    }
  };

  const handleGoogleSignIn = async () => {
    const result = await signInWithGoogle();
    if (result.error) setError(result.error);
  };

  if (success) {
    return (
      <div className="text-center py-4">
        <h2 className="text-xl font-semibold mb-2">Check your email</h2>
        <p className="text-[var(--color-zrho-text-muted)] text-sm mb-4">
          We've sent a confirmation link to <strong>{email}</strong>.
        </p>
        <Link to="/login" className="text-[var(--color-zrho-accent)] hover:underline text-sm">
          Back to Sign In
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-xl font-semibold mb-6">Create Account</h2>

      {error && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="fullName" className="block text-sm text-[var(--color-zrho-text-muted)] mb-1">
            Full Name
          </label>
          <input
            id="fullName"
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            className="w-full px-3 py-2 bg-[var(--color-zrho-surface-2)] border border-[var(--color-zrho-border)] rounded-lg text-[var(--color-zrho-text)] focus:border-[var(--color-zrho-accent)] outline-none"
            placeholder="John Doe"
          />
        </div>

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

        <div>
          <label htmlFor="password" className="block text-sm text-[var(--color-zrho-text-muted)] mb-1">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="w-full px-3 py-2 bg-[var(--color-zrho-surface-2)] border border-[var(--color-zrho-border)] rounded-lg text-[var(--color-zrho-text)] focus:border-[var(--color-zrho-accent)] outline-none"
            placeholder="••••••••"
          />
        </div>

        <Button type="submit" loading={loading} className="w-full">
          Create Account
        </Button>
      </form>

      <div className="my-4 flex items-center gap-3">
        <div className="flex-1 h-px bg-[var(--color-zrho-border)]" />
        <span className="text-xs text-[var(--color-zrho-text-muted)]">or</span>
        <div className="flex-1 h-px bg-[var(--color-zrho-border)]" />
      </div>

      <Button variant="secondary" onClick={handleGoogleSignIn} className="w-full">
        Continue with Google
      </Button>

      <p className="mt-4 text-center text-sm text-[var(--color-zrho-text-muted)]">
        Already have an account?{' '}
        <Link to="/login" className="text-[var(--color-zrho-accent)] hover:underline">
          Sign In
        </Link>
      </p>
    </div>
  );
}
