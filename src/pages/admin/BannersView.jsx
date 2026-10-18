import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  HiOutlinePlus,
  HiOutlinePencil,
  HiOutlineTrash,
  HiOutlineX,
  HiOutlineUpload,
  HiOutlinePhotograph,
  HiOutlineDeviceMobile,
  HiOutlineViewGrid,
  HiOutlineCalendar,
  HiOutlineSparkles,
  HiOutlineChevronDown,
  HiOutlineExternalLink,
  HiOutlineFilm,
  HiOutlineSearch,
  HiOutlineTag,
  HiOutlineGift,
  HiOutlineClock,
} from 'react-icons/hi';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import { uploadWithPresignedUrl } from '../../utils/uploadWithPresignedUrl';
import Pagination from '../../components/common/Pagination';
import usePagination from '../../hooks/usePagination';
import { useConfirm } from '../../contexts/ConfirmContext';
import useCategoryLookup from '../../hooks/useCategoryLookup';
import Dropdown from '../../components/common/Dropdown';
import { useAdminPageSize } from '../../utils/adminPagination';

const getMediaUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  const backendBase = (import.meta.env.VITE_API_URL || 'http://localhost:5001/api').replace(/\/api\/?$/, '');
  return `${backendBase}${url.startsWith('/') ? '' : '/'}${url}`;
};

const formatForInput = (dateStr) => {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  } catch {
    return '';
  }
};

const SECTION_TYPE_CONFIG = {
  herobanner: {
    label: 'Hero Banner',
    badgeClass: 'bg-[#fff2e8] text-[#d46b08] border border-[#ffd591]/50',
    icon: HiOutlinePhotograph,
  },
  collectionbanner: {
    label: 'Collection Banner',
    badgeClass: 'bg-[#e6f4ff] text-[#0958d9] border border-[#91caff]/50',
    icon: HiOutlineViewGrid,
  },
  categorybanner: {
    label: 'Category Banner',
    badgeClass: 'bg-[#e6f7f0] text-[#047857] border border-[#a7f3d0]/60',
    icon: HiOutlineTag,
  },
  offerbanner: {
    label: 'Offer Banner',
    badgeClass: 'bg-[#fff1f2] text-[#e11d48] border border-[#fecdd3]/60',
    icon: HiOutlineGift,
  },
  mobileappbanner: {
    label: 'App Banner',
    badgeClass: 'bg-[#e6f7ed] text-[#137333] border border-[#a8dab5]/50',
    icon: HiOutlineDeviceMobile,
  },
  bookappointbanner: {
    label: 'Appointment Banner',
    badgeClass: 'bg-[#f0ebf8] text-[#5e35b1] border border-[#d3bdf0]/50',
    icon: HiOutlineCalendar,
  },
  websitebanner: {
    label: 'Other Section',
    badgeClass: 'bg-[#f5f5f5] text-[#595959] border border-stone-200/60',
    icon: HiOutlineSparkles,
  },
};

const SECTION_TYPE_OPTIONS = [
  { value: 'herobanner', label: 'Hero Banner', icon: HiOutlinePhotograph },
  { value: 'collectionbanner', label: 'Collection Banner', icon: HiOutlineViewGrid },
  { value: 'categorybanner', label: 'Category Banner', icon: HiOutlineTag },
  { value: 'offerbanner', label: 'Offer Banner', icon: HiOutlineGift },
  { value: 'mobileappbanner', label: 'App Banner', icon: HiOutlineDeviceMobile },
  { value: 'bookappointbanner', label: 'Appointment Banner', icon: HiOutlineCalendar },
  { value: 'websitebanner', label: 'Other Section', icon: HiOutlineSparkles },
];

const TABS = [
  { key: 'all', label: 'All Sections' },
  { key: 'herobanner', label: 'Hero Banner' },
  { key: 'collectionbanner', label: 'Collection Banner' },
  { key: 'categorybanner', label: 'Category Banner' },
  { key: 'offerbanner', label: 'Offer Banner' },
  { key: 'mobileappbanner', label: 'App Banner' },
  { key: 'bookappointbanner', label: 'Appointment Banner' },
  { key: 'websitebanner', label: 'Other' },
];

