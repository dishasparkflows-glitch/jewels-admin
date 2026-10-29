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
  HiOutlineDownload,
  HiOutlineClipboardCopy,
  HiOutlineInformationCircle,
  HiOutlineGift,
  HiOutlineCode,
  HiOutlineArrowRight,
  HiOutlineClock,
  HiOutlineChevronDown,
  HiOutlineChevronRight,
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

const DEMO_GALLERY_ITEMS = [
  {
    id: 'demo-1',
    fileName: 'ring-hero-01.jpg',
    name: 'ring-hero-01.jpg',
    url: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=1200&q=80',
    type: 'celebrate',
    typeLabel: 'Celebrate & Gifts',
    platform: 'web',
    width: 1920,
    height: 1080,
    size: 2516582,
    status: 'active',
  },
  {
    id: 'demo-2',
    fileName: 'collection-ring-02.jpg',
    name: 'collection-ring-02.jpg',
    url: 'https://images.unsplash.com/photo-1603561591411-07134e71a2a9?auto=format&fit=crop&w=1200&q=80',
    type: 'asset',
    typeLabel: 'Media Library Asset',
    platform: 'common',
    width: 1920,
    height: 1080,
    size: 1887436,
    status: 'active',
  },
  {
    id: 'demo-3',
    fileName: 'necklace-banner.jpg',
    name: 'necklace-banner.jpg',
    url: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=1200&q=80',
    type: 'asset',
    typeLabel: 'Media Library Asset',
    platform: 'common',
    width: 1920,
    height: 1080,
    size: 2202009,
    status: 'active',
  },
  {
    id: 'demo-4',
    fileName: 'pendant-collection.jpg',
    name: 'pendant-collection.jpg',
    url: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=1200&q=80',
    type: 'celebrate',
    typeLabel: 'Celebrate & Gifts',
    platform: 'web',
    width: 1920,
    height: 1080,
    size: 1992294,
    status: 'active',
  },
  {
    id: 'demo-5',
    fileName: 'earrings-hero.jpg',
    name: 'earrings-hero.jpg',
    url: 'https://images.unsplash.com/photo-1630019852942-f89202989a59?auto=format&fit=crop&w=1200&q=80',
    type: 'herobanner',
    typeLabel: 'Hero Banner',
    platform: 'web',
    width: 1920,
    height: 1080,
    size: 1782579,
    status: 'active',
  },
  {
    id: 'demo-6',
    fileName: 'bracelet-collection.jpg',
    name: 'bracelet-collection.jpg',
    url: 'https://images.unsplash.com/photo-1611591475152-473523dd665e?auto=format&fit=crop&w=1200&q=80',
    type: 'collectionbanner',
    typeLabel: 'Collection Banner',
    platform: 'app',
    width: 1920,
    height: 1080,
    size: 2097152,
    status: 'active',
  },
  {
    id: 'demo-7',
    fileName: 'diwali-offer.jpg',
    name: 'diwali-offer.jpg',
    url: 'https://images.unsplash.com/photo-1602751584552-8ba73aad10e1?auto=format&fit=crop&w=1200&q=80',
    type: 'offerbanner',
    typeLabel: 'Offer Banner',
    platform: 'web',
    width: 1920,
    height: 1080,
    size: 2411724,
    status: 'active',
  },
  {
    id: 'demo-8',
    fileName: 'rings-category.jpg',
    name: 'rings-category.jpg',
    url: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=1200&q=80',
    type: 'categorybanner',
    typeLabel: 'Category Banner',
    platform: 'common',
    width: 1920,
    height: 1080,
    size: 1677721,
    status: 'active',
  },
];

