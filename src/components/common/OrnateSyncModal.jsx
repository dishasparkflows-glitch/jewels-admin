import React, { useState, useEffect, useMemo } from 'react';
import toast from 'react-hot-toast';
import { IoClose, IoRefreshOutline, IoCubeOutline, IoSearchOutline, IoGridOutline, IoListOutline, IoEyeOutline, IoChevronBack, IoChevronForward } from 'react-icons/io5';
import Dropdown from './Dropdown';
import api from '../../api/axios';

const money = (value) => value == null || value === '' ? '—' : new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(Number(value));
const valueOrDash = (value) => value == null || value === '' ? '—' : String(value);
const weight = (value) => value == null || value === '' ? '—' : `${value} g`;
// Only use image URLs supplied with the product; never substitute catalog photos.
const imagesFor = (product) => [...new Set([product.imageUrl, product.image, ...(Array.isArray(product.images) ? product.images : [])]
  .map((image) => typeof image === 'string' ? image : image?.url)
  .filter((url) => typeof url === 'string' && /^(https?:\/\/|\/(?!\/))/.test(url)))];
function ProductPhoto({ url, name, className = '' }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [url]);
  if (!url || failed) return null;
  return <img src={url} alt={name || ''} loading="lazy" onError={() => setFailed(true)} className={className} />;
}
const button = 'rounded-xl border border-stone-200 px-4 py-3 text-[13px] font-semibold hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed';

