/* eslint-disable react/prop-types */
import { useEffect, useId, useRef, useState } from 'react';
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
  const root = useRef(null);
  const trigger = useRef(null);
  const isPointerDownRef = useRef(false);
  const prevCatIdRef = useRef(categoryId);
  const id = useId();

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
      if (!root.current?.contains(event.target)) updateOpen(false);
    };
    const escape = (event) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        updateOpen(false);
        trigger.current?.focus();
      }
    };
    document.addEventListener('pointerdown', outside);
    root.current?.addEventListener('keydown', escape);
    const element = root.current;
    return () => {
      document.removeEventListener('pointerdown', outside);
      element?.removeEventListener('keydown', escape);
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
      updateOpen(true);
    }
  };

  // Auto-open on keyboard Tab focus (matches Dropdown.jsx behavior)
  const handleFocus = () => {
    if (disabled) return;
    if (isPointerDownRef.current) return;
    updateOpen(true);
  };

  return (
    <div
      ref={root}
      className="relative w-full"
      onBlur={(event) => {
        if (event.relatedTarget && !event.currentTarget.contains(event.relatedTarget)) {
          updateOpen(false);
        }
      }}
    >
      <button
        ref={trigger}
        type="button"
        disabled={disabled}
        aria-label="Select menu items"
        aria-expanded={open}
        aria-controls={id}
        onPointerDown={() => {
          isPointerDownRef.current = true;
        }}
        onClick={() => {
          isPointerDownRef.current = false;
          updateOpen((previous) => !previous);
        }}
        onFocus={handleFocus}
        onKeyDown={handleKeyDown}
        className={`flex min-h-[42px] h-[42px] w-full items-center justify-between gap-2 rounded-xl border bg-white px-3.5 py-2.5 text-left text-xs sm:text-[13px] disabled:opacity-50 cursor-pointer shadow-2xs transition-all ${
          open ? 'border-[#8b6f4e] ring-2 ring-[#8b6f4e]/20' : 'border-[#d6cfc2] hover:border-[#bdae99]'
        }`}
      >
        <span className={`truncate ${!value.length ? 'text-stone-400' : 'text-stone-800 font-medium'}`}>
          {summary}
        </span>
        <HiOutlineChevronDown
          className={`shrink-0 text-stone-400 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div
          id={id}
          role="group"
          aria-label="Menu item choices"
          className="absolute left-0 top-full z-50 mt-1 w-full min-w-[220px] max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl border border-stone-200 bg-white shadow-xl animate-fadeIn"
        >
          <div className="relative border-b border-stone-100 p-2">
            <HiOutlineSearch className="absolute left-4 top-4 text-stone-400" />
            <input
              autoFocus
              aria-label="Search menu items"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search menu items…"
              className="w-full rounded-lg border border-stone-200 py-1.5 pl-8 pr-2 text-xs outline-none focus:border-[#8b6f4e]"
            />
          </div>
          <div className="max-h-96 overflow-y-auto overscroll-contain p-3 space-y-3">
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
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5 p-0.5 items-start">
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
                          <div className="space-y-1.5 pt-1">
                            {section.items.map((item) => {
                              const isSelected = value.includes(item._id);
                              return (
                                <label
                                  key={item._id}
                                  className={`flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs transition-all border select-none ${
                                    isSelected
                                      ? 'bg-[#8b6f4e]/10 border-[#8b6f4e]/40 text-[#8b6f4e] font-semibold shadow-2xs'
                                      : 'bg-white border-stone-200/70 text-stone-700 hover:border-[#8b6f4e]/30 hover:bg-[#faf8f5]'
                                  }`}
                                >
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => toggle(item._id)}
                                    className="h-3.5 w-3.5 shrink-0 rounded accent-[#8b6f4e] cursor-pointer"
                                  />
                                  <span className="truncate flex-1" title={item.title}>
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
          <div className="flex justify-between border-t border-stone-100 px-3 py-2 text-xs text-stone-500">
            <span>{value.length} selected</span>
            <button
              type="button"
              disabled={!value.length}
              onClick={() => onChange([])}
              className="text-[#8b6f4e] disabled:opacity-40 cursor-pointer font-semibold"
            >
              Clear selection
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
