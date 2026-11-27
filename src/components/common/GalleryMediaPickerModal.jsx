import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  HiOutlineX,
  HiOutlineSearch,
  HiOutlinePhotograph,
  HiOutlineRefresh,
  HiOutlineCheck,
  HiOutlineEye,
  HiOutlineUpload,
} from 'react-icons/hi';
import Dropdown from './Dropdown';
import PlacementSelect, { PLACEMENT_OPTIONS } from './PlacementSelect';
import Pagination from './Pagination';
import GalleryUploadModal from '../gallery/GalleryUploadModal';
import api from '../../api/axios';
import { themesAPI } from '../../api/services';
import { getMediaUrl } from '../../utils/imageUrl';
import { useImagePreview } from '../../contexts/ImagePreviewContext';
import {
  getCachedData,
  setCachedData,
  clearRequestCache,
  isAbortError,
} from '../../utils/requestCache';

// Cache themes lookup across modal mounts for instant rendering
let cachedThemesLookup = null;

const loadThemesLookup = async () => {
  if (cachedThemesLookup && cachedThemesLookup.length > 0) return cachedThemesLookup;
  try {
    const res = await themesAPI.getLookup();
    const raw = res.data?.data || res.data || [];
    const list = Array.isArray(raw)
      ? raw.map((t) => ({
          ...t,
          _id: String(t._id),
          isLive: Boolean(t.isLive || t.status === 'active'),
        }))
      : [];
    cachedThemesLookup = list;
    return list;
  } catch (err) {
    console.error('Failed to load themes lookup in GalleryMediaPickerModal:', err);
    return [];
  }
};

const DEFAULT_UPLOAD_PLACEMENTS = PLACEMENT_OPTIONS;