function getMediaDisplayInfo(item) {
  let fileName = item.fileName || item.name;
  if (!fileName && item.key) {
    fileName = item.key.split('/').pop();
  }
  if (!fileName && item.url) {
    try {
      const urlObj = new URL(item.url);
      fileName = urlObj.pathname.split('/').pop();
    } catch {
      fileName = item.url.split('/').pop()?.split('?')[0];
    }
  }
  if (!fileName || fileName.length > 40 || /^[a-f0-9-]{24,}/i.test(fileName)) {
    const cleanPlacement = (item.typeLabel || item.placement || 'media').toLowerCase().replace(/[^a-z0-9]/g, '-');
    fileName = `${cleanPlacement}-${(item.id || item._id || '').slice(-6) || 'img'}.jpg`;
  }

  return {
    fileName,
  };
}

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
      setTotalItems(data.pagination?.totalDocs || (data.items || []).length);
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

  const displayCounts = {
    total: counts.total || (items.length > 0 ? items.length : 20),
    herobanner: counts.herobanner || (items.length > 0 ? 0 : 3),
    collectionbanner: counts.collectionbanner || (items.length > 0 ? 0 : 4),
    categorybanner: counts.categorybanner || 0,
    offerbanner: counts.offerbanner || 0,
    celebrate: counts.celebrate || (items.length > 0 ? 0 : 8),
  };

  const effectiveItems = useMemo(() => {
    if (items.length > 0) return items;
    return DEMO_GALLERY_ITEMS.filter((item) => {
      if (selectedType !== 'all' && item.type !== selectedType) return false;
      if (selectedPlatform !== 'all' && item.platform !== selectedPlatform && item.platform !== 'common') return false;
      if (search && !item.fileName.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [items, selectedType, selectedPlatform, search]);

  const displayTabs = [
    { key: 'all', label: 'All Media', icon: HiOutlinePhotograph, count: displayCounts.total },
    { key: 'herobanner', label: 'Hero Banners', icon: HiOutlineDesktopComputer, count: displayCounts.herobanner },
    { key: 'collectionbanner', label: 'Collection Banners', icon: HiOutlineTag, count: displayCounts.collectionbanner },
    { key: 'categorybanner', label: 'Category Banners', icon: HiOutlineViewGrid, count: displayCounts.categorybanner },
    { key: 'offerbanner', label: 'Offer Banners', icon: HiOutlineGift, count: displayCounts.offerbanner },
    { key: 'celebrate', label: 'Celebrate & Gifts', icon: IoDiamondOutline, count: displayCounts.celebrate },
  ];

  return (
    <div className="space-y-2.5 sm:space-y-3">
      {/* ─── 1. COMPACT MODULE HEADER (Like Jewellery Products) ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <h1 className="text-lg sm:text-xl font-bold tracking-tight text-stone-900 leading-tight">
            Media & Theme Gallery
          </h1>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-800">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            Live: {activeThemeObj?.name || 'diwali 2026'}
          </span>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchGallery}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-stone-50 border border-stone-200 text-stone-700 rounded-lg text-xs font-semibold shadow-2xs transition cursor-pointer"
            title="Refresh Gallery"
          >
            <HiOutlineRefresh className={`w-3.5 h-3.5 stroke-2 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            type="button"
            onClick={handleOpenUploadModal}
            style={{ backgroundColor: 'var(--theme-primary, #8b6f4e)' }}
            className="flex items-center gap-1.5 px-3.5 py-1.5 hover:brightness-95 active:scale-[0.98] text-white rounded-lg text-xs font-semibold tracking-wide transition-all shadow-xs hover:shadow cursor-pointer"
          >
            <HiOutlinePlus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Upload Images</span>
          </button>
        </div>
      </div>

      {/* ─── 2. STAT CARDS ROW (Matching Jewellery Products boxes) ─── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-2.5">
        {/* Total Media */}
        <div
          onClick={() => setSelectedType('all')}
          className={`bg-white rounded-lg border px-3 py-1.5 sm:py-2 shadow-2xs flex items-center gap-2.5 transition-all cursor-pointer ${
            selectedType === 'all'
              ? 'border-[#8b6f4e] ring-1 ring-[#8b6f4e]/30'
              : 'border-stone-200/90 hover:border-stone-300 hover:shadow-xs'
          }`}
        >
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#fcf5e5] text-[#b45309] border border-amber-200/50 flex items-center justify-center shrink-0">
            <IoLayersOutline className="w-3.5 h-3.5 stroke-[2]" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-semibold text-stone-500 truncate leading-none">Total Media</p>
            <p className="text-sm sm:text-base font-bold text-stone-900 tracking-tight mt-0.5 truncate leading-none">
              {displayCounts.total}
            </p>
          </div>
        </div>

        {/* Hero Banners */}
        <div
          onClick={() => setSelectedType('herobanner')}
          className={`bg-white rounded-lg border px-3 py-1.5 sm:py-2 shadow-2xs flex items-center gap-2.5 transition-all cursor-pointer ${
            selectedType === 'herobanner'
              ? 'border-[#8b6f4e] ring-1 ring-[#8b6f4e]/30'
              : 'border-stone-200/90 hover:border-stone-300 hover:shadow-xs'
          }`}
        >
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#fff1f2] text-[#e11d48] border border-rose-200/50 flex items-center justify-center shrink-0">
            <HiOutlineDesktopComputer className="w-3.5 h-3.5 stroke-[2]" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-semibold text-stone-500 truncate leading-none">Hero Banners</p>
            <p className="text-sm sm:text-base font-bold text-stone-900 tracking-tight mt-0.5 truncate leading-none">
              {displayCounts.herobanner}
            </p>
          </div>
        </div>

        {/* Collection Banners */}
        <div
          onClick={() => setSelectedType('collectionbanner')}
          className={`bg-white rounded-lg border px-3 py-1.5 sm:py-2 shadow-2xs flex items-center gap-2.5 transition-all cursor-pointer ${
            selectedType === 'collectionbanner'
              ? 'border-[#8b6f4e] ring-1 ring-[#8b6f4e]/30'
              : 'border-stone-200/90 hover:border-stone-300 hover:shadow-xs'
          }`}
        >
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#eff6ff] text-[#2563eb] border border-blue-200/50 flex items-center justify-center shrink-0">
            <HiOutlineTag className="w-3.5 h-3.5 stroke-[2]" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-semibold text-stone-500 truncate leading-none">Collection Banners</p>
            <p className="text-sm sm:text-base font-bold text-stone-900 tracking-tight mt-0.5 truncate leading-none">
              {displayCounts.collectionbanner}
            </p>
          </div>
        </div>

        {/* Category Banners */}
        <div
          onClick={() => setSelectedType('categorybanner')}
          className={`bg-white rounded-lg border px-3 py-1.5 sm:py-2 shadow-2xs flex items-center gap-2.5 transition-all cursor-pointer ${
            selectedType === 'categorybanner'
              ? 'border-[#8b6f4e] ring-1 ring-[#8b6f4e]/30'
              : 'border-stone-200/90 hover:border-stone-300 hover:shadow-xs'
          }`}
        >
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#faf5ff] text-[#9333ea] border border-purple-200/50 flex items-center justify-center shrink-0">
            <HiOutlineViewGrid className="w-3.5 h-3.5 stroke-[2]" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-semibold text-stone-500 truncate leading-none">Category Banners</p>
            <p className="text-sm sm:text-base font-bold text-stone-900 tracking-tight mt-0.5 truncate leading-none">
              {displayCounts.categorybanner}
            </p>
          </div>
        </div>

        {/* Offer Banners */}
        <div
          onClick={() => setSelectedType('offerbanner')}
          className={`bg-white rounded-lg border px-3 py-1.5 sm:py-2 shadow-2xs flex items-center gap-2.5 transition-all cursor-pointer ${
            selectedType === 'offerbanner'
              ? 'border-[#8b6f4e] ring-1 ring-[#8b6f4e]/30'
              : 'border-stone-200/90 hover:border-stone-300 hover:shadow-xs'
          }`}
        >
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#fef6ee] text-[#ea580c] border border-orange-200/50 flex items-center justify-center shrink-0">
            <HiOutlineGift className="w-3.5 h-3.5 stroke-[2]" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-semibold text-stone-500 truncate leading-none">Offer Banners</p>
            <p className="text-sm sm:text-base font-bold text-stone-900 tracking-tight mt-0.5 truncate leading-none">
              {displayCounts.offerbanner}
            </p>
          </div>
        </div>

        {/* Celebrate & Gifts */}
        <div
          onClick={() => setSelectedType('celebrate')}
          className={`bg-white rounded-lg border px-3 py-1.5 sm:py-2 shadow-2xs flex items-center gap-2.5 transition-all cursor-pointer ${
            selectedType === 'celebrate'
              ? 'border-[#8b6f4e] ring-1 ring-[#8b6f4e]/30'
              : 'border-stone-200/90 hover:border-stone-300 hover:shadow-xs'
          }`}
        >
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#effaf2] text-[#16a34a] border border-emerald-200/50 flex items-center justify-center shrink-0">
            <IoDiamondOutline className="w-3.5 h-3.5 stroke-[2]" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-semibold text-stone-500 truncate leading-none">Celebrate & Gifts</p>
            <p className="text-sm sm:text-base font-bold text-stone-900 tracking-tight mt-0.5 truncate leading-none">
              {displayCounts.celebrate}
            </p>
          </div>
        </div>
      </div>

      {/* ─── 3. FILTER & TOOLBAR (Compact Layout) ─── */}
      <div className="space-y-2 rounded-lg border border-stone-200/90 bg-white p-2.5 sm:p-3 shadow-2xs">
        {/* Row 1: Search, Filter Theme, Platform */}
        <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
          {/* Search bar */}
          <div className="relative flex-1">
            <HiOutlineSearch className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by image name, banner title, theme, or placement…"
              className="w-full rounded-md border border-stone-200 bg-stone-50/70 pl-8.5 pr-7 py-1.5 text-xs text-stone-800 placeholder-stone-400 outline-none transition focus:border-[#8b6f4e] focus:bg-white focus:ring-1 focus:ring-[#8b6f4e]/20"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
              >
                <HiOutlineX className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Theme Dropdown Filter */}
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-[11px] font-semibold text-stone-600 whitespace-nowrap">Filter Theme:</span>
            <div className="w-52">
              <Dropdown
                size="sm"
                showStatusDot={true}
                value={selectedTheme}
                onChange={(val) => setSelectedTheme(val || 'all')}
                options={filterThemeOptions}
                placeholder="All Website Themes"
              />
            </div>
          </div>

          {/* Platform Filter: All, Web, App, Common */}
          <div className="flex items-center gap-1 rounded-md border border-stone-200 bg-stone-50 p-0.5 shrink-0">
            <button
              type="button"
              onClick={() => setSelectedPlatform('all')}
              className={`rounded px-2.5 py-1 text-xs font-semibold transition cursor-pointer ${
                selectedPlatform === 'all'
                  ? 'bg-white text-stone-900 shadow-2xs'
                  : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setSelectedPlatform('web')}
              className={`rounded px-2.5 py-1 text-xs font-semibold transition flex items-center gap-1 cursor-pointer ${
                selectedPlatform === 'web'
                  ? 'bg-white text-stone-900 shadow-2xs'
                  : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              <HiOutlineDesktopComputer className="h-3 w-3" />
              Web
            </button>
            <button
              type="button"
              onClick={() => setSelectedPlatform('mobile')}
              className={`rounded px-2.5 py-1 text-xs font-semibold transition flex items-center gap-1 cursor-pointer ${
                selectedPlatform === 'mobile'
                  ? 'bg-white text-stone-900 shadow-2xs'
                  : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              <HiOutlineDeviceMobile className="h-3 w-3" />
              App
            </button>
            <button
              type="button"
              onClick={() => setSelectedPlatform('common')}
              className={`rounded px-2.5 py-1 text-xs font-semibold transition flex items-center gap-1 cursor-pointer ${
                selectedPlatform === 'common'
                  ? 'bg-white text-stone-900 shadow-2xs'
                  : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              <IoSparklesOutline className="h-3 w-3 text-amber-600" />
              Common
            </button>
          </div>
        </div>

        {/* Row 2: Placement Tabs & View Mode Toggle */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 border-t border-stone-100">
          {/* Placement Pills */}
          <div className="flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-thin">
            {displayTabs.map((bt) => {
              const Icon = bt.icon;
              const isSelected = selectedType === bt.key;
              return (
                <button
                  key={bt.key}
                  type="button"
                  onClick={() => setSelectedType(bt.key)}
                  style={isSelected ? { backgroundColor: 'var(--theme-primary, #855836)' } : {}}
                  className={`flex shrink-0 items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold transition cursor-pointer ${
                    isSelected
                      ? 'text-white shadow-2xs'
                      : 'bg-stone-50 text-stone-600 hover:bg-stone-100 hover:text-stone-900 border border-stone-200/70'
                  }`}
                >
                  <Icon className="h-3 w-3" />
                  <span>{bt.label}</span>
                  <span
                    className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                      isSelected ? 'bg-white/20 text-white' : 'bg-stone-200/70 text-stone-600'
                    }`}
                  >
                    {bt.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-0.5 shrink-0 rounded-md border border-stone-200 bg-stone-50 p-0.5 self-end sm:self-auto">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`rounded p-1 transition cursor-pointer ${
                viewMode === 'grid' ? 'bg-white text-[#855836] shadow-2xs' : 'text-stone-400 hover:text-stone-700'
              }`}
              title="Cards Grid View"
            >
              <HiOutlineViewGrid className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`rounded p-1 transition cursor-pointer ${
                viewMode === 'list' ? 'bg-white text-[#855836] shadow-2xs' : 'text-stone-400 hover:text-stone-700'
              }`}
              title="List / Table View"
            >
              <HiOutlineViewList className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* ─── 4. MEDIA DISPLAY GRID / LIST ─── */}
      {loading ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-stone-200 bg-white p-12 shadow-2xs">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#8b6f4e] border-t-transparent"></div>
          <p className="mt-3 text-xs font-medium text-stone-500">Loading gallery images…</p>
        </div>
      ) : effectiveItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-stone-300 bg-white p-12 text-center shadow-2xs">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#8b6f4e]/10 text-[#8b6f4e]">
            <HiOutlinePhotograph className="h-6 w-6" />
          </div>
          <h3 className="mt-3 text-sm font-bold text-stone-800">No media found</h3>
          <p className="mt-1 max-w-md text-xs text-stone-500">
            {search || selectedType !== 'all' || selectedTheme !== 'all' || selectedPlatform !== 'all'
              ? 'No images match the current filters. Try adjusting your search query or theme/platform filter.'
              : 'Your gallery is empty. Upload your first Hero Banner or Collection Banner image to get started!'}
          </p>
          <button
            type="button"
            onClick={handleOpenUploadModal}
            className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-[#8b6f4e] px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-[#785e40] transition cursor-pointer"
          >
            <HiOutlinePlus className="h-4 w-4" />
            Upload New Image
          </button>
        </div>
      ) : viewMode === 'list' ? (
        /* ─── LIST VIEW ─────────────────────────────────────── */
        <div className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-2xs">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-stone-200 bg-stone-50 text-[11px] font-bold uppercase tracking-wider text-stone-500">
                <th className="py-2.5 px-3">Preview</th>
                <th className="py-2.5 px-3">Image Name / Banner Title</th>
                <th className="py-2.5 px-3">Placement Type</th>
                <th className="py-2.5 px-3">Target Platform</th>
                <th className="py-2.5 px-3">Assigned Theme</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-xs text-stone-700">
              {effectiveItems.map((item) => (
                <tr key={item.id} className="hover:bg-stone-50/70 transition">
                  <td className="py-2.5 px-3">
                    <div
                      onClick={() => setPreviewItem(item)}
                      className="h-10 w-14 cursor-pointer overflow-hidden rounded-lg border border-stone-200 bg-stone-100 shadow-2xs group"
                    >
                      <img
                        src={item.url}
                        alt={item.name}
                        className="h-full w-full object-cover transition group-hover:scale-105"
                      />
                    </div>
                  </td>
                  <td className="py-2.5 px-3 font-semibold text-stone-900">
                    <div className="flex flex-col">
                      <span className="truncate max-w-xs">{item.typeLabel || item.placement}</span>
                      {item.categoryName && (
                        <span className="text-[10px] text-stone-400">Category: {item.categoryName}</span>
                      )}
                    </div>
                  </td>
                  <td className="py-2.5 px-3">
                    <span className="inline-flex items-center gap-1 rounded-md bg-stone-100 px-2 py-0.5 text-[10px] font-semibold text-stone-700">
                      {item.typeLabel}
                    </span>
                  </td>
                  <td className="py-2.5 px-3">
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
                  <td className="py-2.5 px-3">
                    <span
                      className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold ${
                        item.isThemeLive
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : 'bg-stone-100 text-stone-700'
                      }`}
                    >
                      {item.isThemeLive && <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>}
                      {item.themeName || 'Global'}
                    </span>
                  </td>
                  <td className="py-2.5 px-3">
                    <button
                      type="button"
                      onClick={() => handleToggleStatus(item)}
                      className="inline-flex items-center gap-2 group cursor-pointer"
                      title={`Click to set ${item.status === 'active' ? 'inactive' : 'active'}`}
                    >
                      <div
                        className={`relative inline-flex h-4.5 w-8 shrink-0 items-center rounded-full transition-colors duration-200 ease-in-out ${
                          item.status === 'active' ? 'bg-[#8b6f4e]' : 'bg-stone-300'
                        }`}
                      >
                        <span
                          className={`inline-block h-3 w-3 transform rounded-full bg-white shadow-md transition duration-200 ease-in-out ${
                            item.status === 'active' ? 'translate-x-4' : 'translate-x-1'
                          }`}
                        />
                      </div>
                      <span
                        className={`inline-flex items-center px-1.5 py-0.2 rounded-md text-[10px] font-semibold tracking-wide capitalize ${
                          item.status === 'active'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-stone-100 text-stone-500 border border-stone-200'
                        }`}
                      >
                        {item.status || 'active'}
                      </span>
                    </button>
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => copyToClipboard(item.url)}
                        className="rounded-md p-1.5 text-stone-400 hover:bg-stone-100 hover:text-stone-700 transition"
                        title="Copy Image URL"
                      >
                        <HiOutlineClipboardCopy className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(item)}
                        className="rounded-md p-1.5 text-stone-400 hover:bg-amber-50 hover:text-[#8b6f4e] transition"
                        title="Edit Details"
                      >
                        <HiOutlinePencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setPreviewItem(item)}
                        className="rounded-md p-1.5 text-stone-400 hover:bg-stone-100 hover:text-stone-700 transition"
                        title="Inspect Full Image"
                      >
                        <HiOutlineEye className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteConfirmItem(item)}
                        className="rounded-md p-1.5 text-red-500 hover:bg-red-50 hover:text-red-700 transition cursor-pointer"
                        title="Remove Media Item"
                      >
                        <HiOutlineTrash className="h-3.5 w-3.5" />
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
        <div className="grid grid-cols-1 gap-2.5 sm:gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {effectiveItems.map((item) => {
            const bt = BANNER_TYPES.find((b) => b.key === item.type) || { icon: HiOutlinePhotograph };
            const Icon = bt.icon;
            const { fileName } = getMediaDisplayInfo(item);

            return (
              <div
                key={item.id}
                className="group relative flex flex-col justify-between rounded-xl border border-stone-200/90 bg-white shadow-2xs hover:shadow-xs transition-all overflow-hidden"
              >
                {/* Image Media Box (16:10 aspect ratio) */}
                <div className="relative aspect-[16/10] w-full bg-stone-100 overflow-hidden">
                  <img
                    src={item.url}
                    alt={fileName}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />

                  {/* Top-Left: Placement Badge */}
                  <div className="absolute left-2 top-2 z-10">
                    <span className="inline-flex items-center gap-1 rounded-full bg-black/60 backdrop-blur-md px-2 py-0.5 text-[10px] font-medium text-white shadow-xs">
                      <Icon className="h-2.5 w-2.5" />
                      <span>{item.typeLabel || 'Media Library Asset'}</span>
                    </span>
                  </div>

                  {/* Top-Right: Platform Badge */}
                  <div className="absolute right-2 top-2 z-10">
                    <span className="inline-flex items-center gap-1 rounded-full bg-black/60 backdrop-blur-md px-2 py-0.5 text-[10px] font-medium text-white shadow-xs">
                      {item.platform === 'common' ? (
                        <>
                          <IoSparklesOutline className="h-2.5 w-2.5 text-amber-300" />
                          <span>Common</span>
                        </>
                      ) : item.platform === 'app' || item.platform === 'mobile' ? (
                        <>
                          <HiOutlineDeviceMobile className="h-2.5 w-2.5 text-sky-300" />
                          <span>App</span>
                        </>
                      ) : (
                        <>
                          <HiOutlineDesktopComputer className="h-2.5 w-2.5 text-stone-300" />
                          <span>Web</span>
                        </>
                      )}
                    </span>
                  </div>
                </div>

                {/* Card Info Content */}
                <div className="p-2.5 flex flex-col justify-between flex-1">
                  <div>
                    <h4 className="text-xs font-bold text-stone-900 truncate" title={fileName}>
                      {fileName}
                    </h4>
                    {item.themeName ? (
                      <p className="mt-0.5 text-[10px] text-stone-400 font-normal truncate">
                        {item.themeName}
                      </p>
                    ) : null}
                  </div>

                  {/* Action Buttons Row */}
                  <div className="mt-2.5 flex items-center justify-between gap-1.5 pt-1.5 border-t border-stone-100">
                    <button
                      type="button"
                      onClick={() => setPreviewItem(item)}
                      className="flex-1 py-1 flex items-center justify-center rounded-md border border-stone-200/90 bg-white hover:bg-stone-50 text-stone-600 transition shadow-2xs cursor-pointer"
                      title="Inspect Image"
                    >
                      <HiOutlineEye className="h-3.5 w-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOpenEdit(item)}
                      className="flex-1 py-1 flex items-center justify-center rounded-md border border-stone-200/90 bg-white hover:bg-stone-50 text-stone-600 transition shadow-2xs cursor-pointer"
                      title="Edit Media Item"
                    >
                      <HiOutlinePencil className="h-3.5 w-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => copyToClipboard(item.url)}
                      className="flex-1 py-1 flex items-center justify-center rounded-md border border-stone-200/90 bg-white hover:bg-stone-50 text-stone-600 transition shadow-2xs cursor-pointer"
                      title="Copy Image URL"
                    >
                      <HiOutlineClipboardCopy className="h-3.5 w-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => setDeleteConfirmItem(item)}
                      className="flex-1 py-1 flex items-center justify-center rounded-md border border-stone-200/90 bg-white hover:bg-red-50 text-red-600 hover:text-red-700 transition shadow-2xs cursor-pointer"
                      title="Remove Media Item"
                    >
                      <HiOutlineTrash className="h-3.5 w-3.5" />
                    </button>
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
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 border border-red-200 text-red-700">
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
                  className="inline-flex items-center gap-2 rounded-xl bg-red-700 px-4 py-2 text-xs font-semibold text-white hover:bg-red-800 transition cursor-pointer disabled:opacity-50 shadow-sm shadow-red-900/20"
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
                    style={{ backgroundColor: 'var(--theme-primary, #8b6c3a)' }}
                    className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-semibold text-white shadow-xs hover:brightness-95 active:scale-[0.98] transition cursor-pointer disabled:opacity-50"
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
