import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  HiOutlineX,
  HiOutlineRefresh,
  HiOutlinePlus,
  HiOutlineSearch,
  HiOutlineViewGrid,
  HiOutlineViewList,
  HiOutlineStar,
  HiOutlinePencil,
  HiOutlineTrash,
  HiOutlineCheckCircle,
  HiOutlineSwitchHorizontal,
  HiOutlineExternalLink,
  HiOutlineSparkles,
} from 'react-icons/hi';
import { IoDiamondOutline } from 'react-icons/io5';
import Dropdown from '../Dropdown';
import Pagination from '../Pagination';
import SyncPreviewModal from './SyncPreviewModal';
import MoveProductModal from './MoveProductModal';
import api from '../../../api/axios';
import { useConfirm } from '../../../contexts/ConfirmContext';
import { openProductPreview } from '../../../utils/productPreview';

const money = (val) => {
  if (val == null || val === '') return '₹ 0';
  return `₹ ${Number(val).toLocaleString('en-IN')}`;
};

const formatDate = (dateString) => {
  if (!dateString) return 'Never';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return 'Never';
    return d.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return 'Never';
  }
};

const getProductImage = (p) => {
  if (!p) return null;
  if (p.images && p.images[0]) {
    const img = p.images[0];
    return typeof img === 'string' ? img : img.url;
  }
  if (p.ornate?.ornateImages && p.ornate.ornateImages[0]) {
    const img = p.ornate.ornateImages[0];
    return typeof img === 'string' ? img : img.url;
  }
  if (p.colorImages && p.colorImages[0]?.images?.[0]) {
    const img = p.colorImages[0].images[0];
    return typeof img === 'string' ? img : img.url;
  }
  return null;
};

const renderStatusBadge = (p) => {
  const status = (p.status || 'draft').toLowerCase();
  if (status === 'approved') {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-sky-50 text-sky-700 border border-sky-200 capitalize">
        Approved
      </span>
    );
  }
  if (status === 'draft') {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 capitalize">
        Draft
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-stone-100 text-stone-600 border border-stone-200 capitalize">
      {status}
    </span>
  );
};

const renderStockStatusBadge = (p) => {
  const isSold = p.ornate?.isSold || p.stockStatus === 'Sold' || p.status === 'sold';
  if (isSold) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
        Sold
      </span>
    );
  }

  const stock = p.stockStatus || 'In Stock';
  if (stock === 'In Stock') {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
        In Stock
      </span>
    );
  }
  if (stock === 'Out of Stock') {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-stone-100 text-stone-600 border border-stone-200">
        Out of Stock
      </span>
    );
  }
  if (stock === 'Made to Order') {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-50 text-purple-700 border border-purple-200">
        Made to Order
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-stone-100 text-stone-600 border border-stone-200">
      {stock}
    </span>
  );
};