export default function OrnateSyncModal({ isOpen, onClose, onSyncComplete }) {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const [selected, setSelected] = useState(new Set());
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [metal, setMetal] = useState('');
  const [selectionFilter, setSelectionFilter] = useState('all');
  const [view, setView] = useState('grid');
  const [sort, setSort] = useState('erp');
  const [page, setPage] = useState(1);
  const [detailId, setDetailId] = useState(null);
  const [imageIndex, setImageIndex] = useState(0);

  useEffect(() => {
    if (!isOpen) return;
    let active = true;
    setLoading(true); setError(''); setCategories([]); setSelected(new Set());
    setQuery(''); setSelectedCategory(''); setMetal(''); setPage(1); setDetailId(null); setSelectionFilter('all');
    const load = async () => {
      try {
        let response;
        try { response = await api.get('/ornate/categories', { timeout: 60000 }); }
        catch { response = await api.get('/ornate/erp-categories', { timeout: 60000 }); }
        const data = response.data?.data || response.data || {};
        if (response.data?.success === false) throw new Error(response.data.message || 'Could not load ERP products');
        if (!active) return;
        const items = Array.isArray(data.categories) ? data.categories : [];
        setCategories(items);
        setSelected(new Set(items.flatMap((c) => (c.products || []).filter((p) => p.uniqueLabelID != null && p.uniqueLabelID !== '').map((p) => String(p.uniqueLabelID)))));
      } catch (err) { if (active) setError(err.response?.data?.message || err.message || 'Could not load ERP products'); }
      finally { if (active) setLoading(false); }
    };
    load();
    return () => { active = false; };
  }, [isOpen, retry]);

  useEffect(() => {
    if (!isOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const escape = (event) => { if (event.key === 'Escape' && !syncing) { if (detailId) setDetailId(null); else onClose?.(); } };
    window.addEventListener('keydown', escape);
    return () => {
      window.removeEventListener('keydown', escape);
      const otherModals = document.querySelectorAll('[role="dialog"], [aria-modal="true"]');
      if (otherModals.length <= 1) {
        document.body.style.overflow = '';
      }
    };
  }, [isOpen, syncing, detailId, onClose]);

  const products = useMemo(() => {
    const unique = new Map();
    categories.forEach((c) => (c.products || []).forEach((p, index) => {
      const id = p.uniqueLabelID == null || p.uniqueLabelID === '' ? '' : String(p.uniqueLabelID);
      const key = id || `${c.name}-${index}`;
      if (!unique.has(key)) unique.set(key, { ...p, groupName: p.groupName || c.name, id, key });
    }));
    return [...unique.values()];
  }, [categories]);
  const metals = useMemo(() => [...new Set(products.map((p) => p.metalName).filter(Boolean))], [products]);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    const result = products.filter((p) =>
      (!selectedCategory || String(p.groupName || '').trim().toLowerCase() === selectedCategory.trim().toLowerCase()) &&
      (!metal || p.metalName === metal) &&
      (selectionFilter === 'all' || (selectionFilter === 'selected' ? selected.has(p.id) : !selected.has(p.id))) &&
      (!term || [p.itemName, p.groupName, p.barcodeNo, p.labelNo, p.uniqueLabelID, p.metalName, p.carat].some((v) => String(v ?? '').toLowerCase().includes(term)))
    );
    if (sort === 'name') result.sort((a, b) => String(a.itemName || '').localeCompare(String(b.itemName || '')));
    if (sort === 'priceAsc') result.sort((a, b) => Number(a.price || 0) - Number(b.price || 0));
    if (sort === 'priceDesc') result.sort((a, b) => Number(b.price || 0) - Number(a.price || 0));
    return result;
  }, [products, query, selectedCategory, metal, selectionFilter, selected, sort]);

  useEffect(() => setPage(1), [query, selectedCategory, metal, selectionFilter, sort]);

  const handleSelectCategory = (catName) => {
    // Strictly single selection: if clicked again, toggle back to all; otherwise switch to the single selected category
    const isAlreadySelected = Boolean(catName) && selectedCategory.trim().toLowerCase() === String(catName).trim().toLowerCase();
    const nextCat = isAlreadySelected ? '' : catName;
    setSelectedCategory(nextCat);
    setPage(1);
    const matched = products.filter((p) =>
      p.id &&
      (!nextCat || String(p.groupName || '').trim().toLowerCase() === nextCat.trim().toLowerCase()) &&
      (!metal || p.metalName === metal)
    );
    setSelected(new Set(matched.map((p) => p.id)));
  };

  const handleSelectMetal = (metalName) => {
    // Strictly single selection: if clicked again, toggle back to all; otherwise switch to the single selected metal
    const isAlreadySelected = Boolean(metalName) && metal === metalName;
    const nextMetal = isAlreadySelected ? '' : metalName;
    setMetal(nextMetal);
    setPage(1);
    const matched = products.filter((p) =>
      p.id &&
      (!nextMetal || p.metalName === nextMetal) &&
      (!selectedCategory || String(p.groupName || '').trim().toLowerCase() === selectedCategory.trim().toLowerCase())
    );
    setSelected(new Set(matched.map((p) => p.id)));
  };

  const allFilteredSelected = filtered.length > 0 && filtered.every((p) => p.id && selected.has(p.id));
  const handleToggleAllFiltered = () => {
    if (syncing || !filtered.length) return;
    setSelected((prev) => {
      const next = new Set(prev);
      if (allFilteredSelected) {
        filtered.forEach((p) => { if (p.id) next.delete(p.id); });
      } else {
        filtered.forEach((p) => { if (p.id) next.add(p.id); });
      }
      return next;
    });
  };

  const pageCount = Math.max(1, Math.ceil(filtered.length / 12));
  const currentPage = Math.min(page, pageCount);
  const visible = filtered.slice((currentPage - 1) * 12, currentPage * 12);
  const detail = products.find((p) => p.key === detailId);
  const photos = detail ? imagesFor(detail) : [];
  const toggle = (id) => { if (!id || syncing) return; setSelected((prev) => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next; }); };
  const openDetails = (product) => { setDetailId(product.key); setImageIndex(0); };
  const sync = async () => {
    if (!selected.size || syncing) return;
    setSyncing(true);
    toast.loading(`Syncing ${selected.size} products...`, { id: 'ornate-modal-sync' });
    try {
      const response = await api.post('/ornate/sync-labels', { productIds: [...selected] }, { timeout: 180000 });
      if (response.data?.success === false) throw new Error(response.data.message || 'Sync failed');
      toast.success(response.data?.message || 'Selected products synced', { id: 'ornate-modal-sync' });
      onSyncComplete?.(); onClose?.();
    } catch (err) { toast.error(err.response?.data?.message || err.message || 'Sync failed', { id: 'ornate-modal-sync' }); }
    finally { setSyncing(false); }
  };
  if (!isOpen) return null;

  return <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6">
    <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => !syncing && onClose?.()} />
    <section role="dialog" aria-modal="true" aria-labelledby="ornate-sync-title" className="relative w-full max-w-[1250px] max-h-[92dvh] flex flex-col rounded-[22px] bg-white shadow-2xl overflow-hidden">
      <header className="flex items-center gap-4 border-b border-stone-100 px-6 py-5 shrink-0">
        <div className="p-3 rounded-xl bg-[#f4ece0] text-[#8b6f4e]"><IoCubeOutline size={26} /></div>
        <div className="flex-1"><h2 id="ornate-sync-title" className="text-[20px] font-bold">Sync Products from Ornate ERP</h2><p className="mt-1 text-[13px] text-stone-500">Select products to import in bulk, or open any product to view its ERP details.</p></div>
        <button type="button" className={button} aria-label="Close sync dialog" disabled={syncing} onClick={onClose}><IoClose size={20} /></button>
      </header>
      <div className="px-6 py-4 border-b border-stone-100 space-y-3 shrink-0">
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]"><IoSearchOutline className="absolute left-3 top-4 text-stone-400" size={18} /><input aria-label="Search ERP products" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search product name, label, barcode, metal, category..." className="h-[44px] w-full rounded-xl border border-stone-200 pl-10 pr-3 text-[13px]" /></div>
          <Dropdown className="w-[150px]" value={sort} onChange={setSort} options={[{ value: 'erp', label: 'ERP order' }, { value: 'name', label: 'Name' }, { value: 'priceAsc', label: 'Price: Low to high' }, { value: 'priceDesc', label: 'Price: High to low' }]} />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {[{ name: '', label: `All (${products.length})` }, ...metals.map((name) => ({ name, label: `${name} (${products.filter((p) => p.metalName === name).length})` }))].map((tab) => <button type="button" key={tab.name} aria-pressed={metal === tab.name} onClick={() => handleSelectMetal(tab.name)} className={`rounded-full px-4 py-2 border text-[12px] cursor-pointer transition-colors ${metal === tab.name ? 'bg-[#8b6f4e] border-[#8b6f4e] text-white shadow-xs' : 'border-stone-200 text-stone-600 hover:bg-stone-50'}`}>{tab.label}</button>)}
          <div role="group" aria-label="Filter by categories" className="flex flex-wrap items-center gap-2 border-l border-stone-200 pl-3">
            <span className="text-[12px] font-semibold text-stone-500">Categories</span>
            <button
              type="button"
              aria-pressed={!selectedCategory}
              onClick={() => handleSelectCategory('')}
              className={`rounded-full px-4 py-2 border text-[12px] font-medium transition-colors cursor-pointer ${
                !selectedCategory
                  ? 'bg-[#8b6f4e] border-[#8b6f4e] text-white shadow-xs'
                  : 'border-stone-200 text-stone-600 hover:bg-stone-50'
              }`}
            >
              All categories
            </button>
            {categories.map((item) => {
              const active = selectedCategory.trim().toLowerCase() === item.name.trim().toLowerCase();
              return (
                <button
                  type="button"
                  key={item.name}
                  aria-pressed={active}
                  onClick={() => handleSelectCategory(item.name)}
                  className={`rounded-full px-4 py-2 border text-[12px] text-left font-medium transition-colors cursor-pointer ${
                    active
                      ? 'bg-[#8b6f4e] border-[#8b6f4e] text-white shadow-xs'
                      : 'border-stone-200 text-stone-600 hover:bg-stone-50'
                  }`}
                >
                  {item.name} ({item.count ?? item.products?.length ?? 0})
                </button>
              );
            })}
          </div>
          <div className="ml-auto flex items-center gap-2"><Dropdown className="w-[145px]" size="sm" value={selectionFilter} onChange={setSelectionFilter} options={[{ value: 'all', label: 'All selections' }, { value: 'selected', label: 'Selected' }, { value: 'unselected', label: 'Unselected' }]} />
            {[['grid', IoGridOutline], ['list', IoListOutline]].map(([mode, Icon]) => <button key={mode} type="button" aria-label={`${mode} view`} aria-pressed={view === mode} onClick={() => setView(mode)} className={`rounded-lg p-3 ${view === mode ? 'bg-[#8b6f4e] text-white' : 'bg-stone-100 text-stone-600'}`}><Icon size={18} /></button>)}
          </div>
        </div>
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto">
        {loading ? <div className="p-20 text-center text-stone-500"><IoRefreshOutline size={30} className="animate-spin mx-auto mb-3" />Loading products from Ornate ERP...</div> : error ? <div className="p-8 text-red-700" role="alert">{error}<button type="button" className={`${button} ml-4`} onClick={() => setRetry((n) => n + 1)}>Retry</button></div> : <div className={`grid ${detail ? 'lg:grid-cols-[minmax(0,1.5fr)_minmax(300px,1fr)]' : ''}`}>
          <div className="p-6 min-w-0">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4 text-[13px]">
              <div className="flex items-center gap-2">
                <span className="font-semibold">
                  Products ({filtered.length})
                  {selectedCategory && (
                    <span className="ml-1.5 text-xs font-normal text-stone-500">
                      in <strong className="text-stone-800">{selectedCategory}</strong>
                    </span>
                  )}
                </span>
                {filtered.length > 0 && (
                  <span className="text-xs text-stone-400">
                    ({(currentPage - 1) * 12 + 1}–{Math.min(currentPage * 12, filtered.length)})
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {pageCount > 1 && (
                  <div className="flex items-center gap-1.5 bg-stone-50 border border-stone-200 rounded-xl px-2 py-1">
                    <button
                      type="button"
                      aria-label="Previous page (top)"
                      className="h-7 w-7 inline-flex items-center justify-center rounded-lg hover:bg-white text-stone-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                      disabled={currentPage === 1}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                    >
                      <IoChevronBack size={15} />
                    </button>
                    <span className="text-[12px] font-semibold text-stone-700 px-2 select-none min-w-[50px] text-center">
                      {currentPage} / {pageCount}
                    </span>
                    <button
                      type="button"
                      aria-label="Next page (top)"
                      className="h-7 w-7 inline-flex items-center justify-center rounded-lg hover:bg-white text-stone-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                      disabled={currentPage === pageCount}
                      onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
                    >
                      <IoChevronForward size={15} />
                    </button>
                  </div>
                )}

                <button
                  type="button"
                  className="text-[#8b6f4e] hover:text-[#785e40] font-semibold disabled:opacity-40 cursor-pointer whitespace-nowrap"
                  disabled={syncing || !filtered.length}
                  onClick={handleToggleAllFiltered}
                >
                  {allFilteredSelected
                    ? `Deselect all ${filtered.length} results`
                    : `Select all ${filtered.length} results`}
                </button>
              </div>
            </div>
            {!visible.length && <p className="py-16 text-center text-stone-500">No products match these filters.</p>}
            <div className={view === 'grid' ? `grid grid-cols-1 sm:grid-cols-2 ${detail ? '' : 'lg:grid-cols-3 xl:grid-cols-4'} gap-3` : 'space-y-2'}>
              {visible.map((product) => { const image = imagesFor(product)[0]; return <article key={product.key} className={`rounded-xl border overflow-hidden ${selected.has(product.id) ? 'border-[#b8946c] bg-[#faf6f0]' : 'border-stone-200 bg-white'} ${detailId === product.key ? 'ring-2 ring-[#8b6f4e]/30' : ''}`}>
                <div className={`p-3 ${view === 'list' ? 'flex items-center gap-3' : ''}`}>
                  <div className={`flex items-center justify-between gap-3 ${view === 'grid' ? 'mb-2' : ''}`}><input type="checkbox" aria-label={`Select ${product.itemName || product.labelNo}`} checked={selected.has(product.id)} disabled={syncing || !product.id} onChange={() => toggle(product.id)} className="w-[18px] h-[18px] accent-[#8b6f4e]" />{view === 'grid' && <button type="button" aria-label={`View ${product.itemName || 'product'} details`} onClick={() => openDetails(product)} className="rounded-full p-1.5 text-[#8b6f4e] hover:bg-[#f4ece0]"><IoEyeOutline size={18} /></button>}</div>
                  {image && <ProductPhoto url={image} name={product.itemName} className={view === 'grid' ? 'w-full h-[130px] object-contain rounded-lg bg-stone-50 mb-3' : 'w-[56px] h-[56px] object-contain rounded-lg shrink-0'} />}
                  <button type="button" onClick={() => openDetails(product)} className="text-left min-w-0 flex-1 w-full">
                    <h3 className="text-[13px] leading-relaxed font-bold break-words">{product.itemName || 'Unnamed ERP product'}</h3>
                    <p className="text-[12px] text-stone-500 mt-1 break-all">Label: {valueOrDash(product.labelNo)}</p>
                    <div className="flex flex-wrap gap-1 mt-2">{[product.metalName, product.carat].filter(Boolean).map((tag, index) => <span key={index} className="rounded bg-[#f1e7da] text-[#785e40] px-2 py-0.5 text-[11px]">{tag}</span>)}</div>
                    <p className="text-[11px] text-stone-500 mt-2">Gross: {weight(product.grossWt)} · Net: {weight(product.netWt)}</p>
                    <p className="text-[11px] text-stone-500 mt-1 break-all">Barcode: {valueOrDash(product.barcodeNo)}</p>
                    <p className="text-[14px] font-bold mt-3">{money(product.price)}</p>
                  </button>
                </div>
              </article>; })}
            </div>
            <nav aria-label="Product pages" className="flex justify-between items-center gap-3 mt-5 text-[12px]">
              <span className="text-stone-500">
                {filtered.length ? `${(currentPage - 1) * 12 + 1}–${Math.min(currentPage * 12, filtered.length)} of ${filtered.length}` : '0 products'}
              </span>
              <div className="flex items-center gap-1.5 bg-stone-50 border border-stone-200 rounded-xl px-2 py-1">
                <button
                  type="button"
                  aria-label="Previous page (bottom)"
                  className="h-7 w-7 inline-flex items-center justify-center rounded-lg hover:bg-white text-stone-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                  disabled={currentPage === 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  <IoChevronBack size={15} />
                </button>
                <span className="text-[12px] font-semibold text-stone-700 px-2 select-none min-w-[50px] text-center">
                  {currentPage} / {pageCount}
                </span>
                <button
                  type="button"
                  aria-label="Next page (bottom)"
                  className="h-7 w-7 inline-flex items-center justify-center rounded-lg hover:bg-white text-stone-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                  disabled={currentPage === pageCount}
                  onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
                >
                  <IoChevronForward size={15} />
                </button>
              </div>
            </nav>
          </div>
          {detail && <aside className="border-t lg:border-t-0 lg:border-l border-stone-200 p-6 bg-stone-50/50 min-w-0">
            <div className="flex items-center justify-between mb-4"><h3 className="text-[14px] font-bold">Product details</h3><button type="button" aria-label="Close product details" onClick={() => setDetailId(null)} className="p-2"><IoClose size={20} /></button></div>
            {photos.length > 0 && <div className="mb-4"><ProductPhoto url={photos[imageIndex]} name={detail.itemName} className="w-full max-h-[240px] object-contain rounded-xl" />{photos.length > 1 && <div className="flex justify-between items-center mt-2"><button type="button" aria-label="Previous image" onClick={() => setImageIndex((imageIndex + photos.length - 1) % photos.length)}><IoChevronBack /></button><span>{imageIndex + 1} / {photos.length}</span><button type="button" aria-label="Next image" onClick={() => setImageIndex((imageIndex + 1) % photos.length)}><IoChevronForward /></button></div>}</div>}
            <h4 className="text-[16px] font-bold leading-relaxed mb-4">{detail.itemName || 'Unnamed ERP product'}</h4>
            <dl className="rounded-xl border border-stone-200 bg-white overflow-hidden text-[12px]">{[
              ['Category', detail.groupName], ['Metal', detail.metalName], ['Carat / purity code', detail.carat], ['ERP unique label ID', detail.uniqueLabelID], ['Label number', detail.labelNo], ['Barcode', detail.barcodeNo], ['Gross weight', weight(detail.grossWt)], ['Net weight', weight(detail.netWt)], ['Price', money(detail.price)], ['Stock', detail.inStock == null ? null : Number(detail.inStock) === 1 ? 'In stock' : 'Out of stock'],
            ].map(([label, value]) => <div key={label} className="grid grid-cols-2 gap-3 p-3 border-b last:border-0 border-stone-100"><dt className="text-stone-500">{label}</dt><dd className="font-medium break-words">{valueOrDash(value)}</dd></div>)}</dl>
            <button type="button" disabled={syncing || !detail.id} onClick={() => toggle(detail.id)} className="w-full mt-4 bg-[#8b6f4e] text-white rounded-xl px-4 py-3 text-[13px] font-semibold disabled:opacity-40">{selected.has(detail.id) ? 'Remove from selection' : 'Add to selection'}</button>
          </aside>}
        </div>}
      </div>
      <footer className="px-6 py-4 border-t border-stone-200 shrink-0 bg-white">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3 text-[13px]">
          <span>
            <strong>{selected.size} of {products.length}</strong> products selected
            {selectedCategory && (
              <span className="ml-2 text-stone-500 font-normal">
                (category: <strong className="text-stone-800">{selectedCategory}</strong>)
              </span>
            )}
          </span>
        </div>
        <div className="flex flex-wrap justify-end gap-3"><button type="button" className={`${button} mr-auto text-red-600`} disabled={syncing || !selected.size} onClick={() => setSelected(new Set())}>Clear All</button><button type="button" className={button} disabled={syncing} onClick={onClose}>Cancel</button><button type="button" disabled={loading || !!error || syncing || !selected.size} onClick={sync} className="flex items-center gap-2 rounded-xl px-6 py-3 bg-[#8b6f4e] hover:bg-[#785e40] text-white text-[13px] font-semibold disabled:opacity-40 disabled:cursor-not-allowed"><IoRefreshOutline size={18} className={syncing ? 'animate-spin' : ''} />{syncing ? 'Syncing...' : `Sync Selected (${selected.size} Products)`}</button></div>
      </footer>
    </section>
  </div>;
}
