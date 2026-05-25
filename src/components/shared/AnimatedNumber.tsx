import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { formatCurrency, formatCompactCurrency } from '@/lib/currency';

interface AnimatedNumberProps {
  value: number;
  className?: string;
  compact?: boolean;
  currency?: string;
}

export function AnimatedNumber({
  value,
  className = '',
  compact = false,
  currency = 'INR',
}: AnimatedNumberProps) {
  const [display, setDisplay] = useState(value);

  useEffect(() => {
    const start = display;
    const diff = value - start;
    const duration = 700; // Animation duration in milliseconds
    const startTime = performance.now();
    let raf = 0;

    const step = (now: number) => {
      const progress = Math.min(1, (now - startTime) / duration);
      // Easing function: Cubic easeOut
      const eased = 1 - Math.pow(1 - progress, 3);
      
      setDisplay(start + diff * eased);

      if (progress < 1) {
        raf = requestAnimationFrame(step);
      }
    };

    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value]);

  const formattedValue = compact
    ? formatCompactCurrency(display, currency)
    : formatCurrency(display, currency);

  return (
    <motion.span className={`${className} tabular`}>
      {formattedValue}
    </motion.span>
  );
}
