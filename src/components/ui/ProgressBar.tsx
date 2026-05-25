// ============================================================
// ZRHO — Barebones UI: ProgressBar
// ============================================================

interface ProgressBarProps {
  value: number; // 0-100
  color?: string;
  className?: string;
  showLabel?: boolean;
}

export function ProgressBar({
  value,
  color = 'var(--color-zrho-accent)',
  className = '',
  showLabel = true,
}: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, value));

  return (
    <div className={`w-full ${className}`}>
      <div className="w-full h-2 bg-[var(--color-zrho-surface-2)] rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${clamped}%`, backgroundColor: color }}
        />
      </div>
      {showLabel && (
        <p className="text-xs text-[var(--color-zrho-text-muted)] mt-1">{clamped.toFixed(1)}%</p>
      )}
    </div>
  );
}
