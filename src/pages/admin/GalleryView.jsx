import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  HiOutlinePhotograph,
  HiOutlineUpload,
  HiOutlineSearch,
  HiOutlineFilter,
  HiOutlineEye,
  HiOutlineTrash,
  HiOutlineExternalLink,
  HiOutlineCheck,
  HiOutlineX,
  HiOutlineSparkles,
  HiOutlineTag,
  HiOutlineRefresh,
  HiOutlineColorSwatch,
  HiOutlineDeviceMobile,
  HiOutlineDesktopComputer,
  HiOutlineViewGrid,
  HiOutlineViewList,
  HiOutlineCalendar,
  HiOutlinePlus,
  HiOutlineDotsVertical,
  HiOutlineDownload,
  HiOutlineClipboardCopy,
  HiOutlineInformationCircle,
  HiOutlineGift,
  HiOutlineCode,
  HiOutlineArrowRight,
  HiOutlineClock,
  HiOutlineChevronDown,
  HiOutlinePencil,
} from 'react-icons/hi';
import { IoDiamondOutline, IoSparklesOutline, IoLayersOutline } from 'react-icons/io5';
import toast from 'react-hot-toast';
import { galleryAPI } from '../../api/services';
import { uploadWithPresignedUrl, formatBytes } from '../../utils/uploadWithPresignedUrl';
import Dropdown from '../../components/common/Dropdown';
import Pagination from '../../components/common/Pagination';

const BANNER_TYPES = [
  { key: 'all', label: 'All Media', icon: HiOutlinePhotograph },
  { key: 'herobanner', label: 'Hero Banners', icon: HiOutlineDesktopComputer },
  { key: 'collectionbanner', label: 'Collection Banners', icon: HiOutlineTag },
  { key: 'categorybanner', label: 'Category Banners', icon: HiOutlineViewGrid },
  { key: 'offerbanner', label: 'Offer Banners', icon: HiOutlineGift },
  { key: 'celebrate', label: 'Celebrate & Gifts', icon: IoDiamondOutline },
  { key: 'mobileappbanner', label: 'Mobile App', icon: HiOutlineDeviceMobile },
  { key: 'bookappointbanner', label: 'Appointments', icon: HiOutlineCalendar },
  { key: 'customizebanner', label: 'Custom Banners', icon: HiOutlineSparkles },
  { key: 'asset', label: 'Media Assets', icon: HiOutlinePhotograph },
];

