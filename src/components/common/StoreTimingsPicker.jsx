import { useState, useRef, useEffect, useLayoutEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { HiOutlineClock, HiOutlineChevronDown, HiOutlineX } from 'react-icons/hi';

const DAYS_OF_WEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const HOURS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];
const BASE_MINUTES = ['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'];

const TIME_PRESETS = [
  {
    label: '10:00 AM – 8:30 PM',
    open: { hour: '10', minute: '00', period: 'AM' },
    close: { hour: '8', minute: '30', period: 'PM' },
  },
  {
    label: '10:30 AM – 8:30 PM',
    open: { hour: '10', minute: '30', period: 'AM' },
    close: { hour: '8', minute: '30', period: 'PM' },
  },
  {
    label: '11:00 AM – 8:30 PM',
    open: { hour: '11', minute: '00', period: 'AM' },
    close: { hour: '8', minute: '30', period: 'PM' },
  },
  {
    label: '10:30 AM – 9:00 PM',
    open: { hour: '10', minute: '30', period: 'AM' },
    close: { hour: '9', minute: '00', period: 'PM' },
  },
];

const DAY_PRESETS = [
  { label: 'Mon – Sun', fromDay: 'Mon', toDay: 'Sun' },
  { label: 'Mon – Sat', fromDay: 'Mon', toDay: 'Sat' },
  { label: 'Tue – Sun', fromDay: 'Tue', toDay: 'Sun' },
  { label: 'Mon – Fri', fromDay: 'Mon', toDay: 'Fri' },
];

const DEFAULT_PARTS = {
  open: { hour: '10', minute: '30', period: 'AM' },
  close: { hour: '8', minute: '30', period: 'PM' },
  fromDay: 'Mon',
  toDay: 'Sun',
};

const parseTimeToken = (token) => {
  const match = String(token || '')
    .trim()
    .match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return null;
  let hourNum = Number(match[1]);
  if (Number.isNaN(hourNum) || hourNum < 1 || hourNum > 12) {
    hourNum = 10;
  }
  return {
    hour: String(hourNum),
    minute: match[2].padStart(2, '0'),
    period: match[3].toUpperCase(),
  };
};

const normalizeDayToken = (dayStr) => {
  const cleaned = String(dayStr || '').trim().slice(0, 3).toLowerCase();
  return DAYS_OF_WEEK.find((d) => d.toLowerCase() === cleaned) || '';
};

const parseTimingsString = (raw) => {
  const str = String(raw || '').trim();
  if (!str) return null;

  const match = str.match(
    /^(\d{1,2}:\d{2}\s*(?:AM|PM))\s*(?:[-–—]|to)\s*(\d{1,2}:\d{2}\s*(?:AM|PM))(?:\s*\(([^)]+)\))?$/i
  );
  if (!match) return null;

  const open = parseTimeToken(match[1]);
  const close = parseTimeToken(match[2]);
  if (!open || !close) return null;

  let fromDay = 'Mon';
  let toDay = 'Sun';
  const daysRaw = (match[3] || '').trim();
  if (daysRaw) {
    const dayParts = daysRaw.split(/\s*(?:[-–—]|to)\s*/i).filter(Boolean);
    const parsedFrom = normalizeDayToken(dayParts[0]);
    const parsedTo = normalizeDayToken(dayParts[1] || dayParts[0]);
    if (parsedFrom) fromDay = parsedFrom;
    if (parsedTo) toDay = parsedTo;
  }

  return { open, close, fromDay, toDay };
};

const formatTimePart = ({ hour, minute, period }) => `${hour}:${minute} ${period}`;

const formatTimingsString = ({ open, close, fromDay, toDay }) => {
  const dayRange = fromDay === toDay ? fromDay : `${fromDay} – ${toDay}`;
  return `${formatTimePart(open)} – ${formatTimePart(close)} (${dayRange})`;
};

