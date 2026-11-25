import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { HiOutlineChevronDown, HiOutlineSearch } from 'react-icons/hi';
import api from '../../api/axios';
import { groupMenuItems } from '../../utils/menuItems';

async function allPages(endpoint, signal, params = {}) {
  let page = 1;
  let more;
  const rows = [];
  do {
    const response = await api.get(endpoint, { params: { ...params, page, limit: 100 }, signal });
    rows.push(...(response.data?.data?.items || response.data?.data || []));
    more = response.data?.pagination?.hasNextPage;
    page++;
  } while (more);
  return rows;
}

export default function MenuItemSelect({
  categoryId,
  value = [],
  onChange,
  disabled = false,
  autoOpen = false,
  onOpenChange,
  placeholder = 'Select menu items',
}) {
  const [open, setOpen] = useState(Boolean(autoOpen && categoryId));
  const [groups, setGroups] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [retry, setRetry] = useState(0);
  const [dropUp, setDropUp] = useState(false);
  const [maxListHeight, setMaxListHeight] = useState(300);
  const [menuStyle, setMenuStyle] = useState(null);
  const root = useRef(null);
  const trigger = useRef(null);
  const menuRef = useRef(null);
  const searchInputRef = useRef(null);
  const prevCatIdRef = useRef(categoryId);
  const id = useId();

  // Compute portal coordinates anchored to trigger while respecting sticky headers and viewport bounds
  const updatePosition = useCallback(() => {
    if (!trigger.current) return;
    const rect = trigger.current.getBoundingClientRect();
    if (!rect || (rect.width === 0 && rect.height === 0)) return;

    const scrollContainer = trigger.current.closest(
      '.overflow-y-auto, [role="dialog"], .rounded-3xl, .shadow-2xl'
    );

    let topBound = 8;
    let bottomBound = window.innerHeight - 8;
    let leftBound = 8;
    let rightBound = window.innerWidth - 8;

    if (scrollContainer && scrollContainer !== document.body) {
      const cRect = scrollContainer.getBoundingClientRect();
      topBound = Math.max(topBound, cRect.top + 8);
      bottomBound = Math.min(bottomBound, cRect.bottom - 8);
      leftBound = Math.max(leftBound, cRect.left + 8);
      rightBound = Math.min(rightBound, cRect.right - 8);
    }

    // Account for sticky/fixed top headers (e.g. Header + StepperNav) so an upward menu is never hidden beneath them
    const stickyTopBars = document.querySelectorAll('header, .sticky');
    stickyTopBars.forEach((el) => {
      if (root.current?.contains(el) || el.contains(root.current)) return;
      const elRect = el.getBoundingClientRect();
      if (elRect.height <= 0 || elRect.width <= 0) return;
      const pos = window.getComputedStyle(el).position;
      if (pos !== 'sticky' && pos !== 'fixed') return;
      if (elRect.top < rect.top && elRect.bottom <= rect.top + 4 && elRect.bottom < window.innerHeight * 0.6) {
        topBound = Math.max(topBound, elRect.bottom + 8);
      }
    });

    const gap = 6;
    const spaceBelow = Math.max(0, bottomBound - rect.bottom - gap);
    const spaceAbove = Math.max(0, rect.top - topBound - gap);

    // Prefer opening downwards whenever there is reasonable height (>= 230px) or more space below than above
    const shouldDropUp = spaceBelow < 230 && spaceAbove > spaceBelow + 24;
    setDropUp(shouldDropUp);

    // Overhead: search header (~50px) + footer (~42px) + borders (~2px)
    const overhead = 96;
    const usableSpace = shouldDropUp ? spaceAbove : spaceBelow;
    const computedMaxList = Math.max(120, Math.min(360, Math.floor(usableSpace - overhead)));
    setMaxListHeight(computedMaxList);

    const desiredWidth =
      window.innerWidth < 640
        ? Math.max(240, Math.round(rect.width))
        : Math.min(540, Math.max(Math.round(rect.width), 500));
    const maxAllowedWidth = Math.max(220, rightBound - leftBound);
    const finalWidth = Math.min(desiredWidth, maxAllowedWidth);

    let left = Math.round(rect.left);
    if (left + finalWidth > rightBound) {
      left = Math.max(leftBound, Math.round(rect.right - finalWidth));
    }
    left = Math.max(leftBound, left);

    setMenuStyle({
      position: 'fixed',
      left,
      width: finalWidth,
      top: shouldDropUp ? 'auto' : Math.round(rect.bottom + gap),
      bottom: shouldDropUp ? Math.round(window.innerHeight - rect.top + gap) : 'auto',
      maxHeight: Math.max(200, Math.floor(usableSpace)),
      zIndex: 100000,
    });
  }, []);

  useLayoutEffect(() => {
    if (!open) {
      setMenuStyle(null);
      return;
    }
    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [open, updatePosition]);

  const hasMenuPosition = Boolean(menuStyle);

  // Focus search input safely without triggering browser container auto-scroll
  useEffect(() => {
    if (open && hasMenuPosition && searchInputRef.current) {
      searchInputRef.current.focus({ preventScroll: true });
    }
  }, [open, hasMenuPosition]);

  const onOpenChangeRef = useRef(onOpenChange);
  useEffect(() => {
    onOpenChangeRef.current = onOpenChange;
  });

  const updateOpen = (next) => {
    setOpen((prev) => (typeof next === 'function' ? next(prev) : next));
  };

  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    onOpenChangeRef.current?.(open);
  }, [open]);

  // Auto-open when autoOpen prop is true or when categoryId changes to a truthy value
  useEffect(() => {
    if (autoOpen && categoryId) {
      updateOpen(true);
    }
  }, [autoOpen, categoryId]);

  useEffect(() => {
    if (prevCatIdRef.current !== categoryId) {
      prevCatIdRef.current = categoryId;
      setLoaded(false);
      setGroups([]);
      setSearch('');
      if (categoryId) {
        updateOpen(true);
      }
    }
  }, [categoryId]);

  useEffect(() => {
    if (!open || loaded) return;
    const controller = new AbortController();
    setLoading(true);
    setError('');
    (async () => {
      try {
        let categories = [];
        if (categoryId) {
          const categoryResponse = await api.get(`/categories/${categoryId}`, { signal: controller.signal });
          categories = categoryResponse.data?.data ? [categoryResponse.data.data] : [];
        } else {
          const catRes = await api.get('/categories/lookup', { signal: controller.signal });
          categories = catRes.data?.data || [];
        }
        const sections = await allPages('/menu-sections', controller.signal, categoryId ? { categoryId } : {});
        const items = await allPages('/menu-items', controller.signal, categoryId ? { categoryId } : {});
        if (!controller.signal.aborted) {
          setGroups(groupMenuItems(categories, sections, items));
          setLoaded(true);
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          setError(err.response?.data?.message || 'Could not load menu items.');
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    })();
    return () => controller.abort();
  }, [open, loaded, retry, categoryId]);

  useEffect(() => {
    if (!open) return;
    const outside = (event) => {
      const inRoot = root.current?.contains(event.target);
      const inMenu = menuRef.current?.contains(event.target);
      if (!inRoot && !inMenu) updateOpen(false);
    };
    const escape = (event) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        updateOpen(false);
        trigger.current?.focus();
      }
    };
    document.addEventListener('pointerdown', outside);
    document.addEventListener('keydown', escape);
    return () => {
      document.removeEventListener('pointerdown', outside);
      document.removeEventListener('keydown', escape);
    };
  }, [open]);

  const allItems = groups.flatMap((category) => category.sections.flatMap((section) => section.items));
  const missingIds = loaded ? value.filter((itemId) => !allItems.some((item) => item._id === itemId)) : [];
  const query = search.trim().toLowerCase();
  const visible = groups
    .map((category) => ({
      ...category,
      sections: category.sections
        .map((section) => ({
          ...section,
          items: section.items.filter((item) =>
            `${category.name} ${section.title} ${item.title}`.toLowerCase().includes(query)
          ),
        }))
        .filter((section) => section.items.length),
    }))
    .filter((category) => category.sections.length);

  const summary =
    value.length === 1
      ? allItems.find((item) => item._id === value[0])?.title || '1 item selected'
      : value.length
      ? `${value.length} items selected`
      : placeholder;

  const toggle = (itemId) =>
    onChange(value.includes(itemId) ? value.filter((selected) => selected !== itemId) : [...value, itemId]);

  // Handle Space, Enter, ArrowDown, ArrowUp on trigger button
  const handleKeyDown = (e) => {
    if (disabled) return;
    if (e.key === ' ' || e.key === 'Enter' || e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      updateOpen((prev) => !prev);
    }
  };

  const handleContainerBlur = (event) => {
    const nextTarget = event.relatedTarget;
    if (!nextTarget) return;
    const inRoot = root.current?.contains(nextTarget);
    const inMenu = menuRef.current?.contains(nextTarget);
    if (!inRoot && !inMenu) {
      updateOpen(false);
    }
  };

  return (
    <div
      ref={root}
      className="relative w-full"
      onBlur={handleContainerBlur}
    >
      <button
        ref={trigger}
        type="button"
        disabled={disabled}
        aria-label="Select menu items"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => updateOpen((previous) => !previous)}
        onKeyDown={handleKeyDown}
        className={`flex min-h-[42px] h-[42px] w-full items-center justify-between gap-2 rounded-xl border bg-white px-3.5 py-2.5 text-left text-xs sm:text-[13px] disabled:opacity-50 cursor-pointer shadow-2xs transition-all focus:outline-none ${
          open ? 'border-[#8b6f4e] ring-2 ring-[#8b6f4e]/20' : 'border-[#d6cfc2] hover:border-[#bdae99] focus:border-[#8b6f4e] focus:ring-2 focus:ring-[#8b6f4e]/20'
        }`}
      >
        <span className={`truncate ${!value.length ? 'text-stone-400' : 'text-stone-800 font-medium'}`}>
          {summary}
        </span>
        <HiOutlineChevronDown
          className={`shrink-0 text-stone-400 transition-transform ${open ? 'rotate-180 text-[#8b6f4e]' : ''}`}
        />
      </button>

      {open &&
        createPortal(
          <div
            ref={menuRef}
            id={id}
            role="group"
            aria-label="Menu item choices"
            onBlur={handleContainerBlur}
            style={{
              ...(menuStyle || { position: 'fixed', visibility: 'hidden', zIndex: 100000 }),
            }}
            className={`flex flex-col overflow-hidden rounded-2xl border border-stone-200/90 bg-white shadow-2xl animate-fadeIn ${
              dropUp ? 'origin-bottom' : 'origin-top'
            }`}
          >
            <div className="relative shrink-0 border-b border-stone-100 p-2">
              <HiOutlineSearch className="absolute left-4 top-4 text-stone-400" />
              <input
                ref={searchInputRef}
                aria-label="Search menu items"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search menu items…"
                className="w-full rounded-lg border border-stone-200 py-1.5 pl-8 pr-2 text-xs outline-none focus:border-[#8b6f4e]"
              />
            </div>
            <div
              style={{ maxHeight: `${maxListHeight}px` }}
              className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-3 space-y-3 luxury-scrollbar"
            >
              {loading ? (
                <p role="status" className="p-3 text-xs text-stone-500">
                  Loading menu items…
                </p>
              ) : error ? (
                <div role="alert" className="p-3 text-xs text-red-600">
                  {error}
                  <button
                    type="button"
                    className="ml-2 underline cursor-pointer"
                    onClick={() => setRetry((previous) => previous + 1)}
                  >
                    Retry
                  </button>
                </div>
              ) : (
                <>
                  {visible.map((category) => (
                    <section key={category._id} className="space-y-2.5">
                      <div className="flex items-center justify-between rounded-lg bg-stone-100/70 px-2.5 py-1.5 border border-stone-200/50">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-stone-700">
                          {category.name}
                          {category.status === 'inactive' && (
                            <span className="ml-1 text-stone-400 font-normal">(hidden)</span>
                          )}
                        </span>
                        <span className="text-[10px] text-stone-400 font-medium">
                          {category.sections.reduce((acc, s) => acc + s.items.length, 0)} items
                        </span>
                      </div>
                      {(() => {
                        const sectionCount = category.sections.length;
                        const gridColsClass =
                          sectionCount === 1
                            ? 'grid-cols-1'
                            : sectionCount === 2
                            ? 'grid-cols-1 sm:grid-cols-2'
                            : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3';

                        return (
                          <div className={`grid ${gridColsClass} gap-3.5 p-0.5 items-start`}>
                            {category.sections.map((section) => (
                              <div key={section._id} className="space-y-1.5 bg-stone-50/50 p-2.5 rounded-xl border border-stone-200/60">
                                <div className="flex items-center justify-between px-1 pb-1 border-b border-stone-200/70">
                                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#8b6f4e]">
                                    {section.title}
                                    {section.status === 'inactive' && (
                                      <span className="ml-1 text-stone-400 font-normal text-[9px]">(hidden)</span>
                                    )}
                                  </span>
                                  <span className="text-[10px] text-stone-400 font-medium">
                                    {section.items.length}
                                  </span>
                                </div>
                                <div
                                  className={
                                    sectionCount === 1
                                      ? 'grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1'
                                      : 'space-y-1.5 pt-1'
                                  }
                                >
                                  {section.items.map((item) => {
                                    const isSelected = value.includes(item._id);
                                    return (
                                      <label
                                        key={item._id}
                                        className={`flex cursor-pointer items-start gap-2.5 rounded-lg px-2.5 py-2 text-xs transition-all border select-none ${
                                          isSelected
                                            ? 'bg-[#8b6f4e]/10 border-[#8b6f4e]/40 text-[#8b6f4e] font-semibold shadow-2xs'
                                            : 'bg-white border-stone-200/70 text-stone-700 hover:border-[#8b6f4e]/30 hover:bg-[#faf5ee]'
                                        }`}
                                      >
                                        <input
                                          type="checkbox"
                                          checked={isSelected}
                                          onChange={() => toggle(item._id)}
                                          className="h-3.5 w-3.5 shrink-0 rounded accent-[#8b6f4e] cursor-pointer mt-0.5"
                                        />
                                        <span
                                          className="flex-1 min-w-0 text-stone-800 font-medium text-xs sm:text-[13px] leading-snug break-words whitespace-normal"
                                          title={item.title}
                                        >
                                          {item.title}
                                          {item.status === 'inactive' && (
                                            <span className="ml-1 text-stone-400 font-normal text-[10px]">(hidden)</span>
                                          )}
                                        </span>
                                      </label>
                                    );
                                  })}
                                </div>
                              </div>
                            ))}
                          </div>
                        );
                      })()}
                    </section>
                  ))}
                  {!visible.length && (
                    <p className="p-3 text-xs text-stone-500">
                      {query
                        ? 'No matching menu items.'
                        : 'No menu items configured. Add items in Navigation Menus.'}
                    </p>
                  )}
                  {!!missingIds.length && (
                    <div className="border-t border-stone-200/60 pt-2.5">
                      <p className="px-2 text-[10px] text-amber-600 font-medium">
                        Previously selected items no longer available:
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 mt-1">
                        {missingIds.map((itemId) => (
                          <label key={itemId} className="flex cursor-pointer items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs border border-amber-200 bg-amber-50/50 text-amber-800">
                            <input
                              type="checkbox"
                              checked
                              onChange={() => toggle(itemId)}
                              className="h-3.5 w-3.5 shrink-0 rounded accent-[#8b6f4e]"
                            />
                            <span className="truncate">Unavailable item</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
            <div className="shrink-0 flex items-center justify-between border-t border-stone-100 px-3.5 py-2.5 text-xs text-stone-500 bg-stone-50/70">
              <span className="font-medium text-stone-700">{value.length} selected</span>
              <div className="flex items-center gap-3">
                {allItems.length > 0 && (
                  <button
                    type="button"
                    onClick={() => onChange(allItems.map((item) => item._id))}
                    className="text-[#8b6f4e] hover:text-[#725a3d] cursor-pointer font-semibold transition"
                  >
                    Select all ({allItems.length})
                  </button>
                )}
                <button
                  type="button"
                  disabled={!value.length}
                  onClick={() => onChange([])}
                  className="text-stone-500 hover:text-stone-800 disabled:opacity-40 cursor-pointer font-semibold transition"
                >
                  Clear
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
