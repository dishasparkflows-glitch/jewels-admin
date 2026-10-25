import React, { useState, useRef, useEffect, useId, useCallback } from 'react';
import {
  HiOutlineCalendar,
  HiOutlineChevronLeft,
  HiOutlineChevronRight,
  HiOutlineChevronDown,
  HiOutlineClock,
  HiOutlineX,
} from 'react-icons/hi';

/**
 * Helper to format date into YYYY-MM-DD string
 */
export const formatDateToISO = (date) => {
  if (!date || isNaN(new Date(date).getTime())) return '';
  const d = new Date(date);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

/**
 * Helper to format datetime into YYYY-MM-DDTHH:mm string
 */
export const formatDateTimeToISO = (date) => {
  if (!date || isNaN(new Date(date).getTime())) return '';
  const d = new Date(date);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

/**
 * Helper to format date for human-readable display
 */
export const formatDateDisplay = (dateStr, includeTime = false) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return String(dateStr);

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const day = d.getDate();
  const month = months[d.getMonth()];
  const year = d.getFullYear();

  if (!includeTime) {
    return `${day} ${month} ${year}`;
  }

  let hours = d.getHours();
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;
  return `${day} ${month} ${year}, ${String(hours).padStart(2, '0')}:${minutes} ${ampm}`;
};

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const WEEKDAY_NAMES = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

/**
 * Common Luxury DatePicker Component
 *
 * Matches the Neirah luxury design system.
 * Supports single date selection, optional time picker, quick month/year jumps,
 * smart auto-flip (opens upward when near bottom of modal/screen), custom triggers,
 * and standard YYYY-MM-DD or YYYY-MM-DDTHH:mm formats.
 *
 * @param {string|Date} value - Current value (e.g. "2026-10-18" or "2026-10-18T14:30")
 * @param {Function} onChange - (valueString, syntheticEvent) => void
 * @param {string} [name] - Input name attribute for forms
 * @param {string} [label] - Top label text
 * @param {string} [placeholder='Select date'] - Trigger placeholder
 * @param {boolean} [required=false] - Required indicator
 * @param {boolean} [disabled=false] - Disable interaction
 * @param {boolean} [includeTime=false] - Include time picker (hours & minutes)
 * @param {string|Date} [minDate] - Minimum selectable date
 * @param {string|Date} [maxDate] - Maximum selectable date
 * @param {'auto'|'down'|'up'} [direction='auto'] - Direction popup opens
 * @param {boolean} [openUpward=false] - Force opening upward
 * @param {'sm'|'md'|'lg'} [size='md'] - Trigger button size
 * @param {string} [className=''] - Container className
 * @param {string} [buttonClassName=''] - Trigger button custom className
 * @param {string} [popupClassName=''] - Calendar popup custom className
 * @param {React.ReactNode} [children] - Custom trigger element (replaces default input trigger)
 */
export default function DatePicker({
  value,
  onChange,
  name,
  label,
  placeholder = 'Select date',
  required = false,
  disabled = false,
  includeTime = false,
  minDate,
  maxDate,
  direction = 'auto',
  openUpward = false,
  size = 'md',
  className = '',
  buttonClassName = '',
  popupClassName = '',
  children,
  id,
}) {
  const generatedId = useId();
  const inputId = id || generatedId;

  const [isOpen, setIsOpen] = useState(false);
  const [dropUp, setDropUp] = useState(openUpward || direction === 'up');
  const [isMonthYearPickerOpen, setIsMonthYearPickerOpen] = useState(false);

  // Parse initial selected date
  const parseDateValue = useCallback((val) => {
    if (!val) return null;
    const d = new Date(val);
    return isNaN(d.getTime()) ? null : d;
  }, []);

  const parsedVal = parseDateValue(value);

  // Month & year currently shown in calendar view
  const [viewDate, setViewDate] = useState(() => {
    if (parsedVal) {
      return new Date(parsedVal.getFullYear(), parsedVal.getMonth(), 1);
    }
    return new Date();
  });

  // Date currently selected (pending Apply)
  const [selectedDate, setSelectedDate] = useState(parsedVal);

  // Time state (hours & minutes)
  const [timeHours, setTimeHours] = useState(() => {
    if (parsedVal) return parsedVal.getHours();
    return 12;
  });
  const [timeMinutes, setTimeMinutes] = useState(() => {
    if (parsedVal) return parsedVal.getMinutes();
    return 0;
  });

  const containerRef = useRef(null);
  const triggerRef = useRef(null);
  const popupRef = useRef(null);

  // Sync internal state when prop value changes
  useEffect(() => {
    const updated = parseDateValue(value);
    setSelectedDate(updated);
    if (updated) {
      setViewDate(new Date(updated.getFullYear(), updated.getMonth(), 1));
      setTimeHours(updated.getHours());
      setTimeMinutes(updated.getMinutes());
    }
  }, [value, parseDateValue]);

  // Handle smart auto-flip (open upward when near bottom of viewport or modal)
  useEffect(() => {
    if (openUpward || direction === 'up') {
      setDropUp(true);
      return;
    }
    if (direction === 'down') {
      setDropUp(false);
      return;
    }

    if (isOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const estimatedPopupHeight = includeTime ? 440 : 380;
      let spaceBelow = window.innerHeight - rect.bottom;
      let spaceAbove = rect.top;

      // Check nearest scrollable parent container / modal boundary
      let parent = containerRef.current?.parentElement;
      while (parent && parent !== document.body) {
        const style = window.getComputedStyle(parent);
        const overflow = style.overflowY || style.overflow;
        if (overflow === 'auto' || overflow === 'scroll' || overflow === 'hidden') {
          const parentRect = parent.getBoundingClientRect();
          const pBelow = parentRect.bottom - rect.bottom;
          const pAbove = rect.top - parentRect.top;
          if (pBelow < spaceBelow) spaceBelow = pBelow;
          if (pAbove < spaceAbove) spaceAbove = pAbove;
          break;
        }
        parent = parent.parentElement;
      }

      if (spaceBelow < estimatedPopupHeight && spaceAbove > spaceBelow) {
        setDropUp(true);
      } else {
        setDropUp(false);
      }
    }
  }, [isOpen, direction, openUpward, includeTime]);

  // Close on outside pointer click
  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        handleCancel();
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        handleCancel();
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  // Calendar math for days grid
  const currentYear = viewDate.getFullYear();
  const currentMonth = viewDate.getMonth();

  const daysInCurrentMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const startingDayOfWeek = new Date(currentYear, currentMonth, 1).getDay(); // 0 = Sunday
  const daysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate();

  // Trailing days from previous month
  const prevMonthDays = [];
  for (let i = startingDayOfWeek - 1; i >= 0; i--) {
    prevMonthDays.push({
      day: daysInPrevMonth - i,
      month: currentMonth - 1,
      year: currentYear,
      isCurrentMonth: false,
    });
  }

  // Days of current month
  const currentMonthDays = [];
  for (let d = 1; d <= daysInCurrentMonth; d++) {
    currentMonthDays.push({
      day: d,
      month: currentMonth,
      year: currentYear,
      isCurrentMonth: true,
    });
  }

  // Leading days of next month to fill complete 42-cell calendar grid
  const totalSlots = 42;
  const nextMonthDaysCount = totalSlots - (prevMonthDays.length + currentMonthDays.length);
  const nextMonthDays = [];
  for (let d = 1; d <= nextMonthDaysCount; d++) {
    nextMonthDays.push({
      day: d,
      month: currentMonth + 1,
      year: currentYear,
      isCurrentMonth: false,
    });
  }

  const allCalendarDays = [...prevMonthDays, ...currentMonthDays, ...nextMonthDays];

  // Month navigation handlers
  const handlePrevMonth = (e) => {
    e.stopPropagation();
    setViewDate(new Date(currentYear, currentMonth - 1, 1));
  };

  const handleNextMonth = (e) => {
    e.stopPropagation();
    setViewDate(new Date(currentYear, currentMonth + 1, 1));
  };

  // Day click handler - immediately applies selected date and closes popup
  const handleDayClick = (cell) => {
    const targetDate = new Date(cell.year, cell.month, cell.day);
    if (includeTime) {
      targetDate.setHours(timeHours, timeMinutes, 0, 0);
      setSelectedDate(targetDate);
      if (!cell.isCurrentMonth) {
        setViewDate(new Date(cell.year, cell.month, 1));
      }
      return;
    }

    // Immediately set date, trigger onChange, and close popup (no need to click apply)
    setSelectedDate(targetDate);
    emitChange(formatDateToISO(targetDate));
    setIsOpen(false);
    setIsMonthYearPickerOpen(false);
  };

  // Quick select Today handler
  const handleSelectToday = (e) => {
    if (e) e.preventDefault();
    const today = new Date();
    setSelectedDate(today);
    if (includeTime) {
      today.setHours(timeHours, timeMinutes, 0, 0);
      emitChange(formatDateTimeToISO(today));
    } else {
      emitChange(formatDateToISO(today));
    }
    setIsOpen(false);
    setIsMonthYearPickerOpen(false);
  };

  // Emit change to consumer
  const emitChange = (valStr) => {
    if (!onChange) return;
    const syntheticEvent = {
      target: { name: name || '', value: valStr },
      currentTarget: { name: name || '', value: valStr },
    };
    // Support both (val) => ... and (e) => e.target.value
    onChange(valStr, syntheticEvent);
    if (name) {
      onChange(syntheticEvent);
    }
  };

  // Actions
  const handleApply = (e) => {
    if (e) e.preventDefault();
    if (!selectedDate) {
      emitChange('');
      setIsOpen(false);
      return;
    }

    const finalDate = new Date(selectedDate);
    if (includeTime) {
      finalDate.setHours(timeHours, timeMinutes, 0, 0);
      emitChange(formatDateTimeToISO(finalDate));
    } else {
      emitChange(formatDateToISO(finalDate));
    }
    setIsOpen(false);
    setIsMonthYearPickerOpen(false);
  };

  const handleClear = (e) => {
    if (e) e.preventDefault();
    setSelectedDate(null);
    emitChange('');
    setIsOpen(false);
    setIsMonthYearPickerOpen(false);
  };

  const handleCancel = (e) => {
    if (e) e.preventDefault();
    const original = parseDateValue(value);
    setSelectedDate(original);
    if (original) {
      setViewDate(new Date(original.getFullYear(), original.getMonth(), 1));
      setTimeHours(original.getHours());
      setTimeMinutes(original.getMinutes());
    }
    setIsOpen(false);
    setIsMonthYearPickerOpen(false);
  };

  // Quick Year jump in Month/Year view
  const handleYearChange = (delta) => {
    setViewDate(new Date(currentYear + delta, currentMonth, 1));
  };

  const handleSelectMonth = (mIdx) => {
    setViewDate(new Date(currentYear, mIdx, 1));
    setIsMonthYearPickerOpen(false);
  };

  // Check if a calendar cell matches the selected date
  const isCellSelected = (cell) => {
    if (!selectedDate) return false;
    return (
      selectedDate.getFullYear() === cell.year &&
      selectedDate.getMonth() === cell.month &&
      selectedDate.getDate() === cell.day
    );
  };

  // Check if a calendar cell is today
  const isCellToday = (cell) => {
    const today = new Date();
    return (
      today.getFullYear() === cell.year &&
      today.getMonth() === cell.month &&
      today.getDate() === cell.day
    );
  };

  // Check min / max date constraints
  const isCellDisabled = (cell) => {
    const d = new Date(cell.year, cell.month, cell.day);
    if (minDate) {
      const min = new Date(minDate);
      min.setHours(0, 0, 0, 0);
      if (d < min) return true;
    }
    if (maxDate) {
      const max = new Date(maxDate);
      max.setHours(23, 59, 59, 999);
      if (d > max) return true;
    }
    return false;
  };

  // Sizes for the input trigger
  const sizeStyles = {
    sm: 'h-8 px-2.5 text-xs rounded-lg gap-1.5',
    md: 'h-11 px-3.5 text-xs sm:text-[13px] rounded-xl gap-2',
    lg: 'h-12 px-4 text-sm rounded-xl gap-2.5',
  }[size] || 'h-11 px-3.5 text-xs sm:text-[13px] rounded-xl gap-2';

  const displayString = formatDateDisplay(value, includeTime);

  return (
    <div
      ref={containerRef}
      className={`relative inline-block w-full font-sans text-left ${className}`}
    >
      {/* Optional Top Label */}
      {label && (
        <label
          htmlFor={inputId}
          className="block text-[11px] font-bold tracking-wider text-stone-500 uppercase mb-1.5 select-none"
        >
          {required && <span className="text-rose-500 mr-1">*</span>}
          {label}
        </label>
      )}

      {/* Trigger: Either custom child OR default luxury input button */}
      {children ? (
        <div
          ref={triggerRef}
          onClick={() => !disabled && setIsOpen(!isOpen)}
          className="cursor-pointer"
        >
          {children}
        </div>
      ) : (
        <button
          ref={triggerRef}
          id={inputId}
          type="button"
          disabled={disabled}
          onClick={() => !disabled && setIsOpen(!isOpen)}
          className={`w-full flex items-center justify-between text-left font-medium transition-all duration-150 outline-none cursor-pointer bg-white border border-stone-200 hover:border-stone-300 focus:border-[#8a6d4b] focus:ring-2 focus:ring-[#8a6d4b]/15 shadow-2xs text-stone-800 ${
            sizeStyles
          } ${
            isOpen ? 'border-[#8a6d4b] ring-2 ring-[#8a6d4b]/20' : ''
          } ${
            disabled ? 'opacity-50 cursor-not-allowed bg-stone-100/60' : ''
          } ${buttonClassName}`}
        >
          <div className="flex items-center gap-2 truncate min-w-0">
            <HiOutlineCalendar className="w-4 h-4 text-[#8a6d4b] shrink-0" />
            <span
              className={`truncate ${
                !displayString ? 'text-stone-400 font-normal' : 'text-stone-900 font-medium'
              }`}
            >
              {displayString || placeholder}
            </span>
          </div>

          <div className="flex items-center gap-1 shrink-0 ml-2">
            {value && !disabled && (
              <span
                role="button"
                tabIndex={0}
                onClick={(e) => {
                  e.stopPropagation();
                  handleClear(e);
                }}
                className="p-1 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-full transition-colors cursor-pointer"
                title="Clear date"
              >
                <HiOutlineX className="w-3.5 h-3.5" />
              </span>
            )}
            <HiOutlineChevronDown
              className={`w-3.5 h-3.5 text-stone-400 transition-transform duration-200 ${
                isOpen ? 'rotate-180 text-[#8a6d4b]' : ''
              }`}
            />
          </div>
        </button>
      )}

      {/* ─── Luxury DatePicker Pop-up (Matches User Screenshot) ─── */}
      {isOpen && (
        <div
          ref={popupRef}
          className={`absolute left-0 z-[70] w-[320px] sm:w-[330px] max-w-[calc(100vw-1.5rem)] p-4 sm:p-5 bg-white rounded-2xl sm:rounded-3xl border border-stone-200/90 shadow-2xl shadow-stone-900/15 backdrop-blur-md transition-all animate-scaleUp select-none ${
            dropUp
              ? 'bottom-full mb-2 origin-bottom'
              : 'top-full mt-2 origin-top'
          } ${popupClassName}`}
        >
          {/* Header: < Month Year ⌵ > */}
          <div className="flex items-center justify-between mb-4">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="w-8 h-8 rounded-xl flex items-center justify-center text-stone-700 hover:bg-stone-100 hover:text-black transition-colors cursor-pointer"
              title="Previous Month"
            >
              <HiOutlineChevronLeft className="w-4 h-4 stroke-[2.5]" />
            </button>

            {/* Clickable Month & Year title */}
            <button
              type="button"
              onClick={() => setIsMonthYearPickerOpen(!isMonthYearPickerOpen)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[15px] font-bold text-stone-900 hover:bg-stone-100 hover:text-[#8a6d4b] transition-colors cursor-pointer"
            >
              <span>{MONTH_NAMES[currentMonth]} {currentYear}</span>
              <HiOutlineChevronDown
                className={`w-3.5 h-3.5 text-stone-500 transition-transform duration-200 ${
                  isMonthYearPickerOpen ? 'rotate-180 text-[#8a6d4b]' : ''
                }`}
              />
            </button>

            <button
              type="button"
              onClick={handleNextMonth}
              className="w-8 h-8 rounded-xl flex items-center justify-center text-stone-700 hover:bg-stone-100 hover:text-black transition-colors cursor-pointer"
              title="Next Month"
            >
              <HiOutlineChevronRight className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>

          {/* Quick Month & Year jump overlay */}
          {isMonthYearPickerOpen ? (
            <div className="py-2 space-y-3">
              {/* Year stepper */}
              <div className="flex items-center justify-between px-2 py-1 bg-stone-50 rounded-xl border border-stone-200/60">
                <button
                  type="button"
                  onClick={() => handleYearChange(-1)}
                  className="p-1 text-stone-600 hover:text-black hover:bg-white rounded-lg transition-colors cursor-pointer"
                >
                  <HiOutlineChevronLeft className="w-4 h-4" />
                </button>
                <span className="font-bold text-sm text-stone-900">{currentYear}</span>
                <button
                  type="button"
                  onClick={() => handleYearChange(1)}
                  className="p-1 text-stone-600 hover:text-black hover:bg-white rounded-lg transition-colors cursor-pointer"
                >
                  <HiOutlineChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* 12 Months Grid */}
              <div className="grid grid-cols-3 gap-2">
                {MONTH_NAMES.map((mName, idx) => {
                  const isCur = idx === currentMonth;
                  return (
                    <button
                      key={mName}
                      type="button"
                      onClick={() => handleSelectMonth(idx)}
                      className={`py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                        isCur
                          ? 'bg-[#8a6d4b] text-white shadow-xs'
                          : 'bg-stone-50 text-stone-700 hover:bg-stone-100 hover:text-[#8a6d4b]'
                      }`}
                    >
                      {mName.slice(0, 3)}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <>
              {/* Weekday Row: Su Mo Tu We Th Fr Sa */}
              <div className="grid grid-cols-7 gap-1 text-center mb-2">
                {WEEKDAY_NAMES.map((day) => (
                  <span
                    key={day}
                    className="text-xs font-semibold text-stone-400 py-1"
                  >
                    {day}
                  </span>
                ))}
              </div>

              {/* 42-cell Days Grid */}
              <div className="grid grid-cols-7 gap-1 text-center">
                {allCalendarDays.map((cell, idx) => {
                  const selected = isCellSelected(cell);
                  const isToday = isCellToday(cell);
                  const disabledDay = isCellDisabled(cell);

                  return (
                    <button
                      key={idx}
                      type="button"
                      disabled={disabledDay}
                      onClick={() => !disabledDay && handleDayClick(cell)}
                      className={`h-9 w-9 mx-auto rounded-xl flex items-center justify-center text-xs font-medium transition-all duration-150 cursor-pointer ${
                        disabledDay
                          ? 'opacity-25 cursor-not-allowed hover:bg-transparent'
                          : selected
                          ? 'bg-[#8a6d4b] text-white font-bold shadow-md shadow-[#8a6d4b]/25 hover:bg-[#785b3a]'
                          : !cell.isCurrentMonth
                          ? 'text-stone-300 hover:text-stone-600 hover:bg-stone-50'
                          : isToday
                          ? 'text-[#8a6d4b] font-bold bg-[#8a6d4b]/10 hover:bg-[#8a6d4b]/20'
                          : 'text-stone-800 hover:bg-stone-100 hover:text-stone-900'
                      }`}
                    >
                      {cell.day}
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {/* Optional Time Selector (for includeTime / datetime-local) */}
          {includeTime && (
            <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 text-stone-500 font-semibold">
                <HiOutlineClock className="w-4 h-4 text-[#8a6d4b]" />
                <span>Time:</span>
              </div>
              <div className="flex items-center gap-1">
                <select
                  value={timeHours}
                  onChange={(e) => setTimeHours(Number(e.target.value))}
                  className="px-2 py-1 bg-stone-50 border border-stone-200 rounded-lg text-xs font-bold text-stone-800 focus:outline-none focus:border-[#8a6d4b]"
                >
                  {Array.from({ length: 24 }).map((_, h) => (
                    <option key={h} value={h}>
                      {String(h).padStart(2, '0')}:00
                    </option>
                  ))}
                </select>
                <span className="text-stone-400 font-bold">:</span>
                <select
                  value={timeMinutes}
                  onChange={(e) => setTimeMinutes(Number(e.target.value))}
                  className="px-2 py-1 bg-stone-50 border border-stone-200 rounded-lg text-xs font-bold text-stone-800 focus:outline-none focus:border-[#8a6d4b]"
                >
                  {[0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55].map((m) => (
                    <option key={m} value={m}>
                      {String(m).padStart(2, '0')}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="mt-5 pt-3.5 border-t border-stone-100 flex items-center justify-between">
            <button
              type="button"
              onClick={handleClear}
              className="text-xs sm:text-[13px] font-semibold text-[#8a6d4b] hover:text-[#6e5334] transition-colors cursor-pointer"
            >
              Clear
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSelectToday}
                className="px-3.5 py-1.5 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-stone-700 text-xs sm:text-[13px] font-medium transition-colors cursor-pointer shadow-2xs"
              >
                Today
              </button>

              {includeTime ? (
                <button
                  type="button"
                  onClick={handleApply}
                  className="px-4 py-1.5 rounded-xl bg-[#8a6d4b] hover:bg-[#785b3a] text-white text-xs sm:text-[13px] font-semibold transition-colors shadow-xs cursor-pointer"
                >
                  Apply
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-3.5 py-1.5 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-stone-700 text-xs sm:text-[13px] font-medium transition-colors cursor-pointer shadow-2xs"
                >
                  Close
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
