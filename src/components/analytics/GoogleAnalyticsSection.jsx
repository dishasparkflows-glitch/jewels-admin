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
} from 'react-icons/hi';
import { IoDiamondOutline } from 'react-icons/io5';
import toast from 'react-hot-toast';
import Pagination from '../common/Pagination';
import { useAdminPageSize } from '../../utils/adminPagination';

const PRESET_DATE_RANGES = [
  { label: 'Today', value: 'today' },
  { label: 'Yesterday', value: 'yesterday' },
  { label: 'Last 7 Days', value: '7daysAgo' },
  { label: 'Last 30 Days', value: '30daysAgo' },
  { label: 'Last 90 Days', value: '90daysAgo' },
  { label: 'Custom Range', value: 'custom' },
];

// Sample enriched data for UI preview (prevents hitting client credentials in dev/test)
const SAMPLE_ANALYTICS_DATA = {
  summary: {
    totalUsers: 1420,
    totalSessions: 2150,
    pageViews: 8420,
    productViews: 3120,
    addToCart: 184,
    addToWishlist: 95,
    trends: {
      users: '+14.2%',
      sessions: '+18.0%',
      pageViews: '+8.5%',
      productViews: '+21.0%',
      addToCart: '+12.4%',
      addToWishlist: '+5.1%',
    },
  },
  cartProducts: [
    {
      itemId: 'prod_001',
      name: 'Round Cut Solitaire Diamond Ring',
      count: 28,
      product: {
        id: 'prod_001',
        title: 'Round Cut Solitaire Diamond Ring',
        sku: 'NR-RNG-001',
        slug: 'round-cut-solitaire-diamond-ring',
        price: 85200,
        category: 'Rings',
        productType: 'gold',
        image: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=400&q=80',
      },
      users: [
        { id: 'u_1', name: 'Priya Sharma', email: 'priya.s@example.com', phone: '+91 98765 43210' },
        { id: 'u_2', name: 'Aarav Mehta', email: 'aarav.m@example.com', phone: '+91 98220 11223' },
      ],
    },
    {
      itemId: 'prod_002',
      name: 'Emerald Cut Tennis Bracelet',
      count: 22,
      product: {
        id: 'prod_002',
        title: 'Emerald Cut Tennis Bracelet',
        sku: 'NR-BRC-014',
        slug: 'emerald-cut-tennis-bracelet',
        price: 142000,
        category: 'Bracelets',
        productType: 'gold',
        image: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=400&q=80',
      },
      users: [
        { id: 'u_3', name: 'Neha Verma', email: 'neha.v@example.com', phone: '+91 97112 33445' },
      ],
    },
    {
      itemId: 'prod_003',
      name: 'Floral Diamond Pendant Necklace',
      count: 17,
      product: {
        id: 'prod_003',
        title: 'Floral Diamond Pendant Necklace',
        sku: 'NR-NCK-032',
        slug: 'floral-diamond-pendant-necklace',
        price: 54900,
        category: 'Necklaces',
        productType: 'gold',
        image: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=400&q=80',
      },
      users: [
        { id: 'u_4', name: 'Rohan Gupta', email: 'rohan.g@example.com', phone: '+91 99887 66554' },
      ],
    },
  ],
  wishlistProducts: [
    {
      itemId: 'prod_004',
      name: 'Vintage Halo Pear Diamond Ring',
      count: 34,
      product: {
        id: 'prod_004',
        title: 'Vintage Halo Pear Diamond Ring',
        sku: 'NR-RNG-088',
        slug: 'vintage-halo-pear-diamond-ring',
        price: 98000,
        category: 'Rings',
        productType: 'gold',
        image: 'https://images.unsplash.com/photo-1603561591411-07134e71a2a9?auto=format&fit=crop&w=400&q=80',
      },
      users: [
        { id: 'u_5', name: 'Ananya Roy', email: 'ananya.roy@example.com', phone: '+91 98450 12345' },
        { id: 'u_6', name: 'Karan Singhal', email: 'karan.s@example.com', phone: '+91 98711 55667' },
      ],
    },
    {
      itemId: 'prod_005',
      name: 'Classic Diamond Stud Earrings',
      count: 29,
      product: {
        id: 'prod_005',
        title: 'Classic Diamond Stud Earrings',
        sku: 'NR-EAR-005',
        slug: 'classic-diamond-stud-earrings',
        price: 36500,
        category: 'Earrings',
        productType: 'gold',
        image: 'https://images.unsplash.com/photo-1630019852942-f89202989a59?auto=format&fit=crop&w=400&q=80',
      },
      users: [
        { id: 'u_7', name: 'Simran Kaur', email: 'simran.k@example.com', phone: '+91 99100 88776' },
      ],
    },
  ],
  viewedProducts: [
    {
      itemId: 'prod_001',
      name: 'Round Cut Solitaire Diamond Ring',
      count: 412,
      product: {
        id: 'prod_001',
        title: 'Round Cut Solitaire Diamond Ring',
        sku: 'NR-RNG-001',
        slug: 'round-cut-solitaire-diamond-ring',
        price: 85200,
        category: 'Rings',
        productType: 'gold',
        image: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=400&q=80',
      },
      users: [],
    },
    {
      itemId: 'prod_002',
      name: 'Emerald Cut Tennis Bracelet',
      count: 365,
      product: {
        id: 'prod_002',
        title: 'Emerald Cut Tennis Bracelet',
        sku: 'NR-BRC-014',
        slug: 'emerald-cut-tennis-bracelet',
        price: 142000,
        category: 'Bracelets',
        productType: 'gold',
        image: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=400&q=80',
      },
      users: [],
    },
    {
      itemId: 'prod_004',
      name: 'Vintage Halo Pear Diamond Ring',
      count: 290,
      product: {
        id: 'prod_004',
        title: 'Vintage Halo Pear Diamond Ring',
        sku: 'NR-RNG-088',
        slug: 'vintage-halo-pear-diamond-ring',
        price: 98000,
        category: 'Rings',
        productType: 'gold',
        image: 'https://images.unsplash.com/photo-1603561591411-07134e71a2a9?auto=format&fit=crop&w=400&q=80',
      },
      users: [],
    },
  ],
};