export default function GalleryMediaPickerModal({
  isOpen = false,
  onClose,
  onSelect,
  currentSelectedUrl = '',
  initialTheme = 'all',
  initialPlacement = 'all',
  initialPlatform = 'web',
  placementOptions = null,
  themes: passedThemes = null,
  title = 'Gallery Media Picker',
  subtitle = 'Select an uploaded placement image from your active website themes or media gallery.',
}) {
  const [internalThemes, setInternalThemes] = useState(() => cachedThemesLookup || []);
  const [pickerThemeFilter, setPickerThemeFilter] = useState(initialTheme ? String(initialTheme) : 'all');
  const [pickerPlacementFilter, setPickerPlacementFilter] = useState(initialPlacement || 'all');
  const [pickerDeviceFilter, setPickerDeviceFilter] = useState(initialPlatform || 'web');
  const [pickerSearch, setPickerSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [pickerImages, setPickerImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const { openImagePreview } = useImagePreview();

  const abortControllerRef = useRef(null);
  const hasLoadedOnceRef = useRef(false);

  const handlePreview = (e, img, idx) => {
    e.stopPropagation();
    const targetUrl = getMediaUrl(img.image?.url || img.url);
    const title = img.name || img.title || img.recordTitle || `Placement Image ${idx + 1}`;
    const gallery = pickerImages.map((item) => getMediaUrl(item.image?.url || item.url));
    openImagePreview(targetUrl, {
      title,
      gallery,
      initialIndex: idx >= 0 ? idx : 0,
    });
  };

  // Sync initial filters when modal opens
  useEffect(() => {
    if (!isOpen) {
      abortControllerRef.current?.abort();
      hasLoadedOnceRef.current = false;
      return;
    }
    clearRequestCache('gmp:');
    setPickerThemeFilter(initialTheme ? String(initialTheme) : 'all');
    setPickerPlacementFilter(initialPlacement || 'all');
    setPickerDeviceFilter(initialPlatform || 'web');
    setPickerSearch('');
    setDebouncedSearch('');
    setPage(1);
    hasLoadedOnceRef.current = false;
  }, [isOpen, initialTheme, initialPlacement, initialPlatform]);

  // Debounce search text cleanly without delaying dropdown/filter switches
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(pickerSearch);
    }, pickerSearch ? 250 : 0);
    return () => clearTimeout(timer);
  }, [pickerSearch]);

  // Synchronize passed themes if provided, else load via theme lookup API
  useEffect(() => {
    if (Array.isArray(passedThemes) && passedThemes.length > 0) {
      setInternalThemes(passedThemes);
      return;
    }
    let isMounted = true;
    loadThemesLookup().then((list) => {
      if (isMounted && list && list.length > 0) {
        setInternalThemes(list);
      }
    });
    return () => {
      isMounted = false;
    };
  }, [passedThemes, isOpen]);

  // Fetch images matching filters and pagination via /gallery/lookup
  const fetchImages = useCallback(
    async (
      theme = pickerThemeFilter,
      placement = pickerPlacementFilter,
      platform = pickerDeviceFilter,
      currentPage = page,
      limit = pageSize,
      search = debouncedSearch,
      { silent = false } = {}
    ) => {
      if (silent) {
        clearRequestCache('gmp:');
      }

      abortControllerRef.current?.abort();
      const controller = new AbortController();
      abortControllerRef.current = controller;

      const trimmedQ = String(search || '').trim();
      const cacheKey = `gmp:th=${theme || 'all'}:pl=${placement || 'all'}:dv=${platform || 'all'}:p=${currentPage}:l=${limit}:q=${trimmedQ}`;
      const cached = !silent ? getCachedData(cacheKey, 60_000) : null;

      if (cached) {
        setPickerImages(cached.items);
        setTotalItems(cached.total);
        setTotalPages(cached.totalPages);
        hasLoadedOnceRef.current = true;
        setLoading(false);
        setRefreshing(false);
      } else if (!silent) {
        if (hasLoadedOnceRef.current) {
          setRefreshing(true);
          setLoading(false);
        } else {
          setLoading(true);
          setRefreshing(false);
        }
      }

      try {
        const params = {
          page: currentPage,
          limit,
        };
        if (theme && theme !== 'all') params.themeId = theme;
        if (placement && placement !== 'all') {
          params.type = placement;
        }
        if (platform && platform !== 'all') {
          params.platform = platform;
        }
        if (trimmedQ) {
          params.search = trimmedQ;
        }

        const res = await api.get('/gallery/lookup', { params, signal: controller.signal });
        if (controller.signal.aborted) return;

        const data = res.data?.data;
        const items = Array.isArray(data) ? data : (data?.items || []);
        const pagination = res.data?.pagination || data?.pagination || {};
        const total = pagination.totalDocs ?? pagination.totalItems ?? items.length;
        const resolvedPages = pagination.totalPages || Math.max(1, Math.ceil(total / limit));

        hasLoadedOnceRef.current = true;
        setPickerImages(items);
        setTotalItems(total);
        setTotalPages(resolvedPages);
        setCachedData(cacheKey, { items, total, totalPages: resolvedPages });
      } catch (err) {
        if (isAbortError(err)) return;
        console.error('Failed to load picker images:', err);
        if (!cached) {
          setPickerImages([]);
          setTotalItems(0);
          setTotalPages(1);
        }
      } finally {
        if (!controller.signal.aborted && !silent) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [pickerThemeFilter, pickerPlacementFilter, pickerDeviceFilter, page, pageSize, debouncedSearch]
  );

  // Trigger fetch immediately when modal opens or filters/search/page change
  useEffect(() => {
    if (!isOpen) return;
    fetchImages(pickerThemeFilter, pickerPlacementFilter, pickerDeviceFilter, page, pageSize, debouncedSearch);
    return () => {
      abortControllerRef.current?.abort();
    };
  }, [isOpen, pickerThemeFilter, pickerPlacementFilter, pickerDeviceFilter, page, pageSize, debouncedSearch, fetchImages]);

  const activeThemes = useMemo(() => {
    const list = Array.isArray(passedThemes) && passedThemes.length > 0 ? passedThemes : internalThemes;
    return (list || []).map((t) => ({
      ...t,
      _id: String(t._id),
      isLive: Boolean(t.isLive || t.status === 'active'),
    }));
  }, [passedThemes, internalThemes]);

  const modalThemeOptions = useMemo(() => {
    return [
      {
        value: '',
        label: 'Global / Unassigned Theme',
        sublabel: 'Available across all storefront themes',
      },
      ...activeThemes.map((t) => ({
        value: String(t._id),
        label: t.name,
      })),
    ];
  }, [activeThemes]);

  const uploadDefaultType = useMemo(() => {
    if (pickerPlacementFilter && pickerPlacementFilter !== 'all') {
      if (pickerPlacementFilter === 'mobileapp') return 'mobileappbanner';
      if (pickerPlacementFilter === 'appointments') return 'bookappointbanner';
      if (pickerPlacementFilter === 'custom') return 'customizebanner';
      return pickerPlacementFilter;
    }
    return 'herobanner';
  }, [pickerPlacementFilter]);

  const uploadDefaultThemeId = useMemo(() => {
    if (pickerThemeFilter && pickerThemeFilter !== 'all') {
      return pickerThemeFilter;
    }
    const liveTheme = activeThemes.find((t) => t.isLive || t.status === 'active');
    return liveTheme ? String(liveTheme._id) : '';
  }, [pickerThemeFilter, activeThemes]);

  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center p-3 sm:p-5 bg-stone-900/70 backdrop-blur-xs overflow-y-auto animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl h-[88dvh] sm:h-[84vh] max-h-[800px] flex flex-col bg-white rounded-2xl sm:rounded-3xl border border-stone-200 shadow-2xl overflow-hidden my-auto animate-scaleIn"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-stone-150 bg-stone-50/80 flex flex-wrap sm:flex-nowrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-sm shrink-0"
              style={{ backgroundColor: 'var(--theme-primary, #8b6f4e)' }}
            >
              <HiOutlinePhotograph className="w-5 h-5 stroke-[1.8]" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-stone-900 tracking-tight">
                {title}
              </h3>
              <p className="text-[11px] sm:text-xs text-stone-500 line-clamp-1">{subtitle}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setIsUploadModalOpen(true)}
              style={{ backgroundColor: 'var(--theme-primary, #8a6d4b)' }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-white text-xs font-semibold hover:opacity-90 shadow-2xs transition-all cursor-pointer shrink-0"
              title="Upload new media asset to gallery"
            >
              <HiOutlineUpload className="w-3.5 h-3.5 stroke-[2]" />
              <span>Upload Media</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-xl border border-stone-200 bg-white hover:bg-stone-100 text-stone-400 hover:text-stone-700 flex items-center justify-center transition-colors cursor-pointer shadow-2xs"
            >
              <HiOutlineX className="w-4 h-4 stroke-2" />
            </button>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="p-3.5 sm:p-4 border-b border-stone-150 bg-stone-50/50 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 shrink-0">
          {/* Search */}
          <div className="relative flex-1 w-full sm:w-auto">
            <HiOutlineSearch className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              value={pickerSearch}
              onChange={(e) => {
                setPickerSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search by name, placement or theme..."
              className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-stone-200 text-xs text-stone-800 bg-white focus:outline-none focus:ring-1 focus:ring-[var(--theme-primary,#8a6d4b)] focus:border-[var(--theme-primary,#8a6d4b)]"
            />
          </div>

          {/* Filter Theme */}
          <div className="w-full sm:w-52">
            <Dropdown
              value={pickerThemeFilter}
              onChange={(val) => {
                setPickerThemeFilter(val);
                setPage(1);
              }}
              options={[
                { value: 'all', label: 'All Website Themes' },
                ...activeThemes.map((t) => ({
                  value: String(t._id),
                  label: `${t.name}${t.isLive || t.status === 'active' ? ' · Active' : ''}`,
                })),
              ]}
              buttonClassName="w-full h-9 px-3 rounded-xl border border-stone-200 text-xs text-stone-700 bg-white"
              menuClassName="z-30"
            />
          </div>

          {/* Filter Placement */}
          <div className="w-full sm:w-48">
            <PlacementSelect
              includeAll={true}
              allLabel="All Placements"
              value={pickerPlacementFilter}
              onChange={(val) => {
                setPickerPlacementFilter(val || 'all');
                setPage(1);
              }}
              options={placementOptions}
              buttonClassName="w-full h-9 px-3 rounded-xl border border-stone-200 text-xs text-stone-700 bg-white"
              menuClassName="z-30"
            />
          </div>

          {/* Filter Platform (Web / App / All) */}
          <div className="w-full sm:w-40">
            <Dropdown
              value={pickerDeviceFilter}
              onChange={(val) => {
                setPickerDeviceFilter(val);
                setPage(1);
              }}
              options={[
                { value: 'all', label: 'All Platforms' },
                { value: 'web', label: 'Web' },
                { value: 'app', label: 'App' },
                { value: 'common', label: 'Common' },
              ]}
              buttonClassName="w-full h-9 px-3 rounded-xl border border-stone-200 text-xs text-stone-700 bg-white"
              menuClassName="z-30"
            />
          </div>

          {/* Refresh */}
          <button
            type="button"
            onClick={() => fetchImages(pickerThemeFilter, pickerPlacementFilter, pickerDeviceFilter, page, pageSize, debouncedSearch, { silent: true })}
            title="Refresh images"
            className="w-full sm:w-9 h-9 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-stone-600 flex items-center justify-center gap-1.5 shrink-0 cursor-pointer shadow-2xs"
          >
            <HiOutlineRefresh className={`w-4 h-4 ${(loading || refreshing) ? 'animate-spin' : ''}`} />
            <span className="sm:hidden text-xs font-medium">Refresh</span>
          </button>
        </div>

        {/* Picker Images Grid */}
        <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-5 scrollbar-thin relative">
          {refreshing && (
            <div className="sticky top-0 left-0 right-0 z-20 -mx-4 -mt-4 sm:-mx-5 sm:-mt-5 mb-3 sm:mb-4 h-0.5 bg-stone-200/70 overflow-hidden">
              <div
                style={{ backgroundColor: 'var(--theme-primary, #8a6d4b)' }}
                className="h-full w-1/3 rounded-full animate-pulse"
              />
            </div>
          )}
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="rounded-2xl border border-stone-200/80 bg-white overflow-hidden animate-pulse">
                  <div className="aspect-[16/10] bg-stone-100" />
                  <div className="p-2 flex justify-between">
                    <div className="h-2.5 w-1/2 rounded bg-stone-100" />
                    <div className="h-2.5 w-8 rounded bg-stone-100" />
                  </div>
                </div>
              ))}
            </div>
          ) : pickerImages.length === 0 ? (
            <div className="h-full min-h-[240px] flex flex-col items-center justify-center text-center text-stone-400">
              <HiOutlinePhotograph className="w-12 h-12 text-stone-300 mb-2 stroke-1" />
              <p className="text-sm font-medium text-stone-600">No images found</p>
              <p className="text-xs text-stone-400 mt-1 max-w-sm mx-auto">
                No images matching the selected theme and placement. Try switching to &quot;All Website Themes&quot; or &quot;All Placements&quot;.
              </p>
              <button
                type="button"
                onClick={() => setIsUploadModalOpen(true)}
                style={{ backgroundColor: 'var(--theme-primary, #8a6d4b)' }}
                className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-white text-xs font-semibold hover:opacity-90 shadow-2xs transition-all cursor-pointer"
              >
                <HiOutlineUpload className="w-4 h-4 stroke-[2]" />
                <span>Upload Media</span>
              </button>
            </div>
          ) : (
            <div
              className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5 transition-opacity duration-150 ${
                refreshing ? 'opacity-60 pointer-events-none' : 'opacity-100'
              }`}
            >
              {pickerImages.map((img, idx) => {
                const imgUrl = img.image?.url || img.url;
                const imgTitle = img.name || img.title || img.recordTitle || `Theme Image ${idx + 1}`;
                const imgPlacement = img.type || img.filterType || 'banner';
                const imgTheme =
                  img.themeId?.name ||
                  (activeThemes.find((t) => String(t._id) === String(img.themeId))?.name) ||
                  '';
                const isCurrentlySelected = currentSelectedUrl && currentSelectedUrl === imgUrl;

                return (
                  <div
                    key={img.id || img._id || idx}
                    onClick={() => onSelect(img)}
                    className={`group relative rounded-2xl border overflow-hidden bg-white cursor-pointer transition-all duration-200 flex flex-col ${
                      isCurrentlySelected
                        ? 'border-[var(--theme-primary,#8b6f4e)] ring-2 ring-[var(--theme-primary,#8b6f4e)]/40 shadow-md'
                        : 'border-stone-200/90 hover:border-[var(--theme-primary,#8a6d4b)] hover:shadow-md hover:-translate-y-0.5'
                    }`}
                  >
                    {/* Image Thumbnail */}
                    <div className="relative aspect-[16/10] bg-stone-900 overflow-hidden">
                      <img
                        src={getMediaUrl(imgUrl)}
                        alt={imgTitle}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />

                      {/* Quick Preview Icon (Top Left) */}
                      <button
                        type="button"
                        onClick={(e) => handlePreview(e, img, idx)}
                        className="absolute top-2 left-2 z-20 w-7 h-7 rounded-lg bg-black/70 hover:bg-black text-white flex items-center justify-center opacity-85 group-hover:opacity-100 transition-all backdrop-blur-xs shadow-xs cursor-pointer hover:scale-105"
                        title="Preview full size"
                      >
                        <HiOutlineEye className="w-3.5 h-3.5 stroke-2" />
                      </button>

                      {/* Overlay actions on hover */}
                      <div className="absolute inset-0 bg-stone-900/65 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-2 z-10">
                        <button
                          type="button"
                          onClick={(e) => handlePreview(e, img, idx)}
                          className="px-2.5 py-1.5 rounded-xl bg-stone-900/90 hover:bg-black text-white text-xs font-semibold shadow-md flex items-center gap-1.5 transition-all cursor-pointer border border-white/20 hover:border-white/40"
                          title="Preview full size image"
                        >
                          <HiOutlineEye className="w-3.5 h-3.5 text-stone-200" />
                          <span>Preview</span>
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelect(img);
                          }}
                          className="px-3 py-1.5 rounded-xl bg-white hover:bg-stone-100 text-stone-900 text-xs font-bold shadow-md flex items-center gap-1.5 transition-all cursor-pointer"
                          title="Select this image"
                        >
                          <HiOutlineCheck
                            className="w-3.5 h-3.5 stroke-[2.5]"
                            style={{ color: 'var(--theme-primary, #8b6f4e)' }}
                          />
                          <span>Select</span>
                        </button>
                      </div>

                      {/* Selected Badge */}
                      {isCurrentlySelected && (
                        <div
                          style={{ backgroundColor: 'var(--theme-primary, #8b6f4e)' }}
                          className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-white text-[10px] font-bold shadow-xs"
                        >
                          Current
                        </div>
                      )}

                      {/* Placement pill */}
                      <div className="absolute bottom-1.5 left-1.5 px-2 py-0.5 rounded-md bg-stone-900/75 backdrop-blur-xs text-white text-[9.5px] font-semibold uppercase tracking-wider">
                        {imgPlacement}
                      </div>
                    </div>

                    {/* Metadata Card Footer */}
                    <div className="p-2 bg-white flex items-center justify-between text-[10px] text-stone-500 gap-1 min-w-0">
                      <span className="truncate font-medium">{imgTheme || 'Default Theme'}</span>
                      {img.platform && (
                        <span className="shrink-0 uppercase font-mono px-1 py-0.5 rounded bg-stone-100 text-stone-600">
                          {img.platform}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Footer with Pagination */}
        <div className="p-3 sm:p-4 border-t border-stone-150 bg-stone-50/90 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="flex-1 w-full sm:w-auto">
            {totalItems > 0 ? (
              <Pagination
                currentPage={page}
                totalItems={totalItems}
                pageSize={pageSize}
                totalPages={totalPages}
                onPageChange={(p) => setPage(p)}
                onPageSizeChange={(newSize) => {
                  setPageSize(Number(newSize));
                  setPage(1);
                }}
                pageSizeOptions={[12, 24, 48, 96]}
                showPageSize={true}
                itemLabel="images"
                className="border-t-0 !px-0 !py-0 !bg-transparent shadow-none"
              />
            ) : (
              <span className="text-xs text-stone-500 font-medium">
                {loading ? 'Loading images...' : '0 images available'}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-stone-200 bg-white hover:bg-stone-100 text-xs font-semibold text-stone-700 transition cursor-pointer shadow-2xs shrink-0 self-end sm:self-auto"
          >
            Close
          </button>
        </div>
      </div>

      {/* ─── Upload Media to Gallery Modal ─── */}
      {isUploadModalOpen && (
        <GalleryUploadModal
          isOpen={isUploadModalOpen}
          onClose={() => setIsUploadModalOpen(false)}
          defaultThemeId={uploadDefaultThemeId}
          defaultType={uploadDefaultType}
          modalThemeOptions={modalThemeOptions}
          placementTypeOptions={DEFAULT_UPLOAD_PLACEMENTS}
          onSuccess={() => {
            setIsUploadModalOpen(false);
            setPage(1);
            fetchImages(pickerThemeFilter, pickerPlacementFilter, pickerDeviceFilter, 1, pageSize, debouncedSearch, { silent: true });
          }}
          zIndexClass="z-[10500]"
        />
      )}
    </div>,
    document.body
  );
}

