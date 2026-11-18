import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  HiOutlinePhotograph,
  HiOutlineSearch,
  HiOutlineCheck,
  HiOutlineCheckCircle,
  HiOutlineX,
  HiOutlineTrash,
  HiOutlineExternalLink,
  HiOutlineRefresh,
  HiOutlineDesktopComputer,
  HiOutlineDeviceMobile,
  HiOutlineTag,
  HiOutlineGift,
  HiOutlineSparkles,
  HiOutlineViewGrid,
  HiOutlineInformationCircle,
  HiOutlineUpload,
  HiOutlineEye,
  HiOutlineViewList,
  HiOutlineCloudUpload,
  HiOutlineCursorClick,
  HiOutlineLink,
  HiOutlineCalendar,
  HiOutlineCollection,
} from 'react-icons/hi';
import { IoDiamondOutline } from 'react-icons/io5';
import toast from 'react-hot-toast';
import { websiteThemesAPI, galleryAPI } from '../../api/services';
import Dropdown from '../../components/common/Dropdown';
import { useConfirm } from '../../contexts/ConfirmContext';
import { useImagePreview } from '../../contexts/ImagePreviewContext';
import { uploadWithPresignedUrl, formatBytes } from '../../utils/uploadWithPresignedUrl';
import { VITE_FRONT_URL } from '../../config/env';

const MODULE_TABS = [
  {
    key: 'herobanner',
    label: 'Hero Banners',
    icon: HiOutlineDesktopComputer,
    description: 'Main homepage hero carousel. Displayed prominently at the very top of the website.',
    recommendedDesktop: '1920 × 600 px (Landscape)',
    recommendedMobile: '768 × 1200 px (Portrait)',
  },
  {
    key: 'celebrate',
    label: 'Celebrate & Gifts',
    icon: IoDiamondOutline,
    description: 'Festive gift categories and gifting showcase cards on the homepage.',
    recommendedDesktop: '800 × 800 px (1:1 Square)',
    recommendedMobile: '800 × 800 px (1:1 Square)',
  },
  {
    key: 'category',
    label: 'Categories',
    icon: HiOutlineViewGrid,
    description: 'Category navigation icons and category page top header banners.',
    recommendedDesktop: 'Icon: 500 × 500 px · Banner: 1200 × 400 px',
    recommendedMobile: 'Icon: 500 × 500 px · Banner: 768 × 500 px',
  },
  {
    key: 'collectionbanner',
    label: 'Collections',
    icon: HiOutlineTag,
    description: 'Featured collection banners and seasonal curated collection cards.',
    recommendedDesktop: '1920 × 600 px (Wide)',
    recommendedMobile: '768 × 1000 px',
  },
  {
    key: 'offerbanner',
    label: 'Offer Banners',
    icon: HiOutlineGift,
    description: 'Special coupon, festival sale, and promotional offer banners.',
    recommendedDesktop: '1920 × 450 px',
    recommendedMobile: '768 × 800 px',
  },
  {
    key: 'mobileappbanner',
    label: 'App Banners',
    icon: HiOutlineDeviceMobile,
    description: 'App store download strips and mobile app promotional blocks.',
    recommendedDesktop: '1920 × 500 px',
    recommendedMobile: '768 × 800 px',
  },
  {
    key: 'customizebanner',
    label: 'Custom & Other',
    icon: HiOutlineSparkles,
    description: 'Bespoke jewelry, book appointment, and custom section banners.',
    recommendedDesktop: '1600 × 600 px',
    recommendedMobile: '768 × 800 px',
  },
];

const PLACEMENT_OPTIONS = [
  {
    value: 'all',
    label: 'All Placement Types',
    sublabel: 'Show all banner and media placements',
    icon: HiOutlineCollection,
    module: null,
  },
  {
    value: 'herobanner',
    label: 'Hero Banner',
    sublabel: 'Homepage main hero slider',
    icon: HiOutlineDesktopComputer,
    module: 'herobanner',
  },
  {
    value: 'collectionbanner',
    label: 'Collection Banner',
    sublabel: '4-tile curated collection showcase',
    icon: HiOutlineTag,
    module: 'collectionbanner',
  },
  {
    value: 'categorybanner',
    label: 'Category Banner',
    sublabel: 'Category page top header banner & icons',
    icon: HiOutlineViewGrid,
    module: 'category',
  },
  {
    value: 'offerbanner',
    label: 'Offer Banner',
    sublabel: 'Promotional deals & discount banner',
    icon: HiOutlineGift,
    module: 'offerbanner',
  },
  {
    value: 'celebrate',
    label: 'Celebrate & Gifts',
    sublabel: 'Gift guide and celebrate showcase item',
    icon: IoDiamondOutline,
    module: 'celebrate',
  },
  {
    value: 'mobileappbanner',
    label: 'Mobile App Banner',
    sublabel: 'Mobile app download promotion',
    icon: HiOutlineDeviceMobile,
    module: 'mobileappbanner',
  },
  {
    value: 'bookappointbanner',
    label: 'Appointment Banner',
    sublabel: 'In-store appointment booking section',
    icon: HiOutlineCalendar,
    module: 'customizebanner',
  },
  {
    value: 'customizebanner',
    label: 'Custom Banner',
    sublabel: 'Custom pages and seasonal campaigns',
    icon: HiOutlineSparkles,
    module: 'customizebanner',
  },
];

const MODULE_TO_PLACEMENT = {
  herobanner: 'herobanner',
  celebrate: 'celebrate',
  category: 'categorybanner',
  collectionbanner: 'collectionbanner',
  offerbanner: 'offerbanner',
  mobileappbanner: 'mobileappbanner',
  customizebanner: 'customizebanner',
};

