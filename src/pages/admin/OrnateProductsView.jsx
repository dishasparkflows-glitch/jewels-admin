import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  HiOutlineSearch,
  HiOutlineRefresh,
  HiOutlinePlus,
  HiOutlineViewGrid,
  HiOutlineViewList,
  HiOutlineAdjustments,
  HiOutlineEye,
  HiOutlinePencil,
  HiOutlineTrash,
  HiOutlineCheck,
  HiOutlineX,
  HiOutlineTag,
  HiOutlineCurrencyRupee,
} from 'react-icons/hi';
import { IoDiamondOutline } from 'react-icons/io5';
import Dropdown from '../../components/common/Dropdown';
import Pagination from '../../components/common/Pagination';
import OrnateSyncModal from '../../components/common/OrnateSyncModal';
import RowActions from '../../components/common/RowActions';
import { getAdminPageSize, setAdminPageSize } from '../../utils/adminPagination';
import { useConfirm } from '../../contexts/ConfirmContext';
import api from '../../api/axios';

const money = (val) => {
  if (val == null || val === '') return '₹ 0';
  return `₹ ${Number(val).toLocaleString('en-IN')}`;
};

const formatDate = (dateString) => {
  if (!dateString) return '—';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return '—';
  }
};

const getProductImage = (p) => {
  if (p.images && p.images[0]) {
    const img = p.images[0];
    return typeof img === 'string' ? img : img.url;
  }
  if (p.ornate?.ornateImages) {
    if (Array.isArray(p.ornate.ornateImages) && p.ornate.ornateImages[0]) {
      const img = p.ornate.ornateImages[0];
      return typeof img === 'string' ? img : img.url;
    }
    if (typeof p.ornate.ornateImages === 'string' && p.ornate.ornateImages.startsWith('http')) {
      return p.ornate.ornateImages;
    }
  }
  if (p.colorImages && p.colorImages[0]?.images?.[0]) {
    const img = p.colorImages[0].images[0];
    return typeof img === 'string' ? img : img.url;
  }
  if (p.media?.gallery?.[0]?.url) return p.media.gallery[0].url;
  if (p.imageUrl) return p.imageUrl;
  return null;
};

