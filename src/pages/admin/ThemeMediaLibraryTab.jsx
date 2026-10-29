import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  HiOutlinePhotograph,
  HiOutlineSearch,
  HiOutlineRefresh,
  HiOutlineEye,
  HiOutlineX,
  HiOutlineDesktopComputer,
  HiOutlineDeviceMobile,
} from 'react-icons/hi';
import { IoSparklesOutline } from 'react-icons/io5';
import toast from 'react-hot-toast';
import { galleryAPI } from '../../api/services';

function getMediaFileName(item) {
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
  return fileName || 'media-asset.webp';
}

export default function ThemeMediaLibraryTab() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Lightbox preview
  const [previewItem, setPreviewItem] = useState(null);

  // ─── Fetch Media from Gallery List API ───────────────────
  const fetchGalleryMedia = useCallback(async () => {
    try {
      setLoading(true);
      const res = await galleryAPI.getAll({
        search: search.trim() || undefined,
        limit: 100,
      });

      const data = res.data?.data || res.data || {};
      setItems(data.items || []);
    } catch (err) {
      console.error('Failed to load gallery media list:', err);
      toast.error('Could not load gallery media');
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    fetchGalleryMedia();
  }, [fetchGalleryMedia]);

  return (
    <div className="space-y-2.5 sm:space-y-3">
      {/* ─── 1. TOP HEADER BAR ─── */}
      <div className="rounded-xl border border-stone-200 bg-white p-3.5 sm:p-4 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <h2 className="text-base sm:text-lg font-bold text-stone-900 tracking-tight">
              Theme Media Library
            </h2>
            <span className="inline-flex items-center rounded-full bg-stone-100 px-2.5 py-0.5 text-xs font-semibold text-stone-700">
              {items.length} Items
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search media..."
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

            {/* Refresh Button */}
            <button
              type="button"
              onClick={fetchGalleryMedia}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-stone-50 border border-stone-200 text-stone-700 rounded-xl text-xs font-semibold shadow-2xs transition cursor-pointer"
              title="Refresh Media Gallery"
            >
              <HiOutlineRefresh className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </div>
      </div>

      {/* ─── 2. MEDIA GRID: Display only media, nothing extra ─── */}
      {loading ? (
        <div className="rounded-2xl border border-stone-200 bg-white p-20 text-center text-xs text-stone-500 space-y-2">
          <HiOutlineRefresh className="h-6 w-6 animate-spin mx-auto text-[#8b6f4e]" />
          <p>Loading media gallery assets…</p>
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-stone-300 bg-white p-16 text-center space-y-2">
          <HiOutlinePhotograph className="mx-auto h-10 w-10 text-stone-300" />
          <h3 className="text-sm font-bold text-stone-800">No media found</h3>
          <p className="text-xs text-stone-500 max-w-sm mx-auto">
            {search
              ? `No media matches "${search}". Try clearing search.`
              : 'No media assets available in the gallery.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
          {items.map((item) => {
            const fileName = getMediaFileName(item);
            const mediaUrl = item.url || item.image?.url;
            const placementLabel = item.typeLabel || item.placement || 'Media';
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

                {/* Media Info: Clean File Name Only */}
                <div className="p-2.5 bg-white">
                  <p className="text-xs font-bold text-stone-800 truncate" title={fileName}>
                    {fileName}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ─── 3. LIGHTBOX PREVIEW MODAL ─── */}
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
                    {getMediaFileName(previewItem)}
                  </h3>
                  <div className="flex items-center gap-2 mt-0.5 text-xs text-stone-500">
                    <span>{previewItem.typeLabel || previewItem.placement}</span>
                    <span>·</span>
                    <span className="uppercase">{previewItem.platform || 'common'}</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setPreviewItem(null)}
                  className="rounded-xl border border-stone-200 p-2 text-stone-400 hover:bg-stone-100 hover:text-stone-700 transition cursor-pointer"
                >
                  <HiOutlineX className="h-5 w-5" />
                </button>
              </div>

              <div className="flex items-center justify-center overflow-auto max-h-[70vh] bg-stone-950 rounded-xl p-2">
                <img
                  src={previewItem.url || previewItem.image?.url}
                  alt={getMediaFileName(previewItem)}
                  className="max-h-[68vh] w-auto max-w-full object-contain rounded-lg"
                />
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
