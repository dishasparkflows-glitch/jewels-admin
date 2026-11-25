import { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  HiOutlinePhotograph,
  HiOutlineSearch,
  HiOutlineRefresh,
  HiOutlineEye,
  HiOutlineX,
  HiOutlineDesktopComputer,
  HiOutlineDeviceMobile,
  HiOutlineUpload,
  HiOutlineClipboardCopy,
  HiOutlineCheck,
} from 'react-icons/hi';
import { IoSparklesOutline } from 'react-icons/io5';
import toast from 'react-hot-toast';
import { galleryAPI } from '../../api/services';
import Pagination from '../../components/common/Pagination';
import PlacementSelect, { PLACEMENT_LABELS } from '../../components/common/PlacementSelect';
import useDebounce from '../../hooks/useDebounce';
import { uploadWithPresignedUrl } from '../../utils/uploadWithPresignedUrl';



function getPlacementLabel(placement) {
  if (!placement) return 'Media';
  const lower = String(placement).toLowerCase();
  return PLACEMENT_LABELS[lower] || placement;
}

function getMediaFileName(item) {
  if (!item) return 'media-asset.webp';
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
  return fileName || 'media-asset.webp';
}

export default function ThemeMediaLibraryTab({ theme, themeId }) {
  const currentThemeId = themeId || theme?._id;
  const currentThemeName = theme?.name || '';

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [selectedPlacement, setSelectedPlacement] = useState('all');

  // Pagination state
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Lightbox preview & copy status
  const [previewItem, setPreviewItem] = useState(null);
  const [copiedUrl, setCopiedUrl] = useState(false);

  const fileInputRef = useRef(null);

  // ─── Fetch Media from Gallery Lookup API (ThemeId Wise with page & limit) ───
  const fetchGalleryMedia = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        themeId: currentThemeId || undefined,
        type: selectedPlacement !== 'all' ? selectedPlacement : undefined,
        search: debouncedSearch.trim() || undefined,
        page,
        limit: pageSize,
      };

      const res = await galleryAPI.getLookup(params);
      const data = res.data?.data;
      const fetchedItems = Array.isArray(data) ? data : (data?.items || res.data?.items || []);
      const pagination = res.data?.pagination || data?.pagination || {};

      setItems(fetchedItems);
      const total = pagination.total ?? pagination.totalDocs ?? pagination.totalItems ?? fetchedItems.length;
      setTotalItems(total);
      setTotalPages(pagination.totalPages || Math.max(1, Math.ceil(total / pageSize)));
    } catch (err) {
      console.error('Failed to load gallery lookup:', err);
      toast.error('Could not load gallery media');
    } finally {
      setLoading(false);
    }
  }, [currentThemeId, selectedPlacement, debouncedSearch, page, pageSize]);

  // On mount and when search, placement, theme, page or pageSize changes
  useEffect(() => {
    fetchGalleryMedia();
  }, [fetchGalleryMedia]);

  // Reset to page 1 on search, placement, or theme change
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, selectedPlacement, currentThemeId]);

  // Items are already paginated by the backend
  const displayedItems = items;

  // ─── Handle Upload Media for This Theme ───
  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setUploading(true);
    const toastId = toast.loading(
      `Uploading ${files.length} image${files.length > 1 ? 's' : ''} for ${currentThemeName || 'this theme'}…`
    );

    try {
      let successCount = 0;
      for (const file of files) {
        // 1. Upload file via presigned URL with auto-compression
        const upload = await uploadWithPresignedUrl(file, 'website-themes');

        // 2. Register media in Gallery with themeId
        await galleryAPI.create({
          themeId: currentThemeId || null,
          type: 'asset',
          platform: 'common',
          image: {
            url: upload.fileUrl,
            key: upload.key || '',
          },
          status: 'active',
        });
        successCount++;
      }

      toast.success(
        `Successfully uploaded ${successCount} media asset${successCount > 1 ? 's' : ''}!`,
        { id: toastId }
      );

      // Re-fetch gallery on page 1
      if (page === 1) {
        fetchGalleryMedia();
      } else {
        setPage(1);
      }
    } catch (err) {
      console.error('Failed to upload theme media:', err);
      toast.error(err.response?.data?.message || 'Upload failed. Please try again.', {
        id: toastId,
      });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Copy media URL to clipboard
  const handleCopyUrl = (url) => {
    if (!url) return;
    navigator.clipboard.writeText(url);
    setCopiedUrl(true);
    toast.success('Image URL copied to clipboard');
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  return (
    <div className="space-y-3">
      {/* ─── 1. TOP HEADER BAR ─── */}
      <div className="rounded-xl border border-stone-200 bg-white p-3.5 sm:p-4 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h2 className="text-base sm:text-lg font-bold text-stone-900 tracking-tight">
              Theme Media Library
            </h2>
            {currentThemeName && (
              <span className="text-xs font-medium text-stone-500">
                · {currentThemeName}
              </span>
            )}
            <span className="inline-flex items-center rounded-full bg-stone-100 px-2.5 py-0.5 text-xs font-semibold text-stone-700">
              {totalItems} {totalItems === 1 ? 'Item' : 'Items'}
            </span>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Placement Type Filter Dropdown */}
            <div className="w-full sm:w-64">
              <PlacementSelect
                size="sm"
                includeAll={true}
                allLabel="All Placement Types"
                value={selectedPlacement}
                onChange={(val) => {
                  setSelectedPlacement(val || 'all');
                }}
                placeholder="Filter placement type…"
                portal={true}
                menuClassName="z-[10000]"
              />
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-60">
              <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search theme media..."
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

            {/* Hidden File Input (kept for empty-state upload action) */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              multiple
              accept="image/*"
              className="hidden"
            />
          </div>
        </div>
      </div>

      {/* ─── 2. MEDIA GRID ─── */}
      {loading ? (
        <div className="rounded-2xl border border-stone-200 bg-white p-20 text-center text-xs text-stone-500 space-y-2">
          <HiOutlineRefresh className="h-6 w-6 animate-spin mx-auto text-[#8b6f4e]" />
          <p>Loading {currentThemeName ? `${currentThemeName} ` : ''}media gallery assets…</p>
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-stone-300 bg-white p-14 text-center space-y-3">
          <HiOutlinePhotograph className="mx-auto h-10 w-10 text-stone-300" />
          <h3 className="text-sm font-bold text-stone-800">No media found</h3>
          <p className="text-xs text-stone-500 max-w-sm mx-auto">
            {search
              ? `No media matches "${search}". Try clearing search.`
              : selectedPlacement !== 'all'
              ? `No ${getPlacementLabel(selectedPlacement)} media found for ${currentThemeName || 'this theme'}.`
              : `No media assets have been assigned to ${currentThemeName || 'this theme'} yet.`}
          </p>
          {(search || selectedPlacement !== 'all') ? (
            <button
              type="button"
              onClick={() => {
                setSearch('');
                setSelectedPlacement('all');
              }}
              className="inline-flex items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-xs font-semibold text-stone-700 hover:bg-stone-50 transition shadow-2xs cursor-pointer"
            >
              <HiOutlineRefresh className="h-3.5 w-3.5 text-[#8b6f4e]" />
              <span>Reset Filters</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#8b6f4e] hover:bg-[#785e41] text-white rounded-xl text-xs font-semibold shadow-xs transition cursor-pointer"
            >
              <HiOutlineUpload className="h-4 w-4" />
              Upload Media for {currentThemeName || 'This Theme'}
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
          {displayedItems.map((item) => {
            const fileName = getMediaFileName(item);
            const mediaUrl = item.url || item.image?.url;
            const placementLabel = item.typeLabel || getPlacementLabel(item.type);
            const platform = item.platform || 'common';

            return (
              <div
                key={item.id || item._id}
                onClick={() => setPreviewItem(item)}
                className="group relative flex flex-col rounded-xl border border-stone-200/90 bg-white shadow-2xs hover:shadow-md hover:border-stone-300 transition-all overflow-hidden cursor-pointer"
              >
                {/* Media Image Box (16:10 aspect ratio) */}
                <div className="relative aspect-[16/10] w-full bg-stone-100 overflow-hidden">
                  <img
                    src={mediaUrl}
                    alt={fileName}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />

                  {/* Top-Left: Placement Badge */}
                  <div className="absolute left-2 top-2 z-10">
                    <span className="inline-flex items-center gap-1 rounded-full bg-black/60 backdrop-blur-md px-2 py-0.5 text-[10px] font-medium text-white shadow-xs">
                      {placementLabel}
                    </span>
                  </div>

                  {/* Top-Right: Platform Badge */}
                  <div className="absolute right-2 top-2 z-10">
                    <span className="inline-flex items-center gap-1 rounded-full bg-black/60 backdrop-blur-md px-2 py-0.5 text-[10px] font-medium text-white shadow-xs capitalize">
                      {platform === 'common' ? (
                        <>
                          <IoSparklesOutline className="h-2.5 w-2.5 text-amber-300" />
                          <span>Common</span>
                        </>
                      ) : platform === 'app' || platform === 'mobile' ? (
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

                  {/* Hover Overlay with Preview Icon */}
                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="rounded-xl bg-white/95 px-3 py-1.5 text-xs font-semibold text-stone-900 shadow-md flex items-center gap-1.5">
                      <HiOutlineEye className="h-3.5 w-3.5" />
                      Preview
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ─── 3. PAGINATION FOOTER ─── */}
      {totalItems > 0 && (
        <div className="rounded-xl border border-stone-200 shadow-2xs">
          <Pagination
            currentPage={page}
            totalItems={totalItems}
            pageSize={pageSize}
            onPageChange={(p) => setPage(p)}
            onPageSizeChange={(newSize) => {
              setPageSize(newSize);
              setPage(1);
            }}
            showPageSize={true}
            itemLabel="theme assets"
          />
        </div>
      )}

      {/* ─── 4. LIGHTBOX PREVIEW MODAL ─── */}
      {previewItem &&
        createPortal(
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-xs animate-fadeIn"
            onClick={() => setPreviewItem(null)}
          >
            <div
              className="relative max-w-4xl max-h-[90vh] overflow-hidden rounded-2xl bg-white p-4 shadow-2xl flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-stone-200 pb-3 mb-3 gap-3">
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-bold text-stone-900 truncate">
                    {previewItem.title || previewItem.name || previewItem.typeLabel || getPlacementLabel(previewItem.type)}
                  </h3>
                  <div className="flex items-center gap-2 mt-0.5 text-xs text-stone-500">
                    <span>{previewItem.typeLabel || getPlacementLabel(previewItem.type)}</span>
                    <span>·</span>
                    <span className="uppercase">{previewItem.platform || 'common'}</span>
                    {(previewItem.themeName || previewItem.themeId?.name || currentThemeName) && (
                      <>
                        <span>·</span>
                        <span className="text-[#8b6f4e] font-medium">
                          {previewItem.themeName || previewItem.themeId?.name || currentThemeName}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      handleCopyUrl(previewItem.url || previewItem.image?.url)
                    }
                    className="flex items-center gap-1.5 rounded-xl border border-stone-200 px-3 py-1.5 text-xs font-semibold text-stone-700 hover:bg-stone-50 transition cursor-pointer"
                    title="Copy Image URL"
                  >
                    {copiedUrl ? (
                      <>
                        <HiOutlineCheck className="h-4 w-4 text-emerald-600" />
                        <span className="text-emerald-600">Copied!</span>
                      </>
                    ) : (
                      <>
                        <HiOutlineClipboardCopy className="h-4 w-4 text-stone-500" />
                        <span>Copy URL</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setPreviewItem(null)}
                    className="rounded-xl border border-stone-200 p-1.5 text-stone-400 hover:bg-stone-100 hover:text-stone-700 transition cursor-pointer"
                  >
                    <HiOutlineX className="h-5 w-5" />
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-center overflow-auto max-h-[72vh] rounded-xl bg-stone-50/50 border border-stone-200/60 overflow-hidden">
                <img
                  src={previewItem.url || previewItem.image?.url}
                  alt={getMediaFileName(previewItem)}
                  className="max-h-[72vh] w-auto max-w-full object-contain"
                />
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
