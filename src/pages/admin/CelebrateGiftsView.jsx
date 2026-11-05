import { createPortal } from "react-dom";
import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  HiOutlinePlus,
  HiOutlineSearch,
  HiOutlineColorSwatch,
  HiOutlineTrash,
  HiOutlineX,
  HiOutlineTag,
  HiOutlinePhotograph,
  HiOutlineCheck,
  HiOutlineArrowUp,
  HiOutlineArrowDown,
  HiOutlineEye,
  HiOutlineGift,
  HiOutlineMenuAlt4,
} from 'react-icons/hi';
import { IoCubeOutline, IoDiamondOutline, IoLayersOutline } from 'react-icons/io5';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import { deleteUploadedFile, formatBytes, uploadWithPresignedUrl } from '../../utils/uploadWithPresignedUrl';
import { getMediaUrl } from '../../utils/imageUrl';
import Pagination from '../../components/common/Pagination';
import usePagination from '../../hooks/usePagination';
import { useConfirm } from '../../contexts/ConfirmContext';
import ModuleHeader from '../../components/common/ModuleHeader';
import StatCards from '../../components/common/StatCards';
import SearchFilterBar from '../../components/common/SearchFilterBar';
import RowActions from '../../components/common/RowActions';
import { useAdminPageSize } from '../../utils/adminPagination';
import { savePendingThemeMedia } from '../../utils/savePendingThemeMedia';
import Dropdown from '../../components/common/Dropdown';
import MenuItemSelect from '../../components/common/MenuItemSelect';
import useCategoryLookup from '../../hooks/useCategoryLookup';
import ProductPickerModal from '../../components/common/ProductPickerModal';
import GalleryMediaPickerModal from '../../components/common/GalleryMediaPickerModal';
import ImageUploadDropzone from '../../components/common/ImageUploadDropzone';
import { useImagePreview } from '../../contexts/ImagePreviewContext';

