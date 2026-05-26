// ============================================================
// ZRHO — UI: Custom Premium DatePicker Dropdown
// ============================================================

import { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';

interface DatePickerProps {
  label?: string;
  value: string; // Expected in yyyy-MM-dd format
  onChange: (value: string) => void;
  className?: string;
  error?: string;
}

// Month names helper
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const WEEK_DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

export function DatePicker({
  label,
  value,
  onChange,
  className = '',
  error,
}: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Parse current selected date
  const selectedDate = useMemo(() => {
    if (!value) return null;
    const parts = value.split('-');
    if (parts.length !== 3) return null;
    return new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
  }, [value]);

  // Calendar navigation state (year and month view)
  const [navDate, setNavDate] = useState(() => selectedDate || new Date());

  // Update navigation month/year if selected value changes externally
  useEffect(() => {
    if (selectedDate) {
      setNavDate(selectedDate);
    }
  }, [selectedDate]);

  // Click outside listener to close calendar dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navYear = navDate.getFullYear();
  const navMonth = navDate.getMonth();

  // Create grid cells for the calendar
  const cells = useMemo(() => {
    const firstDayIndex = new Date(navYear, navMonth, 1).getDay();
    const totalDays = new Date(navYear, navMonth + 1, 0).getDate();
    const prevMonthTotalDays = new Date(navYear, navMonth, 0).getDate();

    const result: { day: number; isCurrentMonth: boolean; dateString: string }[] = [];

    // 1. Days from previous month to pad the start
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const day = prevMonthTotalDays - i;
      const prevMonthDate = new Date(navYear, navMonth - 1, day);
      result.push({
        day,
        isCurrentMonth: false,
        dateString: formatDateISO(prevMonthDate),
      });
    }

    // 2. Days from current month
    for (let day = 1; day <= totalDays; day++) {
      const curDate = new Date(navYear, navMonth, day);
      result.push({
        day,
        isCurrentMonth: true,
        dateString: formatDateISO(curDate),
      });
    }

    // 3. Days from next month to fill the trailing grid (make total 42 cells for clean layout grids)
    const remainingCells = 42 - result.length;
    for (let day = 1; day <= remainingCells; day++) {
      const nextMonthDate = new Date(navYear, navMonth + 1, day);
      result.push({
        day,
        isCurrentMonth: false,
        dateString: formatDateISO(nextMonthDate),
      });
    }

    return result;
  }, [navYear, navMonth]);

  // Month navigation logic
  const handlePrevMonth = () => {
    setNavDate(new Date(navYear, navMonth - 1, 1));
  };

  const handleNextMonth = () => {
    setNavDate(new Date(navYear, navMonth + 1, 1));
  };

  // Day selection trigger
  const handleSelectDay = (dateString: string) => {
    onChange(dateString);
    setIsOpen(false);
  };

  // Helper: format ISO date string to readable human format (e.g. May 26, 2026)
  const displayValue = useMemo(() => {
    if (!selectedDate) return 'Select date...';
    return `${MONTH_NAMES[selectedDate.getMonth()]} ${selectedDate.getDate()}, ${selectedDate.getFullYear()}`;
  }, [selectedDate]);

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      {label && (
        <label className="block text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-1.5">
          {label}
        </label>
      )}

      {/* Selector Trigger Input-Mimic Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 bg-background/50 border border-border/80 rounded-2xl text-foreground focus:border-foreground/45 transition-all duration-300 outline-none backdrop-blur-md text-sm flex items-center justify-between text-left cursor-pointer hover:bg-surface-elevated/20"
      >
        <span className="flex items-center gap-3">
          <CalendarIcon size={14} className="text-muted-foreground shrink-0" />
          <span className={selectedDate ? 'text-foreground' : 'text-muted-foreground'}>
            {displayValue}
          </span>
        </span>
      </button>

      {/* Calendar Overlay Dropdown Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.18, type: 'spring', stiffness: 300, damping: 25 }}
            className="absolute z-50 w-[290px] mt-2 rounded-2xl border border-border bg-surface p-4 shadow-2xl backdrop-blur-xl select-none"
          >
            {/* Header controls */}
            <div className="flex items-center justify-between mb-3.5">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="p-1.5 rounded-lg hover:bg-surface-elevated/80 border border-border/40 text-muted-foreground hover:text-foreground transition active:scale-95 cursor-pointer"
              >
                <ChevronLeft size={14} />
              </button>
              <div className="text-xs font-bold text-foreground font-sans">
                {MONTH_NAMES[navMonth]} {navYear}
              </div>
              <button
                type="button"
                onClick={handleNextMonth}
                className="p-1.5 rounded-lg hover:bg-surface-elevated/80 border border-border/40 text-muted-foreground hover:text-foreground transition active:scale-95 cursor-pointer"
              >
                <ChevronRight size={14} />
              </button>
            </div>

            {/* Week days labels */}
            <div className="grid grid-cols-7 gap-1 text-center mb-1.5">
              {WEEK_DAYS.map((day) => (
                <div key={day} className="text-[10px] font-bold text-muted-foreground/60 uppercase">
                  {day}
                </div>
              ))}
            </div>

            {/* Days grid */}
            <div className="grid grid-cols-7 gap-1">
              {cells.map((cell, idx) => {
                const isSelected = value === cell.dateString;
                const isToday = cell.dateString === formatDateISO(new Date());

                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectDay(cell.dateString)}
                    className={`h-8 w-8 text-xs rounded-xl flex items-center justify-center font-medium transition cursor-pointer relative ${
                      isSelected
                        ? 'bg-foreground text-background font-bold'
                        : isToday
                        ? 'border border-foreground/30 text-foreground font-semibold bg-foreground/5'
                        : cell.isCurrentMonth
                        ? 'text-foreground hover:bg-surface-elevated'
                        : 'text-foreground/30 hover:bg-surface-elevated/40'
                    }`}
                  >
                    <span>{cell.day}</span>
                    {isToday && !isSelected && (
                      <span className="absolute bottom-1 h-1 w-1 rounded-full bg-foreground" />
                    )}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {error && <p className="text-red-400 text-xs mt-1 font-medium">{error}</p>}
    </div>
  );
}

// Manually format Date object to yyyy-MM-dd format in local timezone bounds
function formatDateISO(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
