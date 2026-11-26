import { useState, useEffect, useMemo } from 'react';
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
  HiOutlinePencil,
  HiOutlineCheckCircle,
  HiOutlineDocumentText,
  HiOutlineSwitchHorizontal,
  HiOutlineExternalLink,
} from 'react-icons/hi';
import { IoDiamondOutline } from 'react-icons/io5';
import Dropdown from '../Dropdown';
import Pagination from '../Pagination';
import MobileGridList from '../MobileGridList';
import { EditActionButton, DeleteActionButton, MoveActionButton, RepresentativeActionButton } from '../RowActions';
import SyncPreviewModal from './SyncPreviewModal';
import MoveProductModal from './MoveProductModal';
import ProductPickerModal from '../ProductPickerModal';
import StatusBadge from '../StatusBadge';
import api from '../../../api/axios';
import { useConfirm } from '../../../contexts/ConfirmContext';
import { openProductPreview } from '../../../utils/productPreview';
import { money } from '../../../utils/formatters';
import { getProductImage } from '../../../utils/imageUrl';

const renderStatusBadge = (p) => <StatusBadge status={p.status || 'draft'} size="xs" />;

const renderStockStatusBadge = (p) => {
  const isSold = p.ornate?.isSold || p.stockStatus === 'Sold' || p.status === 'sold';
  const stock = isSold ? 'sold' : (p.stockStatus || 'in_stock');
  return <StatusBadge status={stock} size="xs" />;
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
  const [editStatus, setEditStatus] = useState('active');
  const [savingDetails, setSavingDetails] = useState(false);

  // Modals state
  const [syncModalOpen, setSyncModalOpen] = useState(false);
  const [moveModalOpen, setMoveModalOpen] = useState(false);
  const [moveInitialMode, setMoveInitialMode] = useState(null);
  const [moveTargetProducts, setMoveTargetProducts] = useState([]);
  const [addProductsOpen, setAddProductsOpen] = useState(false);
  const [approving, setApproving] = useState(false);
  const [drafting, setDrafting] = useState(false);
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

  const handleDraftGroup = async () => {
    const isConfirmed = await confirm({
      title: 'Move Group Products to Draft',
      message: `Change status to "Draft" for all in-stock products in "${group?.groupName || 'this group'}"? Draft products will be hidden from storefront browsing.`,
      confirmText: 'Move to Draft',
      type: 'warning',
    });
    if (!isConfirmed) return;

    try {
      setDrafting(true);
      const res = await api.post(`/product-groups/${groupId}/draft`);
      toast.success(res.data?.message || 'Products moved to draft successfully');
      fetchGroup();
      onRefreshParent?.();
    } catch (err) {
      console.error('Failed to move group products to draft:', err);
      toast.error(err.response?.data?.message || 'Failed to move group products to draft');
    } finally {
      setDrafting(false);
    }
  };

  const handleToggleProductStatus = async (product) => {
    const isApproved = (product.status || '').toLowerCase() === 'approved';
    const targetStatus = isApproved ? 'draft' : 'approved';
    try {
      if (targetStatus === 'draft') {
        const res = await api.post(`/product-groups/${groupId}/draft`, { productIds: [product._id] });
        toast.success(res.data?.message || `Moved "${product.basicInfo?.title || 'Product'}" to draft`);
      } else {
        const res = await api.post(`/product-groups/${groupId}/approve`, { productIds: [product._id] });
        toast.success(res.data?.message || `Approved "${product.basicInfo?.title || 'Product'}"`);
      }
      fetchGroup();
      onRefreshParent?.();
    } catch (err) {
      console.error('Failed to update product status:', err);
      toast.error(err.response?.data?.message || 'Failed to update status');
    }
  };

  const handleApproveSelected = async () => {
    if (!selectedProductIds.size) return;
    try {
      setApproving(true);
      const res = await api.post(`/product-groups/${groupId}/approve`, {
        productIds: Array.from(selectedProductIds),
      });
      toast.success(res.data?.message || 'Selected products approved successfully');
      setSelectedProductIds(new Set());
      fetchGroup();
      onRefreshParent?.();
    } catch (err) {
      console.error('Failed to approve selected products:', err);
      toast.error(err.response?.data?.message || 'Failed to approve selected products');
    } finally {
      setApproving(false);
    }
  };

  const handleDraftSelected = async () => {
    if (!selectedProductIds.size) return;
    try {
      setDrafting(true);
      const res = await api.post(`/product-groups/${groupId}/draft`, {
        productIds: Array.from(selectedProductIds),
      });
      toast.success(res.data?.message || 'Selected products moved to draft');
      setSelectedProductIds(new Set());
      fetchGroup();
      onRefreshParent?.();
    } catch (err) {
      console.error('Failed to draft selected products:', err);
      toast.error(err.response?.data?.message || 'Failed to move selected products to draft');
    } finally {
      setDrafting(false);
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
        setEditStatus(data.status || 'active');
      }
    } catch (err) {
      if (err?.response?.status === 404) {
        // Group no longer exists (e.g. disbanded, deleted, or all products moved out)
        onClose();
        onRefreshParent?.();
        return;
      }
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

  const inStockProducts = useMemo(() => {
    return products.filter((p) => {
      const isSold = p.ornate?.isSold || p.stockStatus === 'Sold' || p.status === 'sold';
      return !isSold;
    });
  }, [products]);

  const approvedInStockCount = useMemo(() => {
    return inStockProducts.filter((p) => (p.status || '').toLowerCase() === 'approved').length;
  }, [inStockProducts]);

  const draftInStockCount = useMemo(() => {
    return inStockProducts.filter((p) => (p.status || '').toLowerCase() === 'draft' || !p.status).length;
  }, [inStockProducts]);

  const isAllApproved = inStockProducts.length > 0 && approvedInStockCount === inStockProducts.length;
  const filteredProducts = useMemo(() => {
    let list = [...products];

    if (search.trim()) {
      const term = search.toLowerCase().trim();
      list = list.filter((p) => {
        const title = p.basicInfo?.title || '';
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
      const titleA = a.basicInfo?.title || '';
      const titleB = b.basicInfo?.title || '';

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
      });
      toast.success('Reverted to automatic representative selection');
      fetchGroup();
      onRefreshParent?.();
    } catch {
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

  // Open Add Products Modal
  const openAddProducts = () => {
    setAddProductsOpen(true);
  };

  const handleApplyAddProducts = async (selectedList) => {
    const existingSet = new Set((products || []).map((p) => String(p._id)));
    const newIds = (selectedList || [])
      .map((p) => String(p._id || p.id))
      .filter((id) => id && !existingSet.has(id));

    if (!newIds.length) {
      setAddProductsOpen(false);
      return;
    }

    try {
      await api.post(`/product-groups/${group._id}/products`, {
        productIds: newIds,
      });
      toast.success(`Added ${newIds.length} product(s) to group`);
      setAddProductsOpen(false);
      fetchGroup();
      onRefreshParent?.();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not add products');
    }
  };

  const repProduct = group?.representative;
  const isAutoMode = !group?.primaryProductId;

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
        {/* ─── 1. Top Bar: Group Details & Close Button ─── */}
        <div className="px-4 sm:px-6 pt-4 sm:pt-5 pb-3 sm:pb-3.5 border-b border-stone-100 flex items-start justify-between shrink-0 bg-white">
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

        <div className="flex-1 overflow-y-auto md:overflow-hidden flex flex-col">
        {/* ─── 2. Hero Info & Actions Banner ─── */}
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-stone-200/80 bg-[#fdfbf7] flex flex-col lg:flex-row lg:items-center justify-between gap-3 sm:gap-4 shrink-0">
          {/* Left: Thumbnail & Details */}
          <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
            {/* Thumbnail with edit badge */}
            <div className="relative group shrink-0">
              <div
                className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white border border-stone-200 overflow-hidden flex items-center justify-center p-1.5 shadow-2xs ${
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
            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm sm:text-lg font-bold text-stone-900 tracking-tight truncate max-w-full">
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
              </div>

              <div className="text-xs text-stone-600 font-medium">
                Price Range: <strong className="text-stone-900 font-bold">{priceRangeFormatted}</strong>
              </div>
            </div>
          </div>

          {/* Right: Actions Buttons matching Screenshot */}
          <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 lg:justify-end shrink-0">
            <button
              type="button"
              onClick={handleOpenMoveBulk}
              className={`px-2.5 sm:px-3.5 py-2 text-[11px] sm:text-xs font-semibold rounded-xl border transition-all shadow-2xs flex items-center justify-center gap-1.5 cursor-pointer ${
                selectedProductIds.size > 0
                  ? 'bg-[#8b6f4e]/10 border-[#8b6f4e] text-[#8b6f4e] hover:bg-[#8b6f4e]/20'
                  : 'bg-white border-stone-200 text-stone-700 hover:bg-stone-50'
              }`}
              title={selectedProductIds.size > 0 ? `Move ${selectedProductIds.size} selected products` : 'Select products to move or click to choose'}
            >
              <HiOutlineSwitchHorizontal className="w-3.5 h-3.5 text-stone-500 shrink-0" />
              <span className="truncate">Move to Another Group{selectedProductIds.size > 0 ? ` (${selectedProductIds.size})` : ''}</span>
            </button>

            {isAllApproved ? (
              <button
                type="button"
                onClick={handleDraftGroup}
                disabled={drafting || loading}
                className="px-2.5 sm:px-3.5 py-2 text-[11px] sm:text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-xl transition-all shadow-2xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                title="Move all in-stock products in this group to draft"
              >
                <HiOutlineDocumentText className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{drafting ? 'Moving to Draft...' : 'Draft Group'}</span>
              </button>
            ) : draftInStockCount > 0 && approvedInStockCount === 0 ? (
              <button
                type="button"
                onClick={handleApproveGroup}
                disabled={approving || loading}
                className="px-2.5 sm:px-3.5 py-2 text-[11px] sm:text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition-all shadow-2xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                title="Approve all in-stock products in this group"
              >
                <HiOutlineCheckCircle className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{approving ? 'Approving...' : 'Approve Group'}</span>
              </button>
            ) : (
              <>
                {draftInStockCount > 0 && (
                  <button
                    type="button"
                    onClick={handleApproveGroup}
                    disabled={approving || loading}
                    className="px-2.5 sm:px-3.5 py-2 text-[11px] sm:text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition-all shadow-2xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                    title={`Approve ${draftInStockCount} draft in-stock product(s)`}
                  >
                    <HiOutlineCheckCircle className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{approving ? 'Approving...' : `Approve Group (${draftInStockCount})`}</span>
                  </button>
                )}
                {approvedInStockCount > 0 && (
                  <button
                    type="button"
                    onClick={handleDraftGroup}
                    disabled={drafting || loading}
                    className="px-2.5 sm:px-3.5 py-2 text-[11px] sm:text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-xl transition-all shadow-2xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                    title={`Move ${approvedInStockCount} approved product(s) to draft`}
                  >
                    <HiOutlineDocumentText className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{drafting ? 'Moving to Draft...' : `Draft Group (${approvedInStockCount})`}</span>
                  </button>
                )}
              </>
            )}

            <button
              type="button"
              onClick={openAddProducts}
              className="px-3 sm:px-4 py-2 text-[11px] sm:text-xs font-bold text-white bg-[#8b6f4e] hover:bg-[#785e40] rounded-xl transition-all shadow-2xs flex items-center justify-center gap-1.5 cursor-pointer"
              title="Add products to this group"
            >
              <HiOutlinePlus className="w-3.5 h-3.5 stroke-[2.5] shrink-0" />
              <span className="truncate">Add Products</span>
            </button>

            <button
              type="button"
              onClick={() => setSyncModalOpen(true)}
              disabled={loading || products.length < 2}
              className="px-2.5 sm:px-3.5 py-2 text-[11px] sm:text-xs font-semibold text-stone-700 bg-white border border-stone-200 hover:bg-stone-50 rounded-xl transition-all shadow-2xs flex items-center justify-center gap-1.5 disabled:opacity-40 cursor-pointer"
              title="Synchronize selected product information across group members"
            >
              <HiOutlineRefresh className="w-3.5 h-3.5 text-stone-500 shrink-0" />
              <span className="truncate">Sync Product Info</span>
            </button>
          </div>
        </div>

        {/* ─── 3. Body Content ─── */}
        <div className="md:flex-1 md:overflow-y-auto p-3.5 sm:p-6 space-y-3.5 sm:space-y-4">
          {/* TAB 1: PRODUCTS */}
          {activeTab === 'products' && (
            <div className="space-y-4">
              {/* Top Selection Info Bar for Member Products */}
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
                      onClick={handleApproveSelected}
                      disabled={approving || drafting}
                      className="px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg flex items-center gap-1 cursor-pointer disabled:opacity-50"
                      title="Approve selected products"
                    >
                      <HiOutlineCheckCircle className="w-3.5 h-3.5" />
                      <span>Approve Selected</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleDraftSelected}
                      disabled={approving || drafting}
                      className="px-2.5 py-1 text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg flex items-center gap-1 cursor-pointer disabled:opacity-50"
                      title="Move selected products to draft"
                    >
                      <HiOutlineDocumentText className="w-3.5 h-3.5" />
                      <span>Draft Selected</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedProductIds(new Set())}
                      className="text-[11px] font-semibold text-[#8b6f4e] hover:underline cursor-pointer ml-1"
                    >
                      Clear selection
                    </button>
                  </div>
                </div>
              )}

                {/* Search & Sort Controls */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3">
                  <div className="relative flex-1">
                    <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-400" />
                    <input
                      type="text"
                      value={search}
                      onChange={(e) => {
                        setSearch(e.target.value);
                        setPage(1);
                      }}
                      placeholder="Search by title, SKU, tag, barcode..."
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

                  <div className="flex items-center justify-between sm:justify-end gap-2">
                    <Dropdown
                      value={sortBy}
                      onChange={setSortBy}
                      options={[
                        { value: 'price_desc', label: 'Price: High to Low' },
                        { value: 'price_asc', label: 'Price: Low to High' },
                        { value: 'name_asc', label: 'Name: A-Z' },
                      ]}
                      className="flex-1 sm:flex-initial sm:w-44"
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

                {/* Product Items: List View (Mobile Cards + Desktop Table) */}
                {viewMode === 'list' ? (
                  <div className="border border-stone-200 rounded-2xl overflow-hidden bg-white shadow-2xs">
                    <MobileGridList
                      loading={loading}
                      loadingText="Loading group products..."
                      isEmpty={displayedProducts.length === 0}
                      emptyText="No products found in this group."
                      items={displayedProducts}
                      showSelectAll
                      allSelected={
                        selectedProductIds.size === filteredProducts.length &&
                        filteredProducts.length > 0
                      }
                      onSelectAll={toggleSelectAll}
                      renderCard={(p, index) => {
                        const isSelected = selectedProductIds.has(p._id);
                        const isPrimary = String(group.primaryProductId) === String(p._id);
                        const isRep = String(repProduct?._id) === String(p._id);
                        const isTopAvailable = Boolean(
                          highestPriceNotSold && String(highestPriceNotSold._id) === String(p._id)
                        );
                        const img = getProductImage(p);
                        const srNo = (page - 1) * pageSize + index + 1;

                        return (
                          <div
                            key={p._id}
                            className={`rounded-xl border p-3 bg-white shadow-2xs space-y-2.5 ${
                              isSelected ? 'border-[#8b6f4e] bg-[#faf6f0]/50' : 'border-stone-200/90'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => toggleSelect(p._id)}
                                  className="rounded text-[#8b6f4e] focus:ring-[#8b6f4e] w-3.5 h-3.5 cursor-pointer shrink-0"
                                />
                                <div
                                  className={`w-10 h-10 rounded-lg bg-stone-50 border border-stone-200 overflow-hidden shrink-0 flex items-center justify-center p-0.5 ${
                                    img ? 'cursor-pointer' : ''
                                  }`}
                                  onClick={() =>
                                    img &&
                                    setPreviewImage({
                                      url: img,
                                      title: p.basicInfo?.title || 'Ornate Product',
                                      tag: p.ornate?.tagNo,
                                      sku: p.basicInfo?.sku,
                                    })
                                  }
                                >
                                  {img ? (
                                    <img src={img} alt="" className="w-full h-full object-contain pointer-events-none" />
                                  ) : (
                                    <IoDiamondOutline className="w-4 h-4 text-stone-300" />
                                  )}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="text-[10px] font-semibold text-stone-400">#{srNo}</span>
                                    <p className="font-bold text-stone-900 text-xs truncate">
                                      {p.basicInfo?.title || 'Ornate Product'}
                                    </p>
                                  </div>
                                  <div className="flex items-center gap-1 flex-wrap mt-1">
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
                                    <button
                                      type="button"
                                      onClick={() => handleToggleProductStatus(p)}
                                      className="cursor-pointer inline-flex items-center"
                                    >
                                      {renderStatusBadge(p)}
                                    </button>
                                    {renderStockStatusBadge(p)}
                                  </div>
                                </div>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-stone-100 text-[11px]">
                              <div>
                                <p className="text-[10px] uppercase tracking-wider text-stone-400 font-semibold">Tag / Barcode</p>
                                <p className="font-mono text-stone-700 mt-0.5 truncate">
                                  Tag: <span className="font-semibold text-stone-900">{p.ornate?.tagNo || '—'}</span>
                                </p>
                                <p className="font-mono text-stone-700 truncate">
                                  Barcode: <span className="font-semibold text-stone-900">{p.ornate?.barcode || p.barcode || '—'}</span>
                                </p>
                              </div>
                              <div>
                                <p className="text-[10px] uppercase tracking-wider text-stone-400 font-semibold">Price &amp; Weight</p>
                                <p className="font-bold text-stone-900 mt-0.5">
                                  {money(p.pricing?.salePrice || p.pricing?.mrp)}
                                </p>
                                <p className="text-stone-500">
                                  {p.specifications?.metalWeight ?? p.ornate?.netWt ?? '—'} g
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center justify-end gap-1.5 pt-2 border-t border-stone-100">
                              {isTopAvailable && (
                                <button
                                  type="button"
                                  onClick={() => openProductPreview(p)}
                                  className="w-7 h-7 rounded-lg border border-[#e8ded1] bg-[#faf8f5] text-[#8b6f4e] inline-flex items-center justify-center cursor-pointer"
                                  title="Open product on website"
                                >
                                  <HiOutlineExternalLink className="w-3.5 h-3.5 stroke-[2]" />
                                </button>
                              )}
                              <MoveActionButton
                                onClick={() => handleOpenMoveSingle(p)}
                                title="Move to another group or create new group"
                              />
                              <RepresentativeActionButton
                                isPrimary={isPrimary}
                                onClick={() => handleSetRepresentative(p._id)}
                              />
                              <EditActionButton
                                onClick={() => navigate(`/catalog/ornate-products/edit/${p._id}`)}
                                title="Edit Product"
                              />
                              <DeleteActionButton
                                onClick={() => handleRemoveProduct(p._id, p.basicInfo?.title)}
                                title="Remove from Group"
                              />
                            </div>
                          </div>
                        );
                      }}
                    />

                    <div className="hidden md:block overflow-x-auto">
                      <table className="w-full min-w-[760px] text-left text-xs divide-y divide-stone-100">
                        <thead>
                          <tr className="border-b border-stone-200/80 bg-[#eef2f6] text-[11px] font-bold text-stone-700 uppercase tracking-wider">
                            <th className="py-3 px-3 w-8">
                              <input
                                type="checkbox"
                                checked={
                                  selectedProductIds.size === filteredProducts.length &&
                                  filteredProducts.length > 0
                                }
                                onChange={toggleSelectAll}
                                className="w-3.5 h-3.5 rounded border-stone-300 text-[#8b6f4e] focus:ring-[#8b6f4e]/30 cursor-pointer"
                              />
                            </th>
                            <th className="py-3 px-2 text-center whitespace-nowrap w-12">Sr. No.</th>
                            <th className="py-3 px-3 whitespace-nowrap">Product</th>
                            <th className="py-3 px-3 whitespace-nowrap">Tag / Barcode</th>
                            <th className="py-3 px-3 whitespace-nowrap">Weight</th>
                            <th className="py-3 px-3 whitespace-nowrap">Sale Price</th>
                            <th className="py-3 px-3 whitespace-nowrap">Status / Stock</th>
                            <th className="py-3 px-3 text-right whitespace-nowrap">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-100">
                          {displayedProducts.length === 0 ? (
                            <tr>
                              <td colSpan="8" className="p-8 text-center text-stone-400">
                                No products found in this group.
                              </td>
                            </tr>
                          ) : (
                            displayedProducts.map((p, index) => {
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
                                  <td className="p-3 text-center text-stone-500 font-semibold text-xs whitespace-nowrap">
                                    {(page - 1) * pageSize + index + 1}
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
                                            title: p.basicInfo?.title || 'Ornate Product',
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
                                            {p.basicInfo?.title || 'Ornate Product'}
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
                                  <td className="p-3 font-mono text-[11px]">
                                    <p className="text-stone-700">Tag: <span className="font-semibold text-stone-900">{p.ornate?.tagNo || '—'}</span></p>
                                    <p className="text-stone-700 text-[11px]">Barcode: <span className="font-semibold text-stone-900">{p.ornate?.barcode || p.barcode || '—'}</span></p>
                                  </td>
                                  <td className="p-3 text-stone-600">
                                    {p.specifications?.metalWeight ?? p.ornate?.netWt ?? '—'} g
                                  </td>
                                  <td className="p-3 font-bold text-stone-900">
                                    {money(p.pricing?.salePrice || p.pricing?.mrp)}
                                  </td>
                                  <td className="p-3">
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 flex-wrap">
                                      <button
                                        type="button"
                                        onClick={() => handleToggleProductStatus(p)}
                                        className="cursor-pointer group/status inline-flex items-center transition-transform hover:scale-105 active:scale-95 focus:outline-none"
                                        title={`Status: ${p.status || 'draft'}. Click to switch to ${(p.status || '').toLowerCase() === 'approved' ? 'Draft' : 'Approved'}`}
                                      >
                                        {renderStatusBadge(p)}
                                      </button>
                                      {renderStockStatusBadge(p)}
                                    </div>
                                  </td>
                                  <td className="p-3 text-right">
                                    <div className="flex items-center justify-end gap-1.5">
                                      {isTopAvailable && (
                                        <button
                                          type="button"
                                          onClick={() => openProductPreview(p)}
                                          className="w-7 h-7 rounded-lg border border-[#e8ded1] bg-[#faf8f5] text-[#8b6f4e] hover:bg-[#f3ece0] hover:text-[#735839] hover:border-[#8b6f4e]/40 inline-flex items-center justify-center transition-all cursor-pointer shadow-2xs active:scale-95"
                                          title="Open product on website (storefront)"
                                        >
                                          <HiOutlineExternalLink className="w-3.5 h-3.5 stroke-[2]" />
                                        </button>
                                      )}
                                      <MoveActionButton
                                        onClick={() => handleOpenMoveSingle(p)}
                                        title="Move to another group or create new group"
                                      />
                                      <RepresentativeActionButton
                                        isPrimary={isPrimary}
                                        onClick={() => handleSetRepresentative(p._id)}
                                      />
                                      <EditActionButton
                                        onClick={() => navigate(`/catalog/ornate-products/edit/${p._id}`)}
                                        title="Edit Product"
                                      />
                                      <DeleteActionButton
                                        onClick={() => handleRemoveProduct(p._id, p.basicInfo?.title)}
                                        title="Remove from Group"
                                      />
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
                                  <button
                                    type="button"
                                    onClick={() => handleToggleProductStatus(p)}
                                    className="cursor-pointer group/status inline-flex items-center transition-transform hover:scale-105 active:scale-95 focus:outline-none"
                                    title={`Status: ${p.status || 'draft'}. Click to switch to ${(p.status || '').toLowerCase() === 'approved' ? 'Draft' : 'Approved'}`}
                                  >
                                    {renderStatusBadge(p)}
                                  </button>
                                  {renderStockStatusBadge(p)}
                                </div>
                                <RepresentativeActionButton
                                  isPrimary={isPrimary}
                                  onClick={() => handleSetRepresentative(p._id)}
                                  className="shrink-0"
                                />
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
                              <div className="space-y-0.5 mt-1 font-mono text-[10px] text-stone-700">
                                <p className="truncate text-stone-700" title={`Tag: ${p.ornate?.tagNo || '—'}`}>
                                  Tag: <span className="font-semibold text-stone-900">{p.ornate?.tagNo || '—'}</span>
                                </p>
                                <p className="truncate text-stone-700" title={`Barcode: ${p.ornate?.barcode || '—'}`}>
                                  Barcode: <span className="font-semibold text-stone-900">{p.ornate?.barcode || p.barcode || '—'}</span>
                                </p>
                              </div>
                            </div>

                            <div className="mt-2.5 pt-2 border-t border-stone-100 flex items-center justify-between text-xs">
                              <span className="font-bold text-[#8b6f4e]">
                                {money(p.pricing?.salePrice || p.pricing?.mrp)}
                              </span>
                              <div className="flex items-center gap-1.5">
                                {isTopAvailable && (
                                  <button
                                    type="button"
                                    onClick={() => openProductPreview(p)}
                                    className="w-7 h-7 rounded-lg border border-[#e8ded1] bg-[#faf8f5] text-[#8b6f4e] hover:bg-[#f3ece0] hover:text-[#735839] hover:border-[#8b6f4e]/40 inline-flex items-center justify-center transition-all cursor-pointer shadow-2xs active:scale-95"
                                    title="Open product on website (storefront)"
                                  >
                                    <HiOutlineExternalLink className="w-3.5 h-3.5 stroke-[2]" />
                                  </button>
                                )}
                                <MoveActionButton
                                  onClick={() => handleOpenMoveSingle(p)}
                                  title="Move to another group or create new group"
                                />
                                <EditActionButton
                                  onClick={() => navigate(`/catalog/ornate-products/edit/${p._id}`)}
                                  title="Edit Product"
                                />
                                <DeleteActionButton
                                  onClick={() => handleRemoveProduct(p._id, p.basicInfo?.title)}
                                  title="Remove from Group"
                                />
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
        onSuccess={(result) => {
          const movingIds = moveTargetProducts.length > 0
            ? moveTargetProducts.map((p) => p._id)
            : selectedProductIds.size > 0
            ? Array.from(selectedProductIds)
            : (products || []).map((p) => p._id);
          const totalMemberCount = products?.length || group?.productIds?.length || 0;
          const isDeleted = result?.sourceGroupDeleted || movingIds.length >= totalMemberCount;

          setSelectedProductIds(new Set());
          setMoveTargetProducts([]);
          setMoveInitialMode(null);

          if (isDeleted) {
            // Source group was disbanded / deleted / emptied - cleanly close drawer and refresh parent list
            onClose();
            onRefreshParent?.();
          } else {
            // Group still has remaining products, refresh member list
            fetchGroup();
            onRefreshParent?.();
          }
        }}
      />

      {/* Add Products Picker Modal */}
      <ProductPickerModal
        isOpen={addProductsOpen}
        onClose={() => setAddProductsOpen(false)}
        onApply={handleApplyAddProducts}
        defaultTab="ornate"
        statusFilter="all"
        excludeIds={(products || []).map((p) => String(p._id))}
        title={`Add Products to ${group?.groupName || 'Group'}`}
        subtitle="Search and select products across pages. Selections stay saved when navigating pages."
      />

      {/* Image Preview Modal (Lightbox) */}
      {previewImage &&
        createPortal(
          <div
            className="fixed inset-0 z-[100060] flex items-center justify-center p-3 sm:p-6 bg-stone-950/85 backdrop-blur-md animate-fadeIn select-none"
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
