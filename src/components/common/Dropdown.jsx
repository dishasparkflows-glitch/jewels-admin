import React, { useState, useRef, useEffect, useLayoutEffect, useId, useCallback } from 'react';
import { createPortal } from 'react-dom';

const MenuLayer = ({ enabled, children }) => enabled ? createPortal(children, document.body) : children;
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
const renderDropdownIcon = (iconItem, defaultClassName = 'w-4 h-4') => {
  if (!iconItem) return null;
  if (React.isValidElement(iconItem)) return iconItem;
  if (typeof iconItem === 'function' || (typeof iconItem === 'object' && iconItem.$$typeof)) {
    const IconComp = iconItem;
    return <IconComp className={defaultClassName} />;
  }
  return null;
};

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
  portal = false,
  animate = true,
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
  const [menuPosition, setMenuPosition] = useState({});
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
    (opt) =>
      String(opt.value) === String(value) ||
      (value && String(opt.label).toLowerCase() === String(value).toLowerCase())
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

  // Compute and update portal menu position anchored to trigger button
  const updateMenuPosition = useCallback(() => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    if (!rect || (rect.width === 0 && rect.height === 0)) return;

    const estimatedMenuHeight = Math.min(normalizedOptions.length * 44 + 16, 260);
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    const shouldDropUp = isForcedUp || (!isForcedDown && spaceBelow < estimatedMenuHeight && spaceAbove > spaceBelow);
    setDropUp(shouldDropUp);

    // Support custom z-index from menuClassName or default to 100000 so portaled menus always overlay modals
    let resolvedZIndex = 100000;
    const customZMatch = menuClassName?.match(/z-\[(\d+)\]/);
    if (customZMatch && customZMatch[1]) {
      resolvedZIndex = Math.max(Number(customZMatch[1]), 100000);
    }

    setMenuPosition({
      position: 'fixed',
      left: Math.round(rect.left),
      width: Math.round(rect.width),
      top: shouldDropUp ? 'auto' : Math.round(rect.bottom + 6),
      bottom: shouldDropUp ? Math.round(window.innerHeight - rect.top + 6) : 'auto',
      margin: 0,
      maxHeight: Math.max(40, Math.min(260, shouldDropUp ? rect.top - 14 : window.innerHeight - rect.bottom - 14)),
      zIndex: resolvedZIndex,
    });
  }, [normalizedOptions.length, isForcedUp, isForcedDown, menuClassName]);

  // Handle smart auto-flip when NOT portaled
  useEffect(() => {
    if (portal) return;
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
      let spaceBelow = window.innerHeight - rect.bottom;
      let spaceAbove = rect.top;

      let parent = containerRef.current?.parentElement;
      while (parent && parent !== document.body) {
        const style = window.getComputedStyle(parent);
        const overflowY = style.overflowY;
        if ((overflowY === 'auto' || overflowY === 'scroll') && parent.scrollHeight > parent.clientHeight + 5) {
          const parentRect = parent.getBoundingClientRect();
          const pBelow = parentRect.bottom - rect.bottom;
          const pAbove = rect.top - parentRect.top;
          if (pBelow < spaceBelow) spaceBelow = pBelow;
          if (pAbove < spaceAbove) spaceAbove = pAbove;
          break;
        }
        parent = parent.parentElement;
      }

      if (spaceBelow < estimatedMenuHeight && spaceAbove > spaceBelow) {
        setDropUp(true);
      } else {
        setDropUp(false);
      }
    }
  }, [isOpen, isForcedDown, isForcedUp, normalizedOptions.length, portal]);

  // Portal menus escape modal & container overflow while staying anchored to their field
  useLayoutEffect(() => {
    if (!isOpen || !portal) return;
    updateMenuPosition();
    window.addEventListener('resize', updateMenuPosition);
    window.addEventListener('scroll', updateMenuPosition, true);
    return () => {
      window.removeEventListener('resize', updateMenuPosition);
      window.removeEventListener('scroll', updateMenuPosition, true);
    };
  }, [isOpen, portal, updateMenuPosition]);

  // Auto-scroll highlighted option into view
  useEffect(() => {
    if (isOpen && menuRef.current && highlightedIndex >= 0) {
      const optionEl = menuRef.current.children[highlightedIndex];
      if (optionEl && typeof optionEl.scrollIntoView === 'function') {
        // Scroll only the options list; opening a dropdown must not move the page.
        const menu = menuRef.current;
        const top = optionEl.offsetTop;
        const bottom = top + optionEl.offsetHeight;
        if (top < menu.scrollTop) menu.scrollTop = top;
        else if (bottom > menu.scrollTop + menu.clientHeight) menu.scrollTop = bottom - menu.clientHeight;
      }
    }
  }, [highlightedIndex, isOpen]);

  // Close on outside pointer click
  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target) && !menuRef.current?.contains(e.target)) {
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
        if (portal) {
          updateMenuPosition();
        }
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
    if (portal) {
      updateMenuPosition();
    }
    setIsOpen(true);
    setHighlightedIndex(selectedIndex >= 0 ? selectedIndex : 0);
  };

  // Blur handler: When focus leaves the dropdown container, cleanly close it
  const handleBlur = (e) => {
    if (
      e.relatedTarget &&
      (containerRef.current?.contains(e.relatedTarget) || menuRef.current?.contains(e.relatedTarget))
    ) {
      return;
    }
    // If relatedTarget is null (e.g. pointer click on menu item or document),
    // let pointerdown listener handle outside clicks so option selection clicks are not cancelled
    if (!e.relatedTarget) {
      return;
    }
    setIsOpen(false);
    setHighlightedIndex(-1);
    hasKeyboardNavigatedRef.current = false;
  };

  // Button click toggle
  const handleClick = () => {
    if (disabled) return;
    isPointerDownRef.current = false;
    setIsOpen((prev) => {
      const willOpen = !prev;
      if (willOpen) {
        setHighlightedIndex(selectedIndex >= 0 ? selectedIndex : 0);
        if (portal) {
          updateMenuPosition();
        }
      }
      return willOpen;
    });
  };

  // Size styling tokens - Default is standard field height h-11 matching luxury inputs
  const sizeMap = {
    sm: {
      button: 'h-9 px-3 text-xs rounded-xl gap-1.5 font-serif',
      icon: 'w-3.5 h-3.5 text-[#9c7a4b]',
      option: 'py-2 px-4 text-xs font-serif',
      menu: 'p-0 rounded-xl',
    },
    field: {
      button: 'h-11 sm:h-12 px-5 text-[15px] rounded-2xl gap-2 font-serif font-normal',
      icon: 'w-4 h-4 text-[#9c7a4b]',
      option: 'py-3 px-5 sm:px-6 text-[15px] font-serif font-normal',
      menu: 'p-0 rounded-2xl',
    },
    md: {
      button: 'h-11 sm:h-12 px-5 text-[15px] rounded-2xl gap-2 font-serif font-normal',
      icon: 'w-4 h-4 text-[#9c7a4b]',
      option: 'py-3 px-5 sm:px-6 text-[15px] font-serif font-normal',
      menu: 'p-0 rounded-2xl',
    },
    lg: {
      button: 'h-12 px-6 text-base rounded-2xl gap-2.5 font-serif font-normal',
      icon: 'w-4 h-4 text-[#9c7a4b]',
      option: 'py-3.5 px-6 text-base font-serif font-normal',
      menu: 'p-0 rounded-2xl',
    },
  };
  const sizeStyles = sizeMap[size] || sizeMap.field;

  let resolvedButtonClass = sizeStyles.button;
  if (buttonClassName) {
    if (/\bh-\S+/.test(buttonClassName)) {
      resolvedButtonClass = resolvedButtonClass.replace(/\bh-\S+/g, '');
    }
    if (/\bpx-\S+/.test(buttonClassName)) {
      resolvedButtonClass = resolvedButtonClass.replace(/\bpx-\S+/g, '');
    }
    if (/\brounded-\S+/.test(buttonClassName)) {
      resolvedButtonClass = resolvedButtonClass.replace(/\brounded-\S+/g, '');
    }
    if (/\bgap-\S+/.test(buttonClassName)) {
      resolvedButtonClass = resolvedButtonClass.replace(/\bgap-\S+/g, '');
    }
  }

  // Variant styling tokens
  const variantStyles = {
    default:
      'bg-white border-[1.5px] border-[#9c7a4b] hover:border-[#86663a] focus:border-[#9c7a4b] focus:ring-2 focus:ring-[#9c7a4b]/20 shadow-2xs text-stone-900',
    input:
      'bg-white border-[1.5px] border-[#9c7a4b] hover:border-[#86663a] focus:border-[#9c7a4b] focus:ring-2 focus:ring-[#9c7a4b]/20 shadow-2xs text-stone-900',
    minimal:
      'bg-transparent border border-transparent hover:border-[#9c7a4b] focus:border-[#9c7a4b] text-stone-800 font-serif',
    inline:
      'bg-stone-50/80 border border-stone-200 hover:border-[#9c7a4b] text-stone-800 font-serif',
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
        className={`w-full flex items-center justify-between text-left font-medium ${animate ? 'transition-all duration-150' : ''} outline-none cursor-pointer ${
          resolvedButtonClass
        } ${variantStyles} ${
          isOpen ? 'border-[#8b6f4e] ring-2 ring-[#8b6f4e]/20' : ''
        } ${disabled ? 'opacity-50 cursor-not-allowed bg-stone-100/60' : ''} ${buttonClassName}`}
      >
        <span className="flex items-center gap-2 truncate">
          {prefixIcon && <span className="shrink-0 text-stone-400">{renderDropdownIcon(prefixIcon, sizeStyles.icon || 'w-4 h-4')}</span>}
          {selectedOption?.icon && !prefixIcon && (
            <span className="shrink-0 text-stone-500">{renderDropdownIcon(selectedOption.icon, sizeStyles.icon || 'w-4 h-4')}</span>
          )}
          {showStatusDot && value && renderStatusDot(value, selectedOption)}
          <span
            className={`truncate ${
              !selectedOption ? 'text-stone-400 font-normal' : 'text-stone-900 font-medium'
            }`}
          >
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </span>

        {/* Animated Chevron Icon */}
        <HiOutlineChevronDown
          className={`${sizeStyles.icon} text-stone-400 ${animate ? 'transition-transform duration-200' : ''} shrink-0 ml-2 ${
            isOpen ? 'rotate-180 text-[#8b6f4e]' : ''
          }`}
        />
      </button>

      {/* Floating Options Menu */}
      {isOpen && (
        <MenuLayer enabled={portal}>
        <div
          style={portal ? { ...menuPosition, visibility: menuPosition.left !== undefined ? 'visible' : 'hidden' } : undefined}
          ref={menuRef}
          id={`${dropdownId}-menu`}
          role="listbox"
          tabIndex={-1}
          onMouseDown={(e) => {
            // Prevent trigger button from blurring and prematurely dismissing options on scroll or click
            e.preventDefault();
          }}
          className={`${
            portal ? 'fixed' : 'absolute left-0 w-full z-50'
          } bg-white border border-[#e8ded3] rounded-2xl shadow-[0_16px_40px_rgba(40,30,20,0.08)] overflow-hidden max-h-64 py-0 ${animate ? 'transition-all animate-fadeIn' : ''} ${
            sizeStyles.menu
          } ${
            !portal
              ? dropUp
                ? 'bottom-full mb-2 origin-bottom'
                : 'top-full mt-2 origin-top'
              : dropUp
              ? 'origin-bottom'
              : 'origin-top'
          } ${menuClassName}`}>
          {normalizedOptions.length === 0 ? (
            <div className="py-3.5 px-5 text-xs text-stone-400 font-serif text-center italic">
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
                    onMouseDown={(e) => e.preventDefault()}
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
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => handleSelect(opt)}
                  onMouseEnter={() => setHighlightedIndex(idx)}
                  className={`w-full relative flex items-center justify-between text-left transition-colors duration-150 cursor-pointer ${
                    sizeStyles.option
                  } ${
                    isSelected
                      ? 'bg-[#f4eae0] text-stone-900 font-serif font-normal'
                      : isHighlighted
                      ? 'bg-[#faf5ee] text-stone-900 font-serif font-normal'
                      : 'text-stone-800 bg-white font-serif font-normal hover:bg-[#faf5ee]'
                  } ${opt.disabled ? 'opacity-40 cursor-not-allowed hover:bg-transparent' : ''}`}
                >
                  {/* Left Gold Accent Bar on Selected Item */}
                  {isSelected && (
                    <span className="absolute left-0 inset-y-0 w-1.5 bg-[#9c7a4b] rounded-r-xs" />
                  )}

                  <div className="flex items-center gap-2.5 truncate">
                    {opt.icon && <span className="shrink-0 text-stone-400 group-hover:text-stone-600">{renderDropdownIcon(opt.icon, sizeStyles.icon || 'w-4 h-4')}</span>}
                    {showStatusDot && renderStatusDot(opt.value, opt)}
                    <span className="truncate">{opt.label}</span>
                    {opt.sublabel && (
                      <span className="text-[11px] text-stone-400 font-normal truncate">
                        {opt.sublabel}
                      </span>
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>
        </MenuLayer>
      )}
    </div>
  );
}