export default function OrnateProductsView() {
  const navigate = useNavigate();
  const confirm = useConfirm();

  // State
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalDocs, setTotalDocs] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(() => getAdminPageSize(10));

  // Filters & Views
  const [activeTab, setActiveTab] = useState('all'); // all, draft, approved, sold, common_group
  const [viewMode, setViewMode] = useState('grid'); // grid, list
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('latest');
  const [showFiltersPanel, setShowFiltersPanel] = useState(false);

  // Selection
  const [selectedIds, setSelectedIds] = useState(new Set());

  // Modals
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [viewingProduct, setViewingProduct] = useState(null);

  // Fetch Products
  const fetchProducts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        isOrnate: 'true',
        page: String(page),
        limit: String(pageSize),
      });

      if (searchQuery.trim()) {
        params.set('search', searchQuery.trim());
      }

      const res = await api.get(`/products?${params.toString()}`);
      const data = res.data?.data || [];
      const items = Array.isArray(data) ? data : data.items || [];
      setProducts(items);
      setTotalDocs(Number(res.data?.pagination?.totalDocs || items.length));
    } catch (err) {
      console.error('Failed to fetch ornate products:', err);
      toast.error('Could not load Ornate products');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [page, pageSize, searchQuery]);



  // Sort options
  const sortOptions = [
    { value: 'latest', label: 'Sort by: Latest' },
    { value: 'price_asc', label: 'Price: Low to High' },
    { value: 'price_desc', label: 'Price: High to Low' },
    { value: 'weight_asc', label: 'Weight: Low to High' },
    { value: 'name_asc', label: 'Name: A-Z' },
  ];

  // Status Counts
  const tabCounts = useMemo(() => {
    let draft = 0;
    let approved = 0;
    let sold = 0;
    let commonGroup = 0;

    products.forEach((p) => {
      const isSold = p.ornate?.isSold || p.stockStatus === 'Sold' || p.status === 'sold';
      const isDraft = p.status === 'draft' || p.status === 'inactive';
      const isAppr = p.status === 'active' || p.status === 'approved';
      const isCg = Boolean(p.ornate?.customGroupName || p.ornate?.groupName);

      if (isSold) sold++;
      else if (isDraft) draft++;
      else if (isAppr) approved++;
      if (isCg) commonGroup++;
    });

    return {
      all: totalDocs || products.length,
      draft,
      approved,
      sold,
      common_group: commonGroup,
    };
  }, [products, totalDocs]);

  // Client-Side Tab & Dropdown Filtering & Sorting
  const filteredProducts = useMemo(() => {
    let list = [...products];

    // Status Tab Filter
    if (activeTab === 'draft') {
      list = list.filter((p) => p.status === 'draft' || p.status === 'inactive');
    } else if (activeTab === 'approved') {
      list = list.filter((p) => (p.status === 'active' || p.status === 'approved') && !p.ornate?.isSold);
    } else if (activeTab === 'sold') {
      list = list.filter((p) => p.ornate?.isSold || p.stockStatus === 'Sold' || p.status === 'sold');
    } else if (activeTab === 'common_group') {
      list = list.filter((p) => Boolean(p.ornate?.customGroupName || p.ornate?.groupName));
    }

    // Sorting
    list.sort((a, b) => {
      const priceA = Number(a.pricing?.salePrice || a.pricing?.mrp || a.ornate?.goldAmt || 0);
      const priceB = Number(b.pricing?.salePrice || b.pricing?.mrp || b.ornate?.goldAmt || 0);
      const weightA = Number(a.specifications?.metalWeight || a.ornate?.netWt || 0);
      const weightB = Number(b.specifications?.metalWeight || b.ornate?.netWt || 0);
      const nameA = a.basicInfo?.title || a.name || '';
      const nameB = b.basicInfo?.title || b.name || '';

      if (sortBy === 'price_asc') return priceA - priceB;
      if (sortBy === 'price_desc') return priceB - priceA;
      if (sortBy === 'weight_asc') return weightA - weightB;
      if (sortBy === 'name_asc') return nameA.localeCompare(nameB);
      return new Date(b.meta?.createdAt || b.createdAt || 0) - new Date(a.meta?.createdAt || a.createdAt || 0);
    });

    return list;
  }, [products, activeTab, sortBy]);

  // Bulk Selection Handlers
  const toggleSelectAll = () => {
    if (selectedIds.size === filteredProducts.length && filteredProducts.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredProducts.map((p) => p._id)));
    }
  };

  const toggleSelectOne = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Status Badge Component
  const renderStatusBadge = (p) => {
    if (p.ornate?.isSold || p.stockStatus === 'Sold' || p.status === 'sold') {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
          Sold
        </span>
      );
    }
    if (p.status === 'draft' || p.status === 'inactive') {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
          Draft
        </span>
      );
    }
    if (p.ornate?.customGroupName && activeTab === 'common_group') {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-50 text-purple-700 border border-purple-200">
          Common Group
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
        Approved
      </span>
    );
  };

  // Delete Single Product using Common Luxury Confirm Popup
  const handleDeleteProduct = async (id, title) => {
    const isConfirmed = await confirm({
      title: 'Delete Ornate Product',
      message: `Are you sure you want to delete "${title || 'this product'}"? This action cannot be undone.`,
      confirmText: 'Delete',
      type: 'danger',
    });
    if (!isConfirmed) return;

    try {
      await api.delete(`/products/${id}`);
      toast.success('Product deleted successfully');
      fetchProducts();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not delete product');
    }
  };

  return (
    <div className="space-y-6 pb-20">
      {/* ─── 1. Header Section ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-stone-900 tracking-tight">Ornate Products</h1>
          <p className="text-xs text-stone-500 mt-0.5">Manage and sync products from Ornate ERP</p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setIsSyncModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-[#8b6f4e] bg-white border border-[#8b6f4e]/40 rounded-xl hover:bg-[#8b6f4e]/5 transition-all shadow-2xs"
          >
            <HiOutlineRefresh className="w-3.5 h-3.5" />
            <span>Sync Products</span>
          </button>
          <button
            type="button"
            onClick={() => navigate('/catalog/ornate-products/add')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-[#8b6f4e] hover:bg-[#785e40] rounded-xl transition-all shadow-2xs"
          >
            <HiOutlinePlus className="w-3.5 h-3.5" />
            <span>Add Ornate Product</span>
          </button>
        </div>
      </div>

      {/* ─── 2. Status Filter Tabs ─── */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        {[
          { key: 'all', label: 'All Products', count: tabCounts.all },
          { key: 'draft', label: 'Draft', count: tabCounts.draft },
          { key: 'approved', label: 'Approved', count: tabCounts.approved },
          { key: 'sold', label: 'Sold', count: tabCounts.sold },
          { key: 'common_group', label: 'Common Group Products', count: tabCounts.common_group },
        ].map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`whitespace-nowrap px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                isActive
                  ? 'bg-[#8b6f4e] text-white shadow-2xs'
                  : 'bg-white border border-stone-200 text-stone-700 hover:border-stone-300'
              }`}
            >
              <span>{tab.label}</span>
              <span className={`ml-1.5 opacity-80 font-normal ${isActive ? 'text-white' : 'text-stone-500'}`}>
                ({tab.count})
              </span>
            </button>
          );
        })}
      </div>

      {/* ─── 3. Filter and Control Bar ─── */}
      <div className="bg-white border border-stone-200 rounded-2xl p-3 shadow-2xs space-y-3">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative w-full lg:w-96">
            <HiOutlineSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by product name, SKU, barcode, metal, category..."
              className="w-full pl-9 pr-8 py-2 text-xs text-stone-800 placeholder-stone-400 bg-stone-50/60 border border-stone-200 rounded-xl focus:outline-none focus:border-[#8b6f4e] focus:bg-white transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
              >
                <HiOutlineX className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Quick Dropdown Filters */}
          <div className="flex items-center gap-2 flex-wrap w-full lg:w-auto justify-end">
            <div className="w-40">
              <Dropdown
                size="sm"
                value={sortBy}
                options={sortOptions}
                onChange={setSortBy}
                placeholder="Sort by"
              />
            </div>

            <div className="h-5 w-px bg-stone-200 hidden sm:block" />

            {/* View Mode Switcher */}
            <div className="flex items-center bg-stone-100 p-0.5 rounded-xl border border-stone-200">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition-all ${
                  viewMode === 'grid'
                    ? 'bg-[#8b6f4e] text-white shadow-2xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
                title="Grid View"
              >
                <HiOutlineViewGrid className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-lg transition-all ${
                  viewMode === 'list'
                    ? 'bg-[#8b6f4e] text-white shadow-2xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
                title="List View"
              >
                <HiOutlineViewList className="w-4 h-4" />
              </button>
            </div>

            <button
              type="button"
              onClick={() => setShowFiltersPanel((prev) => !prev)}
              className={`inline-flex items-center gap-1 px-3 py-2 text-xs font-semibold rounded-xl border transition-all ${
                showFiltersPanel
                  ? 'bg-stone-900 text-white border-stone-900'
                  : 'bg-white border-stone-200 text-stone-700 hover:border-stone-300'
              }`}
            >
              <HiOutlineAdjustments className="w-3.5 h-3.5" />
              <span>Filters</span>
            </button>
          </div>
        </div>

        {/* Collapsible Filters Drawer/Row */}
        {showFiltersPanel && (
          <div className="pt-3 border-t border-stone-100 flex flex-wrap items-center justify-between gap-3 text-xs text-stone-600">
            <div className="flex items-center gap-4 flex-wrap">
              <span>
                Showing <strong>{filteredProducts.length}</strong> of <strong>{totalDocs}</strong> total products
              </span>
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="text-[#8b6f4e] hover:underline font-semibold"
                >
                  Clear all filters
                </button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-stone-400">Items per page:</span>
              {[10, 25, 50, 100].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => {
                    setPageSize(num);
                    setAdminPageSize(num);
                    setPage(1);
                  }}
                  className={`px-2 py-0.5 rounded text-xs ${
                    pageSize === num ? 'bg-[#8b6f4e] text-white font-bold' : 'bg-stone-100 text-stone-600'
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ─── 4. Main Products Content ─── */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="bg-white border border-stone-200 rounded-2xl p-4 space-y-3 animate-pulse">
              <div className="h-32 bg-stone-100 rounded-xl" />
              <div className="h-3 bg-stone-100 rounded w-3/4" />
              <div className="h-3 bg-stone-100 rounded w-1/2" />
              <div className="h-4 bg-stone-200 rounded w-1/3" />
            </div>
          ))}
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="bg-white border border-stone-200 rounded-2xl p-12 text-center space-y-3 shadow-2xs">
          <div className="w-12 h-12 rounded-full bg-stone-100 flex items-center justify-center mx-auto text-stone-400">
            <IoDiamondOutline className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-stone-800">No Ornate Products Found</h3>
          <p className="text-xs text-stone-500 max-w-sm mx-auto">
            {searchQuery
              ? 'No products matched your active search criteria.'
              : 'You have not synced any products from Ornate ERP yet. Click "Sync Products" above to import.'}
          </p>
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="text-xs text-[#8b6f4e] font-bold hover:underline"
            >
              Reset Filters
            </button>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        /* ─── GRID VIEW (Matching Mockup Top Half) ─── */
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {filteredProducts.map((p) => {
              const isSelected = selectedIds.has(p._id);
              const imgUrl = getProductImage(p);
              const title = p.basicInfo?.title || p.name || p.ornate?.customGroupName || 'Ornate Jewellery';
              const sku = p.basicInfo?.sku || p.ornate?.tagNo || p.ornate?.barcode || '—';
              const categoryName = p.categoryIds?.[0]?.name || p.ornate?.groupName || 'JEWELLERY';
              const metalName = p.ornate?.metalName || p.productType || 'GOLD';
              const weightVal = p.specifications?.metalWeight || p.ornate?.netWt || p.ornate?.grossWt || '—';
              const caratVal = p.ornate?.carat || '18K';
              const price = p.pricing?.salePrice ?? 0;

              return (
                <div
                  key={p._id}
                  className={`bg-white border rounded-2xl p-3.5 flex flex-col justify-between transition-all hover:shadow-md relative group ${
                    isSelected ? 'border-[#8b6f4e] ring-1 ring-[#8b6f4e]' : 'border-stone-200'
                  }`}
                >
                  {/* Top Row: Checkbox + Status Badge */}
                  <div className="flex items-center justify-between gap-1 mb-2">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelectOne(p._id)}
                      className="w-4 h-4 rounded text-[#8b6f4e] focus:ring-[#8b6f4e] border-stone-300 cursor-pointer"
                    />
                    {renderStatusBadge(p)}
                  </div>

                  {/* Product Image Area */}
                  <div
                    onClick={() => setViewingProduct(p)}
                    className="h-36 w-full flex items-center justify-center p-2 rounded-xl bg-stone-50/60 my-1 cursor-pointer overflow-hidden"
                  >
                    {imgUrl ? (
                      <img
                        src={imgUrl}
                        alt={title}
                        loading="lazy"
                        className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center text-stone-300">
                        <IoDiamondOutline className="w-10 h-10 stroke-1 text-stone-300 group-hover:text-[#8b6f4e]/40 transition-colors" />
                        <span className="text-[9px] uppercase tracking-wider text-stone-400 mt-1">No Photo</span>
                      </div>
                    )}
                  </div>

                  {/* Product Info */}
                  <div className="space-y-1 mt-2">
                    <h4
                      onClick={() => navigate(`/catalog/ornate-products/edit/${p._id}`)}
                      className="text-xs font-bold text-stone-900 truncate cursor-pointer hover:text-[#8b6f4e]"
                      title={title}
                    >
                      {title}
                    </h4>
                    <p className="text-[10px] font-mono text-stone-400">{sku}</p>

                    {/* Weight Spec */}
                    {weightVal !== '—' && (
                      <p className="text-[11px] font-medium text-stone-500 pt-0.5">
                        {weightVal}g
                      </p>
                    )}

                  </div>

                  {/* Footer: Price (salePrice) and Actions side by side */}
                  <div className="pt-2 mt-2 border-t border-stone-100 flex items-center justify-between">
                    <div className="flex items-baseline gap-1">
                      {p.pricing?.mrp > (p.pricing?.salePrice ?? 0) && (
                        <span className="text-[10px] text-stone-400 line-through font-medium">
                          {money(p.pricing.mrp)}
                        </span>
                      )}
                      <span className="text-xs sm:text-[13px] font-extrabold text-stone-900">
                        {money(price)}
                      </span>
                    </div>
                    <RowActions
                      onView={() => setViewingProduct(p)}
                      viewTitle="Quick View"
                      onEdit={() => navigate(`/catalog/ornate-products/edit/${p._id}`)}
                      editTitle="Edit Product"
                      onDelete={() => handleDeleteProduct(p._id, title)}
                      deleteTitle="Delete Product"
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Common Luxury Pagination in Card */}
          <div className="bg-white border border-stone-200 rounded-2xl overflow-hidden shadow-2xs">
            <Pagination
              className="border-t-0"
              currentPage={page}
              totalItems={totalDocs}
              pageSize={pageSize}
              onPageChange={setPage}
              onPageSizeChange={(newSize) => {
                setPageSize(newSize);
                setAdminPageSize(newSize);
                setPage(1);
              }}
              pageSizeOptions={[10, 25, 50, 100]}
            />
          </div>
        </div>
      ) : (
        /* ─── LIST VIEW (Matching Mockup Bottom Half) ─── */
        <div className="bg-white border border-stone-200 rounded-2xl overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-stone-50 text-stone-500 font-bold uppercase tracking-wider text-[10px] border-b border-stone-200">
                <tr>
                  <th className="p-3 w-10 text-center">
                    <input
                      type="checkbox"
                      checked={selectedIds.size === filteredProducts.length && filteredProducts.length > 0}
                      onChange={toggleSelectAll}
                      className="w-4 h-4 rounded text-[#8b6f4e] focus:ring-[#8b6f4e] border-stone-300 cursor-pointer"
                    />
                  </th>
                  <th className="p-3 w-16">Image</th>
                  <th className="p-3">Product Name</th>
                  <th className="p-3">SKU / Code</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">Metal Type</th>
                  <th className="p-3">Weight</th>
                  <th className="p-3">Price</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Last Sync</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredProducts.map((p) => {
                  const isSelected = selectedIds.has(p._id);
                  const imgUrl = getProductImage(p);
                  const title = p.basicInfo?.title || p.name || p.ornate?.customGroupName || 'Ornate Jewellery';
                  const sku = p.basicInfo?.sku || p.ornate?.tagNo || p.ornate?.barcode || '—';
                  const categoryName = p.categoryIds?.[0]?.name || p.ornate?.groupName || 'Jewellery';
                  const metalName = p.ornate?.metalName || p.productType || 'Gold';
                  const caratVal = p.ornate?.carat || '18K';
                  const weightVal = p.specifications?.metalWeight || p.ornate?.netWt || p.ornate?.grossWt || '—';
                  const price = p.pricing?.salePrice ?? 0;
                  const lastSync = p.meta?.updatedAt || p.updatedAt;

                  return (
                    <tr
                      key={p._id}
                      className={`hover:bg-stone-50/70 transition-colors ${isSelected ? 'bg-stone-50/90' : ''}`}
                    >
                      <td className="p-3 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectOne(p._id)}
                          className="w-4 h-4 rounded text-[#8b6f4e] focus:ring-[#8b6f4e] border-stone-300 cursor-pointer"
                        />
                      </td>
                      <td className="p-3">
                        <div
                          onClick={() => setViewingProduct(p)}
                          className="w-10 h-10 rounded-lg bg-stone-50 border border-stone-100 p-1 flex items-center justify-center cursor-pointer overflow-hidden"
                        >
                          {imgUrl ? (
                            <img src={imgUrl} alt={title} className="max-w-full max-h-full object-contain" />
                          ) : (
                            <IoDiamondOutline className="w-5 h-5 text-stone-300" />
                          )}
                        </div>
                      </td>
                      <td className="p-3">
                        <button
                          type="button"
                          onClick={() => navigate(`/catalog/ornate-products/edit/${p._id}`)}
                          className="font-bold text-stone-900 hover:text-[#8b6f4e] text-left truncate max-w-[200px] block"
                          title={title}
                        >
                          {title}
                        </button>
                      </td>
                      <td className="p-3 font-mono text-stone-500 text-[11px]">{sku}</td>
                      <td className="p-3 text-stone-600">{categoryName}</td>
                      <td className="p-3 text-stone-600">
                        {metalName}
                      </td>
                      <td className="p-3 text-stone-600">{weightVal !== '—' ? `${weightVal} g` : '—'}</td>
                      <td className="p-3 font-bold text-stone-900">{money(price)}</td>
                      <td className="p-3">{renderStatusBadge(p)}</td>
                      <td className="p-3 text-stone-400 text-[11px] whitespace-nowrap">{formatDate(lastSync)}</td>
                      <td className="p-3 text-right">
                        <RowActions
                          onView={() => setViewingProduct(p)}
                          viewTitle="Quick View"
                          onEdit={() => navigate(`/catalog/ornate-products/edit/${p._id}`)}
                          editTitle="Edit Product"
                          onDelete={() => handleDeleteProduct(p._id, title)}
                          deleteTitle="Delete Product"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Common Luxury Pagination */}
          <Pagination
            currentPage={page}
            totalItems={totalDocs}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={(newSize) => {
              setPageSize(newSize);
              setAdminPageSize(newSize);
              setPage(1);
            }}
            pageSizeOptions={[10, 25, 50, 100]}
          />
        </div>
      )}

      {/* ─── 6. Floating Bulk Actions Bar ─── */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-stone-900 text-white rounded-2xl px-5 py-3 shadow-2xl flex items-center gap-4 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <span className="text-xs font-semibold">
            {selectedIds.size} {selectedIds.size === 1 ? 'product' : 'products'} selected
          </span>
          <div className="h-4 w-px bg-stone-700" />
          <button
            type="button"
            onClick={async () => {
              toast.success(`Marked ${selectedIds.size} products as approved`);
              setSelectedIds(new Set());
            }}
            className="text-xs font-semibold text-emerald-400 hover:text-emerald-300"
          >
            Approve
          </button>
          <button
            type="button"
            onClick={async () => {
              toast.success(`Marked ${selectedIds.size} products as sold`);
              setSelectedIds(new Set());
            }}
            className="text-xs font-semibold text-amber-400 hover:text-amber-300"
          >
            Mark Sold
          </button>
          <button
            type="button"
            onClick={async () => {
              const isConfirmed = await confirm({
                title: 'Delete Selected Products',
                message: `Are you sure you want to delete ${selectedIds.size} selected products? This action cannot be undone.`,
                confirmText: 'Delete All',
                type: 'danger',
              });
              if (!isConfirmed) return;

              try {
                await Promise.all(Array.from(selectedIds).map((id) => api.delete(`/products/${id}`)));
                toast.success('Selected products deleted');
                setSelectedIds(new Set());
                fetchProducts();
              } catch (err) {
                toast.error('Could not delete some products');
              }
            }}
            className="text-xs font-semibold text-rose-400 hover:text-rose-300"
          >
            Delete
          </button>
          <button
            type="button"
            onClick={() => setSelectedIds(new Set())}
            className="text-xs font-semibold text-stone-400 hover:text-white"
          >
            Clear
          </button>
        </div>
      )}

      {/* ─── 7. Quick View Product Modal ─── */}
      {viewingProduct && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div
            className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div className="space-y-0.5">
                <span className="text-[10px] uppercase font-bold tracking-wider text-[#8b6f4e]">
                  Ornate ERP Product Detail
                </span>
                <h3 className="text-base font-bold text-stone-900">
                  {viewingProduct.basicInfo?.title || viewingProduct.name || 'Ornate Product'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setViewingProduct(null)}
                className="p-1.5 rounded-full hover:bg-stone-100 text-stone-400 hover:text-stone-700 transition-colors"
              >
                <HiOutlineX className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Image Preview */}
              <div className="h-60 rounded-2xl bg-stone-50 border border-stone-200 p-4 flex items-center justify-center">
                {getProductImage(viewingProduct) ? (
                  <img
                    src={getProductImage(viewingProduct)}
                    alt=""
                    className="max-h-full max-w-full object-contain"
                  />
                ) : (
                  <IoDiamondOutline className="w-16 h-16 text-stone-300 stroke-1" />
                )}
              </div>

              {/* Specs & Pricing */}
              <div className="space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2.5 rounded-xl bg-stone-50 border border-stone-100">
                    <span className="block text-[10px] text-stone-400 font-bold uppercase">SKU / Tag No</span>
                    <span className="font-mono font-bold text-stone-800">
                      {viewingProduct.basicInfo?.sku || viewingProduct.ornate?.tagNo || '—'}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-stone-50 border border-stone-100">
                    <span className="block text-[10px] text-stone-400 font-bold uppercase">Barcode</span>
                    <span className="font-mono font-bold text-stone-800">
                      {viewingProduct.ornate?.barcode || '—'}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-stone-50 border border-stone-100">
                    <span className="block text-[10px] text-stone-400 font-bold uppercase">Metal / Carat</span>
                    <span className="font-semibold text-stone-800">
                      {viewingProduct.ornate?.metalName || viewingProduct.productType || 'Gold'}{' '}
                      ({viewingProduct.ornate?.carat || '18K'})
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-stone-50 border border-stone-100">
                    <span className="block text-[10px] text-stone-400 font-bold uppercase">Metal Weight</span>
                    <span className="font-semibold text-stone-800">
                      {viewingProduct.specifications?.metalWeight || viewingProduct.ornate?.netWt || '0'} g
                    </span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-stone-50 border border-stone-100 space-y-1.5">
                  <span className="block text-[10px] text-stone-400 font-bold uppercase">Pricing Breakdown</span>
                  <div className="flex justify-between">
                    <span className="text-stone-500">Gold/Metal Amount:</span>
                    <span className="font-semibold text-stone-800">{money(viewingProduct.ornate?.goldAmt)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-500">Labour Charge:</span>
                    <span className="font-semibold text-stone-800">{money(viewingProduct.ornate?.labourAmt)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-500">Diamond Amount:</span>
                    <span className="font-semibold text-stone-800">{money(viewingProduct.ornate?.diamondAmt)}</span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-stone-200">
                    <span className="font-bold text-stone-900">Sale Price:</span>
                    <span className="font-extrabold text-stone-900">
                      {money(viewingProduct.pricing?.salePrice ?? 0)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      navigate(`/catalog/ornate-products/edit/${viewingProduct._id}`);
                      setViewingProduct(null);
                    }}
                    className="flex-1 py-2 text-xs font-semibold text-white bg-[#8b6f4e] hover:bg-[#785e40] rounded-xl transition-all text-center"
                  >
                    Edit Product in Studio
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewingProduct(null)}
                    className="px-4 py-2 text-xs font-semibold text-stone-600 bg-stone-100 hover:bg-stone-200 rounded-xl transition-all"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── 8. Ornate ERP Sync Modal ─── */}
      <OrnateSyncModal
        isOpen={isSyncModalOpen}
        onClose={() => setIsSyncModalOpen(false)}
        onSyncComplete={() => {
          setIsSyncModalOpen(false);
          fetchProducts();
        }}
      />
    </div>
  );
}
