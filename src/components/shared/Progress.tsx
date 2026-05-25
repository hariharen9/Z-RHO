import { motion } from 'framer-motion';

interface ProgressProps {
  value: number; // 0 to 1
  color?: string;
  height?: number;
  className?: string;
}

export function Progress({
  value,
  color = 'var(--color-success)',
  height = 6,
  className = '',
}: ProgressProps) {
  const clamped = Math.max(0, Math.min(1, value));

  return (
    <div
      className={`w-full overflow-hidden rounded-full bg-secondary ${className}`}
      style={{ height }}
    >
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${clamped * 100}%` }}
        transition={{ type: 'spring', stiffness: 80, damping: 18 }}
        style={{ backgroundColor: color, height: '100%' }}
        className="rounded-full"
      />
    </div>
  );
}
