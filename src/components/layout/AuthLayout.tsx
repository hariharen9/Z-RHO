// ============================================================
// ZRHO — Layout: AuthLayout (Unauthenticated Redesign)
// ============================================================

import { Outlet } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles, TrendingDown, ShieldCheck } from 'lucide-react';

export function AuthLayout() {
  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-background text-foreground lg:grid lg:grid-cols-2">
      
      {/* Dynamic Backdrop Glowing Spheres */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        {/* Glow Sphere 1 */}
        <motion.div
          animate={{
            x: [0, 50, -30, 0],
            y: [0, -80, 40, 0],
            scale: [1, 1.15, 0.9, 1],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute -top-40 -left-40 h-[600px] w-[600px] rounded-full bg-indigo-500/10 blur-[120px]"
        />
        {/* Glow Sphere 2 */}
        <motion.div
          animate={{
            x: [0, -60, 40, 0],
            y: [0, 70, -50, 0],
            scale: [1, 0.9, 1.1, 1],
          }}
          transition={{
            duration: 18,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute -bottom-40 -right-40 h-[600px] w-[600px] rounded-full bg-violet-600/10 blur-[120px]"
        />
        {/* Grid pattern overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808005_1px,transparent_1px),linear-gradient(to_bottom,#80808005_1px,transparent_1px)] bg-[size:24px_24px]" />
      </div>

      {/* Left Pane - Premium Showcase (Visible on lg+) */}
      <div className="relative hidden flex-col justify-between border-r border-border/40 p-12 lg:flex overflow-hidden bg-surface/5 backdrop-blur-[2px]">
        {/* Branding header */}
        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 overflow-hidden rounded-xl border border-border bg-background">
              <img src="/zrho.png" alt="Z-RHO Logo" className="h-full w-full object-cover" />
            </div>
            <span className="text-sm font-semibold tracking-[0.25em] text-foreground">Z-RHO</span>
          </div>

          <div className="inline-flex items-center gap-1.5 rounded-full border border-indigo-500/20 bg-indigo-500/5 px-3 py-1 text-[10px] uppercase font-semibold tracking-widest text-indigo-400 backdrop-blur-md">
            <span className="flex h-1.5 w-1.5 rounded-full bg-indigo-400 animate-pulse" />
            System Active
          </div>
        </div>

        {/* Feature presentation showcase - centered horizontally */}
        <div className="my-auto mx-auto flex flex-col items-start gap-8 relative z-10 max-w-[440px] w-full">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-4"
          >
            {/* Visual Glassmorphic Logo Showcase Container with Orbital Ring */}
            <div className="relative inline-block mb-2">
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 -m-3 rounded-full border border-dashed border-indigo-500/25"
              />
              <motion.div 
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                className="relative z-10 inline-flex h-20 w-20 items-center justify-center rounded-3xl border border-white/10 bg-gradient-to-br from-white/10 to-transparent p-4 shadow-xl backdrop-blur-md"
              >
                <img src="/zrho.png" alt="ZRHO Brand" className="h-full w-full object-contain filter drop-shadow-[0_0_15px_rgba(99,102,241,0.4)]" />
              </motion.div>
            </div>

            <h2 className="text-4xl font-bold tracking-tight leading-[1.1] bg-gradient-to-r from-foreground via-foreground to-muted-foreground bg-clip-text text-transparent">
              Master your liability lifecycle.
            </h2>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Z-RHO automates derived debt variables, models prepayments interactively, and organizes statement bookkeeping inside a hyper-premium standalone interface.
            </p>
          </motion.div>

          {/* Core Feature Bulletins */}
          <motion.div 
            initial="hidden"
            animate="visible"
            variants={{
              visible: { transition: { staggerChildren: 0.1 } }
            }}
            className="w-full space-y-4 mt-2"
          >
            {[
              {
                icon: TrendingDown,
                title: "Analytics & Outflows",
                desc: "Track total liabilities, utilization indexes, and monthly EMIs stacked by color-coded urgency indexes."
              },
              {
                icon: Sparkles,
                title: "Interactive Prepayment Playgrounds",
                desc: "Calculate saved interest sums and tenure month reductions instantly before making payments."
              },
              {
                icon: ShieldCheck,
                title: "Decentralized & Safe Ledger",
                desc: "Equipped with strict local RLS policies protecting your statement balances and loan history."
              }
            ].map(({ icon: Icon, title, desc }, idx) => (
              <motion.div
                key={idx}
                variants={{
                  hidden: { opacity: 0, x: -20 },
                  visible: { opacity: 1, x: 0 }
                }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="group flex gap-4 rounded-2xl border border-transparent p-3 transition-all duration-300 hover:border-border/30 hover:bg-surface/30 hover:backdrop-blur-md cursor-default"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-background border border-border text-muted-foreground group-hover:text-foreground group-hover:border-foreground/30 group-hover:scale-105 group-hover:-rotate-3 group-hover:shadow-[0_0_15px_rgba(99,102,241,0.15)] transition-all duration-300">
                  <Icon size={18} strokeWidth={1.5} />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-foreground group-hover:translate-x-0.5 transition-transform duration-300">{title}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{desc}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* Footer */}
        <div className="text-[10px] uppercase tracking-widest text-muted-foreground relative z-10">
          Engineered by{' '}
          <a
            href="https://hariharen.site"
            target="_blank"
            rel="noopener noreferrer"
            className="text-foreground hover:text-foreground/80 transition-colors font-semibold"
          >
            Hariharen
          </a>
        </div>
      </div>

      {/* Right Pane - Form container */}
      <div className="flex flex-col justify-between items-center p-6 min-h-screen lg:justify-center relative z-10">
        
        {/* Ambient background glow behind card (Mobile only) */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[350px] w-[350px] rounded-full bg-indigo-500/5 blur-[90px] -z-10 lg:hidden pointer-events-none" />

        {/* Mobile top branding (Hidden on desktop) */}
        <div className="flex flex-col items-center gap-3 pt-8 pb-6 lg:hidden w-full">
          {/* Animated Logo Container with Orbit Ring on Mobile */}
          <div className="relative inline-block">
            <motion.div 
              animate={{ rotate: -360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0 -m-2 rounded-full border border-dashed border-indigo-500/25"
            />
            <div className="relative z-10 h-10 w-10 overflow-hidden rounded-xl border border-border bg-surface flex items-center justify-center p-1.5 shadow-md">
              <img src="/zrho.png" alt="Z-RHO Logo" className="h-full w-full object-contain" />
            </div>
          </div>
          <div className="text-center mt-1">
            <div className="text-xs font-bold tracking-[0.3em] text-foreground">Z-RHO</div>
            <div className="text-[9px] uppercase tracking-[0.18em] text-muted-foreground mt-1">Liability Lifecycle Engine</div>
          </div>

          {/* Secure blinking ledger badge */}
          <div className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-white/5 bg-white/[0.02] px-3 py-1 text-[9px] font-semibold tracking-widest text-muted-foreground backdrop-blur-md uppercase">
            <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Secure Ledger Interface
          </div>
        </div>

        {/* Dynamic transition form card wrapper */}
        <div className="w-full max-w-[420px] rounded-3xl border border-border/60 bg-surface/30 backdrop-blur-xl p-8 shadow-2xl relative overflow-hidden">
          {/* Subtle glossy card reflection effect */}
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
          
          <Outlet />
        </div>

        {/* Mobile footer (Hidden on desktop) */}
        <div className="text-[10px] uppercase tracking-widest text-muted-foreground pt-8 pb-4 lg:hidden">
          Engineered by{' '}
          <a
            href="https://hariharen.site"
            target="_blank"
            rel="noopener noreferrer"
            className="text-foreground hover:text-foreground/80 transition-colors font-semibold"
          >
            Hariharen
          </a>
        </div>
      </div>
    </div>
  );
}
