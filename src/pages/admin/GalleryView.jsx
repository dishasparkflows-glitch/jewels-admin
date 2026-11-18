import { useState, useEffect, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  HiOutlinePhotograph,
  HiOutlineSearch,
  HiOutlineEye,
  HiOutlineTrash,
  HiOutlineExternalLink,
  HiOutlineX,
  HiOutlineSparkles,
  HiOutlineTag,
  HiOutlineRefresh,
  HiOutlineDeviceMobile,
  HiOutlineDesktopComputer,
  HiOutlineViewGrid,
  HiOutlineViewList,
  HiOutlineCalendar,
  HiOutlinePlus,
  HiOutlineClipboardCopy,
  HiOutlineGift,
  HiOutlinePencil,
} from 'react-icons/hi';
import { IoDiamondOutline, IoSparklesOutline, IoLayersOutline } from 'react-icons/io5';
import toast from 'react-hot-toast';
import { galleryAPI } from '../../api/services';
import GalleryUploadModal from '../../components/gallery/GalleryUploadModal';
import GalleryEditModal from '../../components/gallery/GalleryEditModal';
import Dropdown from '../../components/common/Dropdown';
import Pagination from '../../components/common/Pagination';
import { useConfirm } from '../../contexts/ConfirmContext';
import { DeleteActionButton, EditActionButton } from '../../components/common/RowActions';

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