export default function ManageGroupDrawer({
  isOpen,
  onClose,
  groupId,
  onRefreshParent,
}) {
  const navigate = useNavigate();
  const confirm = useConfirm();

  // Drawer state
  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('products'); // 'products' | 'details' | 'history'

  // Products Tab state
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('price_desc');
  const [viewMode, setViewMode] = useState('list');
  const [selectedProductIds, setSelectedProductIds] = useState(new Set());
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Details Tab state
  const [editName, setEditName] = useState('');
  const [editSlug, setEditSlug] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editStatus, setEditStatus] = useState('active');
  const [savingDetails, setSavingDetails] = useState(false);

  // Modals state
  const [syncModalOpen, setSyncModalOpen] = useState(false);
  const [moveModalOpen, setMoveModalOpen] = useState(false);
  const [moveInitialMode, setMoveInitialMode] = useState(null);
  const [moveTargetProducts, setMoveTargetProducts] = useState([]);
  const [addProductsOpen, setAddProductsOpen] = useState(false);
  const [ungroupedPool, setUngroupedPool] = useState([]);
  const [selectedToAdd, setSelectedToAdd] = useState(new Set());
  const [searchAdd, setSearchAdd] = useState('');
  const [savingAdd, setSavingAdd] = useState(false);
  const [approving, setApproving] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);

  const handleOpenMoveSingle = (product) => {
    setMoveTargetProducts([product]);
    setMoveInitialMode('existing');
    setMoveModalOpen(true);
  };

  const handleOpenMoveBulk = () => {
    const list = selectedProductIds.size > 0
      ? (products || []).filter((p) => selectedProductIds.has(p._id))
      : (products || []);
    if (!list.length) {
      toast.error('No products found in this group to move');
      return;
    }
    setMoveTargetProducts(list);
    setMoveInitialMode('existing');
    setMoveModalOpen(true);
  };

  const handleOpenSplitBulk = () => {
    const list = selectedProductIds.size > 0
      ? (products || []).filter((p) => selectedProductIds.has(p._id))
      : (products || []);
    if (!list.length) {
      toast.error('No products found in this group to split');
      return;
    }
    setMoveTargetProducts(list);
    setMoveInitialMode('split');
    setMoveModalOpen(true);
  };

  const handleApproveGroup = async () => {
    const isConfirmed = await confirm({
      title: 'Approve Group Products',
      message: `Change status to "Approved" for all in-stock products in "${group?.groupName || 'this group'}"?`,
      confirmText: 'Approve In-Stock Products',
      type: 'success',
    });
    if (!isConfirmed) return;

    try {
      setApproving(true);
      const res = await api.post(`/product-groups/${groupId}/approve`);
      toast.success(res.data?.message || 'Products approved successfully');
      fetchGroup();
      onRefreshParent?.();
    } catch (err) {
      console.error('Failed to approve group products:', err);
      toast.error(err.response?.data?.message || 'Failed to approve group products');
    } finally {
      setApproving(false);
    }
  };

  // Fetch Group Data
  const fetchGroup = async () => {
    if (!groupId) return;
    try {
      setLoading(true);
      const res = await api.get(`/product-groups/${groupId}`);
      const data = res.data?.data;
      setGroup(data);
      if (data) {
        setEditName(data.groupName || '');
        setEditSlug(data.slug || '');
        setEditDesc(data.description || '');
        setEditStatus(data.status || 'active');
      }
    } catch (err) {
      console.error('Failed to load group:', err);
      toast.error('Could not load group details');
      onClose();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && groupId) {
      fetchGroup();
      setActiveTab('products');
      setSelectedProductIds(new Set());
      setSearch('');
      setSortBy('price_desc');
      setPage(1);
    }
  }, [isOpen, groupId]);

  // Lock body scroll and handle ESC key
  useEffect(() => {
    if (!isOpen) return;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (previewImage) {
          setPreviewImage(null);
        } else if (!syncModalOpen && !moveModalOpen && !addProductsOpen) {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      const otherModals = document.querySelectorAll('[role="dialog"], [aria-modal="true"]');
      if (otherModals.length <= 1) {
        document.body.style.overflow = '';
      }
    };
  }, [isOpen, syncModalOpen, moveModalOpen, addProductsOpen, previewImage]);

  // Filter & Sort Products
  const products = group?.products || [];
  const filteredProducts = useMemo(() => {
    let list = [...products];

    if (search.trim()) {
      const term = search.toLowerCase().trim();
      list = list.filter((p) => {
        const title = p.basicInfo?.title || p.name || '';
        const sku = p.basicInfo?.sku || '';
        const tag = p.ornate?.tagNo || '';
        const barcode = p.ornate?.barcode || '';
        return (
          title.toLowerCase().includes(term) ||
          sku.toLowerCase().includes(term) ||
          tag.toLowerCase().includes(term) ||
          barcode.toLowerCase().includes(term)
        );
      });
    }

    list.sort((a, b) => {
      const priceA = Number(a.pricing?.salePrice || a.pricing?.mrp || 0);
      const priceB = Number(b.pricing?.salePrice || b.pricing?.mrp || 0);
      const titleA = a.basicInfo?.title || a.name || '';
      const titleB = b.basicInfo?.title || b.name || '';

      if (sortBy === 'price_asc') return priceA - priceB;
      if (sortBy === 'price_desc') return priceB - priceA;
      if (sortBy === 'name_asc') return titleA.localeCompare(titleB);
      return 0;
    });

    return list;
  }, [products, search, sortBy]);

  const displayedProducts = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredProducts.slice(start, start + pageSize);
  }, [filteredProducts, page, pageSize]);

  // Checkbox Selection
  const toggleSelect = (id) => {
    setSelectedProductIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedProductIds.size === filteredProducts.length && filteredProducts.length > 0) {
      setSelectedProductIds(new Set());
    } else {
      setSelectedProductIds(new Set(filteredProducts.map((p) => p._id)));
    }
  };

  // Set Manual Representative Product
  const handleSetRepresentative = async (productId) => {
    try {
      await api.patch(`/product-groups/${group._id}`, {
        representativeId: productId,
        representativeMode: 'manual',
      });
      toast.success('Primary representative product updated');
      fetchGroup();
      onRefreshParent?.();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not update representative');
    }
  };

  // Clear Manual Representative (Revert to Auto)
  const handleClearRepresentative = async () => {
    try {
      await api.patch(`/product-groups/${group._id}`, {
        representativeId: null,
        representativeMode: 'auto',
      });
      toast.success('Reverted to automatic representative selection');
      fetchGroup();
      onRefreshParent?.();
    } catch (err) {
      toast.error('Failed to reset representative mode');
    }
  };

  // Remove Single Product
  const handleRemoveProduct = async (productId, title) => {
    const isConfirmed = await confirm({
      title: 'Remove Product from Group',
      message: `Are you sure you want to remove "${title || 'this product'}" from this group? The product will remain in the catalogue.`,
      confirmText: 'Remove',
      type: 'warning',
    });
    if (!isConfirmed) return;

    try {
      await api.delete(`/product-groups/${group._id}/products/${productId}`);
      toast.success('Product removed from group');
      fetchGroup();
      onRefreshParent?.();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not remove product');
    }
  };

  // Bulk Remove Selected
  const handleBulkRemove = async () => {
    const isConfirmed = await confirm({
      title: 'Remove Selected Products',
      message: `Are you sure you want to remove ${selectedProductIds.size} products from this group?`,
      confirmText: 'Remove Products',
      type: 'warning',
    });
    if (!isConfirmed) return;

    try {
      for (const id of Array.from(selectedProductIds)) {
        await api.delete(`/product-groups/${group._id}/products/${id}`);
      }
      toast.success(`Removed ${selectedProductIds.size} products`);
      setSelectedProductIds(new Set());
      fetchGroup();
      onRefreshParent?.();
    } catch (err) {
      toast.error('Failed to remove some products');
    }
  };

  // Save Group Details Form
  const handleSaveDetails = async (e) => {
    e.preventDefault();
    if (!editName.trim()) {
      toast.error('Group name is required');
      return;
    }

    try {
      setSavingDetails(true);
      await api.patch(`/product-groups/${group._id}`, {
        groupName: editName.trim(),
        slug: editSlug.trim() || undefined,
        description: editDesc,
        status: editStatus,
      });
      toast.success('Group details updated');
      fetchGroup();
      onRefreshParent?.();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not save details');
    } finally {
      setSavingDetails(false);
    }
  };

  // Open Add Products Drawer / Modal
  const openAddProducts = async () => {
    try {
      setSearchAdd('');
      setSelectedToAdd(new Set());
      setAddProductsOpen(true);
      const res = await api.get('/product-groups/ungrouped-products?limit=100');
      const items = res.data?.data?.items || res.data?.data || [];
      setUngroupedPool(items);
    } catch (err) {
      toast.error('Failed to load ungrouped products');
    }
  };

  const handleConfirmAddProducts = async () => {
    if (!selectedToAdd.size) return;
    try {
      setSavingAdd(true);
      await api.post(`/product-groups/${group._id}/products`, {
        productIds: Array.from(selectedToAdd),
      });
      toast.success(`Added ${selectedToAdd.size} product(s) to group`);
      setAddProductsOpen(false);
      fetchGroup();
      onRefreshParent?.();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not add products');
    } finally {
      setSavingAdd(false);
    }
  };

  const repProduct = group?.representative;
  const isAutoMode = group?.representativeMode === 'auto';

  // Identify highest priced product that is not sold
  const highestPriceNotSold = useMemo(() => {
    const notSoldList = (products || []).filter(
      (p) => !p.ornate?.isSold && p.stockStatus !== 'Sold' && p.status !== 'sold'
    );
    if (!notSoldList.length) return repProduct || null;

    return notSoldList.reduce((highest, curr) => {
      const currPrice = Number(curr?.pricing?.salePrice || curr?.pricing?.mrp || 0);
      const highPrice = Number(highest?.pricing?.salePrice || highest?.pricing?.mrp || 0);
      return currPrice > highPrice ? curr : highest;
    }, notSoldList[0]);
  }, [products, repProduct]);

  // Dynamic price range calculation
  const { minProductPrice, maxProductPrice } = useMemo(() => {
    const prices = (products || [])
      .map((p) => Number(p?.pricing?.salePrice || p?.pricing?.mrp || 0))
      .filter((v) => !isNaN(v) && v > 0);
    if (!prices.length) return { minProductPrice: 0, maxProductPrice: 0 };
    return {
      minProductPrice: Math.min(...prices),
      maxProductPrice: Math.max(...prices),
    };
  }, [products]);

  const priceRangeFormatted = useMemo(() => {
    const min = group?.minPrice != null && group?.minPrice !== '' ? Number(group.minPrice) : minProductPrice;
    const max = group?.maxPrice != null && group?.maxPrice !== '' ? Number(group.maxPrice) : maxProductPrice;
    if (!min && !max) return '—';
    if (min === max) return money(min);
    return `${money(min)} – ${money(max)}`;
  }, [group?.minPrice, group?.maxPrice, minProductPrice, maxProductPrice]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[999] overflow-y-auto flex items-center justify-center p-2 sm:p-5 lg:p-6 animate-fadeIn">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Centered Modal Card */}
      <section
        role="dialog"
        aria-modal="true"
        className="relative w-full max-w-6xl bg-white rounded-2xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[92vh] sm:max-h-[90vh] border border-stone-200/90 overflow-hidden z-10 transition-all transform duration-200 animate-scaleUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ─── 1. Top Bar: Group Details & Close Button (Matches Screenshot Exactly) ─── */}
        <div className="px-5 sm:px-6 pt-5 pb-3.5 border-b border-stone-100 flex items-start justify-between shrink-0 bg-white">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-stone-900 tracking-tight">
              Group Details
            </h2>
            <p className="text-xs text-stone-500 mt-0.5">
              Manage products in this group
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-full transition-all cursor-pointer"
            aria-label="Close dialog"
          >
            <HiOutlineX className="w-5 h-5" />
          </button>
        </div>

        {/* ─── 2. Hero Info & Actions Banner (Matches Screenshot Exactly) ─── */}
        <div className="px-5 sm:px-6 py-4 border-b border-stone-200/80 bg-[#fdfbf7] flex flex-col lg:flex-row lg:items-center justify-between gap-4 shrink-0">
          {/* Left: Thumbnail & Details */}
          <div className="flex items-center gap-3.5 sm:gap-4 min-w-0">
            {/* Thumbnail with edit badge */}
            <div className="relative group shrink-0">
              <div
                className={`w-16 h-16 rounded-2xl bg-white border border-stone-200 overflow-hidden flex items-center justify-center p-1.5 shadow-2xs ${
                  getProductImage(repProduct) ? 'cursor-pointer hover:border-[#8b6f4e] hover:scale-105 transition-all' : ''
                }`}
                onClick={() => {
                  const repImg = getProductImage(repProduct);
                  if (repImg) {
                    setPreviewImage({
                      url: repImg,
                      title: group?.groupName,
                      tag: repProduct?.ornate?.tagNo,
                      sku: repProduct?.basicInfo?.sku,
                    });
                  }
                }}
                title={getProductImage(repProduct) ? 'Click to preview image' : undefined}
              >
                {getProductImage(repProduct) ? (
                  <img
                    src={getProductImage(repProduct)}
                    alt=""
                    className="w-full h-full object-contain pointer-events-none"
                  />
                ) : (
                  <IoDiamondOutline className="w-7 h-7 text-stone-300" />
                )}
              </div>
              <button
                type="button"
                onClick={() => {
                  if (repProduct?._id) {
                    navigate(`/catalog/ornate-products/edit/${repProduct._id}`);
                  }
                }}
                title="Edit representative product"
                className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-white border border-stone-200 shadow-xs flex items-center justify-center text-stone-500 hover:text-[#8b6f4e] transition-colors cursor-pointer"
              >
                <HiOutlinePencil className="w-2.5 h-2.5" />
              </button>
            </div>

            {/* Info lines */}
            <div className="min-w-0 space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base sm:text-lg font-bold text-stone-900 tracking-tight truncate">
                  {group?.groupName || 'Common Product Group'}
                </h3>
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                    group?.status === 'active'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-stone-100 text-stone-600 border-stone-200'
                  }`}
                >
                  {group?.status === 'active' ? 'Active' : 'Inactive'}
                </span>
              </div>

              <div className="flex items-center gap-2 text-xs text-stone-500 font-medium flex-wrap">
                <span>Code: <strong className="text-stone-800 font-semibold">{group?.groupCode || '—'}</strong></span>
                <span className="text-stone-300">|</span>
                <span>Products: <strong className="text-stone-800 font-semibold">{products.length || group?.productCount || 0}</strong></span>
                <span className="text-stone-300">|</span>
                <span>Eligible: <strong className="text-stone-800 font-semibold">{group?.eligibleCount ?? products.filter((p) => !p.ornate?.isSold && p.stockStatus !== 'Sold').length}</strong></span>
              </div>

              <div className="text-xs text-stone-600 font-medium">
                Price Range: <strong className="text-stone-900 font-bold">{priceRangeFormatted}</strong>
              </div>
            </div>
          </div>

          {/* Right: Actions Buttons matching Screenshot */}
          <div className="flex flex-wrap items-center gap-2 lg:justify-end shrink-0">
            <button
              type="button"
              onClick={handleOpenMoveBulk}
              className={`px-3.5 py-2 text-xs font-semibold rounded-xl border transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer ${
                selectedProductIds.size > 0
                  ? 'bg-[#8b6f4e]/10 border-[#8b6f4e] text-[#8b6f4e] hover:bg-[#8b6f4e]/20'
                  : 'bg-white border-stone-200 text-stone-700 hover:bg-stone-50'
              }`}
              title={selectedProductIds.size > 0 ? `Move ${selectedProductIds.size} selected products` : 'Select products to move or click to choose'}
            >
              <HiOutlineSwitchHorizontal className="w-3.5 h-3.5 text-stone-500" />
              <span>Move to Another Group</span>
            </button>

            <button
              type="button"
              onClick={handleApproveGroup}
              disabled={approving || loading}
              className="px-3.5 py-2 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              title="Approve all in-stock products in this group"
            >
              <HiOutlineCheckCircle className="w-3.5 h-3.5" />
              <span>{approving ? 'Approving...' : 'Approve Group'}</span>
            </button>

            <button
              type="button"
              onClick={openAddProducts}
              className="px-4 py-2 text-xs font-bold text-white bg-[#8b6f4e] hover:bg-[#785e40] rounded-xl transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer"
              title="Add products to this group"
            >
              <HiOutlinePlus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Add Products</span>
            </button>

            <button
              type="button"
              onClick={() => setSyncModalOpen(true)}
              disabled={loading || products.length < 2}
              className="px-3.5 py-2 text-xs font-semibold text-stone-700 bg-white border border-stone-200 hover:bg-stone-50 rounded-xl transition-all shadow-2xs flex items-center gap-1.5 disabled:opacity-40 cursor-pointer"
              title="Synchronize selected fields across group members"
            >
              <HiOutlineRefresh className="w-3.5 h-3.5 text-stone-500" />
              <span>Sync Group</span>
            </button>
          </div>
        </div>

        {/* ─── 3. Body Content ─── */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-6 space-y-4">
          {/* TAB 1: PRODUCTS */}
          {activeTab === 'products' && (
            <div className="space-y-4">
              {/* Top Selection Floating Bar for Member Products */}
              {selectedProductIds.size > 0 && (
                <div className="bg-[#8b6f4e]/10 border border-[#8b6f4e]/25 rounded-2xl px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs animate-fadeIn shadow-2xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[#8b6f4e]">
                      {selectedProductIds.size} product(s) selected
                    </span>
                    <button
                      type="button"
                      onClick={() => setSelectedProductIds(new Set())}
                      className="text-stone-400 hover:text-stone-700 p-0.5 rounded-full hover:bg-stone-200/50 cursor-pointer"
                      title="Clear selection"
                    >
                      <HiOutlineX className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleOpenMoveBulk}
                      className="px-3.5 py-1.5 text-xs font-semibold text-stone-700 bg-white border border-stone-200 hover:bg-stone-50 rounded-xl shadow-2xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <HiOutlineSwitchHorizontal className="w-3.5 h-3.5 text-stone-500" />
                      <span>Move to Another Group</span>
                    </button>
                    {selectedProductIds.size > 1 && (
                      <button
                        type="button"
                        onClick={handleOpenSplitBulk}
                        className="px-3.5 py-1.5 text-xs font-bold text-white bg-[#8b6f4e] hover:bg-[#785e40] rounded-xl shadow-2xs flex items-center gap-1.5 cursor-pointer"
                        title="Split each selected product into its own separate group"
                      >
                        <HiOutlineSparkles className="w-3.5 h-3.5" />
                        <span>1 Group / Product ({selectedProductIds.size})</span>
                      </button>
                    )}
                  </div>
                </div>
              )}

                {/* Search & Sort Controls */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="relative flex-1">
                    <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-400" />
                    <input
                      type="text"
                      value={search}
                      onChange={(e) => {
                        setSearch(e.target.value);
                        setPage(1);
                      }}
                      placeholder="Search member products by title, SKU, tag, barcode..."
                      className="w-full pl-8 pr-7 py-2 text-xs border border-stone-200 rounded-xl bg-stone-50/50 focus:outline-none focus:border-[#8b6f4e]"
                    />
                    {search && (
                      <button
                        type="button"
                        onClick={() => setSearch('')}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                      >
                        <HiOutlineX className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <Dropdown
                      value={sortBy}
                      onChange={setSortBy}
                      options={[
                        { value: 'price_desc', label: 'Price: High to Low' },
                        { value: 'price_asc', label: 'Price: Low to High' },
                        { value: 'name_asc', label: 'Name: A-Z' },
                      ]}
                      className="w-44"
                    />

                    <div className="flex items-center border border-stone-200 rounded-xl p-1 bg-stone-50">
                      <button
                        type="button"
                        onClick={() => setViewMode('list')}
                        className={`p-1.5 rounded-lg transition-all ${
                          viewMode === 'list' ? 'bg-white shadow-2xs text-[#8b6f4e]' : 'text-stone-400'
                        }`}
                        title="List View"
                      >
                        <HiOutlineViewList className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setViewMode('grid')}
                        className={`p-1.5 rounded-lg transition-all ${
                          viewMode === 'grid' ? 'bg-white shadow-2xs text-[#8b6f4e]' : 'text-stone-400'
                        }`}
                        title="Grid View"
                      >
                        <HiOutlineViewGrid className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Product Items: Table View */}
                {viewMode === 'list' ? (
                  <div className="border border-stone-200 rounded-2xl overflow-hidden bg-white shadow-2xs">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs divide-y divide-stone-100">
                        <thead className="bg-stone-50 text-stone-600 font-semibold">
                          <tr>
                            <th className="p-3 w-8">
                              <input
                                type="checkbox"
                                checked={
                                  selectedProductIds.size === filteredProducts.length &&
                                  filteredProducts.length > 0
                                }
                                onChange={toggleSelectAll}
                                className="rounded text-[#8b6f4e] focus:ring-[#8b6f4e] w-3.5 h-3.5 cursor-pointer"
                              />
                            </th>
                            <th className="p-3">Product</th>
                            <th className="p-3">Tag / Barcode / SKU</th>
                            <th className="p-3">Weight</th>
                            <th className="p-3">Sale Price</th>
                            <th className="p-3">Status / Stock</th>
                            <th className="p-3 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-100">
                          {displayedProducts.length === 0 ? (
                            <tr>
                              <td colSpan="7" className="p-8 text-center text-stone-400">
                                No products found in this group.
                              </td>
                            </tr>
                          ) : (
                            displayedProducts.map((p) => {
                              const isSelected = selectedProductIds.has(p._id);
                              const isPrimary = String(group.primaryProductId) === String(p._id);
                              const isRep = String(repProduct?._id) === String(p._id);
                              const isTopAvailable = Boolean(
                                highestPriceNotSold && String(highestPriceNotSold._id) === String(p._id)
                              );
                              const img = getProductImage(p);

                              return (
                                <tr
                                  key={p._id}
                                  className={`hover:bg-stone-50/60 transition-colors ${
                                    isSelected ? 'bg-[#8b6f4e]/5' : ''
                                  }`}
                                >
                                  <td className="p-3">
                                    <input
                                      type="checkbox"
                                      checked={isSelected}
                                      onChange={() => toggleSelect(p._id)}
                                      className="rounded text-[#8b6f4e] focus:ring-[#8b6f4e] w-3.5 h-3.5 cursor-pointer"
                                    />
                                  </td>
                                  <td className="p-3">
                                    <div className="flex items-center gap-3">
                                      <div
                                        className={`w-10 h-10 rounded-lg bg-stone-50 border border-stone-200 overflow-hidden shrink-0 flex items-center justify-center p-0.5 ${
                                          img ? 'cursor-pointer hover:border-[#8b6f4e] hover:scale-105 hover:shadow-xs transition-all' : ''
                                        }`}
                                        onClick={() =>
                                          img &&
                                          setPreviewImage({
                                            url: img,
                                            title: p.basicInfo?.title || p.name || 'Ornate Product',
                                            tag: p.ornate?.tagNo,
                                            sku: p.basicInfo?.sku,
                                          })
                                        }
                                        title={img ? 'Click to preview image' : undefined}
                                      >
                                        {img ? (
                                          <img src={img} alt="" className="w-full h-full object-contain pointer-events-none" />
                                        ) : (
                                          <IoDiamondOutline className="w-4 h-4 text-stone-300" />
                                        )}
                                      </div>
                                      <div className="min-w-0">
                                        <div className="flex items-center gap-1.5">
                                          <p className="font-bold text-stone-900 truncate">
                                            {p.basicInfo?.title || p.name || 'Ornate Product'}
                                          </p>
                                          {isPrimary && (
                                            <span className="px-1.5 py-0.2 bg-amber-50 border border-amber-200 text-amber-700 text-[9px] font-bold rounded">
                                              Primary
                                            </span>
                                          )}
                                          {isRep && !isPrimary && (
                                            <span className="px-1.5 py-0.2 bg-emerald-50 border border-emerald-200 text-emerald-700 text-[9px] font-bold rounded">
                                              Rep (Auto)
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="p-3 font-mono text-[11px] text-stone-600">
                                    <p>Tag: <span className="font-semibold text-stone-800">{p.ornate?.tagNo || '—'}</span></p>
                                    <p className="text-stone-500 text-[10px]">Barcode: {p.ornate?.barcode || p.barcode || '—'}</p>
                                    <p className="text-stone-400 text-[10px]">SKU: {p.basicInfo?.sku || '—'}</p>
                                  </td>
                                  <td className="p-3 text-stone-600">
                                    {p.specifications?.metalWeight ?? p.ornate?.netWt ?? '—'} g
                                  </td>
                                  <td className="p-3 font-bold text-stone-900">
                                    {money(p.pricing?.salePrice || p.pricing?.mrp)}
                                  </td>
                                  <td className="p-3">
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 flex-wrap">
                                      {renderStatusBadge(p)}
                                      {renderStockStatusBadge(p)}
                                    </div>
                                  </td>
                                  <td className="p-3 text-right">
                                    <div className="flex items-center justify-end gap-1.5">
                                      {isTopAvailable && (
                                        <button
                                          type="button"
                                          onClick={() => openProductPreview(p)}
                                          className="p-1.5 rounded-lg border border-[#e8ded1] bg-[#faf8f5] text-[#8b6f4e] hover:bg-[#f3ece0] hover:text-[#735839] hover:border-[#8b6f4e]/40 transition-all cursor-pointer shadow-2xs"
                                          title="Open product on website (storefront)"
                                        >
                                          <HiOutlineExternalLink className="w-4 h-4 stroke-[2]" />
                                        </button>
                                      )}
                                      <button
                                        type="button"
                                        onClick={() => handleOpenMoveSingle(p)}
                                        className="p-1.5 rounded-lg border border-stone-200 bg-white text-stone-600 hover:text-[#8b6f4e] hover:border-[#8b6f4e]/40 hover:bg-[#8b6f4e]/5 transition-all cursor-pointer"
                                        title="Move to another group or create new group"
                                      >
                                        <HiOutlineSwitchHorizontal className="w-4 h-4" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleSetRepresentative(p._id)}
                                        className={`p-1.5 rounded-lg border transition-all ${
                                          isPrimary
                                            ? 'bg-amber-50 border-amber-300 text-amber-600'
                                            : 'bg-white border-stone-200 text-stone-400 hover:text-amber-500 hover:border-amber-200'
                                        }`}
                                        title={isPrimary ? 'Current Primary Representative' : 'Set as Primary Representative'}
                                      >
                                        <HiOutlineStar className="w-4 h-4 fill-current" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => navigate(`/catalog/ornate-products/edit/${p._id}`)}
                                        className="p-1.5 rounded-lg border border-stone-200 bg-white text-stone-600 hover:text-stone-900 hover:bg-stone-50"
                                        title="Edit Product"
                                      >
                                        <HiOutlinePencil className="w-4 h-4" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleRemoveProduct(p._id, p.basicInfo?.title)}
                                        className="p-1.5 rounded-lg border border-stone-200 bg-white text-rose-500 hover:bg-rose-50 hover:border-rose-200"
                                        title="Remove from Group"
                                      >
                                        <HiOutlineTrash className="w-4 h-4" />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>

                    <Pagination
                      currentPage={page}
                      totalItems={filteredProducts.length}
                      pageSize={pageSize}
                      pageSizeOptions={[10, 25, 50]}
                      onPageChange={setPage}
                      onPageSizeChange={(newSize) => {
                        setPageSize(newSize);
                        setPage(1);
                      }}
                      className="border-t border-stone-100"
                    />
                  </div>
                ) : (
                  /* Grid View */
                  <div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3.5">
                      {displayedProducts.map((p) => {
                        const isSelected = selectedProductIds.has(p._id);
                        const isPrimary = String(group.primaryProductId) === String(p._id);
                        const isTopAvailable = Boolean(
                          highestPriceNotSold && String(highestPriceNotSold._id) === String(p._id)
                        );
                        const img = getProductImage(p);

                        return (
                          <div
                            key={p._id}
                            className={`p-3 bg-white border rounded-2xl transition-all shadow-2xs hover:shadow-sm flex flex-col justify-between ${
                              isSelected ? 'border-[#8b6f4e] ring-1 ring-[#8b6f4e]' : 'border-stone-200 hover:border-stone-300'
                            }`}
                          >
                            <div>
                              <div className="flex items-center justify-between gap-1 mb-2">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => toggleSelect(p._id)}
                                  className="rounded text-[#8b6f4e] focus:ring-[#8b6f4e] w-4 h-4 cursor-pointer shrink-0"
                                />
                                <div className="flex items-center gap-1 flex-wrap">
                                  {renderStatusBadge(p)}
                                  {renderStockStatusBadge(p)}
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleSetRepresentative(p._id)}
                                  className={`p-1 rounded-lg shrink-0 ${
                                    isPrimary ? 'text-amber-500' : 'text-stone-300 hover:text-amber-500'
                                  }`}
                                  title="Set as representative"
                                >
                                  <HiOutlineStar className="w-4 h-4 fill-current" />
                                </button>
                              </div>

                              <div
                                className={`w-full h-32 bg-stone-50 rounded-xl overflow-hidden mb-2 flex items-center justify-center p-2 ${
                                  img ? 'cursor-pointer hover:opacity-90 hover:scale-[1.02] hover:shadow-xs transition-all' : ''
                                }`}
                                onClick={() =>
                                  img &&
                                  setPreviewImage({
                                    url: img,
                                    title: p.basicInfo?.title || p.name || 'Ornate Product',
                                    tag: p.ornate?.tagNo,
                                    sku: p.basicInfo?.sku,
                                  })
                                }
                                title={img ? 'Click to preview image' : undefined}
                              >
                                {img ? (
                                  <img src={img} alt="" className="w-full h-full object-contain pointer-events-none" />
                                ) : (
                                  <IoDiamondOutline className="w-6 h-6 text-stone-300" />
                                )}
                              </div>

                              <p className="font-bold text-xs text-stone-900 truncate" title={p.basicInfo?.title || 'Ornate Product'}>
                                {p.basicInfo?.title || 'Ornate Product'}
                              </p>
                              <div className="space-y-0.5 mt-1 font-mono text-[10px] text-stone-500">
                                <p className="truncate" title={`Tag: ${p.ornate?.tagNo || '—'} · SKU: ${p.basicInfo?.sku || '—'}`}>
                                  Tag: <span className="font-semibold text-stone-800">{p.ornate?.tagNo || '—'}</span> · SKU: <span className="font-semibold text-stone-800">{p.basicInfo?.sku || '—'}</span>
                                </p>
                                <p className="truncate text-stone-600" title={`Barcode: ${p.ornate?.barcode || p.barcode || '—'}`}>
                                  Barcode: <span className="font-semibold text-stone-800">{p.ornate?.barcode || p.barcode || '—'}</span>
                                </p>
                              </div>
                            </div>

                            <div className="mt-2.5 pt-2 border-t border-stone-100 flex items-center justify-between text-xs">
                              <span className="font-bold text-[#8b6f4e]">
                                {money(p.pricing?.salePrice || p.pricing?.mrp)}
                              </span>
                              <div className="flex items-center gap-1">
                                {isTopAvailable && (
                                  <button
                                    type="button"
                                    onClick={() => openProductPreview(p)}
                                    className="p-1 text-[#8b6f4e] hover:text-[#735839] transition-colors cursor-pointer"
                                    title="Open product on website (storefront)"
                                  >
                                    <HiOutlineExternalLink className="w-3.5 h-3.5 stroke-[2]" />
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => handleOpenMoveSingle(p)}
                                  className="p-1 text-stone-500 hover:text-[#8b6f4e] transition-colors cursor-pointer"
                                  title="Move to another group or create new group"
                                >
                                  <HiOutlineSwitchHorizontal className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => navigate(`/catalog/ornate-products/edit/${p._id}`)}
                                  className="p-1 text-stone-500 hover:text-stone-900"
                                  title="Edit Product"
                                >
                                  <HiOutlinePencil className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveProduct(p._id, p.basicInfo?.title)}
                                  className="p-1 text-rose-500 hover:text-rose-700"
                                  title="Remove from Group"
                                >
                                  <HiOutlineTrash className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <Pagination
                      currentPage={page}
                      totalItems={filteredProducts.length}
                      pageSize={pageSize}
                      pageSizeOptions={[10, 25, 50]}
                      onPageChange={setPage}
                      onPageSizeChange={(newSize) => {
                        setPageSize(newSize);
                        setPage(1);
                      }}
                      className="mt-4"
                    />
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: GROUP DETAILS & MODE */}
            {activeTab === 'details' && (
              <form onSubmit={handleSaveDetails} className="space-y-5 max-w-xl">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Group Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-stone-200 rounded-xl bg-stone-50/50 focus:outline-none focus:border-[#8b6f4e]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Slug</label>
                  <input
                    type="text"
                    value={editSlug}
                    onChange={(e) => setEditSlug(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-stone-200 rounded-xl bg-stone-50/50 focus:outline-none focus:border-[#8b6f4e]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Description</label>
                  <textarea
                    rows={4}
                    value={editDesc}
                    onChange={(e) => setEditDesc(e.target.value)}
                    placeholder="Provide details about this group collection..."
                    className="w-full px-3 py-2 text-xs border border-stone-200 rounded-xl bg-stone-50/50 focus:outline-none focus:border-[#8b6f4e]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Group Status</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-stone-200 rounded-xl bg-stone-50/50 focus:outline-none focus:border-[#8b6f4e]"
                  >
                    <option value="active">Active (Visible in Admin & Catalogue)</option>
                    <option value="inactive">Inactive (Hidden from Catalogue)</option>
                  </select>
                </div>

                {/* Representative Mode Box */}
                <div className="p-4 bg-stone-50 border border-stone-200 rounded-2xl space-y-3">
                  <h4 className="text-xs font-bold text-stone-800">Representative Selection Mode</h4>
                  <p className="text-[11px] text-stone-500 leading-relaxed">
                    Current Mode:{' '}
                    <strong className="text-stone-800 capitalize">
                      {isAutoMode ? 'Automatic' : 'Manual (Custom Selected Product)'}
                    </strong>
                    . In automatic mode, the highest-priced eligible member is selected.
                  </p>

                  {!isAutoMode && (
                    <button
                      type="button"
                      onClick={handleClearRepresentative}
                      className="px-3 py-1.5 text-xs font-semibold text-[#8b6f4e] bg-white border border-[#8b6f4e]/40 rounded-xl hover:bg-[#8b6f4e]/5 shadow-2xs"
                    >
                      Clear Manual Selection (Revert to Auto)
                    </button>
                  )}
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={savingDetails}
                    className="px-6 py-2.5 text-xs font-semibold text-white bg-[#8b6f4e] hover:bg-[#785e40] rounded-xl transition-all shadow-2xs disabled:opacity-50 cursor-pointer"
                  >
                    {savingDetails ? 'Saving...' : 'Save Group Details'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </section>

      {/* Sync Preview Modal */}
      <SyncPreviewModal
        isOpen={syncModalOpen}
        onClose={() => setSyncModalOpen(false)}
        group={group}
        selectedProductIds={Array.from(selectedProductIds)}
        onSuccess={() => {
          fetchGroup();
          onRefreshParent?.();
        }}
      />

      {/* Move Product Modal */}
      <MoveProductModal
        isOpen={moveModalOpen}
        onClose={() => {
          setMoveModalOpen(false);
          setMoveTargetProducts([]);
          setMoveInitialMode(null);
        }}
        sourceGroup={group}
        initialMode={moveInitialMode}
        productIds={
          moveTargetProducts.length > 0
            ? moveTargetProducts.map((p) => p._id)
            : selectedProductIds.size > 0
            ? Array.from(selectedProductIds)
            : (products || []).map((p) => p._id)
        }
        products={
          moveTargetProducts.length > 0
            ? moveTargetProducts
            : selectedProductIds.size > 0
            ? (products || []).filter((p) => selectedProductIds.has(p._id))
            : (products || [])
        }
        onSuccess={() => {
          setSelectedProductIds(new Set());
          setMoveTargetProducts([]);
          setMoveInitialMode(null);
          fetchGroup();
          onRefreshParent?.();
        }}
      />

      {/* Quick Add Products Drawer / Modal */}
      {addProductsOpen && (
        <div
          className="fixed inset-0 z-[1050] flex items-center justify-center p-3 sm:p-4 bg-stone-900/60 backdrop-blur-xs"
          onClick={() => setAddProductsOpen(false)}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-xl max-h-[90vh] sm:max-h-[85vh] flex flex-col p-4 sm:p-5 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-stone-900">Add Products to {group?.groupName}</h3>
                <p className="text-[11px] text-stone-500">Select ungrouped Ornate products to add</p>
              </div>
              <button
                type="button"
                onClick={() => setAddProductsOpen(false)}
                className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg"
              >
                <HiOutlineX className="w-5 h-5" />
              </button>
            </div>

            <div className="relative">
              <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-400" />
              <input
                type="text"
                value={searchAdd}
                onChange={(e) => setSearchAdd(e.target.value)}
                placeholder="Search ungrouped products by title, SKU, tag..."
                className="w-full pl-8 pr-3 py-1.5 text-xs border border-stone-200 rounded-lg bg-stone-50/50"
              />
            </div>

            <div className="flex-1 overflow-y-auto border border-stone-200 rounded-xl divide-y divide-stone-100 max-h-64">
              {ungroupedPool
                .filter((p) => {
                  if (!searchAdd.trim()) return true;
                  const term = searchAdd.toLowerCase().trim();
                  return (
                    (p.basicInfo?.title || '').toLowerCase().includes(term) ||
                    (p.basicInfo?.sku || '').toLowerCase().includes(term) ||
                    (p.ornate?.tagNo || '').toLowerCase().includes(term)
                  );
                })
                .map((p) => {
                  const isChecked = selectedToAdd.has(p._id);
                  const img = getProductImage(p);
                  return (
                    <label
                      key={p._id}
                      className="flex items-center gap-3 p-2.5 hover:bg-stone-50 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {
                          setSelectedToAdd((prev) => {
                            const next = new Set(prev);
                            if (next.has(p._id)) next.delete(p._id);
                            else next.add(p._id);
                            return next;
                          });
                        }}
                        className="rounded text-[#8b6f4e] focus:ring-[#8b6f4e] w-4 h-4"
                      />
                      <div
                        className={`w-9 h-9 rounded-lg bg-stone-50 border border-stone-200 overflow-hidden shrink-0 flex items-center justify-center p-0.5 ${
                          img ? 'cursor-pointer hover:border-[#8b6f4e] hover:scale-105 transition-all' : ''
                        }`}
                        onClick={(e) => {
                          if (img) {
                            e.preventDefault();
                            e.stopPropagation();
                            setPreviewImage({
                              url: img,
                              title: p.basicInfo?.title || p.name || 'Ornate Product',
                              tag: p.ornate?.tagNo,
                              sku: p.basicInfo?.sku,
                            });
                          }
                        }}
                        title={img ? 'Click to preview image' : undefined}
                      >
                        {img ? (
                          <img src={img} alt="" className="w-full h-full object-contain pointer-events-none" />
                        ) : (
                          <IoDiamondOutline className="w-4 h-4 text-stone-300" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-stone-800 truncate">
                          {p.basicInfo?.title || 'Ornate Product'}
                        </p>
                        <p className="text-[10px] text-stone-500 font-mono truncate" title={`Tag: ${p.ornate?.tagNo || '—'} · Barcode: ${p.ornate?.barcode || p.barcode || '—'} · SKU: ${p.basicInfo?.sku || '—'}`}>
                          Tag: {p.ornate?.tagNo || '—'} · Barcode: {p.ornate?.barcode || p.barcode || '—'} · SKU: {p.basicInfo?.sku || '—'}
                        </p>
                      </div>
                      <span className="text-xs font-bold text-stone-800 shrink-0">
                        {money(p.pricing?.salePrice || p.pricing?.mrp)}
                      </span>
                    </label>
                  );
                })}
              {ungroupedPool.length === 0 && (
                <div className="p-6 text-center text-xs text-stone-400">
                  No ungrouped products available.
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-stone-100">
              <span className="text-xs text-stone-500">{selectedToAdd.size} selected</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setAddProductsOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmAddProducts}
                  disabled={savingAdd || !selectedToAdd.size}
                  className="px-5 py-2 text-xs font-semibold text-white bg-[#8b6f4e] hover:bg-[#785e40] rounded-xl transition-all shadow-2xs disabled:opacity-50"
                >
                  {savingAdd ? 'Adding...' : 'Add Selected'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Image Preview Modal (Lightbox) */}
      {previewImage &&
        createPortal(
          <div
            className="fixed inset-0 z-[1200] flex items-center justify-center p-3 sm:p-6 bg-stone-950/85 backdrop-blur-md animate-fadeIn select-none"
            onClick={() => setPreviewImage(null)}
          >
            <div
              className="relative max-w-4xl w-full max-h-[92vh] bg-stone-900 border border-stone-800 rounded-2xl sm:rounded-3xl shadow-2xl p-4 sm:p-6 flex flex-col items-center gap-3 animate-scaleUp overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header with Title & Action buttons */}
              <div className="w-full flex items-center justify-between gap-3 pb-3 border-b border-stone-800 text-stone-200 shrink-0">
                <div className="min-w-0 flex-1">
                  <h3 className="font-bold text-sm sm:text-base text-white truncate">
                    {previewImage.title || 'Product Image Preview'}
                  </h3>
                  <div className="flex items-center gap-2 text-[11px] text-stone-400 font-mono mt-0.5 flex-wrap">
                    {previewImage.tag && (
                      <span>
                        Tag: <strong className="text-stone-300">{previewImage.tag}</strong>
                      </span>
                    )}
                    {previewImage.tag && previewImage.sku && <span>•</span>}
                    {previewImage.sku && (
                      <span>
                        SKU: <strong className="text-stone-300">{previewImage.sku}</strong>
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <a
                    href={previewImage.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white transition-all cursor-pointer"
                    title="Open full resolution in new tab"
                  >
                    <HiOutlineExternalLink className="w-5 h-5 stroke-[2]" />
                  </a>
                  <button
                    type="button"
                    onClick={() => setPreviewImage(null)}
                    className="p-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white transition-all cursor-pointer"
                    title="Close (Esc)"
                  >
                    <HiOutlineX className="w-5 h-5 stroke-[2]" />
                  </button>
                </div>
              </div>

              {/* Main Image Display */}
              <div className="w-full flex-1 min-h-0 flex items-center justify-center p-2 overflow-hidden bg-black/30 rounded-2xl border border-stone-800/60">
                <img
                  src={previewImage.url}
                  alt={previewImage.title || 'Product preview'}
                  className="max-h-[70vh] max-w-full object-contain rounded-xl shadow-2xl transition-transform duration-200"
                />
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>,
    document.body
  );
}
