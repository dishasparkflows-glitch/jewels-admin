import { useState, useEffect, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  HiOutlineTrendingUp,
  HiOutlineUsers,
  HiOutlineEye,
  HiOutlineGlobeAlt,
  HiOutlineClock,
  HiOutlineRefresh,
  HiOutlineShoppingCart,
  HiOutlineHeart,
  HiOutlineSearch,
  HiOutlineX,
  HiOutlinePhone,
  HiOutlineMail,
  HiOutlineClipboardCopy,
  HiOutlineCheck,
  HiOutlineArrowSmUp,
  HiOutlineArrowSmDown,
  HiOutlineCalendar,
} from 'react-icons/hi';
import { IoDiamondOutline } from 'react-icons/io5';
import toast from 'react-hot-toast';
import Pagination from '../common/Pagination';
import DatePicker, { formatDateDisplay } from '../common/DatePicker';
import { useAdminPageSize } from '../../utils/adminPagination';
import { analyticsAPI } from '../../api/services';

const PRESET_DATE_RANGES = [
  { label: 'Today', value: 'today' },
  { label: 'Yesterday', value: 'yesterday' },
  { label: 'Last 7 Days', value: '7daysAgo' },
  { label: 'Last 30 Days', value: '30daysAgo' },
  { label: 'Last 90 Days', value: '90daysAgo' },
  { label: 'Custom Range', value: 'custom' },
];

const INITIAL_ANALYTICS_STATE = {
  summary: {
    totalUsers: 0,
    totalSessions: 0,
    pageViews: 0,
    productViews: 0,
    addToCart: 0,
    addToWishlist: 0,
  },
  cartProducts: [],
  wishlistProducts: [],
  viewedProducts: [],
};

