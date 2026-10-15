import React, { useState, useRef, useEffect, useId, useCallback } from 'react';
import { HiOutlineChevronDown, HiOutlineCheck } from 'react-icons/hi';

/**
 * Status color mappings for luxury badge/dot representation
 */
const STATUS_COLORS = {
  approved: {
    dot: 'bg-emerald-500',
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
  active: {
    dot: 'bg-emerald-500',
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
  confirmed: {
    dot: 'bg-emerald-500',
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
  completed: {
    dot: 'bg-emerald-500',
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
  pending: {
    dot: 'bg-amber-500',
    badge: 'bg-amber-50 text-amber-700 border-amber-200',
  },
  in_progress: {
    dot: 'bg-amber-500',
    badge: 'bg-amber-50 text-amber-700 border-amber-200',
  },
  rejected: {
    dot: 'bg-rose-500',
    badge: 'bg-rose-50 text-rose-700 border-rose-200',
  },
  cancelled: {
    dot: 'bg-rose-500',
    badge: 'bg-rose-50 text-rose-700 border-rose-200',
  },
  inactive: {
    dot: 'bg-stone-400',
    badge: 'bg-stone-100 text-stone-600 border-stone-200',
  },
};

/**
 * Common Luxury Dropdown Component
 *
 * Fully keyboard-accessible dropdown with auto-open on Tab focus, smooth
 * ArrowUp/ArrowDown navigation, typeahead search, Enter/Space selection,
 * clean blur/auto-close on Tab away, and smart positioning.
 *
 * @param {any} value - Currently selected value
 * @param {Function} onChange - Handler called on selection: (value, option) => void
 * @param {Array<string|number|object>} options - List of options. Can be primitives or { value, label, sublabel, icon, dotColor, badge, disabled }
 * @param {string} [placeholder='Select an option'] - Placeholder text
 * @param {string} [label] - Label text displayed above dropdown
 * @param {boolean} [required=false] - Display required indicator
 * @param {boolean} [disabled=false] - Disable interaction
 * @param {'sm'|'md'|'lg'} [size='md'] - Height and padding scale
 * @param {'default'|'minimal'|'inline'} [variant='default'] - Visual style variant
 * @param {boolean} [showStatusDot=false] - Show status dot indicator next to label
 * @param {boolean} [openUpward=false] - Force dropdown to open upwards
 * @param {boolean} [openDownward=false] - Force dropdown to open downwards
 * @param {'auto'|'down'|'up'} [direction='auto'] - Direction to open the dropdown menu
 * @param {string} [className=''] - Container class name
 * @param {string} [buttonClassName=''] - Button trigger custom styling
 * @param {string} [menuClassName=''] - Menu popover custom styling
 * @param {Function} [renderOption] - Custom renderer (option, isSelected, isHighlighted) => ReactNode
 * @param {React.ReactNode} [prefixIcon] - Icon to show at the start of the button
 */
export default function Dropdown({
  value,
  onChange,
  options = [],
  placeholder = 'Select an option',
  label,
  required = false,
  disabled = false,
  size = 'md',
  variant = 'default',
  showStatusDot = false,
  openUpward = false,
  openDownward = false,
  direction = 'auto',
  className = '',
  buttonClassName = '',
  menuClassName = '',
  renderOption,
  prefixIcon,
  name,
  id,
}) {
  const isForcedDown = openDownward || direction === 'down';
  const isForcedUp = openUpward || direction === 'up';
  const [isOpen, setIsOpen] = useState(false);
  const [dropUp, setDropUp] = useState(isForcedUp && !isForcedDown);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  const containerRef = useRef(null);
  const buttonRef = useRef(null);
  const menuRef = useRef(null);
  const isPointerDownRef = useRef(false);
  const hasKeyboardNavigatedRef = useRef(false);
  const searchStringRef = useRef('');
  const searchTimeoutRef = useRef(null);

  const generatedId = useId();
  const dropdownId = id || generatedId;

  // Normalize options into a consistent { value, label, ... } structure
  const normalizedOptions = options.map((opt) => {
    if (typeof opt === 'object' && opt !== null) {
      return {
        value: opt.value !== undefined ? opt.value : opt.id,
        label: opt.label !== undefined ? opt.label : (opt.name || String(opt.value)),
        sublabel: opt.sublabel,
        icon: opt.icon,
        dotColor: opt.dotColor,
        badge: opt.badge,
        disabled: Boolean(opt.disabled),
        raw: opt,
      };
    }
    return {
      value: opt,
      label: String(opt),
      disabled: false,
      raw: opt,
    };
  });

  // Find currently selected option
  const selectedIndex = normalizedOptions.findIndex(
    (opt) => String(opt.value) === String(value)
  );
  const selectedOption = selectedIndex >= 0 ? normalizedOptions[selectedIndex] : null;

  // Sync highlightedIndex when dropdown opens
  useEffect(() => {
    if (isOpen) {
      setHighlightedIndex(selectedIndex >= 0 ? selectedIndex : 0);
    } else {
      setHighlightedIndex(-1);
      hasKeyboardNavigatedRef.current = false;
    }
  }, [isOpen, selectedIndex]);

  // Handle smart auto-flip (open upward if near screen bottom)
  useEffect(() => {
    if (isForcedDown) {
      setDropUp(false);
      return;
    }
    if (isForcedUp) {
      setDropUp(true);
      return;
    }
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const estimatedMenuHeight = Math.min(normalizedOptions.length * 44 + 16, 260);
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;

      if (spaceBelow < estimatedMenuHeight && spaceAbove > spaceBelow) {
        setDropUp(true);
      } else {
        setDropUp(false);
      }
    }
  }, [isOpen, isForcedDown, isForcedUp, normalizedOptions.length]);

  // Auto-scroll highlighted option into view
  useEffect(() => {
    if (isOpen && menuRef.current && highlightedIndex >= 0) {
      const optionEl = menuRef.current.children[highlightedIndex];
      if (optionEl && typeof optionEl.scrollIntoView === 'function') {
        optionEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [highlightedIndex, isOpen]);

  // Close on outside pointer click
  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
        setHighlightedIndex(-1);
        hasKeyboardNavigatedRef.current = false;
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
    };
  }, [isOpen]);

  // Handle selection of an option
  const handleSelect = useCallback(
    (option) => {
      if (!option || option.disabled) return;
      setIsOpen(false);
      setHighlightedIndex(-1);
      hasKeyboardNavigatedRef.current = false;
      if (onChange) {
        onChange(option.value, option.raw);
        if (name) {
          onChange({ target: { name, value: option.value } }, option.raw);
        }
      }
    },
    [onChange, name]
  );

  // Type-ahead quick search
  const handleTypeahead = (char) => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchStringRef.current += char.toLowerCase();
    searchTimeoutRef.current = setTimeout(() => {
      searchStringRef.current = '';
    }, 600);

    const query = searchStringRef.current;
    let matchIdx = normalizedOptions.findIndex(
      (opt) => !opt.disabled && opt.label.toLowerCase().startsWith(query)
    );
    if (matchIdx < 0) {
      matchIdx = normalizedOptions.findIndex(
        (opt) => !opt.disabled && opt.label.toLowerCase().includes(query)
      );
    }
    if (matchIdx >= 0) {
      setHighlightedIndex(matchIdx);
      hasKeyboardNavigatedRef.current = true;
      if (!isOpen) setIsOpen(true);
    }
  };

  // Keyboard navigation within dropdown
  const handleKeyDown = (e) => {
    if (disabled) return;

    // When dropdown is CLOSED:
    if (!isOpen) {
      if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(e.key)) {
        e.preventDefault();
        setIsOpen(true);
        setHighlightedIndex(selectedIndex >= 0 ? selectedIndex : 0);
        return;
      }
      if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        handleTypeahead(e.key);
        return;
      }
      return;
    }

    // When dropdown is OPEN:
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      hasKeyboardNavigatedRef.current = true;
      setHighlightedIndex((prev) => {
        if (normalizedOptions.length === 0) return -1;
        let next = prev < 0 ? 0 : (prev + 1) % normalizedOptions.length;
        let count = 0;
        while (normalizedOptions[next]?.disabled && count < normalizedOptions.length) {
          next = (next + 1) % normalizedOptions.length;
          count++;
        }
        return next;
      });
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      hasKeyboardNavigatedRef.current = true;
      setHighlightedIndex((prev) => {
        if (normalizedOptions.length === 0) return -1;
        let next = prev <= 0 ? normalizedOptions.length - 1 : prev - 1;
        let count = 0;
        while (normalizedOptions[next]?.disabled && count < normalizedOptions.length) {
          next = next <= 0 ? normalizedOptions.length - 1 : next - 1;
          count++;
        }
        return next;
      });
    } else if (e.key === 'Home') {
      e.preventDefault();
      hasKeyboardNavigatedRef.current = true;
      const firstIdx = normalizedOptions.findIndex((opt) => !opt.disabled);
      if (firstIdx >= 0) setHighlightedIndex(firstIdx);
    } else if (e.key === 'End') {
      e.preventDefault();
      hasKeyboardNavigatedRef.current = true;
      for (let i = normalizedOptions.length - 1; i >= 0; i--) {
        if (!normalizedOptions[i].disabled) {
          setHighlightedIndex(i);
          break;
        }
      }
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (highlightedIndex >= 0 && highlightedIndex < normalizedOptions.length) {
        handleSelect(normalizedOptions[highlightedIndex]);
      } else {
        setIsOpen(false);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
      setHighlightedIndex(-1);
      hasKeyboardNavigatedRef.current = false;
      buttonRef.current?.focus();
    } else if (e.key === 'Tab') {
      // User is tabbing to next or previous form control
      // If user actively navigated to an option with arrow keys or typing, select it
      if (
        hasKeyboardNavigatedRef.current &&
        highlightedIndex >= 0 &&
        highlightedIndex < normalizedOptions.length &&
        !normalizedOptions[highlightedIndex]?.disabled
      ) {
        handleSelect(normalizedOptions[highlightedIndex]);
      }
      setIsOpen(false);
      setHighlightedIndex(-1);
      hasKeyboardNavigatedRef.current = false;
      // Do not preventDefault: browser naturally advances focus to next element!
    } else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
      handleTypeahead(e.key);
    }
  };

  // Focus handler: Opens dropdown when focused via keyboard Tab
  const handleFocus = () => {
    if (disabled) return;
    // If focus was triggered by a mouse click, do not auto-open here; onClick handles it
    if (isPointerDownRef.current) return;

    // Focused via keyboard (Tab / Shift+Tab) -> automatically open dropdown list!
    setIsOpen(true);
    setHighlightedIndex(selectedIndex >= 0 ? selectedIndex : 0);
  };

  // Blur handler: When focus leaves the dropdown container, cleanly close it
  const handleBlur = (e) => {
    if (!containerRef.current?.contains(e.relatedTarget)) {
      setIsOpen(false);
      setHighlightedIndex(-1);
      hasKeyboardNavigatedRef.current = false;
    }
  };

  // Button click toggle
  const handleClick = () => {
    if (disabled) return;
    isPointerDownRef.current = false;
    setIsOpen((prev) => {
      const willOpen = !prev;
      if (willOpen) {
        setHighlightedIndex(selectedIndex >= 0 ? selectedIndex : 0);
      }
      return willOpen;
    });
  };

  // Size styling tokens
  const sizeStyles = {
    sm: {
      button: 'h-8 px-2.5 text-xs rounded-lg gap-1.5',
      icon: 'w-3.5 h-3.5',
      option: 'py-1.5 px-2.5 text-xs',
      menu: 'py-1 rounded-xl',
    },
    md: {
      button: 'h-11 px-3.5 text-xs sm:text-sm rounded-xl gap-2',
      icon: 'w-4 h-4',
      option: 'py-2.5 px-3.5 text-xs sm:text-sm',
      menu: 'py-1.5 rounded-2xl',
    },
    lg: {
      button: 'h-12 px-4 text-sm rounded-xl gap-2.5',
      icon: 'w-4 h-4',
      option: 'py-3 px-4 text-sm',
      menu: 'py-2 rounded-2xl',
    },
  }[size] || sizeStyles.md;

  // Variant styling tokens
  const variantStyles = {
    default:
      'bg-white border border-stone-200/90 hover:border-stone-300 focus:border-[#8f6d43] focus:ring-2 focus:ring-[#8f6d43]/15 shadow-2xs text-stone-800',
    minimal:
      'bg-transparent border border-transparent hover:border-stone-200 focus:border-[#8f6d43] text-stone-700',
    inline:
      'bg-stone-50/80 border border-stone-200 hover:border-stone-300 text-stone-700',
  }[variant] || variantStyles.default;

  // Render status dot if enabled or mapped
  const renderStatusDot = (val, opt) => {
    if (opt?.dotColor) {
      return (
        <span
          className={`w-2 h-2 rounded-full shrink-0 ${opt.dotColor}`}
          aria-hidden="true"
        />
      );
    }
    const valKey = String(val).toLowerCase();
    const config = STATUS_COLORS[valKey];
    if (config?.dot) {
      return (
        <span
          className={`w-2 h-2 rounded-full shrink-0 ${config.dot}`}
          aria-hidden="true"
        />
      );
    }
    return null;
  };

  return (
    <div
      className={`relative inline-block w-full text-left font-sans ${className}`}
      ref={containerRef}
      onBlur={handleBlur}
    >
      {/* Optional Top Label */}
      {label && (
        <label
          htmlFor={dropdownId}
          className="block text-[11px] font-bold tracking-wider text-stone-400 uppercase mb-2 select-none"
        >
          {required && <span className="text-rose-500 mr-1">*</span>}
          {label}
        </label>
      )}

      {/* Dropdown Trigger Button */}
      <button
        ref={buttonRef}
        id={dropdownId}
        type="button"
        disabled={disabled}
        onPointerDown={() => {
          isPointerDownRef.current = true;
        }}
        onClick={handleClick}
        onFocus={handleFocus}
        onKeyDown={handleKeyDown}
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={`${dropdownId}-menu`}
        aria-activedescendant={
          isOpen && highlightedIndex >= 0 ? `${dropdownId}-opt-${highlightedIndex}` : undefined
        }
        className={`w-full flex items-center justify-between text-left font-medium transition-all duration-150 outline-none cursor-pointer ${
          sizeStyles.button
        } ${variantStyles} ${
          isOpen ? 'border-[#8f6d43] ring-2 ring-[#8f6d43]/15' : ''
        } ${disabled ? 'opacity-50 cursor-not-allowed bg-stone-100/60' : ''} ${buttonClassName}`}
      >
        <span className="flex items-center gap-2 truncate">
          {prefixIcon && <span className="shrink-0 text-stone-400">{prefixIcon}</span>}
          {showStatusDot && value && renderStatusDot(value, selectedOption)}
          <span
            className={`truncate ${
              !selectedOption ? 'text-stone-400 font-normal' : 'text-stone-800 font-medium'
            }`}
          >
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </span>

        {/* Animated Chevron Icon */}
        <HiOutlineChevronDown
          className={`${sizeStyles.icon} text-stone-400 transition-transform duration-200 shrink-0 ml-2 ${
            isOpen ? 'rotate-180 text-[#8f6d43]' : ''
          }`}
        />
      </button>

      {/* Floating Options Menu */}
      {isOpen && (
        <div
          ref={menuRef}
          id={`${dropdownId}-menu`}
          role="listbox"
          tabIndex={-1}
          className={`absolute left-0 w-full z-50 bg-white border border-stone-200/90 shadow-xl shadow-stone-900/10 backdrop-blur-md overflow-y-auto max-h-60 transition-all animate-fadeIn ${
            sizeStyles.menu
          } ${
            dropUp
              ? 'bottom-full mb-1.5 origin-bottom'
              : 'top-full mt-1.5 origin-top'
          } ${menuClassName}`}
        >
          {normalizedOptions.length === 0 ? (
            <div className="py-3 px-4 text-xs text-stone-400 text-center italic">
              No options available
            </div>
          ) : (
            normalizedOptions.map((opt, idx) => {
              const isSelected = String(opt.value) === String(value);
              const isHighlighted = highlightedIndex === idx;

              if (renderOption) {
                return (
                  <div
                    key={String(opt.value)}
                    id={`${dropdownId}-opt-${idx}`}
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => handleSelect(opt)}
                    onMouseEnter={() => setHighlightedIndex(idx)}
                    className="cursor-pointer"
                  >
                    {renderOption(opt, isSelected, isHighlighted)}
                  </div>
                );
              }

              return (
                <button
                  key={String(opt.value)}
                  id={`${dropdownId}-opt-${idx}`}
                  type="button"
                  tabIndex={-1}
                  disabled={opt.disabled}
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => handleSelect(opt)}
                  onMouseEnter={() => setHighlightedIndex(idx)}
                  className={`w-full flex items-center justify-between text-left transition-colors duration-100 cursor-pointer ${
                    sizeStyles.option
                  } ${
                    isHighlighted
                      ? 'bg-[#f4eee4] text-[#8f6d43] font-semibold ring-1 ring-inset ring-[#8f6d43]/30'
                      : isSelected
                      ? 'bg-[#faf6f0] text-[#8f6d43] font-semibold'
                      : 'text-stone-700 hover:bg-[#fbf9f6] hover:text-[#8f6d43]'
                  } ${opt.disabled ? 'opacity-40 cursor-not-allowed hover:bg-transparent' : ''}`}
                >
                  <div className="flex items-center gap-2 truncate">
                    {opt.icon && <span className="shrink-0">{opt.icon}</span>}
                    {showStatusDot && renderStatusDot(opt.value, opt)}
                    <span className="truncate">{opt.label}</span>
                    {opt.sublabel && (
                      <span className="text-[11px] text-stone-400 font-normal truncate">
                        {opt.sublabel}
                      </span>
                    )}
                  </div>

                  {/* Selected Gold Checkmark */}
                  {isSelected && (
                    <HiOutlineCheck className="w-4 h-4 text-[#8f6d43] stroke-[2.5] shrink-0 ml-2" />
                  )}
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
