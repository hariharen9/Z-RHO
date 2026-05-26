// ============================================================
// ZRHO — Settings Page
// ============================================================

import { useState } from 'react';
import { useProfile, useUpdateProfile, useDeleteAccount } from '@/hooks/useProfile';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { Button } from '@/components/ui/Button';
import { CURRENCIES } from '@/lib/constants';
import { Dropdown } from '@/components/ui/Dropdown';
import type { DropdownOption } from '@/components/ui/Dropdown';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User,
  Mail,
  Globe,
  Sun,
  Moon,
  Monitor,
  LogOut,
  Trash2,
  Sparkles,
  ShieldAlert
} from 'lucide-react';

const currencyOptions: DropdownOption[] = CURRENCIES.map((c) => ({
  value: c.code,
  label: `${c.symbol} ${c.code} — ${c.name}`,
}));

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
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Initialize form values when profile loads
  if (profile && !nameEdited && fullName === '') {
    setFullName(profile.full_name ?? '');
  }
  if (profile && currency === '') {
    setCurrency(profile.default_currency);
  }

  const handleSaveName = async () => {
    await updateProfile.mutateAsync({ full_name: fullName });
    setNameEdited(false);
  };

  const handleSaveCurrency = (val: string) => {
    setCurrency(val);
    updateProfile.mutateAsync({ default_currency: val });
  };

  const handleDeleteConfirm = async () => {
    await deleteAccount.mutateAsync();
  };

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-2xl mx-auto animate-pulse">
        <div className="h-8 w-44 bg-surface/50 rounded-lg" />
        <div className="h-44 w-full bg-surface/50 rounded-3xl" />
        <div className="h-44 w-full bg-surface/50 rounded-3xl" />
      </div>
    );
  }

  const userInitials = fullName
    ? fullName.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : user?.email?.slice(0, 2).toUpperCase() || 'US';

  return (
    <div className="space-y-6 max-w-2xl mx-auto pb-12">
      {/* Title */}
      <div className="px-1">
        <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
          Settings <Sparkles size={16} className="text-indigo-400" />
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Configure profile details, base currencies, and UI theme options
        </p>
      </div>

      <div className="space-y-5">
        
        {/* Profile Card */}
        <div className="rounded-3xl border border-border bg-surface p-6 space-y-6 backdrop-blur">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
            <User size={13} className="text-indigo-400" /> User Profile
          </h2>

          <div className="flex flex-col sm:flex-row items-center gap-5 bg-background/35 p-4 rounded-2xl border border-border/40">
            {/* Elegant Circular Avatar Mockup */}
            <div className="h-16 w-16 rounded-full bg-gradient-to-tr from-indigo-500 to-violet-600 flex items-center justify-center text-white font-bold text-xl shadow-[0_0_20px_rgba(99,102,241,0.25)] border border-white/10 shrink-0">
              {userInitials}
            </div>

            <div className="space-y-1.5 flex-1 min-w-0 text-center sm:text-left">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-semibold uppercase tracking-widest justify-center sm:justify-start">
                <Mail size={10} /> Associated email account
              </div>
              <p className="text-sm font-semibold text-foreground truncate">{user?.email}</p>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">
              Full Profile Name
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={fullName}
                onChange={(e) => {
                  setFullName(e.target.value);
                  setNameEdited(true);
                }}
                className="flex-1 px-4 py-3 bg-background/50 border border-border/80 rounded-2xl text-foreground focus:border-foreground/45 transition-all duration-300 outline-none backdrop-blur-md text-sm"
                placeholder="e.g. Hariharen"
              />
              <AnimatePresence>
                {nameEdited && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                  >
                    <Button
                      onClick={handleSaveName}
                      loading={updateProfile.isPending}
                      className="rounded-2xl h-full px-5 font-bold text-xs bg-foreground text-background"
                    >
                      Save
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* System Preferences Card */}
        <div className="rounded-3xl border border-border bg-surface p-6 space-y-6 backdrop-blur">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
            <Globe size={13} className="text-indigo-400" /> System Preferences
          </h2>

          {/* Currency Dropdown */}
          <div className="space-y-2">
            <Dropdown
              label="Default Base Currency"
              options={currencyOptions}
              value={currency}
              onChange={handleSaveCurrency}
            />
            <p className="text-[10px] text-muted-foreground">
              All dashboard metrics automatically convert to this currency profile.
            </p>
          </div>

          {/* Theme Switcher with Sliding Pill Indicator */}
          <div className="space-y-3">
            <label className="block text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">
              Interface Theme Style
            </label>
            <div className="flex gap-1 rounded-full border border-border bg-background/60 p-1.5 max-w-md">
              {([
                { id: 'dark', label: 'Dark', icon: Moon },
                { id: 'light', label: 'Light', icon: Sun },
                { id: 'system', label: 'System', icon: Monitor },
              ] as const).map((t) => {
                const active = theme === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => setTheme(t.id)}
                    className={`relative flex-1 rounded-full py-2.5 text-xs font-semibold transition cursor-pointer flex items-center justify-center gap-2 ${
                      active ? 'text-background' : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {active && (
                      <motion.div
                        layoutId="activeTheme"
                        className="absolute inset-0 rounded-full bg-foreground"
                        transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                      />
                    )}
                    <span className="relative z-10 flex items-center gap-1.5">
                      <t.icon size={12} strokeWidth={2.5} /> {t.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Danger Zone Card */}
        <div className="rounded-3xl border border-red-500/15 bg-red-950/5 p-6 space-y-6 backdrop-blur">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-red-400 flex items-center gap-2">
            <ShieldAlert size={13} /> Danger Zone
          </h2>

          <p className="text-xs text-muted-foreground leading-relaxed">
            These operations are sensitive. Deleting your account deletes your loans, repayment sheets, cards, and transactional ledgers permanently.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Button
              variant="secondary"
              onClick={() => signOut()}
              className="rounded-2xl py-3 text-xs font-bold font-sans border border-border bg-surface hover:bg-surface-elevated flex items-center justify-center gap-1.5 flex-1"
            >
              <LogOut size={13} /> Sign Out Account
            </Button>
            <Button
              variant="danger"
              onClick={() => setShowDeleteConfirm(true)}
              className="rounded-2xl py-3 text-xs font-bold font-sans bg-red-600 hover:bg-red-700 text-white flex items-center justify-center gap-1.5 flex-1"
            >
              <Trash2 size={13} /> Permanent Account Delete
            </Button>
          </div>
        </div>

      </div>

      {/* Account Deletion Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDeleteConfirm}
        title="Permanently Delete Account"
        message="Are you sure you want to delete your account? All of your profiles, registered installment loans, credit card terms, and financial ledger data will be permanently wiped out from our databases. This action is absolute and cannot be undone."
        confirmText="Delete account permanently"
        variant="danger"
      />

    </div>
  );
}

