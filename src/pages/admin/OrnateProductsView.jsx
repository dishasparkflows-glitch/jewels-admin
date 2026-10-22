import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  HiOutlineSearch,
  HiOutlineRefresh,
  HiOutlinePlus,
  HiOutlineViewGrid,
  HiOutlineViewList,
  HiOutlineX,
  HiOutlineTag,
} from 'react-icons/hi';
import { IoDiamondOutline } from 'react-icons/io5';
import Dropdown from '../../components/common/Dropdown';
import Pagination from '../../components/common/Pagination';
import OrnateSyncModal from '../../components/common/OrnateSyncModal';
import RowActions from '../../components/common/RowActions';
import {
  GroupCard,
  CreateGroupModal,
  ManageGroupDrawer,
} from '../../components/common/productGroup';
import { getAdminPageSize, setAdminPageSize } from '../../utils/adminPagination';
import { useConfirm } from '../../contexts/ConfirmContext';
import { openProductPreview } from '../../utils/productPreview';
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
  if (!p) return null;
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

  // Tab & View State
  const [activeTab, setActiveTab] = useState('all'); // all, draft, approved, sold, common_group, ungrouped
  const [viewMode, setViewMode] = useState('grid'); // grid, list
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('price_desc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(() => getAdminPageSize(10));

  // Data State
  const [products, setProducts] = useState([]);
  const [groups, setGroups] = useState([]);
  const [totalDocs, setTotalDocs] = useState(0);
  const [loading, setLoading] = useState(true);

  // Tab Counts State (accurate from backend)
  const [tabCounts, setTabCounts] = useState({
    all: 0,
    draft: 0,
    approved: 0,
    sold: 0,
    common_group: 0,
    ungrouped: 0,
  });

  // Selection
  const [selectedIds, setSelectedIds] = useState(new Set());

  // Modals & Drawers
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [isCreateGroupModalOpen, setIsCreateGroupModalOpen] = useState(false);
  const [selectedGroupIdForManage, setSelectedGroupIdForManage] = useState(null);
  const [viewingProduct, setViewingProduct] = useState(null);

  // Sort Options
  const sortOptions = [
    { value: 'price_desc', label: 'Price: High to Low' },
    { value: 'price_asc', label: 'Price: Low to High' },
    { value: 'latest', label: 'Sort by: Latest' },
    { value: 'name_asc', label: 'Name: A-Z' },
  ];

  // Fetch accurate tab counts from backend
  const fetchTabCounts = useCallback(async () => {
    try {
      const res = await api.get('/product-groups/tab-counts');
      if (res.data?.data) {
        setTabCounts(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load tab counts:', err);
    }
  }, []);

  // Fetch Main Content based on active tab
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);

      // CASE 1: UNGROUPED PRODUCTS TAB
      if (activeTab === 'ungrouped') {
        const params = new URLSearchParams({
          isOrnate: 'true',
          page: String(page),
          limit: String(pageSize),
        });
        if (searchQuery.trim()) params.set('search', searchQuery.trim());
        if (sortBy) params.set('sort', sortBy);

        const res = await api.get(`/products?${params.toString()}`);
        const data = res.data?.data || [];
        const items = Array.isArray(data) ? data : data.items || [];
        setProducts(items);
        setTotalDocs(Number(res.data?.pagination?.totalDocs || items.length));
        return;
      }

      // CASE 2: ALL / DRAFT / APPROVED / SOLD / COMMON GROUPS TABS (PRODUCT GROUPS)
      const params = new URLSearchParams({
        page: String(page),
        limit: String(pageSize),
      });

      if (activeTab === 'draft') params.set('productStatus', 'draft');
      else if (activeTab === 'approved') params.set('productStatus', 'approved');
      else if (activeTab === 'sold') params.set('productStatus', 'sold');
      else params.set('status', 'all');

      if (searchQuery.trim()) params.set('search', searchQuery.trim());
      if (sortBy) params.set('sort', sortBy);

      const res = await api.get(`/product-groups?${params.toString()}`);
      const data = res.data?.data || [];
      const items = Array.isArray(data) ? data : data.items || [];
      setGroups(items);
      setTotalDocs(Number(res.data?.pagination?.totalDocs || items.length));
    } catch (err) {
      console.error('Failed to fetch data:', err);
      toast.error('Could not load data');
      setProducts([]);
      setGroups([]);
      setTotalDocs(0);
    } finally {
      setLoading(false);
    }
  }, [activeTab, page, pageSize, searchQuery, sortBy]);

  useEffect(() => {
    fetchTabCounts();
  }, [fetchTabCounts]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Reset pagination & selection on filter change
  useEffect(() => {
    setPage(1);
    setSelectedIds(new Set());
  }, [activeTab, searchQuery, sortBy]);

  // Bulk Selection Handlers
  const currentItems = activeTab === 'ungrouped' ? products : groups;

  const toggleSelectAll = () => {
    if (selectedIds.size === currentItems.length && currentItems.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(currentItems.map((item) => item._id)));
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

  // Status Badge Component for products
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
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
        Approved
      </span>
    );
  };

  // Delete Single Product using Confirm Modal
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
      fetchData();
      fetchTabCounts();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not delete product');
    }
  };

  // Delete Group using Confirm Modal (explaining member products are preserved)
  const handleDeleteGroup = async (group) => {
    const isConfirmed = await confirm({
      title: 'Delete Product Group',
      message: `Are you sure you want to delete group "${group.groupName}"? Deleting this group will NOT delete its member products.`,
      confirmText: 'Delete Group',
      type: 'danger',
    });
    if (!isConfirmed) return;

    try {
      await api.delete(`/product-groups/${group._id}`);
      toast.success('Group deleted successfully. Products preserved.');
      fetchData();
      fetchTabCounts();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not delete group');
    }
  };

  // Toggle Group Status (Active / Inactive)
  const handleToggleGroupStatus = async (group) => {
    const nextStatus = group.status === 'active' ? 'inactive' : 'active';
    try {
      await api.patch(`/product-groups/${group._id}`, { status: nextStatus });
      toast.success(`Group marked as ${nextStatus}`);
      fetchData();
      fetchTabCounts();
    } catch (err) {
      toast.error('Failed to update group status');
    }
  };

  return (
    <div className="space-y-6 pb-20">
      {/* ─── 1. Header Section ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-stone-900 tracking-tight">Ornate Products</h1>
          <p className="text-xs text-stone-500 mt-0.5">
            Manage catalogue, ERP sync, and Common Product Groups
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setIsSyncModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-[#8b6f4e] bg-white border border-[#8b6f4e]/40 rounded-xl hover:bg-[#8b6f4e]/5 transition-all shadow-2xs cursor-pointer"
          >
            <HiOutlineRefresh className="w-3.5 h-3.5" />
            <span>Sync Products</span>
          </button>
          <button
            type="button"
            onClick={() => navigate('/catalog/ornate-products/add')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-[#8b6f4e] hover:bg-[#785e40] rounded-xl transition-all shadow-2xs cursor-pointer"
          >
            <HiOutlinePlus className="w-3.5 h-3.5" />
            <span>Add Ornate Product</span>
          </button>
        </div>
      </div>

      {/* ─── 2. Status Filter Tabs & Create Group Action ─── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          {[
            { key: 'all', label: 'All Products', count: tabCounts.all },
            { key: 'draft', label: 'Draft', count: tabCounts.draft },
            { key: 'approved', label: 'Approved', count: tabCounts.approved },
            { key: 'sold', label: 'Sold', count: tabCounts.sold },
            { key: 'common_group', label: 'Common Groups', count: tabCounts.common_group },
            { key: 'ungrouped', label: 'Ungrouped', count: tabCounts.ungrouped },
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

        <button
          type="button"
          onClick={() => setIsCreateGroupModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-[#8b6f4e] hover:bg-[#785e40] rounded-xl transition-all shadow-2xs shrink-0 cursor-pointer self-end md:self-auto"
        >
          <HiOutlinePlus className="w-4 h-4" />
          <span>Create Group</span>
        </button>
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
              placeholder={
                activeTab === 'ungrouped'
                  ? 'Search by product name, SKU, barcode, tag...'
                  : 'Search by group name, group code, SKU...'
              }
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
            <div className="w-44">
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
                className={`p-1.5 rounded-lg transition-all cursor-pointer ${
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
                className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                  viewMode === 'list'
                    ? 'bg-[#8b6f4e] text-white shadow-2xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
                title="List View"
              >
                <HiOutlineViewList className="w-4 h-4" />
              </button>
            </div>

          </div>
        </div>
      </div>

      {/* ─── 4. Main Tab Content ─── */}
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
      ) : activeTab !== 'ungrouped' ? (
        /* ─── A. PRODUCT GROUPS (ALL, DRAFT, APPROVED, SOLD, COMMON GROUPS) ─── */
        groups.length === 0 ? (
          <div className="bg-white border border-stone-200 rounded-2xl p-12 text-center space-y-4 shadow-2xs">
            <div className="w-12 h-12 rounded-full bg-stone-100 flex items-center justify-center mx-auto text-stone-400">
              <IoDiamondOutline className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-stone-800">No Product Groups Found</h3>
            <p className="text-xs text-stone-500 max-w-sm mx-auto">
              {searchQuery
                ? 'No product groups matched your active search criteria.'
                : 'No product groups found in this status tab.'}
            </p>
            <button
              type="button"
              onClick={() => setIsCreateGroupModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#8b6f4e] hover:bg-[#785e40] rounded-xl transition-all shadow-2xs"
            >
              <HiOutlinePlus className="w-4 h-4" />
              <span>Create First Group</span>
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div
              className={
                viewMode === 'grid'
                  ? 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4'
                  : 'space-y-3'
              }
            >
              {groups.map((g) => (
                <GroupCard
                  key={g._id}
                  group={g}
                  viewMode={viewMode}
                  onManage={(group) => setSelectedGroupIdForManage(group._id)}
                  onEdit={(group) => setSelectedGroupIdForManage(group._id)}
                  onAddProducts={(group) => setSelectedGroupIdForManage(group._id)}
                  onToggleStatus={handleToggleGroupStatus}
                  onDelete={handleDeleteGroup}
                />
              ))}
            </div>

            <Pagination
                className="border border-stone-200 rounded-2xl bg-white shadow-2xs"
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
        )
      ) : (
        /* ─── B. UNGROUPED PRODUCTS TAB ─── */
        products.length === 0 ? (
          <div className="bg-white border border-stone-200 rounded-2xl p-12 text-center space-y-3 shadow-2xs">
            <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center mx-auto text-emerald-600">
              <IoDiamondOutline className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-stone-800">No Ornate Products Found</h3>
            <p className="text-xs text-stone-500 max-w-sm mx-auto">
              {searchQuery ? 'No ornate products matched your search.' : 'There are no ornate products available.'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Top Selection Bar for Ungrouped Products */}
            {selectedIds.size > 0 && (
              <div className="bg-[#8b6f4e]/10 border border-[#8b6f4e]/20 rounded-2xl p-3 flex items-center justify-between gap-3 text-xs">
                <span className="font-bold text-[#8b6f4e]">
                  {selectedIds.size} ungrouped product(s) selected
                </span>
                <button
                  type="button"
                  onClick={() => setIsCreateGroupModalOpen(true)}
                  className="px-4 py-1.5 font-bold text-white bg-[#8b6f4e] hover:bg-[#785e40] rounded-xl transition-all shadow-2xs flex items-center gap-1.5"
                >
                  <HiOutlinePlus className="w-4 h-4" />
                  <span>Create Group from Selected</span>
                </button>
              </div>
            )}

            {/* Ungrouped Grid / List */}
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                {products.map((p) => {
                  const isSelected = selectedIds.has(p._id);
                  const imgUrl = getProductImage(p);
                  const title = p.basicInfo?.title || p.name || 'Ornate Jewellery';
                  const sku = p.basicInfo?.sku || p.ornate?.tagNo || '—';
                  const price = p.pricing?.salePrice ?? 0;

                  return (
                    <div
                      key={p._id}
                      className={`bg-white border rounded-2xl p-3.5 flex flex-col justify-between transition-all hover:shadow-md relative group ${
                        isSelected ? 'border-[#8b6f4e] ring-1 ring-[#8b6f4e]' : 'border-stone-200'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1 mb-2">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectOne(p._id)}
                          className="w-4 h-4 rounded text-[#8b6f4e] focus:ring-[#8b6f4e] border-stone-300 cursor-pointer"
                        />
                        {renderStatusBadge(p)}
                      </div>

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
                            <IoDiamondOutline className="w-10 h-10 stroke-1 text-stone-300" />
                            <span className="text-[9px] uppercase tracking-wider text-stone-400 mt-1">No Photo</span>
                          </div>
                        )}
                      </div>

                      <div className="space-y-1 mt-2">
                        <h4
                          onClick={() => navigate(`/catalog/ornate-products/edit/${p._id}`)}
                          className="text-xs font-bold text-stone-900 truncate cursor-pointer hover:text-[#8b6f4e]"
                          title={title}
                        >
                          {title}
                        </h4>
                        <p className="text-[10px] font-mono text-stone-400">{sku}</p>
                      </div>

                      <div className="pt-2 mt-2 border-t border-stone-100 flex items-center justify-between">
                        <span className="text-xs font-extrabold text-stone-900">{money(price)}</span>
                        <RowActions
                          onOpenWebsite={() => openProductPreview(p)}
                          onView={() => setViewingProduct(p)}
                          onEdit={() => navigate(`/catalog/ornate-products/edit/${p._id}`)}
                          onDelete={() => handleDeleteProduct(p._id, title)}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* Ungrouped List View */
              <div className="bg-white border border-stone-200 rounded-2xl overflow-hidden shadow-2xs">
                <table className="w-full text-xs text-left">
                  <thead className="bg-stone-50 text-stone-500 font-bold uppercase tracking-wider text-[10px] border-b border-stone-200">
                    <tr>
                      <th className="p-3 w-10 text-center">
                        <input
                          type="checkbox"
                          checked={selectedIds.size === products.length && products.length > 0}
                          onChange={toggleSelectAll}
                          className="w-4 h-4 rounded text-[#8b6f4e] focus:ring-[#8b6f4e] cursor-pointer"
                        />
                      </th>
                      <th className="p-3 w-16">Image</th>
                      <th className="p-3">Product Name</th>
                      <th className="p-3">SKU / Tag</th>
                      <th className="p-3">Price</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {products.map((p) => {
                      const isSelected = selectedIds.has(p._id);
                      const imgUrl = getProductImage(p);
                      const title = p.basicInfo?.title || p.name || 'Ornate Jewellery';
                      const sku = p.basicInfo?.sku || p.ornate?.tagNo || '—';
                      const price = p.pricing?.salePrice ?? 0;

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
                              className="w-4 h-4 rounded text-[#8b6f4e] focus:ring-[#8b6f4e] cursor-pointer"
                            />
                          </td>
                          <td className="p-3">
                            <div className="w-10 h-10 rounded-lg bg-stone-50 border border-stone-100 p-1 flex items-center justify-center">
                              {imgUrl ? (
                                <img src={imgUrl} alt="" className="max-w-full max-h-full object-contain" />
                              ) : (
                                <IoDiamondOutline className="w-5 h-5 text-stone-300" />
                              )}
                            </div>
                          </td>
                          <td className="p-3 font-bold text-stone-900">{title}</td>
                          <td className="p-3 font-mono text-stone-500 text-[11px]">{sku}</td>
                          <td className="p-3 font-bold text-stone-900">{money(price)}</td>
                          <td className="p-3">{renderStatusBadge(p)}</td>
                          <td className="p-3 text-right">
                            <RowActions
                              onOpenWebsite={() => openProductPreview(p)}
                          onView={() => setViewingProduct(p)}
                              onEdit={() => navigate(`/catalog/ornate-products/edit/${p._id}`)}
                              onDelete={() => handleDeleteProduct(p._id, title)}
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

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
        )
      )}

      {/* ─── 5. Floating Bulk Actions Bar (for ungrouped products) ─── */}
      {selectedIds.size > 0 && activeTab === 'ungrouped' && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-stone-900 text-white rounded-2xl px-5 py-3 shadow-2xl flex items-center gap-4 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <span className="text-xs font-semibold">
            {selectedIds.size} {selectedIds.size === 1 ? 'product' : 'products'} selected
          </span>
          <div className="h-4 w-px bg-stone-700" />
          <button
            type="button"
            onClick={() => setIsCreateGroupModalOpen(true)}
            className="text-xs font-semibold text-[#8b6f4e] hover:text-[#a0815e]"
          >
            Create Group
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
                fetchData();
                fetchTabCounts();
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

      {/* ─── 6. Modals & Drawers ─── */}

      {/* Create Group Modal */}
      <CreateGroupModal
        isOpen={isCreateGroupModalOpen}
        onClose={() => setIsCreateGroupModalOpen(false)}
        initialSelectedIds={Array.from(selectedIds)}
        onSuccess={() => {
          setSelectedIds(new Set());
          fetchData();
          fetchTabCounts();
        }}
      />

      {/* Manage Group Drawer */}
      <ManageGroupDrawer
        isOpen={Boolean(selectedGroupIdForManage)}
        onClose={() => setSelectedGroupIdForManage(null)}
        groupId={selectedGroupIdForManage}
        onRefreshParent={() => {
          fetchData();
          fetchTabCounts();
        }}
      />

      {/* Quick View Product Modal */}
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

      {/* Ornate ERP Sync Modal */}
      <OrnateSyncModal
        isOpen={isSyncModalOpen}
        onClose={() => setIsSyncModalOpen(false)}
        onSyncComplete={() => {
          setIsSyncModalOpen(false);
          fetchData();
          fetchTabCounts();
        }}
      />
    </div>
  );
}
