import React, { useState, useEffect, useMemo } from 'react';
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
import { uploadWithPresignedUrl } from '../../utils/uploadWithPresignedUrl';
import Pagination from '../../components/common/Pagination';
import usePagination from '../../hooks/usePagination';
import { useConfirm } from '../../contexts/ConfirmContext';

export default function CelebrateGiftsView() {
  const confirm = useConfirm();
  const [activeTab, setActiveTab] = useState('Celebrate'); // 'Celebrate' | 'Gifts'
  const [featuredItems, setFeaturedItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const {
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    totalItems,
    paginatedItems,
  } = usePagination(featuredItems, 6);

  // Available products for modal selection
  const [allProducts, setAllProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isReorderModalOpen, setIsReorderModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewingItem, setViewingItem] = useState(null);
  const [editingItem, setEditingItem] = useState(null);

  // Form State
  const [title, setTitle] = useState('');
  const [imageUrl, setImageUrl] = useState('');
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

  // Fetch featured items
  const fetchFeatured = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/featured?placement=${activeTab}&limit=100`);
      const items = res.data?.data?.items || res.data?.data || [];
      setFeaturedItems(Array.isArray(items) ? items : []);
    } catch (err) {
      console.error('Failed to load featured items:', err);
      toast.error('Failed to load showcase items');
    } finally {
      setLoading(false);
    }
  };

  // Fetch all products for modal picker
  const fetchProducts = async () => {
    try {
      setLoadingProducts(true);
      const res = await api.get('/products?limit=200');
      const items = res.data?.data?.items || res.data?.data || [];
      setAllProducts(Array.isArray(items) ? items : []);
    } catch (err) {
      console.error('Failed to load products for picker:', err);
    } finally {
      setLoadingProducts(false);
    }
  };

  useEffect(() => {
    fetchFeatured();
  }, [activeTab]);

  useEffect(() => {
    fetchProducts();
  }, []);

  // Filtered products inside modal
  const filteredProducts = useMemo(() => {
    return allProducts.filter((p) => {
      const matchesSearch =
        !productSearch.trim() ||
        p.title?.toLowerCase().includes(productSearch.toLowerCase()) ||
        p.sku?.toLowerCase().includes(productSearch.toLowerCase());
      const matchesType =
        productFilterType === 'all' ||
        p.productType?.toLowerCase() === productFilterType.toLowerCase();
      return matchesSearch && matchesType;
    });
  }, [allProducts, productSearch, productFilterType]);

  // Open Add Modal
  const openAddModal = () => {
    setEditingItem(null);
    setTitle('');
    setImageUrl('');
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
    setImageUrl(item.image?.url || '');
    setImagePublicId(item.image?.public_id || '');
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
    try {
      setUploading(true);
      setUploadProgress(0);
      const res = await uploadWithPresignedUrl(file, 'featured', setUploadProgress);
      setImageUrl(res.fileUrl);
      setImagePublicId(res.key || file.name);
      toast.success('Cover image uploaded');
    } catch (err) {
      console.error('Upload error:', err);
      toast.error('Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  // Save / Update Group
  const handleSaveGroup = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error('Please enter a group title');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        name: title.trim(),
        placement: activeTab,
        image: {
          url: imageUrl || '/featured/necklace.jpg',
          public_id: imagePublicId || `feat_${Date.now()}`,
        },
        status,
        products: selectedProductIds,
        productCount: selectedProductIds.length,
      };

      if (editingItem?._id) {
        await api.put(`/featured/${editingItem._id}`, payload);
        toast.success('Campaign group updated successfully');
      } else {
        await api.post('/featured', payload);
        toast.success('Campaign group created successfully');
      }

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
      await fetchFeatured();
    } catch (err) {
      console.error('Delete error:', err);
      toast.error('Failed to delete campaign group');
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
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1400px] mx-auto">
      {/* ─── Page Header (Exact Match to Screenshot 1) ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-[28px] font-bold text-stone-900 tracking-tight">
            Celebrate and Gifts Section
          </h1>
          <p className="text-sm text-stone-500 mt-1">
            Configure promotional product showcases for your storefront.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={openReorderModal}
            className="px-4 py-2 bg-white border border-stone-200 hover:bg-stone-50 text-stone-700 text-xs font-bold tracking-wider rounded-xl transition-colors uppercase shadow-2xs cursor-pointer"
          >
            REORDER
          </button>
          <button
            type="button"
            onClick={openAddModal}
            className="px-4 py-2 bg-[#8f6d43] hover:bg-[#7b5e39] text-white text-xs font-bold tracking-wider rounded-xl transition-colors shadow-2xs uppercase flex items-center gap-1.5 cursor-pointer"
          >
            <HiOutlinePlus className="w-4 h-4 stroke-[2.5]" />
            <span>ADD FEATURED</span>
          </button>
        </div>
      </div>

      {/* ─── Tabs (Exact Match to Screenshot 1) ─── */}
      <div className="flex items-center gap-8 border-b border-stone-200/80 mb-6">
        <button
          type="button"
          onClick={() => setActiveTab('Celebrate')}
          className={`pb-3 text-xs font-bold tracking-wider uppercase transition-colors relative cursor-pointer ${
            activeTab === 'Celebrate'
              ? 'text-[#8f6d43] border-b-2 border-[#8f6d43]'
              : 'text-stone-400 hover:text-stone-600'
          }`}
        >
          CELEBRATE SECTION
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('Gifts')}
          className={`pb-3 text-xs font-bold tracking-wider uppercase transition-colors relative cursor-pointer ${
            activeTab === 'Gifts'
              ? 'text-[#8f6d43] border-b-2 border-[#8f6d43]'
              : 'text-stone-400 hover:text-stone-600'
          }`}
        >
          GIFTS SECTION
        </button>
      </div>

      {/* ─── Cards Grid (Exact Match to Screenshot 1) ─── */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="bg-white rounded-[20px] border border-stone-200 p-4 animate-pulse h-72"
            >
              <div className="w-full h-44 bg-stone-100 rounded-xl mb-4" />
              <div className="w-1/2 h-4 bg-stone-100 rounded mb-2" />
              <div className="w-1/3 h-3 bg-stone-100 rounded" />
            </div>
          ))}
        </div>
      ) : featuredItems.length === 0 ? (
        <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center max-w-lg mx-auto">
          <IoCubeOutline className="w-12 h-12 text-stone-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-stone-800">
            No showcases in {activeTab} section yet
          </h3>
          <p className="text-xs text-stone-500 mt-1 mb-5">
            Create promotional groupings like &quot;Wedding Bestsellers&quot; or curated gifts for your storefront.
          </p>
          <button
            type="button"
            onClick={openAddModal}
            className="px-4 py-2 bg-[#8f6d43] hover:bg-[#7b5e39] text-white text-xs font-bold tracking-wider rounded-xl uppercase transition-colors"
          >
            + ADD FEATURED GROUP
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {paginatedItems.map((item) => (
              <div
                key={item._id}
                className="bg-white rounded-[20px] border border-stone-200/80 overflow-hidden shadow-xs hover:shadow-md transition-all group flex flex-col justify-between"
              >
                {/* Banner Image Container */}
                <div className="relative aspect-[16/9] w-full overflow-hidden bg-stone-100">
                  <img
                    src={item.image?.url || '/featured/necklace.jpg'}
                    alt={item.name}
                    className="w-full h-full object-cover object-center group-hover:scale-[1.02] transition-transform duration-300"
                  />

                  {/* Top-Left ACTIVE Badge (Matches Screenshot: white pill) */}
                  <div className="absolute top-3.5 left-3.5">
                    <span className="bg-white/90 backdrop-blur-xs px-2.5 py-1 rounded-md text-[10px] font-bold tracking-wider text-stone-700 shadow-2xs uppercase">
                      {item.status === 'active' ? 'ACTIVE' : 'INACTIVE'}
                    </span>
                  </div>

                  {/* Top-Right Action Buttons: Eye, Pencil, Trash in glassmorphic/white pills */}
                  <div className="absolute top-3.5 right-3.5 flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => openViewModal(item)}
                      className="w-7 h-7 rounded-lg bg-white/90 hover:bg-white text-stone-600 hover:text-stone-900 shadow-2xs flex items-center justify-center transition-colors cursor-pointer"
                      title="View Details"
                    >
                      <HiOutlineEye className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => openEditModal(item)}
                      className="w-7 h-7 rounded-lg bg-white/90 hover:bg-white text-stone-600 hover:text-stone-900 shadow-2xs flex items-center justify-center transition-colors cursor-pointer"
                      title="Edit Group"
                    >
                      <HiOutlinePencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(item._id)}
                      className="w-7 h-7 rounded-lg bg-white/90 hover:bg-red-50 text-stone-600 hover:text-red-600 shadow-2xs flex items-center justify-center transition-colors cursor-pointer"
                      title="Delete Group"
                    >
                      <HiOutlineTrash className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Bottom-Left PRODUCTS Count Badge (Matches Screenshot: ⬡ 54 PRODUCTS) */}
                  <div className="absolute bottom-3.5 left-3.5">
                    <div className="bg-white/90 backdrop-blur-xs text-stone-700 text-[10px] font-bold tracking-wider px-2.5 py-1 rounded-full shadow-2xs flex items-center gap-1.5 uppercase">
                      <IoCubeOutline className="w-3 h-3 text-stone-500" />
                      <span>{item.productCount || 0} PRODUCTS</span>
                    </div>
                  </div>
                </div>

                {/* Info Section */}
                <div className="p-4 sm:p-5">
                  <h3 className="font-bold text-stone-900 text-sm tracking-tight mb-1">
                    {item.name}
                  </h3>
                  <div className="flex items-center justify-between text-[10px] font-semibold text-stone-400 tracking-wider uppercase">
                    <div className="flex items-center gap-1">
                      <HiOutlineTag className="w-3 h-3 text-stone-400" />
                      <span>{item.placement?.toUpperCase() || activeTab.toUpperCase()}</span>
                    </div>
                    <span>CREATED {formatDate(item.meta?.createdAt)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Luxury Common Pagination */}
          <div className="bg-white rounded-2xl border border-stone-200/90 shadow-xs overflow-hidden">
            <Pagination
              currentPage={currentPage}
              totalItems={totalItems}
              pageSize={pageSize}
              pageSizeOptions={[6, 9, 12, 24]}
              onPageChange={setCurrentPage}
              onPageSizeChange={setPageSize}
            />
          </div>
        </>
      )}

      {/* ─── Add / Edit Group Modal (Exact Match to Screenshot 2) ─── */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="bg-white rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden border border-stone-200 animate-in fade-in zoom-in duration-200"
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
            <form onSubmit={handleSaveGroup} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              {/* GROUP TITLE */}
              <div>
                <label className="block text-[11px] font-bold tracking-wider text-stone-500 uppercase mb-1.5">
                  GROUP TITLE
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Wedding Bestsellers"
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-stone-200 text-sm text-stone-800 placeholder-stone-400 focus:outline-hidden focus:border-[#8f6d43] transition-colors"
                />
              </div>

              {/* COVER IMAGE */}
              <div>
                <label className="block text-[11px] font-bold tracking-wider text-stone-500 uppercase mb-1.5">
                  COVER IMAGE
                </label>
                <div className="relative border-2 border-dashed border-stone-200 hover:border-stone-400 rounded-2xl p-4 flex flex-col items-center justify-center bg-[#fafafa] hover:bg-stone-50/50 transition-colors min-h-[140px] cursor-pointer">
                  {imageUrl ? (
                    <div className="relative w-full h-32 rounded-xl overflow-hidden group">
                      <img
                        src={imageUrl}
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
                          onClick={() => setImageUrl('')}
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
                <div className="border border-stone-200 rounded-xl max-h-52 overflow-y-auto divide-y divide-stone-100 bg-white">
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
                        p.images?.[0]?.url ||
                        p.images?.[0] ||
                        p.colorImages?.[0]?.images?.[0]?.url ||
                        null;

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
                          <div className="w-8 h-8 rounded-lg bg-stone-100 border border-stone-200 overflow-hidden flex-shrink-0 flex items-center justify-center">
                            {thumb ? (
                              <img
                                src={thumb}
                                alt={p.title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <IoCubeOutline className="w-4 h-4 text-stone-400" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-stone-800 truncate">
                              {p.title}
                            </p>
                            <p className="text-[10px] text-stone-400 font-mono">
                              SKU: {p.sku || 'N/A'} • ₹{p.price?.toLocaleString?.('en-IN') || p.price}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
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
                Reorder {activeTab} Showcases
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
            <div className="relative aspect-[16/9] w-full bg-stone-100 overflow-hidden">
              <img
                src={viewingItem.image?.url || '/featured/necklace.jpg'}
                alt={viewingItem.name}
                className="w-full h-full object-cover"
              />
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
              <div className="flex items-center gap-4 text-xs text-stone-500 mb-4">
                <span>Placement: <strong>{viewingItem.placement}</strong></span>
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
