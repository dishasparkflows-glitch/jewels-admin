import { useState, useRef, useEffect, useLayoutEffect, useMemo, useCallback, useId } from 'react';
import { createPortal } from 'react-dom';
import { defaultCountries, parseCountry } from 'react-international-phone';
import { HiOutlineSearch, HiChevronDown, HiCheck, HiX } from 'react-icons/hi';

const POPULAR_ISO_CODES = ['in', 'us', 'gb', 'ae', 'ca', 'au', 'sg'];

const MenuPortal = ({ enabled, children }) =>
  enabled && typeof document !== 'undefined' ? createPortal(children, document.body) : children;

export default function CountryCodeSelect({
  value = '+91',
  onChange,
  defaultCountry = 'in',
  disabled = false,
  size = 'md',
  direction = 'auto',
  align = 'auto',
  portal = true,
  className = '',
  buttonClassName = '',
  menuClassName = '',
  id,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [dropUp, setDropUp] = useState(direction === 'up');
  const [alignRight, setAlignRight] = useState(align === 'right');
  const [maxListHeight, setMaxListHeight] = useState(250);
  const [menuPosition, setMenuPosition] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIso, setSelectedIso] = useState(defaultCountry.toLowerCase());
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  const containerRef = useRef(null);
  const buttonRef = useRef(null);
  const menuRef = useRef(null);
  const searchInputRef = useRef(null);
  const listRef = useRef(null);
  const isPointerDownRef = useRef(false);
  const suppressFocusOpenRef = useRef(false);
  const generatedId = useId();
  const selectId = id || generatedId;

  // Process all countries from react-international-phone
  const allCountries = useMemo(() => {
    return defaultCountries.map((c) => {
      const parsed = parseCountry(c);
      return {
        name: parsed.name,
        iso2: parsed.iso2.toLowerCase(),
        dialCode: `+${parsed.dialCode}`,
        rawDialCode: parsed.dialCode,
      };
    });
  }, []);

  // Sync selectedIso if value changes externally
  useEffect(() => {
    if (!value) return;
    const cleanValue = value.startsWith('+') ? value : `+${value}`;
    // If current selectedIso already matches this dialCode, keep it (e.g. CA vs US)
    const currentMatch = allCountries.find((c) => c.iso2 === selectedIso);
    if (currentMatch && currentMatch.dialCode === cleanValue) {
      return;
    }
    // Otherwise find the first country matching this dialCode
    const match = allCountries.find((c) => c.dialCode === cleanValue);
    if (match) {
      setSelectedIso(match.iso2);
    }
  }, [value, allCountries, selectedIso]);

  // Current active country
  const currentCountry = useMemo(() => {
    return (
      allCountries.find((c) => c.iso2 === selectedIso) ||
      allCountries.find((c) => c.iso2 === 'in') ||
      allCountries[0]
    );
  }, [allCountries, selectedIso]);

  // Popular list
  const popularCountries = useMemo(() => {
    return POPULAR_ISO_CODES.map((iso) =>
      allCountries.find((c) => c.iso2 === iso)
    ).filter(Boolean);
  }, [allCountries]);

  // Filtered countries based on search
  const filteredCountries = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return allCountries;

    const cleanDialQuery = q.replace(/^\+/, '');
    return allCountries.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.iso2.includes(q) ||
        c.rawDialCode.includes(cleanDialQuery)
    );
  }, [allCountries, searchQuery]);

  // Flat list for keyboard navigation
  const activeList = useMemo(() => {
    if (searchQuery.trim()) {
      return filteredCountries;
    }
    return [...popularCountries, ...allCountries];
  }, [searchQuery, filteredCountries, popularCountries, allCountries]);

  // Smart auto-flip & max height & boundary clamping calculation
  const updateDropdownPosition = useCallback(() => {
    const anchorEl = buttonRef.current || containerRef.current;
    if (!anchorEl) return;

    const rect = anchorEl.getBoundingClientRect();
    if (!rect || (rect.width === 0 && rect.height === 0)) return;

    const estimatedMenuHeight = 280;
    const spaceBelowWindow = window.innerHeight - rect.bottom;
    const spaceAboveWindow = rect.top;

    let containerSpaceBelow = spaceBelowWindow;
    let containerSpaceAbove = spaceAboveWindow;

    let modalRect = null;
    let parent = containerRef.current?.parentElement;
    while (parent && parent !== document.body) {
      const style = window.getComputedStyle(parent);
      const overflowY = style.overflowY || '';
      const overflow = style.overflow || '';
      const isScrollable =
        overflowY === 'auto' ||
        overflowY === 'scroll' ||
        overflowY === 'hidden' ||
        overflow === 'auto' ||
        overflow === 'scroll' ||
        overflow === 'hidden';
      const isModal =
        parent.getAttribute('role') === 'dialog' ||
        parent.getAttribute('aria-modal') === 'true' ||
        parent.classList.contains('modal') ||
        Boolean(parent.className && typeof parent.className === 'string' && parent.className.includes('max-w-'));

      if (isModal && !modalRect) {
        modalRect = parent.getBoundingClientRect();
      }

      if (isScrollable || isModal) {
        const parentRect = parent.getBoundingClientRect();
        const pBelow = parentRect.bottom - rect.bottom;
        const pAbove = rect.top - parentRect.top;
        if (pBelow < containerSpaceBelow) containerSpaceBelow = pBelow;
        if (pAbove < containerSpaceAbove) containerSpaceAbove = pAbove;
      }
      parent = parent.parentElement;
    }

    const effectiveSpaceBelow = Math.max(0, Math.min(spaceBelowWindow, containerSpaceBelow));
    const effectiveSpaceAbove = Math.max(0, Math.min(spaceAboveWindow, containerSpaceAbove));

    const shouldDropUp =
      direction === 'up' ||
      (direction !== 'down' && effectiveSpaceBelow < estimatedMenuHeight && effectiveSpaceAbove > effectiveSpaceBelow);

    setDropUp(shouldDropUp);

    const availableSpace = shouldDropUp ? effectiveSpaceAbove : effectiveSpaceBelow;
    // Leave room for search bar (~52px) and margins (~16px)
    const calculatedListHeight = Math.max(140, Math.min(260, availableSpace - 68));
    setMaxListHeight(calculatedListHeight);

    const targetWidth = Math.min(310, window.innerWidth - 24);
    let left = Math.round(rect.left);

    // If inside a modal/dialog, ensure menu stays cleanly bounded inside the modal
    if (modalRect) {
      if (left + targetWidth > modalRect.right - 12) {
        left = Math.max(Math.round(modalRect.left + 12), Math.round(modalRect.right - targetWidth - 12));
      }
      if (left < modalRect.left + 12) {
        left = Math.round(modalRect.left + 12);
      }
    }

    // Clamp within window viewport
    if (left + targetWidth > window.innerWidth - 12) {
      left = Math.max(12, window.innerWidth - targetWidth - 12);
    }
    if (left < 12) {
      left = 12;
    }

    if (portal) {
      setMenuPosition({
        position: 'fixed',
        left,
        width: targetWidth,
        top: shouldDropUp ? 'auto' : Math.round(rect.bottom + 6),
        bottom: shouldDropUp ? Math.round(window.innerHeight - rect.top + 6) : 'auto',
        zIndex: 100000,
      });
    } else {
      const shouldAlignRight = align === 'right' || (align === 'auto' && left < rect.left);
      setAlignRight(shouldAlignRight);
    }
  }, [direction, align, portal]);

  useLayoutEffect(() => {
    if (!isOpen) return;
    updateDropdownPosition();
  }, [isOpen, updateDropdownPosition]);

  const handleToggle = () => {
    isPointerDownRef.current = false;
    if (disabled) return;
    if (!isOpen) {
      updateDropdownPosition();
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  };

  const handleButtonMouseDown = () => {
    if (disabled) return;
    isPointerDownRef.current = true;
    setTimeout(() => {
      isPointerDownRef.current = false;
    }, 0);
  };

  const handleButtonFocus = () => {
    if (disabled) return;
    if (suppressFocusOpenRef.current) {
      suppressFocusOpenRef.current = false;
      return;
    }
    if (isPointerDownRef.current) return;
    if (!isOpen) {
      updateDropdownPosition();
      setIsOpen(true);
    }
  };

  const closeAndMoveFocus = (shiftKey) => {
    suppressFocusOpenRef.current = true;
    setIsOpen(false);
    const scope = buttonRef.current?.closest('[role="dialog"], [role="alertdialog"], form') || document;
    const focusables = Array.from(
      scope.querySelectorAll(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )
    ).filter((el) => {
      if (menuRef.current && menuRef.current.contains(el)) return false;
      return el.offsetParent !== null || el === buttonRef.current;
    });
    const btnIdx = focusables.indexOf(buttonRef.current);
    const targetIdx = shiftKey ? btnIdx - 1 : btnIdx + 1;
    if (btnIdx !== -1 && focusables[targetIdx]) {
      focusables[targetIdx].focus();
    } else {
      buttonRef.current?.blur();
    }
  };

  const handleSelect = (country) => {
    setSelectedIso(country.iso2);
    suppressFocusOpenRef.current = true;
    setIsOpen(false);
    setSearchQuery('');
    setHighlightedIndex(-1);
    if (onChange) {
      onChange(country.dialCode, country);
    }
    buttonRef.current?.focus();
  };

  // Keyboard navigation
  const handleKeyDown = (e) => {
    if (!isOpen) return;

    if (e.key === 'Tab') {
      e.preventDefault();
      closeAndMoveFocus(e.shiftKey);
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev < activeList.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const target =
        highlightedIndex >= 0 && activeList[highlightedIndex]
          ? activeList[highlightedIndex]
          : activeList[0];
      if (target) {
        handleSelect(target);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      suppressFocusOpenRef.current = true;
      setIsOpen(false);
      buttonRef.current?.focus();
    }
  };

  const handleButtonKeyDown = (e) => {
    if (disabled) return;
    if (e.key === 'Tab' && isOpen) {
      e.preventDefault();
      closeAndMoveFocus(e.shiftKey);
      return;
    }
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      if (!isOpen) {
        updateDropdownPosition();
        setIsOpen(true);
      }
    }
  };

  // Handle outside click & escape key & window scroll/resize
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target) &&
        (!menuRef.current || !menuRef.current.contains(event.target))
      ) {
        setIsOpen(false);
      }
    };

    const handleScroll = (event) => {
      // Do not close or re-orient if scroll happened inside the countries list
      if (menuRef.current && menuRef.current.contains(event.target)) {
        return;
      }
      updateDropdownPosition();
    };

    const handleResize = () => {
      updateDropdownPosition();
    };

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('scroll', handleScroll, true);
    window.addEventListener('resize', handleResize);

    // Auto-focus search input when opened
    const timer = setTimeout(() => {
      if (searchInputRef.current) {
        searchInputRef.current.focus();
      }
    }, 50);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('resize', handleResize);
      clearTimeout(timer);
    };
  }, [isOpen, updateDropdownPosition]);

  // Auto-scroll highlighted index into view
  useEffect(() => {
    if (isOpen && highlightedIndex >= 0 && listRef.current) {
      const optionEls = listRef.current.querySelectorAll('[role="option"]');
      if (optionEls[highlightedIndex]) {
        optionEls[highlightedIndex].scrollIntoView({ block: 'nearest' });
      }
    }
  }, [highlightedIndex, isOpen]);

  // Auto-scroll selected country into view on open
  useEffect(() => {
    if (!isOpen) {
      setHighlightedIndex(-1);
      setSearchQuery('');
      return;
    }

    const timer = setTimeout(() => {
      if (listRef.current) {
        const selectedEl = listRef.current.querySelector('[aria-selected="true"]');
        if (selectedEl) {
          selectedEl.scrollIntoView({ block: 'nearest' });
        }
      }
    }, 60);

    return () => clearTimeout(timer);
  }, [isOpen]);

  const getFlagEmoji = (iso2) => {
    if (!iso2 || iso2.length !== 2) return '';
    try {
      const codePoints = [...iso2.toUpperCase()].map((c) => 127397 + c.charCodeAt(0));
      return String.fromCodePoint(...codePoints);
    } catch {
      return iso2.toUpperCase();
    }
  };

  const renderFlag = (iso2, name, size = 'md') => {
    const isSmall = size === 'sm';
    return (
      <span className="relative flex shrink-0 items-center justify-center overflow-hidden rounded-[2px] shadow-2xs border border-stone-200/80 bg-stone-100">
        <img
          src={`https://flagcdn.com/w40/${iso2}.png`}
          srcSet={`https://flagcdn.com/w80/${iso2}.png 2x`}
          alt={`${name} flag`}
          className={`${isSmall ? 'h-3 w-4' : 'h-3.5 w-5'} object-cover block`}
          loading="lazy"
          onError={(e) => {
            e.currentTarget.style.display = 'none';
            if (e.currentTarget.nextSibling) {
              e.currentTarget.nextSibling.style.display = 'inline-block';
            }
          }}
        />
        <span
          style={{ display: 'none' }}
          className="text-[10px] leading-none select-none px-0.5"
          aria-hidden="true"
        >
          {getFlagEmoji(iso2)}
        </span>
      </span>
    );
  };

  const renderCountryItem = (country, index) => {
    const isSelected = country.iso2 === selectedIso;
    const isHighlighted = highlightedIndex === index;
    return (
      <button
        key={`${country.iso2}-${index}`}
        type="button"
        role="option"
        aria-selected={isSelected}
        onClick={() => handleSelect(country)}
        onMouseEnter={() => setHighlightedIndex(index)}
        className={`flex w-full items-center justify-between gap-2.5 px-3.5 py-2 text-left transition cursor-pointer ${
          isSelected
            ? 'bg-[#f7efe6] text-[#92704e] font-semibold'
            : isHighlighted
            ? 'bg-stone-100/90 text-stone-900 font-medium'
            : 'text-stone-700 hover:bg-stone-50'
        }`}
      >
        <div className="flex min-w-0 items-center gap-2.5">
          {renderFlag(country.iso2, country.name)}
          <span className="truncate">{country.name}</span>
        </div>
        <div className="flex shrink-0 items-center gap-2 font-mono text-xs text-stone-500">
          <span>{country.dialCode}</span>
          {isSelected && (
            <HiCheck className="h-4 w-4 text-[#92704e]" />
          )}
        </div>
      </button>
    );
  };

  return (
    <div ref={containerRef} className={`relative inline-block ${className}`}>
      {/* Trigger Button */}
      <button
        id={selectId}
        ref={buttonRef}
        type="button"
        disabled={disabled}
        onMouseDown={handleButtonMouseDown}
        onFocus={handleButtonFocus}
        onClick={handleToggle}
        onKeyDown={handleButtonKeyDown}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={`Country calling code, currently ${currentCountry.name} (${currentCountry.dialCode})`}
        className={
          buttonClassName ||
          'flex h-full items-center gap-1.5 px-2.5 text-stone-800 transition hover:bg-stone-50 border-r border-[#e9dfd3] outline-none cursor-pointer select-none'
        }
      >
        {renderFlag(currentCountry.iso2, currentCountry.name, size)}
        <span className={`${size === 'sm' ? 'text-xs' : 'text-xs sm:text-sm'} font-semibold tracking-wide text-stone-800`}>
          {currentCountry.dialCode}
        </span>
        <HiChevronDown
          className={`h-3 w-3 text-stone-400 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-[#92704e]' : ''
          }`}
        />
      </button>

      {/* Popover Dropdown */}
      {isOpen && (
        <MenuPortal enabled={portal}>
          <div
            ref={menuRef}
            role="listbox"
            tabIndex={-1}
            style={portal ? menuPosition : undefined}
            onKeyDown={handleKeyDown}
            className={`${
              portal
                ? 'fixed'
                : `absolute ${alignRight ? 'right-0' : 'left-0'} ${
                    dropUp ? 'bottom-full mb-1.5 origin-bottom' : 'top-full mt-1.5 origin-top'
                  }`
            } z-[100000] w-72 sm:w-80 max-w-[calc(100vw-2.5rem)] rounded-2xl border border-stone-200 bg-white shadow-2xl overflow-hidden transition-all duration-150 animate-in fade-in zoom-in-95 ${menuClassName}`}
          >
            {/* Search Bar Header */}
            <div className="sticky top-0 z-10 border-b border-stone-100 bg-stone-50/90 p-2.5 backdrop-blur-xs">
              <div className="relative flex items-center">
                <HiOutlineSearch className="pointer-events-none absolute left-3 h-4 w-4 text-stone-400" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search country or code..."
                  className="h-9 w-full rounded-lg border border-stone-200 bg-white pl-9 pr-8 text-xs sm:text-sm text-stone-800 outline-none placeholder:text-stone-400 transition focus:border-[#92704e] focus:ring-1 focus:ring-[#92704e]/20"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    aria-label="Clear search"
                    className="absolute right-2.5 text-stone-400 hover:text-stone-600 cursor-pointer"
                  >
                    <HiX className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Countries List */}
            <div
              ref={listRef}
              style={{ maxHeight: `${maxListHeight}px` }}
              className="overflow-y-auto overscroll-contain py-1 text-xs sm:text-sm luxury-scrollbar"
            >
              {/* If searching, display flat filtered list */}
              {searchQuery.trim() ? (
                filteredCountries.length > 0 ? (
                  filteredCountries.map((country, idx) => renderCountryItem(country, idx))
                ) : (
                  <div className="py-8 text-center text-xs text-stone-400">
                    No countries matching "{searchQuery}"
                  </div>
                )
              ) : (
                /* If not searching, display Popular Section + All Countries */
                <>
                  {/* Popular Group */}
                  <div className="px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-stone-400">
                    Popular Countries
                  </div>
                  {popularCountries.map((country, idx) => renderCountryItem(country, idx))}

                  <div className="my-1 border-t border-stone-100" />

                  {/* All Countries Group */}
                  <div className="px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-stone-400">
                    All Countries ({allCountries.length})
                  </div>
                  {allCountries.map((country, idx) =>
                    renderCountryItem(country, popularCountries.length + idx)
                  )}
                </>
              )}
            </div>
          </div>
        </MenuPortal>
      )}
    </div>
  );
}
