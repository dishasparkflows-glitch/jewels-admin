import React from 'react';
import { createPortal } from 'react-dom';
import {
  HiOutlinePhotograph,
  HiOutlineVideoCamera,
  HiOutlineX,
  HiOutlineCheck,
  HiOutlineEye,
  HiOutlineInformationCircle,
  HiOutlineRefresh,
} from 'react-icons/hi';
import { useAddJewelryProductContext } from './AddJewelryProductContext';

export default function CompressionHubModal() {
  const {
    showCompressionHub,
    isSilverProduct,
    handleCloseCompressionHub,
    mediaImages,
    mediaVideos,
    activeMediaColor,
    compressionTab,
    setCompressionTab,
    selectedCompressionIds,
    setSelectedCompressionIds,
    compressionPreviews,
    setViewingCompressionMedia,
    previewingCompression,
    formatMediaSize,
    isSizeInKb,
    compressionFormat,
    setCompressionFormat,
    compressionQuality,
    setCompressionQuality,
    compressingMedia,
    handleApplyMediaCompression,
  } = useAddJewelryProductContext();

  if (!showCompressionHub || isSilverProduct) return null;

  const allMediaItems = [
    ...(mediaImages[activeMediaColor] || []).map((img) => ({ ...img, mediaType: 'image' })),
    ...(mediaVideos[activeMediaColor] || []).map((vid) => ({ ...vid, mediaType: 'video' })),
  ];
  const displayedMedia =
    compressionTab === 'images'
      ? allMediaItems.filter((m) => m.mediaType === 'image')
      : compressionTab === 'videos'
      ? allMediaItems.filter((m) => m.mediaType === 'video')
      : allMediaItems;

  const selectedItems = displayedMedia.filter((item) => selectedCompressionIds.includes(item.id));
  const original = selectedItems.reduce((sum, item) => {
    const preview = item.mediaType === 'image' ? compressionPreviews[item.id] : null;
    return sum + (preview?.originalSize || item.fileSize || 0);
  }, 0);
  const compressed = selectedItems.reduce((sum, item) => {
    const preview = item.mediaType === 'image' ? compressionPreviews[item.id] : null;
    return sum + (preview?.compressedSize || (item.mediaType === 'video' ? item.fileSize : 0));
  }, 0);
  const savings =
    original && compressed && original > compressed
      ? Math.max(0, Math.round((1 - compressed / original) * 100))
      : 0;

  return createPortal(
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center overflow-y-auto bg-slate-950/80 p-2 sm:p-4 md:p-6 backdrop-blur-sm cursor-pointer"
      onClick={handleCloseCompressionHub}
    >
      <div
        className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl sm:rounded-3xl border border-stone-200 bg-white shadow-2xl cursor-default"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-4 py-3.5 sm:px-6 sm:py-4 border-b border-stone-100">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl sm:rounded-2xl bg-[#a58054] text-white">
              <HiOutlinePhotograph className="h-5 w-5" />
            </span>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900">Media Compression</h3>
              <p className="text-[11px] sm:text-xs text-slate-500">Optimize photos and media before publishing.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleCloseCompressionHub}
            className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl border border-stone-200 text-stone-600 hover:bg-stone-50 transition cursor-pointer"
            aria-label="Close compression hub"
          >
            <HiOutlineX className="h-4 w-4 sm:h-5 sm:w-5" />
          </button>
        </div>

        {/* Modal Tabs: All Media, Images, Videos */}
        <div className="grid grid-cols-3 border-b border-stone-200 bg-stone-50">
          {[
            {
              id: 'all',
              label: 'All Media',
              count: (mediaImages[activeMediaColor] || []).length + (mediaVideos[activeMediaColor] || []).length,
              Icon: HiOutlinePhotograph,
            },
            {
              id: 'images',
              label: 'Images',
              count: (mediaImages[activeMediaColor] || []).length,
              Icon: HiOutlinePhotograph,
            },
            {
              id: 'videos',
              label: 'Videos',
              count: (mediaVideos[activeMediaColor] || []).length,
              Icon: HiOutlineVideoCamera,
            },
          ].map(({ id, label, count, Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setCompressionTab(id)}
              className={`flex items-center justify-center gap-1.5 sm:gap-2 border-b-2 px-2 sm:px-4 py-2.5 sm:py-3 text-[11px] sm:text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                compressionTab === id
                  ? 'border-[#a58054] bg-white text-[#8b6f4e]'
                  : 'border-transparent text-stone-400 hover:text-stone-600'
              }`}
            >
              <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="truncate">{label} ({count})</span>
            </button>
          ))}
        </div>

        {/* Modal Scrollable Body */}
        <div className="space-y-4 overflow-y-auto bg-[#fffdfb] p-3 sm:p-5 md:p-6">
          {/* Compact Grid of Small Boxes */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2.5">
            {displayedMedia.map((item, index) => {
              const isImage = item.mediaType === 'image';
              const isSelected = selectedCompressionIds.includes(item.id);
              const preview = isImage ? compressionPreviews[item.id] : null;
              const originalSize = preview?.originalSize || item.fileSize || 0;

              return (
                <div
                  key={item.id || index}
                  onClick={() => setViewingCompressionMedia(item)}
                  className={`group relative flex flex-col overflow-hidden rounded-xl border bg-white transition-all cursor-pointer hover:shadow-md ${
                    isSelected
                      ? 'border-[#a58054] ring-2 ring-[#a58054]/25 shadow-xs'
                      : 'border-stone-200 hover:border-stone-300'
                  }`}
                >
                  {/* Thumbnail Media Box */}
                  <div
                    className={`relative aspect-square w-full overflow-hidden flex items-center justify-center ${
                      isImage ? 'bg-[#faf8f5] p-2' : 'bg-slate-900'
                    }`}
                  >
                    {isImage ? (
                      <img
                        src={item.url}
                        alt={item.name || `Product media ${index + 1}`}
                        className="h-full w-full object-contain transition-transform duration-200 group-hover:scale-105"
                      />
                    ) : (
                      <>
                        <video
                          src={item.url}
                          className="h-full w-full object-cover opacity-75"
                          muted
                          playsInline
                          preload="metadata"
                        />
                        <div className="absolute inset-0 bg-black/30 group-hover:bg-black/50 transition-colors flex items-center justify-center">
                          <div className="w-7 h-7 rounded-full bg-white/90 text-stone-900 flex items-center justify-center shadow-md">
                            <HiOutlineVideoCamera className="w-3.5 h-3.5 text-[#8b6f4e]" />
                          </div>
                        </div>
                      </>
                    )}

                    {/* Selection Checkbox */}
                    {isSizeInKb(originalSize || item.size) ? (
                      <span
                        className="absolute left-1.5 top-1.5 z-10 flex h-5 px-1.5 items-center justify-center rounded-md border border-stone-200 bg-stone-100/90 text-[8.5px] font-bold text-stone-500 shadow-xs cursor-not-allowed"
                        title="File is in KB — already optimal. Compression not allowed."
                      >
                        In KB
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedCompressionIds((ids) =>
                            ids.includes(item.id) ? ids.filter((id) => id !== item.id) : [...ids, item.id]
                          );
                        }}
                        className={`absolute left-1.5 top-1.5 z-10 flex h-5 w-5 items-center justify-center rounded-md border text-xs shadow-xs transition-all cursor-pointer ${
                          isSelected
                            ? 'border-[#a58054] bg-[#a58054] text-white'
                            : 'border-stone-300 bg-white/95 hover:bg-white text-transparent'
                        }`}
                        aria-label={`${isSelected ? 'Deselect' : 'Select'} ${item.name || 'media'}`}
                      >
                        <HiOutlineCheck className="h-3.5 w-3.5 stroke-[3]" />
                      </button>
                    )}

                    {/* Status / Type Badge */}
                    <span
                      className={`absolute right-1.5 top-1.5 rounded-full px-1.5 py-0.5 text-[9px] font-bold shadow-2xs ${
                        !isImage
                          ? 'bg-purple-50 text-purple-700 border border-purple-200/80'
                          : preview
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/80'
                          : previewingCompression && isSelected
                          ? 'bg-amber-50 text-amber-700 border border-amber-200/80'
                          : 'bg-stone-100 text-stone-600 border border-stone-200/80'
                      }`}
                    >
                      {!isImage ? 'Video' : preview ? 'Ready' : previewingCompression && isSelected ? 'Prep…' : 'Ready'}
                    </span>

                    {/* Hover View Hint */}
                    <div className="absolute inset-0 bg-stone-900/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                      <span className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white/95 text-stone-800 text-[10px] font-semibold shadow-md transform scale-95 group-hover:scale-100 transition-transform">
                        <HiOutlineEye className="w-3.5 h-3.5 text-[#8b6f4e]" />
                        View
                      </span>
                    </div>
                  </div>

                  {/* Compact Meta Bar */}
                  <div className="p-2 bg-white flex flex-col gap-0.5 border-t border-stone-100">
                    <p
                      className="truncate text-[10.5px] font-semibold text-stone-800"
                      title={item.name || item.title || `Media ${index + 1}`}
                    >
                      {item.name || item.title || `Media ${index + 1}`}
                    </p>
                    <div className="flex items-center justify-between text-[9.5px]">
                      <span className="text-stone-400 font-mono">
                        {originalSize ? formatMediaSize(originalSize) : item.size || '—'}
                      </span>
                      {preview?.compressedSize && (
                        <span className="font-bold text-emerald-600 font-mono">
                          {formatMediaSize(preview.compressedSize)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            {!displayedMedia.length && (
              <p className="col-span-full py-8 text-center text-xs text-stone-400">
                No media files found for this metal color.
              </p>
            )}
          </div>

          {/* Summary Statistics Bar */}
          <div className="grid grid-cols-2 gap-3 rounded-2xl border border-stone-200 bg-white p-3.5 sm:p-4 sm:grid-cols-4">
            <div>
              <span className="block text-[10px] text-slate-500 font-medium">Media selected</span>
              <strong className="text-xs sm:text-sm text-slate-900 font-bold">{selectedItems.length} items</strong>
            </div>
            <div>
              <span className="block text-[10px] text-slate-500 font-medium">Original size</span>
              <strong className="text-xs sm:text-sm text-slate-900 font-bold">{original ? formatMediaSize(original) : '—'}</strong>
            </div>
            <div>
              <span className="block text-[10px] text-slate-500 font-medium">Estimated size</span>
              <strong className="text-xs sm:text-sm text-green-700 font-bold">{compressed ? formatMediaSize(compressed) : '—'}</strong>
            </div>
            <div>
              <span className="block text-[10px] text-slate-500 font-medium">Estimated savings</span>
              <strong className="text-xs sm:text-sm text-green-700 font-bold">{savings ? `~${savings}%` : 'Optimal'}</strong>
            </div>
          </div>

          {/* Compression Settings Section */}
          <div className="rounded-2xl border border-stone-200 bg-white p-4 sm:p-5">
            <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
              <div>
                <h4 className="text-sm font-bold text-slate-900">Compression settings</h4>
                <p className="text-[10px] text-slate-500">
                  Adjust quality and format for the optimal balance between file size and visual fidelity.
                </p>
              </div>
              {(compressionTab === 'images' || compressionTab === 'all') && (
                <label className="flex items-center gap-2 text-[10px] text-slate-600">
                  Format
                  <select
                    value={compressionFormat}
                    onChange={(event) => setCompressionFormat(event.target.value)}
                    className="rounded-lg border border-stone-200 bg-white px-2.5 py-1.5 text-[10px] font-semibold text-slate-800"
                  >
                    <option value="image/webp">WebP (Recommended)</option>
                  </select>
                </label>
              )}
            </div>
            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <div className="mb-3 flex justify-between text-xs">
                  <span className="font-semibold text-slate-800">
                    Target quality: <b className="text-[#8b6f4e]">{Math.round(compressionQuality * 100)}%</b>
                  </span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="100"
                  step="5"
                  value={Math.round(compressionQuality * 100)}
                  onChange={(event) => setCompressionQuality(Number(event.target.value) / 100)}
                  className="w-full accent-[#a58054] cursor-pointer"
                />
                <div className="mt-1 flex justify-between text-[10px] text-slate-400">
                  <span>10% (Smaller files)</span>
                  <span>50%</span>
                  <span>100% (Best quality)</span>
                </div>
              </div>
              <div>
                <p className="mb-2 text-[10px] font-semibold text-slate-700">Preset</p>
                <div className="grid grid-cols-3 overflow-hidden rounded-lg border border-stone-200">
                  {[
                    { label: 'Smaller files', quality: 0.5, detail: '~50% size' },
                    { label: 'Balanced', quality: 0.75, detail: '~70% quality' },
                    { label: 'Best quality', quality: 0.9, detail: '~90% quality' },
                  ].map((preset) => (
                    <button
                      type="button"
                      key={preset.label}
                      onClick={() => setCompressionQuality(preset.quality)}
                      className={`px-2 py-2 text-[10px] transition-colors cursor-pointer ${
                        Math.round(compressionQuality * 100) === Math.round(preset.quality * 100)
                          ? 'bg-[#f5eadc] font-bold text-[#704f2d]'
                          : 'bg-white text-slate-700 hover:bg-stone-50'
                      }`}
                    >
                      {preset.label}
                      <span className="block text-[9px] text-slate-400">{preset.detail}</span>
                    </button>
                  ))}
                </div>
                <p className="mt-2 text-[10px] text-slate-500">
                  <HiOutlineInformationCircle className="mr-1 inline h-3.5 w-3.5" />
                  Higher quality preserves fine jewelry sparkle while optimizing mobile download speed.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-2 border-t border-stone-100 bg-stone-50 px-4 py-3 sm:px-6 sm:py-4">
          <button
            type="button"
            onClick={handleCloseCompressionHub}
            className="w-full sm:w-auto rounded-xl border border-stone-300 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-stone-50 transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleApplyMediaCompression}
            disabled={compressingMedia || !selectedCompressionIds.length}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-[#a58054] px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-[#8b6f4e] disabled:cursor-not-allowed disabled:opacity-50 transition cursor-pointer"
          >
            {compressingMedia ? <HiOutlineRefresh className="h-4 w-4 animate-spin" /> : <HiOutlineCheck className="h-4 w-4" />}
            {compressingMedia ? 'Compressing media…' : 'Compress & apply'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
