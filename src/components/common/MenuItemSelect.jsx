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

export default function MenuItemSelect({ categoryId, value = [], onChange, disabled = false }) {
  const [open, setOpen] = useState(false);
  const [groups, setGroups] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [retry, setRetry] = useState(0);
  const root = useRef(null);
  const trigger = useRef(null);
  const id = useId();

  useEffect(() => {
    if (!open || loaded || !categoryId) return;
    const controller = new AbortController();
    setLoading(true);
    setError('');
    (async () => {
      try {
        const categoryResponse = await api.get(`/categories/${categoryId}`, { signal: controller.signal });
        const categories = [categoryResponse.data.data];
        const sections = await allPages('/menu-sections', controller.signal, { categoryId });
        const items = await allPages('/menu-items', controller.signal, { categoryId });
        if (!controller.signal.aborted) { setGroups(groupMenuItems(categories, sections, items)); setLoaded(true); }
      } catch (err) {
        if (!controller.signal.aborted) setError(err.response?.data?.message || 'Could not load menu items.');
      } finally { if (!controller.signal.aborted) setLoading(false); }
    })();
    return () => controller.abort();
  }, [open, loaded, retry, categoryId]);

  useEffect(() => {
    if (!open) return;
    const outside = (event) => { if (!root.current?.contains(event.target)) setOpen(false); };
    const escape = (event) => { if (event.key === 'Escape') { event.stopPropagation(); setOpen(false); trigger.current?.focus(); } };
    document.addEventListener('pointerdown', outside);
    root.current?.addEventListener('keydown', escape);
    const element = root.current;
    return () => { document.removeEventListener('pointerdown', outside); element?.removeEventListener('keydown', escape); };
  }, [open]);

  const allItems = groups.flatMap((category) => category.sections.flatMap((section) => section.items));
  const missingIds = loaded ? value.filter((itemId) => !allItems.some((item) => item._id === itemId)) : [];
  const query = search.trim().toLowerCase();
  const visible = groups.map((category) => ({ ...category, sections: category.sections.map((section) => ({ ...section, items: section.items.filter((item) => `${category.name} ${section.title} ${item.title}`.toLowerCase().includes(query)) })).filter((section) => section.items.length) })).filter((category) => category.sections.length);
  const summary = value.length === 1 ? allItems.find((item) => item._id === value[0])?.title || '1 item selected' : value.length ? `${value.length} items selected` : 'Select';
  const toggle = (itemId) => onChange(value.includes(itemId) ? value.filter((selected) => selected !== itemId) : [...value, itemId]);

  return <div ref={root} className="relative w-full" onBlur={(event) => { if (event.relatedTarget && !event.currentTarget.contains(event.relatedTarget)) setOpen(false); }}>
    <button ref={trigger} type="button" disabled={disabled || !categoryId} aria-label="Select menu items" aria-expanded={open} aria-controls={id} onClick={() => setOpen((previous) => !previous)} className={`flex min-h-[38px] w-full items-center justify-between gap-2 rounded-xl border bg-[#fdfcfb] px-3 py-2 text-left text-xs disabled:opacity-50 ${open ? 'border-[#8b6f4e] ring-2 ring-[#8b6f4e]/10' : 'border-stone-200'}`}><span className="truncate">{categoryId ? summary : 'Select a category first'}</span><HiOutlineChevronDown className={`shrink-0 text-stone-400 transition-transform ${open ? 'rotate-180' : ''}`} /></button>
    {open && <div id={id} role="group" aria-label="Menu item choices" className="absolute left-0 top-full z-50 mt-1 w-full min-w-[220px] max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl border border-stone-200 bg-white shadow-xl">
      <div className="relative border-b border-stone-100 p-2"><HiOutlineSearch className="absolute left-4 top-4 text-stone-400" /><input autoFocus aria-label="Search menu items" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search menu items…" className="w-full rounded-lg border border-stone-200 py-1.5 pl-8 pr-2 text-xs outline-none focus:border-[#8b6f4e]" /></div>
      <div className="max-h-72 overflow-y-auto overscroll-contain p-2">
        {loading ? <p role="status" className="p-3 text-xs text-stone-500">Loading menu items…</p> : error ? <div role="alert" className="p-3 text-xs text-red-600">{error}<button type="button" className="ml-2 underline" onClick={() => setRetry((previous) => previous + 1)}>Retry</button></div> : <>
          {visible.map((category) => <section key={category._id} className="mb-3 last:mb-0"><h3 className="rounded-md bg-stone-50 px-2 py-1.5 text-[10px] font-bold uppercase tracking-widest text-stone-600">{category.name}{category.status === 'inactive' ? ' (hidden)' : ''}</h3>{category.sections.map((section) => <div key={section._id} className="mt-2"><h4 className="px-2 py-1 text-[9px] font-bold uppercase tracking-widest text-[#8b6f4e]">{section.title}{section.status === 'inactive' ? ' (hidden)' : ''}</h4>{section.items.map((item) => <label key={item._id} className="flex cursor-pointer items-start gap-2 rounded-lg px-2 py-2 text-xs text-stone-700 hover:bg-[#faf6f0]"><input type="checkbox" checked={value.includes(item._id)} onChange={() => toggle(item._id)} className="mt-0.5 h-3.5 w-3.5 shrink-0 accent-[#8b6f4e]" /><span>{item.title}{item.status === 'inactive' && <span className="ml-1 text-stone-400">(hidden)</span>}</span></label>)}</div>)}</section>)}
          {!visible.length && <p className="p-3 text-xs text-stone-500">{query ? 'No matching menu items.' : 'No menu items configured. Add items in Navigation Menus.'}</p>}
          {!!missingIds.length && <div className="border-t border-stone-100 pt-2"><p className="px-2 text-[10px] text-stone-500">Previously selected items no longer available</p>{missingIds.map((itemId) => <label key={itemId} className="flex items-center gap-2 p-2 text-xs"><input type="checkbox" checked onChange={() => toggle(itemId)} className="accent-[#8b6f4e]" />Unavailable item</label>)}</div>}
        </>}
      </div>
      <div className="flex justify-between border-t border-stone-100 px-3 py-2 text-xs text-stone-500"><span>{value.length} selected</span><button type="button" disabled={!value.length} onClick={() => onChange([])} className="text-[#8b6f4e] disabled:opacity-40">Clear selection</button></div>
    </div>}
  </div>;
}