export default function GalleryView() {
  // ─── Data State ─────────────────────────────────────────────
  const [items, setItems] = useState([]);
  const [counts, setCounts] = useState({
    total: 0,
    herobanner: 0,
    collectionbanner: 0,
    categorybanner: 0,
    offerbanner: 0,
    celebrate: 0,
    mobileappbanner: 0,
    bookappointbanner: 0,
    customizebanner: 0,
    asset: 0,
  });
  const [themes, setThemes] = useState([]);
  const [loading, setLoading] = useState(true);

  // ─── Filter & View State ────────────────────────────────────
  const [selectedTheme, setSelectedTheme] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedPlatform, setSelectedPlatform] = useState('all'); // 'all' | 'web' | 'mobile' | 'common'
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'

  // ─── Modals State ───────────────────────────────────────────
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [previewItem, setPreviewItem] = useState(null);
  const [deleteConfirmItem, setDeleteConfirmItem] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // ─── Edit Modal State ───────────────────────────────────────
  const [editingItem, setEditingItem] = useState(null);
  const [editPlacement, setEditPlacement] = useState('herobanner');
  const [editPlatform, setEditPlatform] = useState('common');
  const [editThemeId, setEditThemeId] = useState('');
  const [editStatus, setEditStatus] = useState('active');
  const [isUpdating, setIsUpdating] = useState(false);

  // ─── Upload Form State ──────────────────────────────────────
  const [uploadThemeId, setUploadThemeId] = useState('');
  const [uploadType, setUploadType] = useState('herobanner');
  const [uploadPlatform, setUploadPlatform] = useState('common'); // 'web' | 'app' | 'common'

  // Selected file
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const fileInputRef = useRef(null);

  // ─── Pagination State ──────────────────────────────────────
  const [page, setPage] = useState(1);
  const pageSize = 24;
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // ─── Fetch Themes Lookup (Only called when uploading/editing images) ────────
  const fetchThemesLookup = useCallback(async () => {
    try {
      const themesRes = await galleryAPI.getThemes();
      const themeList = themesRes.data?.data || [];
      setThemes(themeList);
      const active = themeList.find((t) => t.isLive);
      if (active && !uploadThemeId) {
        setUploadThemeId(active._id);
      }
      return themeList;
    } catch (err) {
      console.error('Failed to load themes lookup:', err);
      return [];
    }
  }, [uploadThemeId]);

  // ─── Fetch Gallery Items (With Pagination) ──────────────────
  const fetchGallery = useCallback(async (targetPage = page) => {
    try {
      setLoading(true);
      const res = await galleryAPI.getAll({
        themeId: selectedTheme,
        type: selectedType,
        platform: selectedPlatform,
        search,
        sortBy,
        page: targetPage,
        limit: pageSize,
      });
      const data = res.data?.data || {};
      setItems(data.items || []);
      setCounts(data.counts || {});
      setTotalPages(data.pagination?.totalPages || 1);
      setTotalItems(data.pagination?.total || data.total || (data.items || []).length);
      if (data.themes && (!themes || themes.length === 0)) {
        setThemes(data.themes);
        const active = data.themes.find((t) => t.isLive);
        if (active && !uploadThemeId) {
          setUploadThemeId(active._id);
        }
      }
    } catch (err) {
      console.error('Failed to fetch gallery items:', err);
      toast.error('Could not load gallery images.');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, selectedTheme, selectedType, selectedPlatform, search, sortBy, themes, uploadThemeId]);

  // Reset to page 1 when any filter or search changes
  useEffect(() => {
    setPage(1);
  }, [selectedTheme, selectedType, selectedPlatform, search, sortBy]);

  // On mount and filter changes: ONLY call gallery get list API with pagination
  useEffect(() => {
    fetchGallery(page);
  }, [page, selectedTheme, selectedType, selectedPlatform, search, sortBy]);

  // ─── Modal Scroll Lock & ESC Key Handling ───────────────────
  useEffect(() => {
    if (uploadModalOpen || previewItem || deleteConfirmItem || editingItem) {
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';

      const handleKeyDown = (e) => {
        if (e.key === 'Escape') {
          if (!isUploading && uploadModalOpen) setUploadModalOpen(false);
          if (previewItem) setPreviewItem(null);
          if (!isDeleting && deleteConfirmItem) setDeleteConfirmItem(null);
          if (!isUpdating && editingItem) setEditingItem(null);
        }
      };

      window.addEventListener('keydown', handleKeyDown);
      return () => {
        document.body.style.overflow = prevOverflow;
        window.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [uploadModalOpen, previewItem, deleteConfirmItem, editingItem, isUploading, isDeleting, isUpdating]);

  // ─── File Selection ─────────────────────────────────────────
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please choose a valid image file (JPG, PNG, WebP).');
      return;
    }
    setSelectedFile(file);
    setFilePreviewUrl(URL.createObjectURL(file));
  };

  // ─── Upload & Assign Action ─────────────────────────────────
  const handleUploadAndAssign = async (e) => {
    e?.preventDefault();

    if (!selectedFile) {
      toast.error('Please select an image file to upload.');
      return;
    }

    try {
      setIsUploading(true);
      setUploadProgress(20);

      // Upload file directly to S3 / Cloud Storage
      const uploadRes = await uploadWithPresignedUrl(
        selectedFile,
        'website-themes',
        (prog) => setUploadProgress(20 + Math.floor(prog * 0.6))
      );

      setUploadProgress(85);

      await galleryAPI.uploadAssign({
        themeId: uploadThemeId || undefined,
        placement: uploadType,
        image: { url: uploadRes.fileUrl, key: uploadRes.key },
        platform: uploadPlatform,
        status: 'active',
      });

      setUploadProgress(100);
      toast.success('Image successfully uploaded and assigned to theme!');
      resetUploadModal();
      setUploadModalOpen(false);
      await fetchGallery();
    } catch (err) {
      console.error('Upload & assignment failed:', err);
      toast.error(err.response?.data?.message || 'Failed to upload and assign image.');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const resetUploadModal = () => {
    setSelectedFile(null);
    setFilePreviewUrl('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // ─── Delete / Unassign Action ───────────────────────────────
  const handleDeleteItem = async () => {
    if (!deleteConfirmItem) return;
    try {
      setIsDeleting(true);
      await galleryAPI.deleteItem(deleteConfirmItem.id);
      toast.success('Media item removed successfully.');
      setDeleteConfirmItem(null);
      await fetchGallery();
    } catch (err) {
      console.error('Delete failed:', err);
      toast.error(err.response?.data?.message || 'Could not delete media item.');
    } finally {
      setIsDeleting(false);
    }
  };

  // ─── Status Toggle ──────────────────────────────────────────
  const handleToggleStatus = async (item) => {
    try {
      const nextStatus = item.status === 'active' ? 'inactive' : 'active';
      await galleryAPI.toggleStatus(item.id);
      toast.success(`${item.typeLabel || item.placement || 'Media'} set to ${nextStatus}`);
      setItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, status: nextStatus } : i))
      );
    } catch (err) {
      console.error('Failed to toggle status:', err);
      toast.error('Failed to update media status.');
    }
  };

  // ─── Open Edit Modal ────────────────────────────────────────
  const handleOpenEdit = (item) => {
    fetchThemesLookup();
    setEditingItem(item);
    setEditPlacement(item.placement || item.type || 'herobanner');
    setEditPlatform(item.platform || 'common');
    setEditThemeId(item.themeId || '');
    setEditStatus(item.status || 'active');
  };

  const handleOpenUploadModal = () => {
    resetUploadModal();
    fetchThemesLookup();
    setUploadModalOpen(true);
  };

  // ─── Save Edit ──────────────────────────────────────────────
  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingItem) return;
    try {
      setIsUpdating(true);
      await galleryAPI.update(editingItem.id, {
        placement: editPlacement,
        platform: editPlatform,
        themeId: editThemeId || null,
        status: editStatus,
      });
      toast.success('Gallery item updated successfully!');
      setEditingItem(null);
      await fetchGallery();
    } catch (err) {
      console.error('Update failed:', err);
      toast.error(err.response?.data?.message || 'Failed to update gallery item.');
    } finally {
      setIsUpdating(false);
    }
  };

  // ─── Clipboard Helper ───────────────────────────────────────
  const copyToClipboard = (text, label = 'Image URL') => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard!`, { icon: '📋' });
  };

  // ─── Filtered Items & Themes ────────────────────────────────
  const activeThemeObj = useMemo(() => {
    return themes.find((t) => t.isLive);
  }, [themes]);

  // ─── Common Dropdown Options ────────────────────────────────
  const filterThemeOptions = useMemo(() => {
    return [
      { value: 'all', label: 'All Website Themes', dotColor: 'bg-stone-400' },
      { value: 'active', label: 'Current Live Theme', dotColor: 'bg-emerald-500' },
      ...themes.map((t) => ({
        value: String(t._id),
        label: `${t.name}${t.isLive ? ' (Live)' : ` (${t.status})`}`,
        dotColor: t.isLive ? 'bg-emerald-500' : 'bg-amber-400',
      })),
    ];
  }, [themes]);

  const modalThemeOptions = useMemo(() => {
    return [
      {
        value: '',
        label: 'Global / Unassigned Theme',
        sublabel: 'Available across all storefront themes',
        dotColor: 'bg-stone-300',
      },
      ...themes.map((t) => ({
        value: String(t._id),
        label: `${t.name}${t.isLive ? ' ★ (Current Live Theme)' : ` (${t.status})`}`,
        sublabel: t.isLive ? 'Current Live Storefront Theme' : `Status: ${t.status}`,
        dotColor: t.isLive ? 'bg-emerald-500' : 'bg-amber-400',
      })),
    ];
  }, [themes]);

  const placementTypeOptions = useMemo(() => [
    {
      value: 'herobanner',
      label: 'Hero Banner',
      sublabel: 'Homepage main hero slider',
      icon: HiOutlineDesktopComputer,
    },
    {
      value: 'collectionbanner',
      label: 'Collection Banner',
      sublabel: '4-tile curated collection showcase',
      icon: HiOutlineTag,
    },
    {
      value: 'categorybanner',
      label: 'Category Banner',
      sublabel: 'Category page top header banner',
      icon: HiOutlineViewGrid,
    },
    {
      value: 'offerbanner',
      label: 'Offer Banner',
      sublabel: 'Promotional deals & discount banner',
      icon: HiOutlineGift,
    },
    {
      value: 'celebrate',
      label: 'Celebrate & Gifts',
      sublabel: 'Gift guide and celebrate showcase item',
      icon: IoDiamondOutline,
    },
    {
      value: 'mobileappbanner',
      label: 'Mobile App Banner',
      sublabel: 'Mobile app download promotion',
      icon: HiOutlineDeviceMobile,
    },
    {
      value: 'bookappointbanner',
      label: 'Appointment Banner',
      sublabel: 'In-store appointment booking section',
      icon: HiOutlineCalendar,
    },
    {
      value: 'customizebanner',
      label: 'Custom Banner',
      sublabel: 'Custom pages and seasonal campaigns',
      icon: HiOutlineSparkles,
    },
    {
      value: 'asset',
      label: 'Media Library Asset',
      sublabel: 'General asset stored in theme media library',
      icon: HiOutlinePhotograph,
    },
  ], []);

// Server-side pagination active

  return (
    <div className="mx-auto max-w-[1600px] space-y-6 p-4 md:p-8">
      {/* ─── 1. HEADER SECTION ─────────────────────────────────── */}
      <header className="flex flex-col gap-4 rounded-3xl border border-stone-200 bg-white p-6 md:flex-row md:items-center md:justify-between shadow-xs">
        <div className="flex items-center gap-4">
          <div className="flex h-13 w-13 items-center justify-center rounded-2xl bg-gradient-to-br from-[#8b6c3a] to-[#765a2d] text-white shadow-md shadow-[#8b6c3a]/20">
            <HiOutlinePhotograph className="h-7 w-7" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl md:text-2xl font-bold tracking-tight text-stone-900">
                Media & Theme Gallery
              </h1>
              {activeThemeObj && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  Live: {activeThemeObj.name}
                </span>
              )}
            </div>
            <p className="mt-1 text-xs text-stone-500">
              Centralized gallery to upload, manage, and assign images to Website Themes, Hero Banners, and Collection Banners.
            </p>
          </div>
        </div>

        {/* Header Actions */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={fetchGallery}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl border border-stone-200 bg-stone-50 px-3.5 py-2.5 text-xs font-semibold text-stone-700 hover:bg-stone-100 transition cursor-pointer"
            title="Refresh Gallery"
          >
            <HiOutlineRefresh className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>

          <button
            type="button"
            onClick={handleOpenUploadModal}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#8b6c3a] to-[#765a2d] px-5 py-2.5 text-xs font-semibold text-white shadow-md shadow-[#8b6c3a]/20 hover:from-[#765a2d] hover:to-[#634b25] transition cursor-pointer"
          >
            <HiOutlinePlus className="h-4 w-4" />
            Upload to Gallery
          </button>
        </div>
      </header>

      {/* ─── 2. FILTER & TOOLBAR ────────────────────────────────── */}
      <div className="space-y-3 rounded-2xl border border-stone-200 bg-white p-4 shadow-xs">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          {/* Search bar */}
          <div className="relative flex-1">
            <HiOutlineSearch className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by image name, banner title, theme, or placement…"
              className="w-full rounded-xl border border-stone-200 bg-stone-50/60 pl-10 pr-4 py-2.5 text-xs text-stone-800 placeholder-stone-400 outline-none transition focus:border-[#8b6c3a] focus:bg-white focus:ring-2 focus:ring-[#8b6c3a]/15"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
              >
                <HiOutlineX className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Theme Dropdown Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-stone-600 whitespace-nowrap">Filter Theme:</span>
            <div className="w-56">
              <Dropdown
                size="sm"
                showStatusDot={true}
                value={selectedTheme}
                onChange={(val) => setSelectedTheme(val || 'all')}
                options={filterThemeOptions}
                placeholder="All Themes"
              />
            </div>
          </div>

          {/* Platform Filter: All, Web, App, Common */}
          <div className="flex items-center gap-1 rounded-xl border border-stone-200 bg-stone-50 p-1">
            <button
              type="button"
              onClick={() => setSelectedPlatform('all')}
              className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                selectedPlatform === 'all'
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setSelectedPlatform('web')}
              className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition flex items-center gap-1 ${
                selectedPlatform === 'web'
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              <HiOutlineDesktopComputer className="h-3.5 w-3.5" />
              Web
            </button>
            <button
              type="button"
              onClick={() => setSelectedPlatform('mobile')}
              className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition flex items-center gap-1 ${
                selectedPlatform === 'mobile'
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              <HiOutlineDeviceMobile className="h-3.5 w-3.5" />
              App
            </button>
            <button
              type="button"
              onClick={() => setSelectedPlatform('common')}
              className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition flex items-center gap-1 ${
                selectedPlatform === 'common'
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              <IoSparklesOutline className="h-3.5 w-3.5 text-amber-600" />
              Common
            </button>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-1 rounded-xl border border-stone-200 bg-stone-50 p-1">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`rounded-lg p-1.5 transition ${
                viewMode === 'grid' ? 'bg-white text-[#8b6c3a] shadow-xs' : 'text-stone-400 hover:text-stone-700'
              }`}
              title="Cards Grid View"
            >
              <HiOutlineViewGrid className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`rounded-lg p-1.5 transition ${
                viewMode === 'list' ? 'bg-white text-[#8b6c3a] shadow-xs' : 'text-stone-400 hover:text-stone-700'
              }`}
              title="List / Table View"
            >
              <HiOutlineViewList className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Belongs To Placement Pills */}
        <div className="flex gap-1.5 overflow-x-auto pt-1 pb-0.5 scrollbar-thin">
          {BANNER_TYPES.map((bt) => {
            const Icon = bt.icon;
            const isSelected = selectedType === bt.key;
            const count = counts[bt.key] ?? (bt.key === 'all' ? counts.total : 0);
            return (
              <button
                key={bt.key}
                type="button"
                onClick={() => setSelectedType(bt.key)}
                className={`flex shrink-0 items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold transition cursor-pointer ${
                  isSelected
                    ? 'bg-[#8b6c3a] text-white shadow-xs'
                    : 'bg-stone-50 text-stone-600 hover:bg-stone-100 hover:text-stone-900 border border-stone-200/60'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{bt.label}</span>
                <span
                  className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-stone-200/70 text-stone-600'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ─── 4. MEDIA DISPLAY GRID / LIST ───────────────────────── */}
      {loading ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-stone-200 bg-white p-16 shadow-xs">
          <div className="h-10 w-10 animate-spin rounded-full border-3 border-[#8b6c3a] border-t-transparent"></div>
          <p className="mt-4 text-xs font-medium text-stone-500">Loading gallery images…</p>
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-stone-300 bg-white p-16 text-center shadow-xs">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#8b6c3a]/10 text-[#8b6c3a]">
            <HiOutlinePhotograph className="h-8 w-8" />
          </div>
          <h3 className="mt-4 text-base font-bold text-stone-800">No media found</h3>
          <p className="mt-1 max-w-md text-xs text-stone-500">
            {search || selectedType !== 'all' || selectedTheme !== 'all' || selectedPlatform !== 'all'
              ? 'No images match the current filters. Try adjusting your search query or theme/platform filter.'
              : 'Your gallery is empty. Upload your first Hero Banner or Collection Banner image to get started!'}
          </p>
          <button
            type="button"
            onClick={handleOpenUploadModal}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#8b6c3a] px-5 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-[#765a2d] transition cursor-pointer"
          >
            <HiOutlinePlus className="h-4 w-4" />
            Upload New Image
          </button>
        </div>
      ) : viewMode === 'list' ? (
        /* ─── LIST VIEW ─────────────────────────────────────── */
        <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-xs">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-stone-200 bg-stone-50 text-[11px] font-bold uppercase tracking-wider text-stone-500">
                <th className="py-3 px-4">Preview</th>
                <th className="py-3 px-4">Image Name / Banner Title</th>
                <th className="py-3 px-4">Placement Type</th>
                <th className="py-3 px-4">Target Platform</th>
                <th className="py-3 px-4">Assigned Theme</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-xs text-stone-700">
              {items.map((item) => (
                <tr key={item.id} className="hover:bg-stone-50/70 transition">
                  <td className="py-3 px-4">
                    <div
                      onClick={() => setPreviewItem(item)}
                      className="h-12 w-16 cursor-pointer overflow-hidden rounded-lg border border-stone-200 bg-stone-100 shadow-xs group"
                    >
                      <img
                        src={item.url}
                        alt={item.name}
                        className="h-full w-full object-cover transition group-hover:scale-105"
                      />
                    </div>
                  </td>
                  <td className="py-3 px-4 font-semibold text-stone-900">
                    <div className="flex flex-col">
                      <span className="truncate max-w-xs">{item.typeLabel || item.placement}</span>
                      {item.categoryName && (
                        <span className="text-[11px] text-stone-400">Category: {item.categoryName}</span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-stone-100 px-2.5 py-1 text-[11px] font-semibold text-stone-700">
                      {item.typeLabel}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    {item.platform === 'common' ? (
                      <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700 border border-amber-200">
                        <IoSparklesOutline className="h-3 w-3 text-amber-600" /> Common (Web & App)
                      </span>
                    ) : item.platform === 'mobile' || item.platform === 'app' ? (
                      <span className="inline-flex items-center gap-1 rounded-md bg-sky-50 px-2 py-0.5 text-[10px] font-semibold text-sky-700 border border-sky-200">
                        <HiOutlineDeviceMobile className="h-3 w-3" /> Mobile App
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-md bg-stone-100 px-2 py-0.5 text-[10px] font-semibold text-stone-700">
                        <HiOutlineDesktopComputer className="h-3 w-3" /> Web Desktop
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        item.isThemeLive
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : 'bg-stone-100 text-stone-700'
                      }`}
                    >
                      {item.isThemeLive && <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>}
                      {item.themeName || 'Global'}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <button
                      type="button"
                      onClick={() => handleToggleStatus(item)}
                      className="inline-flex items-center gap-2 group cursor-pointer"
                      title={`Click to set ${item.status === 'active' ? 'inactive' : 'active'}`}
                    >
                      <div
                        className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors duration-200 ease-in-out ${
                          item.status === 'active' ? 'bg-[#8b6c3a]' : 'bg-stone-300'
                        }`}
                      >
                        <span
                          className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-md transition duration-200 ease-in-out ${
                            item.status === 'active' ? 'translate-x-4.5' : 'translate-x-1'
                          }`}
                        />
                      </div>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide capitalize ${
                          item.status === 'active'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-stone-100 text-stone-500 border border-stone-200'
                        }`}
                      >
                        {item.status || 'active'}
                      </span>
                    </button>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => copyToClipboard(item.url)}
                        className="rounded-lg p-1.5 text-stone-400 hover:bg-stone-100 hover:text-stone-700 transition"
                        title="Copy Image URL"
                      >
                        <HiOutlineClipboardCopy className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(item)}
                        className="rounded-lg p-1.5 text-stone-400 hover:bg-amber-50 hover:text-[#8b6c3a] transition"
                        title="Edit Details"
                      >
                        <HiOutlinePencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setPreviewItem(item)}
                        className="rounded-lg p-1.5 text-stone-400 hover:bg-stone-100 hover:text-stone-700 transition"
                        title="Inspect Full Image"
                      >
                        <HiOutlineEye className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteConfirmItem(item)}
                        className="rounded-lg p-1.5 text-rose-400 hover:bg-rose-50 hover:text-rose-600 transition"
                        title="Remove Media Item"
                      >
                        <HiOutlineTrash className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        /* ─── GRID VIEW ─────────────────────────────────────── */
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4">
          {items.map((item) => {
            const isHero = item.type === 'herobanner';
            const isCollection = item.type === 'collectionbanner';

            return (
              <div
                key={item.id}
                className="group relative flex flex-col rounded-3xl border border-stone-200 bg-white shadow-xs hover:shadow-lg transition-all duration-300 hover:border-stone-300 overflow-hidden"
              >
                {/* Image Media Box */}
                <div className="relative aspect-4/3 w-full bg-stone-100/70 overflow-hidden">
                  <img
                    src={item.url}
                    alt={item.name}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />

                  {/* Hover Overlay with Action Buttons */}
                  <div className="absolute inset-0 flex items-center justify-center gap-2 bg-stone-900/40 opacity-0 backdrop-blur-xs transition group-hover:opacity-100">
                    <button
                      type="button"
                      onClick={() => setPreviewItem(item)}
                      className="rounded-full bg-white p-2.5 text-stone-700 shadow-lg hover:bg-stone-50 transition hover:scale-110"
                      title="Inspect Image"
                    >
                      <HiOutlineEye className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(item)}
                      className="rounded-full bg-white p-2.5 text-amber-700 shadow-lg hover:bg-amber-50 transition hover:scale-110"
                      title="Edit Media Item"
                    >
                      <HiOutlinePencil className="h-4 w-4 text-[#8b6c3a]" />
                    </button>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(item.url)}
                      className="rounded-full bg-white p-2.5 text-stone-700 shadow-lg hover:bg-stone-50 transition hover:scale-110"
                      title="Copy Image URL"
                    >
                      <HiOutlineClipboardCopy className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteConfirmItem(item)}
                      className="rounded-full bg-rose-500/90 p-2.5 text-white shadow-lg hover:bg-rose-600 transition hover:scale-110"
                      title="Remove from Theme"
                    >
                      <HiOutlineTrash className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Top-Left: Belongs To Badge */}
                  <div className="absolute left-2.5 top-2.5">
                    <span
                      className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[10px] font-bold shadow-xs backdrop-blur-md ${
                        isHero
                          ? 'bg-amber-900/80 text-amber-100 border border-amber-600/30'
                          : isCollection
                          ? 'bg-rose-900/80 text-rose-100 border border-rose-600/30'
                          : 'bg-stone-900/80 text-stone-100 border border-stone-700/30'
                      }`}
                    >
                      {item.typeLabel}
                    </span>
                  </div>

                  {/* Top-Right: Platform Badge */}
                  <div className="absolute right-2.5 top-2.5">
                    <span className="inline-flex items-center gap-1 rounded-md bg-stone-900/80 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur-md">
                      {item.platform === 'common' ? (
                        <>
                          <IoSparklesOutline className="h-3 w-3 text-amber-300" /> Common
                        </>
                      ) : item.platform === 'app' || item.platform === 'mobile' ? (
                        <>
                          <HiOutlineDeviceMobile className="h-3 w-3 text-sky-300" /> App
                        </>
                      ) : (
                        <>
                          <HiOutlineDesktopComputer className="h-3 w-3 text-stone-300" /> Web
                        </>
                      )}
                    </span>
                  </div>
                </div>

                {/* Card Info Content */}
                <div className="flex flex-1 flex-col justify-between p-3.5">
                  <div>
                    <h4 className="text-xs font-bold text-stone-900 truncate" title={item.name}>
                      {item.typeLabel || item.placement}
                    </h4>

                    {item.categoryName && (
                      <p className="mt-0.5 text-[11px] text-stone-500 flex items-center gap-1">
                        <HiOutlineTag className="h-3 w-3 text-stone-400" />
                        Category: <strong className="text-stone-700">{item.categoryName}</strong>
                      </p>
                    )}
                  </div>

                  {/* Theme info tag and quick copy */}
                  <div className="mt-3 flex items-center justify-between border-t border-stone-100 pt-2.5">
                    <div className="flex items-center gap-1.5 overflow-hidden">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold truncate ${
                          item.isThemeLive
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : 'bg-stone-100 text-stone-700'
                        }`}
                      >
                        {item.isThemeLive && <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>}
                        <span className="truncate">{item.themeName || 'Global'}</span>
                      </span>

                      {/* Status Toggle Switch */}
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(item)}
                        className="inline-flex items-center gap-1 cursor-pointer shrink-0"
                        title={`Click to set ${item.status === 'active' ? 'inactive' : 'active'}`}
                      >
                        <div
                          className={`relative inline-flex h-3.5 w-6 shrink-0 items-center rounded-full transition-colors ${
                            item.status === 'active' ? 'bg-[#8b6c3a]' : 'bg-stone-300'
                          }`}
                        >
                          <span
                            className={`inline-block h-2 w-2 transform rounded-full bg-white transition ${
                              item.status === 'active' ? 'translate-x-3.5' : 'translate-x-0.5'
                            }`}
                          />
                        </div>
                        <span
                          className={`text-[9px] font-bold uppercase tracking-wider ${
                            item.status === 'active' ? 'text-emerald-700' : 'text-stone-400'
                          }`}
                        >
                          {item.status || 'active'}
                        </span>
                      </button>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(item)}
                        className="rounded-lg p-1.5 text-stone-400 hover:bg-stone-100 hover:text-[#8b6c3a] transition cursor-pointer"
                        title="Edit Details"
                      >
                        <HiOutlinePencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(item.url)}
                        className="rounded-lg p-1.5 text-stone-400 hover:bg-stone-100 hover:text-stone-700 transition cursor-pointer"
                        title="Copy CDN Link"
                      >
                        <HiOutlineClipboardCopy className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between rounded-2xl border border-stone-200 bg-white p-4 shadow-xs">
          <div className="text-xs text-stone-500">
            Showing <span className="font-bold text-stone-800">{(page - 1) * pageSize + 1}</span> to{' '}
            <span className="font-bold text-stone-800">{Math.min(page * pageSize, totalItems)}</span> of{' '}
            <span className="font-bold text-stone-800">{totalItems}</span> assets
          </div>
          <Pagination currentPage={page} totalPages={totalPages} onPageChange={(p) => setPage(p)} />
        </div>
      )}

      {/* ─── 5. UPLOAD & ASSIGN MODAL (CENTRALIZED LUXURY MODAL) ─── */}
      {uploadModalOpen &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 bg-stone-900/60 backdrop-blur-sm overflow-y-auto animate-fadeIn"
            onClick={() => {
              if (!isUploading) setUploadModalOpen(false);
            }}
          >
            <div
              className="relative w-full max-w-xl max-h-[88vh] my-auto flex flex-col rounded-3xl border border-stone-200 bg-white shadow-2xl overflow-hidden animate-scaleUp"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-stone-100 px-6 py-4 shrink-0 bg-white">
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-stone-900 flex items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#8b6c3a]/15 text-[#8b6c3a]">
                      <HiOutlineUpload className="h-5 w-5" />
                    </span>
                    Upload Image & Assign to Theme
                  </h3>
                  <p className="mt-0.5 text-xs text-stone-500">
                    Select website theme, placement type, target platform, and upload image.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (!isUploading) setUploadModalOpen(false);
                  }}
                  className="rounded-xl p-2 text-stone-400 hover:bg-stone-100 hover:text-stone-700 transition cursor-pointer"
                >
                  <HiOutlineX className="h-5 w-5" />
                </button>
              </div>

              {/* Modal Scrollable Form Body */}
              <form onSubmit={handleUploadAndAssign} className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
                {/* STEP 1: SELECT THEME */}
                <div className="rounded-2xl border border-stone-200 bg-stone-50/70 p-4 space-y-2">
                  <label className="block text-xs font-bold text-stone-800">
                    1. Select Website Theme <span className="text-rose-500">*</span>
                  </label>
                  <p className="text-[11px] text-stone-500">
                    Choose which storefront theme this image belongs to.
                  </p>
                  <Dropdown
                    size="field"
                    showStatusDot={true}
                    value={uploadThemeId}
                    onChange={(val) => setUploadThemeId(val || '')}
                    options={modalThemeOptions}
                    placeholder="Select a website theme…"
                    portal={true}
                    menuClassName="z-[10000]"
                  />
                </div>

                {/* STEP 2: SELECT PLACEMENT TYPE VIA COMMON DROPDOWN */}
                <div className="rounded-2xl border border-stone-200 bg-stone-50/70 p-4 space-y-2">
                  <label className="block text-xs font-bold text-stone-800">
                    2. Image Placement Type <span className="text-rose-500">*</span>
                  </label>
                  <p className="text-[11px] text-stone-500">
                    Select where this image belongs (Hero Banner, Collection Banner, Category Banner, etc.).
                  </p>
                  <Dropdown
                    size="field"
                    value={uploadType}
                    onChange={(val) => setUploadType(val || 'herobanner')}
                    options={placementTypeOptions}
                    placeholder="Select image placement type…"
                    portal={true}
                    menuClassName="z-[10000]"
                  />
                </div>

                {/* STEP 3: TARGET PLATFORM (WEB / APP / COMMON) */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-stone-800">
                    3. Target Platform <span className="text-rose-500">*</span>
                  </label>
                  <p className="text-[11px] text-stone-500">
                    Select where this image will be displayed on the platform.
                  </p>

                  <div className="grid grid-cols-3 gap-2.5">
                    {[
                      {
                        id: 'web',
                        label: 'Web',
                        sublabel: 'Storefront Web',
                        icon: HiOutlineDesktopComputer,
                      },
                      {
                        id: 'app',
                        label: 'App',
                        sublabel: 'Mobile App',
                        icon: HiOutlineDeviceMobile,
                      },
                      {
                        id: 'common',
                        label: 'Common',
                        sublabel: 'Web & App',
                        icon: IoSparklesOutline,
                      },
                    ].map((plat) => {
                      const isSelected = uploadPlatform === plat.id;
                      const Icon = plat.icon;
                      return (
                        <button
                          key={plat.id}
                          type="button"
                          onClick={() => setUploadPlatform(plat.id)}
                          className={`group flex flex-col items-center justify-center rounded-2xl border p-3 text-center transition cursor-pointer ${
                            isSelected
                              ? 'border-[#8b6c3a] bg-[#8b6c3a]/10 text-[#8b6c3a] font-bold shadow-xs ring-1 ring-[#8b6c3a]/30'
                              : 'border-stone-200 bg-stone-50/50 text-stone-600 hover:border-stone-300 hover:bg-stone-50'
                          }`}
                        >
                          <div
                            className={`flex h-8 w-8 items-center justify-center rounded-xl transition ${
                              isSelected
                                ? 'bg-[#8b6c3a] text-white shadow-xs'
                                : 'bg-white text-stone-500 border border-stone-200 group-hover:text-stone-800'
                            }`}
                          >
                            <Icon className="h-4 w-4" />
                          </div>
                          <span className="mt-1.5 text-xs font-bold">{plat.label}</span>
                          <span className="text-[10px] text-stone-400">{plat.sublabel}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* STEP 4: FILE UPLOAD ZONE */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-stone-800">
                    4. Upload Image File <span className="text-rose-500">*</span>
                  </label>

                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-stone-300 bg-stone-50/70 p-6 text-center hover:border-[#8b6c3a] hover:bg-stone-50 transition cursor-pointer"
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />

                    {filePreviewUrl ? (
                      <div className="flex flex-col items-center">
                        <img
                          src={filePreviewUrl}
                          alt="Preview"
                          className="max-h-48 rounded-xl object-contain border border-stone-200 shadow-xs"
                        />
                        <div className="mt-3 flex items-center gap-2">
                          <span className="text-xs font-semibold text-stone-800">{selectedFile?.name}</span>
                          <span className="text-[11px] text-stone-400">({formatBytes(selectedFile?.size)})</span>
                        </div>
                        <span className="mt-1 text-[11px] text-[#8b6c3a] font-bold">Click to change file</span>
                      </div>
                    ) : (
                      <>
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#8b6c3a]/10 text-[#8b6c3a]">
                          <HiOutlineUpload className="h-6 w-6" />
                        </div>
                        <p className="mt-2 text-xs font-bold text-stone-800">
                          Click or drag and drop image here
                        </p>
                        <p className="mt-1 text-[11px] text-stone-400">
                          Recommended format: WebP, PNG, JPG. Automatically compressed and optimized.
                        </p>
                      </>
                    )}
                  </div>
                </div>

                {/* Upload Progress Bar */}
                {isUploading && (
                  <div className="space-y-1.5 rounded-xl border border-stone-200 bg-stone-50 p-3">
                    <div className="flex justify-between text-xs font-semibold text-stone-700">
                      <span>Uploading and assigning image…</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-stone-200">
                      <div
                        className="h-full bg-gradient-to-r from-[#8b6c3a] to-emerald-500 transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      ></div>
                    </div>
                  </div>
                )}

                {/* Modal Action Buttons */}
                <div className="flex items-center justify-end gap-3 border-t border-stone-100 pt-4 shrink-0">
                  <button
                    type="button"
                    onClick={() => setUploadModalOpen(false)}
                    disabled={isUploading}
                    className="rounded-xl border border-stone-200 px-4 py-2.5 text-xs font-semibold text-stone-700 hover:bg-stone-50 transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isUploading || !selectedFile}
                    className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#8b6c3a] to-[#765a2d] px-6 py-2.5 text-xs font-semibold text-white shadow-md shadow-[#8b6c3a]/20 hover:from-[#765a2d] transition cursor-pointer disabled:opacity-50"
                  >
                    {isUploading ? (
                      <>
                        <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                        Uploading…
                      </>
                    ) : (
                      <>
                        <HiOutlineUpload className="h-4 w-4" />
                        Upload & Assign Image
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}

      {/* ─── 6. IMAGE FULLSCREEN / INSPECTOR MODAL ──────────────── */}
      {previewItem &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 bg-stone-900/80 backdrop-blur-sm animate-fadeIn"
            onClick={() => setPreviewItem(null)}
          >
            <div
              className="relative flex max-h-[90vh] w-full max-w-4xl flex-col rounded-3xl border border-stone-200 bg-white shadow-2xl overflow-hidden animate-scaleUp"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-stone-100 px-6 py-4">
                <div>
                  <h3 className="text-base font-bold text-stone-900">{previewItem.typeLabel || previewItem.placement}</h3>
                  <span className="text-xs text-stone-400">
                    {previewItem.typeLabel} · {previewItem.platform === 'common' ? 'Common (Web & App)' : previewItem.platform === 'mobile' || previewItem.platform === 'app' ? 'Mobile App' : 'Web Desktop'} · Theme: {previewItem.themeName || 'Global'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setPreviewItem(null)}
                  className="rounded-xl p-2 text-stone-400 hover:bg-stone-100 hover:text-stone-700 transition cursor-pointer"
                >
                  <HiOutlineX className="h-5 w-5" />
                </button>
              </div>

              {/* Modal Body: Image & Metadata */}
              <div className="flex flex-1 flex-col overflow-y-auto p-6 md:flex-row gap-6">
                <div className="flex flex-1 items-center justify-center rounded-2xl bg-stone-100/70 p-4 border border-stone-200">
                  <img
                    src={previewItem.url}
                    alt={previewItem.name}
                    className="max-h-[60vh] max-w-full rounded-xl object-contain shadow-sm"
                  />
                </div>

                {/* Inspector Details Panel */}
                <div className="w-full md:w-80 space-y-4">
                  <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4 space-y-3 text-xs">
                    <h5 className="font-bold uppercase tracking-wider text-stone-500 text-[10px]">Image Details</h5>
                    <div>
                      <span className="font-semibold text-stone-700 block">Placement Type</span>
                      <span className="text-stone-900 font-bold">{previewItem.typeLabel}</span>
                    </div>
                    <div>
                      <span className="font-semibold text-stone-700 block">Theme Assignment</span>
                      <span className="text-stone-900">{previewItem.themeName || 'Global / Unassigned'}</span>
                    </div>
                    <div>
                      <span className="font-semibold text-stone-700 block">Target Platform</span>
                      <span className="text-stone-900 font-bold capitalize">
                        {previewItem.platform === 'common'
                          ? 'Common (Web & App Universal)'
                          : previewItem.platform === 'mobile' || previewItem.platform === 'app'
                          ? 'Mobile App'
                          : 'Web Desktop'}
                      </span>
                    </div>
                    <div>
                      <span className="font-semibold text-stone-700 block">Status</span>
                      <span className="inline-flex items-center gap-1 text-emerald-700 font-bold">
                        <span className="h-2 w-2 rounded-full bg-emerald-500"></span> Active
                      </span>
                    </div>
                  </div>

                  {/* Actions in Inspector */}
                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={() => copyToClipboard(previewItem.url)}
                      className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-xs font-semibold text-stone-800 hover:bg-stone-50 transition cursor-pointer"
                    >
                      <HiOutlineClipboardCopy className="h-4 w-4" />
                      Copy Image CDN URL
                    </button>
                    <a
                      href={previewItem.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-stone-900 px-4 py-2.5 text-xs font-semibold text-white hover:bg-stone-800 transition text-center"
                    >
                      <HiOutlineExternalLink className="h-4 w-4" />
                      Open Full Image in New Tab
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* ─── 7. DELETE CONFIRMATION MODAL ───────────────────────── */}
      {deleteConfirmItem &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-fadeIn"
            onClick={() => {
              if (!isDeleting) setDeleteConfirmItem(null);
            }}
          >
            <div
              className="relative w-full max-w-md rounded-3xl border border-stone-200 bg-white p-6 shadow-2xl animate-scaleUp"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
                <HiOutlineTrash className="h-6 w-6" />
              </div>
              <h3 className="mt-4 text-base font-bold text-stone-900">Remove Media Item</h3>
              <p className="mt-1.5 text-xs text-stone-500">
                Are you sure you want to remove &ldquo;{deleteConfirmItem.typeLabel || deleteConfirmItem.placement}&rdquo;?
                This image will be unassigned from its banner and theme.
              </p>

              <div className="mt-6 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setDeleteConfirmItem(null)}
                  disabled={isDeleting}
                  className="rounded-xl border border-stone-200 px-4 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteItem}
                  disabled={isDeleting}
                  className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-700 transition cursor-pointer disabled:opacity-50"
                >
                  {isDeleting ? (
                    <>
                      <div className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                      Removing…
                    </>
                  ) : (
                    'Confirm Delete'
                  )}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
      {/* ─── 8. EDIT GALLERY ITEM MODAL ────────────────────────── */}
      {editingItem &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 bg-stone-900/60 backdrop-blur-sm overflow-y-auto animate-fadeIn"
            onClick={() => {
              if (!isUpdating) setEditingItem(null);
            }}
          >
            <div
              className="relative w-full max-w-lg max-h-[88vh] my-auto flex flex-col rounded-3xl border border-stone-200 bg-white shadow-2xl overflow-hidden animate-scaleUp"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-stone-100 px-6 py-4 shrink-0 bg-white">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#8b6c3a]/15 text-[#8b6c3a]">
                    <HiOutlinePencil className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-stone-900">Edit Media Item</h3>
                    <p className="text-xs text-stone-500">Update placement, theme assignment, and platform.</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (!isUpdating) setEditingItem(null);
                  }}
                  className="rounded-xl p-2 text-stone-400 hover:bg-stone-100 hover:text-stone-700 transition cursor-pointer"
                >
                  <HiOutlineX className="h-5 w-5" />
                </button>
              </div>

              {/* Form Body */}
              <form onSubmit={handleSaveEdit} className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
                {/* Media Preview Banner */}
                <div className="flex items-center gap-3 rounded-2xl border border-stone-200 bg-stone-50/80 p-3">
                  <img
                    src={editingItem.url}
                    alt={editingItem.name}
                    className="h-14 w-20 rounded-xl object-cover border border-stone-200 bg-white shadow-2xs"
                  />
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] uppercase font-bold text-stone-400 block tracking-wider">Image Asset</span>
                    <p className="text-xs font-bold text-stone-900 truncate">{editingItem.typeLabel || editingItem.placement}</p>
                    <span className="text-[10px] text-stone-500 truncate block">{editingItem.url}</span>
                  </div>
                </div>

                {/* Theme Dropdown */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-stone-800">Assigned Website Theme</label>
                  <Dropdown
                    size="field"
                    showStatusDot={true}
                    value={editThemeId}
                    onChange={(val) => setEditThemeId(val || '')}
                    options={modalThemeOptions}
                    placeholder="Select theme…"
                    portal={true}
                    menuClassName="z-[10000]"
                  />
                </div>

                {/* Placement Type Dropdown */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-stone-800">Image Placement Type</label>
                  <Dropdown
                    size="field"
                    value={editPlacement}
                    onChange={(val) => setEditPlacement(val || 'herobanner')}
                    options={placementTypeOptions}
                    placeholder="Select placement type…"
                    portal={true}
                    menuClassName="z-[10000]"
                  />
                </div>

                {/* Target Platform Selection */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-stone-800">Target Platform</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'web', label: 'Web', icon: HiOutlineDesktopComputer },
                      { id: 'app', label: 'App', icon: HiOutlineDeviceMobile },
                      { id: 'common', label: 'Common', icon: IoSparklesOutline },
                    ].map((plat) => {
                      const isSelected = editPlatform === plat.id;
                      const Icon = plat.icon;
                      return (
                        <button
                          key={plat.id}
                          type="button"
                          onClick={() => setEditPlatform(plat.id)}
                          className={`flex items-center justify-center gap-1.5 rounded-xl border py-2 px-3 text-xs font-bold transition cursor-pointer ${
                            isSelected
                              ? 'border-[#8b6c3a] bg-[#8b6c3a]/10 text-[#8b6c3a] shadow-xs'
                              : 'border-stone-200 bg-stone-50/50 text-stone-600 hover:bg-stone-100'
                          }`}
                        >
                          <Icon className="h-3.5 w-3.5" />
                          <span>{plat.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Status Toggle */}
                <div className="flex items-center justify-between rounded-2xl border border-stone-200 bg-stone-50/70 p-3.5">
                  <div>
                    <label className="block text-xs font-bold text-stone-800">Media Status</label>
                    <span className="text-[11px] text-stone-500">Enable or disable this media item</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEditStatus((prev) => (prev === 'active' ? 'inactive' : 'active'))}
                    className="inline-flex items-center gap-2 cursor-pointer"
                  >
                    <div
                      className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${
                        editStatus === 'active' ? 'bg-[#8b6c3a]' : 'bg-stone-300'
                      }`}
                    >
                      <span
                        className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition ${
                          editStatus === 'active' ? 'translate-x-4.5' : 'translate-x-1'
                        }`}
                      />
                    </div>
                    <span className="text-xs font-bold capitalize text-stone-700">{editStatus}</span>
                  </button>
                </div>

                {/* Modal Footer */}
                <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-100">
                  <button
                    type="button"
                    onClick={() => setEditingItem(null)}
                    disabled={isUpdating}
                    className="rounded-xl border border-stone-200 px-4 py-2.5 text-xs font-semibold text-stone-700 hover:bg-stone-50 transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isUpdating}
                    className="inline-flex items-center gap-2 rounded-xl bg-[#8b6c3a] px-5 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-[#765a2d] transition cursor-pointer disabled:opacity-50"
                  >
                    {isUpdating ? (
                      <>
                        <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                        Saving…
                      </>
                    ) : (
                      'Save Changes'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
