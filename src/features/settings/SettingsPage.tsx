// ============================================================
// ZRHO — Settings Page
// ============================================================

import { useState, useEffect } from 'react';
import { useProfile, useUpdateProfile, useDeleteAccount } from '@/hooks/useProfile';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { Button } from '@/components/ui/Button';
import { CURRENCIES } from '@/lib/constants';
import { Dropdown } from '@/components/ui/Dropdown';
import type { DropdownOption } from '@/components/ui/Dropdown';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { motion, AnimatePresence } from 'framer-motion';
import { exportLedgerData } from '@/lib/exportLedger';
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
  ShieldAlert,
  Check,
  Info,
  Database,
  Download,
  FileSpreadsheet,
  FileCode,
  FileText,
  Loader2,
  CheckCircle2,
  AlertTriangle,
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
  const [nameSaved, setNameSaved] = useState(false);
  const [currencySaved, setCurrencySaved] = useState(false);

  // Data Export Center States
  const [exportType, setExportType] = useState<'cards' | 'loans'>('cards');
  const [exportFormat, setExportFormat] = useState<'csv' | 'json' | 'pdf'>('csv');
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const handleExport = async () => {
    setIsExporting(true);
    setExportError(null);
    setExportSuccess(false);
    try {
      const targetCurrency = profile?.default_currency || 'INR';
      await exportLedgerData(exportType, exportFormat, targetCurrency);
      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 4000);
    } catch (err: any) {
      setExportError(err.message || 'Failed to generate offline export.');
    } finally {
      setIsExporting(false);
    }
  };

  // Initialize form values when profile loads (via effect, not render-phase setState)
  useEffect(() => {
    if (profile) {
      if (!nameEdited) setFullName(profile.full_name ?? '');
      if (!currency) setCurrency(profile.default_currency);
    }
  }, [profile]);

  const handleSaveName = async () => {
    await updateProfile.mutateAsync({ full_name: fullName });
    setNameEdited(false);
    setNameSaved(true);
    setTimeout(() => setNameSaved(false), 2000);
  };

  const handleSaveCurrency = (val: string) => {
    setCurrency(val);
    updateProfile.mutateAsync({ default_currency: val }).then(() => {
      setCurrencySaved(true);
      setTimeout(() => setCurrencySaved(false), 2000);
    });
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

  const avatarUrl = profile?.avatar_url || user?.user_metadata?.avatar_url;

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
            <div className="h-16 w-16 rounded-full bg-gradient-to-tr from-indigo-500 to-violet-600 flex items-center justify-center text-white font-bold text-xl shadow-[0_0_20px_rgba(99,102,241,0.25)] border border-white/10 shrink-0 overflow-hidden">
              {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                userInitials
              )}
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
            <div className="flex gap-2 items-center">
              <input
                type="text"
                value={fullName}
                onChange={(e) => {
                  setFullName(e.target.value);
                  setNameEdited(true);
                  setNameSaved(false);
                }}
                className="flex-1 px-4 py-3 bg-background/50 border border-border/80 rounded-2xl text-foreground focus:border-foreground/45 transition-all duration-300 outline-none backdrop-blur-md text-sm"
                placeholder="e.g. Hariharen"
              />
              <AnimatePresence mode="wait">
                {nameSaved ? (
                  <motion.div
                    key="saved"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="flex items-center gap-1.5 text-success text-xs font-semibold px-3 py-2 rounded-2xl bg-success/10 border border-success/20 shrink-0"
                  >
                    <Check size={13} strokeWidth={3} /> Saved!
                  </motion.div>
                ) : nameEdited ? (
                  <motion.div
                    key="save-btn"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                  >
                    <Button
                      onClick={handleSaveName}
                      loading={updateProfile.isPending}
                      className="rounded-2xl h-full px-5 font-bold text-xs bg-foreground text-background shrink-0"
                    >
                      Save
                    </Button>
                  </motion.div>
                ) : null}
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
            <div className="flex items-center justify-between">
              <label className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">
                Default Base Currency
              </label>
              <AnimatePresence>
                {currencySaved && (
                  <motion.span
                    initial={{ opacity: 0, x: 6 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 6 }}
                    className="flex items-center gap-1 text-success text-[10px] font-semibold"
                  >
                    <Check size={11} strokeWidth={3} /> Saved
                  </motion.span>
                )}
              </AnimatePresence>
            </div>
            <Dropdown
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

        {/* Data Export Center Card */}
        <div className="rounded-3xl border border-border bg-surface p-6 space-y-6 backdrop-blur">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
            <Database size={13} className="text-indigo-400" /> Data Export Center
          </h2>

          <p className="text-xs text-muted-foreground leading-relaxed">
            Generate and export fully detailed reports of your financial accounts. Export transactions as analysis sheets, ledgers as backup files, or download complete summaries.
          </p>

          {/* 1. Select Ledger Type (Pills Layout with sliding active container) */}
          <div className="space-y-3">
            <label className="block text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">
              1. Select Ledger Category
            </label>
            <div className="flex gap-1 rounded-2xl border border-border bg-background/60 p-1.5 max-w-md">
              {([
                { id: 'cards', label: 'Credit Cards Ledger' },
                { id: 'loans', label: 'Loan Liabilities' },
              ] as const).map((type) => {
                const active = exportType === type.id;
                return (
                  <button
                    key={type.id}
                    onClick={() => {
                      setExportType(type.id);
                      setExportError(null);
                    }}
                    className={`relative flex-1 rounded-xl py-3 text-xs font-bold transition cursor-pointer flex items-center justify-center gap-2 ${
                      active ? 'text-background' : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {active && (
                      <motion.div
                        layoutId="activeExportType"
                        className="absolute inset-0 rounded-xl bg-foreground"
                        transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                      />
                    )}
                    <span className="relative z-10">{type.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Select Export Format (Grid layout of 3 items with borders) */}
          <div className="space-y-3">
            <label className="block text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">
              2. Choose Export Format Style
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {([
                {
                  id: 'csv',
                  label: 'CSV Spreadsheet',
                  desc: exportType === 'cards' ? 'Flat spends ledger' : 'Loans data list',
                  icon: FileSpreadsheet,
                  color: 'text-emerald-400 border-emerald-500/10 hover:border-emerald-500/30 font-semibold'
                },
                {
                  id: 'json',
                  label: 'JSON Ledger',
                  desc: 'Complete database JSON',
                  icon: FileCode,
                  color: 'text-indigo-400 border-indigo-500/10 hover:border-indigo-500/30 font-semibold'
                },
                {
                  id: 'pdf',
                  label: 'PDF Document',
                  desc: 'Formatted A4 Summary',
                  icon: FileText,
                  color: 'text-rose-400 border-rose-500/10 hover:border-rose-500/30 font-semibold'
                },
              ] as const).map((fmt) => {
                const active = exportFormat === fmt.id;
                const Icon = fmt.icon;
                return (
                  <button
                    key={fmt.id}
                    onClick={() => {
                      setExportFormat(fmt.id);
                      setExportError(null);
                    }}
                    className={`flex flex-col items-center text-center p-4 rounded-2xl border transition-all duration-300 outline-none cursor-pointer ${
                      active
                        ? 'border-foreground bg-foreground/5 shadow-[0_0_15px_rgba(255,255,255,0.03)] scale-[1.02]'
                        : 'border-border bg-background/30 hover:bg-background/60'
                    }`}
                  >
                    <div className={`p-2 rounded-xl bg-background/80 mb-2 ${fmt.color.split(' ')[0]}`}>
                      <Icon size={16} />
                    </div>
                    <span className="text-xs font-bold text-foreground">{fmt.label}</span>
                    <span className="text-[10px] text-muted-foreground mt-1 leading-snug">{fmt.desc}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Export Action and Feedback Feed */}
          <div className="pt-2 space-y-3">
            <Button
              onClick={handleExport}
              loading={isExporting}
              variant="primary"
              className="w-full rounded-2xl py-3.5 text-xs font-bold tracking-wider uppercase flex items-center justify-center gap-2 hover:opacity-95 active:scale-[0.98] transition-all duration-300 shadow-[0_4px_20px_rgba(99,102,241,0.15)]"
            >
              {!isExporting && <Download size={13} />}
              {isExporting ? 'Compiling Ledger...' : 'Generate & Export Data'}
            </Button>

            <AnimatePresence mode="wait">
              {exportSuccess && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="flex items-center gap-2 p-3 rounded-xl border border-success/20 bg-success/10 text-success text-xs font-medium"
                >
                  <CheckCircle2 size={14} className="shrink-0" />
                  Offline data export completed successfully! Check downloads.
                </motion.div>
              )}

              {exportError && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="flex items-center gap-2 p-3 rounded-xl border border-red-500/20 bg-red-950/10 text-red-400 text-xs font-medium"
                >
                  <AlertTriangle size={14} className="shrink-0" />
                  {exportError}
                </motion.div>
              )}
            </AnimatePresence>
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

        {/* About / Version Card */}
        <div className="rounded-3xl border border-border/50 bg-surface/40 p-5 backdrop-blur flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl border border-border bg-background overflow-hidden shrink-0">
              <img src="/zrho.png" alt="Z-RHO" className="h-full w-full object-cover" />
            </div>
            <div>
              <div className="text-sm font-bold tracking-[0.18em] text-foreground flex items-center gap-2">
                Z-RHO
                <span className="text-[9px] font-semibold tracking-widest uppercase text-muted-foreground border border-border rounded-full px-2 py-0.5">
                  v0.0.1
                </span>
              </div>
              <div className="text-[10px] text-muted-foreground mt-0.5">Know your money · Personal finance OS</div>
            </div>
          </div>
          <div className="text-right text-[10px] text-muted-foreground space-y-0.5">
            <div className="font-mono">ρ = 0</div>
            <div>Zero debt. Zero stress.</div>
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

