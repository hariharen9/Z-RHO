// ============================================================
// ZRHO — Barebones UI: Badge
// ============================================================

import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  className?: string;
}

const variantStyles: Record<string, string> = {
  default: 'bg-[var(--color-zrho-surface-2)] text-[var(--color-zrho-text-muted)]',
  success: 'bg-green-500/20 text-green-400',
  warning: 'bg-amber-500/20 text-amber-400',
  danger: 'bg-red-500/20 text-red-400',
  info: 'bg-blue-500/20 text-blue-400',
};

export function Badge({ children, variant = 'default', className = '' }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${variantStyles[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