function TimeBlock({ title, time, onChange }) {
  const minuteOptions = useMemo(() => {
    if (BASE_MINUTES.includes(time.minute)) return BASE_MINUTES;
    return [...BASE_MINUTES, time.minute].sort((a, b) => Number(a) - Number(b));
  }, [time.minute]);

  return (
    <div className="p-2.5 rounded-xl bg-stone-50/90 border border-stone-200/80 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
          {title}
        </span>
        <span className="text-[11px] font-bold text-stone-800">{formatTimePart(time)}</span>
      </div>

      <div className="flex items-center gap-1.5">
        <select
          aria-label={`${title} hour`}
          value={time.hour}
          onChange={(e) => onChange({ ...time, hour: e.target.value })}
          className="flex-1 min-w-0 px-2 py-1.5 bg-white border border-stone-200 rounded-lg text-xs font-bold text-stone-800 focus:outline-none focus:border-[#8b6f4e] cursor-pointer"
        >
          {HOURS.map((h) => (
            <option key={h} value={h}>
              {h.padStart(2, '0')}
            </option>
          ))}
        </select>

        <span className="text-stone-400 font-bold text-xs">:</span>

        <select
          aria-label={`${title} minute`}
          value={time.minute}
          onChange={(e) => onChange({ ...time, minute: e.target.value })}
          className="flex-1 min-w-0 px-2 py-1.5 bg-white border border-stone-200 rounded-lg text-xs font-bold text-stone-800 focus:outline-none focus:border-[#8b6f4e] cursor-pointer"
        >
          {minuteOptions.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>

        <div className="inline-flex rounded-lg bg-white border border-stone-200 p-0.5 shrink-0">
          {['AM', 'PM'].map((p) => {
            const active = time.period === p;
            return (
              <button
                key={p}
                type="button"
                onClick={() => onChange({ ...time, period: p })}
                style={active ? { backgroundColor: 'var(--theme-primary, #8b6f4e)', color: '#ffffff' } : undefined}
                className={`px-2 py-1 rounded-md text-[11px] font-bold transition-colors cursor-pointer ${
                  active ? 'shadow-2xs' : 'text-stone-500 hover:text-stone-800'
                }`}
              >
                {p}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/**
 * StoreTimingsPicker
 *
 * Lets admins visually pick Opening Time, Closing Time, and Open Days while storing
 * a single formatted string field (e.g. "10:30 AM – 8:30 PM (Mon – Sun)").
 */
export default function StoreTimingsPicker({
  value = '',
  onChange,
  placeholder = 'Select store timings',
  disabled = false,
  className = '',
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [parts, setParts] = useState(() => parseTimingsString(value) || DEFAULT_PARTS);
  const [popupStyle, setPopupStyle] = useState({});

  const containerRef = useRef(null);
  const triggerRef = useRef(null);
  const popupRef = useRef(null);

  useEffect(() => {
    const parsed = parseTimingsString(value);
    if (parsed) {
      setParts(parsed);
    }
  }, [value]);

  const updatePopupPosition = useCallback(() => {
    const anchor = triggerRef.current || containerRef.current;
    if (!anchor) return;
    const rect = anchor.getBoundingClientRect();
    if (!rect || (rect.width === 0 && rect.height === 0)) return;

    const estimatedHeight = 360;
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    const dropUp = spaceBelow < estimatedHeight && spaceAbove > spaceBelow;

    const targetWidth = Math.min(390, window.innerWidth - 16);
    let left = Math.round(rect.right - targetWidth);
    if (left < 8) {
      left = Math.max(8, Math.round(rect.left));
    }
    if (left + targetWidth > window.innerWidth - 8) {
      left = Math.max(8, window.innerWidth - targetWidth - 8);
    }

    setPopupStyle({
      position: 'fixed',
      left,
      width: targetWidth,
      top: dropUp ? 'auto' : Math.round(rect.bottom + 6),
      bottom: dropUp ? Math.round(window.innerHeight - rect.top + 6) : 'auto',
      zIndex: 100000,
    });
  }, []);

  useLayoutEffect(() => {
    if (!isOpen) return;
    updatePopupPosition();
    window.addEventListener('resize', updatePopupPosition);
    window.addEventListener('scroll', updatePopupPosition, true);
    return () => {
      window.removeEventListener('resize', updatePopupPosition);
      window.removeEventListener('scroll', updatePopupPosition, true);
    };
  }, [isOpen, updatePopupPosition]);

  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (e) => {
      const inTrigger = containerRef.current?.contains(e.target);
      const inPopup = popupRef.current?.contains(e.target);
      if (!inTrigger && !inPopup) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        setIsOpen(false);
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('keydown', handleKeyDown, true);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [isOpen]);

  const applyParts = (nextParts) => {
    setParts(nextParts);
    onChange?.(formatTimingsString(nextParts));
  };

  const handleToggle = () => {
    if (disabled) return;
    if (!isOpen) {
      const parsed = parseTimingsString(value);
      setParts(parsed || DEFAULT_PARTS);
    }
    setIsOpen((prev) => !prev);
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onChange?.('');
    setIsOpen(false);
  };

  const currentDayLabel =
    parts.fromDay === parts.toDay ? parts.fromDay : `${parts.fromDay} – ${parts.toDay}`;

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        onClick={handleToggle}
        className={`w-full flex items-center justify-between gap-2 px-3.5 py-2 text-xs text-left rounded-xl border bg-white transition-all cursor-pointer ${
          isOpen
            ? 'border-[#8b6f4e] ring-2 ring-[#8b6f4e]/20'
            : 'border-stone-200 hover:border-stone-300'
        } ${disabled ? 'opacity-50 cursor-not-allowed bg-stone-100/60' : ''}`}
      >
        <span className="flex items-center gap-2 min-w-0 truncate">
          <HiOutlineClock
            className="w-4 h-4 shrink-0"
            style={{ color: 'var(--theme-primary, #8b6f4e)' }}
          />
          <span className={`truncate ${value ? 'text-stone-900 font-medium' : 'text-stone-400'}`}>
            {value || placeholder}
          </span>
        </span>

        <span className="flex items-center gap-1 shrink-0">
          {value && !disabled && (
            <span
              role="button"
              tabIndex={-1}
              onClick={handleClear}
              title="Clear timings"
              className="p-0.5 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
            >
              <HiOutlineX className="w-3.5 h-3.5" />
            </span>
          )}
          <HiOutlineChevronDown
            className={`w-3.5 h-3.5 text-stone-400 transition-transform duration-200 ${
              isOpen ? 'rotate-180' : ''
            }`}
            style={isOpen ? { color: 'var(--theme-primary, #8b6f4e)' } : undefined}
          />
        </span>
      </button>

      {isOpen &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            ref={popupRef}
            style={popupStyle}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl border border-stone-200/90 shadow-2xl shadow-stone-900/15 p-4 space-y-3.5 animate-scaleUp select-none"
          >
            {/* Preview Banner */}
            <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-stone-50 border border-stone-200/70">
              <div className="flex items-center gap-2 min-w-0">
                <HiOutlineClock
                  className="w-4 h-4 shrink-0"
                  style={{ color: 'var(--theme-primary, #8b6f4e)' }}
                />
                <span className="text-xs font-bold text-stone-900 truncate">
                  {formatTimingsString(parts)}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-200/60 transition-colors cursor-pointer shrink-0"
                title="Close"
              >
                <HiOutlineX className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Quick Time Presets */}
            <div className="space-y-1.5">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-stone-400">
                Quick Time Slots
              </span>
              <div className="grid grid-cols-2 gap-1.5">
                {TIME_PRESETS.map((preset) => {
                  const isActive =
                    formatTimePart(parts.open) === formatTimePart(preset.open) &&
                    formatTimePart(parts.close) === formatTimePart(preset.close);
                  return (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() =>
                        applyParts({
                          ...parts,
                          open: { ...preset.open },
                          close: { ...preset.close },
                        })
                      }
                      style={
                        isActive
                          ? {
                              backgroundColor: 'rgba(var(--theme-primary-rgb, 139, 111, 78), 0.12)',
                              borderColor: 'var(--theme-primary, #8b6f4e)',
                              color: 'var(--theme-primary, #8b6f4e)',
                            }
                          : undefined
                      }
                      className={`px-2.5 py-1.5 rounded-lg border text-[11px] font-semibold transition-colors cursor-pointer truncate ${
                        isActive
                          ? 'font-bold'
                          : 'bg-white border-stone-200 text-stone-600 hover:bg-stone-50'
                      }`}
                    >
                      {preset.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Opening & Closing Time Selectors */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <TimeBlock
                title="Opening Time"
                time={parts.open}
                onChange={(open) => applyParts({ ...parts, open })}
              />
              <TimeBlock
                title="Closing Time"
                time={parts.close}
                onChange={(close) => applyParts({ ...parts, close })}
              />
            </div>

            {/* Open Days */}
            <div className="space-y-2 pt-1 border-t border-stone-100">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
                  Open Days
                </span>
                <div className="flex items-center gap-1 text-[11px] text-stone-500">
                  <select
                    aria-label="From day"
                    value={parts.fromDay}
                    onChange={(e) => applyParts({ ...parts, fromDay: e.target.value })}
                    className="px-1.5 py-0.5 bg-stone-50 border border-stone-200 rounded-md text-[11px] font-semibold text-stone-700 focus:outline-none focus:border-[#8b6f4e] cursor-pointer"
                  >
                    {DAYS_OF_WEEK.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                  <span className="text-stone-400">–</span>
                  <select
                    aria-label="To day"
                    value={parts.toDay}
                    onChange={(e) => applyParts({ ...parts, toDay: e.target.value })}
                    className="px-1.5 py-0.5 bg-stone-50 border border-stone-200 rounded-md text-[11px] font-semibold text-stone-700 focus:outline-none focus:border-[#8b6f4e] cursor-pointer"
                  >
                    {DAYS_OF_WEEK.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-1.5">
                {DAY_PRESETS.map((dp) => {
                  const isActive = currentDayLabel === dp.label;
                  return (
                    <button
                      key={dp.label}
                      type="button"
                      onClick={() =>
                        applyParts({ ...parts, fromDay: dp.fromDay, toDay: dp.toDay })
                      }
                      style={
                        isActive
                          ? {
                              backgroundColor: 'var(--theme-primary, #8b6f4e)',
                              borderColor: 'var(--theme-primary, #8b6f4e)',
                              color: '#ffffff',
                            }
                          : undefined
                      }
                      className={`px-2 py-1.5 rounded-lg border text-[11px] font-semibold transition-colors cursor-pointer ${
                        isActive
                          ? 'shadow-2xs'
                          : 'bg-stone-50 border-stone-200 text-stone-600 hover:bg-stone-100'
                      }`}
                    >
                      {dp.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Footer */}
            <div className="pt-2.5 border-t border-stone-100 flex items-center justify-between">
              <button
                type="button"
                onClick={handleClear}
                className="text-xs font-semibold hover:underline cursor-pointer"
                style={{ color: 'var(--theme-primary, #8b6f4e)' }}
              >
                Clear
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!value) {
                    applyParts(parts);
                  }
                  setIsOpen(false);
                }}
                style={{ backgroundColor: 'var(--theme-primary, #8b6f4e)', color: '#ffffff' }}
                className="px-4 py-1.5 rounded-xl text-xs font-bold shadow-xs hover:opacity-90 transition-opacity cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
