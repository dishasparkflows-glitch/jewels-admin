import ThemeImageField from '../../components/common/ThemeImageField';
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  HiOutlinePlus,
  HiOutlinePencil,
  HiOutlineTrash,
  HiOutlineEye,
  HiOutlineX,
  HiOutlineSearch,
  HiOutlineTag,
  HiOutlinePhotograph,
  HiOutlineUpload,
  HiOutlineCheck,
  HiOutlineArrowUp,
  HiOutlineArrowDown,
  HiOutlineFilter,
} from 'react-icons/hi';
import { IoCubeOutline } from 'react-icons/io5';
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

export default function CelebrateGiftsView() {
  const confirm = useConfirm();
  const [placementFilter, setPlacementFilter] = useState('all'); // 'all' | 'Celebrate' | 'Gifts'
  const [search, setSearch] = useState('');
  const [featuredItems, setFeaturedItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState([]);

  // Available products for modal selection (lookup API)
  const [allProducts, setAllProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [productPage, setProductPage] = useState(1);
  const [productPageSize, setProductPageSize] = useState(10);
  const [productPagination, setProductPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalDocs: 0,
    limit: 10,
    hasNextPage: false,
    hasPrevPage: false,
  });

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
  const [placement, setPlacement] = useState('Celebrate');
  const [categoryId, setCategoryId] = useState('');
  const [menuItemIds, setMenuItemIds] = useState([]);
  const [imageUrl, setImageUrl] = useState('');
  const [themeId, setThemeId] = useState('');
  const [pendingThemeImages, setPendingThemeImages] = useState({});
  const [imagePublicId, setImagePublicId] = useState('');
  const [status, setStatus] = useState('active');
  const [selectedProductIds, setSelectedProductIds] = useState([]);
  const [productSearch, setProductSearch] = useState('');
  const [productFilterType, setProductFilterType] = useState('all');

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

  // Fetch products using lightweight lookup API with pagination & filtering
  const fetchProducts = useCallback(async (page = 1, searchQuery = '', filterType = 'all') => {
    try {
      setLoadingProducts(true);
      const params = new URLSearchParams();
      params.append('page', String(page));
      params.append('limit', '10');
      if (searchQuery.trim()) {
        params.append('search', searchQuery.trim());
      }
      if (filterType && filterType !== 'all') {
        params.append('productType', filterType);
      }

      const res = await api.get(`/products/lookup?${params.toString()}`);
      const items = res.data?.data || res.data?.data?.items || [];
      const pagination = res.data?.pagination || {
        currentPage: page,
        totalPages: 1,
        totalDocs: Array.isArray(items) ? items.length : 0,
        limit: 10,
        hasNextPage: false,
        hasPrevPage: false,
      };

      setAllProducts(Array.isArray(items) ? items : []);
      setProductPagination(pagination);
      setProductPage(page);
    } catch (err) {
      console.error('Failed to load products for picker:', err);
    } finally {
      setLoadingProducts(false);
    }
  }, []);

  useEffect(() => {
    fetchFeatured();
  }, []);

  // Debounced search / filter for product lookup inside modal
  useEffect(() => {
    if (!isModalOpen) return;
    const timer = setTimeout(() => {
      fetchProducts(1, productSearch, productFilterType, productPageSize);
    }, 250);
    return () => clearTimeout(timer);
  }, [isModalOpen, productSearch, productFilterType, productPageSize, fetchProducts]);

  // Filtered featured items (Search query + placement filter, NO active/inactive filter)
  const filteredItems = useMemo(() => {
    return featuredItems.filter((item) => {
      if (placementFilter !== 'all' && item.placement !== placementFilter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          (item.name && item.name.toLowerCase().includes(q)) ||
          (item.placement && item.placement.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [featuredItems, placementFilter, search]);

  const {
    totalItems,
    paginatedItems,
  } = usePagination(filteredItems, pageSize, serverTotal);

  // Quick stat cards
  const activeCount = useMemo(() => featuredItems.filter(i => i.status === 'active').length, [featuredItems]);
  const celebrateCount = useMemo(() => featuredItems.filter(i => i.placement === 'Celebrate').length, [featuredItems]);
  const giftsCount = useMemo(() => featuredItems.filter(i => i.placement === 'Gifts').length, [featuredItems]);

  const statCardsData = [
    {
      label: 'Total Showcases',
      value: featuredItems.length,
      icon: IoCubeOutline,
      color: 'bronze',
    },
    {
      label: 'Active Displays',
      value: activeCount,
      icon: HiOutlineCheck,
      color: 'green',
    },
    {
      label: 'Celebrate Campaigns',
      value: celebrateCount,
      icon: HiOutlinePhotograph,
      color: 'peach',
    },
    {
      label: 'Curated Gifts',
      value: giftsCount,
      icon: HiOutlineTag,
      color: 'gold',
    },
  ];

  // Products inside modal (filtered by backend lookup)
  const filteredProducts = allProducts;

  // Open Add Modal
  const openAddModal = () => {
    setEditingItem(null);
    setTitle('');
    setPlacement(placementFilter === 'Gifts' ? 'Gifts' : 'Celebrate');
    setCategoryId('');
    setMenuItemIds([]);
    setImageUrl('');
    setThemeId('');
    setPendingThemeImages({});
    setImagePublicId('');
    setStatus('active');
    setSelectedProductIds([]);
    setProductSearch('');
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const openEditModal = (item) => {
    setEditingItem(item);
    setTitle(item.name || '');
    setPlacement(item.placement || 'Celebrate');
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
    setSelectedProductIds(item.productIds || []);
    setProductSearch('');
    setIsModalOpen(true);
  };

  // Open View Modal
  const openViewModal = (item) => {
    setViewingItem(item);
    setIsViewModalOpen(true);
  };

  // Toggle product selection
  const toggleProduct = (productId) => {
    setSelectedProductIds((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId]
    );
  };

  // Image upload handler
  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Instant local preview while uploading
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
      e.target.value = '';
    }
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
      const payload = {
        themeId: themeId || null,
        name: effectiveTitle,
        placement: placement || (placementFilter !== 'all' ? placementFilter : 'Celebrate'),
        categoryId: categoryId || null,
        menuItemIds: Array.isArray(menuItemIds) ? menuItemIds : [],
        image: imageUrl ? {
          url: imageUrl,
          key: imagePublicId || '',
        } : null,
        status,
        products: selectedProductIds,
        productIds: selectedProductIds,
        productCount: selectedProductIds.length,
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
    setReorderingItems([...featuredItems]);
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
        id: item._id,
        order: index,
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
        addLabel="Add Showcase"
        exportData={featuredItems}
        exportFileName="celebrate_gifts_export"
      />

      {/* ─── 4 Stat Cards Row ─── */}
      <StatCards cards={statCardsData} />

      {/* ─── Search & Filter Bar (NO active/deactive filter) ─── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
        <div className="flex-1">
          <SearchFilterBar
            search={search}
            onSearchChange={setSearch}
            placeholder="Search showcases by name or placement..."
            extraActions={
              <button
                type="button"
                onClick={handleBulkDelete}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition-all border shadow-2xs cursor-pointer ${
                  selectedIds.length > 0
                    ? 'bg-[#fef2f2] text-[#ef4444] border-[#fee2e2] hover:bg-[#fee2e2] hover:border-[#fca5a5] active:scale-95 ring-1 ring-red-200/50'
                    : 'bg-white text-stone-400 border-stone-200/90 hover:text-stone-600 hover:bg-stone-50'
                }`}
                title={
                  selectedIds.length > 0
                    ? `Delete ${selectedIds.length} selected item${selectedIds.length > 1 ? 's' : ''}`
                    : 'Select items to delete'
                }
              >
                <HiOutlineTrash className="w-3.5 h-3.5 stroke-2" />
                <span>{selectedIds.length > 0 ? `Delete (${selectedIds.length})` : 'Delete'}</span>
              </button>
            }
          />
        </div>

        {/* Placement Filter Pills (Celebrate vs Gifts, NOT active/deactive) */}
        <div className="flex items-center gap-1 p-0.5 bg-stone-100 rounded-lg border border-stone-200/80 self-start sm:self-auto">
          {['all', 'Celebrate', 'Gifts'].map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setPlacementFilter(tab)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold uppercase tracking-wider transition-all cursor-pointer ${
                placementFilter === tab
                  ? 'bg-white text-stone-900 shadow-2xs'
                  : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              {tab === 'all' ? 'All' : tab}
            </button>
          ))}
          <button
            type="button"
            onClick={openReorderModal}
            className="px-2.5 py-1 rounded-md text-[11px] font-semibold uppercase tracking-wider text-[#8f6d43] hover:bg-[#faf5ee] transition-all cursor-pointer ml-0.5"
          >
            Reorder
          </button>
        </div>
      </div>

      {/* ─── Showcase Table Card ─── */}
      <div className="bg-white rounded-lg border border-stone-200/90 shadow-2xs overflow-hidden">
        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-stone-200/80 bg-white text-[10px] font-bold text-stone-500 uppercase tracking-wider">
                <th className="py-2 pl-4 pr-1 w-8">
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
                <th className="py-2 px-2 text-center w-12 whitespace-nowrap text-[10px] font-bold text-stone-500 uppercase tracking-wider">SR NO</th>
                <th className="py-2 px-3 whitespace-nowrap">COVER</th>
                <th className="py-2 px-3 whitespace-nowrap">SHOWCASE NAME</th>
                <th className="py-2 px-3 whitespace-nowrap">PLACEMENT</th>
                <th className="py-2 px-3 whitespace-nowrap">PRODUCTS</th>
                <th className="py-2 px-3 whitespace-nowrap">CREATED DATE</th>
                <th className="py-2 pr-4 pl-2 whitespace-nowrap text-right">ACTIONS</th>
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
                        onClick={() => openViewModal(item)}
                        className="w-11 h-8 rounded-md overflow-hidden bg-stone-100 border border-stone-200/80 cursor-pointer hover:opacity-90 flex items-center justify-center shadow-2xs"
                      >
                        {item.image?.url ? (
                          <img
                            src={getMediaUrl(item.image.url)}
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <HiOutlinePhotograph className="w-4 h-4 text-stone-400" />
                        )}
                      </div>
                    </td>

                    {/* Showcase Name */}
                    <td className="py-2.5 px-3 font-bold text-stone-900 text-xs max-w-xs">
                      <div className="truncate">{item.name || item.categoryId?.name || 'Untitled Group'}</div>
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

                    {/* Placement */}
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#faf5ee] text-[#8f6d43] border border-[#e8d9c2]">
                        {item.placement || 'Celebrate'}
                      </span>
                    </td>

                    {/* Curated Products Count */}
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-stone-100 text-stone-700">
                        <IoCubeOutline className="w-3 h-3 text-stone-500" />
                        <span>{item.productCount || 0} Products</span>
                      </span>
                    </td>

                    {/* Created Date */}
                    <td className="py-2.5 px-3 whitespace-nowrap text-stone-500 font-medium text-xs">
                      {formatDate(item.meta?.createdAt)}
                    </td>

                    {/* Actions */}
                    <td className="py-2.5 pr-4 pl-2 whitespace-nowrap text-right">
                      <RowActions
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
        <div
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
              {/* GROUP TITLE */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-[11px] font-bold tracking-wider text-stone-500 uppercase">
                    GROUP TITLE
                  </label>
                  <span className="text-[10px] font-medium text-stone-400">Optional</span>
                </div>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Wedding Bestsellers"
                  className="w-full px-4 py-2.5 rounded-xl border border-stone-200 text-sm text-stone-800 placeholder-stone-400 focus:outline-hidden focus:border-[#8f6d43] transition-colors"
                />
              </div>

              {/* PLACEMENT */}
              <div>
                <label className="block text-[11px] font-bold tracking-wider text-stone-500 uppercase mb-1.5">
                  PLACEMENT
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {['Celebrate', 'Gifts'].map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setPlacement(opt)}
                      className={`py-2 px-3 rounded-xl border text-xs font-semibold tracking-wide transition-all cursor-pointer ${
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

              {/* COVER IMAGE */}
              <div>
                <label className="block text-[11px] font-bold tracking-wider text-stone-500 uppercase mb-1.5">
                  COVER IMAGE
                </label>
                <ThemeImageField key={editingItem?._id || 'new'} module="featured" recordId={editingItem?._id} selectedThemeId={themeId} onThemeChange={(value) => { setThemeId(value); setPendingThemeImages({}); }} onPendingChange={(slot, image) => setPendingThemeImages((current) => ({ ...current, [slot]: image }))} slots={[{ key: 'image', label: 'Cover image', url: imageUrl }]}>
                <div className="relative border-2 border-dashed border-stone-200 hover:border-stone-400 rounded-2xl p-4 flex flex-col items-center justify-center bg-[#fafafa] hover:bg-stone-50/50 transition-colors min-h-[140px] cursor-pointer">
                  {imageUrl ? (
                    <div className="relative w-full h-32 rounded-xl overflow-hidden group">
                      <img
                        src={getMediaUrl(imageUrl)}
                        alt="Cover Preview"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-stone-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <label className="px-3 py-1.5 bg-white text-stone-800 rounded-lg text-xs font-semibold cursor-pointer shadow-sm">
                          Change Image
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="hidden"
                          />
                        </label>
                        <button
                          type="button"
                          onClick={handleRemoveImage}
                          className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-semibold shadow-sm"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ) : (
                    <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer">
                      <HiOutlinePhotograph className="w-8 h-8 text-stone-300 mb-1.5" />
                      <span className="text-[11px] font-bold tracking-wider text-stone-400 uppercase">
                        {uploading ? `UPLOADING (${uploadProgress}%)` : 'SELECT VISUAL'}
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                        disabled={uploading}
                      />
                    </label>
                  )}
                </div>
                </ThemeImageField>
              </div>

              {/* SELECT PRODUCTS (X SELECTED) */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[11px] font-bold tracking-wider text-stone-500 uppercase">
                    SELECT PRODUCTS ({selectedProductIds.length} SELECTED)
                  </label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() =>
                        setProductFilterType((prev) =>
                          prev === 'all' ? 'jewelry' : prev === 'jewelry' ? 'ornate' : 'all'
                        )
                      }
                      className="inline-flex items-center gap-1 text-[11px] font-bold tracking-wider text-stone-500 uppercase hover:text-stone-800"
                    >
                      <HiOutlineFilter className="w-3.5 h-3.5" />
                      <span>FILTER: {productFilterType}</span>
                    </button>
                  </div>
                </div>

                {/* Product Search Input */}
                <div className="relative mb-2">
                  <HiOutlineSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                  <input
                    type="text"
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    placeholder="Search products by title or SKU..."
                    className="w-full pl-9 pr-4 py-2 rounded-xl border border-stone-200 text-xs text-stone-800 placeholder-stone-400 focus:outline-hidden focus:border-[#8f6d43]"
                  />
                </div>

                {/* Product List */}
                <div className="border border-stone-200 rounded-xl max-h-72 sm:max-h-80 overflow-y-auto divide-y divide-stone-100 bg-white">
                  {loadingProducts ? (
                    <div className="py-8 flex flex-col items-center justify-center text-stone-400 gap-2">
                      <div className="w-5 h-5 border-2 border-stone-300 border-t-[#8f6d43] rounded-full animate-spin" />
                      <span className="text-[11px] font-bold tracking-wider uppercase text-stone-400">
                        LOADING PRODUCTS...
                      </span>
                    </div>
                  ) : filteredProducts.length === 0 ? (
                    <div className="py-6 text-center text-xs text-stone-400">
                      No matching products found
                    </div>
                  ) : (
                    filteredProducts.map((p) => {
                      const isSelected = selectedProductIds.includes(p._id);
                      const thumb =
                        p.thumbnail ||
                        p.image ||
                        p.firstPhoto ||
                        p.colorImages?.[0]?.firstPhoto ||
                        p.colorImages?.[0]?.images?.[0]?.url ||
                        null;

                      const title = p.title || p.basicInfo?.title || 'Untitled Product';
                      const sku = p.sku || p.basicInfo?.sku || p.ornate?.tagNo || p.ornate?.itemCode || 'N/A';
                      const price = Number(p.price || p.pricing?.salePrice || p.pricing?.mrp || p.cataloguePrice || 0);
                      const categoryName = Array.isArray(p.category) && p.category[0]?.name ? p.category[0].name : '';

                      return (
                        <div
                          key={p._id}
                          onClick={() => toggleProduct(p._id)}
                          className={`flex items-center gap-3 px-3 py-2 hover:bg-stone-50 cursor-pointer transition-colors ${
                            isSelected ? 'bg-[#faf5ee]/60' : ''
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}}
                            className="w-4 h-4 rounded text-[#8f6d43] border-stone-300 focus:ring-0 cursor-pointer"
                          />
                          <div className="w-8 h-8 rounded-lg bg-stone-100 border border-stone-200 overflow-hidden shrink-0 flex items-center justify-center">
                            {thumb ? (
                              <img
                                src={getMediaUrl(thumb)}
                                alt={title}
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                  e.currentTarget.nextElementSibling?.classList.remove('hidden');
                                }}
                                className="w-full h-full object-cover"
                              />
                            ) : null}
                            <IoCubeOutline className={`w-4 h-4 text-stone-400 ${thumb ? 'hidden' : ''}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-stone-800 truncate" title={title}>
                              {title}
                            </p>
                            <p className="text-[10px] text-stone-400 font-mono truncate">
                              {categoryName ? (
                                <span className="text-stone-500 font-sans mr-1">{categoryName} •</span>
                              ) : null}
                              SKU: {sku} • ₹{price > 0 ? price.toLocaleString('en-IN') : '0'}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Common Luxury Pagination */}
                <Pagination
                  currentPage={productPage}
                  totalItems={productPagination.totalDocs || allProducts.length}
                  pageSize={productPageSize}
                  pageSizeOptions={[10, 25, 50, 100]}
                  onPageChange={(newPage) => {
                    fetchProducts(newPage, productSearch, productFilterType, productPageSize);
                  }}
                  onPageSizeChange={(newSize) => {
                    setProductPageSize(newSize);
                    fetchProducts(1, productSearch, productFilterType, newSize);
                  }}
                  itemLabel="products"
                  className="rounded-xl border border-stone-200/80 mt-2 bg-stone-50/50"
                />
              </div>

              {/* Status Select */}
              <div className="flex items-center justify-between pt-2">
                <span className="text-xs font-bold text-stone-700 uppercase tracking-wide">
                  Showcase Status
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setStatus(status === 'active' ? 'inactive' : 'active')}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-hidden cursor-pointer ${
                      status === 'active' ? 'bg-[#8f6d43]' : 'bg-stone-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        status === 'active' ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                  <span className="text-xs font-semibold text-stone-700 w-16">
                    {status === 'active' ? 'Active' : 'Inactive'}
                  </span>
                </div>
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
        </div>
      )}

      {/* ─── Reorder Modal ─── */}
      {isReorderModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs"
          onClick={() => setIsReorderModalOpen(false)}
        >
          <div
            className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-stone-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100">
              <h3 className="text-base font-bold text-stone-900">
                Reorder {placementFilter === 'all' ? '' : `${placementFilter} `}Showcases
              </h3>
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
                  <div className="flex items-center gap-3">
                    <span className="w-6 text-center text-xs font-bold text-stone-400">
                      {idx + 1}
                    </span>
                    <span className="text-xs font-bold text-stone-800">
                      {item.name}
                    </span>
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
        </div>
      )}

      {/* ─── View Modal ─── */}
      {isViewModalOpen && viewingItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs"
          onClick={() => setIsViewModalOpen(false)}
        >
          <div
            className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-stone-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative aspect-[16/9] w-full bg-stone-100 overflow-hidden flex items-center justify-center">
              {viewingItem.image?.url ? (
                <img
                  src={getMediaUrl(viewingItem.image.url)}
                  alt={viewingItem.name}
                  className="w-full h-full object-cover"
                />
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
                <span>Placement: <strong>{viewingItem.placement}</strong></span>
                {viewingItem.categoryId?.name && (
                  <span>Category: <strong className="text-[#8f6d43]">{viewingItem.categoryId.name}</strong></span>
                )}
                {Array.isArray(viewingItem.menuItemIds) && viewingItem.menuItemIds.length > 0 && (
                  <span>Menu Items: <strong>{viewingItem.menuItemIds.map((m) => m?.title || m?.name || m).join(', ')}</strong></span>
                )}
                <span>Products: <strong>{viewingItem.productCount || 0}</strong></span>
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
        </div>
      )}
    </div>
  );
}