export default function GoogleAnalyticsSection() {
  const [selectedRange, setSelectedRange] = useState('30daysAgo');
  const [isCustomDate, setIsCustomDate] = useState(false);
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [isCustomDrawerOpen, setIsCustomDrawerOpen] = useState(false);
  const [draftStartDate, setDraftStartDate] = useState('');
  const [draftEndDate, setDraftEndDate] = useState('');

  const [activeTab, setActiveTab] = useState('cart'); // 'cart' | 'wishlist' | 'views'
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(INITIAL_ANALYTICS_STATE);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField] = useState('count'); // 'count' | 'name'
  const [sortAsc, setSortAsc] = useState(false);

  const [page, setPage] = useState(1);
  const [pageSize] = useAdminPageSize();

  // Customer Lead Outreach Modal State
  const [customerModalItem, setCustomerModalItem] = useState(null);
  const [copiedPhone, setCopiedPhone] = useState(null);

  // Copy phone handler with visual feedback & toast
  const handleCopyPhone = (phone) => {
    if (!phone) return;
    navigator.clipboard.writeText(phone);
    setCopiedPhone(phone);
    toast.success(`Copied phone: ${phone}`);
    setTimeout(() => setCopiedPhone(null), 2500);
  };

  const fetchData = useCallback(async () => {
    if (isCustomDate && (!customStartDate || !customEndDate)) {
      return;
    }

    setLoading(true);
    try {
      const startDate = isCustomDate && customStartDate ? customStartDate : selectedRange;
      const endDate = isCustomDate && customEndDate ? customEndDate : 'today';
      const params = { startDate, endDate, limit: 100 };

      const [overviewRes, cartRes, wishlistRes, viewsRes] = await Promise.allSettled([
        analyticsAPI.getOverview({ startDate, endDate }),
        analyticsAPI.getAddToCartReport(params),
        analyticsAPI.getWishlistReport(params),
        analyticsAPI.getViewsReport(params),
      ]);

      const nextData = {
        summary: {
          totalUsers: 0,
          totalSessions: 0,
          pageViews: 0,
          productViews: 0,
          addToCart: 0,
          addToWishlist: 0,
        },
        cartProducts: [],
        wishlistProducts: [],
        viewedProducts: [],
      };

      if (overviewRes.status === 'fulfilled' && overviewRes.value?.data?.data) {
        const ov = overviewRes.value.data.data;
        if (ov.summary) {
          nextData.summary = { ...nextData.summary, ...ov.summary };
        }
      }

      if (cartRes.status === 'fulfilled' && cartRes.value?.data) {
        const cData = cartRes.value.data.data || [];
        nextData.cartProducts = cData;
        if (cartRes.value.data.totals?.totalItemsAdded !== undefined) {
          nextData.summary.addToCart = cartRes.value.data.totals.totalItemsAdded;
        } else {
          nextData.summary.addToCart = cData.reduce((sum, item) => sum + (item.count || 0), 0);
        }
      }

      if (wishlistRes.status === 'fulfilled' && wishlistRes.value?.data) {
        const wData = wishlistRes.value.data.data || [];
        nextData.wishlistProducts = wData;
        if (wishlistRes.value.data.totals?.totalItemsAdded !== undefined) {
          nextData.summary.addToWishlist = wishlistRes.value.data.totals.totalItemsAdded;
        } else {
          nextData.summary.addToWishlist = wData.reduce((sum, item) => sum + (item.count || 0), 0);
        }
      }

      if (viewsRes.status === 'fulfilled' && viewsRes.value?.data) {
        const vData = viewsRes.value.data.data || [];
        nextData.viewedProducts = vData;
      }

      setData(nextData);
    } catch (err) {
      console.error('Failed to load GA4 analytics reports:', err);
      toast.error('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  }, [selectedRange, isCustomDate, customStartDate, customEndDate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Lock scroll and listen for Escape key when modal or custom date sidebar is open
  useEffect(() => {
    if (!customerModalItem && !isCustomDrawerOpen) return;
    document.body.style.overflow = 'hidden';
    const handleKeyDown = (e) => {
      if (e.key !== 'Escape') return;
      if (document.querySelector('[data-datepicker-popup="true"]')) return;
      if (customerModalItem) setCustomerModalItem(null);
      else if (isCustomDrawerOpen) setIsCustomDrawerOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [customerModalItem, isCustomDrawerOpen]);

  const handleOpenCustomDrawer = () => {
    setDraftStartDate(customStartDate);
    setDraftEndDate(customEndDate);
    setIsCustomDrawerOpen(true);
  };

  const handleApplyCustomRange = () => {
    if (!draftStartDate || !draftEndDate) {
      toast.error('Please select both start date and end date');
      return;
    }
    const isSame =
      isCustomDate &&
      selectedRange === 'custom' &&
      customStartDate === draftStartDate &&
      customEndDate === draftEndDate;

    setCustomStartDate(draftStartDate);
    setCustomEndDate(draftEndDate);
    setSelectedRange('custom');
    setIsCustomDate(true);
    setIsCustomDrawerOpen(false);
    setPage(1);

    if (isSame) {
      fetchData();
    }
  };

  // Extract metrics & summaries
  const summary = data?.summary || {};

  // Active items based on current tab
  const rawTabItems = useMemo(() => {
    if (activeTab === 'cart') return data?.cartProducts || [];
    if (activeTab === 'wishlist') return data?.wishlistProducts || [];
    return data?.viewedProducts || [];
  }, [activeTab, data]);

  // Filtered & sorted items
  const filteredItems = useMemo(() => {
    let items = [...rawTabItems];

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase().trim();
      items = items.filter((item) => {
        const titleMatch = (item.product?.title || item.name || '').toLowerCase().includes(q);
        const skuMatch = (item.product?.sku || '').toLowerCase().includes(q);
        const catMatch = (item.product?.category || '').toLowerCase().includes(q);
        const userMatch = (item.users || []).some((u) =>
          (u.name || '').toLowerCase().includes(q) || (u.phone || '').includes(q)
        );
        return titleMatch || skuMatch || catMatch || userMatch;
      });
    }

    items.sort((a, b) => {
      if (sortField === 'name') {
        const nameA = (a.product?.title || a.name || '').toLowerCase();
        const nameB = (b.product?.title || b.name || '').toLowerCase();
        return sortAsc ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
      }
      const countA = Number(a.count || a.views || 0);
      const countB = Number(b.count || b.views || 0);
      return sortAsc ? countA - countB : countB - countA;
    });

    return items;
  }, [rawTabItems, searchTerm, sortField, sortAsc]);

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / pageSize));
  const currentPageSafe = Math.min(page, totalPages);
  const paginatedItems = filteredItems.slice(
    (currentPageSafe - 1) * pageSize,
    currentPageSafe * pageSize
  );

  return (
    <div className="space-y-6">
      {/* ─── Top Filter Controls ─── */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200 shadow-2xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-[#faf3e8] text-[#8b6f4e]">
                <HiOutlineTrendingUp className="w-5 h-5" />
              </span>
              <h2 className="text-base sm:text-lg font-semibold text-stone-900">
                Google Analytics 4 (GA4) Analytics & Lead Intelligence
              </h2>
            </div>
          </div>

          {/* Date Range Selector */}
          <div className="flex flex-wrap items-center gap-1.5">
            {PRESET_DATE_RANGES.map((r) => {
              const active =
                r.value === 'custom'
                  ? selectedRange === 'custom' || isCustomDrawerOpen
                  : selectedRange === r.value && !isCustomDrawerOpen;
              return (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => {
                    if (r.value === 'custom') {
                      handleOpenCustomDrawer();
                      return;
                    }
                    setIsCustomDrawerOpen(false);
                    setSelectedRange(r.value);
                    setIsCustomDate(false);
                    setPage(1);
                  }}
                  style={active ? { backgroundColor: 'var(--theme-primary, #8b6f4e)' } : undefined}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all cursor-pointer ${
                    active
                      ? 'text-white shadow-xs'
                      : 'bg-stone-50 text-stone-600 hover:bg-stone-100 hover:text-stone-900 border border-stone-200'
                  }`}
                >
                  {r.label}
                </button>
              );
            })}

            {isCustomDate && customStartDate && customEndDate && (
              <button
                type="button"
                onClick={handleOpenCustomDrawer}
                title="Edit custom date range"
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-stone-200 bg-stone-50 hover:bg-stone-100 text-[11px] font-medium text-stone-700 cursor-pointer transition-colors"
              >
                <HiOutlineCalendar className="w-3.5 h-3.5 text-stone-500" />
                <span>
                  {formatDateDisplay(customStartDate)} – {formatDateDisplay(customEndDate)}
                </span>
              </button>
            )}

            <button
              type="button"
              onClick={fetchData}
              disabled={loading}
              title="Refresh Analytics"
              className="p-1.5 rounded-lg border border-stone-200 bg-stone-50 text-stone-600 hover:bg-stone-100 cursor-pointer ml-1 transition-all"
            >
              <HiOutlineRefresh className={`w-4 h-4 ${loading ? 'animate-spin text-[#8b6f4e]' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* ─── 6 Metric KPI Cards (Top Row) ─── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {/* 1. Active Users */}
        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-2xs">
          <div className="flex items-center justify-between text-stone-500">
            <span className="text-xs font-medium">Active Users</span>
            <HiOutlineUsers className="w-4 h-4 text-stone-400" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-stone-900 mt-2">
            {(summary.totalUsers || 0).toLocaleString()}
          </div>
        </div>

        {/* 2. Total Sessions */}
        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-2xs">
          <div className="flex items-center justify-between text-stone-500">
            <span className="text-xs font-medium">Total Sessions</span>
            <HiOutlineClock className="w-4 h-4 text-stone-400" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-stone-900 mt-2">
            {(summary.totalSessions || 0).toLocaleString()}
          </div>
        </div>

        {/* 3. Items Added to Cart (Clickable card switches to cart tab) */}
        <div
          onClick={() => setActiveTab('cart')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer shadow-2xs ${
            activeTab === 'cart'
              ? 'bg-[#faf6f0] border-[#8b6f4e] ring-2 ring-[#8b6f4e]/20'
              : 'bg-white border-stone-200 hover:border-[#8b6f4e]/50'
          }`}
        >
          <div className="flex items-center justify-between text-[#8b6f4e]">
            <span className="text-xs font-semibold">Items in Cart</span>
            <HiOutlineShoppingCart className="w-4 h-4" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-stone-900 mt-2">
            {(summary.addToCart || 0).toLocaleString()}
          </div>
        </div>

        {/* 4. Wishlist Add Events (Clickable card switches to wishlist tab) */}
        <div
          onClick={() => setActiveTab('wishlist')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer shadow-2xs ${
            activeTab === 'wishlist'
              ? 'bg-rose-50/60 border-rose-400 ring-2 ring-rose-400/20'
              : 'bg-white border-stone-200 hover:border-rose-300'
          }`}
        >
          <div className="flex items-center justify-between text-rose-600">
            <span className="text-xs font-semibold">Wishlist Adds</span>
            <HiOutlineHeart className="w-4 h-4" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-stone-900 mt-2">
            {(summary.addToWishlist || 0).toLocaleString()}
          </div>
        </div>

        {/* 5. Product Views (Clickable card switches to views tab) */}
        <div
          onClick={() => setActiveTab('views')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer shadow-2xs ${
            activeTab === 'views'
              ? 'bg-indigo-50/60 border-indigo-400 ring-2 ring-indigo-400/20'
              : 'bg-white border-stone-200 hover:border-indigo-300'
          }`}
        >
          <div className="flex items-center justify-between text-indigo-600">
            <span className="text-xs font-semibold">Product Views</span>
            <HiOutlineEye className="w-4 h-4" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-stone-900 mt-2">
            {(summary.productViews || 0).toLocaleString()}
          </div>
        </div>

        {/* 6. Page Views */}
        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-2xs">
          <div className="flex items-center justify-between text-stone-500">
            <span className="text-xs font-medium">Page Views</span>
            <HiOutlineGlobeAlt className="w-4 h-4 text-stone-400" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-stone-900 mt-2">
            {(summary.pageViews || 0).toLocaleString()}
          </div>
        </div>
      </div>

      {/* ─── Interactive Product Activity Table with 3 Tabs ─── */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-2xs overflow-hidden">
        {/* Table Header & Controls */}
        <div className="p-4 sm:p-5 border-b border-stone-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Tabs */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setActiveTab('cart');
                setPage(1);
              }}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'cart'
                  ? 'bg-[#8b6f4e] text-white shadow-xs'
                  : 'bg-stone-50 text-stone-600 hover:bg-stone-100'
              }`}
            >
              <HiOutlineShoppingCart className="w-4 h-4" />
              <span>Items Added to Cart</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${activeTab === 'cart' ? 'bg-white/20' : 'bg-stone-200 text-stone-700'}`}>
                {data?.cartProducts?.length || 0}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('wishlist');
                setPage(1);
              }}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'wishlist'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-stone-50 text-stone-600 hover:bg-stone-100'
              }`}
            >
              <HiOutlineHeart className="w-4 h-4" />
              <span>Wishlist Add Events</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${activeTab === 'wishlist' ? 'bg-white/20' : 'bg-stone-200 text-stone-700'}`}>
                {data?.wishlistProducts?.length || 0}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('views');
                setPage(1);
              }}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'views'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-stone-50 text-stone-600 hover:bg-stone-100'
              }`}
            >
              <HiOutlineEye className="w-4 h-4" />
              <span>Product Views</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${activeTab === 'views' ? 'bg-white/20' : 'bg-stone-200 text-stone-700'}`}>
                {data?.viewedProducts?.length || 0}
              </span>
            </button>
          </div>

          {/* Search bar & Sort Controls */}
          <div className="flex items-center gap-2 w-full md:w-auto">
            <div className="relative flex-1 md:flex-initial">
              <HiOutlineSearch className="w-4 h-4 absolute left-3 top-2.5 text-stone-400" />
              <input
                type="text"
                placeholder="Search products, SKU, leads..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPage(1);
                }}
                className="pl-9 pr-7 py-1.5 text-xs border border-stone-200 rounded-xl w-full md:w-56 lg:w-64 focus:outline-hidden focus:border-[#8b6f4e]"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2.5 top-2.5 text-stone-400 hover:text-stone-600"
                >
                  <HiOutlineX className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={() => setSortAsc(!sortAsc)}
              title="Toggle Sort Order"
              className="p-2 border border-stone-200 rounded-xl hover:bg-stone-50 text-stone-600 cursor-pointer"
            >
              {sortAsc ? <HiOutlineArrowSmUp className="w-4 h-4" /> : <HiOutlineArrowSmDown className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-xs text-stone-700">
            <thead>
              <tr className="border-b border-stone-200/80 bg-[#eef2f6] text-[11px] font-bold text-stone-700 uppercase tracking-wider">
                <th className="py-3 px-3 text-center w-12 whitespace-nowrap">SR NO</th>
                <th className="py-3 px-4 whitespace-nowrap">Product Details</th>
                <th className="py-3 px-4">SKU / Code</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Price</th>
                <th className="py-3 px-4 text-center">
                  {activeTab === 'cart'
                    ? 'Times Added to Cart'
                    : activeTab === 'wishlist'
                    ? 'Wishlist Adds'
                    : 'Total Views'}
                </th>
                <th className="py-3 px-4 text-right">Customer Leads</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-stone-400 text-xs">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <HiOutlineRefresh className="w-5 h-5 animate-spin text-[#8b6f4e]" />
                      <span>Loading analytics report...</span>
                    </div>
                  </td>
                </tr>
              ) : paginatedItems.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-stone-400 text-xs">
                    No activity found for this date range or filter.
                  </td>
                </tr>
              ) : (
                paginatedItems.map((item, idx) => {
                  const prod = item.product;
                  const leads = item.users || [];
                  const hasLeads = leads.length > 0;

                  return (
                    <tr key={item.itemId || idx} className="hover:bg-stone-50/50 transition-colors">
                      {/* SR NO */}
                      <td className="py-3 px-3 text-center align-middle text-xs font-semibold text-stone-400 whitespace-nowrap">
                        {(currentPageSafe - 1) * pageSize + idx + 1}
                      </td>

                      {/* Product Thumbnail & Title */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-11 h-11 rounded-xl bg-stone-100 border border-stone-200 flex items-center justify-center overflow-hidden shrink-0">
                            {prod?.image ? (
                              <img src={prod.image} alt={prod.title || item.name} className="w-full h-full object-cover" />
                            ) : (
                              <IoDiamondOutline className="w-5 h-5 text-[#8b6f4e]" />
                            )}
                          </div>
                          <div>
                            <p className="font-semibold text-stone-900 line-clamp-1">{prod?.title || item.name}</p>
                            <span className="text-[10px] text-stone-400">ID: {item.itemId}</span>
                          </div>
                        </div>
                      </td>

                      {/* SKU */}
                      <td className="py-3 px-4 font-mono text-[11px] text-stone-600">
                        {prod?.sku || '—'}
                      </td>

                      {/* Category */}
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-full bg-stone-100 text-stone-600 text-[10px] font-medium">
                          {prod?.category || 'Fine Jewellery'}
                        </span>
                      </td>

                      {/* Price */}
                      <td className="py-3 px-4 font-semibold text-stone-900">
                        {prod?.price ? `₹${Number(prod.price).toLocaleString('en-IN')}` : '—'}
                      </td>

                      {/* Activity Count */}
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-full font-bold text-xs ${
                            activeTab === 'cart'
                              ? 'bg-amber-100 text-amber-800'
                              : activeTab === 'wishlist'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-indigo-100 text-indigo-800'
                          }`}
                        >
                          {item.count || item.views || 0}
                        </span>
                      </td>

                      {/* Customer Leads Outreach Button */}
                      <td className="py-3 px-4 text-right">
                        {hasLeads ? (
                          <button
                            type="button"
                            onClick={() => setCustomerModalItem(item)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#8b6f4e]/10 text-[#8b6f4e] hover:bg-[#8b6f4e] hover:text-white transition-all text-xs font-semibold cursor-pointer shadow-2xs"
                          >
                            <HiOutlineUsers className="w-3.5 h-3.5" />
                            <span>{leads.length} Leads</span>
                          </button>
                        ) : (
                          <span className="text-stone-400 text-[11px]">Guest Shoppers</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination footer */}
        {filteredItems.length > 0 && (
          <Pagination
            currentPage={currentPageSafe}
            totalItems={filteredItems.length}
            pageSize={pageSize}
            onPageChange={(p) => setPage(p)}
            itemLabel="products"
          />
        )}
      </div>

      {/* ─── Customer Lead Outreach Modal ─── */}
      {customerModalItem &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs transition-opacity duration-200 animate-fadeIn"
            onClick={() => setCustomerModalItem(null)}
          >
            <div
              className="bg-white rounded-2xl max-w-lg w-full p-5 shadow-2xl border border-stone-200 space-y-4 animate-scaleUp"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-stone-900">Interested Customer Leads</h3>
                  <p className="text-xs text-stone-500 line-clamp-1 mt-0.5">
                    Product: {customerModalItem.product?.title || customerModalItem.name}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setCustomerModalItem(null)}
                  className="p-1 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 cursor-pointer"
                >
                  <HiOutlineX className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
                {(customerModalItem.users || []).map((lead, idx) => (
                  <div
                    key={lead.id || idx}
                    className="p-3 bg-stone-50 rounded-xl border border-stone-200 flex items-center justify-between gap-3 hover:border-[#8b6f4e]/40 transition-colors"
                  >
                    <div className="space-y-0.5">
                      <p className="text-xs font-bold text-stone-900">{lead.name || 'Shopper Lead'}</p>
                      {lead.email && (
                        <p className="text-[11px] text-stone-500 flex items-center gap-1">
                          <HiOutlineMail className="w-3.5 h-3.5 text-stone-400" />
                          <span>{lead.email}</span>
                        </p>
                      )}
                      {lead.phone && (
                        <p className="text-[11px] text-[#8b6f4e] font-semibold flex items-center gap-1">
                          <HiOutlinePhone className="w-3.5 h-3.5" />
                          <span>{lead.phone}</span>
                        </p>
                      )}
                    </div>

                    {lead.phone && (
                      <button
                        type="button"
                        onClick={() => handleCopyPhone(lead.phone)}
                        className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                          copiedPhone === lead.phone
                            ? 'bg-emerald-600 text-white'
                            : 'bg-white border border-stone-200 text-stone-700 hover:border-[#8b6f4e] hover:text-[#8b6f4e]'
                        }`}
                      >
                        {copiedPhone === lead.phone ? (
                          <>
                            <HiOutlineCheck className="w-3.5 h-3.5" />
                            <span>Copied</span>
                          </>
                        ) : (
                          <>
                            <HiOutlineClipboardCopy className="w-3.5 h-3.5" />
                            <span>Copy Phone</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => setCustomerModalItem(null)}
                  className="px-4 py-2 bg-stone-900 text-white text-xs font-semibold rounded-xl hover:bg-stone-800 transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* ─── Right-Side Custom Date Range Sidebar ─── */}
      {isCustomDrawerOpen &&
        createPortal(
          <div className="fixed inset-0 z-[9990] flex justify-end">
            <div
              className="fixed inset-0 bg-stone-900/35 backdrop-blur-[1px] transition-opacity"
              onClick={() => setIsCustomDrawerOpen(false)}
            />

            <aside
              aria-label="Custom Date Range Sidebar"
              className="relative z-[9991] w-full max-w-[380px] h-full bg-white border-l border-stone-200 shadow-2xl flex flex-col"
            >
              {/* Sidebar Header */}
              <div className="px-5 py-4 border-b border-stone-200 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span
                    className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                    style={{
                      backgroundColor: 'rgba(var(--theme-primary-rgb, 139, 111, 78), 0.12)',
                      color: 'var(--theme-primary, #8b6f4e)',
                    }}
                  >
                    <HiOutlineCalendar className="w-5 h-5" />
                  </span>
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-stone-900 truncate">
                      Custom Date Range
                    </h3>
                    <p className="text-[11px] text-stone-500 truncate">
                      Select start & end dates for GA4 reports
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsCustomDrawerOpen(false)}
                  className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
                  aria-label="Close sidebar"
                >
                  <HiOutlineX className="w-4 h-4" />
                </button>
              </div>

              {/* Sidebar Body */}
              <div className="flex-1 overflow-y-auto p-5 space-y-5">
                <DatePicker
                  label="Start Date"
                  value={draftStartDate}
                  onChange={(dateStr) => {
                    const cleanDate =
                      typeof dateStr === 'string' ? dateStr : dateStr?.target?.value || '';
                    setDraftStartDate(cleanDate);
                  }}
                  placeholder="Select start date"
                  maxDate={draftEndDate ? new Date(draftEndDate) : new Date()}
                />

                <DatePicker
                  label="End Date"
                  value={draftEndDate}
                  onChange={(dateStr) => {
                    const cleanDate =
                      typeof dateStr === 'string' ? dateStr : dateStr?.target?.value || '';
                    setDraftEndDate(cleanDate);
                  }}
                  placeholder="Select end date"
                  minDate={draftStartDate ? new Date(draftStartDate) : undefined}
                  maxDate={new Date()}
                />

                {(draftStartDate || draftEndDate) && (
                  <div className="rounded-xl border border-stone-200 bg-stone-50 p-3.5 space-y-1.5">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
                      Selected Range
                    </p>
                    <p className="text-xs font-semibold text-stone-800">
                      {draftStartDate ? formatDateDisplay(draftStartDate) : '—'}
                      <span className="mx-2 text-stone-400">to</span>
                      {draftEndDate ? formatDateDisplay(draftEndDate) : '—'}
                    </p>
                  </div>
                )}
              </div>

              {/* Sidebar Footer */}
              <div className="px-5 py-4 border-t border-stone-200 bg-stone-50/70 flex items-center justify-between gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setDraftStartDate('');
                    setDraftEndDate('');
                  }}
                  disabled={!draftStartDate && !draftEndDate}
                  className="text-xs font-semibold text-stone-500 hover:text-stone-800 disabled:opacity-40 transition-colors cursor-pointer"
                >
                  Clear
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsCustomDrawerOpen(false)}
                    className="px-4 py-2 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-xs font-semibold text-stone-700 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleApplyCustomRange}
                    disabled={!draftStartDate || !draftEndDate}
                    style={{ backgroundColor: 'var(--theme-primary, #8b6f4e)' }}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-white shadow-xs hover:brightness-95 disabled:opacity-50 transition-all cursor-pointer"
                  >
                    Apply Filter
                  </button>
                </div>
              </div>
            </aside>
          </div>,
          document.body
        )}
    </div>
  );
}
