import { useState, useRef, useEffect, useLayoutEffect, useId, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  HiOutlineCalendar,
  HiOutlineChevronLeft,
  HiOutlineChevronRight,
  HiOutlineChevronDown,
  HiOutlineClock,
  HiOutlineX,
} from 'react-icons/hi';

const PopupLayer = ({ enabled, children }) =>
  enabled && typeof document !== 'undefined' ? createPortal(children, document.body) : children;

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
 * Matches the luxury design system.
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
  portal = true,
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
  const [popupPosition, setPopupPosition] = useState({});

  // Parse date string/Date safely at local midnight for YYYY-MM-DD inputs
  const parseDateValue = useCallback((val) => {
    if (!val) return null;
    if (val instanceof Date) {
      return isNaN(val.getTime()) ? null : new Date(val.getTime());
    }
    const raw = String(val).trim();
    const isoDateOnly = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (isoDateOnly) {
      const [, y, m, d] = isoDateOnly;
      return new Date(Number(y), Number(m) - 1, Number(d));
    }
    const d = new Date(raw);
    return isNaN(d.getTime()) ? null : d;
  }, []);

  const parsedVal = parseDateValue(value);

  const normalizeDay = useCallback((d) => {
    if (!d) return null;
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  }, []);

  const clampDateToBounds = useCallback(
    (date) => {
      let target = normalizeDay(date);
      if (!target) return null;
      const min = normalizeDay(parseDateValue(minDate));
      const max = normalizeDay(parseDateValue(maxDate));
      if (min && target < min) target = new Date(min.getTime());
      if (max && target > max) target = new Date(max.getTime());
      return target;
    },
    [minDate, maxDate, normalizeDay, parseDateValue]
  );

  // Month & year currently shown in calendar view
  const [viewDate, setViewDate] = useState(() => {
    if (parsedVal) {
      return new Date(parsedVal.getFullYear(), parsedVal.getMonth(), 1);
    }
    return new Date();
  });

  // Date currently selected (pending Apply when includeTime=true)
  const [selectedDate, setSelectedDate] = useState(parsedVal);

  // Keyboard-highlighted date inside the calendar grid
  const [focusedDate, setFocusedDate] = useState(() => clampDateToBounds(parsedVal || new Date()));

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
  const isPointerDownRef = useRef(false);

  const openCalendar = useCallback(() => {
    const initialFocus = clampDateToBounds(selectedDate || parseDateValue(value) || new Date());
    if (initialFocus) {
      setFocusedDate(initialFocus);
      setViewDate(new Date(initialFocus.getFullYear(), initialFocus.getMonth(), 1));
    }
    setIsOpen(true);
  }, [clampDateToBounds, selectedDate, parseDateValue, value]);

  const handleTriggerPointerDown = () => {
    isPointerDownRef.current = true;
  };

  const handleClick = () => {
    if (disabled) return;
    isPointerDownRef.current = false;
    if (isOpen) {
      setIsOpen(false);
      setIsMonthYearPickerOpen(false);
    } else {
      openCalendar();
    }
  };

  // Keyboard Tab focus automatically opens the date box
  const handleFocus = () => {
    if (disabled) return;
    // If focused by a mouse pointer down, do not auto-open; handleClick handles toggle
    if (isPointerDownRef.current) return;
    openCalendar();
  };

  // Tabbing away or blurring outside container closes the date box
  const handleBlur = (e) => {
    if (
      e.relatedTarget &&
      (containerRef.current?.contains(e.relatedTarget) || popupRef.current?.contains(e.relatedTarget))
    ) {
      return;
    }
    if (!e.relatedTarget) {
      return;
    }
    setIsOpen(false);
    setIsMonthYearPickerOpen(false);
  };

  const stepFocusedDate = useCallback(
    ({ days = 0, months = 0 }) => {
      const base = focusedDate || clampDateToBounds(selectedDate || new Date()) || normalizeDay(new Date());
      const candidate =
        months !== 0
          ? new Date(base.getFullYear(), base.getMonth() + months, base.getDate())
          : new Date(base.getFullYear(), base.getMonth(), base.getDate() + days);

      // Handle month rollover when target month has fewer days (e.g. Jan 31 + 1 month)
      if (months !== 0 && candidate.getDate() !== base.getDate()) {
        candidate.setDate(0);
      }

      const clamped = clampDateToBounds(candidate);
      if (!clamped) return;
      setFocusedDate(clamped);
      setViewDate(new Date(clamped.getFullYear(), clamped.getMonth(), 1));
    },
    [focusedDate, clampDateToBounds, selectedDate, normalizeDay]
  );

  const commitDateSelection = useCallback(
    (targetDate) => {
      if (!targetDate) return;
      const normalized = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
      const min = normalizeDay(parseDateValue(minDate));
      const max = normalizeDay(parseDateValue(maxDate));
      if ((min && normalized < min) || (max && normalized > max)) {
        return;
      }

      if (includeTime) {
        normalized.setHours(timeHours, timeMinutes, 0, 0);
        const alreadySameDay =
          selectedDate &&
          selectedDate.getFullYear() === normalized.getFullYear() &&
          selectedDate.getMonth() === normalized.getMonth() &&
          selectedDate.getDate() === normalized.getDate();

        setSelectedDate(normalized);
        setViewDate(new Date(normalized.getFullYear(), normalized.getMonth(), 1));
        if (alreadySameDay) {
          emitChange(formatDateTimeToISO(normalized));
          setIsOpen(false);
          setIsMonthYearPickerOpen(false);
        }
        return;
      }

      setSelectedDate(normalized);
      setFocusedDate(normalized);
      emitChange(formatDateToISO(normalized));
      setIsOpen(false);
      setIsMonthYearPickerOpen(false);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [includeTime, timeHours, timeMinutes, selectedDate, minDate, maxDate, normalizeDay, parseDateValue]
  );

  // Keyboard navigation on trigger button (and calendar when opened via Tab/keyboard)
  const handleKeyDown = (e) => {
    if (e.key === 'Tab') {
      // When tabbing out to the next field, close this date box cleanly
      setIsOpen(false);
      setIsMonthYearPickerOpen(false);
      return;
    }

    if (e.key === 'Escape') {
      if (isOpen) {
        e.preventDefault();
        e.stopPropagation();
        handleCancel();
      }
      return;
    }

    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft' || e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      e.stopPropagation();
      if (!isOpen) {
        openCalendar();
        return;
      }
      if (isMonthYearPickerOpen) {
        if (e.key === 'ArrowLeft') stepFocusedDate({ months: -1 });
        else if (e.key === 'ArrowRight') stepFocusedDate({ months: 1 });
        else if (e.key === 'ArrowUp') stepFocusedDate({ months: -3 });
        else if (e.key === 'ArrowDown') stepFocusedDate({ months: 3 });
        return;
      }
      if (e.key === 'ArrowRight') stepFocusedDate({ days: 1 });
      else if (e.key === 'ArrowLeft') stepFocusedDate({ days: -1 });
      else if (e.key === 'ArrowDown') stepFocusedDate({ days: 7 });
      else if (e.key === 'ArrowUp') stepFocusedDate({ days: -7 });
      return;
    }

    if (e.key === 'PageUp' || e.key === 'PageDown') {
      if (!isOpen) return;
      e.preventDefault();
      e.stopPropagation();
      stepFocusedDate({ months: e.key === 'PageUp' ? -1 : 1 });
      return;
    }

    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      e.stopPropagation();
      if (!isOpen) {
        openCalendar();
        return;
      }
      if (isMonthYearPickerOpen) {
        setIsMonthYearPickerOpen(false);
        return;
      }
      const target = focusedDate || clampDateToBounds(selectedDate || new Date());
      if (target) {
        commitDateSelection(target);
      }
    }
  };

  // Sync internal state when prop value changes
  useEffect(() => {
    const updated = parseDateValue(value);
    setSelectedDate(updated);
    if (updated) {
      setViewDate(new Date(updated.getFullYear(), updated.getMonth(), 1));
      setFocusedDate(clampDateToBounds(updated));
      setTimeHours(updated.getHours());
      setTimeMinutes(updated.getMinutes());
    }
  }, [value, parseDateValue, clampDateToBounds]);

  // Compute and update portal popup position anchored to trigger
  const updatePopupPosition = useCallback(() => {
    const anchor = triggerRef.current || containerRef.current;
    if (!anchor) return;
    const rect = anchor.getBoundingClientRect();
    if (!rect || (rect.width === 0 && rect.height === 0)) return;

    const estimatedPopupHeight = includeTime ? 440 : 380;
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    const shouldDropUp =
      openUpward ||
      direction === 'up' ||
      (direction !== 'down' && spaceBelow < estimatedPopupHeight && spaceAbove > spaceBelow);
    setDropUp(shouldDropUp);

    const targetWidth = Math.min(330, window.innerWidth - 16);
    let left = Math.round(rect.left);
    if (left + targetWidth > window.innerWidth - 8) {
      left = Math.max(8, window.innerWidth - targetWidth - 8);
    }

    setPopupPosition({
      position: 'fixed',
      left,
      width: targetWidth,
      top: shouldDropUp ? 'auto' : Math.round(rect.bottom + 6),
      bottom: shouldDropUp ? Math.round(window.innerHeight - rect.top + 6) : 'auto',
      zIndex: 100000,
    });
  }, [direction, openUpward, includeTime]);

  useLayoutEffect(() => {
    if (!isOpen || !portal) return;
    updatePopupPosition();
    window.addEventListener('resize', updatePopupPosition);
    window.addEventListener('scroll', updatePopupPosition, true);
    return () => {
      window.removeEventListener('resize', updatePopupPosition);
      window.removeEventListener('scroll', updatePopupPosition, true);
    };
  }, [isOpen, portal, updatePopupPosition]);

  // Handle smart auto-flip (open upward when near bottom of viewport or modal) when NOT portaled
  useEffect(() => {
    if (portal) return;
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
  }, [isOpen, direction, openUpward, includeTime, portal]);

  // Close on outside pointer click or Escape (capture phase so parent modals stay open)
  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (e) => {
      const insideContainer = containerRef.current && containerRef.current.contains(e.target);
      const insidePopup = popupRef.current && popupRef.current.contains(e.target);
      if (!insideContainer && !insidePopup) {
        handleCancel();
      }
    };

    const handleGlobalKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        handleCancel();
        triggerRef.current?.focus();
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('keydown', handleGlobalKeyDown, true);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('keydown', handleGlobalKeyDown, true);
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
    setFocusedDate(targetDate);
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

  // Check if a calendar cell is keyboard-focused
  const isCellFocused = (cell) => {
    if (!focusedDate) return false;
    const resolved = new Date(cell.year, cell.month, cell.day);
    return (
      focusedDate.getFullYear() === resolved.getFullYear() &&
      focusedDate.getMonth() === resolved.getMonth() &&
      focusedDate.getDate() === resolved.getDate()
    );
  };

  // Check if a calendar cell matches the selected date
  const isCellSelected = (cell) => {
    if (!selectedDate) return false;
    const resolved = new Date(cell.year, cell.month, cell.day);
    return (
      selectedDate.getFullYear() === resolved.getFullYear() &&
      selectedDate.getMonth() === resolved.getMonth() &&
      selectedDate.getDate() === resolved.getDate()
    );
  };

  // Check if a calendar cell is today
  const isCellToday = (cell) => {
    const today = new Date();
    const resolved = new Date(cell.year, cell.month, cell.day);
    return (
      today.getFullYear() === resolved.getFullYear() &&
      today.getMonth() === resolved.getMonth() &&
      today.getDate() === resolved.getDate()
    );
  };

  // Check min / max date constraints
  const isCellDisabled = (cell) => {
    const d = new Date(cell.year, cell.month, cell.day);
    const min = normalizeDay(parseDateValue(minDate));
    if (min && d < min) return true;
    const max = normalizeDay(parseDateValue(maxDate));
    if (max && d > max) return true;
    return false;
  };

  // Sizes for the input trigger
  const sizeStyles = {
    sm: 'h-8 px-2.5 text-xs rounded-lg gap-1.5',
    md: 'h-10 px-3.5 text-xs sm:text-[13px] rounded-xl gap-2',
    lg: 'h-11 px-4 text-sm rounded-xl gap-2.5',
  }[size] || 'h-10 px-3.5 text-xs sm:text-[13px] rounded-xl gap-2';

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
          tabIndex={disabled ? -1 : 0}
          role="button"
          onClick={handleClick}
          onPointerDown={handleTriggerPointerDown}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className="cursor-pointer outline-none"
        >
          {children}
        </div>
      ) : (
        <button
          ref={triggerRef}
          id={inputId}
          type="button"
          disabled={disabled}
          onClick={handleClick}
          onPointerDown={handleTriggerPointerDown}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className={`w-full flex items-center justify-between text-left font-medium transition-all duration-150 outline-none cursor-pointer bg-white border border-stone-200 hover:border-stone-300 shadow-2xs text-stone-800 ${
            sizeStyles
          } ${
            isOpen ? 'border-[#8b6f4e] ring-2 ring-[#8b6f4e]/20' : ''
          } ${
            disabled ? 'opacity-50 cursor-not-allowed bg-stone-100/60' : ''
          } ${buttonClassName}`}
        >
          <div className="flex items-center gap-2 truncate min-w-0">
            <HiOutlineCalendar
              className="w-4 h-4 shrink-0"
              style={{ color: 'var(--theme-primary, #8b6f4e)' }}
            />
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
                tabIndex={-1}
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
                isOpen ? 'rotate-180' : ''
              }`}
              style={isOpen ? { color: 'var(--theme-primary, #8b6f4e)' } : {}}
            />
          </div>
        </button>
      )}

      {/* ─── Luxury DatePicker Pop-up (Matches User Screenshot) ─── */}
      {isOpen && (
        <PopupLayer enabled={portal}>
          <div
            ref={popupRef}
            data-datepicker-popup="true"
            style={portal ? popupPosition : undefined}
            onMouseDown={(e) => {
              const tag = e.target?.tagName;
              if (tag !== 'SELECT' && tag !== 'OPTION' && tag !== 'INPUT') {
                e.preventDefault();
              }
            }}
            onKeyDown={(e) => {
              if (e.key === 'ArrowLeft' || e.key === 'ArrowRight' || e.key === 'ArrowUp' || e.key === 'ArrowDown') {
                handleKeyDown(e);
              } else if (e.key === 'Enter' && e.target?.closest?.('[data-calendar-grid="true"]')) {
                handleKeyDown(e);
              } else if (e.key === 'Tab') {
                setIsOpen(false);
                setIsMonthYearPickerOpen(false);
              }
            }}
            className={`datepicker-popup ${
              portal
                ? ''
                : `absolute left-0 ${
                    dropUp ? 'bottom-full mb-2 origin-bottom' : 'top-full mt-2 origin-top'
                  }`
            } z-[100000] w-[320px] sm:w-[330px] max-w-[calc(100vw-1.5rem)] p-4 sm:p-5 bg-white rounded-2xl sm:rounded-3xl border border-stone-200/90 shadow-2xl shadow-stone-900/15 backdrop-blur-md transition-all animate-scaleUp select-none ${popupClassName}`}
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
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[15px] font-bold text-stone-900 hover:bg-stone-100 transition-colors cursor-pointer"
            >
              <span>{MONTH_NAMES[currentMonth]} {currentYear}</span>
              <HiOutlineChevronDown
                className={`w-3.5 h-3.5 text-stone-500 transition-transform duration-200 ${
                  isMonthYearPickerOpen ? 'rotate-180' : ''
                }`}
                style={isMonthYearPickerOpen ? { color: 'var(--theme-primary, #8b6f4e)' } : {}}
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
                          ? 'text-white shadow-xs'
                          : 'bg-stone-50 text-stone-700 hover:bg-stone-100'
                      }`}
                      style={
                        isCur
                          ? { backgroundColor: 'var(--theme-primary, #8b6f4e)', color: '#ffffff' }
                          : {}
                      }
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
              <div data-calendar-grid="true" className="grid grid-cols-7 gap-1 text-center">
                {allCalendarDays.map((cell, idx) => {
                  const selected = isCellSelected(cell);
                  const focused = isCellFocused(cell);
                  const isToday = isCellToday(cell);
                  const disabledDay = isCellDisabled(cell);

                  return (
                    <button
                      key={idx}
                      type="button"
                      disabled={disabledDay}
                      onMouseEnter={() => {
                        if (!disabledDay) {
                          setFocusedDate(new Date(cell.year, cell.month, cell.day));
                        }
                      }}
                      onClick={() => !disabledDay && handleDayClick(cell)}
                      className={`h-9 w-9 mx-auto rounded-xl flex items-center justify-center text-xs font-medium transition-all duration-150 cursor-pointer ${
                        disabledDay
                          ? 'opacity-25 cursor-not-allowed hover:bg-transparent'
                          : selected
                          ? `text-white font-bold shadow-md hover:opacity-90 ${focused ? 'ring-2 ring-offset-1' : ''}`
                          : focused
                          ? 'bg-stone-100 text-stone-900 font-bold ring-2'
                          : !cell.isCurrentMonth
                          ? 'text-stone-300 hover:text-stone-600 hover:bg-stone-50'
                          : isToday
                          ? 'font-bold'
                          : 'text-stone-800 hover:bg-stone-100 hover:text-stone-900'
                      }`}
                      style={
                        selected
                          ? {
                              backgroundColor: 'var(--theme-primary, #8b6f4e)',
                              color: '#ffffff',
                              ...(focused ? { '--tw-ring-color': 'var(--theme-primary, #8b6f4e)' } : {}),
                            }
                          : focused
                          ? {
                              '--tw-ring-color': 'var(--theme-primary, #8b6f4e)',
                              color: 'var(--theme-primary, #8b6f4e)',
                              backgroundColor: 'rgba(var(--theme-primary-rgb, 139, 111, 78), 0.14)',
                            }
                          : isToday && cell.isCurrentMonth
                          ? {
                              color: 'var(--theme-primary, #8b6f4e)',
                              backgroundColor: 'rgba(var(--theme-primary-rgb, 139, 111, 78), 0.12)',
                            }
                          : {}
                      }
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
              <div className="flex items-center gap-1.5 text-stone-600 font-semibold">
                <HiOutlineClock
                  className="w-4 h-4"
                  style={{ color: 'var(--theme-primary, #8b6f4e)' }}
                />
                <span>Time:</span>
              </div>
              <div className="flex items-center gap-1.5">
                <select
                  value={timeHours}
                  onChange={(e) => setTimeHours(Number(e.target.value))}
                  className="px-2 py-1.5 bg-stone-50 border border-stone-200 rounded-lg text-xs font-bold text-stone-800 focus:outline-none focus:ring-1 cursor-pointer"
                  style={{ outlineColor: 'var(--theme-primary, #8b6f4e)' }}
                >
                  {Array.from({ length: 24 }).map((_, h) => {
                    const ampm = h >= 12 ? 'PM' : 'AM';
                    const h12 = h % 12 || 12;
                    return (
                      <option key={h} value={h}>
                        {String(h).padStart(2, '0')}:00 ({h12} {ampm})
                      </option>
                    );
                  })}
                </select>
                <span className="text-stone-400 font-bold">:</span>
                <select
                  value={timeMinutes}
                  onChange={(e) => setTimeMinutes(Number(e.target.value))}
                  className="px-2 py-1.5 bg-stone-50 border border-stone-200 rounded-lg text-xs font-bold text-stone-800 focus:outline-none focus:ring-1 cursor-pointer"
                  style={{ outlineColor: 'var(--theme-primary, #8b6f4e)' }}
                >
                  {Array.from({ length: 60 }).map((_, m) => (
                    <option key={m} value={m}>
                      {String(m).padStart(2, '0')} min
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
              className="text-xs sm:text-[13px] font-semibold transition-colors cursor-pointer hover:underline"
              style={{ color: 'var(--theme-primary, #8b6f4e)' }}
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
                  className="px-4 py-1.5 rounded-xl text-white text-xs sm:text-[13px] font-semibold transition-colors shadow-xs cursor-pointer hover:opacity-90"
                  style={{ backgroundColor: 'var(--theme-primary, #8b6f4e)', color: '#ffffff' }}
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
      </PopupLayer>
    )}
  </div>
);
}
