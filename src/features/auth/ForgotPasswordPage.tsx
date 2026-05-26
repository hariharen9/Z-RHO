// ============================================================
// ZRHO — Auth: Forgot Password Page (Redesigned)
// ============================================================

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/Button';
import { Mail, ArrowRight, AlertCircle } from 'lucide-react';

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

  if (sent) {
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
          We've sent a password reset link to <strong className="text-foreground">{email}</strong>.
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
        <h2 className="text-2xl font-bold tracking-tight text-foreground">Reset Password</h2>
        <p className="text-xs text-muted-foreground mt-1.5">Enter your email and we'll send you a recovery link</p>
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

        {/* Submit */}
        <motion.div variants={itemVariants} className="pt-2">
          <Button 
            type="submit" 
            loading={loading} 
            className="group w-full py-2.5 btn-shiny rounded-xl cursor-pointer text-sm flex items-center justify-center gap-2 font-semibold"
          >
            Send Reset Link <ArrowRight size={14} className="transition-transform duration-300 group-hover:translate-x-0.5" />
          </Button>
        </motion.div>
      </form>

      {/* Footer Navigation */}
      <motion.div variants={itemVariants} className="mt-5 text-center text-xs text-muted-foreground">
        <Link to="/login" className="text-indigo-400 hover:text-indigo-300 hover:underline transition-colors font-medium">
          Back to Sign In
        </Link>
      </motion.div>
    </motion.div>
  );
}
