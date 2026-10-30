import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
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
  HiOutlineSparkles,
  HiOutlineCheckCircle,
  HiOutlineChevronDown,
  HiOutlineChevronUp,
  HiOutlineCube,
} from 'react-icons/hi';
import { IoDiamondOutline, IoLayersOutline } from 'react-icons/io5';
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
  const [activeTab, setActiveTab] = useState('all'); // all, draft, approved, sold, ungrouped
  const [groupFilterType, setGroupFilterType] = useState('all'); // 'all' (shows 2 parts), 'single', 'multi'
  const [collapsedSections, setCollapsedSections] = useState({ single: false, multi: false });
  const [viewMode, setViewMode] = useState('grid'); // grid, list
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('single_first');
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
    ungrouped: 0,
    single: 0,
    multi: 0,
  });

  // Selection
  const [selectedIds, setSelectedIds] = useState(new Set());

  // Modals & Drawers
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [isCreateGroupModalOpen, setIsCreateGroupModalOpen] = useState(false);
  const [selectedGroupIdForManage, setSelectedGroupIdForManage] = useState(null);
  const [viewingProduct, setViewingProduct] = useState(null);
  const [bulkSplitting, setBulkSplitting] = useState(false);
  const [bulkApproving, setBulkApproving] = useState(false);
  const [approvingGroupId, setApprovingGroupId] = useState(null);

  // Close viewingProduct on ESC & lock body scroll
  useEffect(() => {
    if (!viewingProduct) return;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setViewingProduct(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [viewingProduct]);

  // Sort Options
  const sortOptions = [
    { value: 'single_first', label: '1-Product Groups First' },
    { value: 'multi_first', label: 'Multi-Product Groups First' },
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
          status: 'all',
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

      if (groupFilterType !== 'all') params.set('groupType', groupFilterType);
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
  }, [activeTab, groupFilterType, page, pageSize, searchQuery, sortBy]);

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
  }, [activeTab, groupFilterType, searchQuery, sortBy]);

  // Split loaded groups into 1-product (single) and multi-product groups
  const singleGroups = useMemo(
    () => groups.filter((g) => (g.productCount ?? (g.productIds?.length || 0)) === 1),
    [groups]
  );
  const multiGroups = useMemo(
    () => groups.filter((g) => (g.productCount ?? (g.productIds?.length || 0)) !== 1),
    [groups]
  );

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

  // Bulk Split Ungrouped Products into individual groups (1 product per group)
  const handleBulkSplitUngrouped = async () => {
    if (!selectedIds.size) return;
    const isConfirmed = await confirm({
      title: `Create ${selectedIds.size} Separate Groups`,
      message: `Create a separate standalone Common Group for each of the ${selectedIds.size} selected products automatically? Each group will be named with its item title and barcode.`,
      confirmText: `Create ${selectedIds.size} Separate Groups`,
      type: 'success',
    });
    if (!isConfirmed) return;

    try {
      setBulkSplitting(true);
      const res = await api.post('/product-groups/bulk-split-individual', {
        productIds: Array.from(selectedIds),
      });
      toast.success(res.data?.message || `Successfully created ${selectedIds.size} separate groups!`);
      setSelectedIds(new Set());
      fetchData();
      fetchTabCounts();
    } catch (err) {
      console.error('Failed to bulk split products:', err);
      toast.error(err.response?.data?.message || 'Failed to create separate groups');
    } finally {
      setBulkSplitting(false);
    }
  };

  // Bulk Approve Products in Selected Groups
  const handleBulkApproveGroups = async () => {
    if (!selectedIds.size) return;
    const isConfirmed = await confirm({
      title: `Approve Products in ${selectedIds.size} Group(s)`,
      message: `Directly approve all in-stock products across the ${selectedIds.size} selected group(s)? Approved products will become active in your catalogue.`,
      confirmText: `Approve ${selectedIds.size} Group(s)`,
      type: 'success',
    });
    if (!isConfirmed) return;

    try {
      setBulkApproving(true);
      const res = await api.post('/product-groups/bulk-approve', {
        groupIds: Array.from(selectedIds),
      });
      toast.success(res.data?.message || `Successfully approved products across selected groups!`);
      setSelectedIds(new Set());
      fetchData();
      fetchTabCounts();
    } catch (err) {
      console.error('Failed to bulk approve groups:', err);
      toast.error(err.response?.data?.message || 'Failed to approve selected groups');
    } finally {
      setBulkApproving(false);
    }
  };

  // Direct 1-Click Approve Products in a Single Group (instant without extra modal)
  const handleDirectApproveOneGroup = async (group) => {
    try {
      setApprovingGroupId(group._id);
      const res = await api.post(`/product-groups/${group._id}/approve`);
      toast.success(res.data?.message || `Approved products in "${group.groupName}"`);
      fetchData();
      fetchTabCounts();
    } catch (err) {
      console.error('Failed to approve group:', err);
      toast.error(err.response?.data?.message || 'Failed to approve group');
    } finally {
      setApprovingGroupId(null);
    }
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

  const [updatingVisibilityId, setUpdatingVisibilityId] = useState(null);

  // Toggle Web & App visibility for products
  const handleToggleProductVisibility = async (p, platform, e) => {
    if (e) e.stopPropagation();
    const pid = p._id || p.id;
    if (!pid) return;

    const currentWeb = p.inweb !== false && p.visibility?.web !== false;
    const currentApp = p.inapp !== false && p.visibility?.app !== false;
    const nextWeb = platform === 'web' ? !currentWeb : currentWeb;
    const nextApp = platform === 'app' ? !currentApp : currentApp;

    // Optimistically update products state
    setProducts((prev) =>
      prev.map((item) => {
        if ((item._id || item.id) === pid) {
          return {
            ...item,
            inweb: nextWeb,
            inapp: nextApp,
            visibility: {
              ...(item.visibility || {}),
              web: nextWeb,
              app: nextApp,
            },
          };
        }
        return item;
      })
    );

    try {
      setUpdatingVisibilityId(`${pid}-${platform}`);
      const payload =
        platform === 'web'
          ? { 'visibility.web': nextWeb }
          : { 'visibility.app': nextApp };
      await api.put(`/products/${pid}`, payload);
      toast.success(
        `${platform === 'web' ? 'Web' : 'App'} visibility ${
          (platform === 'web' ? nextWeb : nextApp) ? 'enabled' : 'disabled'
        }`
      );
    } catch (err) {
      console.error('Failed to update product visibility:', err);
      toast.error(`Failed to update ${platform} visibility`);
      // Revert on error
      setProducts((prev) =>
        prev.map((item) => {
          if ((item._id || item.id) === pid) {
            return {
              ...item,
              inweb: currentWeb,
              inapp: currentApp,
              visibility: {
                ...(item.visibility || {}),
                web: currentWeb,
                app: currentApp,
              },
            };
          }
          return item;
        })
      );
    } finally {
      setUpdatingVisibilityId(null);
    }
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
    const pCount = group.productCount ?? (Array.isArray(group.productIds) ? group.productIds.length : 0);
    const isEmpty = pCount === 0;
    const isSingle = pCount === 1;
    const title = isEmpty ? 'Delete Empty Group' : isSingle ? 'Delete Product' : 'Delete Product Group';
    const message = isEmpty
      ? `Are you sure you want to delete empty group "${group.groupName || group.groupCode}"?`
      : isSingle
      ? `Are you sure you want to delete "${group.groupName}"?`
      : `Are you sure you want to delete group "${group.groupName}"? Member products will be preserved in Ungrouped.`;

    const isConfirmed = await confirm({
      title,
      message: isEmpty
        ? `Are you sure you want to permanently delete empty group "${group.groupName || group.groupCode}"? This will permanently remove it from the database.`
        : message,
      confirmText: isEmpty ? 'Permanently Delete' : 'Delete',
      type: 'danger',
    });
    if (!isConfirmed) return;

    try {
      const pId = group.primaryProductId || group.firstProduct?._id || group.representative?._id;
      if (pId && isSingle) {
        try {
          await api.delete(`/products/${pId}`);
        } catch (e) {}
      }
      const res = await api.delete(`/product-groups/${group._id}`);
      const isHard = res.data?.data?.hardDeleted ?? isEmpty;
      toast.success(isHard ? 'Empty group permanently deleted' : isSingle ? 'Product deleted successfully' : 'Group deleted successfully');
      fetchData();
      fetchTabCounts();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not delete');
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
          <div className="relative w-full lg:w-80">
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

          {/* Sub-Filter: 2-Part View vs 1-Product Only vs Multi-Product Only */}
          {activeTab !== 'ungrouped' && (
            <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-xl border border-stone-200 shrink-0 w-full lg:w-auto justify-center overflow-x-auto">
              <button
                type="button"
                onClick={() => setGroupFilterType('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                  groupFilterType === 'all'
                    ? 'bg-white text-stone-900 shadow-2xs font-bold ring-1 ring-stone-200'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
                title="Show both 1-product and multi-product groups broken into 2 parts"
              >
                <span>2 Parts (All)</span>
              </button>
              <button
                type="button"
                onClick={() => setGroupFilterType('single')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                  groupFilterType === 'single'
                    ? 'text-white shadow-2xs font-bold'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
                style={groupFilterType === 'single' ? { backgroundColor: 'var(--theme-primary)' } : undefined}
                title="Show only 1-product groups"
              >
                <IoDiamondOutline className="w-3.5 h-3.5" />
                <span>1 Product</span>
                {tabCounts.single > 0 && activeTab === 'all' && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                      groupFilterType === 'single'
                        ? 'bg-black/20 text-white'
                        : 'bg-stone-200 text-stone-700'
                    }`}
                  >
                    {tabCounts.single}
                  </span>
                )}
              </button>
              <button
                type="button"
                onClick={() => setGroupFilterType('multi')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                  groupFilterType === 'multi'
                    ? 'text-white shadow-2xs font-bold'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
                style={groupFilterType === 'multi' ? { backgroundColor: 'var(--theme-primary)' } : undefined}
                title="Show only multi-product groups"
              >
                <HiOutlineSparkles className="w-3.5 h-3.5" />
                <span>Multi-Product</span>
                {tabCounts.multi > 0 && activeTab === 'all' && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                      groupFilterType === 'multi'
                        ? 'bg-black/20 text-white'
                        : 'bg-stone-200 text-stone-700'
                    }`}
                  >
                    {tabCounts.multi}
                  </span>
                )}
              </button>
            </div>
          )}

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
            {/* Top Selection & Action Bar for Groups */}
            {selectedIds.size > 0 && (
              <div className="bg-[#8b6f4e]/10 border border-[#8b6f4e]/20 rounded-2xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-[#8b6f4e]">
                    {selectedIds.size} group(s) selected
                  </span>
                  <button
                    type="button"
                    onClick={() => setSelectedIds(new Set())}
                    className="text-[11px] text-stone-500 hover:text-stone-800 underline ml-1 cursor-pointer"
                  >
                    Deselect All
                  </button>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {singleGroups.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        const singles = groups.filter((g) => (g.productCount ?? 0) === 1);
                        setSelectedIds(new Set(singles.map((g) => g._id)));
                      }}
                      className="px-3 py-1.5 font-semibold text-stone-700 bg-white border border-stone-200 hover:bg-stone-50 rounded-xl transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer text-xs"
                      title="Select all groups on this page that have exactly 1 product"
                    >
                      <span>Select All 1-Product ({singleGroups.length})</span>
                    </button>
                  )}
                  {multiGroups.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        const multis = groups.filter((g) => (g.productCount ?? 0) !== 1);
                        setSelectedIds(new Set(multis.map((g) => g._id)));
                      }}
                      className="px-3 py-1.5 font-semibold text-stone-700 bg-white border border-stone-200 hover:bg-stone-50 rounded-xl transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer text-xs"
                      title="Select all groups on this page that have multiple products"
                    >
                      <span>Select All Multi-Product ({multiGroups.length})</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={toggleSelectAll}
                    className="px-3 py-1.5 font-semibold text-stone-700 bg-white border border-stone-200 hover:bg-stone-50 rounded-xl transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer text-xs"
                  >
                    <span>{selectedIds.size === groups.length ? 'Deselect Page' : 'Select All on Page'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleBulkApproveGroups}
                    disabled={bulkApproving}
                    className="px-3.5 py-1.5 font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <HiOutlineCheckCircle className="w-4 h-4" />
                    <span>{bulkApproving ? 'Approving Products...' : `Approve Selected Groups (${selectedIds.size})`}</span>
                  </button>
                </div>
              </div>
            )}

            {/* Helper to render group cards in grid or list mode */}
            {(() => {
              const renderCardsGrid = (items) => (
                <div
                  className={
                    viewMode === 'grid'
                      ? 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4'
                      : 'space-y-3'
                  }
                >
                  {items.map((g) => (
                    <GroupCard
                      key={g._id}
                      group={g}
                      viewMode={viewMode}
                      isSelected={selectedIds.has(g._id)}
                      activeTab={activeTab}
                      onToggleSelect={() => toggleSelectOne(g._id)}
                      onManage={(group) => setSelectedGroupIdForManage(group._id)}
                      onEdit={(group) => {
                        const pId = group.primaryProductId || group.firstProduct?._id || group.representative?._id;
                        if (pId && (!group.productCount || group.productCount <= 1)) {
                          navigate(`/catalog/ornate-products/edit/${pId}`);
                        } else {
                          setSelectedGroupIdForManage(group._id);
                        }
                      }}
                      onAddProducts={(group) => setSelectedGroupIdForManage(group._id)}
                      onToggleStatus={handleToggleGroupStatus}
                      onDelete={handleDeleteGroup}
                      onDirectApprove={handleDirectApproveOneGroup}
                      isApproving={approvingGroupId === g._id}
                    />
                  ))}
                </div>
              );

              if (groupFilterType === 'single') {
                return (
                  <div className="bg-white border border-stone-200 rounded-2xl p-4 shadow-2xs space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-stone-100">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-700">
                          <IoDiamondOutline className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h2 className="text-sm font-bold text-stone-900 tracking-tight">
                              Single Products (1-Product Groups)
                            </h2>
                            <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                              {groups.length} {groups.length === 1 ? 'Group' : 'Groups'}
                            </span>
                          </div>
                          <p className="text-[11px] text-stone-500">
                            Individual products assigned to their own standalone group
                          </p>
                        </div>
                      </div>
                    </div>
                    {renderCardsGrid(groups)}
                  </div>
                );
              }

              if (groupFilterType === 'multi') {
                return (
                  <div className="bg-white border border-stone-200 rounded-2xl p-4 shadow-2xs space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-stone-100">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-700">
                          <IoLayersOutline className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h2 className="text-sm font-bold text-stone-900 tracking-tight">
                              Multi-Product Groups (Multiple Products)
                            </h2>
                            <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-800 border border-blue-200">
                              {groups.length} {groups.length === 1 ? 'Group' : 'Groups'}
                            </span>
                          </div>
                          <p className="text-[11px] text-stone-500">
                            Groups containing multiple products, sizes, designs, or matching sets
                          </p>
                        </div>
                      </div>
                    </div>
                    {renderCardsGrid(groups)}
                  </div>
                );
              }

              return (
                <div className="space-y-6">
                  {/* ═══ PART 1: SINGLE PRODUCTS (1 PRODUCT) ═══ */}
                  <div className="bg-white border border-stone-200 rounded-2xl p-4 shadow-2xs space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-stone-100">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-700">
                          <IoDiamondOutline className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-200">
                              Part 1
                            </span>
                            <h2 className="text-sm font-bold text-stone-900 tracking-tight">
                              Single Products (1-Product Groups)
                            </h2>
                            <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                              {singleGroups.length} {singleGroups.length === 1 ? 'Product' : 'Products'}
                            </span>
                          </div>
                          <p className="text-[11px] text-stone-500">
                            Standalone products assigned to their own dedicated group
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {singleGroups.length > 0 && (
                          <button
                            type="button"
                            onClick={() => {
                              const allSingleSelected = singleGroups.every((g) => selectedIds.has(g._id));
                              setSelectedIds((prev) => {
                                const next = new Set(prev);
                                singleGroups.forEach((g) => {
                                  if (allSingleSelected) next.delete(g._id);
                                  else next.add(g._id);
                                });
                                return next;
                              });
                            }}
                            className="text-xs font-semibold px-2.5 py-1.5 rounded-xl text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 transition-colors cursor-pointer"
                          >
                            {singleGroups.every((g) => selectedIds.has(g._id))
                              ? 'Deselect 1-Product'
                              : `Select 1-Product (${singleGroups.length})`}
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() =>
                            setCollapsedSections((prev) => ({ ...prev, single: !prev.single }))
                          }
                          className="text-xs font-semibold px-2.5 py-1.5 rounded-xl text-stone-600 bg-stone-100 hover:bg-stone-200 transition-colors cursor-pointer flex items-center gap-1"
                        >
                          <span>{collapsedSections.single ? 'Expand' : 'Collapse'}</span>
                          {collapsedSections.single ? (
                            <HiOutlineChevronDown className="w-3.5 h-3.5" />
                          ) : (
                            <HiOutlineChevronUp className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>

                    {!collapsedSections.single && (
                      singleGroups.length > 0 ? (
                        renderCardsGrid(singleGroups)
                      ) : (
                        <div className="text-center py-6 text-stone-400 text-xs italic">
                          No 1-product groups on this page
                        </div>
                      )
                    )}
                  </div>

                  {/* ═══ VISUAL DIVIDER (Where the admin drew the red line) ═══ */}
                  <div className="relative py-2 flex items-center justify-center">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t-2 border-dashed border-[#8b6f4e]/30" />
                    </div>
                    <div className="relative bg-[#fcfaf7] px-4 py-1.5 rounded-full border border-[#8b6f4e]/30 text-[11px] font-bold text-[#8b6f4e] uppercase tracking-wider flex items-center gap-2 shadow-2xs">
                      <HiOutlineSparkles className="w-3.5 h-3.5 text-[#8b6f4e]" />
                      <span>Part 2: Multiple Products in Group Below</span>
                      <span className="px-2 py-0.2 rounded-full text-[10px] bg-[#8b6f4e]/10 text-[#8b6f4e] font-semibold">
                        {multiGroups.length}
                      </span>
                    </div>
                  </div>

                  {/* ═══ PART 2: MULTI-PRODUCT GROUPS (2+ PRODUCTS) ═══ */}
                  <div className="bg-white border border-stone-200 rounded-2xl p-4 shadow-2xs space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-stone-100">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-700">
                          <IoLayersOutline className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-blue-100 text-blue-900 border border-blue-200">
                              Part 2
                            </span>
                            <h2 className="text-sm font-bold text-stone-900 tracking-tight">
                              Multi-Product Groups (Multiple Products)
                            </h2>
                            <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-800 border border-blue-200">
                              {multiGroups.length} {multiGroups.length === 1 ? 'Group' : 'Groups'}
                            </span>
                          </div>
                          <p className="text-[11px] text-stone-500">
                            Product groups containing multiple items, variants, designs, or matching sets
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {multiGroups.length > 0 && (
                          <button
                            type="button"
                            onClick={() => {
                              const allMultiSelected = multiGroups.every((g) => selectedIds.has(g._id));
                              setSelectedIds((prev) => {
                                const next = new Set(prev);
                                multiGroups.forEach((g) => {
                                  if (allMultiSelected) next.delete(g._id);
                                  else next.add(g._id);
                                });
                                return next;
                              });
                            }}
                            className="text-xs font-semibold px-2.5 py-1.5 rounded-xl text-blue-800 bg-blue-50 hover:bg-blue-100 border border-blue-200 transition-colors cursor-pointer"
                          >
                            {multiGroups.every((g) => selectedIds.has(g._id))
                              ? 'Deselect Multi'
                              : `Select Multi (${multiGroups.length})`}
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() =>
                            setCollapsedSections((prev) => ({ ...prev, multi: !prev.multi }))
                          }
                          className="text-xs font-semibold px-2.5 py-1.5 rounded-xl text-stone-600 bg-stone-100 hover:bg-stone-200 transition-colors cursor-pointer flex items-center gap-1"
                        >
                          <span>{collapsedSections.multi ? 'Expand' : 'Collapse'}</span>
                          {collapsedSections.multi ? (
                            <HiOutlineChevronDown className="w-3.5 h-3.5" />
                          ) : (
                            <HiOutlineChevronUp className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>

                    {!collapsedSections.multi && (
                      multiGroups.length > 0 ? (
                        renderCardsGrid(multiGroups)
                      ) : (
                        <div className="text-center py-6 text-stone-400 text-xs italic">
                          No multi-product groups on this page
                        </div>
                      )
                    )}
                  </div>
                </div>
              );
            })()}

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
              <div className="bg-[#8b6f4e]/10 border border-[#8b6f4e]/20 rounded-2xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
                <span className="font-bold text-[#8b6f4e]">
                  {selectedIds.size} ungrouped product(s) selected
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsCreateGroupModalOpen(true)}
                    className="px-3.5 py-1.5 font-semibold text-stone-700 bg-white border border-stone-200 hover:bg-stone-50 rounded-xl transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <HiOutlinePlus className="w-3.5 h-3.5" />
                    <span>Create 1 Combined Group</span>
                  </button>
                  {selectedIds.size > 1 && (
                    <button
                      type="button"
                      onClick={handleBulkSplitUngrouped}
                      disabled={bulkSplitting}
                      className="px-3.5 py-1.5 font-bold text-white bg-[#8b6f4e] hover:bg-[#785e40] rounded-xl transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      title="Create an individual Common Group for each selected product in one click"
                    >
                      <HiOutlineSparkles className="w-3.5 h-3.5" />
                      <span>{bulkSplitting ? 'Creating Groups...' : `1 Group / Product (${selectedIds.size} Groups)`}</span>
                    </button>
                  )}
                </div>
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
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={(e) => handleToggleProductVisibility(p, 'web', e)}
                            disabled={updatingVisibilityId === `${p._id}-web`}
                            title={p.inweb !== false && p.visibility?.web !== false ? 'Web: Visible (Click to Hide)' : 'Web: Hidden (Click to Show)'}
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold border transition-colors cursor-pointer ${
                              p.inweb !== false && p.visibility?.web !== false
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                                : 'bg-stone-50 text-stone-400 border-stone-200 hover:text-stone-600 hover:bg-stone-100'
                            }`}
                          >
                            🌐 Web
                          </button>
                          <button
                            type="button"
                            onClick={(e) => handleToggleProductVisibility(p, 'app', e)}
                            disabled={updatingVisibilityId === `${p._id}-app`}
                            title={p.inapp !== false && p.visibility?.app !== false ? 'App: Visible (Click to Hide)' : 'App: Hidden (Click to Show)'}
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold border transition-colors cursor-pointer ${
                              p.inapp !== false && p.visibility?.app !== false
                                ? 'bg-sky-50 text-sky-700 border-sky-200 hover:bg-sky-100'
                                : 'bg-stone-50 text-stone-400 border-stone-200 hover:text-stone-600 hover:bg-stone-100'
                            }`}
                          >
                            📱 App
                          </button>
                          {renderStatusBadge(p)}
                        </div>
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
                          record={p}
                          detailsEndpoint="/products"
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
                <div className="overflow-x-auto">
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
                        <th className="p-3 text-center">Visibility</th>
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
                              <div
                                className={`w-10 h-10 rounded-lg bg-stone-50 border border-stone-200 p-1 flex items-center justify-center transition-all ${
                                  imgUrl ? 'cursor-pointer hover:border-[#8b6f4e] hover:scale-105 hover:shadow-xs' : ''
                                }`}
                                onClick={() => setViewingProduct(p)}
                                title={imgUrl ? 'Click to view product & image' : undefined}
                              >
                                {imgUrl ? (
                                  <img src={imgUrl} alt="" className="max-w-full max-h-full object-contain pointer-events-none" />
                                ) : (
                                  <IoDiamondOutline className="w-5 h-5 text-stone-300" />
                                )}
                              </div>
                            </td>
                            <td className="p-3 font-bold text-stone-900">{title}</td>
                            <td className="p-3 font-mono text-stone-500 text-[11px]">{sku}</td>
                            <td className="p-3 font-bold text-stone-900">{money(price)}</td>
                            <td className="p-3 text-center" onClick={(e) => e.stopPropagation()}>
                              <div className="inline-flex items-center gap-1.5 bg-stone-50/90 p-1 rounded-lg border border-stone-200/80 shadow-2xs">
                                <button
                                  type="button"
                                  onClick={(e) => handleToggleProductVisibility(p, 'web', e)}
                                  disabled={updatingVisibilityId === `${p._id}-web`}
                                  title={p.inweb !== false && p.visibility?.web !== false ? 'Web: Visible (Click to Hide)' : 'Web: Hidden (Click to Show)'}
                                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold border transition-all cursor-pointer ${
                                    p.inweb !== false && p.visibility?.web !== false
                                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200/80 hover:bg-emerald-100'
                                      : 'bg-white text-stone-400 border-stone-200 hover:text-stone-600 hover:bg-stone-50'
                                  }`}
                                >
                                  <span className="text-[10px]">🌐</span>
                                  <span>Web</span>
                                  <span className={`w-1.5 h-1.5 rounded-full ${p.inweb !== false && p.visibility?.web !== false ? 'bg-emerald-500' : 'bg-stone-300'}`} />
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => handleToggleProductVisibility(p, 'app', e)}
                                  disabled={updatingVisibilityId === `${p._id}-app`}
                                  title={p.inapp !== false && p.visibility?.app !== false ? 'App: Visible (Click to Hide)' : 'App: Hidden (Click to Show)'}
                                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold border transition-all cursor-pointer ${
                                    p.inapp !== false && p.visibility?.app !== false
                                      ? 'bg-sky-50 text-sky-700 border-sky-200/80 hover:bg-sky-100'
                                      : 'bg-white text-stone-400 border-stone-200 hover:text-stone-600 hover:bg-stone-50'
                                  }`}
                                >
                                  <span className="text-[10px]">📱</span>
                                  <span>App</span>
                                  <span className={`w-1.5 h-1.5 rounded-full ${p.inapp !== false && p.visibility?.app !== false ? 'bg-sky-500' : 'bg-stone-300'}`} />
                                </button>
                              </div>
                            </td>
                            <td className="p-3">{renderStatusBadge(p)}</td>
                            <td className="p-3 text-right">
                              <RowActions
                                record={p}
                                detailsEndpoint="/products"
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
      {viewingProduct &&
        createPortal(
          <div
            className="fixed inset-0 z-[999] bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-fadeIn"
            onClick={() => setViewingProduct(null)}
          >
            <div
              className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-5 animate-scaleUp max-h-[90vh] overflow-y-auto"
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
        </div>,
        document.body
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