function getMediaDisplayInfo(item) {
  if (!item) return { fileName: 'media.jpg' };
  let fileName = item.fileName || item.name;
  const key = item.key || item.image?.key;
  if (!fileName && key) {
    fileName = key.split('/').pop();
  }
  const url = item.url || item.image?.url;
  if (!fileName && url) {
    try {
      const urlObj = new URL(url);
      fileName = urlObj.pathname.split('/').pop();
    } catch {
      fileName = url.split('/').pop()?.split('?')[0];
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
  const [uploadThemeId, setUploadThemeId] = useState('');
  const [loading, setLoading] = useState(true);

  // ─── Filter & View State ────────────────────────────────────
  const confirm = useConfirm();
  const [selectedTheme, setSelectedTheme] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedPlatform, setSelectedPlatform] = useState('all'); // 'all' | 'web' | 'mobile' | 'common'
  const [search, setSearch] = useState('');
  const [sortBy] = useState('newest');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'

  // ─── Modals State ───────────────────────────────────────────
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [previewItem, setPreviewItem] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [, setIsDeleting] = useState(false);

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
      const rawItems = data.items || [];
      const normalizedItems = rawItems.map((item) => {
        const url = item.url || item.image?.url || '';
        const key = item.key || item.image?.key || '';
        const placement = item.placement || item.type || 'herobanner';
        const bt = BANNER_TYPES.find((b) => b.key === placement);
        const typeLabel = item.typeLabel || bt?.label || placement;
        const themeObj = typeof item.themeId === 'object' && item.themeId !== null ? item.themeId : null;
        const themeName = item.themeName || themeObj?.name || 'Global / Unassigned';
        const isThemeLive = item.isThemeLive !== undefined ? item.isThemeLive : (themeObj?.status === 'active');
        return {
          ...item,
          id: item.id || item._id,
          url,
          key,
          type: placement,
          typeLabel,
          themeName,
          isThemeLive,
        };
      });
      setItems(normalizedItems);
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
    if (uploadModalOpen || previewItem || editingItem) {
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';

      const handleKeyDown = (e) => {
        if (e.key === 'Escape') {
          if (uploadModalOpen) setUploadModalOpen(false);
          if (previewItem) setPreviewItem(null);
          if (editingItem) setEditingItem(null);
        }
      };

      window.addEventListener('keydown', handleKeyDown);
      return () => {
        document.body.style.overflow = prevOverflow;
        window.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [uploadModalOpen, previewItem, editingItem]);

  // ─── Delete / Unassign Action ───────────────────────────────
  const handleDeleteItem = async (item) => {
    if (!item) return;
    if (String(item.id || '').startsWith('demo-')) {
      setItems((prev) => prev.filter((i) => i.id !== item.id));
      toast.success('Media item removed successfully.');
      return;
    }
    const isConfirmed = await confirm({
      title: 'Remove Media Item',
      message: `Are you sure you want to remove "${item.typeLabel || item.placement || 'this media item'}"?\nThis image will be unassigned from its banner and theme.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      type: 'danger',
    });
    if (!isConfirmed) return;

    try {
      setIsDeleting(true);
      await galleryAPI.deleteItem(item.id);
      toast.success('Media item removed successfully.');
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
  };

  const handleOpenUploadModal = () => {
    fetchThemesLookup();
    setUploadModalOpen(true);
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
    total: counts.total ?? items.length ?? 0,
    herobanner: counts.herobanner ?? 0,
    collectionbanner: counts.collectionbanner ?? 0,
    categorybanner: counts.categorybanner ?? 0,
    offerbanner: counts.offerbanner ?? 0,
    celebrate: counts.celebrate ?? 0,
  };

  const effectiveItems = useMemo(() => {
    return items;
  }, [items]);

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
                        <HiOutlineDesktopComputer className="h-3 w-3" /> Web
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
                  <td className="py-2.5 px-3 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        role="switch"
                        aria-checked={item.status === 'active'}
                        onClick={() => handleToggleStatus(item)}
                        style={item.status === 'active' ? { backgroundColor: 'var(--theme-primary, #855836)' } : undefined}
                        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                          item.status === 'active' ? 'bg-[var(--theme-primary,#855836)]' : 'bg-stone-300'
                        }`}
                        title={`Click to set ${item.status === 'active' ? 'Inactive' : 'Active'}`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                            item.status === 'active' ? 'translate-x-4' : 'translate-x-0'
                          }`}
                        />
                      </button>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          item.status === 'active'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-stone-100 text-stone-500 border border-stone-200'
                        }`}
                      >
                        {item.status === 'active' ? 'Active' : 'Inactive'}
                      </span>
                    </div>
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
                      <EditActionButton
                        onClick={() => handleOpenEdit(item)}
                        title="Edit Details"
                      />
                      <DeleteActionButton
                        onClick={() => handleDeleteItem(item)}
                        title="Remove Media Item"
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        /* ─── GRID VIEW (Compact Luxury Sizing) ─────────────── */
        <div className="grid grid-cols-2 gap-2 sm:gap-2.5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {effectiveItems.map((item) => {
            const bt = BANNER_TYPES.find((b) => b.key === item.type) || { icon: HiOutlinePhotograph };
            const Icon = bt.icon;
            const { fileName } = getMediaDisplayInfo(item);

            return (
              <div
                key={item.id}
                className="group relative flex flex-col justify-between rounded-lg border border-stone-200/90 bg-white shadow-2xs hover:shadow-xs transition-all overflow-hidden"
              >
                {/* Image Media Box (16:10 aspect ratio) */}
                <div
                  onClick={() => setPreviewItem(item)}
                  className="relative aspect-[16/10] w-full bg-stone-100 overflow-hidden cursor-pointer group/media"
                  title="Click to preview image"
                >
                  <img
                    src={item.url}
                    alt={fileName}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />

                  {/* Hover Overlay with Eye Icon */}
                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover/media:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-[11px] font-semibold shadow-lg">
                      <HiOutlineEye className="w-3.5 h-3.5" />
                      <span>Preview</span>
                    </span>
                  </div>

                  {/* Top-Left: Placement Badge */}
                  <div className="absolute left-1.5 top-1.5 z-10 pointer-events-none">
                    <span className="inline-flex items-center gap-1 rounded bg-black/65 backdrop-blur-md px-1.5 py-0.5 text-[9px] font-medium text-white shadow-xs">
                      <Icon className="h-2.5 w-2.5" />
                      <span>{item.typeLabel || 'Asset'}</span>
                    </span>
                  </div>

                  {/* Top-Right: Platform Badge */}
                  <div className="absolute right-1.5 top-1.5 z-10 pointer-events-none">
                    <span className="inline-flex items-center gap-1 rounded bg-black/65 backdrop-blur-md px-1.5 py-0.5 text-[9px] font-medium text-white shadow-xs">
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
                <div className="p-2 flex flex-col justify-between flex-1">
                  <div>
                    <h4 className="text-[11px] font-bold text-stone-900 truncate" title={fileName}>
                      {fileName}
                    </h4>
                    {item.themeName ? (
                      <p className="mt-0.5 text-[9.5px] text-stone-400 font-normal truncate">
                        {item.themeName}
                      </p>
                    ) : null}
                  </div>

                  {/* Action Buttons Row */}
                  <div className="mt-2 flex items-center justify-between gap-1 pt-1.5 border-t border-stone-100" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(item)}
                      className="flex-1 py-1 flex items-center justify-center rounded border border-[#dbeafe] bg-[#eff6ff] text-[#2563eb] hover:bg-[#dbeafe] hover:border-[#bfdbfe] active:scale-95 transition-all shadow-2xs cursor-pointer"
                      title="Edit Media Item"
                    >
                      <HiOutlinePencil className="h-3 w-3 stroke-[2]" />
                    </button>

                    <button
                      type="button"
                      onClick={() => copyToClipboard(item.url)}
                      className="flex-1 py-1 flex items-center justify-center rounded border border-stone-200/90 bg-white hover:bg-stone-50 active:scale-95 text-stone-600 transition shadow-2xs cursor-pointer"
                      title="Copy Image URL"
                    >
                      <HiOutlineClipboardCopy className="h-3 w-3" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteItem(item)}
                      className="flex-1 py-1 flex items-center justify-center rounded border border-[#fadbd8] bg-[#fdeeed] text-[#d93025] hover:bg-[#fadbd8] hover:border-[#f5b7b1] active:scale-95 transition-all shadow-2xs cursor-pointer"
                      title="Remove Media Item"
                    >
                      <HiOutlineTrash className="h-3 w-3 stroke-[2]" />
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

      {/* ─── 5. UPLOAD & ASSIGN MODAL (MODULAR SUBCOMPONENT) ─── */}
      <GalleryUploadModal
        isOpen={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        defaultThemeId={selectedTheme !== 'all' ? selectedTheme : uploadThemeId}
        modalThemeOptions={modalThemeOptions}
        placementTypeOptions={placementTypeOptions}
        onSuccess={fetchGallery}
      />

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
                    {previewItem.typeLabel} · {previewItem.platform === 'common' ? 'Common (Web & App)' : previewItem.platform === 'mobile' || previewItem.platform === 'app' ? 'Mobile App' : 'Web'} · Theme: {previewItem.themeName || 'Global'}
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
                          : 'Web'}
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

      {/* ─── 7. EDIT GALLERY ITEM MODAL (MODULAR SUBCOMPONENT) ─── */}
      <GalleryEditModal
        item={editingItem}
        onClose={() => setEditingItem(null)}
        modalThemeOptions={modalThemeOptions}
        placementTypeOptions={placementTypeOptions}
        onSuccess={fetchGallery}
      />
    </div>
  );
}
