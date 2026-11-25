import { useState, useEffect, useMemo, useCallback, Fragment } from 'react';
import { createPortal } from 'react-dom';
import {
  HiOutlinePhotograph,
  HiOutlineCheck,
  HiOutlineCheckCircle,
  HiOutlineX,
  HiOutlineDesktopComputer,
  HiOutlineDeviceMobile,
  HiOutlineTag,
  HiOutlineGift,
  HiOutlineViewGrid,
  HiOutlineInformationCircle,
  HiOutlineEye,
  HiOutlineCalendar,
  HiOutlineCode,
  HiOutlineDotsHorizontal,
  HiOutlineChevronDown,
  HiOutlineChevronUp,
  HiOutlineSwitchHorizontal,
} from 'react-icons/hi';
import { IoDiamondOutline } from 'react-icons/io5';
import toast from 'react-hot-toast';
import { themesAPI, bannersAPI } from '../../api/services';
import GalleryMediaPickerModal from '../../components/common/GalleryMediaPickerModal';
import { useImagePreview } from '../../contexts/ImagePreviewContext';
import { getMediaUrl } from '../../utils/imageUrl';

const BANNER_TYPES = [
  {
    key: 'herobanner',
    label: 'Hero Banner',
    icon: HiOutlineDesktopComputer,
    desc: 'Main homepage slider banner for top section.',
  },
  {
    key: 'collectionbanner',
    label: 'Collection Banner',
    icon: HiOutlineTag,
    desc: 'Banners for collection pages and featured collections.',
  },
  {
    key: 'categorybanner',
    label: 'Category Banner',
    icon: HiOutlineViewGrid,
    desc: 'Banners for category pages and category highlights.',
  },
  {
    key: 'offerbanner',
    label: 'Offer Banner',
    icon: HiOutlineGift,
    desc: 'Banners for offers, promotions and special deals.',
  },
  {
    key: 'mobileappbanner',
    label: 'App Banner',
    icon: HiOutlineDeviceMobile,
    desc: 'Banners for app download promotion.',
  },
  {
    key: 'bookappointbanner',
    label: 'Appointment Banner',
    icon: HiOutlineCalendar,
    desc: 'Banners for appointment booking section.',
  },
  {
    key: 'customizebanner',
    label: 'Custom Banner',
    icon: HiOutlineCode,
    desc: 'Custom banners for special pages or campaigns.',
  },
  {
    key: 'websitebanner',
    label: 'Other',
    icon: HiOutlineDotsHorizontal,
    desc: 'Other banners and miscellaneous placements.',
  },
];