export default function BannersView() {
  const confirm = useConfirm();
  const { categories } = useCategoryLookup();

  // Data states
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);

  // Drawer state
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Form states matching screenshot
  const [formType, setFormType] = useState('herobanner');
  const [isTypeDropdownOpen, setIsTypeDropdownOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [mediaType, setMediaType] = useState('image');
  const [destinationLink, setDestinationLink] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [status, setStatus] = useState('active');
  const [order, setOrder] = useState(1);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Upload state
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useAdminPageSize();
  const [serverTotal, setServerTotal] = useState(null);

  // Fetch banners
  const fetchData = async (page = currentPage, limit = pageSize) => {
    try {
      setLoading(true);
      const res = await api.get(`/banners?page=${page}&limit=${limit}`);
      const items = res.data?.data?.items || (Array.isArray(res.data?.data) ? res.data.data : []);
      setBanners(items);
      if (res.data?.pagination?.totalDocs !== undefined) {
        setServerTotal(res.data.pagination.totalDocs);
      }
    } catch (err) {
      console.error('Failed to load banners:', err);
      toast.error('Failed to load sections and banners');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(currentPage, pageSize);
  }, [currentPage, pageSize]);

  // Counts for tabs
  const tabCounts = useMemo(() => {
    const counts = {
      all: banners.length,
      herobanner: 0,
      collectionbanner: 0,
      categorybanner: 0,
      offerbanner: 0,
      mobileappbanner: 0,
      bookappointbanner: 0,
      websitebanner: 0,
    };
    banners.forEach((b) => {
      const type = (b.display?.type || 'herobanner').toLowerCase();
      if (counts[type] !== undefined) {
        counts[type] += 1;
      } else {
        counts.websitebanner += 1;
      }
    });
    return counts;
  }, [banners]);

  // Filtered banners
  const filteredBanners = useMemo(() => {
    let list = [...banners];

    if (activeTab !== 'all') {
      list = list.filter((b) => {
        const type = (b.display?.type || 'herobanner').toLowerCase();
        return type === activeTab;
      });
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((b) => {
        const t = (b.content?.title || '').toLowerCase();
        const sub = (b.content?.subtitle || '').toLowerCase();
        const type = (b.display?.type || '').toLowerCase();
        const catObj = b.display?.categoryId || b.display?.category;
        const cat =
          (typeof catObj === 'object' ? catObj?.name : '') ||
          categories.find((c) => c._id === (catObj?._id || catObj))?.name ||
          '';
        return t.includes(q) || sub.includes(q) || type.includes(q) || cat.toLowerCase().includes(q);
      });
    }

    // Sort by order ascending
    list.sort((a, b) => {
      const orderA = a.display?.order ?? 0;
      const orderB = b.display?.order ?? 0;
      return orderA - orderB;
    });

    return list;
  }, [banners, activeTab, search]);

  const {
    totalItems,
    paginatedItems,
  } = usePagination(filteredBanners, pageSize, serverTotal);

  // Reset to page 1 on tab change
  const handleTabChange = (key) => {
    setActiveTab(key);
    setCurrentPage(1);
    setSelectedIds([]);
  };

  // Open Add Drawer
  const handleOpenAdd = () => {
    setEditingBanner(null);
    const initialType = activeTab !== 'all' && SECTION_TYPE_CONFIG[activeTab] ? activeTab : 'herobanner';
    setFormType(initialType);
    setTitle('');
    setSubtitle('');
    setImageUrl('');
    setMediaType('image');
    setDestinationLink('');
    setSelectedCategory('');
    setStatus('active');
    setOrder(banners.length + 1);
    setStartDate('');
    setEndDate('');
    setIsTypeDropdownOpen(false);
    setIsDrawerOpen(true);
  };

  // Open Edit Drawer
  const handleOpenEdit = (banner) => {
    setEditingBanner(banner);
    const bType = banner.display?.type || 'herobanner';
    setFormType(bType);
    setTitle(banner.content?.title || '');
    setSubtitle(banner.content?.subtitle || '');
    setImageUrl(banner.mediaType === 'video' ? banner.video?.url : banner.image?.url || '');
    setMediaType(banner.mediaType || 'image');
    setDestinationLink(banner.link || '');

    const catObj = banner.display?.categoryId || banner.display?.category;
    const catId = typeof catObj === 'object' ? catObj?._id : catObj || '';
    setSelectedCategory(catId);

    setStatus(banner.status || 'active');
    setOrder(banner.display?.order ?? 1);
    setStartDate(formatForInput(banner.startDate));
    setEndDate(formatForInput(banner.endDate));
    setIsTypeDropdownOpen(false);
    setIsDrawerOpen(true);
  };

  // Close Drawer
  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
    setIsTypeDropdownOpen(false);
    setEditingBanner(null);
  };

  // Handle Image Upload via Presigned URL
  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file (.jpg, .png, .webp)');
      return;
    }

    try {
      setIsUploading(true);
      setUploadProgress(10);

      const { fileUrl } = await uploadWithPresignedUrl(
        file,
        'banners',
        (progress) => setUploadProgress(progress)
      );

      setImageUrl(fileUrl);
      setMediaType('image');
      toast.success('Banner image uploaded successfully');
    } catch (err) {
      console.error('Presigned upload failed:', err);
      toast.error(err.response?.data?.message || 'Image upload failed');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Remove Image
  const handleRemoveImage = () => {
    setImageUrl('');
  };

  // Direct Toggle Status from Table Switch
  const handleToggleStatus = async (banner, e) => {
    e.stopPropagation();
    const newStatus = banner.status === 'active' ? 'inactive' : 'active';

    // Optimistic UI update
    setBanners((prev) =>
      prev.map((b) => (b._id === banner._id ? { ...b, status: newStatus } : b))
    );

    try {
      await api.put(`/banners/${banner._id}`, {
        status: newStatus,
      });
      toast.success(`Section status changed to ${newStatus}`);
    } catch (err) {
      console.error('Failed to toggle status:', err);
      toast.error('Failed to update status');
      // Revert on failure
      setBanners((prev) =>
        prev.map((b) => (b._id === banner._id ? { ...b, status: banner.status } : b))
      );
    }
  };

  // Direct Update Order from Table
  const handleOrderChange = async (banner, newOrder) => {
    const num = Number(newOrder);
    if (isNaN(num)) return;

    // Optimistic UI update
    setBanners((prev) =>
      prev.map((b) =>
        b._id === banner._id
          ? {
              ...b,
              display: { ...(b.display || {}), order: num },
            }
          : b
      )
    );

    try {
      await api.put(`/banners/${banner._id}`, {
        display: {
          ...(banner.display || {}),
          order: num,
        },
      });
    } catch (err) {
      console.error('Failed to update order:', err);
      toast.error('Failed to update order');
    }
  };

  // Delete Banner
  const handleDelete = async (banner, e) => {
    e?.stopPropagation();
    const bannerTitle = banner.content?.title || banner.title || 'Untitled Section';

    const isConfirmed = await confirm({
      title: 'Delete Website Section',
      message: `Are you sure you want to delete "${bannerTitle}"? This will immediately remove it from the homepage.`,
      confirmText: 'Delete Section',
      cancelText: 'Cancel',
      type: 'danger',
    });

    if (!isConfirmed) return;

    try {
      await api.delete(`/banners/${banner._id}`);
      toast.success('Section deleted successfully');
      setBanners((prev) => prev.filter((b) => b._id !== banner._id));
      setSelectedIds((prev) => prev.filter((id) => id !== banner._id));
    } catch (err) {
      console.error('Delete failed:', err);
      toast.error(err.response?.data?.message || 'Failed to delete section');
    }
  };

  // Selection handlers
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(paginatedItems.map((b) => b._id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectItem = (id, e) => {
    e.stopPropagation();
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  // Bulk Delete
  const handleBulkDelete = async () => {
    const count = selectedIds.length;
    if (count === 0) return;

    const isConfirmed = await confirm({
      title: 'Delete Selected Sections',
      message: `Are you sure you want to delete ${count} selected section${count > 1 ? 's' : ''}? This action cannot be undone.`,
      confirmText: `Delete (${count})`,
      cancelText: 'Cancel',
      type: 'danger',
    });
    if (!isConfirmed) return;

    try {
      await Promise.allSettled(selectedIds.map((id) => api.delete(`/banners/${id}`)));
      setBanners((prev) => prev.filter((b) => !selectedIds.includes(b._id)));
      setSelectedIds([]);
      toast.success(`${count} section${count > 1 ? 's' : ''} deleted successfully`);
    } catch (err) {
      console.error('Bulk delete failed:', err);
      toast.error('Failed to delete some sections');
    }
  };

  // Submit Drawer Form
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!imageUrl) {
      toast.error('Please upload a banner image');
      return;
    }

    try {
      setSubmitting(true);

      const sectionTitle =
        title.trim() ||
        editingBanner?.content?.title ||
        editingBanner?.title ||
        SECTION_TYPE_CONFIG[formType]?.label ||
        'Section Banner';

      const payload = {
        content: {
          title: sectionTitle,
          subtitle: subtitle.trim() || editingBanner?.content?.subtitle || '',
          description: editingBanner?.content?.description || '',
        },
        display: {
          categoryId: selectedCategory || null,
          type: formType,
          order: Number(order) || 0,
          position: editingBanner?.display?.position || editingBanner?.position || 'none',
        },
        link: destinationLink.trim(),
        mediaType,
        status,
        startDate: formType === 'offerbanner' && startDate ? new Date(startDate).toISOString() : null,
        endDate: formType === 'offerbanner' && endDate ? new Date(endDate).toISOString() : null,
      };

      if (formType === 'offerbanner' && startDate && endDate && new Date(endDate) <= new Date(startDate)) {
        toast.error('Offer End Date & Time must be after Start Date & Time');
        setSubmitting(false);
        return;
      }

      if (mediaType === 'image') {
        payload.image = { url: imageUrl };
        payload.video = undefined;
      } else {
        payload.video = { url: imageUrl };
        payload.image = undefined;
      }

      if (editingBanner?._id) {
        await api.put(`/banners/${editingBanner._id}`, payload);
        toast.success('Section updated successfully');
      } else {
        await api.post('/banners', payload);
        toast.success('New section added successfully');
      }

      handleCloseDrawer();
      fetchData();
    } catch (err) {
      console.error('Error saving banner section:', err);
      toast.error(err.response?.data?.message || 'Failed to save section');
    } finally {
      setSubmitting(false);
    }
  };

  const SelectedTypeIcon =
    SECTION_TYPE_CONFIG[formType]?.icon || HiOutlinePhotograph;

  return (
    <div className="space-y-6 pb-12">
      {/* ─── Page Header Matching Screenshot ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl text-stone-900 font-bold tracking-tight">
            Website Sections
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 font-normal mt-1">
            Manage all homepage sections, banners and promotional blocks.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {selectedIds.length > 0 && (
            <button
              type="button"
              onClick={handleBulkDelete}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 transition-colors cursor-pointer shadow-2xs"
            >
              <HiOutlineTrash className="w-4 h-4" />
              <span>Delete Selected ({selectedIds.length})</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleOpenAdd}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-[#8a6d4b] hover:bg-[#785b3a] text-white shadow-xs transition-all cursor-pointer active:scale-98"
          >
            <HiOutlinePlus className="w-4 h-4 stroke-[2.5]" />
            <span>Add Section</span>
          </button>
        </div>
      </div>

      {/* ─── Type Filter Tabs Matching Screenshot ─── */}
      <div className="flex items-center gap-6 border-b border-stone-200/90 overflow-x-auto scrollbar-none">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.key;
          const count = tabCounts[tab.key] || 0;

          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => handleTabChange(tab.key)}
              className={`pb-3.5 text-xs sm:text-sm font-medium transition-all whitespace-nowrap cursor-pointer flex items-center gap-2 border-b-2 ${
                isActive
                  ? 'border-[#8a6d4b] text-[#8a6d4b] font-semibold -mb-[1px]'
                  : 'border-transparent text-stone-500 hover:text-stone-800'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[11px] font-semibold transition-colors ${
                  isActive
                    ? 'bg-[#8a6d4b]/10 text-[#8a6d4b]'
                    : 'bg-stone-100 text-stone-500'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* ─── Table Card Matching Screenshot ─── */}
      <div className="bg-white rounded-2xl border border-stone-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-stone-150 bg-stone-50/40 text-[11px] font-semibold text-stone-400 uppercase tracking-wider">
                <th className="py-3.5 pl-5 pr-2 w-10">
                  <input
                    type="checkbox"
                    checked={
                      paginatedItems.length > 0 &&
                      paginatedItems.every((b) => selectedIds.includes(b._id))
                    }
                    onChange={handleSelectAll}
                    className="w-4 h-4 rounded border-stone-300 text-[#8a6d4b] focus:ring-[#8a6d4b]/30 cursor-pointer"
                  />
                </th>
                <th className="py-3.5 px-4 whitespace-nowrap">PREVIEW</th>
                <th className="py-3.5 px-4 whitespace-nowrap">TITLE</th>
                <th className="py-3.5 px-4 whitespace-nowrap">TYPE</th>
                <th className="py-3.5 px-4 whitespace-nowrap">STATUS</th>
                <th className="py-3.5 px-4 whitespace-nowrap text-center">ORDER</th>
                <th className="py-3.5 pr-6 pl-4 whitespace-nowrap text-right">ACTIONS</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-stone-100 text-xs sm:text-[13px] text-stone-700">
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-16 text-center text-stone-400">
                    <div className="w-7 h-7 border-2 border-stone-300 border-t-[#8a6d4b] rounded-full animate-spin mx-auto mb-3" />
                    <span>Loading website sections...</span>
                  </td>
                </tr>
              ) : filteredBanners.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-16 text-center text-stone-400">
                    <HiOutlinePhotograph className="w-10 h-10 mx-auto text-stone-300 mb-2 stroke-1" />
                    <p className="text-sm font-medium text-stone-600">No sections found</p>
                    <p className="text-xs text-stone-400 mt-1">
                      {activeTab === 'all'
                        ? 'Click "+ Add Section" to create your first homepage banner.'
                        : `No sections created under ${TABS.find((t) => t.key === activeTab)?.label || 'this tab'}.`}
                    </p>
                  </td>
                </tr>
              ) : (
                paginatedItems.map((banner) => {
                  const bType = (banner.display?.type || 'herobanner').toLowerCase();
                  const typeConfig = SECTION_TYPE_CONFIG[bType] || SECTION_TYPE_CONFIG.websitebanner;
                  const bTitle = banner.content?.title || typeConfig.label || 'Website Section';
                  const assetUrl =
                    banner.mediaType === 'video' ? banner.video?.url : banner.image?.url;
                  const isActive = banner.status === 'active';
                  const bOrder = banner.display?.order ?? 1;

                  return (
                    <tr
                      key={banner._id}
                      className="hover:bg-[#faf8f5]/60 transition-colors"
                    >
                      {/* Checkbox */}
                      <td className="py-3.5 pl-5 pr-2">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(banner._id)}
                          onChange={(e) => handleSelectItem(banner._id, e)}
                          className="w-4 h-4 rounded border-stone-300 text-[#8a6d4b] focus:ring-[#8a6d4b]/30 cursor-pointer"
                        />
                      </td>

                      {/* Preview Image (Landscape 1920x600 ratio aspect) */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div
                          onClick={() => handleOpenEdit(banner)}
                          className="w-36 sm:w-44 h-14 sm:h-16 rounded-xl border border-stone-200/90 overflow-hidden bg-stone-900 relative shadow-2xs cursor-pointer group flex items-center justify-center shrink-0"
                        >
                          {banner.mediaType === 'video' ? (
                            <div className="w-full h-full bg-stone-900 flex items-center justify-center text-white">
                              <HiOutlineFilm className="w-5 h-5 text-stone-300" />
                            </div>
                          ) : assetUrl ? (
                            <img
                              src={getMediaUrl(assetUrl)}
                              alt={bTitle}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          ) : (
                            <HiOutlinePhotograph className="w-5 h-5 text-stone-500" />
                          )}
                        </div>
                      </td>

                      {/* Title */}
                      <td className="py-3.5 px-4 font-medium text-stone-900 whitespace-nowrap">
                        <div className="max-w-[240px] truncate" title={bTitle}>
                          {bTitle}
                        </div>
                        {banner.content?.subtitle && (
                          <div className="text-[11px] text-stone-400 font-normal truncate max-w-[220px]">
                            {banner.content.subtitle}
                          </div>
                        )}
                        {(() => {
                          const catObj = banner.display?.categoryId || banner.display?.category;
                          const catName =
                            typeof catObj === 'object' && catObj?.name
                              ? catObj.name
                              : categories.find((c) => c._id === (catObj?._id || catObj))?.name || '';
                          if (!catName) return null;
                          return (
                            <div className="mt-1">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-stone-100 text-stone-600 text-[10px] font-medium border border-stone-200/60">
                                <HiOutlineTag className="w-3 h-3 text-[#8a6d4b]" />
                                {catName}
                              </span>
                            </div>
                          );
                        })()}

                        {/* Offer Validity and Expiry Status for offer banners */}
                        {bType === 'offerbanner' && (banner.startDate || banner.endDate) && (
                          <div className="mt-1 flex flex-wrap items-center gap-1.5">
                            {banner.endDate && (() => {
                              const isPast = new Date(banner.endDate) < new Date();
                              return (
                                <span
                                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium border ${
                                    isPast
                                      ? 'bg-rose-50 text-rose-700 border-rose-200'
                                      : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  }`}
                                  title={`Ends: ${new Date(banner.endDate).toLocaleString()}`}
                                >
                                  <HiOutlineClock className="w-3 h-3" />
                                  {isPast
                                    ? 'Expired'
                                    : `Ends: ${new Date(banner.endDate).toLocaleDateString(undefined, {
                                        month: 'short',
                                        day: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit',
                                      })}`}
                                </span>
                              );
                            })()}
                          </div>
                        )}
                      </td>

                      {/* Type Badge */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-medium ${typeConfig.badgeClass}`}
                        >
                          {typeConfig.label}
                        </span>
                      </td>

                      {/* Status Toggle Switch */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={(e) => handleToggleStatus(banner, e)}
                          className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors duration-200 cursor-pointer focus:outline-none ${
                            isActive ? 'bg-[#8a6d4b]' : 'bg-stone-300'
                          }`}
                          title={`Click to ${isActive ? 'deactivate' : 'activate'}`}
                        >
                          <div
                            className={`bg-white w-4 h-4 rounded-full shadow-xs transform transition-transform duration-200 ${
                              isActive ? 'translate-x-5' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </td>

                      {/* Order Input */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-center">
                        <input
                          type="number"
                          defaultValue={bOrder}
                          key={bOrder}
                          onBlur={(e) => handleOrderChange(banner, e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleOrderChange(banner, e.currentTarget.value);
                              e.currentTarget.blur();
                            }
                          }}
                          className="w-12 h-9 rounded-lg border border-stone-200 text-center font-medium text-xs text-stone-800 bg-white focus:outline-none focus:border-[#8a6d4b] focus:ring-1 focus:ring-[#8a6d4b]/20"
                        />
                      </td>

                      {/* Actions (Pencil & Trash buttons matching screenshot) */}
                      <td className="py-3.5 pr-6 pl-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(banner)}
                            className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 flex items-center justify-center transition-colors cursor-pointer"
                            title="Edit Section"
                          >
                            <HiOutlinePencil className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => handleDelete(banner, e)}
                            className="w-8 h-8 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 flex items-center justify-center transition-colors cursor-pointer"
                            title="Delete Section"
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

        {/* Pagination */}
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

      {/* ─── Centered Modal Pop-up (Replaces Sidebar Drawer) ─── */}
      {isDrawerOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-xs p-4 animate-fadeIn"
          onClick={handleCloseDrawer}
        >
          <div
            className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-7 shadow-2xl border border-stone-200/90 flex flex-col max-h-[92vh] animate-scaleUp overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-stone-100 shrink-0">
              <h2 className="text-base sm:text-lg font-bold text-stone-900 tracking-tight">
                {editingBanner ? 'Edit Section' : 'Add Section'}
              </h2>
              <button
                type="button"
                onClick={handleCloseDrawer}
                className="w-8 h-8 rounded-full border border-stone-200 flex items-center justify-center text-stone-400 hover:text-stone-700 transition-colors cursor-pointer"
              >
                <HiOutlineX className="w-4 h-4 stroke-[2]" />
              </button>
            </div>

            {/* Modal Form Body */}
            <form
              id="bannerDrawerForm"
              onSubmit={handleSubmit}
              className="flex-1 overflow-y-auto py-4 px-1 space-y-5 scrollbar-thin scrollbar-thumb-stone-200"
            >
                {/* ─── 1. Select Section Type ─── */}
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-stone-700">
                    1. Select Section Type <span className="text-red-500">*</span>
                  </label>

                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setIsTypeDropdownOpen(!isTypeDropdownOpen)}
                      className="w-full h-11 px-3.5 rounded-xl border border-stone-200 bg-white flex items-center justify-between text-xs sm:text-[13px] text-stone-800 hover:border-stone-300 focus:outline-none focus:border-[#8a6d4b] focus:ring-1 focus:ring-[#8a6d4b]/20 transition-all cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5">
                        <SelectedTypeIcon className="w-4 h-4 text-stone-600" />
                        <span className="font-medium">
                          {SECTION_TYPE_CONFIG[formType]?.label || 'App Banner'}
                        </span>
                      </div>
                      <HiOutlineChevronDown className="w-4 h-4 text-stone-400" />
                    </button>

                    {isTypeDropdownOpen && (
                      <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-stone-200 rounded-xl shadow-lg z-20 py-1.5 overflow-hidden animate-scaleUp">
                        {SECTION_TYPE_OPTIONS.map((opt) => {
                          const Icon = opt.icon;
                          const isSelected = formType === opt.value;
                          return (
                            <button
                              key={opt.value}
                              type="button"
                              onClick={() => {
                                setFormType(opt.value);
                                setIsTypeDropdownOpen(false);
                              }}
                              className={`w-full px-3.5 py-2.5 flex items-center gap-2.5 text-xs text-left cursor-pointer transition-colors ${
                                isSelected
                                  ? 'bg-[#8a6d4b]/10 text-[#8a6d4b] font-semibold'
                                  : 'text-stone-700 hover:bg-stone-50'
                              }`}
                            >
                              <Icon className="w-4 h-4 text-stone-500" />
                              <span>{opt.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* ─── 2. Banner Image ─── */}
                <div className="space-y-2.5">
                  <h3 className="text-xs font-semibold text-stone-700">
                    2. Banner Image
                  </h3>

                  {/* Hidden file input */}
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    accept="image/png, image/jpeg, image/webp"
                    className="hidden"
                  />

                  {/* Image Preview with delete button */}
                  {imageUrl ? (
                    <div className="relative w-full h-36 rounded-xl overflow-hidden border border-stone-200/90 bg-stone-900 shadow-inner group">
                      <img
                        src={getMediaUrl(imageUrl)}
                        alt="Banner Preview"
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        className="absolute top-2 right-2 w-7 h-7 rounded-lg bg-white/90 hover:bg-white text-red-500 flex items-center justify-center shadow-sm transition-all cursor-pointer"
                        title="Remove Image"
                      >
                        <HiOutlineTrash className="w-4 h-4" />
                      </button>
                    </div>
                  ) : null}

                  {/* Upload Progress Bar if uploading */}
                  {isUploading && (
                    <div className="space-y-1.5 p-3 rounded-xl bg-stone-50 border border-stone-200/60">
                      <div className="flex items-center justify-between text-[11px] text-stone-600 font-medium">
                        <span>Uploading image to Cloudflare...</span>
                        <span>{uploadProgress}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-stone-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#8a6d4b] transition-all duration-200 rounded-full"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Change / Upload Button */}
                  <button
                    type="button"
                    disabled={isUploading}
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full h-11 rounded-xl border border-stone-200 hover:border-stone-300 hover:bg-stone-50 text-xs font-medium text-stone-700 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                  >
                    <HiOutlineUpload className="w-4 h-4 text-stone-500" />
                    <span>{imageUrl ? 'Change Image' : 'Upload Image'}</span>
                  </button>

                  <p className="text-[11px] text-stone-400 text-center leading-relaxed">
                    Recommended size: 1920 × 600 (Desktop)
                    <br />
                    PNG, JPG, WEBP up to 5MB
                  </p>
                </div>

                {/* ─── 3. Section Details & Category Settings ─── */}
                <div className="space-y-3.5">
                  <h3 className="text-xs font-semibold text-stone-700">
                    3. Section & Category Settings
                  </h3>

                  {/* Title (Optional / Customizable for Hero, Category, Offer, etc.) */}
                  <div>
                    <label className="block text-[11px] font-medium text-stone-600 mb-1">
                      {formType === 'offerbanner' ? 'Offer Title' : 'Title / Heading'}{' '}
                      <span className="text-stone-400 font-normal">(Optional)</span>
                    </label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder={
                        formType === 'herobanner'
                          ? 'e.g. Pure Elegance & Craftsmanship'
                          : formType === 'offerbanner'
                          ? 'e.g. Flat 20% Off on Diamond Rings'
                          : formType === 'categorybanner'
                          ? 'e.g. Rings & Bands Collection'
                          : 'Enter title'
                      }
                      className="w-full h-11 px-3.5 rounded-xl border border-stone-200 text-xs sm:text-[13px] text-stone-800 placeholder-stone-400 focus:outline-none focus:border-[#8a6d4b] focus:ring-1 focus:ring-[#8a6d4b]/20 transition-all bg-white"
                    />
                  </div>

                  {/* Offer Banner Active Time Window (Start & End Date with Cron Auto-Deletion) */}
                  {formType === 'offerbanner' && (
                    <div className="p-3.5 rounded-xl bg-[#fff8f2] border border-[#f5d7b5] space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-[#8a4b12]">
                          <HiOutlineClock className="w-4 h-4 text-[#c05621]" />
                          <span>Offer Time Window (Cron Auto-Expires)</span>
                        </div>
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-[#faecd8] text-[#9c4221] border border-[#f5d7b5]">
                          Auto-Delete on Expiry
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-medium text-stone-700 mb-1">
                            Start Date & Time <span className="text-stone-400 font-normal">(Optional)</span>
                          </label>
                          <input
                            type="datetime-local"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="w-full h-10 px-3 rounded-xl border border-[#e8c8a7] bg-white text-xs text-stone-800 focus:outline-none focus:border-[#8a6d4b] focus:ring-1 focus:ring-[#8a6d4b]/20 transition-all cursor-pointer"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-medium text-stone-700 mb-1">
                            End Date & Time <span className="text-stone-400 font-normal">(Auto-Delete on pass)</span>
                          </label>
                          <input
                            type="datetime-local"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="w-full h-10 px-3 rounded-xl border border-[#e8c8a7] bg-white text-xs text-stone-800 focus:outline-none focus:border-[#8a6d4b] focus:ring-1 focus:ring-[#8a6d4b]/20 transition-all cursor-pointer"
                          />
                        </div>
                      </div>

                      <p className="text-[11px] text-[#9c4221] leading-relaxed">
                        ⏳ When the <strong>End Date & Time</strong> passes, the scheduled backend cron job will automatically delete this expired offer banner from the website.
                      </p>
                    </div>
                  )}

                  {/* Category Selection Option (Supported for herobanner, categorybanner, collectionbanner, offerbanner) */}
                  {(formType === 'herobanner' ||
                    formType === 'categorybanner' ||
                    formType === 'collectionbanner' ||
                    formType === 'offerbanner') && (
                    <div>
                      <label className="block text-[11px] font-medium text-stone-600 mb-1">
                        Linked Category{' '}
                        {formType === 'categorybanner' ? (
                          <span className="text-red-500">*</span>
                        ) : (
                          <span className="text-stone-400 font-normal">(Optional)</span>
                        )}
                      </label>
                      <Dropdown
                        value={selectedCategory}
                        onChange={(catId) => {
                          setSelectedCategory(catId);
                          const cat = categories.find((c) => c._id === catId);
                          if (cat) {
                            if (!destinationLink || destinationLink.startsWith('/shop?category=') || destinationLink === '/shop') {
                              setDestinationLink(`/shop?category=${cat.slug || cat.name.toLowerCase().replace(/\s+/g, '-')}`);
                            }
                            if (!title && formType === 'categorybanner') {
                              setTitle(`${cat.name} Collection`);
                            }
                          }
                        }}
                        options={[
                          {
                            value: '',
                            label:
                              formType === 'herobanner'
                                ? 'Select Category (Optional - General Store)'
                                : formType === 'offerbanner'
                                ? 'Select Category (Optional - All Products)'
                                : 'Select a Category',
                          },
                          ...categories.map((cat) => ({
                            value: cat._id,
                            label: cat.name,
                          })),
                        ]}
                        placeholder="Select Category"
                        buttonClassName="w-full h-11 px-3.5 rounded-xl border border-stone-200 text-xs sm:text-[13px] text-stone-800 bg-white shadow-2xs"
                        menuClassName="z-[60]"
                      />
                      {formType === 'herobanner' && (
                        <p className="text-[11px] text-stone-400 mt-1">
                          Linking a category connects this hero banner's "Shop Now" action directly to that collection.
                        </p>
                      )}
                    </div>
                  )}

                  {/* Destination Link */}
                  <div>
                    <label className="block text-[11px] font-medium text-stone-600 mb-1">
                      Destination Link (URL){' '}
                      <span className="text-stone-400 font-normal">(Optional)</span>
                    </label>
                    <input
                      type="text"
                      value={destinationLink}
                      onChange={(e) => setDestinationLink(e.target.value)}
                      placeholder="e.g. /shop?category=bangles"
                      className="w-full h-11 px-3.5 rounded-xl border border-stone-200 text-xs sm:text-[13px] text-stone-800 placeholder-stone-400 focus:outline-none focus:border-[#8a6d4b] focus:ring-1 focus:ring-[#8a6d4b]/20 transition-all bg-white"
                    />
                  </div>
                </div>

                {/* ─── 4. Display Settings ─── */}
                <div className="space-y-3.5">
                  <h3 className="text-xs font-semibold text-stone-700">
                    4. Display Settings
                  </h3>

                  <div className="grid grid-cols-2 gap-4 items-center">
                    <div>
                      <label className="block text-[11px] font-medium text-stone-600 mb-2">
                        Status
                      </label>
                      <button
                        type="button"
                        onClick={() =>
                          setStatus((prev) => (prev === 'active' ? 'inactive' : 'active'))
                        }
                        className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors duration-200 cursor-pointer focus:outline-none ${
                          status === 'active' ? 'bg-[#8a6d4b]' : 'bg-stone-300'
                        }`}
                      >
                        <div
                          className={`bg-white w-4 h-4 rounded-full shadow-xs transform transition-transform duration-200 ${
                            status === 'active' ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-stone-600 mb-1">
                        Display Order
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={order}
                        onChange={(e) => setOrder(Number(e.target.value) || 0)}
                        className="w-full h-11 px-3.5 rounded-xl border border-stone-200 text-xs sm:text-[13px] text-stone-800 focus:outline-none focus:border-[#8a6d4b] focus:ring-1 focus:ring-[#8a6d4b]/20 transition-all bg-white"
                      />
                    </div>
                  </div>
                </div>
              </form>

            {/* Modal Footer Actions */}
            <div className="pt-4 border-t border-stone-100 flex items-center justify-between gap-3 shrink-0">
              <button
                type="button"
                onClick={handleCloseDrawer}
                className="w-1/2 h-11 bg-[#f7f7f9] hover:bg-stone-200 text-stone-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="bannerDrawerForm"
                disabled={submitting || isUploading}
                className="w-1/2 h-11 bg-[#8a6d4b] hover:bg-[#785b3a] text-white text-xs font-semibold rounded-xl transition-colors shadow-xs cursor-pointer disabled:opacity-50 flex items-center justify-center"
              >
                {submitting ? 'Saving...' : 'Save Section'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
