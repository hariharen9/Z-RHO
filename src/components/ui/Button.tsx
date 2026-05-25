// ============================================================
// ZRHO — Barebones UI: Button
// ============================================================

import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

const variantStyles: Record<string, string> = {
  primary: 'bg-[var(--color-zrho-accent)] hover:bg-[var(--color-zrho-accent-hover)] text-white',
  secondary: 'bg-[var(--color-zrho-surface-2)] hover:bg-[var(--color-zrho-border)] text-[var(--color-zrho-text)]',
  ghost: 'bg-transparent hover:bg-[var(--color-zrho-surface-2)] text-[var(--color-zrho-text)]',
  danger: 'bg-red-600 hover:bg-red-700 text-white',
};

const sizeStyles: Record<string, string> = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
};

export function Button({
  variant = 'primary',
  size = 'md',
  loading,
  disabled,
  className = '',
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors
        ${variantStyles[variant]} ${sizeStyles[size]}
        ${disabled || loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      )}
      {children}
    </button>
  );
}
