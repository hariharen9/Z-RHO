// ============================================================
// ZRHO — Settings Page
// ============================================================

import { useState } from 'react';
import { useProfile, useUpdateProfile, useDeleteAccount } from '@/hooks/useProfile';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { CURRENCIES } from '@/lib/constants';

export function SettingsPage() {
  const { data: profile, isLoading } = useProfile();
  const { user } = useAuthStore();
  const updateProfile = useUpdateProfile();
  const deleteAccount = useDeleteAccount();
  const { theme, setTheme } = useUIStore();
  const { signOut } = useAuthStore();

  const [fullName, setFullName] = useState('');
  const [currency, setCurrency] = useState('');
  const [nameEdited, setNameEdited] = useState(false);

  // Initialize form values when profile loads
  if (profile && !nameEdited) {
    if (fullName === '') setFullName(profile.full_name ?? '');
    if (currency === '') setCurrency(profile.default_currency);
  }

  const handleSaveName = async () => {
    await updateProfile.mutateAsync({ full_name: fullName });
    setNameEdited(false);
  };

  const handleSaveCurrency = async () => {
    await updateProfile.mutateAsync({ default_currency: currency });
  };

  const handleDeleteAccount = async () => {
    const confirmed = confirm(
      'Are you sure you want to delete your account? All your data will be permanently removed. This cannot be undone.'
    );
    if (confirmed) {
      await deleteAccount.mutateAsync();
    }
  };

  if (isLoading) {
    return <div className="text-center py-12 text-[var(--color-zrho-text-muted)]">Loading...</div>;
  }

  return (
    <div className="space-y-6 max-w-xl">
      <h1 className="text-2xl font-bold">Settings</h1>

      {/* Profile */}
      <Card>
        <h2 className="text-lg font-semibold mb-4">Profile</h2>
        <div className="space-y-3">
          <div>
            <label className="block text-sm text-[var(--color-zrho-text-muted)] mb-1">Full Name</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={fullName}
                onChange={(e) => { setFullName(e.target.value); setNameEdited(true); }}
                className="flex-1 px-3 py-2 bg-[var(--color-zrho-surface-2)] border border-[var(--color-zrho-border)] rounded-lg text-[var(--color-zrho-text)] outline-none"
              />
              {nameEdited && (
                <Button size="sm" onClick={handleSaveName} loading={updateProfile.isPending}>
                  Save
                </Button>
              )}
            </div>
          </div>
          <div>
            <label className="block text-sm text-[var(--color-zrho-text-muted)] mb-1">Email</label>
            <p className="text-sm">{user?.email}</p>
          </div>
        </div>
      </Card>

      {/* Currency */}
      <Card>
        <h2 className="text-lg font-semibold mb-4">Default Currency</h2>
        <div className="flex gap-2">
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className="flex-1 px-3 py-2 bg-[var(--color-zrho-surface-2)] border border-[var(--color-zrho-border)] rounded-lg text-[var(--color-zrho-text)] outline-none"
          >
            {CURRENCIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.symbol} {c.code} — {c.name}
              </option>
            ))}
          </select>
          <Button
            size="sm"
            onClick={handleSaveCurrency}
            loading={updateProfile.isPending}
            disabled={currency === profile?.default_currency}
          >
            Save
          </Button>
        </div>
      </Card>

      {/* Theme */}
      <Card>
        <h2 className="text-lg font-semibold mb-4">Theme</h2>
        <div className="flex gap-2">
          {(['dark', 'light', 'system'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTheme(t)}
              className={`flex-1 py-2 rounded-lg text-sm transition-colors capitalize
                ${theme === t
                  ? 'bg-[var(--color-zrho-accent)] text-white'
                  : 'bg-[var(--color-zrho-surface-2)] text-[var(--color-zrho-text-muted)]'
                }`}
            >
              {t}
            </button>
          ))}
        </div>
      </Card>

      {/* Account */}
      <Card>
        <h2 className="text-lg font-semibold mb-4">Account</h2>
        <Button variant="secondary" onClick={() => signOut()}>
          Sign Out
        </Button>
      </Card>

      {/* Danger Zone */}
      <Card className="border-red-500/30">
        <h2 className="text-lg font-semibold text-red-400 mb-4">Danger Zone</h2>
        <p className="text-sm text-[var(--color-zrho-text-muted)] mb-3">
          Permanently delete your account and all data. This action cannot be undone.
        </p>
        <Button variant="danger" onClick={handleDeleteAccount}>
          Delete Account
        </Button>
      </Card>
    </div>
  );
}
