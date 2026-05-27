// ============================================================
// ZRHO — Auth: Login Page (Redesigned)
// ============================================================

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/Button';
import { Mail, Lock, Eye, EyeOff, ArrowRight, AlertCircle, Check } from 'lucide-react';
import { ConfirmModal } from '@/components/ui/ConfirmModal';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, signInWithGoogle, isRecoveringPassword, updatePassword } = useAuthStore();
  const navigate = useNavigate();

  // PWA/Mobile OAuth Warning States
  const [showPWAWarning, setShowPWAWarning] = useState(false);
  const [pwaWarningTitle, setPwaWarningTitle] = useState('');
  const [pwaWarningMessage, setPwaWarningMessage] = useState('');

  // Password Recovery States
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [recoverySuccess, setRecoverySuccess] = useState(false);

  const handleRecoverySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    const result = await updatePassword(newPassword);
    setLoading(false);

    if (result.error) {
      setError(result.error);
    } else {
      setRecoverySuccess(true);
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await signIn(email, password);
    if (result.error) {
      setError(result.error);
      setLoading(false);
    } else {
      navigate('/dashboard');
    }
  };

  const handleGoogleSignIn = async (force: boolean = false) => {
    const isStandalone = typeof window !== 'undefined' && (
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone
    );
    const isLocalIP = typeof window !== 'undefined' && (
      /^(192\.168|10\.|172\.16)/.test(window.location.hostname) ||
      window.location.hostname.startsWith('127.') ||
      window.location.hostname.startsWith('172.')
    );

    if (!force && (isStandalone || (isLocalIP && /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent)))) {
      if (isStandalone) {
        setPwaWarningTitle('Installed App Auth Guide');
        setPwaWarningMessage(
          'Mobile operating systems isolate standard Google Auth external redirects inside installed standalone PWA wrappers. ' +
          'For a reliable session within the installed app, we highly recommend signing in with your Email & Password. ' +
          'If you don\'t have an email password yet, register one first or open Z-RHO in standard Safari/Chrome!'
        );
      } else {
        setPwaWarningTitle('Mobile Local Dev Notice');
        setPwaWarningMessage(
          `You are testing locally via IP (${window.location.hostname}). ` +
          `To make Google OAuth redirect back successfully, ensure you have explicitly registered your network IP ` +
          `"http://${window.location.hostname}:5173/dashboard" as an authorized Redirect URL in your Supabase Auth Console.`
        );
      }
      setShowPWAWarning(true);
      return;
    }

    const result = await signInWithGoogle();
    if (result.error) {
      setError(result.error);
    }
  };

  // Framer Motion Animation Variants
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { 
      opacity: 1, 
      y: 0, 
      transition: { type: "spring" as const, stiffness: 300, damping: 24 } 
    }
  };

  if (recoverySuccess) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center py-6 px-4"
      >
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mb-4 animate-bounce">
          <Check size={22} strokeWidth={3} />
        </div>
        <h2 className="text-xl font-semibold mb-2 text-foreground">Password Secured</h2>
        <p className="text-muted-foreground text-xs leading-relaxed px-2">
          Your new password has been verified and registered. Redirecting you to your secure liability dashboard...
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="w-full"
    >
      {isRecoveringPassword ? (
        <>
          <motion.div variants={itemVariants} className="text-center mb-6">
            <h2 className="text-2xl font-bold tracking-tight text-foreground">Reset Password</h2>
            <p className="text-xs text-muted-foreground mt-1.5">Choose a secure, strong new password for your Z-RHO account</p>
          </motion.div>

          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 flex items-center gap-2.5 p-3 bg-destructive/10 border border-destructive/20 rounded-xl text-destructive-foreground text-xs"
            >
              <AlertCircle size={14} className="shrink-0 text-destructive" />
              <span>{error}</span>
            </motion.div>
          )}

          <form onSubmit={handleRecoverySubmit} className="space-y-4">
            {/* New Password */}
            <motion.div variants={itemVariants} className="space-y-1.5">
              <label htmlFor="newPassword" className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                New Password
              </label>
              <div className="relative flex items-center">
                <Lock size={16} className="absolute left-3.5 text-muted-foreground/50" />
                <input
                  id="newPassword"
                  type={showPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full pl-10 pr-10 py-2.5 bg-surface-elevated/40 border border-border/60 rounded-xl text-foreground focus:border-indigo-500/80 focus:ring-1 focus:ring-indigo-500/30 outline-none transition placeholder:text-muted-foreground/40 text-sm"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 text-muted-foreground/50 hover:text-foreground transition cursor-pointer"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </motion.div>

            {/* Confirm Password */}
            <motion.div variants={itemVariants} className="space-y-1.5">
              <label htmlFor="confirmPassword" className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Confirm New Password
              </label>
              <div className="relative flex items-center">
                <Lock size={16} className="absolute left-3.5 text-muted-foreground/50" />
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full pl-10 pr-10 py-2.5 bg-surface-elevated/40 border border-border/60 rounded-xl text-foreground focus:border-indigo-500/80 focus:ring-1 focus:ring-indigo-500/30 outline-none transition placeholder:text-muted-foreground/40 text-sm"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3.5 text-muted-foreground/50 hover:text-foreground transition cursor-pointer"
                >
                  {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </motion.div>

            <motion.div variants={itemVariants} className="pt-2">
              <Button 
                type="submit" 
                loading={loading} 
                className="group w-full py-2.5 btn-shiny rounded-xl cursor-pointer text-sm flex items-center justify-center gap-2 font-semibold"
              >
                Secure Password <ArrowRight size={14} className="transition-transform duration-300 group-hover:translate-x-0.5" />
              </Button>
            </motion.div>
          </form>
        </>
      ) : (
        <>
          <motion.div variants={itemVariants} className="text-center mb-6">
            <h2 className="text-2xl font-bold tracking-tight text-foreground">Welcome back</h2>
            <p className="text-xs text-muted-foreground mt-1.5">Sign in to manage your active debt accounts</p>
          </motion.div>

          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 flex items-center gap-2.5 p-3 bg-destructive/10 border border-destructive/20 rounded-xl text-destructive-foreground text-xs"
            >
              <AlertCircle size={14} className="shrink-0 text-destructive" />
              <span>{error}</span>
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Address */}
            <motion.div variants={itemVariants} className="space-y-1.5">
              <label htmlFor="email" className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Email Address
              </label>
              <div className="relative flex items-center">
                <Mail size={16} className="absolute left-3.5 text-muted-foreground/50" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-2.5 bg-surface-elevated/40 border border-border/60 rounded-xl text-foreground focus:border-indigo-500/80 focus:ring-1 focus:ring-indigo-500/30 outline-none transition placeholder:text-muted-foreground/40 text-sm"
                  placeholder="you@example.com"
                />
              </div>
            </motion.div>

            {/* Password */}
            <motion.div variants={itemVariants} className="space-y-1.5">
              <label htmlFor="password" className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Password
              </label>
              <div className="relative flex items-center">
                <Lock size={16} className="absolute left-3.5 text-muted-foreground/50" />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full pl-10 pr-10 py-2.5 bg-surface-elevated/40 border border-border/60 rounded-xl text-foreground focus:border-indigo-500/80 focus:ring-1 focus:ring-indigo-500/30 outline-none transition placeholder:text-muted-foreground/40 text-sm"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 text-muted-foreground/50 hover:text-foreground transition cursor-pointer"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </motion.div>

            {/* Action Button */}
            <motion.div variants={itemVariants} className="pt-2">
              <Button 
                type="submit" 
                loading={loading} 
                className="group w-full py-2.5 btn-shiny rounded-xl cursor-pointer text-sm flex items-center justify-center gap-2 font-semibold"
              >
                Sign In <ArrowRight size={14} className="transition-transform duration-300 group-hover:translate-x-0.5" />
              </Button>
            </motion.div>
          </form>

          {/* Or Divider */}
          <motion.div variants={itemVariants} className="my-5 flex items-center gap-3">
            <div className="flex-1 h-px bg-border/40" />
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground">or</span>
            <div className="flex-1 h-px bg-border/40" />
          </motion.div>

          {/* Google Sign-in */}
          <motion.div variants={itemVariants}>
            <Button
              variant="secondary"
              onClick={() => handleGoogleSignIn()}
              className="w-full py-2.5 bg-surface-elevated/35 hover:bg-surface-elevated/70 border border-border/60 hover:border-border text-foreground rounded-xl transition duration-300 font-medium cursor-pointer text-sm flex items-center justify-center gap-2 shadow-sm"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Continue with Google
            </Button>
          </motion.div>

          {/* Footer Navigation */}
          <motion.div variants={itemVariants} className="mt-5 text-center text-xs text-muted-foreground flex justify-center gap-3">
            <Link to="/forgot-password" className="hover:text-foreground hover:underline transition-colors">
              Forgot password?
            </Link>
            <span>·</span>
            <Link to="/signup" className="text-indigo-400 hover:text-indigo-300 hover:underline transition-colors font-medium">
              Create account
            </Link>
          </motion.div>
        </>
      )}

      {/* PWA / Mobile Google Auth Warning Dialog */}
      <ConfirmModal
        isOpen={showPWAWarning}
        onClose={() => setShowPWAWarning(false)}
        onConfirm={() => handleGoogleSignIn(true)}
        title={pwaWarningTitle}
        message={pwaWarningMessage}
        confirmText="Proceed anyway"
        cancelText="Use Email/Password"
        variant="warning"
      />
    </motion.div>
  );
}
