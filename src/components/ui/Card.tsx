// ============================================================
// ZRHO — Barebones UI: Card
// ============================================================

import React from 'react';

interface CardProps {
  children?: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export function Card({ children, className = '', onClick }: CardProps) {
  return (
    <div
      className={`bg-[var(--color-zrho-surface)] border border-[var(--color-zrho-border)] rounded-xl p-4
        ${onClick ? 'cursor-pointer hover:border-[var(--color-zrho-accent)] transition-colors' : ''}
        ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
}