export default function GoogleAnalyticsSection() {
  const [selectedRange, setSelectedRange] = useState('30daysAgo');
  const [isCustomDate, setIsCustomDate] = useState(false);
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  const [activeTab, setActiveTab] = useState('cart'); // 'cart' | 'wishlist' | 'views'
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(SAMPLE_ANALYTICS_DATA);
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

  const fetchData = useCallback(() => {
    setLoading(true);

    // Simulated short delay for UI state demonstration
    setTimeout(() => {
      setData(SAMPLE_ANALYTICS_DATA);
      setLoading(false);
    }, 300);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Lock scroll and listen for Escape key when lead modal is open
  useEffect(() => {
    if (!customerModalItem) return;
    document.body.style.overflow = 'hidden';
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setCustomerModalItem(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [customerModalItem]);

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
            <p className="text-xs text-stone-500 mt-1">
              Storefront traffic, item engagement, cart activity, and identified CRM outreach leads.
            </p>
          </div>

          {/* Date Range Selector */}
          <div className="flex flex-wrap items-center gap-1.5">
            {PRESET_DATE_RANGES.map((r) => {
              const active = selectedRange === r.value;
              return (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => {
                    setSelectedRange(r.value);
                    setIsCustomDate(r.value === 'custom');
                  }}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all cursor-pointer ${
                    active
                      ? 'bg-[#8b6f4e] text-white shadow-xs'
                      : 'bg-stone-50 text-stone-600 hover:bg-stone-100 hover:text-stone-900 border border-stone-200'
                  }`}
                >
                  {r.label}
                </button>
              );
            })}

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

        {/* Custom Date Inputs if selected */}
        {isCustomDate && (
          <div className="pt-3 border-t border-stone-100 flex flex-wrap items-center gap-3">
            <span className="text-xs font-medium text-stone-600">Select Date Range:</span>
            <input
              type="date"
              value={customStartDate}
              onChange={(e) => setCustomStartDate(e.target.value)}
              className="px-2.5 py-1 text-xs border border-stone-300 rounded-lg focus:border-[#8b6f4e] focus:outline-hidden"
            />
            <span className="text-stone-400 text-xs">to</span>
            <input
              type="date"
              value={customEndDate}
              onChange={(e) => setCustomEndDate(e.target.value)}
              className="px-2.5 py-1 text-xs border border-stone-300 rounded-lg focus:border-[#8b6f4e] focus:outline-hidden"
            />
            <button
              type="button"
              onClick={fetchData}
              className="px-3 py-1 bg-[#8b6f4e] hover:bg-[#735a3d] text-white text-xs font-medium rounded-lg cursor-pointer"
            >
              Apply Filter
            </button>
          </div>
        )}
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
          <div className="text-[11px] font-semibold text-emerald-600 mt-1 flex items-center">
            <HiOutlineArrowSmUp className="w-3.5 h-3.5 inline mr-0.5" />
            {summary.trends?.users || '+0%'}
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
          <div className="text-[11px] font-semibold text-emerald-600 mt-1 flex items-center">
            <HiOutlineArrowSmUp className="w-3.5 h-3.5 inline mr-0.5" />
            {summary.trends?.sessions || '+0%'}
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
          <div className="text-[11px] font-semibold text-emerald-600 mt-1 flex items-center">
            <HiOutlineArrowSmUp className="w-3.5 h-3.5 inline mr-0.5" />
            {summary.trends?.addToCart || '+0%'}
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
          <div className="text-[11px] font-semibold text-emerald-600 mt-1 flex items-center">
            <HiOutlineArrowSmUp className="w-3.5 h-3.5 inline mr-0.5" />
            {summary.trends?.addToWishlist || '+0%'}
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
          <div className="text-[11px] font-semibold text-emerald-600 mt-1 flex items-center">
            <HiOutlineArrowSmUp className="w-3.5 h-3.5 inline mr-0.5" />
            {summary.trends?.productViews || '+0%'}
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
          <div className="text-[11px] font-semibold text-emerald-600 mt-1 flex items-center">
            <HiOutlineArrowSmUp className="w-3.5 h-3.5 inline mr-0.5" />
            {summary.trends?.pageViews || '+0%'}
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
          <div className="flex items-center gap-2">
            <div className="relative">
              <HiOutlineSearch className="w-4 h-4 absolute left-3 top-2.5 text-stone-400" />
              <input
                type="text"
                placeholder="Search products, SKU, leads..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPage(1);
                }}
                className="pl-9 pr-3 py-1.5 text-xs border border-stone-200 rounded-xl w-48 sm:w-64 focus:outline-hidden focus:border-[#8b6f4e]"
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
          <table className="w-full text-left text-xs text-stone-700">
            <thead className="bg-stone-50/75 border-b border-stone-200 text-stone-500 font-medium">
              <tr>
                <th className="py-3 px-4">Product Details</th>
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
              {paginatedItems.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-stone-400 text-xs">
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
          <div className="p-4 border-t border-stone-100 flex items-center justify-between">
            <span className="text-xs text-stone-500">
              Showing {(currentPageSafe - 1) * pageSize + 1} to{' '}
              {Math.min(currentPageSafe * pageSize, filteredItems.length)} of {filteredItems.length} products
            </span>
            <Pagination
              currentPage={currentPageSafe}
              totalPages={totalPages}
              onPageChange={(p) => setPage(p)}
            />
          </div>
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
    </div>
  );
}
