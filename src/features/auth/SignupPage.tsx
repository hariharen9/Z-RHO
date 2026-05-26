// ============================================================
// ZRHO — Auth: Signup Page (Redesigned)
// ============================================================

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/Button';
import { User, Mail, Lock, Eye, EyeOff, ArrowRight, AlertCircle } from 'lucide-react';

export function SignupPage() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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

  if (success) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center py-4"
      >
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mb-4 animate-bounce">
          <Mail size={22} />
        </div>
        <h2 className="text-xl font-semibold mb-2">Check your email</h2>
        <p className="text-muted-foreground text-sm mb-5 px-2">
          We've sent a verification link to <strong className="text-foreground">{email}</strong>. Please confirm it to active your dashboard.
        </p>
        <Link 
          to="/login" 
          className="inline-flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 font-semibold uppercase tracking-wider"
        >
          Back to Sign In <ArrowRight size={12} />
        </Link>
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
      <motion.div variants={itemVariants} className="text-center mb-6">
        <h2 className="text-2xl font-bold tracking-tight text-foreground">Create account</h2>
        <p className="text-xs text-muted-foreground mt-1.5">Get started with a premium liability ledger</p>
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
        {/* Full Name */}
        <motion.div variants={itemVariants} className="space-y-1.5">
          <label htmlFor="fullName" className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Full Name
          </label>
          <div className="relative flex items-center">
            <User size={16} className="absolute left-3.5 text-muted-foreground/50" />
            <input
              id="fullName"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              className="w-full pl-10 pr-4 py-2.5 bg-surface-elevated/40 border border-border/60 rounded-xl text-foreground focus:border-indigo-500/80 focus:ring-1 focus:ring-indigo-500/30 outline-none transition placeholder:text-muted-foreground/40 text-sm"
              placeholder="John Doe"
            />
          </div>
        </motion.div>

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

        {/* Submit */}
        <motion.div variants={itemVariants} className="pt-2">
          <Button 
            type="submit" 
            loading={loading} 
            className="group w-full py-2.5 btn-shiny rounded-xl cursor-pointer text-sm flex items-center justify-center gap-2 font-semibold"
          >
            Create Account <ArrowRight size={14} className="transition-transform duration-300 group-hover:translate-x-0.5" />
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
          onClick={handleGoogleSignIn}
          className="w-full py-2.5 bg-surface-elevated/35 hover:bg-surface-elevated/70 border border-border/60 hover:border-border text-foreground rounded-xl transition duration-300 font-medium cursor-pointer text-sm flex items-center justify-center gap-2 shadow-sm"
        >
          <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
            />
            <path
              fill="currentColor"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="currentColor"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="currentColor"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Continue with Google
        </Button>
      </motion.div>

      {/* Footer Navigation */}
      <motion.div variants={itemVariants} className="mt-5 text-center text-xs text-muted-foreground">
        Already have an account?{' '}
        <Link to="/login" className="text-indigo-400 hover:text-indigo-300 hover:underline transition-colors font-medium">
          Sign In
        </Link>
      </motion.div>
    </motion.div>
  );
}