export default function ThemeMediaMappingTab({
  theme,
  onThemeUpdated,
}) {
  const { openImagePreview } = useImagePreview();
  const themeId = theme?._id;

  // Active mapping mode ('banner' or 'celebrate')
  const [mappingMode, setMappingMode] = useState('banner');
  const [activeModule, setActiveModule] = useState('herobanner');
  const [celebratePlacementFilter, setCelebratePlacementFilter] = useState('Celebrate'); // Celebrate, Gifts, all

  // Data state
  const [loading, setLoading] = useState(false);
  const [records, setRecords] = useState([]);
  const [summary, setSummary] = useState(null);
  const [bannerCounts, setBannerCounts] = useState({});

  // Fetch live counts from banners API
  useEffect(() => {
    bannersAPI.getCounts()
      .then((res) => {
        if (res.data?.data) {
          setBannerCounts(res.data.data);
        }
      })
      .catch(() => {});
  }, []);

  const handleSelectBannerType = (key) => {
    setActiveModule(key);
  };

  // Aggregate stats for the 2 primary mapping boxes
  const bannerStats = useMemo(() => {
    const bannerModules = ['herobanner', 'collectionbanner', 'offerbanner', 'mobileappbanner', 'customizebanner'];
    const relevant = summary?.breakdown?.filter((b) => bannerModules.includes(b.module)) || [];
    const total = relevant.reduce((sum, b) => sum + (b.total || 0), 0);
    const mapped = relevant.reduce((sum, b) => sum + (b.mapped || 0), 0);
    return { total, mapped };
  }, [summary]);

  const celebrateStats = useMemo(() => {
    const b = summary?.breakdown?.find((item) => item.module === 'celebrate');
    return {
      total: b?.total || 0,
      mapped: b?.mapped || 0,
    };
  }, [summary]);

  // Handler when clicking on either Banner Mapping or Celebrate & Gift Mapping box
  const handleSelectMappingMode = (mode) => {
    setMappingMode(mode);
    if (mode === 'banner') {
      setActiveModule('herobanner');
    } else {
      setActiveModule('celebrate');
    }
  };

  // Modal states
  const [pickerTarget, setPickerTarget] = useState(null); // { record, device, placement, currentGalleryId, currentMediaId }
  const [showActivateModal, setShowActivateModal] = useState(false);
  const [activating, setActivating] = useState(false);

  // Expanded/collapsed collection banner rows (default expanded)
  const [collapsedBanners, setCollapsedBanners] = useState(() => new Set());
  const toggleCollapseBanner = (bannerId) => {
    setCollapsedBanners((prev) => {
      const next = new Set(prev);
      const sid = String(bannerId);
      if (next.has(sid)) next.delete(sid);
      else next.add(sid);
      return next;
    });
  };

  // ─── 1. Load Summary Across All Modules ──────────────────
  const fetchSummary = useCallback(async () => {
    if (!themeId) return;
    try {
      const res = await themesAPI.getMappingSummary(themeId);
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
      const moduleName = mappingMode === 'banner' ? activeModule : 'celebrate';
      const mappingRes = await themesAPI.getMappingRecords(themeId, {
        module: moduleName,
        limit: 100,
      });
      const data = mappingRes?.data?.data || mappingRes?.data || {};
      setRecords(data.items || data.records || []);
    } catch (err) {
      console.error('Failed to load module records for mapping:', err);
      toast.error('Could not load module records');
    } finally {
      setLoading(false);
    }
  }, [themeId, mappingMode, activeModule]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  // Current banner type config (for Banner Management view matching)
  const currentBannerType = useMemo(() => {
    return BANNER_TYPES.find((t) => t.key === activeModule) || BANNER_TYPES[0];
  }, [activeModule]);

  // ─── Filtered Records ────────────────────────────────────
  const filteredRecords = useMemo(() => {
    if (mappingMode === 'celebrate' && celebratePlacementFilter !== 'all') {
      return records.filter((r) => {
        const p = (r.display?.type || r.placement || r.type || '').toLowerCase();
        return p === celebratePlacementFilter.toLowerCase();
      });
    }
    return records;
  }, [records, mappingMode, celebratePlacementFilter]);

  // ─── Single Save Mapping Handler ─────────────────────────
  const handleSaveMapping = async (mediaAsset, customTarget = null) => {
    const target = customTarget || pickerTarget;
    if (!target || !themeId) return;
    const { record } = target;

    try {
      await themesAPI.saveMapping(themeId, {
        recordId: record._id,
        galleryId: mediaAsset._id,
        status: 'active',
      });

      toast.success(
        `Mapped image for "${record.title || record.name}"`
      );

      setPickerTarget(null);
      await Promise.all([fetchRecords(), fetchSummary()]);
    } catch (err) {
      console.error('Failed to save mapping:', err);
      toast.error(err.response?.data?.message || 'Could not save theme mapping');
    }
  };

  // ─── Handle Selection from Common GalleryMediaPickerModal ───
  const handlePickerSelect = async (selectedAsset) => {
    if (!pickerTarget || !pickerTarget.record) {
      if (pickerTarget?.isBrowsing && selectedAsset) {
        openImagePreview(selectedAsset.url || selectedAsset.image?.url, {
          title: selectedAsset.name || 'Theme Gallery Asset',
        });
      }
      setPickerTarget(null);
      return;
    }
    await handleSaveMapping(selectedAsset, pickerTarget);
    setPickerTarget(null);
  };

  // ─── One-Click Theme Activation ──────────────────────────
  const handleActivateTheme = async () => {
    if (!themeId) return;

    try {
      setActivating(true);
      const res = await themesAPI.activateTheme(themeId);
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

  return (
    <div className="space-y-4">
      {/* ─────────────────────────────────────────────────────────────
          1. 2 PRIMARY SELECTION BOXES: BANNER MAPPING & CELEBRATE-GIFT MAPPING
          ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Box 1: Banner Mapping */}
        <button
          type="button"
          onClick={() => handleSelectMappingMode('banner')}
          className={`p-4 sm:p-5 rounded-2xl border text-left transition-all cursor-pointer relative overflow-hidden ${
            mappingMode === 'banner'
              ? 'border-[#8b6f4e] bg-[#fbf9f6] shadow-sm ring-2 ring-[#8b6f4e]/20'
              : 'border-stone-200 bg-white hover:border-stone-300 hover:bg-stone-50/60 shadow-2xs'
          }`}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3.5">
              <div
                className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                  mappingMode === 'banner'
                    ? 'bg-[#8b6f4e] text-white shadow-xs'
                    : 'bg-stone-100 text-stone-600'
                }`}
              >
                <HiOutlineDesktopComputer className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-stone-900">Banner Mapping</h3>
                  {mappingMode === 'banner' && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#8b6f4e] text-white">
                      <HiOutlineCheck className="w-3 h-3" /> Selected
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="text-right shrink-0">
              <span
                className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold ${
                  bannerStats.mapped === bannerStats.total && bannerStats.total > 0
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-stone-100 text-stone-700'
                }`}
              >
                {bannerStats.mapped}/{bannerStats.total} Mapped
              </span>
            </div>
          </div>
        </button>

        {/* Box 2: Celebrate & Gift Mapping */}
        <button
          type="button"
          onClick={() => handleSelectMappingMode('celebrate')}
          className={`p-4 sm:p-5 rounded-2xl border text-left transition-all cursor-pointer relative overflow-hidden ${
            mappingMode === 'celebrate'
              ? 'border-[#8b6f4e] bg-[#fbf9f6] shadow-sm ring-2 ring-[#8b6f4e]/20'
              : 'border-stone-200 bg-white hover:border-stone-300 hover:bg-stone-50/60 shadow-2xs'
          }`}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3.5">
              <div
                className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                  mappingMode === 'celebrate'
                    ? 'bg-[#8b6f4e] text-white shadow-xs'
                    : 'bg-stone-100 text-stone-600'
                }`}
              >
                <IoDiamondOutline className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-stone-900">Celebrate & Gifts Mapping</h3>
                  {mappingMode === 'celebrate' && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#8b6f4e] text-white">
                      <HiOutlineCheck className="w-3 h-3" /> Selected
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="text-right shrink-0">
              <span
                className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold ${
                  celebrateStats.mapped === celebrateStats.total && celebrateStats.total > 0
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-stone-100 text-stone-700'
                }`}
              >
                {celebrateStats.mapped}/{celebrateStats.total} Mapped
              </span>
            </div>
          </div>
        </button>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          BANNER TYPES SELECTION CARDS (Matches Banner Management UI)
          ───────────────────────────────────────────────────────────── */}
      {mappingMode === 'banner' && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">
              Select Banner Type to Map:
            </span>
            <span className="text-xs text-stone-400">
              Active: <strong className="text-[#8b6f4e] font-bold">{BANNER_TYPES.find((b) => b.key === activeModule)?.label || 'Hero Banner'}</strong>
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-3">
            {BANNER_TYPES.map((card) => {
              const CardIcon = card.icon;
              const count = bannerCounts[card.key] ?? 0;
              const isSelected = activeModule === card.key;

              return (
                <div
                  key={card.key}
                  onClick={() => handleSelectBannerType(card.key)}
                  className={`rounded-xl border p-3 sm:p-3.5 transition-all duration-200 cursor-pointer relative group flex flex-col justify-between shadow-2xs ${
                    isSelected
                      ? 'border-[#8b6f4e] bg-[#fbf9f6] ring-2 ring-[#8b6f4e]/20 shadow-xs'
                      : 'border-stone-200 bg-white hover:border-[#8b6f4e]/40 hover:bg-stone-50/60'
                  }`}
                >
                  <div>
                    {/* Top row: Icon and Count Badge */}
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                          isSelected
                            ? 'bg-[#8b6f4e] text-white shadow-xs'
                            : 'bg-[#faf6f0] text-[#8b6f4e] border border-[#8b6f4e]/20 group-hover:bg-[#8b6f4e] group-hover:text-white'
                        }`}
                      >
                        <CardIcon className="w-4 h-4 stroke-[1.8]" />
                      </div>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        isSelected
                          ? 'bg-[#8b6f4e] text-white font-bold'
                          : 'text-stone-600 bg-stone-100 border border-stone-200/60'
                      }`}>
                        {count} {count === 1 ? 'banner' : 'banners'}
                      </span>
                    </div>

                    {/* Title */}
                    <h4 className="text-xs font-bold text-stone-900 group-hover:text-[#8b6f4e] transition-colors line-clamp-1">
                      {card.label}
                    </h4>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
      

      {/* ─────────────────────────────────────────────────────────────
          4. SIDE-BY-SIDE MAIN LAYOUT:
             LEFT: Banners & Featured List (xl:col-span-7)
             RIGHT: Theme Media Gallery Side Panel (xl:col-span-5)
          ───────────────────────────────────────────────────────────── */}
      <div className="space-y-4">
          {mappingMode === 'banner' ? (
            /* ═══════════════════════════════════════════════════════════
               BANNER TYPE LIST VIEW (Matches Screen 2 of BannersView.jsx)
               ═══════════════════════════════════════════════════════════ */
            <>
              {/* Banners Table */}
              <div className="bg-white rounded-2xl border border-stone-200/90 shadow-2xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[680px] text-left border-collapse">
                    <thead>
                      <tr className="border-b border-stone-200/80 bg-[#eef2f6] text-[11px] font-bold text-stone-700 uppercase tracking-wider">
                        <th className="py-3 px-3.5 whitespace-nowrap">PREVIEW</th>
                        <th className="py-3 px-3.5 whitespace-nowrap">
                          {currentBannerType.key === 'categorybanner' ? 'CATEGORY' : 'TITLE'}
                        </th>
                        <th className="py-3 px-3.5 whitespace-nowrap">STATUS</th>
                        <th className="py-3 px-3.5 whitespace-nowrap">DEVICES</th>
                        <th className="py-3 px-3.5 whitespace-nowrap">ORDER</th>
                        <th className="py-3 pr-4 pl-3 whitespace-nowrap text-right">THEME MAPPING</th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-stone-100 text-xs text-stone-700">
                      {loading ? (
                        <tr>
                          <td colSpan="6" className="py-16 text-center text-stone-400">
                            <div className="w-7 h-7 border-2 border-stone-300 border-t-[#8a6d4b] rounded-full animate-spin mx-auto mb-3" />
                            <span>Loading banners...</span>
                          </td>
                        </tr>
                      ) : filteredRecords.length === 0 ? (
                        <tr>
                          <td colSpan="6" className="py-16 text-center text-stone-400">
                            <HiOutlinePhotograph className="w-10 h-10 mx-auto text-stone-300 mb-2 stroke-1" />
                            <p className="text-sm font-medium text-stone-600">No {currentBannerType.label}s found</p>
                            <p className="text-xs text-stone-400 mt-1">
                              No banners match the selected filter.
                            </p>
                          </td>
                        </tr>
                      ) : (
                        filteredRecords.map((banner) => {
                          const isCollectionBanner = currentBannerType.key === 'collectionbanner';
                          const bannerTiles = isCollectionBanner
                            ? (Array.isArray(banner.tiles) && banner.tiles.length > 0
                                ? banner.tiles
                                : (Array.isArray(banner.collectionImages)
                                    ? banner.collectionImages.map((ci, idx) => ({
                                        _id: ci._id,
                                        bannerId: banner._id,
                                        order: ci.order ?? idx + 1,
                                        originalUrl: ci.url,
                                        imageUrl: ci.url,
                                        categoryId: ci.categoryId?._id || ci.categoryId,
                                        categoryName: ci.categoryId?.name || '',
                                        isMapped: false,
                                      }))
                                    : []))
                            : [];
                          const mappedTilesCount = bannerTiles.filter((t) => t.isMapped).length;
                          const isExpanded = !collapsedBanners.has(String(banner._id));

                          const bTitle = currentBannerType.key === 'categorybanner'
                            ? (banner.display?.categoryId?.name || banner.content?.title || banner.title || 'Category Banner')
                            : (banner.content?.title || banner.title || (isCollectionBanner ? 'Collection Banner' : 'Hero Banner'));
                          const bDesc = banner.content?.description || '';
                          const defaultAssetUrl = banner.media?.url || banner.image?.url || (banner.collectionImages?.[0]?.url) || banner.originalDesktopImage;
                          const isPublished = banner.status === 'active';

                          const desktopMappedImg = banner.desktopMapping?.imageUrl;
                          const hasDesktopOverride = Boolean(desktopMappedImg) || (isCollectionBanner && mappedTilesCount > 0);
                          const currentEffectiveImg = desktopMappedImg || defaultAssetUrl;

                          const catObj = banner.display?.categoryId;
                          const catName = typeof catObj === 'object' && catObj?.name ? catObj.name : '';

                          return (
                            <Fragment key={banner._id}>
                              <tr className="hover:bg-[#faf8f5]/70 transition-colors">
                                {/* PREVIEW */}
                                <td className="py-3 px-3.5 whitespace-nowrap">
                                  {isCollectionBanner ? (
                                    /* Collection 4-Tile Mini Preview */
                                    <div
                                      onClick={() => toggleCollapseBanner(banner._id)}
                                      className="w-28 sm:w-32 h-14 rounded-xl border border-stone-200/90 overflow-hidden relative shadow-2xs cursor-pointer group bg-stone-900 p-0.5 grid grid-cols-2 grid-rows-2 gap-0.5 hover:border-[#8b6f4e] transition-all"
                                      title="Click to expand/collapse 4 collection tiles"
                                    >
                                      {bannerTiles.slice(0, 4).map((tile, i) => (
                                        <div key={tile._id || i} className="relative w-full h-full overflow-hidden rounded-xs bg-stone-800">
                                          <img
                                            src={getMediaUrl(tile.imageUrl || tile.originalUrl)}
                                            alt={`Tile ${tile.order || i + 1}`}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                          />
                                        </div>
                                      ))}
                                      {/* Hover overlay hint */}
                                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-[9.5px] font-bold text-white uppercase tracking-wider">
                                        {isExpanded ? 'Hide' : 'View 4'}
                                      </div>
                                    </div>
                                  ) : (
                                    /* Standard Thumbnail matching BannersView */
                                    <div
                                      onClick={() => {
                                        setPickerTarget({
                                          record: banner,
                                          device: 'desktop',
                                          placement: 'primary',
                                        });
                                      }}
                                      className={`w-28 sm:w-32 h-14 rounded-xl border overflow-hidden relative shadow-2xs cursor-pointer group flex items-center justify-center shrink-0 transition-all ${
                                        hasDesktopOverride
                                          ? 'border-emerald-400 ring-1 ring-emerald-300'
                                          : 'border-stone-200 bg-stone-100 hover:border-[#8b6f4e]'
                                      }`}
                                      title="Click to select image from Gallery Media Picker"
                                    >
                                      {currentEffectiveImg ? (
                                        <img
                                          src={getMediaUrl(currentEffectiveImg)}
                                          alt={bTitle}
                                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                        />
                                      ) : (
                                        <div className="w-full h-full bg-[#2a241e] flex items-center justify-center text-stone-500">
                                          <HiOutlinePhotograph className="w-5 h-5 text-[#8a6d4b]/60" />
                                        </div>
                                      )}

                                      {/* Hover overlay */}
                                      <div className="absolute inset-0 bg-stone-900/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white">
                                        <span className="text-[10px] font-bold flex items-center gap-1 bg-white text-stone-900 px-2 py-0.5 rounded-md shadow-xs">
                                          <HiOutlinePhotograph className="w-3 h-3 text-[#8b6f4e]" />
                                          <span>{hasDesktopOverride ? 'Change' : 'Map'}</span>
                                        </span>
                                      </div>
                                    </div>
                                  )}
                                </td>

                                {/* TITLE */}
                                <td className="py-3 px-3.5 font-medium text-stone-900">
                                  <div
                                    className="font-bold text-stone-900 text-xs sm:text-sm max-w-[220px] truncate"
                                    title={bTitle}
                                  >
                                    {bTitle}
                                  </div>
                                  {bDesc && (
                                    <div className="text-[11px] text-stone-400 font-normal max-w-[200px] truncate mt-0.5" title={bDesc}>
                                      {bDesc}
                                    </div>
                                  )}
                                  {catName && (
                                    <div className="mt-1">
                                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10.5px] font-medium bg-[#f5efe6] text-[#8a6d4b] border border-[#e8dccb]">
                                        Category: {catName}
                                      </span>
                                    </div>
                                  )}
                                  {isCollectionBanner && (
                                    <div className="mt-1 flex items-center gap-1.5">
                                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-[#faf5ef] text-[#8b6f4e] border border-[#eedfcb]">
                                        4 Collection Tiles ({mappedTilesCount} mapped)
                                      </span>
                                    </div>
                                  )}
                                </td>

                                {/* STATUS */}
                                <td className="py-3 px-3.5 whitespace-nowrap">
                                  {isPublished ? (
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#eaf7ee] text-[#137333]">
                                      <span>Active</span>
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-stone-100 text-stone-500">
                                      <span>Draft</span>
                                    </span>
                                  )}
                                </td>

                                {/* DEVICES */}
                                <td className="py-3 px-3.5 whitespace-nowrap">
                                  <div className="flex items-center gap-1.5 text-stone-500">
                                    <button
                                      type="button"
                                      title="Desktop View (Click to map Desktop image)"
                                      onClick={() => {
                                        setPickerTarget({
                                          record: banner,
                                          device: 'desktop',
                                          placement: 'primary',
                                        });
                                      }}
                                      className={`p-1.5 rounded-lg transition cursor-pointer ${
                                        hasDesktopOverride
                                          ? 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
                                          : (banner.image?.url || defaultAssetUrl)
                                          ? 'text-stone-700 bg-stone-100 hover:bg-stone-200'
                                          : 'text-stone-400 hover:bg-stone-100'
                                      }`}>
                                      <HiOutlineDesktopComputer className="w-4 h-4" />
                                    </button>
                                    <button
                                      type="button"
                                      title="Mobile View (Click to map Mobile image)"
                                      onClick={() => {
                                        setPickerTarget({
                                          record: banner,
                                          device: 'mobile',
                                          placement: 'primary',
                                        });
                                      }}
                                      className={`p-1.5 rounded-lg transition cursor-pointer ${
                                        banner.mobileMapping?.imageUrl
                                          ? 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
                                          : banner.mobileImage?.url
                                          ? 'text-stone-700 bg-stone-100 hover:bg-stone-200'
                                          : 'text-stone-300 hover:bg-stone-100'
                                      }`}>
                                      <HiOutlineDeviceMobile className="w-4 h-4" />
                                    </button>
                                  </div>
                                </td>

                                {/* ORDER */}
                                <td className="py-3 px-3.5 whitespace-nowrap">
                                  <span className="inline-flex items-center justify-center min-w-[28px] h-7 px-2 rounded-lg border border-stone-200 text-xs font-bold text-stone-700 bg-stone-50">
                                    {banner.display?.order ?? banner.order ?? 1}
                                  </span>
                                </td>

                                {/* THEME MAPPING ACTIONS */}
                                <td className="py-3 pr-4 pl-3 whitespace-nowrap text-right">
                                  <div className="flex items-center justify-end gap-1.5">
                                    {isCollectionBanner ? (
                                      <>
                                        <span
                                          className={`inline-flex items-center gap-1 rounded-md text-[10.5px] font-bold px-2 py-1 border ${
                                            mappedTilesCount === bannerTiles.length && bannerTiles.length > 0
                                              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                                              : mappedTilesCount > 0
                                              ? 'bg-amber-50 border-amber-200 text-amber-800'
                                              : 'bg-stone-50 border-stone-200 text-stone-600'
                                          }`}
                                        >
                                          {mappedTilesCount} of {bannerTiles.length} Mapped
                                        </span>
                                        <button
                                          type="button"
                                          onClick={() => toggleCollapseBanner(banner._id)}
                                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-[#faf6f0] text-[#8b6f4e] border border-[#8b6f4e]/30 hover:bg-[#8b6f4e] hover:text-white transition cursor-pointer"
                                        >
                                          {isExpanded ? (
                                            <>
                                              <HiOutlineChevronUp className="w-3.5 h-3.5" />
                                              <span>Hide Tiles</span>
                                            </>
                                          ) : (
                                            <>
                                              <HiOutlineChevronDown className="w-3.5 h-3.5" />
                                              <span>View 4 Tiles</span>
                                            </>
                                          )}
                                        </button>
                                      </>
                                    ) : hasDesktopOverride ? (
                                      <>
                                        <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10.5px] font-bold px-2 py-1">
                                          Mapped
                                        </span>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setPickerTarget({
                                              record: banner,
                                              device: 'desktop',
                                              placement: 'primary',
                                            });
                                          }}
                                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-[#faf6f0] text-[#8b6f4e] border border-[#8b6f4e]/30 hover:bg-[#8b6f4e] hover:text-white transition cursor-pointer"
                                          title="Change mapped image"
                                        >
                                          <HiOutlineSwitchHorizontal className="w-3.5 h-3.5" />
                                          <span>Change</span>
                                        </button>
                                      </>
                                    ) : (
                                      <>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setPickerTarget({
                                              record: banner,
                                              device: 'desktop',
                                              placement: 'primary',
                                            });
                                          }}
                                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-[#faf6f0] text-[#8b6f4e] border border-[#8b6f4e]/30 hover:bg-[#8b6f4e] hover:text-white transition cursor-pointer shadow-2xs"
                                          title="Select image from Gallery Media Picker"
                                        >
                                          <HiOutlinePhotograph className="w-3.5 h-3.5" />
                                          <span>Map</span>
                                        </button>
                                      </>
                                    )}
                                  </div>
                                </td>
                              </tr>

                              {/* EXPANDED 4-TILES GRID FOR COLLECTION BANNER */}
                              {isCollectionBanner && isExpanded && (
                                <tr className="bg-gradient-to-b from-[#fbf9f6] to-[#f7f3ed]/60 border-b-2 border-stone-200">
                                  <td colSpan="6" className="p-3.5 sm:p-5">
                                    <div className="bg-white rounded-2xl border border-[#e8dfd3] shadow-xs p-4 sm:p-5 space-y-4">
                                      {/* Header bar */}
                                      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-stone-150">
                                        <div className="flex items-center gap-3">
                                          <div className="w-8 h-8 rounded-lg bg-[#8b6f4e]/10 text-[#8b6f4e] flex items-center justify-center font-bold text-sm">
                                            4
                                          </div>
                                          <div>
                                            <h4 className="text-xs sm:text-sm font-bold text-stone-900 flex items-center gap-2">
                                              <span>Collection Showcase Tiles</span>
                                              <span className="text-[11px] font-normal text-stone-500">
                                                (Map theme images to each of the 4 tiles individually)
                                              </span>
                                            </h4>
                                            <p className="text-[11px] text-stone-500 mt-0.5">
                                              Click &ldquo;Map Tile&rdquo; or click a tile to assign photos from the gallery.
                                            </p>
                                          </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                          <span
                                            className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${
                                              mappedTilesCount === bannerTiles.length && bannerTiles.length > 0
                                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                                : mappedTilesCount > 0
                                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                                : 'bg-stone-50 text-stone-600 border-stone-200'
                                            }`}
                                          >
                                            {mappedTilesCount} of {bannerTiles.length} Tiles Mapped
                                          </span>
                                        </div>
                                      </div>

                                      {/* 4 Tiles Grid */}
                                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                        {bannerTiles.map((tile) => {
                                          const tileEffectiveImg = tile.mappedImageUrl || tile.imageUrl || tile.originalUrl;
                                          const catName =
                                            tile.categoryName ||
                                            `Category ${tile.order}`;

                                          return (
                                            <div
                                              key={tile._id}
                                              className={`rounded-xl border transition-all duration-200 p-3 flex flex-col justify-between ${
                                                tile.isMapped
                                                  ? 'border-emerald-200 bg-emerald-50/20'
                                                  : 'border-stone-200/90 bg-white hover:border-stone-300'
                                              }`}
                                            >
                                              {/* Tile Header: Order & Category */}
                                              <div className="flex items-center justify-between gap-1.5 mb-2.5">
                                                <div className="flex items-center gap-1.5 min-w-0">
                                                  <span className="shrink-0 inline-flex items-center justify-center w-5 h-5 rounded-md text-[11px] font-bold bg-[#8b6f4e] text-white">
                                                    {tile.order}
                                                  </span>
                                                  <span className="text-xs font-bold text-stone-800 truncate" title={catName}>
                                                    {catName}
                                                  </span>
                                                </div>
                                                {tile.isMapped ? (
                                                  <span className="shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-0.5">
                                                    <HiOutlineCheck className="w-3 h-3 text-emerald-600" />
                                                    Theme
                                                  </span>
                                                ) : (
                                                  <span className="shrink-0 text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-stone-100 text-stone-500">
                                                    Original
                                                  </span>
                                                )}
                                              </div>

                                              {/* Image Slot */}
                                              <div
                                                onClick={() => {
                                                  setPickerTarget({
                                                    record: { _id: tile._id, title: `Collection Tile #${tile.order} (${catName})` },
                                                    device: 'desktop',
                                                    placement: 'primary',
                                                  });
                                                }}
                                                className={`w-full aspect-[4/3] rounded-lg border overflow-hidden relative cursor-pointer group flex items-center justify-center transition-all bg-stone-900 ${
                                                  tile.isMapped
                                                    ? 'border-emerald-300 ring-1 ring-emerald-200'
                                                    : 'border-stone-200'
                                                }`}
                                                title="Click to map image from gallery"
                                              >
                                                {tileEffectiveImg ? (
                                                  <img
                                                    src={getMediaUrl(tileEffectiveImg)}
                                                    alt={`Tile ${tile.order} - ${catName}`}
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                  />
                                                ) : (
                                                  <div className="w-full h-full bg-[#2a241e] flex flex-col items-center justify-center text-stone-500 gap-1">
                                                    <HiOutlinePhotograph className="w-6 h-6 text-[#8a6d4b]/60" />
                                                    <span className="text-[10px] text-stone-400">No Image</span>
                                                  </div>
                                                )}

                                                {/* Overlays */}
                                                {tile.isMapped ? (
                                                  <div className="absolute top-1 left-1 z-10">
                                                    <span className="bg-emerald-600/90 text-white text-[8.5px] font-bold px-1.5 py-0.5 rounded shadow-xs uppercase tracking-wider">
                                                      Theme
                                                    </span>
                                                  </div>
                                                ) : null}

                                                {/* High-res preview eye button */}
                                                {tileEffectiveImg && (
                                                  <button
                                                    type="button"
                                                    onClick={(e) => {
                                                      e.stopPropagation();
                                                      openImagePreview(tileEffectiveImg, {
                                                        title: `Collection Tile #${tile.order} · ${catName}`,
                                                      });
                                                    }}
                                                    className="absolute top-1.5 right-1.5 p-1 rounded-md bg-black/60 hover:bg-black/80 text-white opacity-0 group-hover:opacity-100 transition-opacity z-10"
                                                    title="View full image preview"
                                                  >
                                                    <HiOutlineEye className="w-3.5 h-3.5" />
                                                  </button>
                                                )}
                                              </div>

                                              {/* Tile Footer Actions */}
                                              <div className="mt-2.5 pt-2 border-t border-stone-100 flex items-center justify-between gap-1.5">
                                                {tile.isMapped ? (
                                                  <button
                                                    type="button"
                                                    onClick={() =>
                                                      setPickerTarget({
                                                        record: { _id: tile._id, title: `Collection Tile #${tile.order} (${catName})` },
                                                        device: 'desktop',
                                                        placement: 'primary',
                                                      })
                                                    }
                                                    className="w-full inline-flex items-center justify-center gap-1.5 py-1.5 px-3 text-xs font-semibold rounded-lg bg-[#faf6f0] text-[#8b6f4e] border border-[#8b6f4e]/30 hover:bg-[#8b6f4e] hover:text-white transition cursor-pointer shadow-2xs"
                                                    title="Change mapped image from Media Gallery"
                                                  >
                                                    <HiOutlineSwitchHorizontal className="w-3.5 h-3.5" />
                                                    <span>Change</span>
                                                  </button>
                                                ) : (
                                                  <button
                                                    type="button"
                                                    onClick={() =>
                                                      setPickerTarget({
                                                        record: { _id: tile._id, title: `Collection Tile #${tile.order} (${catName})` },
                                                        device: 'desktop',
                                                        placement: 'primary',
                                                      })
                                                    }
                                                    className="w-full inline-flex items-center justify-center gap-1.5 py-1.5 px-3 text-xs font-semibold rounded-lg bg-[#faf6f0] text-[#8b6f4e] border border-[#8b6f4e]/30 hover:bg-[#8b6f4e] hover:text-white transition cursor-pointer shadow-2xs"
                                                    title="Select image from Gallery Media Picker"
                                                  >
                                                    <HiOutlinePhotograph className="w-3.5 h-3.5" />
                                                    <span>Map</span>
                                                  </button>
                                                )}
                                              </div>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </Fragment>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Table Footer with Count */}
                <div className="px-4 py-3 border-t border-stone-150 flex items-center justify-between bg-stone-50/50 text-xs text-stone-500 font-medium">
                  <span>
                    Showing 1-{filteredRecords.length} of {records.length} {currentBannerType.label.toLowerCase()}s
                  </span>
                </div>
              </div>
            </>
          ) : (
            /* ═══════════════════════════════════════════════════════════
               CELEBRATE & GIFTS VIEW (Matches CelebrateGiftsView.jsx)
               ═══════════════════════════════════════════════════════════ */
            <div className="bg-white rounded-2xl border border-stone-200/90 shadow-2xs overflow-hidden">
              {/* Prominent Placement Tabs Header */}
              <div className="border-b border-stone-200 bg-[#fbfaf8] px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2 sm:gap-6 -mb-px overflow-x-auto">
                  {['Celebrate', 'Gifts', 'all'].map((tabKey) => {
                    const isTabActive = celebratePlacementFilter === tabKey;
                    const label = tabKey === 'all' ? 'All Items' : tabKey;
                    const count = tabKey === 'all'
                      ? records.length
                      : records.filter((r) => {
                          const p = (r.display?.type || r.placement || r.type || '').toLowerCase();
                          return p === tabKey.toLowerCase();
                        }).length;
                    return (
                      <button
                        key={tabKey}
                        type="button"
                        onClick={() => setCelebratePlacementFilter(tabKey)}
                        className={`pb-2.5 pt-1.5 px-1 sm:px-2 border-b-2 font-bold text-xs sm:text-sm flex items-center gap-2 transition cursor-pointer whitespace-nowrap ${
                          isTabActive
                            ? 'border-[#8b6f4e] text-[#8b6f4e]'
                            : 'border-transparent text-stone-500 hover:text-stone-800'
                        }`}
                      >
                        <span>{label}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${
                          isTabActive ? 'bg-[#8b6f4e]/15 text-[#8b6f4e]' : 'bg-stone-200/70 text-stone-600'
                        }`}>
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setPickerTarget({
                        record: null,
                        device: 'desktop',
                        placement: 'celebrate',
                        isBrowsing: true,
                      });
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white border border-stone-200 text-stone-700 hover:bg-stone-50 transition-colors cursor-pointer shadow-2xs"
                  >
                    <HiOutlinePhotograph className="w-3.5 h-3.5 text-[#8b6f4e]" />
                    <span>Browse Gallery</span>
                  </button>


                </div>
              </div>

              {/* Table matching CelebrateGiftsView.jsx */}
              <div className="overflow-x-auto">
                <table className="w-full min-w-[680px] text-left border-collapse">
                  <thead>
                    <tr className="border-b border-stone-200 bg-[#eef2f6] text-[11px] font-bold text-stone-700 uppercase tracking-wider">
                      <th className="py-3 px-2 text-center w-12 whitespace-nowrap">SR NO</th>
                      <th className="py-3 px-3 whitespace-nowrap">COVER</th>
                      <th className="py-3 px-3 whitespace-nowrap">SHOWCASE NAME</th>
                      <th className="py-3 px-3 whitespace-nowrap">PLACEMENT</th>
                      <th className="py-3 px-3 whitespace-nowrap">PRODUCTS</th>
                      <th className="py-3 pr-4 pl-3 whitespace-nowrap text-right">THEME MAPPING</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 text-xs text-stone-700">
                    {loading ? (
                      <tr>
                        <td colSpan="6" className="py-12 text-center text-stone-400">
                          <div className="w-7 h-7 border-2 border-stone-300 border-t-[#8a6d4b] rounded-full animate-spin mx-auto mb-3" />
                          <span>Loading showcase items...</span>
                        </td>
                      </tr>
                    ) : filteredRecords.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="py-12 text-center text-stone-400">
                          No showcase items found.
                        </td>
                      </tr>
                    ) : (
                      filteredRecords.map((item, idx) => {
                        const isMapped = item.isMapped || Boolean(item.desktopMapping?.imageUrl);
                        const currentCover = item.desktopMapping?.imageUrl || item.image?.url || item.originalDesktopImage;

                        return (
                          <tr
                            key={item._id}
                            className="hover:bg-[#faf7f2] transition-colors"
                          >
                            <td className="py-2.5 px-2 text-center font-bold text-stone-500">
                              {idx + 1}
                            </td>
                            <td className="py-2.5 px-3">
                              <div
                                onClick={() => {
                                  setPickerTarget({
                                    record: item,
                                    device: 'desktop',
                                    placement: 'celebrate',
                                  });
                                }}
                                className={`w-14 h-10 rounded-md overflow-hidden border cursor-pointer flex items-center justify-center relative shadow-2xs transition-all ${
                                  isMapped
                                    ? 'border-emerald-400 ring-1 ring-emerald-300'
                                    : 'border-stone-200/80 bg-stone-100 hover:border-[#8b6f4e]'
                                }`}
                                title="Click to select image from Gallery Media Picker"
                              >
                                {currentCover ? (
                                  <img
                                    src={getMediaUrl(currentCover)}
                                    alt={item.name}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <HiOutlinePhotograph className="w-5 h-5 text-stone-400" />
                                )}
                                {isMapped ? (
                                  <div className="absolute top-0.5 left-0.5">
                                    <span className="bg-emerald-600/90 text-white text-[8px] font-bold px-1 rounded shadow-xs uppercase">
                                      Theme
                                    </span>
                                  </div>
                                ) : null}
                              </div>
                            </td>
                            <td className="py-2.5 px-3 font-semibold text-stone-900">
                              <div>{item.name || item.title || 'Showcase Card'}</div>
                              {item.subtitle && (
                                <div className="text-[11px] text-stone-400 font-normal">{item.subtitle}</div>
                              )}
                            </td>
                            <td className="py-2.5 px-3">
                              {(() => {
                                const placementType = item.display?.type || item.placement || item.type || 'Celebrate';
                                const isCelebrate = placementType.toLowerCase() === 'celebrate';
                                return (
                                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold ${
                                    isCelebrate
                                      ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                      : 'bg-purple-100 text-purple-800 border border-purple-200'
                                  }`}>
                                    {placementType}
                                  </span>
                                );
                              })()}
                            </td>
                            <td className="py-2.5 px-3">
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-stone-600">
                                {Array.isArray(item.productIds)
                                  ? item.productIds.length
                                  : Array.isArray(item.products)
                                  ? item.products.length
                                  : 0}{' '}
                                Products
                              </span>
                            </td>
                            <td className="py-2.5 pr-4 pl-3 whitespace-nowrap text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                {isMapped ? (
                                  <>
                                    <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10.5px] font-bold px-2 py-0.5">
                                      Mapped
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setPickerTarget({
                                          record: item,
                                          device: 'desktop',
                                          placement: 'celebrate',
                                        });
                                      }}
                                      className="inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-semibold rounded-lg bg-[#faf6f0] text-[#8b6f4e] border border-[#8b6f4e]/30 hover:bg-[#8b6f4e] hover:text-white transition cursor-pointer"
                                      title="Change mapped image"
                                    >
                                      <HiOutlineSwitchHorizontal className="w-3.5 h-3.5" />
                                      <span>Change</span>
                                    </button>
                                  </>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setPickerTarget({
                                        record: item,
                                        device: 'desktop',
                                        placement: 'celebrate',
                                      });
                                    }}
                                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-[#faf6f0] text-[#8b6f4e] border border-[#8b6f4e]/30 hover:bg-[#8b6f4e] hover:text-white transition cursor-pointer shadow-2xs"
                                  >
                                    <HiOutlinePhotograph className="w-3.5 h-3.5" />
                                    <span>Map</span>
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
              <div className="px-4 py-3 border-t border-stone-150 flex items-center justify-between bg-stone-50/50 text-xs text-stone-500 font-medium">
                <span>Showing {filteredRecords.length} items</span>
              </div>
            </div>
          )}
      </div>



      {/* ─────────────────────────────────────────────────────────────
          5. MODAL: MEDIA GALLERY PICKER (When user clicks "Browse")
          ───────────────────────────────────────────────────────────── */}
      {/* ─── COMMON GALLERY MEDIA PICKER MODAL ─── */}
      <GalleryMediaPickerModal
        isOpen={Boolean(pickerTarget)}
        onClose={() => setPickerTarget(null)}
        onSelect={handlePickerSelect}
        currentSelectedUrl={
          pickerTarget?.device === 'mobile'
            ? pickerTarget?.record?.mobileMapping?.imageUrl || pickerTarget?.record?.mobileImage?.url || ''
            : pickerTarget?.record?.desktopMapping?.imageUrl || pickerTarget?.record?.image?.url || ''
        }
        initialTheme={themeId ? String(themeId) : 'all'}
        initialPlacement={
          mappingMode === 'celebrate'
            ? 'celebrate'
            : (activeModule || 'herobanner')
        }
        initialPlatform="web"
        title="Gallery Media Picker"
        subtitle={
          pickerTarget?.record
            ? `Select an image for ${
                pickerTarget?.record?.content?.title || pickerTarget?.record?.title || pickerTarget?.record?.name || 'Banner'
              } · ${pickerTarget?.device === 'mobile' ? 'Mobile App' : 'Desktop'} slot.`
            : 'Select an image from your website themes or media gallery.'
        }
      />

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
function ActivationConfirmModal({ theme, summary, activating, onClose, onConfirm }) {
  const total = summary?.summary?.totalRecords || 0;
  const mapped = summary?.summary?.mappedRecords || 0;
  const missing = summary?.summary?.missingRecords || 0;
  const pct = summary?.summary?.completionPercentage || 0;
  const isFullyMapped = summary?.summary?.isFullyMapped;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="relative w-full max-w-lg max-h-[90vh] flex flex-col rounded-2xl bg-white shadow-2xl border border-stone-200 overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-stone-200 bg-stone-50/70 flex items-center justify-between gap-2 shrink-0">
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
        <div className="p-4 sm:p-5 space-y-4 text-xs text-stone-700 overflow-y-auto">
          <p>
            You are about to activate theme <span className="font-bold text-stone-900">&quot;{theme?.name}&quot;</span> as the live storefront theme.
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
        <div className="border-t border-stone-200 p-4 bg-stone-50/70 flex flex-wrap items-center justify-end gap-2.5 shrink-0">
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
