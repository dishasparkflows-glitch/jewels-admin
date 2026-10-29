import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
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
  HiOutlineExclamation,
  HiOutlineArrowRight,
  HiOutlineInformationCircle,
  HiOutlineUpload,
  HiOutlineEye,
  HiOutlineViewList,
  HiOutlineCloudUpload,
} from 'react-icons/hi';
import { IoDiamondOutline } from 'react-icons/io5';
import toast from 'react-hot-toast';
import { websiteThemesAPI, galleryAPI } from '../../api/services';
import { useConfirm } from '../../contexts/ConfirmContext';
import { useImagePreview } from '../../contexts/ImagePreviewContext';
import { uploadWithPresignedUrl, formatBytes } from '../../utils/uploadWithPresignedUrl';

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
  const [statusFilter, setStatusFilter] = useState('all'); // all, mapped, unmapped
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState('cards'); // 'cards' (visual) or 'table' (compact)

  // Data state
  const [loading, setLoading] = useState(false);
  const [records, setRecords] = useState([]);
  const [summary, setSummary] = useState(null);
  const [selectedIds, setSelectedIds] = useState(new Set());

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

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

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
      await Promise.all([fetchRecords(), fetchSummary()]);
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

    const toastId = toast.loading(`Uploading ${file.name}…`);
    try {
      // 1. Upload file via presigned URL with auto-compression
      const upload = await uploadWithPresignedUrl(file, 'website-themes');

      // 2. Register media in Gallery
      const galleryRes = await galleryAPI.create({
        name: file.name.replace(/\.[^/.]+$/, ''),
        type: activeModule,
        placement: device,
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

      await Promise.all([fetchRecords(), fetchSummary()]);
    } catch (err) {
      console.error('Direct upload failed:', err);
      toast.error(err.response?.data?.message || 'Could not upload theme image', {
        id: toastId,
      });
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
      await Promise.all([fetchRecords(), fetchSummary()]);
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
      await Promise.all([fetchRecords(), fetchSummary()]);
    } catch (err) {
      console.error('Bulk clear failed:', err);
      toast.error('Failed to clear some mappings');
    } finally {
      setBulkActionLoading(false);
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
          1. TOP THEME BANNER & SUMMARY PROGRESS
          ───────────────────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-stone-200 bg-white p-4 sm:p-5 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
                Selected Theme:
              </span>
              <h2 className="text-lg sm:text-xl font-bold text-stone-900 tracking-tight">
                {theme?.name || 'Theme Media Management'}
              </h2>
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold capitalize ${
                  theme?.status === 'active'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-amber-600 text-white'
                }`}
              >
                {theme?.status || 'draft'}
              </span>
              {isLive && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
                  <span className="h-2 w-2 rounded-full bg-emerald-600 animate-pulse" />
                  Currently Live Storefront
                </span>
              )}
            </div>
            <p className="mt-1 text-xs text-stone-500 max-w-2xl leading-relaxed">
              Upload or map festive images for this theme. Any item left unmapped will{' '}
              <strong className="text-stone-700 font-semibold">safely fall back</strong> to its default storefront image so your website never displays blank spaces.
            </p>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => {
                if (onPreview) onPreview();
                else window.open('/', '_blank');
              }}
              className="inline-flex items-center gap-1.5 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 px-3.5 py-2 text-xs font-semibold text-stone-700 shadow-2xs transition cursor-pointer"
            >
              <HiOutlineExternalLink className="h-4 w-4 text-stone-500" />
              <span>Preview Storefront</span>
            </button>

            {!isLive ? (
              <button
                type="button"
                onClick={() => setShowActivateModal(true)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-4 py-2 text-xs font-semibold text-white shadow-2xs transition hover:shadow cursor-pointer"
              >
                <HiOutlineCheck className="h-4 w-4 stroke-2" />
                <span>Publish Theme Live</span>
              </button>
            ) : (
              <div className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-50 border border-emerald-200 px-3 py-2 text-xs font-semibold text-emerald-800">
                <HiOutlineCheckCircle className="h-4 w-4 text-emerald-600" />
                <span>Active on Storefront</span>
              </div>
            )}
          </div>
        </div>

        {/* ─── Mapping Completion Summary Strip ─── */}
        <div className="mt-4 pt-4 border-t border-stone-100 grid grid-cols-1 lg:grid-cols-12 gap-3 items-center">
          <div className="lg:col-span-5 space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-stone-700">Theme Readiness Progress</span>
              <span className="font-bold text-stone-900">
                {mappedAllRecords} / {totalAllRecords} items customized ({completionPct}%)
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-stone-100 overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${
                  completionPct === 100
                    ? 'bg-emerald-500'
                    : completionPct > 50
                    ? 'bg-[#8b6f4e]'
                    : 'bg-amber-500'
                }`}
                style={{ width: `${completionPct}%` }}
              />
            </div>
          </div>

          {/* Module Pills */}
          <div className="lg:col-span-7 flex flex-wrap items-center gap-1.5 lg:justify-end text-[11px]">
            {(summary?.breakdown || []).map((b) => (
              <button
                key={b.module}
                type="button"
                onClick={() => setActiveModule(b.module)}
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl border text-[11px] font-medium transition cursor-pointer ${
                  activeModule === b.module
                    ? 'border-[#8b6f4e] bg-[#8b6f4e]/10 text-[#8b6f4e] font-bold shadow-2xs'
                    : 'border-stone-200 bg-stone-50 text-stone-600 hover:bg-stone-100'
                }`}
              >
                <span>{b.label}:</span>
                <span
                  className={`font-bold ${
                    b.mapped === b.total && b.total > 0
                      ? 'text-emerald-700'
                      : 'text-stone-700'
                  }`}
                >
                  {b.mapped}/{b.total}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          2. MODULE TABS STRIP
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
          3. ACTIVE MODULE GUIDANCE & DIMENSIONS BAR
          ───────────────────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-amber-200/70 bg-gradient-to-r from-amber-50/60 via-amber-50/30 to-stone-50 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-start gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 mt-0.5">
            <HiOutlineInformationCircle className="h-5 w-5" />
          </div>
          <div>
            <div className="font-bold text-stone-900 flex items-center gap-2">
              <span>{activeModuleConfig.label} Section Guide</span>
              <span className="text-[11px] font-normal text-stone-500">
                ({activeBreakdown?.mapped || 0} of {activeBreakdown?.total || 0} customized)
              </span>
            </div>
            <p className="text-stone-600 text-[11px] mt-0.5">
              {activeModuleConfig.description}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0 bg-white/80 rounded-xl border border-stone-200/80 px-3 py-1.5 text-[11px]">
          <span className="text-stone-500 font-medium">Recommended:</span>
          <span className="inline-flex items-center gap-1 font-semibold text-stone-800">
            <HiOutlineDesktopComputer className="h-3.5 w-3.5 text-stone-400" />
            {activeModuleConfig.recommendedDesktop}
          </span>
          <span className="text-stone-300">|</span>
          <span className="inline-flex items-center gap-1 font-semibold text-stone-800">
            <HiOutlineDeviceMobile className="h-3.5 w-3.5 text-stone-400" />
            {activeModuleConfig.recommendedMobile}
          </span>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          4. CONTROLS ROW: Search, Status Filter, View Toggle & Bulk Actions
          ───────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Left: Search & Filter */}
        <div className="flex items-center gap-2 flex-1 max-w-xl">
          <div className="relative flex-1">
            <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={`Search ${activeModuleConfig.label} by title, link, or position...`}
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

          {/* Filter Pills */}
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
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition cursor-pointer ${
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

        {/* Right: View Toggle (Cards vs Table) & Actions */}
        <div className="flex items-center gap-2 justify-end">
          {/* View Toggle */}
          <div className="flex items-center rounded-xl border border-stone-200 bg-white p-0.5 shadow-2xs">
            <button
              type="button"
              onClick={() => setViewMode('cards')}
              title="Visual Cards View (Recommended)"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                viewMode === 'cards'
                  ? 'bg-[#8b6f4e] text-white shadow-2xs'
                  : 'text-stone-600 hover:bg-stone-50'
              }`}
            >
              <HiOutlineViewGrid className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Visual Cards</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              title="Compact Table View"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
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
            <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-1 text-xs text-amber-900 font-medium">
              <span>{selectedIds.size} selected</span>
              <button
                type="button"
                onClick={handleBulkClear}
                disabled={bulkActionLoading}
                className="inline-flex items-center gap-1 text-red-700 hover:text-red-900 font-bold hover:underline cursor-pointer disabled:opacity-50"
              >
                <HiOutlineTrash className="h-3.5 w-3.5" />
                <span>Revert Selected</span>
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={() => {
              fetchRecords();
              fetchSummary();
            }}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-stone-50 border border-stone-200 text-stone-700 rounded-xl text-xs font-semibold shadow-2xs transition cursor-pointer"
            title="Refresh records"
          >
            <HiOutlineRefresh className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          5. MAIN CONTENT: VISUAL CARDS OR COMPACT TABLE
          ───────────────────────────────────────────────────────────── */}
      {loading ? (
        <div className="rounded-2xl border border-stone-200 bg-white py-24 text-center text-xs text-stone-500 space-y-2 shadow-2xs">
          <HiOutlineRefresh className="h-7 w-7 animate-spin mx-auto text-[#8b6f4e]" />
          <p className="font-semibold text-stone-700">Loading {activeModuleConfig.label} records…</p>
        </div>
      ) : filteredRecords.length === 0 ? (
        <div className="rounded-2xl border border-stone-200 bg-white py-20 text-center text-xs text-stone-500 space-y-2 shadow-2xs">
          <HiOutlinePhotograph className="h-10 w-10 mx-auto text-stone-300" />
          <p className="font-bold text-stone-800 text-sm">No records found for this module</p>
          <p className="text-stone-400 max-w-sm mx-auto">
            {search
              ? `No records match "${search}". Try clearing your search.`
              : `No existing records found in ${activeModuleConfig.label}. Create them in the main module first.`}
          </p>
        </div>
      ) : viewMode === 'cards' ? (
        /* ═════════════════════════════════════════════════════════════
           VIEW MODE 1: VISUAL CARDS (BEFORE & AFTER SIDE-BY-SIDE)
           ═════════════════════════════════════════════════════════════ */
        <div className="space-y-4">
          {/* Master Select All Bar */}
          <div className="flex items-center justify-between bg-stone-100/70 border border-stone-200/80 rounded-xl px-4 py-2 text-xs text-stone-600">
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

          <div className="grid grid-cols-1 gap-4">
            {filteredRecords.map((record) => {
              const isSelected = selectedIds.has(String(record._id));
              const isMapped = record.isMapped;
              const fallback = resolveFallbackMedia(record);

              // Desktop slot mapping
              const desktopMappedImg = record.desktopMapping?.imageUrl;
              const hasDesktopOverride = Boolean(desktopMappedImg);

              // Mobile slot mapping
              const mobileMappedImg =
                activeModule === 'category'
                  ? record.bannerMapping?.imageUrl
                  : record.mobileMapping?.imageUrl;
              const hasMobileOverride = Boolean(mobileMappedImg);

              return (
                <div
                  key={record._id}
                  className={`rounded-2xl border transition-all duration-200 bg-white overflow-hidden shadow-2xs ${
                    hasDesktopOverride || hasMobileOverride
                      ? 'border-[#8b6f4e]/30 ring-1 ring-[#8b6f4e]/10'
                      : 'border-stone-200 hover:border-stone-300'
                  } ${isSelected ? 'ring-2 ring-amber-400 bg-amber-50/20' : ''}`}
                >
                  {/* Card Header Bar */}
                  <div className="p-3.5 sm:p-4 border-b border-stone-100 bg-stone-50/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-start sm:items-center gap-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelectRow(record._id)}
                        className="rounded border-stone-300 text-[#8b6f4e] focus:ring-[#8b6f4e] mt-0.5 sm:mt-0"
                      />

                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="inline-flex items-center rounded-md bg-[#8b6f4e]/10 text-[#8b6f4e] px-2 py-0.5 text-[11px] font-bold">
                            {record.slotLabel || `${activeModuleConfig.label} · Slide #${(record.order ?? 0) + 1}`}
                          </span>
                          <h3 className="font-bold text-stone-900 text-sm">
                            {record.title || record.name || 'Storefront Item'}
                          </h3>
                        </div>

                        <div className="flex items-center gap-2.5 text-[11px] text-stone-500 mt-0.5 flex-wrap">
                          {record.subtitle && (
                            <span>{record.subtitle}</span>
                          )}
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

                    {/* Overall Status Badge */}
                    <div className="flex items-center gap-2 self-start sm:self-auto">
                      {isMapped ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs font-bold text-emerald-800">
                          <HiOutlineCheckCircle className="h-4 w-4 text-emerald-600" />
                          <span>Customized for {theme?.name || 'Theme'}</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 border border-amber-200 px-3 py-1 text-xs font-medium text-amber-800">
                          <span className="h-2 w-2 rounded-full bg-amber-500" />
                          <span>Using Default Storefront Fallback</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Card Body: Desktop / Primary Slot & Mobile Slot */}
                  <div className="p-4 sm:p-5 space-y-4">
                    {/* Primary / Desktop Comparison Row */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-stone-700 flex items-center gap-1.5">
                          <HiOutlineDesktopComputer className="h-4 w-4 text-stone-400" />
                          {activeModule === 'category' ? 'Category Icon' : 'Primary Desktop Banner'}
                        </span>
                        <span className="text-[11px] text-stone-400">
                          {activeModule === 'category' ? '500 × 500 px' : '1920 × 600 px'}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-stretch">
                        {/* 1. Left Box: Default Storefront Image */}
                        <div className="rounded-xl border border-stone-200 bg-stone-50/70 p-3 flex items-center gap-3 relative">
                          <div
                            onClick={() =>
                              fallback.primary &&
                              openImagePreview(fallback.primary, {
                                title: `${record.title} · Default Image`,
                              })
                            }
                            className={`w-28 h-20 sm:w-36 sm:h-22 rounded-lg border border-stone-200 overflow-hidden bg-white shrink-0 relative group ${
                              fallback.primary ? 'cursor-pointer' : ''
                            }`}
                          >
                            {fallback.primary ? (
                              <>
                                <img
                                  src={fallback.primary}
                                  alt="Default Fallback"
                                  className="w-full h-full object-cover transition duration-200 group-hover:scale-105"
                                />
                                <div className="absolute inset-0 bg-stone-900/30 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white">
                                  <HiOutlineEye className="h-5 w-5" />
                                </div>
                              </>
                            ) : (
                              <div className="w-full h-full flex flex-col items-center justify-center text-stone-300 text-xs">
                                <HiOutlinePhotograph className="h-6 w-6" />
                                <span className="text-[10px] text-stone-400">No Image</span>
                              </div>
                            )}
                          </div>

                          <div className="space-y-1 min-w-0">
                            <span className="inline-flex items-center rounded-md bg-stone-200/80 px-2 py-0.5 text-[10px] font-bold text-stone-700">
                              DEFAULT STOREFRONT
                            </span>
                            <p className="text-xs font-semibold text-stone-800 truncate">
                              {fallback.primaryLabel}
                            </p>
                            <p className="text-[11px] text-stone-500 leading-tight">
                              Active when theme has no custom image.
                            </p>
                          </div>
                        </div>

                        {/* 2. Right Box: Theme Active Override */}
                        <div
                          className={`rounded-xl border p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                            hasDesktopOverride
                              ? 'border-emerald-300 bg-emerald-50/20'
                              : 'border-dashed border-stone-300 bg-white'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div
                              onClick={() =>
                                hasDesktopOverride &&
                                openImagePreview(desktopMappedImg, {
                                  title: `${record.title} · Theme Override (${theme?.name || 'Theme'})`,
                                })
                              }
                              className={`w-28 h-20 sm:w-36 sm:h-22 rounded-lg border overflow-hidden shrink-0 relative group ${
                                hasDesktopOverride
                                  ? 'border-emerald-400 bg-white cursor-pointer'
                                  : 'border-dashed border-stone-200 bg-stone-50 flex flex-col items-center justify-center text-stone-400'
                              }`}
                            >
                              {hasDesktopOverride ? (
                                <>
                                  <img
                                    src={desktopMappedImg}
                                    alt="Theme Override"
                                    className="w-full h-full object-cover transition duration-200 group-hover:scale-105"
                                  />
                                  <div className="absolute inset-0 bg-emerald-900/30 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white">
                                    <HiOutlineEye className="h-5 w-5" />
                                  </div>
                                </>
                              ) : (
                                <div className="text-center p-2">
                                  <HiOutlinePhotograph className="h-6 w-6 mx-auto text-stone-300" />
                                  <span className="text-[10px] text-stone-400 font-medium">Unmapped</span>
                                </div>
                              )}
                            </div>

                            <div className="space-y-1 min-w-0">
                              {hasDesktopOverride ? (
                                <span className="inline-flex items-center gap-1 rounded-md bg-emerald-100 text-emerald-800 px-2 py-0.5 text-[10px] font-bold">
                                  <HiOutlineCheck className="h-3 w-3 stroke-2 text-emerald-600" />
                                  {theme?.name?.toUpperCase() || 'THEME'} ACTIVE
                                </span>
                              ) : (
                                <span className="inline-flex items-center rounded-md bg-amber-100 text-amber-800 px-2 py-0.5 text-[10px] font-semibold">
                                  SAFE FALLBACK TO DEFAULT
                                </span>
                              )}
                              <p className="text-xs font-semibold text-stone-800">
                                {hasDesktopOverride
                                  ? 'Festive Image Applied'
                                  : 'No Theme Override'}
                              </p>
                              <p className="text-[11px] text-stone-500">
                                {hasDesktopOverride
                                  ? 'Displays on storefront when this theme is active.'
                                  : 'Upload a festival variant to customize.'}
                              </p>
                            </div>
                          </div>

                          {/* Action Buttons: Pick from Gallery, Direct Upload, Revert */}
                          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                            {/* Hidden File Input for Direct Upload */}
                            <label className="inline-flex items-center gap-1 rounded-xl bg-stone-100 hover:bg-stone-200 px-3 py-2 text-xs font-semibold text-stone-700 transition cursor-pointer">
                              <HiOutlineUpload className="h-3.5 w-3.5 text-stone-500" />
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
                                      'desktop',
                                      activeModule === 'category' ? 'icon' : 'primary'
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
                                  device: 'desktop',
                                  placement: activeModule === 'category' ? 'icon' : 'primary',
                                  currentMediaId: record.desktopMapping?.mediaId,
                                })
                              }
                              className="inline-flex items-center gap-1 rounded-xl bg-[#8b6f4e] hover:brightness-95 px-3 py-2 text-xs font-semibold text-white shadow-2xs transition cursor-pointer"
                            >
                              <HiOutlinePhotograph className="h-3.5 w-3.5" />
                              <span>{hasDesktopOverride ? 'Change' : 'Gallery'}</span>
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
                                className="inline-flex items-center gap-1 rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 px-2.5 py-2 text-xs font-semibold text-red-700 transition cursor-pointer"
                                title="Revert to default storefront image"
                              >
                                <HiOutlineTrash className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Secondary / Mobile Variant Row */}
                    {(activeModuleConfig.recommendedMobile || activeModule === 'category') && (
                      <div className="pt-3 border-t border-stone-100">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-bold text-stone-700 flex items-center gap-1.5">
                            <HiOutlineDeviceMobile className="h-4 w-4 text-stone-400" />
                            {activeModule === 'category' ? 'Category Page Header Banner' : 'Mobile Banner Variant'}
                          </span>
                          <span className="text-[11px] text-stone-400">
                            {activeModule === 'category' ? '1200 × 400 px' : '768 × 1200 px'}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-stretch">
                          {/* Default Mobile */}
                          <div className="rounded-xl border border-stone-200 bg-stone-50/70 p-2.5 flex items-center gap-3">
                            <div
                              onClick={() =>
                                fallback.secondary &&
                                openImagePreview(fallback.secondary, {
                                  title: `${record.title} · Default Mobile Banner`,
                                })
                              }
                              className={`w-20 h-16 rounded-lg border border-stone-200 overflow-hidden bg-white shrink-0 relative group ${
                                fallback.secondary ? 'cursor-pointer' : ''
                              }`}
                            >
                              {fallback.secondary ? (
                                <>
                                  <img
                                    src={fallback.secondary}
                                    alt="Default Mobile"
                                    className="w-full h-full object-cover"
                                  />
                                  <div className="absolute inset-0 bg-stone-900/30 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white">
                                    <HiOutlineEye className="h-4 w-4" />
                                  </div>
                                </>
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-stone-300">
                                  <HiOutlineDeviceMobile className="h-5 w-5" />
                                </div>
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-semibold text-stone-800 truncate">
                                {fallback.secondaryLabel}
                              </p>
                              <p className="text-[11px] text-stone-500">
                                {fallback.secondary ? 'Default mobile visual' : 'Uses desktop if empty'}
                              </p>
                            </div>
                          </div>

                          {/* Theme Mobile Override */}
                          <div
                            className={`rounded-xl border p-2.5 flex items-center justify-between gap-3 ${
                              hasMobileOverride
                                ? 'border-emerald-300 bg-emerald-50/20'
                                : 'border-dashed border-stone-300 bg-white'
                            }`}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div
                                onClick={() =>
                                  hasMobileOverride &&
                                  openImagePreview(mobileMappedImg, {
                                    title: `${record.title} · Theme Mobile Override (${theme?.name || 'Theme'})`,
                                  })
                                }
                                className={`w-20 h-16 rounded-lg border overflow-hidden shrink-0 relative group ${
                                  hasMobileOverride
                                    ? 'border-emerald-400 bg-white cursor-pointer'
                                    : 'border-dashed border-stone-200 bg-stone-50 flex items-center justify-center text-stone-300'
                                }`}
                              >
                                {hasMobileOverride ? (
                                  <>
                                    <img
                                      src={mobileMappedImg}
                                      alt="Theme Mobile"
                                      className="w-full h-full object-cover"
                                    />
                                    <div className="absolute inset-0 bg-emerald-900/30 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white">
                                      <HiOutlineEye className="h-4 w-4" />
                                    </div>
                                  </>
                                ) : (
                                  <HiOutlineDeviceMobile className="h-5 w-5" />
                                )}
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs font-semibold text-stone-800">
                                  {hasMobileOverride ? 'Custom Mobile Active' : 'Optional Mobile Variant'}
                                </p>
                                <p className="text-[11px] text-stone-500">
                                  {hasMobileOverride ? 'Optimized for phones' : 'Falls back to desktop'}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                              <label className="rounded-lg bg-stone-100 hover:bg-stone-200 px-2.5 py-1.5 text-[11px] font-semibold text-stone-700 transition cursor-pointer">
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
                                className="rounded-lg bg-[#8b6f4e] hover:brightness-95 px-2.5 py-1.5 text-[11px] font-semibold text-white shadow-2xs transition cursor-pointer"
                              >
                                {hasMobileOverride ? 'Change' : 'Gallery'}
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
                                  className="rounded-lg border border-red-200 bg-red-50 hover:bg-red-100 p-1.5 text-red-700 transition cursor-pointer"
                                  title="Revert mobile variant"
                                >
                                  <HiOutlineTrash className="h-3.5 w-3.5" />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* ═════════════════════════════════════════════════════════════
           VIEW MODE 2: ENHANCED DETAILED TABLE
           ═════════════════════════════════════════════════════════════ */
        <div className="rounded-2xl border border-stone-200 bg-white shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-stone-200 bg-stone-50/80 text-[11px] font-bold uppercase tracking-wider text-stone-600">
                  <th className="w-10 px-3 py-3 text-center">
                    <input
                      type="checkbox"
                      checked={isAllSelected}
                      onChange={toggleSelectAll}
                      className="rounded border-stone-300 text-[#8b6f4e] focus:ring-[#8b6f4e]"
                    />
                  </th>
                  <th className="px-4 py-3 min-w-[220px]">Record Slot & Title</th>
                  <th className="px-4 py-3 min-w-[260px]">
                    {activeModule === 'category' ? 'Category Icon' : 'Primary / Desktop Banner'}
                  </th>
                  <th className="px-4 py-3 min-w-[260px]">
                    {activeModule === 'category' ? 'Category Banner' : 'Mobile Banner Variant'}
                  </th>
                  <th className="px-4 py-3 min-w-[130px] text-center">Status</th>
                  <th className="px-4 py-3 min-w-[120px] text-right">Actions</th>
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

                  const mobileMappedImg =
                    activeModule === 'category'
                      ? record.bannerMapping?.imageUrl
                      : record.mobileMapping?.imageUrl;
                  const hasMobileOverride = Boolean(mobileMappedImg);
                  const currentMobileImg = mobileMappedImg || fallback.secondary;

                  return (
                    <tr
                      key={record._id}
                      className={`hover:bg-stone-50/70 transition-colors ${
                        isSelected ? 'bg-amber-50/40' : ''
                      }`}
                    >
                      <td className="w-10 px-3 py-3 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectRow(record._id)}
                          className="rounded border-stone-300 text-[#8b6f4e] focus:ring-[#8b6f4e]"
                        />
                      </td>

                      <td className="px-4 py-3">
                        <div className="space-y-0.5">
                          <span className="inline-flex items-center rounded-md bg-[#8b6f4e]/10 text-[#8b6f4e] px-1.5 py-0.5 text-[10px] font-bold">
                            {record.slotLabel || `${activeModuleConfig.label} · Slide #${(record.order ?? 0) + 1}`}
                          </span>
                          <div className="font-bold text-stone-900 leading-tight">
                            {record.title || record.name || 'Untitled Record'}
                          </div>
                          {record.subtitle && (
                            <p className="text-[11px] text-stone-500 line-clamp-1">
                              {record.subtitle}
                            </p>
                          )}
                          {record.targetLink && (
                            <p className="text-[10px] text-[#8b6f4e] font-mono truncate max-w-xs">
                              🔗 {record.targetLink}
                            </p>
                          )}
                        </div>
                      </td>

                      {/* Desktop Slot */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div
                            onClick={() =>
                              currentDesktopImg &&
                              openImagePreview(currentDesktopImg, {
                                title: record.title,
                              })
                            }
                            className={`w-16 h-12 rounded-lg border overflow-hidden shrink-0 relative group ${
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
                                <HiOutlinePhotograph className="h-5 w-5" />
                              </div>
                            )}
                          </div>

                          <div className="space-y-1">
                            {hasDesktopOverride ? (
                              <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 text-[10px] font-bold text-emerald-800">
                                <HiOutlineCheck className="h-3 w-3 stroke-2 text-emerald-600" />
                                Theme Mapped
                              </span>
                            ) : (
                              <span className="inline-flex items-center rounded-md bg-amber-50 border border-amber-200 px-1.5 py-0.5 text-[10px] font-medium text-amber-800">
                                Default Fallback
                              </span>
                            )}
                            <div className="flex items-center gap-2">
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
                                className="text-[11px] font-semibold text-[#8b6f4e] hover:underline cursor-pointer"
                              >
                                {hasDesktopOverride ? 'Change' : 'Choose Image'}
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
                                  className="text-[11px] font-medium text-red-600 hover:text-red-800 hover:underline cursor-pointer"
                                >
                                  Revert
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Mobile Slot */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div
                            onClick={() =>
                              currentMobileImg &&
                              openImagePreview(currentMobileImg, {
                                title: `${record.title} · Mobile`,
                              })
                            }
                            className={`w-16 h-12 rounded-lg border overflow-hidden shrink-0 relative group ${
                              hasMobileOverride ? 'border-emerald-400' : 'border-stone-200'
                            } ${currentMobileImg ? 'cursor-pointer' : ''}`}
                          >
                            {currentMobileImg ? (
                              <img
                                src={currentMobileImg}
                                alt="mobile preview"
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full bg-stone-100 flex items-center justify-center text-stone-300">
                                <HiOutlineDeviceMobile className="h-4 w-4" />
                              </div>
                            )}
                          </div>

                          <div className="space-y-1">
                            {hasMobileOverride ? (
                              <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 text-[10px] font-bold text-emerald-800">
                                <HiOutlineCheck className="h-3 w-3 stroke-2 text-emerald-600" />
                                Theme Mapped
                              </span>
                            ) : currentMobileImg ? (
                              <span className="inline-flex items-center rounded-md bg-stone-100 px-1.5 py-0.5 text-[10px] text-stone-600 font-medium">
                                Default Fallback
                              </span>
                            ) : (
                              <span className="inline-flex items-center rounded-md bg-stone-50 px-1.5 py-0.5 text-[10px] text-stone-400">
                                Optional
                              </span>
                            )}
                            <div className="flex items-center gap-2">
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
                                className="text-[11px] font-semibold text-[#8b6f4e] hover:underline cursor-pointer"
                              >
                                {hasMobileOverride ? 'Change' : 'Choose'}
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
                                  className="text-[11px] font-medium text-red-600 hover:text-red-800 hover:underline cursor-pointer"
                                >
                                  Revert
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3 text-center">
                        {isMapped ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-1 text-[11px] font-bold text-emerald-800">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-600"></span>
                            Mapped
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200 px-2.5 py-1 text-[11px] font-medium text-amber-800">
                            <span className="h-1.5 w-1.5 rounded-full bg-amber-500"></span>
                            Fallback
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3 text-right">
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
                          className="rounded-lg border border-stone-200 bg-white hover:bg-stone-50 px-3 py-1.5 text-[11px] font-semibold text-stone-700 shadow-2xs transition cursor-pointer"
                        >
                          Map Image
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          6. MODAL: MEDIA GALLERY PICKER & DIRECT UPLOADER
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
          7. MODAL: ONE-CLICK ACTIVATION CONFIRMATION
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
function GalleryPickerModal({ target, activeModule, onClose, onSelect, onDirectUpload }) {
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