export default function CelebrateGiftsView() {
  const confirm = useConfirm();
  const { openImagePreview } = useImagePreview();
  const [placementFilter, setPlacementFilter] = useState('Celebrate'); // 'Celebrate' | 'Gifts' | 'all'
  const [search, setSearch] = useState('');
  const [featuredItems, setFeaturedItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState([]);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isReorderModalOpen, setIsReorderModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewingItem, setViewingItem] = useState(null);
  const [editingItem, setEditingItem] = useState(null);

  // Category and Menu Item lookup
  const { categories = [], categoryOptions = [] } = useCategoryLookup();

  // Form State
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [placement, setPlacement] = useState('Celebrate');
  const [platform, setPlatform] = useState('web');
  const [order, setOrder] = useState(0);
  const [categoryId, setCategoryId] = useState('');
  const [menuItemIds, setMenuItemIds] = useState([]);
  const [imageUrl, setImageUrl] = useState('');
  const [themeId, setThemeId] = useState('');
  const [pendingThemeImages, setPendingThemeImages] = useState({});
  const [imagePublicId, setImagePublicId] = useState('');
  const [status, setStatus] = useState('active');
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [isProductPickerOpen, setIsProductPickerOpen] = useState(false);

  // Website Themes State
  const [themes, setThemes] = useState([]);
  const [loadingThemes, setLoadingThemes] = useState(false);
  const imageInputRef = useRef(null);

  // Theme Media Picker Modal State
  const [isMediaPickerOpen, setIsMediaPickerOpen] = useState(false);

  const fetchThemesLookup = async () => {
    try {
      setLoadingThemes(true);
      let res;
      try {
        res = await api.get('/banners/themes/lookup');
      } catch {
        try {
          res = await api.get('/website/themes/lookup');
        } catch {
          res = await api.get('/gallery/themes');
        }
      }
      const items = res.data?.data || [];
      setThemes(Array.isArray(items) ? items : []);
    } catch (err) {
      console.error('Failed to load themes lookup:', err);
    } finally {
      setLoadingThemes(false);
    }
  };

  const handleSelectPickerImage = (item) => {
    const chosenUrl = item.url || item.image?.url;
    const chosenKey = item.key || '';
    if (chosenUrl) {
      setImageUrl(chosenUrl);
      setImagePublicId(chosenKey);
      if (item.themeId && !themeId) {
        setThemeId(item.themeId);
      }
      toast.success('Selected image from gallery');
    }
    setIsMediaPickerOpen(false);
  };

  // Lock body scroll when modal or media picker is open
  useEffect(() => {
    if (isModalOpen || isMediaPickerOpen) {
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prevOverflow;
      };
    }
  }, [isModalOpen, isMediaPickerOpen]);

  useEffect(() => {
    if (isModalOpen) {
      fetchThemesLookup();
    }
  }, [isModalOpen]);

  // Upload state
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  // Reorder state
  const [reorderingItems, setReorderingItems] = useState([]);
  const [savingReorder, setSavingReorder] = useState(false);

  // Format date helper: DD/MM/YYYY
  const formatDate = (dateStr) => {
    if (!dateStr) return '24/03/2026';
    const d = new Date(dateStr);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useAdminPageSize();
  const [serverTotal, setServerTotal] = useState(null);

  // Fetch featured items
  const fetchFeatured = async (page = currentPage, limit = pageSize) => {
    try {
      setLoading(true);
      const res = await api.get(`/featured?page=${page}&limit=${limit}`);
      const items = res.data?.data?.items || res.data?.data || [];
      setFeaturedItems(Array.isArray(items) ? items : []);
      if (res.data?.pagination?.totalDocs !== undefined) {
        setServerTotal(res.data.pagination.totalDocs);
      }
    } catch (err) {
      console.error('Failed to load featured items:', err);
      toast.error('Failed to load showcase items');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeatured(currentPage, pageSize);
  }, [currentPage, pageSize]);

  useEffect(() => {
    fetchFeatured();
  }, []);

  // Filtered featured items (Search query + placement filter, NO active/inactive filter)
  const filteredItems = useMemo(() => {
    return featuredItems.filter((item) => {
      const itemType = (item.display?.type || 'Celebrate').toLowerCase();
      if (
        placementFilter !== 'all' &&
        itemType !== placementFilter.toLowerCase()
      ) {
        return false;
      }
      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          (item.name && item.name.toLowerCase().includes(q)) ||
          itemType.includes(q)
        );
      }
      return true;
    });
  }, [featuredItems, placementFilter, search]);

  const {
    totalItems,
    paginatedItems,
  } = usePagination(filteredItems, pageSize);

  // Quick stat cards
  const activeCount = useMemo(() => featuredItems.filter(i => i.status === 'active').length, [featuredItems]);
  const celebrateCount = useMemo(() => featuredItems.filter(i => (i.display?.type || 'Celebrate') === 'Celebrate').length, [featuredItems]);
  const giftsCount = useMemo(() => featuredItems.filter(i => (i.display?.type || 'Celebrate') === 'Gifts').length, [featuredItems]);

  // Placement Showcase Tabs
  const SHOWCASE_TABS = [
    {
      key: 'Celebrate',
      label: 'Celebrate',
      icon: HiOutlinePhotograph,
      count: celebrateCount,
    },
    {
      key: 'Gifts',
      label: 'Gifts',
      icon: HiOutlineGift,
      count: giftsCount,
    },
    {
      key: 'all',
      label: 'All Showcases',
      icon: IoLayersOutline,
      count: featuredItems.length,
    },
  ];

  const statCardsData = [
    {
      label: 'Celebrate Campaigns',
      value: celebrateCount,
      icon: HiOutlinePhotograph,
      color: 'peach',
      active: placementFilter === 'Celebrate',
      onClick: () => {
        setPlacementFilter('Celebrate');
        setCurrentPage(1);
      },
    },
    {
      label: 'Curated Gifts',
      value: giftsCount,
      icon: HiOutlineGift,
      color: 'gold',
      active: placementFilter === 'Gifts',
      onClick: () => {
        setPlacementFilter('Gifts');
        setCurrentPage(1);
      },
    },
    {
      label: 'Total Showcases',
      value: featuredItems.length,
      icon: IoLayersOutline,
      color: 'bronze',
      active: placementFilter === 'all',
      onClick: () => {
        setPlacementFilter('all');
        setCurrentPage(1);
      },
    },
    {
      label: 'Active Displays',
      value: activeCount,
      icon: HiOutlineCheck,
      color: 'green',
    },
  ];

  // Open Add Modal
  const openAddModal = () => {
    setEditingItem(null);
    setTitle('');
    setSlug('');
    setPlacement(placementFilter === 'Gifts' ? 'Gifts' : 'Celebrate');
    setPlatform('web');
    setOrder(0);
    setCategoryId('');
    setMenuItemIds([]);
    setImageUrl('');
    setThemeId('');
    setPendingThemeImages({});
    setImagePublicId('');
    setStatus('active');
    setSelectedProducts([]);
    fetchThemesLookup();
    setIsModalOpen(true);
  };

  const handleTitleChange = (val) => {
    setTitle(val);
    if (!editingItem) {
      setSlug(
        val
          .toLowerCase()
          .trim()
          .replace(/[\s\W-]+/g, '-')
          .replace(/^-+|-+$/g, '')
      );
    }
  };

  // Open Edit Modal
  const openEditModal = (item) => {
    setEditingItem(item);
    setTitle(item.name || '');
    setSlug(item.slug || '');
    setPlacement(item.display?.type || 'Celebrate');
    setPlatform(item.display?.platform || 'web');
    setOrder(typeof item.display?.order === 'number' ? item.display.order : 0);
    const catId = item.categoryId?._id || item.categoryId || '';
    const mIds = Array.isArray(item.menuItemIds)
      ? item.menuItemIds.map((m) => (typeof m === 'object' && m?._id ? m._id : m))
      : [];
    setCategoryId(catId);
    setMenuItemIds(mIds);
    setImageUrl(item.image?.url || '');
    setThemeId(item.themeId?._id || item.themeId || '');
    setPendingThemeImages({});
    setImagePublicId(item.image?.key || '');
    setStatus(item.status || 'active');
    const loadedProducts = Array.isArray(item.products) && item.products.length > 0
      ? item.products
      : Array.isArray(item.productIds)
      ? item.productIds.map((p) => (typeof p === 'object' ? p : { _id: String(p) }))
      : [];
    setSelectedProducts(loadedProducts);

    // If item has _id, fetch single item to guarantee freshly populated products
    if (item._id) {
      api.get(`/featured/${item._id}`)
        .then((res) => {
          const fresh = res.data?.data;
          if (fresh) {
            const freshProds = Array.isArray(fresh.products) && fresh.products.length > 0
              ? fresh.products
              : Array.isArray(fresh.productIds)
              ? fresh.productIds.map((p) => (typeof p === 'object' ? p : { _id: String(p) }))
              : [];
            if (freshProds.length > 0) {
              setSelectedProducts(freshProds);
            }
          }
        })
        .catch(() => {});
    }

    // If any product only has _id (missing title/sku), enrich from lookup
    const hasStubs = loadedProducts.some(
      (p) => !p.title && !p.basicInfo?.title && !p.name && (p._id || p.id)
    );
    if (hasStubs) {
      api.get('/products/lookup?limit=100')
        .then((res) => {
          const lookupItems = res.data?.data || [];
          const lookupMap = new Map(lookupItems.map((l) => [String(l._id || l.id), l]));
          setSelectedProducts((prev) =>
            prev.map((p) => {
              const matched = lookupMap.get(String(p._id || p.id || p.productId));
              return matched
                ? {
                    ...matched,
                    ...p,
                    title: matched.title || p.title || p.basicInfo?.title,
                    sku: matched.sku || p.sku || p.basicInfo?.sku,
                    basicInfo: matched.basicInfo || p.basicInfo,
                    thumbnail: matched.thumbnail || p.thumbnail,
                    price: matched.price || p.price,
                  }
                : p;
            })
          );
        })
        .catch(() => {});
    }

    fetchThemesLookup();
    setIsModalOpen(true);
  };

  // Open View Modal
  const openViewModal = (item) => {
    setViewingItem(item);
    setIsViewModalOpen(true);
  };

  // Image upload handler with support for file drop and input ref
  const handleImageFile = async (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file (JPG, PNG, WebP)');
      return;
    }

    const localPreview = URL.createObjectURL(file);
    setImageUrl(localPreview);

    try {
      setUploading(true);
      setUploadProgress(0);
      const res = await uploadWithPresignedUrl(file, 'featured', setUploadProgress);
      setImageUrl(res.fileUrl);
      setImagePublicId(res.key || '');
      toast.success(`Cover image uploaded · ${formatBytes(res.originalSize)} → ${formatBytes(res.compressedSize)}${res.wasCompressed ? ' compressed' : ''}`);
    } catch (err) {
      console.error('Upload error:', err);
      toast.error('Failed to upload image');
    } finally {
      setUploading(false);
      if (imageInputRef.current) imageInputRef.current.value = '';
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) handleImageFile(file);
  };

  const handleRemoveImage = async () => {
    try {
      await deleteUploadedFile({ key: imagePublicId, url: imageUrl });
      setImageUrl('');
      setImagePublicId('');
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Could not delete image from storage');
    }
  };

  // Save / Update Group
  const handleSaveGroup = async (e) => {
    e.preventDefault();
    const selectedCat = (categories || []).find((c) => String(c._id) === String(categoryId));
    const effectiveTitle = title.trim() || selectedCat?.name || '';

    try {
      setSubmitting(true);
      const effectivePlacement = placement || (placementFilter !== 'all' ? placementFilter : 'Celebrate');
      const payload = {
        themeId: themeId || null,
        name: effectiveTitle,
        slug: slug.trim() || undefined,
        display: {
          type: effectivePlacement,
          platform: platform || 'web',
          order: Number(order) || 0,
        },
        categoryId: categoryId || null,
        menuItemIds: Array.isArray(menuItemIds) ? menuItemIds : [],
        image: imageUrl ? {
          url: imageUrl,
          key: imagePublicId || '',
        } : null,
        status,
        productIds: selectedProducts.map((p) => String(p._id || p.id || p.productId || p)),
      };

      let saveResponse;
      if (editingItem?._id) {
        saveResponse = await api.put(`/featured/${editingItem._id}`, payload);
        toast.success('Campaign group updated successfully');
      } else {
        saveResponse = await api.post('/featured', payload);
        if (saveResponse.data?.data) setEditingItem(saveResponse.data.data);
        toast.success('Campaign group created successfully');
      }
      const savedId = saveResponse.data?.data?._id || editingItem?._id;
      if (savedId && Object.keys(pendingThemeImages).length) {
        await savePendingThemeMedia(themeId, 'featured', savedId, pendingThemeImages);
      }
      setPendingThemeImages({});

      setIsModalOpen(false);
      await fetchFeatured();
    } catch (err) {
      console.error('Failed to save group:', err);
      toast.error(err.response?.data?.message || 'Failed to save campaign group');
    } finally {
      setSubmitting(false);
    }
  };

  // Delete Group
  const handleDelete = async (id) => {
    const isConfirmed = await confirm({
      title: 'Delete Campaign Group',
      message: 'Are you sure you want to delete this campaign group? This action cannot be undone.',
      confirmText: 'Delete Group',
      cancelText: 'Cancel',
      type: 'danger',
    });
    if (!isConfirmed) {
      return;
    }
    try {
      await api.delete(`/featured/${id}`);
      toast.success('Campaign group deleted');
      setSelectedIds((prev) => prev.filter((i) => i !== id));
      await fetchFeatured();
    } catch (err) {
      console.error('Delete error:', err);
      toast.error('Failed to delete campaign group');
    }
  };

  // Selection handlers
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(paginatedItems.map((i) => i._id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectItem = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  // Bulk delete
  const handleBulkDelete = async () => {
    const count = selectedIds.length;
    if (count === 0) {
      toast.error('Please select showcase items to delete');
      return;
    }

    const isConfirmed = await confirm({
      title: 'Delete Selected Showcase Items',
      message: `Are you sure you want to delete ${count} selected item${count > 1 ? 's' : ''}? This action cannot be undone.`,
      confirmText: `Delete (${count})`,
      cancelText: 'Cancel',
      type: 'danger',
    });
    if (!isConfirmed) return;

    try {
      await Promise.allSettled(
        selectedIds.map((id) => api.delete(`/featured/${id}`))
      );
      setSelectedIds([]);
      await fetchFeatured();
      toast.success(`${count} item${count > 1 ? 's' : ''} deleted successfully`);
    } catch (err) {
      toast.error('Failed to delete some items');
    }
  };

  // Open Reorder Modal
  const openReorderModal = () => {
    const listToReorder = placementFilter !== 'all'
      ? featuredItems.filter(
          (i) => (i.display?.type || '').toLowerCase() === placementFilter.toLowerCase()
        )
      : [...featuredItems];
    setReorderingItems(listToReorder);
    setIsReorderModalOpen(true);
  };

  // Move item in reorder
  const moveReorderItem = (index, direction) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= reorderingItems.length) return;
    const newItems = [...reorderingItems];
    const [moved] = newItems.splice(index, 1);
    newItems.splice(targetIndex, 0, moved);
    setReorderingItems(newItems);
  };

  // Save Reorder
  const handleSaveReorder = async () => {
    try {
      setSavingReorder(true);
      const payload = reorderingItems.map((item, index) => ({
        _id: item._id,
        display: {
          ...(item.display || {}),
          order: index,
        },
      }));
      await api.put('/featured/reorder', { items: payload });
      toast.success('Order saved successfully');
      setIsReorderModalOpen(false);
      await fetchFeatured();
    } catch (err) {
      console.error('Reorder error:', err);
      toast.error('Failed to save order');
    } finally {
      setSavingReorder(false);
    }
  };

  return (
    <div className="space-y-2">
      {/* ─── Breadcrumb & Header Row ─── */}
      <ModuleHeader
        breadcrumbs={['Home', 'Marketing', 'Celebrate & Gifts']}
        title="Celebrate & Gifts"
        subtitle="Configure promotional product showcases, seasonal gift curations and storefront groupings."
        onAdd={openAddModal}
        addLabel={
          placementFilter === 'Celebrate'
            ? 'Add Celebrate Showcase'
            : placementFilter === 'Gifts'
            ? 'Add Gift Showcase'
            : 'Add Showcase'
        }
        exportData={filteredItems}
        exportFileName={`celebrate_gifts_${placementFilter.toLowerCase()}_export`}
      />

      {/* ─── 4 Stat Cards Row ─── */}
      <StatCards cards={statCardsData} />

      {/* ─── Showcase Table Card with Dedicated Tabs ─── */}
      <div className="bg-white rounded-xl border border-stone-200/90 shadow-2xs overflow-hidden">
        {/* ─── Prominent Placement Tabs Header (Celebrate & Gifts) ─── */}
        <div className="border-b border-stone-200 bg-[#fbfaf8] px-4 sm:px-6 pt-2.5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 sm:gap-6 -mb-px overflow-x-auto">
            {SHOWCASE_TABS.map((tab) => {
              const isActive = placementFilter === tab.key;
              const Icon = tab.icon;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => {
                    setPlacementFilter(tab.key);
                    setCurrentPage(1);
                    setSelectedIds([]);
                  }}
                  className={`flex items-center gap-2 pb-3 pt-1.5 text-xs sm:text-sm font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                    isActive
                      ? 'border-[#8b6f4e] text-stone-900 font-bold'
                      : 'border-transparent text-stone-500 hover:text-stone-800 hover:border-stone-300'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-[#8b6f4e]' : 'text-stone-400'}`} />
                  <span>{tab.label}</span>
                  <span
                    className={`text-[11px] font-bold px-2 py-0.5 rounded-full transition-colors ${
                      isActive
                        ? 'bg-[#8b6f4e] text-white shadow-2xs'
                        : 'bg-stone-200/80 text-stone-600'
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2 pb-2.5">
            <button
              type="button"
              onClick={openReorderModal}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-[#8b6f4e] bg-[#fbf7f0] hover:bg-[#f3ebd9] border border-[#e5d7c3] transition-all cursor-pointer shadow-2xs active:scale-95"
              title="Reorder showcases"
            >
              <HiOutlineMenuAlt4 className="w-3.5 h-3.5 stroke-2" />
              <span>Reorder {placementFilter !== 'all' ? placementFilter : ''}</span>
            </button>
          </div>
        </div>

        {/* Top Search & Actions Toolbar */}
        <div className="p-3.5 sm:p-4 border-b border-stone-200/80 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 bg-white">
          <div className="flex-1 w-full sm:max-w-md">
            <div className="relative">
              <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={`Search ${placementFilter !== 'all' ? placementFilter : 'all'} showcases by name...`}
                className="w-full pl-9 pr-8 py-2 text-xs rounded-lg bg-[#fbfaf8] hover:bg-white focus:bg-white border border-stone-200 text-stone-800 placeholder-stone-400 focus:outline-none focus:border-[#8b6f4e] focus:ring-1 focus:ring-[#8b6f4e]/30 transition-all shadow-2xs"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 cursor-pointer"
                  title="Clear search"
                >
                  <HiOutlineX className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between sm:justify-end gap-2">
            {/* Delete button if selected */}
            {selectedIds.length > 0 && (
              <button
                type="button"
                onClick={handleBulkDelete}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border shadow-2xs cursor-pointer bg-[#fef2f2] text-[#ef4444] border-[#fee2e2] hover:bg-[#fee2e2] hover:border-[#fca5a5] active:scale-95 ring-1 ring-red-200/50"
                title={`Delete ${selectedIds.length} selected item${selectedIds.length > 1 ? 's' : ''}`}
              >
                <HiOutlineTrash className="w-3.5 h-3.5 stroke-2" />
                <span>Delete ({selectedIds.length})</span>
              </button>
            )}

            <span className="text-xs text-stone-500 font-medium">
              Showing <strong>{filteredItems.length}</strong> {placementFilter !== 'all' ? placementFilter : ''} showcase{filteredItems.length === 1 ? '' : 's'}
            </span>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-stone-200 bg-[#eef2f6] text-[11px] font-bold text-stone-700 uppercase tracking-wider">
                <th className="py-3 pl-4 pr-1 w-8">
                  <input
                    type="checkbox"
                    checked={
                      paginatedItems.length > 0 &&
                      paginatedItems.every((i) => selectedIds.includes(i._id))
                    }
                    onChange={handleSelectAll}
                    className="w-3.5 h-3.5 rounded border-stone-300 text-[#8b6f4e] focus:ring-[#8b6f4e]/30 cursor-pointer"
                  />
                </th>
                <th className="py-3 px-2 text-center w-12 whitespace-nowrap">SR NO</th>
                <th className="py-3 px-3 whitespace-nowrap">COVER</th>
                <th className="py-3 px-3 whitespace-nowrap">SHOWCASE NAME</th>
                <th className="py-3 px-3 whitespace-nowrap">PLACEMENT</th>
                <th className="py-3 px-3 whitespace-nowrap">PRODUCTS</th>
                <th className="py-3 px-3 whitespace-nowrap">CREATED DATE</th>
                <th className="py-3 pr-4 pl-2 whitespace-nowrap text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-xs text-stone-700">
              {loading ? (
                <tr>
                  <td colSpan="8" className="py-8 text-center text-stone-400">
                    Loading showcase items...
                  </td>
                </tr>
              ) : filteredItems.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-8 text-center text-stone-400">
                    No showcase items found.
                  </td>
                </tr>
              ) : (
                paginatedItems.map((item, idx) => (
                  <tr
                    key={item._id}
                    onClick={() => openViewModal(item)}
                    className="hover:bg-[#faf7f2] transition-colors cursor-pointer group"
                  >
                    <td className="py-2.5 pl-4 pr-1" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(item._id)}
                        onChange={() => handleSelectItem(item._id)}
                        className="w-3.5 h-3.5 rounded border-stone-300 text-[#8b6f4e] focus:ring-[#8b6f4e]/30 cursor-pointer"
                      />
                    </td>

                    {/* Sr No */}
                    <td className="py-2.5 px-2 text-center text-xs font-semibold text-stone-500 whitespace-nowrap">
                      {(currentPage - 1) * pageSize + idx + 1}
                    </td>

                    {/* Cover Preview */}
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          if (item.image?.url) {
                            openImagePreview(getMediaUrl(item.image.url), {
                              title: `${item.name || item.categoryId?.name || 'Campaign'} Cover Image`,
                            });
                          } else {
                            openViewModal(item);
                          }
                        }}
                        className="w-11 h-8 rounded-md overflow-hidden bg-stone-100 border border-stone-200/80 cursor-pointer hover:border-[var(--theme-primary,#8b6f4e)] hover:scale-105 flex items-center justify-center shadow-2xs transition-all group"
                        title={item.image?.url ? 'Click to view full image preview' : 'No image'}
                      >
                        {item.image?.url ? (
                          <img
                            src={getMediaUrl(item.image.url)}
                            alt={item.name}
                            className="w-full h-full object-cover group-hover:opacity-95"
                          />
                        ) : (
                          <HiOutlinePhotograph className="w-4 h-4 text-stone-400" />
                        )}
                      </div>
                    </td>

                    {/* Showcase Name */}
                    <td className="py-2.5 px-3 font-bold text-stone-900 text-xs max-w-xs">
                      <div className="truncate">{item.name || item.categoryId?.name || 'Untitled Group'}</div>
                      {item.slug && (
                        <div className="text-[10px] text-stone-400 font-mono truncate">/{item.slug}</div>
                      )}
                      {(item.categoryId?.name || (Array.isArray(item.menuItemIds) && item.menuItemIds.length > 0)) && (
                        <div className="text-[10.5px] text-stone-400 font-normal truncate mt-0.5 flex items-center gap-1.5">
                          {item.categoryId?.name && (
                            <span className="text-[#8f6d43] font-medium">{item.categoryId.name}</span>
                          )}
                          {item.categoryId?.name && item.menuItemIds?.length > 0 && <span>•</span>}
                          {item.menuItemIds?.length > 0 && (
                            <span>{item.menuItemIds.length} Menu item{item.menuItemIds.length === 1 ? '' : 's'}</span>
                          )}
                        </div>
                      )}
                    </td>

                    {/* Placement / Display */}
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#faf5ee] text-[#8f6d43] border border-[#e8d9c2]">
                          {item.display?.type || 'Celebrate'}
                        </span>
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-stone-100 text-stone-600 border border-stone-200 uppercase">
                          {item.display?.platform || item.platform || 'web'}
                        </span>
                      </div>
                    </td>

                    {/* Curated Products Count */}
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-stone-100 text-stone-700">
                        <IoCubeOutline className="w-3 h-3 text-stone-500" />
                        <span>{item.productCount || item.productIds?.length || item.products?.length || 0} Products</span>
                      </span>
                    </td>

                    {/* Created Date */}
                    <td className="py-2.5 px-3 whitespace-nowrap text-stone-500 font-medium text-xs">
                      {formatDate(item.meta?.createdAt)}
                    </td>

                    {/* Actions */}
                    <td className="py-2.5 pr-4 pl-2 whitespace-nowrap text-right">
                      <RowActions
                        record={item}
                        onView={() => openViewModal(item)}
                        onEdit={() => openEditModal(item)}
                        onDelete={() => handleDelete(item._id)}
                        viewTitle="View Showcase"
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Luxury Common Pagination */}
        <Pagination
          currentPage={currentPage}
          totalItems={serverTotal ?? totalItems}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={(newSize) => {
            setPageSize(newSize);
            setCurrentPage(1);
          }}
        />
      </div>

      {/* ─── Add / Edit Group Modal (Exact Match to Screenshot 2) ─── */}
      {isModalOpen && (
        createPortal(<div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl lg:max-w-4xl overflow-hidden border border-stone-200 animate-in fade-in zoom-in duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 pt-6 pb-2">
              <div>
                <h3 className="text-xl font-bold text-stone-900">
                  {editingItem ? 'Edit Group' : 'Add Group'}
                </h3>
                <p className="text-[10px] font-bold tracking-widest text-[#8f6d43] uppercase mt-0.5">
                  CAMPAIGN GROUPING
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full border border-stone-200 flex items-center justify-center text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
              >
                <HiOutlineX className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveGroup} className="p-6 sm:p-7 space-y-4 max-h-[85vh] overflow-y-auto">
              {/* GROUP TITLE, SLUG & SHOWCASE STATUS */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                {/* GROUP TITLE */}
                <div className="sm:col-span-2">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-[11px] font-bold tracking-wider text-stone-500 uppercase">
                      GROUP TITLE
                    </label>
                    <span className="text-[10px] font-medium text-stone-400">Unique</span>
                  </div>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    placeholder="e.g. Wedding Bestsellers"
                    className="w-full px-4 py-2.5 rounded-xl border border-stone-200 text-sm text-stone-800 placeholder-stone-400 focus:outline-hidden focus:border-[#8f6d43] transition-colors"
                  />
                </div>

                {/* URL SLUG */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-[11px] font-bold tracking-wider text-stone-500 uppercase">
                      URL SLUG
                    </label>
                    <span className="text-[10px] font-medium text-stone-400">Unique</span>
                  </div>
                  <input
                    type="text"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[\s\W-]+/g, '-'))}
                    placeholder="e.g. wedding-bestsellers"
                    className="w-full px-3 py-2.5 rounded-xl border border-stone-200 text-xs font-mono text-stone-800 placeholder-stone-400 focus:outline-hidden focus:border-[#8f6d43] transition-colors"
                  />
                </div>

                {/* SHOWCASE STATUS */}
                <div>
                  <label className="block text-[11px] font-bold tracking-wider text-stone-500 uppercase mb-1.5">
                    SHOWCASE STATUS
                  </label>
                  <div className="flex items-center gap-2.5 h-[42px] px-3.5 rounded-xl border border-stone-200 bg-stone-50/60">
                    <button
                      type="button"
                      role="switch"
                      aria-checked={status === 'active'}
                      onClick={() => setStatus(status === 'active' ? 'inactive' : 'active')}
                      style={status === 'active' ? { backgroundColor: 'var(--theme-primary, #855836)' } : undefined}
                      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus:outline-hidden cursor-pointer ${
                        status === 'active' ? 'bg-[var(--theme-primary,#855836)]' : 'bg-stone-300'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          status === 'active' ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                    <span className="text-xs font-semibold text-stone-700 select-none">
                      {status === 'active' ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              </div>

              {/* DISPLAY CONFIG: BANNER TYPE, PLATFORM & ORDER */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* BANNER TYPE */}
                <div>
                  <label className="block text-[11px] font-bold tracking-wider text-stone-500 uppercase mb-1.5">
                    BANNER TYPE *
                  </label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {['Celebrate', 'Gifts'].map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setPlacement(opt)}
                        className={`py-2 px-2 rounded-xl border text-xs font-semibold tracking-wide transition-all cursor-pointer text-center ${
                          placement === opt
                            ? 'bg-[#8f6d43] border-[#8f6d43] text-white shadow-xs'
                            : 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>

                {/* PLATFORM */}
                <div>
                  <label className="block text-[11px] font-bold tracking-wider text-stone-500 uppercase mb-1.5">
                    PLATFORM
                  </label>
                  <div className="grid grid-cols-3 gap-1">
                    {[
                      { key: 'web', label: 'Web' },
                      { key: 'mobile', label: 'Mobile' },
                      { key: 'common', label: 'All' },
                    ].map((opt) => (
                      <button
                        key={opt.key}
                        type="button"
                        onClick={() => setPlatform(opt.key)}
                        className={`py-2 px-1 rounded-xl border text-[11px] font-semibold tracking-wide transition-all cursor-pointer text-center ${
                          platform === opt.key
                            ? 'bg-[#8f6d43] border-[#8f6d43] text-white shadow-xs'
                            : 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* DISPLAY ORDER */}
                <div>
                  <label className="block text-[11px] font-bold tracking-wider text-stone-500 uppercase mb-1.5">
                    DISPLAY ORDER
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={order}
                    onChange={(e) => setOrder(parseInt(e.target.value, 10) || 0)}
                    placeholder="0"
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs text-stone-800 placeholder-stone-400 focus:outline-hidden focus:border-[#8f6d43] transition-colors"
                  />
                </div>
              </div>

              {/* CATEGORY & MENU ITEM LIST (OPTIONAL) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-0.5">
                {/* CATEGORY DROPDOWN */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-[11px] font-bold tracking-wider text-stone-500 uppercase">
                      CATEGORY
                    </label>
                    <span className="text-[10px] text-stone-400 font-medium">Optional</span>
                  </div>
                  <Dropdown
                    size="field"
                    variant="input"
                    value={categoryId}
                    onChange={(val) => {
                      if (val !== categoryId) {
                        setMenuItemIds([]);
                      }
                      setCategoryId(val);
                    }}
                    placeholder="Select Category (Optional)"
                    options={[
                      { value: '', label: 'None (No Category)' },
                      ...categoryOptions,
                    ]}
                    className="w-full"
                  />
                </div>

                {/* MENU ITEM LIST DROPDOWN */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-[11px] font-bold tracking-wider text-stone-500 uppercase">
                      MENU ITEM LIST
                    </label>
                    <span className="text-[10px] text-stone-400 font-medium">Optional</span>
                  </div>
                  <MenuItemSelect
                    key={categoryId || 'all'}
                    categoryId={categoryId}
                    value={menuItemIds}
                    onChange={setMenuItemIds}
                    placeholder="Select Menu Items (Optional)"
                  />
                </div>
              </div>

              {/* WEBSITE THEME & MEDIA */}
              <div className="bg-[#fcfbf9] rounded-2xl border border-stone-200/80 p-4 sm:p-5 space-y-4">
                {/* Top: Website Theme Selector & Direct View in Gallery Action */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 pb-3 border-b border-stone-200/70">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 text-stone-900">
                      <HiOutlineColorSwatch className="w-4 h-4 text-[var(--theme-primary,#8a6d4b)]" />
                      <h3 className="text-xs font-bold uppercase tracking-wider">
                        Website Theme & Media
                      </h3>
                    </div>
                    <p className="text-[11px] text-stone-500 mt-0.5">
                      Select a website theme for this campaign or browse available media in gallery.
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <div className="w-48 sm:w-56">
                      <Dropdown
                        value={themeId}
                        onChange={(val) => setThemeId(val)}
                        options={[
                          { value: '', label: 'All Website Themes' },
                          ...themes.map((t) => ({
                            value: t._id,
                            label: `${t.name}${t.status === 'active' ? ' · Active' : ''}`,
                          })),
                        ]}
                        buttonClassName="w-full h-9 px-3 rounded-xl border border-stone-200 text-xs text-stone-800 bg-white shadow-2xs hover:border-[var(--theme-primary,#8b6f4e)]"
                        menuClassName="z-30"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => setIsMediaPickerOpen(true)}
                      className="inline-flex items-center gap-1.5 px-3.5 h-9 rounded-xl border border-[var(--theme-primary,#8a6d4b)]/40 bg-white hover:bg-[#faf6f0] text-xs font-semibold text-[var(--theme-primary,#8a6d4b)] hover:text-[#785b3a] shadow-2xs transition-colors cursor-pointer whitespace-nowrap shrink-0"
                    >
                      <HiOutlinePhotograph className="w-3.5 h-3.5" />
                      <span>View in Gallery</span>
                    </button>
                  </div>
                </div>

                {/* Cover Image Box */}
                <ImageUploadDropzone
                  label="Cover Image"
                  value={imageUrl}
                  alt="Cover Preview"
                  uploading={uploading}
                  uploadProgress={uploadProgress}
                  onFileSelect={handleImageFile}
                  onChooseGallery={() => setIsMediaPickerOpen(true)}
                  onRemove={handleRemoveImage}
                />
              </div>

              {/* SELECT PRODUCTS SECTION */}
              <div className="space-y-3 pt-2 border-t border-stone-200/70">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <IoDiamondOutline className="w-4 h-4 text-[var(--theme-primary,#8a6d4b)]" />
                      <h3 className="text-xs font-bold uppercase tracking-wider text-stone-900">
                        Campaign Products ({selectedProducts.length} Selected)
                      </h3>
                    </div>
                    <p className="text-[11px] text-stone-500 mt-0.5">
                      {selectedProducts.length > 0
                        ? 'Manage or pick additional products to feature in this campaign.'
                        : 'Open the product catalog popup to select products for this group.'}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsProductPickerOpen(true)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-white shadow-2xs transition-all cursor-pointer self-start sm:self-auto hover:opacity-90"
                    style={{ backgroundColor: 'var(--theme-primary, #8a6d4b)' }}
                  >
                    <HiOutlinePlus className="w-4 h-4" />
                    <span>Browse & Select Products</span>
                  </button>
                </div>

                {/* Selected Products Area: Empty State vs Cards Grid */}
                {selectedProducts.length === 0 ? (
                  <div className="border-2 border-dashed border-stone-200 rounded-2xl p-6 sm:p-8 text-center bg-stone-50/40">
                    <div className="w-10 h-10 rounded-full bg-[#f6efe6] text-[#8a6d4b] flex items-center justify-center mx-auto mb-2 shadow-2xs">
                      <IoLayersOutline className="w-5 h-5" />
                    </div>
                    <h4 className="text-xs font-bold text-stone-800 mb-0.5">
                      No products added to this group yet
                    </h4>
                    <p className="text-[11px] text-stone-500 max-w-sm mx-auto mb-3">
                      Click below to open the catalog popup, search pieces, and select items.
                    </p>
                    <button
                      type="button"
                      onClick={() => setIsProductPickerOpen(true)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white shadow-2xs transition-all cursor-pointer hover:opacity-90"
                      style={{ backgroundColor: 'var(--theme-primary, #8a6d4b)' }}
                    >
                      <HiOutlinePlus className="w-4 h-4" />
                      <span>Browse & Select Products</span>
                    </button>
                  </div>
                ) : (
                  <div className="border border-stone-200 rounded-2xl p-3 bg-stone-50/50">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 max-h-60 overflow-y-auto pr-1 scrollbar-thin">
                      {selectedProducts.map((prod, idx) => {
                        const key = prod._id || prod.id || prod.productId || idx;
                        const thumb =
                          (typeof prod.thumbnail === 'string' ? prod.thumbnail : prod.thumbnail?.url) ||
                          prod.image?.url ||
                          (typeof prod.image === 'string' ? prod.image : '') ||
                          prod.colorImages?.[0]?.images?.[0]?.url ||
                          prod.images?.[0]?.url ||
                          '';
                        const pTitle =
                          prod.title ||
                          prod.basicInfo?.title ||
                          prod.name ||
                          'Untitled Jewelry';
                        const sku =
                          prod.sku ||
                          prod.basicInfo?.sku ||
                          prod.ornate?.tagNo ||
                          prod.ornate?.itemCode ||
                          '';
                        const price = Number(
                          prod.price ||
                          prod.salePrice ||
                          prod.pricing?.salePrice ||
                          prod.pricing?.sellingPrice ||
                          0
                        );

                        return (
                          <div
                            key={key}
                            className="flex items-center gap-2.5 p-2 bg-white rounded-xl border border-stone-200 shadow-2xs group relative hover:border-[var(--theme-primary,#8a6d4b)] transition-colors"
                          >
                            <div className="w-10 h-10 rounded-lg bg-stone-50 border border-stone-100 flex items-center justify-center p-0.5 shrink-0 overflow-hidden">
                              {thumb ? (
                                <img src={thumb} alt={pTitle} className="w-full h-full object-contain" />
                              ) : (
                                <IoDiamondOutline className="w-4 h-4 text-stone-400" />
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <h5 className="text-[11px] font-semibold text-stone-800 truncate" title={pTitle}>
                                {pTitle}
                              </h5>
                              <div className="flex items-center gap-2 text-[10px] text-stone-500 mt-0.5">
                                {sku && (
                                  <span className="font-mono text-stone-600 bg-stone-100 px-1.5 py-0.5 rounded text-[9.5px] font-medium truncate">
                                    SKU: {sku}
                                  </span>
                                )}
                                {price > 0 && (
                                  <span className="font-bold text-stone-900">₹{price.toLocaleString('en-IN')}</span>
                                )}
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() =>
                                setSelectedProducts((prev) =>
                                  prev.filter((p) => String(p._id || p.id || p.productId) !== String(key))
                                )
                              }
                              className="w-6 h-6 rounded-lg text-stone-400 hover:text-red-600 hover:bg-red-50 flex items-center justify-center transition-colors cursor-pointer shrink-0"
                              title="Remove product"
                            >
                              <HiOutlineX className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>


              {/* Modal Footer (Exact Match to Screenshot 2) */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-2.5 rounded-xl text-xs font-semibold text-stone-600 hover:bg-stone-100 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || uploading}
                  className="px-7 py-2.5 rounded-xl text-xs font-bold text-white bg-[#8f6d43] hover:bg-[#7b5e39] shadow-sm transition-colors cursor-pointer disabled:opacity-50 tracking-wider uppercase"
                >
                  {submitting
                    ? 'Saving...'
                    : editingItem
                    ? 'Save Changes'
                    : 'Create Group'}
                </button>
              </div>
            </form>
          </div>
        </div>, document.body)
      )}

      {/* ─── Reorder Modal ─── */}
      {isReorderModalOpen && (
        createPortal(<div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs"
          onClick={() => setIsReorderModalOpen(false)}
        >
          <div
            className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-stone-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100">
              <div>
                <h3 className="text-base font-bold text-stone-900">
                  Reorder {placementFilter === 'all' ? '' : `${placementFilter} `}Showcases
                </h3>
                <p className="text-[11px] text-stone-500 mt-0.5">
                  Showing {reorderingItems.length} {placementFilter !== 'all' ? placementFilter.toLowerCase() : ''} showcase{reorderingItems.length === 1 ? '' : 's'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsReorderModalOpen(false)}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-700"
              >
                <HiOutlineX className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 max-h-[60vh] overflow-y-auto space-y-2">
              {reorderingItems.map((item, idx) => (
                <div
                  key={item._id}
                  className="flex items-center justify-between p-3 rounded-xl border border-stone-200 bg-stone-50"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-6 text-center text-xs font-bold text-stone-400 shrink-0">
                      {idx + 1}
                    </span>
                    <span className="text-xs font-bold text-stone-800 truncate">
                      {item.name}
                    </span>
                    {placementFilter === 'all' && (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold uppercase tracking-wider bg-stone-200/60 text-stone-600 shrink-0">
                        {item.display?.type || 'Celebrate'}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => moveReorderItem(idx, -1)}
                      className="p-1.5 rounded-lg hover:bg-stone-200 text-stone-600 disabled:opacity-30"
                    >
                      <HiOutlineArrowUp className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      disabled={idx === reorderingItems.length - 1}
                      onClick={() => moveReorderItem(idx, 1)}
                      className="p-1.5 rounded-lg hover:bg-stone-200 text-stone-600 disabled:opacity-30"
                    >
                      <HiOutlineArrowDown className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-stone-100 bg-[#faf8f5]">
              <button
                type="button"
                onClick={() => setIsReorderModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveReorder}
                disabled={savingReorder}
                className="px-5 py-2 text-xs font-bold text-white bg-[#8f6d43] hover:bg-[#7b5e39] rounded-xl uppercase tracking-wider"
              >
                {savingReorder ? 'Saving...' : 'Save Order'}
              </button>
            </div>
          </div>
        </div>, document.body)
      )}

      {/* ─── View Modal ─── */}
      {isViewModalOpen && viewingItem && (
        createPortal(<div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs"
          onClick={() => setIsViewModalOpen(false)}
        >
          <div
            className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-stone-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative aspect-[16/9] w-full bg-stone-100 overflow-hidden flex items-center justify-center">
              {viewingItem.image?.url ? (
                <div
                  onClick={() => openImagePreview(getMediaUrl(viewingItem.image.url), { title: `${viewingItem.name || 'Campaign'} Cover Image` })}
                  className="w-full h-full cursor-pointer group relative"
                  title="Click to zoom in"
                >
                  <img
                    src={getMediaUrl(viewingItem.image.url)}
                    alt={viewingItem.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white gap-1.5 text-xs font-semibold">
                    <HiOutlineEye className="w-4 h-4" />
                    <span>Click to view full preview</span>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center text-stone-400">
                  <HiOutlinePhotograph className="w-12 h-12 stroke-1 mb-1" />
                  <span className="text-xs">No cover image uploaded</span>
                </div>
              )}
              <button
                type="button"
                onClick={() => setIsViewModalOpen(false)}
                className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 backdrop-blur-xs flex items-center justify-center text-stone-700 hover:bg-white"
              >
                <HiOutlineX className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-bold text-stone-900">
                  {viewingItem.name}
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 border border-emerald-200">
                  {viewingItem.status}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-stone-500 mb-4">
                <span>Banner Type: <strong>{viewingItem.display?.type || 'Celebrate'}</strong></span>
                <span>Platform: <strong className="uppercase">{viewingItem.display?.platform || 'web'}</strong></span>
                <span>Order: <strong>{typeof viewingItem.display?.order === 'number' ? viewingItem.display.order : 0}</strong></span>
                {viewingItem.categoryId?.name && (
                  <span>Category: <strong className="text-[#8f6d43]">{viewingItem.categoryId.name}</strong></span>
                )}
                {Array.isArray(viewingItem.menuItemIds) && viewingItem.menuItemIds.length > 0 && (
                  <span>Menu Items: <strong>{viewingItem.menuItemIds.map((m) => m?.title || m?.name || m).join(', ')}</strong></span>
                )}
                <span>Products: <strong>{viewingItem.productCount || viewingItem.productIds?.length || viewingItem.products?.length || 0}</strong></span>
                <span>Created: <strong>{formatDate(viewingItem.meta?.createdAt)}</strong></span>
              </div>
              <div className="flex justify-end pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsViewModalOpen(false);
                    openEditModal(viewingItem);
                  }}
                  className="px-5 py-2 text-xs font-bold text-white bg-[#8f6d43] hover:bg-[#7b5e39] rounded-xl uppercase tracking-wider"
                >
                  Edit Group
                </button>
              </div>
            </div>
          </div>
        </div>, document.body)
      )}
      {/* ─── COMMON GALLERY MEDIA PICKER MODAL ─── */}
      <GalleryMediaPickerModal
        isOpen={isMediaPickerOpen}
        onClose={() => setIsMediaPickerOpen(false)}
        onSelect={handleSelectPickerImage}
        currentSelectedUrl={imageUrl}
        initialTheme={themeId || 'all'}
        initialPlacement={(placement || 'celebrate').toLowerCase()}
        themes={themes}
        title="Gallery Media Picker"
        subtitle={`Select a cover image for ${placement || 'Celebrate & Gifts'} campaign.`}
      />
      {/* ─── COMMON PRODUCT PICKER MODAL POPUP ─── */}
      <ProductPickerModal
        isOpen={isProductPickerOpen}
        onClose={() => setIsProductPickerOpen(false)}
        onApply={(newList) => {
          setSelectedProducts(newList);
          toast.success(`${newList.length} product${newList.length === 1 ? '' : 's'} selected`);
        }}
        initialSelected={selectedProducts}
        title={`Select Products for ${title || 'Campaign Group'}`}
        subtitle="Search and select products across pages. Selections stay saved when navigating pages."
      />
    </div>
  );
}
