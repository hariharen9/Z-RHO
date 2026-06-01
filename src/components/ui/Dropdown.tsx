// ============================================================
// ZRHO — UI: Custom Dropdown
// ============================================================

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

export interface DropdownOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
}

interface DropdownProps {
  label?: string;
  options: DropdownOption[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
  size?: 'normal' | 'compact';
}

export function Dropdown({
  label,
  options,
  value,
  onChange,
  className = '',
  size = 'normal',
}: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Find currently selected option
  const selectedOption = options.find((opt) => opt.value === value) || options[0];

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isCompact = size === 'compact';

  return (
    <div ref={containerRef} className={`relative ${isCompact ? 'w-auto shrink-0' : 'w-full'} ${className}`}>
      {label && !isCompact && (
        <label className="block text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-1.5">
          {label}
        </label>
      )}
      
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center justify-between text-left cursor-pointer transition-all duration-300 outline-none backdrop-blur-md ${
          isCompact
            ? 'px-3 py-2 bg-surface-elevated/80 border border-border/80 rounded-xl text-xs font-semibold text-foreground hover:bg-surface-elevated'
            : 'w-full px-4 py-3 bg-background/50 border border-border/80 rounded-2xl text-sm text-foreground focus:border-foreground/45 hover:bg-surface-elevated/20'
        }`}
      >
        <span className="flex items-center gap-2">
          {selectedOption?.icon}
          <span>{selectedOption?.label || 'Select option...'}</span>
        </span>
        <motion.span
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="ml-2 shrink-0"
        >
          <ChevronDown size={14} className="text-muted-foreground" />
        </motion.span>
      </button>

      {/* Options Dropdown List */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className={`absolute z-50 mt-2 rounded-2xl border border-border bg-surface p-1.5 shadow-2xl backdrop-blur-xl max-h-60 overflow-y-auto no-scrollbar ${
              isCompact ? 'min-w-[160px] w-max right-0 md:left-0' : 'w-full'
            }`}
          >
            {options.map((opt) => {
              const active = opt.value === value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    onChange(opt.value);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-left transition-colors cursor-pointer ${
                    active
                      ? 'bg-foreground text-background font-semibold'
                      : 'text-foreground hover:bg-surface-elevated'
                  }`}
                >
                  {opt.icon && <span className={active ? 'text-background' : 'text-muted-foreground'}>{opt.icon}</span>}
                  <span>{opt.label}</span>
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
