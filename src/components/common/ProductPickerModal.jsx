/* eslint-disable react/prop-types */
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  HiOutlineX,
  HiOutlineSearch,
  HiOutlineCheck,
  HiOutlineSparkles,
} from 'react-icons/hi';
import {
  IoDiamondOutline,
  IoCubeOutline,
  IoLayersOutline,
} from 'react-icons/io5';
import toast from 'react-hot-toast';
import api from '../../api/axios';

const PRODUCT_PICKER_TABS = [
  { id: 'gold', label: 'Gold Jewelry', icon: IoDiamondOutline, badge: 'GOLD' },
  { id: 'silver', label: 'Silver Jewelry', icon: IoCubeOutline, badge: 'SILVER' },
  { id: 'ornate', label: 'Ornate Products', icon: HiOutlineSparkles, badge: 'ORNATE' },
  { id: 'all', label: 'All Products', icon: IoLayersOutline, badge: 'ALL' },
];

export default function ProductPickerModal({
  isOpen = false,
  onClose,
  onApply,
  initialSelected = [],
  title = 'Select Products',
  subtitle = 'Search and select products across pages. Selections stay saved when navigating pages.',
}) {
  const [pickerTab, setPickerTab] = useState('gold'); // 'gold' | 'silver' | 'ornate' | 'all'
  const [pickerSearch, setPickerSearch] = useState('');
  const [pickerPage, setPickerPage] = useState(1);
  const [pickerLimit, setPickerLimit] = useState(25);
  const [pickerLoading, setPickerLoading] = useState(false);
  const [pickerProducts, setPickerProducts] = useState([]);
  const [pickerPagination, setPickerPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalDocs: 0,
    limit: 25,
  });

  // Map of productId -> full product object across tabs and pages
  const [tempSelectedMap, setTempSelectedMap] = useState(new Map());

  // Initialize selected products map when modal opens
  useEffect(() => {
    if (!isOpen) return;

    const newMap = new Map();
    (initialSelected || []).forEach((item) => {
      if (!item) return;
      const id = typeof item === 'object' ? String(item._id || item.id || item.productId || '') : String(item);
      if (id) {
        newMap.set(id, typeof item === 'object' ? item : { _id: id, id });
      }
    });

    setTempSelectedMap(newMap);
    setPickerSearch('');
    setPickerPage(1);
    setPickerTab('gold');
  }, [isOpen, initialSelected]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (!isOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen]);

  // Fetch products from API
  const fetchPickerProducts = useCallback(async (
    page = pickerPage,
    type = pickerTab,
    searchStr = pickerSearch,
    limit = pickerLimit
  ) => {
    try {
      setPickerLoading(true);
      const params = new URLSearchParams();
      params.append('page', String(page));
      params.append('limit', String(limit));
      params.append('status', 'approved');
      if (type && type !== 'all') {
        params.append('productType', type);
      }
      if (searchStr && searchStr.trim()) {
        params.append('search', searchStr.trim());
      }

      const res = await api.get(`/products/lookup?${params.toString()}`);
      const items = res.data?.data || [];
      const pagination = res.data?.pagination || {
        currentPage: page,
        totalPages: 1,
        totalDocs: items.length,
        limit,
      };

      setPickerProducts(Array.isArray(items) ? items : []);
      setPickerPagination(pagination);
      setPickerPage(page);

      // Enrich any stub items in tempSelectedMap with fresh API data
      setTempSelectedMap((prevMap) => {
        let updated = false;
        const next = new Map(prevMap);
        items.forEach((item) => {
          const key = String(item._id || item.id);
          if (next.has(key)) {
            const existing = next.get(key);
            if (!existing.title || !existing.thumbnail) {
              next.set(key, { ...existing, ...item });
              updated = true;
            }
          }
        });
        return updated ? next : prevMap;
      });
    } catch (err) {
      console.error('Failed to load products for picker:', err);
      toast.error('Failed to load catalog products');
    } finally {
      setPickerLoading(false);
    }
  }, [pickerPage, pickerTab, pickerSearch, pickerLimit]);

  useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(() => {
      fetchPickerProducts(pickerPage, pickerTab, pickerSearch, pickerLimit);
    }, 250);
    return () => clearTimeout(timer);
  }, [isOpen, pickerTab, pickerSearch, pickerPage, pickerLimit, fetchPickerProducts]);

  // Toggle single product selection
  const handleToggleProduct = (product) => {
    const key = String(product._id || product.id);
    setTempSelectedMap((prev) => {
      const next = new Map(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.set(key, product);
      }
      return next;
    });
  };

  // Toggle select all on current page
  const isAllPageSelected = useMemo(() => {
    if (!pickerProducts.length) return false;
    return pickerProducts.every((p) => tempSelectedMap.has(String(p._id || p.id)));
  }, [pickerProducts, tempSelectedMap]);

  const handleToggleSelectAllPage = () => {
    setTempSelectedMap((prev) => {
      const next = new Map(prev);
      if (isAllPageSelected) {
        pickerProducts.forEach((p) => next.delete(String(p._id || p.id)));
      } else {
        pickerProducts.forEach((p) => next.set(String(p._id || p.id), p));
      }
      return next;
    });
  };

  const handleApply = () => {
    const selectedList = Array.from(tempSelectedMap.values());
    if (onApply) {
      onApply(selectedList);
    }
    if (onClose) {
      onClose();
    }
  };

  const getProductBadgeLabel = (prod) => {
    const type = (prod.productType || prod.type || '').toLowerCase();
    if (type === 'gold') return 'GOLD';
    if (type === 'silver') return 'SILVER';
    if (type === 'ornate') return 'ORNATE';
    return (prod.category?.name || 'JEWELRY').toUpperCase();
  };

  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center p-3 sm:p-5 bg-black/70 backdrop-blur-xs animate-fadeIn overflow-y-auto cursor-pointer"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl border border-stone-200 shadow-2xl w-full max-w-5xl overflow-hidden my-auto max-h-[92vh] flex flex-col cursor-default relative z-[10001] animate-scaleIn"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Picker Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100 bg-white shrink-0">
          <div>
            <div className="flex items-center gap-2.5">
              <h3 className="text-base sm:text-lg font-bold text-stone-900 tracking-tight font-playfair">
                {title}
              </h3>
              <span
                style={{ backgroundColor: 'var(--theme-primary, #8b6f4e)' }}
                className="px-2.5 py-0.5 rounded-full text-[11px] font-bold text-white shadow-2xs"
              >
                {tempSelectedMap.size} Selected
              </span>
            </div>
            <p className="text-xs text-stone-500 mt-0.5">{subtitle}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full border border-stone-200 text-stone-400 hover:text-stone-700 hover:bg-stone-50 flex items-center justify-center transition-colors cursor-pointer shadow-2xs"
            aria-label="Close product picker"
          >
            <HiOutlineX className="w-4 h-4 stroke-2" />
          </button>
        </div>

        {/* Filter Tabs & Search Bar */}
        <div className="px-6 py-3 border-b border-stone-100 bg-stone-50/50 space-y-3 shrink-0">
          {/* Category Tabs */}
          <div className="flex flex-wrap items-center gap-2">
            {PRODUCT_PICKER_TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = pickerTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setPickerTab(tab.id);
                    setPickerPage(1);
                  }}
                  style={isActive ? { backgroundColor: 'var(--theme-primary, #8b6f4e)', borderColor: 'var(--theme-primary, #8b6f4e)' } : {}}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                    isActive
                      ? 'text-white shadow-xs'
                      : 'bg-white border border-stone-200 text-stone-600 hover:border-stone-300 hover:bg-stone-50'
                  }`}
                >
                  <Icon
                    className="w-3.5 h-3.5"
                    style={{ color: isActive ? '#ffffff' : 'var(--theme-primary, #8b6f4e)' }}
                  />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Search, Select All Page, and Show Limit */}
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <HiOutlineSearch className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={pickerSearch}
                onChange={(e) => {
                  setPickerSearch(e.target.value);
                  setPickerPage(1);
                }}
                placeholder="Search Jewelry by title or SKU..."
                className="w-full text-xs bg-white border border-stone-200 rounded-xl pl-9 pr-3 py-2 text-stone-900 focus:outline-none focus:border-[var(--theme-primary,#8b6f4e)] focus:ring-1 focus:ring-[var(--theme-primary,#8b6f4e)]/30 shadow-2xs"
              />
            </div>

            <div className="flex items-center gap-2.5 w-full sm:w-auto justify-between sm:justify-end shrink-0">
              <button
                type="button"
                onClick={handleToggleSelectAllPage}
                className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer shadow-2xs ${
                  isAllPageSelected
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                    : 'bg-white border-stone-200 text-stone-700 hover:bg-stone-50'
                }`}
              >
                <HiOutlineCheck className={`w-3.5 h-3.5 ${isAllPageSelected ? 'text-emerald-600' : 'text-stone-400'}`} />
                <span>{isAllPageSelected ? 'Deselect Page' : 'Select All Page'}</span>
              </button>

              <div className="flex items-center gap-1.5 text-xs text-stone-500">
                <span className="text-[11px] font-bold text-stone-400 uppercase">SHOW</span>
                <select
                  value={pickerLimit}
                  onChange={(e) => {
                    setPickerLimit(Number(e.target.value));
                    setPickerPage(1);
                  }}
                  className="bg-white border border-stone-200 rounded-xl px-2.5 py-1.5 text-xs text-stone-800 font-semibold focus:outline-none focus:border-[var(--theme-primary,#8b6f4e)] cursor-pointer shadow-2xs"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Product Grid Area */}
        <div className="flex-1 overflow-y-auto p-6 bg-stone-50/20 scrollbar-thin">
          {pickerLoading ? (
            <div className="py-20 flex flex-col items-center justify-center text-stone-400 gap-2">
              <div
                style={{ borderTopColor: 'var(--theme-primary, #8b6f4e)' }}
                className="w-8 h-8 border-2 border-stone-300 rounded-full animate-spin"
              />
              <span className="text-xs font-semibold">Loading catalog pieces...</span>
            </div>
          ) : pickerProducts.length === 0 ? (
            <div className="py-16 text-center">
              <IoDiamondOutline className="w-10 h-10 text-stone-300 mx-auto mb-2" />
              <h4 className="text-sm font-bold text-stone-800">No products found</h4>
              <p className="text-xs text-stone-500 mt-1">
                Try adjusting your search query or selecting a different jewelry category.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {pickerProducts.map((prod) => {
                const isSelected = tempSelectedMap.has(String(prod._id || prod.id));
                const badge = getProductBadgeLabel(prod);
                const thumb =
                  prod.thumbnail ||
                  prod.colorImages?.[0]?.images?.[0]?.url ||
                  prod.images?.[0]?.url ||
                  prod.image?.url;
                const price = Number(
                  prod.price || prod.salePrice || prod.pricing?.sellingPrice || 0
                );

                return (
                  <div
                    key={prod._id || prod.id}
                    onClick={() => handleToggleProduct(prod)}
                    style={isSelected ? { borderColor: 'var(--theme-primary, #8b6f4e)' } : {}}
                    className={`relative flex flex-col p-2.5 rounded-2xl bg-white border transition-all cursor-pointer select-none group shadow-2xs ${
                      isSelected
                        ? 'ring-2 ring-[var(--theme-primary,#8b6f4e)]/30 bg-[#faf6f0]'
                        : 'border-stone-200 hover:border-stone-300 hover:shadow-xs'
                    }`}
                  >
                    {/* Top card row: Checkbox and Category Badge */}
                    <div className="flex items-center justify-between mb-1">
                      <div
                        style={isSelected ? { backgroundColor: 'var(--theme-primary, #8b6f4e)', borderColor: 'var(--theme-primary, #8b6f4e)' } : {}}
                        className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${
                          isSelected
                            ? 'text-white'
                            : 'border-stone-300 bg-white'
                        }`}
                      >
                        {isSelected && <HiOutlineCheck className="w-3 h-3 stroke-2" />}
                      </div>
                      <span
                        style={{ color: 'var(--theme-primary, #8b6f4e)' }}
                        className="text-[9px] font-bold tracking-wider uppercase"
                      >
                        {badge}
                      </span>
                    </div>

                    {/* Product Image */}
                    <div className="h-28 flex items-center justify-center p-1.5 my-1 overflow-hidden">
                      {thumb ? (
                        <img
                          src={thumb}
                          alt={prod.title}
                          className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-200"
                          loading="lazy"
                        />
                      ) : (
                        <IoDiamondOutline className="w-8 h-8 text-stone-300" />
                      )}
                    </div>

                    {/* Product Info */}
                    <div className="mt-auto pt-1">
                      <h5
                        className="text-[11px] font-semibold text-stone-800 line-clamp-2 leading-tight"
                        title={prod.title}
                      >
                        {prod.title}
                      </h5>
                      <p className="text-xs font-bold text-stone-900 mt-1">
                        ₹{price.toLocaleString('en-IN')}
                      </p>
                      <p className="text-[10px] text-stone-400 font-mono mt-0.5 truncate">
                        SKU: {prod.sku || 'N/A'}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Pagination Footer */}
        <div className="px-6 py-3 border-t border-stone-100 bg-white flex flex-col sm:flex-row items-center justify-between gap-2 shrink-0">
          <span className="text-xs text-stone-500 font-medium">
            Showing {pickerProducts.length > 0 ? (pickerPage - 1) * pickerLimit + 1 : 0} to{' '}
            {Math.min(pickerPage * pickerLimit, pickerPagination.totalDocs || pickerProducts.length)} of{' '}
            {pickerPagination.totalDocs || pickerProducts.length} pieces
          </span>

          {pickerPagination.totalPages > 1 && (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={pickerPage <= 1}
                onClick={() => setPickerPage((p) => Math.max(1, p - 1))}
                className="w-7 h-7 rounded-lg border border-stone-200 text-stone-600 hover:bg-stone-50 disabled:opacity-30 flex items-center justify-center text-xs cursor-pointer shadow-2xs"
              >
                &lt;
              </button>
              {Array.from({ length: Math.min(5, pickerPagination.totalPages) }, (_, i) => {
                let pageNum = i + 1;
                if (pickerPagination.totalPages > 5 && pickerPage > 3) {
                  pageNum = pickerPage - 2 + i;
                  if (pageNum > pickerPagination.totalPages) {
                    pageNum = pickerPagination.totalPages - 4 + i;
                  }
                }
                const isCurrent = pageNum === pickerPage;
                return (
                  <button
                    key={pageNum}
                    type="button"
                    onClick={() => setPickerPage(pageNum)}
                    style={isCurrent ? { backgroundColor: 'var(--theme-primary, #8b6f4e)' } : {}}
                    className={`w-7 h-7 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                      isCurrent
                        ? 'text-white shadow-2xs'
                        : 'border border-stone-200 text-stone-700 hover:bg-stone-50 shadow-2xs'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              <button
                type="button"
                disabled={pickerPage >= pickerPagination.totalPages}
                onClick={() => setPickerPage((p) => p + 1)}
                className="w-7 h-7 rounded-lg border border-stone-200 text-stone-600 hover:bg-stone-50 disabled:opacity-30 flex items-center justify-center text-xs cursor-pointer shadow-2xs"
              >
                &gt;
              </button>
            </div>
          )}
        </div>

        {/* Bottom Action Bar */}
        <div className="px-6 py-3.5 border-t border-stone-200 bg-stone-50/70 flex items-center justify-between shrink-0">
          <span className="text-xs font-semibold text-stone-700">
            <strong className="text-stone-900">SELECTED ({tempSelectedMap.size}):</strong>{' '}
            <span className="text-stone-500 font-normal">
              {tempSelectedMap.size === 0
                ? 'No products chosen yet'
                : `${tempSelectedMap.size} product${tempSelectedMap.size > 1 ? 's' : ''} chosen across tabs`}
            </span>
          </span>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-stone-200 text-stone-700 bg-white rounded-xl text-xs font-semibold hover:bg-stone-50 cursor-pointer shadow-2xs transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleApply}
              style={{ backgroundColor: 'var(--theme-primary, #8b6f4e)' }}
              className="px-5 py-2 hover:opacity-90 text-white rounded-xl text-xs font-semibold shadow-xs transition-opacity cursor-pointer"
            >
              Apply Selection ({tempSelectedMap.size})
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

