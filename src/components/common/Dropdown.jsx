import React, { useState, useRef, useEffect, useId } from 'react';
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
 * @param {string} [className=''] - Container class name
 * @param {string} [buttonClassName=''] - Button trigger custom styling
 * @param {string} [menuClassName=''] - Menu popover custom styling
 * @param {Function} [renderOption] - Custom renderer (option, isSelected) => ReactNode
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
  className = '',
  buttonClassName = '',
  menuClassName = '',
  renderOption,
  prefixIcon,
  name,
  id,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [dropUp, setDropUp] = useState(openUpward);
  const containerRef = useRef(null);
  const buttonRef = useRef(null);
  const menuRef = useRef(null);
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
  const selectedOption = normalizedOptions.find(
    (opt) => String(opt.value) === String(value)
  );

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
        buttonRef.current?.focus();
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  // Handle smart auto-flip (open upward if near screen bottom)
  useEffect(() => {
    if (isOpen && !openUpward && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const estimatedMenuHeight = Math.min(normalizedOptions.length * 44 + 16, 260);
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;

      if (spaceBelow < estimatedMenuHeight && spaceAbove > spaceBelow) {
        setDropUp(true);
      } else {
        setDropUp(false);
      }
    } else if (openUpward) {
      setDropUp(true);
    }
  }, [isOpen, openUpward, normalizedOptions.length]);

  const handleSelect = (option) => {
    if (option.disabled) return;
    setIsOpen(false);
    if (onChange) {
      onChange(option.value, option.raw);
      // Support native event listener signature if expected
      if (name) {
        onChange({ target: { name, value: option.value } }, option.raw);
      }
    }
  };

  // Keyboard navigation within open menu
  const handleKeyDown = (e) => {
    if (disabled) return;

    if (!isOpen) {
      if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(e.key)) {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const currentIndex = normalizedOptions.findIndex(
        (opt) => String(opt.value) === String(value)
      );
      const nextIndex = (currentIndex + 1) % normalizedOptions.length;
      handleSelect(normalizedOptions[nextIndex]);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const currentIndex = normalizedOptions.findIndex(
        (opt) => String(opt.value) === String(value)
      );
      const prevIndex =
        currentIndex <= 0 ? normalizedOptions.length - 1 : currentIndex - 1;
      handleSelect(normalizedOptions[prevIndex]);
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setIsOpen(false);
    }
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
  const renderStatusDot = (val) => {
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
    <div className={`relative inline-block w-full text-left font-sans ${className}`} ref={containerRef}>
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
        onClick={() => !disabled && setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className={`w-full flex items-center justify-between text-left font-medium transition-all duration-150 outline-none cursor-pointer ${
          sizeStyles.button
        } ${variantStyles} ${
          isOpen ? 'border-[#8f6d43] ring-2 ring-[#8f6d43]/15' : ''
        } ${disabled ? 'opacity-50 cursor-not-allowed bg-stone-100/60' : ''} ${buttonClassName}`}
      >
        <span className="flex items-center gap-2 truncate">
          {prefixIcon && <span className="shrink-0 text-stone-400">{prefixIcon}</span>}
          {showStatusDot && value && renderStatusDot(value)}
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
            normalizedOptions.map((opt) => {
              const isSelected = String(opt.value) === String(value);

              if (renderOption) {
                return (
                  <div
                    key={String(opt.value)}
                    onClick={() => handleSelect(opt)}
                    className="cursor-pointer"
                  >
                    {renderOption(opt, isSelected)}
                  </div>
                );
              }

              return (
                <button
                  key={String(opt.value)}
                  type="button"
                  disabled={opt.disabled}
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => handleSelect(opt)}
                  className={`w-full flex items-center justify-between text-left transition-colors duration-100 cursor-pointer ${
                    sizeStyles.option
                  } ${
                    isSelected
                      ? 'bg-[#faf6f0] text-[#8f6d43] font-semibold'
                      : 'text-stone-700 hover:bg-[#fbf9f6] hover:text-[#8f6d43]'
                  } ${opt.disabled ? 'opacity-40 cursor-not-allowed hover:bg-transparent' : ''}`}
                >
                  <div className="flex items-center gap-2 truncate">
                    {opt.icon && <span className="shrink-0">{opt.icon}</span>}
                    {showStatusDot && renderStatusDot(opt.value)}
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