export default function ThemeMediaMappingTab({
  theme,
  onThemeUpdated,
  onPreview,
}) {
  const confirm = useConfirm();
  const { openImagePreview } = useImagePreview();
  const themeId = theme?._id;

  // Active module & filter state
  const [activeModule, setActiveModule] = useState('herobanner');
  const [selectedPlacement, setSelectedPlacement] = useState('herobanner');
  const [statusFilter, setStatusFilter] = useState('all'); // all, mapped, unmapped
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState('cards'); // 'cards' (visual) or 'table' (compact)

  // Data state
  const [loading, setLoading] = useState(false);
  const [records, setRecords] = useState([]);
  const [summary, setSummary] = useState(null);
  const [selectedIds, setSelectedIds] = useState(new Set());

  // Side panel gallery state
  const [sideGalleryItems, setSideGalleryItems] = useState([]);
  const [galleryLoading, setGalleryLoading] = useState(false);
  const [galleryScope, setGalleryScope] = useState('theme'); // 'theme' or 'all'
  const [gallerySearch, setGallerySearch] = useState('');
  const [galleryTypeFilter, setGalleryTypeFilter] = useState('herobanner');
  const [panelUploading, setPanelUploading] = useState(false);
  const panelFileInputRef = useRef(null);

  // Synchronized placement dropdown handler (updates both left module and right gallery filter)
  const handlePlacementSelect = (val) => {
    setSelectedPlacement(val);
    setSelectedIds(new Set());
    setActiveTargetSlot(null);

    if (val === 'all') {
      setGalleryTypeFilter('all');
      return;
    }

    const opt = PLACEMENT_OPTIONS.find((o) => o.value === val);
    if (opt?.module) {
      setActiveModule(opt.module);
    }
    setGalleryTypeFilter(val);
  };

  // Drag and drop & active target state
  const draggedAssetRef = useRef(null);
  const [dragOverSlot, setDragOverSlot] = useState(null); // { recordId, device, placement }
  const [activeTargetSlot, setActiveTargetSlot] = useState(null); // { record, device, placement }

  // Modal states
  const [pickerTarget, setPickerTarget] = useState(null); // { record, device, placement, currentMediaId }
  const [showActivateModal, setShowActivateModal] = useState(false);
  const [activating, setActivating] = useState(false);
  const [bulkActionLoading, setBulkActionLoading] = useState(false);

  // ─── 1. Load Summary Across All Modules ──────────────────
  const fetchSummary = useCallback(async () => {
    if (!themeId) return;
    try {
      const res = await websiteThemesAPI.getMappingSummary(themeId);
      const data = res.data?.data || res.data;
      setSummary(data);
    } catch (err) {
      console.error('Failed to load theme mapping summary:', err);
    }
  }, [themeId]);

  // ─── 2. Load Records for Current Module ──────────────────
  const fetchRecords = useCallback(async () => {
    if (!themeId) return;
    try {
      setLoading(true);
      const res = await websiteThemesAPI.getMappingRecords(themeId, {
        module: activeModule,
        search,
        limit: 100,
      });
      const data = res.data?.data || res.data || {};
      setRecords(data.items || data.records || []);
      setSelectedIds(new Set());
    } catch (err) {
      console.error('Failed to load module records for mapping:', err);
      toast.error('Could not load module records');
    } finally {
      setLoading(false);
    }
  }, [themeId, activeModule, search]);

  // ─── 3. Load Side Panel Theme Gallery Items ──────────────
  const fetchSideGallery = useCallback(async () => {
    if (!themeId) return;
    try {
      setGalleryLoading(true);
      const params = {
        limit: 100,
        search: gallerySearch || undefined,
      };
      if (galleryScope === 'theme') {
        params.themeId = themeId;
      }
      if (galleryTypeFilter !== 'all') {
        params.type = galleryTypeFilter;
        params.placement = galleryTypeFilter;
      }
      const res = await galleryAPI.getAll(params);
      const data = res.data?.data || res.data || {};
      setSideGalleryItems(data.items || []);
    } catch (err) {
      console.error('Failed to load gallery for side panel:', err);
    } finally {
      setGalleryLoading(false);
    }
  }, [themeId, galleryScope, gallerySearch, galleryTypeFilter]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  useEffect(() => {
    fetchSideGallery();
  }, [fetchSideGallery]);

  // Active module config details
  const activeModuleConfig = useMemo(() => {
    return (
      MODULE_TABS.find((t) => t.key === activeModule) || MODULE_TABS[0]
    );
  }, [activeModule]);

  // ─── Filtered Records ────────────────────────────────────
  const filteredRecords = useMemo(() => {
    return records.filter((rec) => {
      if (statusFilter === 'mapped') return rec.isMapped;
      if (statusFilter === 'unmapped') return !rec.isMapped;
      return true;
    });
  }, [records, statusFilter]);

  // ─── Selection Handlers ──────────────────────────────────
  const isAllSelected =
    filteredRecords.length > 0 &&
    filteredRecords.every((r) => selectedIds.has(String(r._id)));

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredRecords.map((r) => String(r._id))));
    }
  };

  const toggleSelectRow = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      const sid = String(id);
      if (next.has(sid)) next.delete(sid);
      else next.add(sid);
      return next;
    });
  };

  // ─── Single Save Mapping Handler ─────────────────────────
  const handleSaveMapping = async (mediaAsset, customTarget = null) => {
    const target = customTarget || pickerTarget;
    if (!target || !themeId) return;
    const { record, device, placement } = target;

    try {
      await websiteThemesAPI.saveMapping(themeId, {
        module: activeModule,
        recordId: record._id,
        mediaId: mediaAsset._id,
        device: device || 'desktop',
        placement: placement || 'primary',
        status: 'active',
      });

      toast.success(
        `Mapped ${device === 'mobile' ? 'Mobile' : 'Desktop'} image for "${record.title || record.name}"`
      );

      setPickerTarget(null);
      setActiveTargetSlot(null);
      await Promise.all([fetchRecords(), fetchSummary(), fetchSideGallery()]);
    } catch (err) {
      console.error('Failed to save mapping:', err);
      toast.error(err.response?.data?.message || 'Could not save theme mapping');
    }
  };

  // ─── Direct File Upload & Map Immediately ────────────────
  const handleDirectUpload = async (file, record, device = 'desktop', placement = 'primary') => {
    if (!file || !themeId) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please choose a valid image file');
      return;
    }

    const toastId = toast.loading(`Uploading & optimizing ${file.name}…`);
    try {
      // 1. Upload file via presigned URL with auto-compression
      const upload = await uploadWithPresignedUrl(file, 'website-themes');

      // 2. Register media in Gallery with themeId and linkedRecord
      const galleryRes = await galleryAPI.create({
        themeId,
        name: file.name.replace(/\.[^/.]+$/, ''),
        type: activeModule,
        placement: device,
        linkedRecord: {
          module: activeModule,
          recordId: record._id,
        },
        image: {
          url: upload.fileUrl,
          key: upload.key,
        },
      });

      const mediaAsset = galleryRes.data?.data || galleryRes.data;

      // 3. Save Theme Mapping
      await websiteThemesAPI.saveMapping(themeId, {
        module: activeModule,
        recordId: record._id,
        mediaId: mediaAsset._id,
        device,
        placement,
        status: 'active',
      });

      toast.success(
        `Theme image saved! (${formatBytes(upload.originalSize)} → ${formatBytes(upload.compressedSize)})`,
        { id: toastId }
      );

      await Promise.all([fetchRecords(), fetchSummary(), fetchSideGallery()]);
    } catch (err) {
      console.error('Direct upload failed:', err);
      toast.error(err.response?.data?.message || 'Could not upload theme image', {
        id: toastId,
      });
    }
  };

  // ─── Upload to Side Panel Gallery ─────────────────────────
  const handleSidePanelUpload = async (file) => {
    if (!file || !themeId) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please choose a valid image file');
      return;
    }

    setPanelUploading(true);
    const toastId = toast.loading(`Uploading to Theme Gallery: ${file.name}…`);
    try {
      const upload = await uploadWithPresignedUrl(file, 'website-themes');
      await galleryAPI.create({
        themeId,
        name: file.name.replace(/\.[^/.]+$/, ''),
        placement: activeModule,
        platform: 'common',
        image: {
          url: upload.fileUrl,
          key: upload.key,
        },
      });

      toast.success(
        `Added to Theme Gallery! (${formatBytes(upload.originalSize)} → ${formatBytes(upload.compressedSize)})`,
        { id: toastId }
      );
      await fetchSideGallery();
    } catch (err) {
      console.error('Failed to upload image to gallery:', err);
      toast.error(err.response?.data?.message || 'Upload failed', { id: toastId });
    } finally {
      setPanelUploading(false);
    }
  };

  // ─── Delete Single Mapping Handler ───────────────────────
  const handleDeleteMapping = async (record, device = 'desktop', placement = 'primary') => {
    if (!themeId) return;

    try {
      await websiteThemesAPI.deleteMappingByTarget(themeId, {
        module: activeModule,
        recordId: record._id,
        device,
        placement,
      });

      toast.success(`Theme mapping removed. Reverted to default storefront image.`);
      await Promise.all([fetchRecords(), fetchSummary(), fetchSideGallery()]);
    } catch (err) {
      console.error('Failed to remove mapping:', err);
      toast.error(err.response?.data?.message || 'Could not remove theme mapping');
    }
  };

  // ─── Bulk Clear Mappings ─────────────────────────────────
  const handleBulkClear = async () => {
    if (selectedIds.size === 0 || !themeId) return;

    const confirmed = await confirm({
      title: 'Revert Selected Mappings to Default',
      message: `Are you sure you want to revert ${selectedIds.size} selected item(s) to their default storefront images?`,
      confirmText: 'Revert to Default',
      cancelText: 'Cancel',
      variant: 'danger',
    });

    if (!confirmed) return;

    try {
      setBulkActionLoading(true);
      const promises = Array.from(selectedIds).map((recId) =>
        websiteThemesAPI.deleteMappingByTarget(themeId, {
          module: activeModule,
          recordId: recId,
        })
      );
      await Promise.all(promises);
      toast.success(`Reverted ${selectedIds.size} items to default images.`);
      setSelectedIds(new Set());
      await Promise.all([fetchRecords(), fetchSummary(), fetchSideGallery()]);
    } catch (err) {
      console.error('Bulk clear failed:', err);
      toast.error('Failed to clear some mappings');
    } finally {
      setBulkActionLoading(false);
    }
  };

  // ─── Drag & Drop Event Handlers ──────────────────────────
  const handleDropOnSlot = async (e, record, device = 'desktop', placement = 'primary') => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverSlot(null);

    let mediaAsset = draggedAssetRef.current;
    if (!mediaAsset) {
      try {
        const raw = e.dataTransfer.getData('application/json') || e.dataTransfer.getData('text/plain');
        if (raw) {
          try {
            mediaAsset = JSON.parse(raw);
          } catch {
            mediaAsset = sideGalleryItems.find((i) => String(i._id) === String(raw));
          }
        }
      } catch (err) {
        console.warn('Could not read from dataTransfer:', err);
      }
    }

    if (!mediaAsset || !mediaAsset._id) {
      toast.error('Could not detect dropped image. Try selecting the slot with "Map" then clicking the image.');
      return;
    }

    try {
      await handleSaveMapping(mediaAsset, {
        record,
        device,
        placement,
      });
    } catch (err) {
      console.error('Error handling dropped image:', err);
    }
  };

  const handleGalleryItemClick = async (item) => {
    if (activeTargetSlot) {
      await handleSaveMapping(item, activeTargetSlot);
    } else {
      openImagePreview(item.image?.url || item.url, {
        title: item.name || 'Theme Gallery Asset',
      });
    }
  };

  // ─── One-Click Theme Activation ──────────────────────────
  const handleActivateTheme = async () => {
    if (!themeId) return;

    try {
      setActivating(true);
      const res = await websiteThemesAPI.activateTheme(themeId);
      const data = res.data?.data || res.data || {};
      toast.success(data.message || `Theme "${theme?.name}" is now live on the storefront!`);
      setShowActivateModal(false);
      if (onThemeUpdated) {
        onThemeUpdated({ ...theme, status: 'active' });
      }
      await fetchSummary();
    } catch (err) {
      console.error('Failed to activate theme:', err);
      toast.error(err.response?.data?.message || 'Failed to activate theme');
    } finally {
      setActivating(false);
    }
  };

  // Active module breakdown stats
  const activeBreakdown = summary?.breakdown?.find(
    (b) => b.module === activeModule
  );
  const totalAllRecords = summary?.summary?.totalRecords || 0;
  const mappedAllRecords = summary?.summary?.mappedRecords || 0;
  const completionPct = summary?.summary?.completionPercentage || 0;
  const isLive = theme?.status === 'active';

  // Helper to resolve fallback images robustly
  const resolveFallbackMedia = (record) => {
    if (activeModule === 'category') {
      return {
        primary: record.originalIcon || record.originalMedia?.iconUrl || record.originalDesktopImage,
        secondary: record.originalBanner || record.originalMedia?.bannerUrl,
        primaryLabel: 'Default Category Icon',
        secondaryLabel: 'Default Category Banner',
      };
    }
    return {
      primary: record.originalDesktopImage || record.originalMedia?.desktopImageUrl || record.image?.url,
      secondary: record.originalMobileImage || record.originalMedia?.mobileImageUrl || record.mobileImage?.url,
      primaryLabel: 'Default Desktop Banner',
      secondaryLabel: 'Default Mobile Banner',
    };
  };

  return (
    <div className="space-y-4">
      {/* ─────────────────────────────────────────────────────────────
          1. MODULE TABS STRIP
          ───────────────────────────────────────────────────────────── */}
      <div className="flex gap-1.5 overflow-x-auto rounded-2xl border border-stone-200 bg-white p-1.5 shadow-2xs">
        {MODULE_TABS.map((tab) => {
          const Icon = tab.icon;
          const stat = summary?.breakdown?.find((b) => b.module === tab.key);
          const isSelected = activeModule === tab.key;
          const total = stat?.total || 0;
          const mapped = stat?.mapped || 0;

          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => {
                setActiveModule(tab.key);
                setSelectedIds(new Set());
                setActiveTargetSlot(null);
                const matchingPlacement = MODULE_TO_PLACEMENT[tab.key] || tab.key;
                setSelectedPlacement(matchingPlacement);
                setGalleryTypeFilter(matchingPlacement);
              }}
              className={`flex items-center gap-2 shrink-0 rounded-xl px-4 py-2.5 text-xs font-semibold transition cursor-pointer ${
                isSelected
                  ? 'bg-[#8b6f4e] text-white shadow-xs'
                  : 'text-stone-600 hover:bg-stone-50 hover:text-stone-900'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                  isSelected
                    ? 'bg-white/20 text-white'
                    : mapped === total && total > 0
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-stone-100 text-stone-600'
                }`}
              >
                {mapped}/{total}
              </span>
            </button>
          );
        })}
      </div>

      {/* ─────────────────────────────────────────────────────────────
          3. ACTIVE TARGET BANNER (When user clicked "Select to Map")
          ───────────────────────────────────────────────────────────── */}
      {activeTargetSlot && (
        <div className="rounded-2xl border-2 border-[#8b6f4e] bg-amber-50/80 p-3.5 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm animate-pulse-subtle">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#8b6f4e] text-white flex items-center justify-center shrink-0 shadow-xs">
              <HiOutlineCursorClick className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold text-stone-900">
                  Target Selected for Mapping:
                </span>
                <span className="bg-[#8b6f4e]/15 text-[#8b6f4e] font-bold px-2 py-0.5 rounded-md text-xs">
                  {activeTargetSlot.record.title || activeTargetSlot.record.name}
                </span>
                <span className="text-[11px] text-stone-500 font-semibold uppercase">
                  ({activeTargetSlot.device})
                </span>
              </div>
              <p className="text-xs text-stone-600 mt-0.5">
                👉 Now click <strong>any image in the Theme Gallery on the right</strong> to assign it instantly!
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setActiveTargetSlot(null)}
            className="rounded-xl border border-stone-300 bg-white hover:bg-stone-100 px-3 py-1.5 text-xs font-semibold text-stone-700 transition cursor-pointer shrink-0"
          >
            Cancel Selection
          </button>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          4. SIDE-BY-SIDE MAIN LAYOUT:
             LEFT: Banners & Featured List (xl:col-span-7)
             RIGHT: Theme Media Gallery Side Panel (xl:col-span-5)
          ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
        {/* ═══════════════════════════════════════════════════════════
            LEFT COLUMN: BANNERS & FEATURED LIST (xl:col-span-7)
            ═══════════════════════════════════════════════════════════ */}
        <div className="xl:col-span-7 space-y-4">
          {/* Search, Placement Type Dropdown, Filter Pills & View Mode */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <div className="relative flex-1 min-w-[140px]">
                <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={`Search ${activeModuleConfig.label}...`}
                  className="w-full h-9 pl-9 pr-8 rounded-xl border border-stone-200 bg-white text-xs text-stone-800 outline-none transition focus:border-[#8b6f4e] focus:ring-2 focus:ring-[#8b6f4e]/15 placeholder:text-stone-400"
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 cursor-pointer"
                  >
                    <HiOutlineX className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              {/* Placement Type Dropdown */}
              <div className="w-48 sm:w-56 shrink-0">
                <Dropdown
                  size="sm"
                  value={selectedPlacement}
                  onChange={handlePlacementSelect}
                  options={PLACEMENT_OPTIONS}
                  className="w-full"
                />
              </div>

              {/* Status Filter */}
              <div className="flex items-center rounded-xl border border-stone-200 bg-white p-0.5 shadow-2xs shrink-0">
                {[
                  ['all', 'All'],
                  ['mapped', 'Customized'],
                  ['unmapped', 'Default'],
                ].map(([val, lbl]) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setStatusFilter(val)}
                    className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold transition cursor-pointer ${
                      statusFilter === val
                        ? 'bg-[#8b6f4e] text-white shadow-2xs'
                        : 'text-stone-600 hover:bg-stone-50'
                    }`}
                  >
                    {lbl}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2 justify-end">
              {/* Cards / Table Toggle */}
              <div className="flex items-center rounded-xl border border-stone-200 bg-white p-0.5 shadow-2xs">
                <button
                  type="button"
                  onClick={() => setViewMode('cards')}
                  title="Visual Cards View"
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                    viewMode === 'cards'
                      ? 'bg-[#8b6f4e] text-white shadow-2xs'
                      : 'text-stone-600 hover:bg-stone-50'
                  }`}
                >
                  <HiOutlineViewGrid className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Cards</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('table')}
                  title="Table View"
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                    viewMode === 'table'
                      ? 'bg-[#8b6f4e] text-white shadow-2xs'
                      : 'text-stone-600 hover:bg-stone-50'
                  }`}
                >
                  <HiOutlineViewList className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Table</span>
                </button>
              </div>

              {selectedIds.size > 0 && (
                <button
                  type="button"
                  onClick={handleBulkClear}
                  disabled={bulkActionLoading}
                  className="inline-flex items-center gap-1 bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 font-bold px-2.5 py-1.5 rounded-xl text-xs transition cursor-pointer disabled:opacity-50"
                  title="Revert selected to default"
                >
                  <HiOutlineTrash className="h-3.5 w-3.5" />
                  <span>Revert ({selectedIds.size})</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  fetchRecords();
                  fetchSummary();
                  fetchSideGallery();
                }}
                disabled={loading}
                className="flex items-center gap-1 px-2.5 py-1.5 bg-white hover:bg-stone-50 border border-stone-200 text-stone-700 rounded-xl text-xs font-semibold shadow-2xs transition cursor-pointer"
                title="Refresh records"
              >
                <HiOutlineRefresh className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Master Select All Bar */}
          <div className="flex items-center justify-between bg-stone-100/70 border border-stone-200/80 rounded-xl px-3.5 py-2 text-xs text-stone-600">
            <label className="flex items-center gap-2 font-semibold cursor-pointer">
              <input
                type="checkbox"
                checked={isAllSelected}
                onChange={toggleSelectAll}
                className="rounded border-stone-300 text-[#8b6f4e] focus:ring-[#8b6f4e]"
              />
              <span>Select all {filteredRecords.length} records</span>
            </label>
            <span className="text-[11px] text-stone-500">
              Showing {filteredRecords.length} of {records.length} {activeModuleConfig.label}
            </span>
          </div>

          {/* Cards or Table */}
          {loading ? (
            <div className="rounded-2xl border border-stone-200 bg-white py-20 text-center text-xs text-stone-500 space-y-2 shadow-2xs">
              <HiOutlineRefresh className="h-7 w-7 animate-spin mx-auto text-[#8b6f4e]" />
              <p className="font-semibold text-stone-700">Loading {activeModuleConfig.label} records…</p>
            </div>
          ) : filteredRecords.length === 0 ? (
            <div className="rounded-2xl border border-stone-200 bg-white py-16 text-center text-xs text-stone-500 space-y-2 shadow-2xs">
              <HiOutlinePhotograph className="h-9 w-9 mx-auto text-stone-300" />
              <p className="font-bold text-stone-800 text-sm">No records found for this module</p>
              <p className="text-stone-400 max-w-sm mx-auto text-[11px]">
                {search
                  ? `No records match "${search}". Try clearing your search.`
                  : `No existing records found in ${activeModuleConfig.label}.`}
              </p>
            </div>
          ) : viewMode === 'cards' ? (
            /* ═══════ VIEW MODE 1: CARDS WITH DRAG-AND-DROP TARGETS ═══════ */
            <div className="space-y-3.5">
              {filteredRecords.map((record) => {
                const isSelected = selectedIds.has(String(record._id));
                const isMapped = record.isMapped;
                const fallback = resolveFallbackMedia(record);

                // Desktop mapping
                const desktopMappedImg = record.desktopMapping?.imageUrl;
                const hasDesktopOverride = Boolean(desktopMappedImg);

                // Mobile mapping
                const mobileMappedImg =
                  activeModule === 'category'
                    ? record.bannerMapping?.imageUrl
                    : record.mobileMapping?.imageUrl;
                const hasMobileOverride = Boolean(mobileMappedImg);

                const isTargetActive =
                  activeTargetSlot?.record?._id === record._id &&
                  activeTargetSlot?.device === 'desktop';

                const isSlotHovered =
                  dragOverSlot?.recordId === record._id &&
                  dragOverSlot?.device === 'desktop';

                return (
                  <div
                    key={record._id}
                    className={`rounded-2xl border transition-all duration-200 bg-white overflow-hidden shadow-2xs ${
                      isTargetActive
                        ? 'border-[#8b6f4e] ring-2 ring-[#8b6f4e]/20 bg-amber-50/15'
                        : hasDesktopOverride || hasMobileOverride
                        ? 'border-[#8b6f4e]/30'
                        : 'border-stone-200 hover:border-stone-300'
                    } ${isSelected ? 'ring-2 ring-amber-400 bg-amber-50/20' : ''}`}
                  >
                    {/* Card Header Bar */}
                    <div className="p-3 border-b border-stone-100 bg-stone-50/70 flex items-center justify-between gap-2.5">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectRow(record._id)}
                          className="rounded border-stone-300 text-[#8b6f4e] focus:ring-[#8b6f4e]"
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="inline-flex items-center rounded-md bg-[#8b6f4e]/10 text-[#8b6f4e] px-2 py-0.5 text-[10px] font-bold">
                              {record.slotLabel || `${activeModuleConfig.label} · Slide #${(record.order ?? 0) + 1}`}
                            </span>
                            <h3 className="font-bold text-stone-900 text-xs sm:text-sm truncate">
                              {record.title || record.name || 'Storefront Item'}
                            </h3>
                          </div>
                          <div className="flex items-center gap-2 text-[10px] text-stone-500 mt-0.5 flex-wrap">
                            {record.subtitle && <span>{record.subtitle}</span>}
                            {record.targetLink && (
                              <span className="text-[#8b6f4e] font-mono">
                                🔗 {record.targetLink}
                              </span>
                            )}
                            <span className="text-stone-400 font-mono">
                              ID: {String(record._id).slice(-6)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Status Badge */}
                      <div className="shrink-0">
                        {isMapped ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800">
                            <HiOutlineCheckCircle className="h-3.5 w-3.5 text-emerald-600" />
                            <span>Customized</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200 px-2 py-0.5 text-[11px] font-medium text-amber-800">
                            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                            <span>Using Default</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Card Body */}
                    <div className="p-3.5 sm:p-4 space-y-3">
                      {/* Primary / Desktop Drop Zone & Comparison */}
                      <div>
                        <div className="flex items-center justify-between mb-1.5 text-xs">
                          <span className="font-bold text-stone-700 flex items-center gap-1.5 text-[11px]">
                            <HiOutlineDesktopComputer className="h-3.5 w-3.5 text-stone-400" />
                            {activeModule === 'category' ? 'Category Icon' : 'Desktop Banner Slot'}
                          </span>
                        </div>

                        {/* Interactive Drop Zone & Preview Container */}
                        <div
                          onDragOver={(e) => {
                            e.preventDefault();
                            e.dataTransfer.dropEffect = 'copy';
                            setDragOverSlot({ recordId: record._id, device: 'desktop' });
                          }}
                          onDragLeave={() => setDragOverSlot(null)}
                          onDrop={(e) =>
                            handleDropOnSlot(
                              e,
                              record,
                              'desktop',
                              activeModule === 'category' ? 'icon' : 'primary'
                            )
                          }
                          className={`rounded-xl border-2 transition-all duration-200 p-3 ${
                            isSlotHovered
                              ? 'border-[#8b6f4e] bg-[#8b6f4e]/10 scale-[1.01] ring-2 ring-[#8b6f4e]/20'
                              : isTargetActive
                              ? 'border-amber-400 bg-amber-50/40 ring-2 ring-amber-400/20'
                              : hasDesktopOverride
                              ? 'border-emerald-200 bg-emerald-50/15'
                              : 'border-dashed border-stone-200 bg-stone-50/50 hover:border-stone-300'
                          }`}
                        >
                          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                            <div className="flex items-center gap-3 min-w-0">
                              {/* Thumbnail preview */}
                              <div
                                onClick={() => {
                                  const img = desktopMappedImg || fallback.primary;
                                  if (img) {
                                    openImagePreview(img, {
                                      title: `${record.title} · ${hasDesktopOverride ? 'Theme Override' : 'Default'}`,
                                    });
                                  }
                                }}
                                className={`w-24 h-16 sm:w-28 sm:h-18 rounded-lg border overflow-hidden shrink-0 relative group bg-white ${
                                  hasDesktopOverride ? 'border-emerald-300 cursor-pointer' : 'border-stone-200'
                                }`}
                              >
                                {desktopMappedImg ? (
                                  <>
                                    <img
                                      src={desktopMappedImg}
                                      alt="Theme override"
                                      className="w-full h-full object-cover transition duration-200 group-hover:scale-105"
                                    />
                                    <div className="absolute inset-0 bg-emerald-950/30 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white">
                                      <HiOutlineEye className="h-4 w-4" />
                                    </div>
                                  </>
                                ) : fallback.primary ? (
                                  <>
                                    <img
                                      src={fallback.primary}
                                      alt="Default fallback"
                                      className="w-full h-full object-cover opacity-75 group-hover:opacity-100 transition"
                                    />
                                    <div className="absolute inset-0 bg-stone-900/30 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white">
                                      <HiOutlineEye className="h-4 w-4" />
                                    </div>
                                  </>
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-stone-300">
                                    <HiOutlinePhotograph className="h-5 w-5" />
                                  </div>
                                )}
                              </div>

                              {/* Mapping State Text */}
                              <div className="space-y-0.5 min-w-0">
                                {hasDesktopOverride ? (
                                  <span className="inline-flex items-center gap-1 rounded-md bg-emerald-100 text-emerald-800 px-2 py-0.5 text-[10px] font-bold">
                                    <HiOutlineCheck className="h-3 w-3 stroke-2 text-emerald-600" />
                                    {theme?.name?.toUpperCase() || 'THEME'} ACTIVE
                                  </span>
                                ) : (
                                  <>
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <span className="inline-flex items-center rounded-md bg-amber-100 text-amber-800 px-2 py-0.5 text-[10px] font-bold">
                                        ⚡ UNMAPPED FOR THIS THEME
                                      </span>
                                      <span className="text-[10px] text-stone-400">
                                        (Using storefront default)
                                      </span>
                                    </div>
                                    <p className="text-xs font-bold text-amber-900">
                                      Drop image here, or click "Map" to assign
                                    </p>
                                    <p className="text-[11px] text-stone-500">
                                      Drag from Theme Gallery on right, or choose from options.
                                    </p>
                                  </>
                                )}
                              </div>
                            </div>

                            {/* Slot Actions */}
                            <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center flex-wrap">
                              {/* Select for Mapping / Active Target Button */}
                              <button
                                type="button"
                                onClick={() =>
                                  setActiveTargetSlot(
                                    isTargetActive
                                      ? null
                                      : {
                                          record,
                                          device: 'desktop',
                                          placement: activeModule === 'category' ? 'icon' : 'primary',
                                        }
                                  )
                                }
                                className={`inline-flex items-center gap-1 rounded-xl px-2.5 py-1.5 text-[11px] font-semibold transition cursor-pointer ${
                                  isTargetActive
                                    ? 'bg-[#8b6f4e] text-white shadow-2xs'
                                    : 'border border-[#8b6f4e]/30 bg-[#8b6f4e]/10 text-[#8b6f4e] hover:bg-[#8b6f4e]/20'
                                }`}
                                title="Select this slot, then click any image in the side gallery"
                              >
                                <HiOutlineCursorClick className="h-3.5 w-3.5" />
                                <span>{isTargetActive ? 'Selected' : 'Map'}</span>
                              </button>

                              {/* Traditional Full Gallery Modal Picker */}
                              <button
                                type="button"
                                onClick={() =>
                                  setPickerTarget({
                                    record,
                                    device: 'desktop',
                                    placement: activeModule === 'category' ? 'icon' : 'primary',
                                    currentMediaId: record.desktopMapping?.mediaId,
                                  })
                                }
                                className="inline-flex items-center gap-1 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 px-2.5 py-1.5 text-[11px] font-semibold text-stone-700 transition cursor-pointer shadow-2xs"
                                title="Browse full media library modal"
                              >
                                <HiOutlinePhotograph className="h-3 w-3 text-stone-500" />
                                <span>Browse</span>
                              </button>

                              {/* Revert / Remove Mapping Button */}
                              {hasDesktopOverride && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleDeleteMapping(
                                      record,
                                      'desktop',
                                      activeModule === 'category' ? 'icon' : 'primary'
                                    )
                                  }
                                  className="inline-flex items-center gap-1 rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 px-2 py-1.5 text-[11px] font-semibold text-red-700 transition cursor-pointer"
                                  title="Revert to default storefront image"
                                >
                                  <HiOutlineTrash className="h-3.5 w-3.5" />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Mobile Slot (Optional Variant) */}
                      {(activeModuleConfig.recommendedMobile || activeModule === 'category') && (
                        <div className="pt-2.5 border-t border-stone-100">
                          <div className="flex items-center justify-between mb-1.5 text-xs">
                            <span className="font-bold text-stone-600 flex items-center gap-1 text-[11px]">
                              <HiOutlineDeviceMobile className="h-3.5 w-3.5 text-stone-400" />
                              {activeModule === 'category' ? 'Category Page Header Banner' : 'Mobile Banner Slot (Optional)'}
                            </span>
                          </div>

                          <div
                            onDragOver={(e) => {
                              e.preventDefault();
                              e.dataTransfer.dropEffect = 'copy';
                              setDragOverSlot({ recordId: record._id, device: 'mobile' });
                            }}
                            onDragLeave={() => setDragOverSlot(null)}
                            onDrop={(e) =>
                              handleDropOnSlot(
                                e,
                                record,
                                'mobile',
                                activeModule === 'category' ? 'banner' : 'primary'
                              )
                            }
                            className={`rounded-xl border p-2.5 flex items-center justify-between gap-3 transition-all ${
                              dragOverSlot?.recordId === record._id && dragOverSlot?.device === 'mobile'
                                ? 'border-[#8b6f4e] bg-[#8b6f4e]/10 ring-2 ring-[#8b6f4e]/20'
                                : hasMobileOverride
                                ? 'border-emerald-300 bg-emerald-50/20'
                                : 'border-stone-200 bg-stone-50/40'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div
                                onClick={() => {
                                  const img = mobileMappedImg || fallback.secondary;
                                  if (img) {
                                    openImagePreview(img, {
                                      title: `${record.title} · Mobile Banner`,
                                    });
                                  }
                                }}
                                className={`w-16 h-12 rounded-lg border overflow-hidden shrink-0 relative group bg-white ${
                                  hasMobileOverride ? 'border-emerald-300 cursor-pointer' : 'border-stone-200'
                                }`}
                              >
                                {mobileMappedImg ? (
                                  <img
                                    src={mobileMappedImg}
                                    alt="Mobile override"
                                    className="w-full h-full object-cover"
                                  />
                                ) : fallback.secondary ? (
                                  <img
                                    src={fallback.secondary}
                                    alt="Mobile fallback"
                                    className="w-full h-full object-cover opacity-70"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-stone-300">
                                    <HiOutlineDeviceMobile className="h-4 w-4" />
                                  </div>
                                )}
                              </div>

                              <div className="min-w-0">
                                <p className="text-[11px] font-bold text-stone-800">
                                  {hasMobileOverride ? 'Custom Mobile Active' : 'Falls back to Desktop if empty'}
                                </p>
                                <p className="text-[10px] text-stone-500 truncate">
                                  {hasMobileOverride
                                    ? 'Optimized for mobile viewports'
                                    : 'Drag & drop image from gallery or upload'}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                              <label className="rounded-lg border border-stone-200 bg-white hover:bg-stone-50 px-2 py-1 text-[10px] font-semibold text-stone-700 transition cursor-pointer">
                                <span>Upload</span>
                                <input
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    e.target.value = '';
                                    if (file) {
                                      handleDirectUpload(
                                        file,
                                        record,
                                        'mobile',
                                        activeModule === 'category' ? 'banner' : 'primary'
                                      );
                                    }
                                  }}
                                />
                              </label>

                              <button
                                type="button"
                                onClick={() =>
                                  setPickerTarget({
                                    record,
                                    device: 'mobile',
                                    placement: activeModule === 'category' ? 'banner' : 'primary',
                                    currentMediaId: record.mobileMapping?.mediaId,
                                  })
                                }
                                className="rounded-lg bg-[#8b6f4e] hover:brightness-95 px-2.5 py-1 text-[10px] font-semibold text-white shadow-2xs transition cursor-pointer"
                              >
                                {hasMobileOverride ? 'Change' : 'Map'}
                              </button>

                              {hasMobileOverride && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleDeleteMapping(
                                      record,
                                      'mobile',
                                      activeModule === 'category' ? 'banner' : 'primary'
                                    )
                                  }
                                  className="rounded-lg border border-red-200 bg-red-50 hover:bg-red-100 p-1 text-red-700 transition cursor-pointer"
                                  title="Revert mobile variant"
                                >
                                  <HiOutlineTrash className="h-3 w-3" />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* ═══════ VIEW MODE 2: COMPACT TABLE ═══════ */
            <div className="rounded-2xl border border-stone-200 bg-white shadow-2xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-stone-200/80 bg-[#eef2f6] text-[11px] font-bold text-stone-700 uppercase tracking-wider">
                      <th className="w-8 px-3 py-3 text-center">
                        <input
                          type="checkbox"
                          checked={isAllSelected}
                          onChange={toggleSelectAll}
                          className="w-3.5 h-3.5 rounded border-stone-300 text-[#8b6f4e] focus:ring-[#8b6f4e]/30 cursor-pointer"
                        />
                      </th>
                      <th className="px-3 py-3 min-w-[160px] whitespace-nowrap">Record Slot</th>
                      <th className="px-3 py-3 min-w-[200px] whitespace-nowrap">Desktop Mapping</th>
                      <th className="px-3 py-3 min-w-[100px] text-center whitespace-nowrap">Status</th>
                      <th className="px-3 py-3 min-w-[100px] text-right whitespace-nowrap">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {filteredRecords.map((record) => {
                      const isSelected = selectedIds.has(String(record._id));
                      const isMapped = record.isMapped;
                      const fallback = resolveFallbackMedia(record);
                      const desktopMappedImg = record.desktopMapping?.imageUrl;
                      const hasDesktopOverride = Boolean(desktopMappedImg);
                      const currentDesktopImg = desktopMappedImg || fallback.primary;

                      const isTargetActive =
                        activeTargetSlot?.record?._id === record._id &&
                        activeTargetSlot?.device === 'desktop';

                      const isSlotHovered =
                        dragOverSlot?.recordId === record._id &&
                        dragOverSlot?.device === 'desktop';

                      return (
                        <tr
                          key={record._id}
                          onDragOver={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            e.dataTransfer.dropEffect = 'copy';
                            setDragOverSlot({ recordId: record._id, device: 'desktop' });
                          }}
                          onDragLeave={(e) => {
                            if (!e.currentTarget.contains(e.relatedTarget)) {
                              setDragOverSlot(null);
                            }
                          }}
                          onDrop={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleDropOnSlot(
                              e,
                              record,
                              'desktop',
                              activeModule === 'category' ? 'icon' : 'primary'
                            );
                          }}
                          className={`transition-colors duration-150 ${
                            isSlotHovered
                              ? 'bg-[#8b6f4e]/20 ring-2 ring-inset ring-[#8b6f4e]'
                              : isTargetActive
                              ? 'bg-amber-50/70 ring-1 ring-inset ring-amber-400'
                              : isSelected
                              ? 'bg-amber-50/40'
                              : 'hover:bg-stone-50/70'
                          }`}
                        >
                          <td className="w-8 px-3 py-2.5 text-center">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleSelectRow(record._id)}
                              className="rounded border-stone-300 text-[#8b6f4e] focus:ring-[#8b6f4e]"
                            />
                          </td>
                          <td className="px-3 py-2.5">
                            <div className="font-bold text-stone-900 leading-tight">
                              {record.title || record.name || 'Untitled Record'}
                            </div>
                            <span className="text-[10px] text-stone-400 font-mono">
                              ID: {String(record._id).slice(-6)}
                            </span>
                          </td>
                          <td className="px-3 py-2.5">
                            <div className="flex items-center gap-2.5">
                              <div
                                onClick={() =>
                                  currentDesktopImg &&
                                  openImagePreview(currentDesktopImg, {
                                    title: record.title,
                                  })
                                }
                                className={`w-14 h-10 rounded border overflow-hidden shrink-0 relative bg-white ${
                                  hasDesktopOverride ? 'border-emerald-400' : 'border-stone-200'
                                } ${currentDesktopImg ? 'cursor-pointer' : ''}`}
                              >
                                {currentDesktopImg ? (
                                  <img
                                    src={currentDesktopImg}
                                    alt="desktop preview"
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full bg-stone-100 flex items-center justify-center text-stone-300">
                                    <HiOutlinePhotograph className="h-4 w-4" />
                                  </div>
                                )}
                              </div>
                              <div className="text-[11px] min-w-0">
                                {isSlotHovered ? (
                                  <span className="inline-flex items-center gap-1 rounded bg-[#8b6f4e] text-white px-1.5 py-0.5 text-[10px] font-bold animate-pulse">
                                    ⚡ Drop to Map
                                  </span>
                                ) : hasDesktopOverride ? (
                                  <span className="text-emerald-700 font-bold block">
                                    Theme Mapped
                                  </span>
                                ) : (
                                  <span className="text-amber-800 font-medium block">
                                    Safe Fallback
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-3 py-2.5 text-center">
                            {isMapped ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                                Mapped
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200 px-2 py-0.5 text-[10px] font-medium text-amber-800">
                                Default
                              </span>
                            )}
                          </td>
                          <td className="px-3 py-2.5 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() =>
                                  setActiveTargetSlot(
                                    isTargetActive
                                      ? null
                                      : {
                                          record,
                                          device: 'desktop',
                                          placement: activeModule === 'category' ? 'icon' : 'primary',
                                        }
                                  )
                                }
                                className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold transition cursor-pointer shadow-2xs ${
                                  isTargetActive
                                    ? 'bg-[#8b6f4e] text-white'
                                    : 'border border-[#8b6f4e]/30 bg-[#8b6f4e]/10 text-[#8b6f4e] hover:bg-[#8b6f4e]/20'
                                }`}
                                title="Click to select this record, then click any image in gallery"
                              >
                                {isTargetActive ? 'Selected' : 'Map'}
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  setPickerTarget({
                                    record,
                                    device: 'desktop',
                                    placement: activeModule === 'category' ? 'icon' : 'primary',
                                    currentMediaId: record.desktopMapping?.mediaId,
                                  })
                                }
                                className="rounded-lg border border-stone-200 bg-white hover:bg-stone-50 px-2 py-1 text-[11px] font-semibold text-stone-700 transition cursor-pointer shadow-2xs"
                                title="Browse full media library modal"
                              >
                                Browse
                              </button>
                              {hasDesktopOverride && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleDeleteMapping(
                                      record,
                                      'desktop',
                                      activeModule === 'category' ? 'icon' : 'primary'
                                    )
                                  }
                                  className="rounded-lg border border-red-200 bg-red-50 hover:bg-red-100 p-1 text-red-700 transition cursor-pointer"
                                  title="Revert to default storefront image"
                                >
                                  <HiOutlineTrash className="h-3.5 w-3.5" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* ═══════════════════════════════════════════════════════════
            RIGHT COLUMN: THEME MEDIA GALLERY SIDE PANEL (xl:col-span-5)
            ═══════════════════════════════════════════════════════════ */}
        <div className="xl:col-span-5 sticky top-4 space-y-3.5">
          <div className="rounded-2xl border border-stone-200 bg-white shadow-2xs overflow-hidden">
            {/* Side Panel Header */}
            <div className="p-4 border-b border-stone-200 bg-stone-50/80">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-[#8b6f4e] text-white flex items-center justify-center shadow-2xs">
                    <HiOutlinePhotograph className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-stone-900 leading-tight">
                      Theme Media Gallery
                    </h3>
                    <p className="text-[11px] text-stone-500">
                      Drag & Drop onto any banner on the left
                    </p>
                  </div>
                </div>

                {/* Upload Button */}
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => panelFileInputRef.current?.click()}
                    disabled={panelUploading}
                    className="inline-flex items-center gap-1 rounded-xl bg-[#8b6f4e] hover:brightness-95 px-3 py-1.5 text-xs font-semibold text-white shadow-2xs transition cursor-pointer disabled:opacity-50"
                  >
                    <HiOutlineUpload className="h-3.5 w-3.5" />
                    <span>{panelUploading ? 'Uploading…' : '+ Upload'}</span>
                  </button>
                  <input
                    ref={panelFileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      e.target.value = '';
                      if (file) handleSidePanelUpload(file);
                    }}
                  />
                  <button
                    type="button"
                    onClick={fetchSideGallery}
                    disabled={galleryLoading}
                    className="p-1.5 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-stone-600 transition cursor-pointer"
                    title="Refresh gallery"
                  >
                    <HiOutlineRefresh className={`h-3.5 w-3.5 ${galleryLoading ? 'animate-spin' : ''}`} />
                  </button>
                </div>
              </div>

              {/* Scope Switcher: This Theme vs All Gallery */}
              <div className="mt-3 flex items-center gap-1 bg-stone-200/60 p-0.5 rounded-xl text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setGalleryScope('theme')}
                  className={`flex-1 py-1.5 rounded-lg text-center transition cursor-pointer ${
                    galleryScope === 'theme'
                      ? 'bg-white text-stone-900 shadow-2xs'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  This Theme ({theme?.name || 'Theme'})
                </button>
                <button
                  type="button"
                  onClick={() => setGalleryScope('all')}
                  className={`flex-1 py-1.5 rounded-lg text-center transition cursor-pointer ${
                    galleryScope === 'all'
                      ? 'bg-white text-stone-900 shadow-2xs'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  All Media Library
                </button>
              </div>

              {/* Search & Placement Filter */}
              <div className="mt-2.5 flex items-center gap-2">
                <div className="relative flex-1">
                  <HiOutlineSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-stone-400" />
                  <input
                    type="text"
                    value={gallerySearch}
                    onChange={(e) => setGallerySearch(e.target.value)}
                    placeholder="Search gallery..."
                    className="w-full h-8 pl-8 pr-7 rounded-lg border border-stone-200 bg-white text-xs text-stone-800 outline-none transition focus:border-[#8b6f4e] placeholder:text-stone-400"
                  />
                  {gallerySearch && (
                    <button
                      type="button"
                      onClick={() => setGallerySearch('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 cursor-pointer"
                    >
                      <HiOutlineX className="h-3 w-3" />
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-1 overflow-x-auto shrink-0 max-w-full pb-0.5">
                  {[
                    ['all', 'All'],
                    ['herobanner', 'Hero'],
                    ['celebrate', 'Gifts'],
                    ['categorybanner', 'Cat'],
                    ['collectionbanner', 'Colls'],
                    ['offerbanner', 'Offers'],
                    ['mobileappbanner', 'App'],
                    ['bookappointbanner', 'Appt'],
                    ['customizebanner', 'Custom'],
                  ].map(([val, lbl]) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => handlePlacementSelect(val)}
                      className={`rounded-lg px-2 py-1 text-[11px] font-semibold transition cursor-pointer shrink-0 ${
                        galleryTypeFilter === val
                          ? 'bg-[#8b6f4e] text-white shadow-2xs'
                          : 'bg-white border border-stone-200 text-stone-600 hover:bg-stone-50'
                      }`}
                    >
                      {lbl}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Gallery Images Grid */}
            <div className="p-3.5 max-h-[620px] overflow-y-auto">
              {galleryLoading ? (
                <div className="py-20 text-center text-xs text-stone-500 space-y-2">
                  <HiOutlineRefresh className="h-6 w-6 animate-spin mx-auto text-[#8b6f4e]" />
                  <p>Loading theme gallery…</p>
                </div>
              ) : sideGalleryItems.length === 0 ? (
                <div className="py-14 text-center text-xs text-stone-500 space-y-2.5">
                  <HiOutlinePhotograph className="h-8 w-8 mx-auto text-stone-300" />
                  <p className="font-bold text-stone-800">
                    {galleryScope === 'theme'
                      ? `No images uploaded for ${theme?.name || 'this theme'} yet`
                      : 'No images found in Media Gallery'}
                  </p>
                  <p className="text-[11px] text-stone-400 max-w-xs mx-auto">
                    {galleryScope === 'theme' ? (
                      <>
                        Switch to{' '}
                        <button
                          type="button"
                          onClick={() => setGalleryScope('all')}
                          className="text-[#8b6f4e] font-semibold underline cursor-pointer"
                        >
                          All Media Library
                        </button>{' '}
                        or click <strong>+ Upload</strong> above to upload festive images.
                      </>
                    ) : (
                      'Click "+ Upload" above to add images.'
                    )}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {sideGalleryItems.map((item) => {
                    const imgUrl = item.image?.url || item.url;
                    const displayName = item.name || item.fileName || `Asset ${String(item._id).slice(-4)}`;
                    const isLinked = Boolean(item.linkedRecord?.recordId);

                    return (
                      <div
                        key={item._id}
                        draggable={true}
                        onDragStart={(e) => {
                          draggedAssetRef.current = item;
                          try {
                            const payload = JSON.stringify(item);
                            e.dataTransfer.setData('application/json', payload);
                            e.dataTransfer.setData('text/plain', payload);
                          } catch (_) {}
                          e.dataTransfer.effectAllowed = 'copy';
                        }}
                        onDragEnd={() => {
                          draggedAssetRef.current = null;
                          setDragOverSlot(null);
                        }}
                        onClick={() => handleGalleryItemClick(item)}
                        className={`group relative rounded-xl border overflow-hidden bg-white cursor-grab active:cursor-grabbing transition-all duration-200 hover:shadow-md ${
                          activeTargetSlot
                            ? 'border-amber-300 ring-2 ring-amber-200/50 hover:border-amber-500'
                            : 'border-stone-200 hover:border-[#8b6f4e]'
                        }`}
                        title="Drag this image onto any banner card on the left"
                      >
                        {/* Image Thumbnail */}
                        <div className="aspect-4/3 w-full bg-stone-100 overflow-hidden relative">
                          <img
                            src={imgUrl}
                            alt={displayName}
                            draggable={false}
                            className="w-full h-full object-cover select-none pointer-events-none transition duration-300 group-hover:scale-105"
                          />

                          {/* Hover Drag Badge */}
                          <div className="absolute top-1.5 left-1.5 rounded-md bg-stone-900/75 backdrop-blur-xs text-white px-1.5 py-0.5 text-[9px] font-bold flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                            <span>⋮⋮ Drag</span>
                          </div>

                          {/* Linked Record Indicator */}
                          {isLinked && (
                            <div className="absolute top-1.5 right-1.5 rounded-md bg-emerald-600/90 text-white p-1 text-[9px] font-bold shadow-xs" title="Linked to a banner/featured record">
                              <HiOutlineLink className="h-3 w-3" />
                            </div>
                          )}

                          {/* Click to Map Overlay when Active Target is selected */}
                          {activeTargetSlot && (
                            <div className="absolute inset-0 bg-[#8b6f4e]/80 opacity-0 group-hover:opacity-100 transition flex flex-col items-center justify-center text-white p-2 text-center">
                              <HiOutlineCursorClick className="h-5 w-5 mb-1" />
                              <span className="text-[10px] font-bold leading-tight">
                                Click to Map
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Image Info */}
                        <div className="p-2 bg-white">
                          <p className="text-[11px] font-semibold text-stone-800 truncate" title={displayName}>
                            {displayName}
                          </p>
                          <div className="flex items-center justify-between text-[10px] text-stone-400 mt-0.5">
                            <span className="capitalize truncate max-w-[80px]">
                              {item.placement || item.type || 'media'}
                            </span>
                            {item.platform && (
                              <span className="uppercase text-[9px] font-mono bg-stone-100 px-1 rounded">
                                {item.platform}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Side Panel Footer Guidance */}
            <div className="p-3 bg-amber-50/60 border-t border-amber-200/60 flex items-start gap-2 text-[11px] text-amber-900">
              <HiOutlineSparkles className="h-4 w-4 shrink-0 text-amber-700 mt-0.5" />
              <p className="leading-tight">
                <strong>How it works:</strong> Drag any image above and drop it directly onto an unmapped banner on the left. Or click <strong>"Map"</strong> on any banner, then click an image here.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          5. MODAL: MEDIA GALLERY PICKER (When user clicks "Browse")
          ───────────────────────────────────────────────────────────── */}
      {pickerTarget && (
        <GalleryPickerModal
          target={pickerTarget}
          activeModule={activeModule}
          onClose={() => setPickerTarget(null)}
          onSelect={handleSaveMapping}
          onDirectUpload={(file) =>
            handleDirectUpload(
              file,
              pickerTarget.record,
              pickerTarget.device,
              pickerTarget.placement
            )
          }
        />
      )}

      {/* ─────────────────────────────────────────────────────────────
          6. MODAL: ONE-CLICK ACTIVATION CONFIRMATION
          ───────────────────────────────────────────────────────────── */}
      {showActivateModal && (
        <ActivationConfirmModal
          theme={theme}
          summary={summary}
          activating={activating}
          onClose={() => setShowActivateModal(false)}
          onConfirm={handleActivateTheme}
        />
      )}
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════
// SUBCOMPONENT: GALLERY PICKER + DIRECT UPLOADER MODAL
// ═════════════════════════════════════════════════════════════════════
function GalleryPickerModal({ target, onClose, onSelect, onDirectUpload }) {
  const [activeTab, setActiveTab] = useState('gallery'); // 'gallery' or 'upload'
  const [galleryItems, setGalleryItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [saving, setSaving] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

  // Fetch Gallery Assets
  const fetchGalleryAssets = useCallback(async () => {
    try {
      setLoading(true);
      const res = await galleryAPI.getAll({
        search,
        type: selectedType === 'all' ? undefined : selectedType,
        limit: 100,
      });
      const data = res.data?.data || res.data || {};
      const items = data.items || [];
      setGalleryItems(items);

      if (target.currentMediaId) {
        const found = items.find((i) => String(i._id) === String(target.currentMediaId));
        if (found) setSelectedAsset(found);
      }
    } catch (err) {
      console.error('Failed to fetch gallery media for picker:', err);
      toast.error('Could not load Media Gallery assets');
    } finally {
      setLoading(false);
    }
  }, [search, selectedType, target.currentMediaId]);

  useEffect(() => {
    fetchGalleryAssets();
  }, [fetchGalleryAssets]);

  const handleConfirm = async () => {
    if (!selectedAsset) return;
    try {
      setSaving(true);
      await onSelect(selectedAsset);
    } finally {
      setSaving(false);
    }
  };

  const handleFileDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      onDirectUpload(file);
      onClose();
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      onDirectUpload(file);
      onClose();
    }
  };

  const deviceLabel = target.device === 'mobile' ? 'Mobile Variant' : 'Primary Desktop';
  const recordTitle = target.record.title || target.record.name || 'Storefront Item';

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="relative w-full max-w-4xl max-h-[90vh] flex flex-col rounded-2xl bg-white shadow-2xl border border-stone-200 overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-stone-200 p-4 sm:p-5 bg-stone-50/70">
          <div>
            <div className="flex items-center gap-2">
              <HiOutlinePhotograph className="h-5 w-5 text-[#8b6f4e]" />
              <h3 className="text-base font-bold text-stone-900">
                Choose or Upload Theme Image
              </h3>
            </div>
            <p className="mt-0.5 text-xs text-stone-500">
              Customizing <span className="font-semibold text-stone-800">"{recordTitle}"</span> ·{' '}
              <span className="font-semibold text-[#8b6f4e]">{deviceLabel}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-stone-200 bg-white p-2 text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition cursor-pointer"
          >
            <HiOutlineX className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Tabs: Gallery vs Direct Upload */}
        <div className="border-b border-stone-200 bg-stone-50/40 px-4 sm:px-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('gallery')}
              className={`py-3 px-3 border-b-2 text-xs font-bold transition cursor-pointer ${
                activeTab === 'gallery'
                  ? 'border-[#8b6f4e] text-[#8b6f4e]'
                  : 'border-transparent text-stone-500 hover:text-stone-800'
              }`}
            >
              Browse Media Gallery ({galleryItems.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('upload')}
              className={`py-3 px-3 border-b-2 text-xs font-bold transition cursor-pointer ${
                activeTab === 'upload'
                  ? 'border-[#8b6f4e] text-[#8b6f4e]'
                  : 'border-transparent text-stone-500 hover:text-stone-800'
              }`}
            >
              Upload New File Directly
            </button>
          </div>
        </div>

        {/* Modal Body */}
        {activeTab === 'upload' ? (
          /* Direct Drag & Drop Upload Tab */
          <div className="p-8 sm:p-12 flex-1 flex flex-col items-center justify-center">
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleFileDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`w-full max-w-lg p-10 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center text-center cursor-pointer transition ${
                dragOver
                  ? 'border-[#8b6f4e] bg-[#8b6f4e]/10 scale-102'
                  : 'border-stone-300 hover:border-[#8b6f4e] bg-stone-50 hover:bg-stone-50/50'
              }`}
            >
              <div className="w-16 h-16 rounded-2xl bg-amber-100/70 text-[#8b6f4e] flex items-center justify-center mb-4 shadow-2xs">
                <HiOutlineCloudUpload className="h-8 w-8" />
              </div>
              <h4 className="font-bold text-stone-900 text-sm">
                Drag and drop your festival image here
              </h4>
              <p className="text-xs text-stone-500 mt-1 max-w-xs">
                PNG, JPG, or WebP. The image will be compressed automatically and mapped to this record.
              </p>
              <button
                type="button"
                className="mt-4 rounded-xl bg-[#8b6f4e] hover:brightness-95 px-4 py-2 text-xs font-semibold text-white shadow-2xs cursor-pointer"
              >
                Browse File from Computer
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileSelect}
              />
            </div>
          </div>
        ) : (
          /* Media Gallery Grid Tab */
          <>
            {/* Search & Categories */}
            <div className="p-4 border-b border-stone-100 bg-white flex flex-col sm:flex-row gap-3 items-center justify-between">
              <div className="relative w-full sm:w-72">
                <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search gallery images..."
                  className="w-full h-9 pl-9 pr-8 rounded-xl border border-stone-200 bg-white text-xs text-stone-800 outline-none transition focus:border-[#8b6f4e] focus:ring-2 focus:ring-[#8b6f4e]/15 placeholder:text-stone-400"
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

              <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
                {[
                  ['all', 'All Gallery'],
                  ['herobanner', 'Hero'],
                  ['celebrate', 'Celebrate'],
                  ['collectionbanner', 'Collections'],
                  ['categorybanner', 'Categories'],
                  ['asset', 'Assets'],
                ].map(([val, lbl]) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setSelectedType(val)}
                    className={`rounded-lg px-2.5 py-1 text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                      selectedType === val
                        ? 'bg-[#8b6f4e] text-white shadow-2xs'
                        : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                    }`}
                  >
                    {lbl}
                  </button>
                ))}
              </div>
            </div>

            {/* Gallery Grid */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5">
              {loading ? (
                <div className="py-24 text-center text-xs text-stone-500 space-y-2">
                  <HiOutlineRefresh className="h-6 w-6 animate-spin mx-auto text-[#8b6f4e]" />
                  <p>Fetching uploaded Media Gallery images…</p>
                </div>
              ) : galleryItems.length === 0 ? (
                <div className="py-20 text-center text-xs text-stone-500 space-y-2">
                  <HiOutlinePhotograph className="h-8 w-8 mx-auto text-stone-300" />
                  <p className="font-semibold text-stone-700">No images found in Media Gallery</p>
                  <p className="text-[11px] text-stone-400">
                    Switch to the "Upload New File" tab above to upload directly.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                  {galleryItems.map((item) => {
                    const imgUrl = item.image?.url || item.url;
                    const isSelected = selectedAsset?._id === item._id;
                    const displayName = item.name || item.fileName || `Image ${String(item._id).slice(-4)}`;

                    return (
                      <div
                        key={item._id}
                        onClick={() => setSelectedAsset(item)}
                        className={`group relative rounded-xl border-2 overflow-hidden bg-stone-50 cursor-pointer transition-all ${
                          isSelected
                            ? 'border-[#8b6f4e] ring-2 ring-[#8b6f4e]/20 shadow-md scale-102'
                            : 'border-stone-200 hover:border-stone-300 hover:shadow-sm'
                        }`}
                      >
                        <div className="aspect-4/3 w-full overflow-hidden bg-stone-100">
                          <img
                            src={imgUrl}
                            alt={displayName}
                            className="w-full h-full object-cover transition duration-300 group-hover:scale-105"
                          />
                        </div>

                        {isSelected && (
                          <div className="absolute top-2 right-2 rounded-full bg-[#8b6f4e] text-white p-1 shadow-sm">
                            <HiOutlineCheck className="h-3.5 w-3.5 stroke-2" />
                          </div>
                        )}

                        <div className="p-2 bg-white">
                          <p className="text-[11px] font-semibold text-stone-800 truncate" title={displayName}>
                            {displayName}
                          </p>
                          <div className="flex items-center justify-between text-[10px] text-stone-400 mt-0.5">
                            <span className="capitalize">{item.type || 'media'}</span>
                            {item.platform && <span className="uppercase">{item.platform}</span>}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}

        {/* Modal Footer */}
        {activeTab === 'gallery' && (
          <div className="border-t border-stone-200 p-4 bg-stone-50/80 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 w-full sm:w-auto">
              {selectedAsset ? (
                <div className="flex items-center gap-2">
                  <div className="w-10 h-8 rounded border border-stone-200 overflow-hidden bg-stone-100 shrink-0">
                    <img
                      src={selectedAsset.image?.url || selectedAsset.url}
                      alt="preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="text-left">
                    <span className="text-[11px] font-bold text-stone-800 block truncate max-w-[200px]">
                      {selectedAsset.name || selectedAsset.fileName || 'Selected Media Asset'}
                    </span>
                    <span className="text-[10px] text-emerald-700 font-semibold">
                      Ready to map to {deviceLabel}
                    </span>
                  </div>
                </div>
              ) : (
                <span className="text-xs text-stone-500 italic">
                  Select an image from the grid above
                </span>
              )}
            </div>

            <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={onClose}
                disabled={saving}
                className="rounded-xl border border-stone-200 bg-white hover:bg-stone-50 px-4 py-2 text-xs font-semibold text-stone-700 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={!selectedAsset || saving}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#8b6f4e] hover:brightness-95 px-5 py-2 text-xs font-semibold text-white shadow-xs transition disabled:opacity-50 cursor-pointer"
              >
                <HiOutlineCheck className="h-4 w-4 stroke-2" />
                <span>{saving ? 'Saving Mapping…' : 'Use This Image'}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}

// ═════════════════════════════════════════════════════════════════════
// SUBCOMPONENT: ONE-CLICK ACTIVATION CONFIRMATION MODAL
// ═════════════════════════════════════════════════════════════════════
function ActivationConfirmModal({ theme, summary, activating, onClose, onConfirm }) {
  const total = summary?.summary?.totalRecords || 0;
  const mapped = summary?.summary?.mappedRecords || 0;
  const missing = summary?.summary?.missingRecords || 0;
  const pct = summary?.summary?.completionPercentage || 0;
  const isFullyMapped = summary?.summary?.isFullyMapped;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-stone-200 overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-stone-200 bg-stone-50/70 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <HiOutlineCheckCircle className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-stone-900">
                Activate Theme on Storefront
              </h3>
              <p className="text-xs text-stone-500">
                One-Click Storefront Theme Switch
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-stone-200 bg-white p-2 text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition cursor-pointer"
          >
            <HiOutlineX className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 text-xs text-stone-700">
          <p>
            You are about to activate theme <span className="font-bold text-stone-900">"{theme?.name}"</span> as the live storefront theme.
          </p>

          <div className="rounded-xl border border-stone-200 bg-stone-50 p-4 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-stone-700">Mapping Readiness</span>
              <span className="font-bold text-stone-900">
                {mapped} / {total} records customized ({pct}%)
              </span>
            </div>

            <div className="w-full h-2 rounded-full bg-stone-200 overflow-hidden">
              <div
                className={`h-full ${pct === 100 ? 'bg-emerald-500' : 'bg-amber-500'}`}
                style={{ width: `${pct}%` }}
              />
            </div>

            {isFullyMapped ? (
              <div className="flex items-start gap-2 text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg p-2.5 text-[11px]">
                <HiOutlineCheckCircle className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" />
                <span>
                  All records are mapped with theme-specific media. The storefront will display full theme visuals.
                </span>
              </div>
            ) : (
              <div className="flex items-start gap-2 text-amber-900 bg-amber-50 border border-amber-200 rounded-lg p-2.5 text-[11px]">
                <HiOutlineInformationCircle className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
                <span>
                  <strong>Safe Fallback:</strong> {missing} record(s) are unmapped. They will safely display their original fallback images so no broken images or missing content will appear on the storefront.
                </span>
              </div>
            )}
          </div>

          <p className="text-stone-500 text-[11px] leading-relaxed">
            Activating this theme will immediately update the live website storefront settings.
          </p>
        </div>

        {/* Footer */}
        <div className="border-t border-stone-200 p-4 bg-stone-50/70 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            disabled={activating}
            className="rounded-xl border border-stone-200 bg-white hover:bg-stone-50 px-4 py-2 text-xs font-semibold text-stone-700 transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={activating}
            className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-5 py-2 text-xs font-semibold text-white shadow-xs transition cursor-pointer disabled:opacity-50"
          >
            <HiOutlineCheck className="h-4 w-4 stroke-2" />
            <span>{activating ? 'Activating Storefront…' : 'Confirm & Activate Theme'}</span>
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
