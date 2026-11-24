import React from 'react';
import { createPortal } from 'react-dom';
import {
  HiOutlineX,
  HiOutlineCheck,
  HiOutlinePhotograph,
  HiOutlineVideoCamera,
  HiOutlineChevronLeft,
  HiOutlineChevronRight,
  HiOutlineEye,
} from 'react-icons/hi';
import { IoSparklesOutline } from 'react-icons/io5';
import { getMediaUrl } from '../../../utils/imageUrl';
import { useAddJewelryProductContext } from './AddJewelryProductContext';

export default function MediaUploadModals() {
  const {
    showUploadModal,
    handleCloseUploadModal,
    stagedUploadType,
    stagedUploadColor,
    isProcessingUpload,
    uploadProcessingStep,
    uploadProcessingPercent,
    stagedUploadFiles,
    totalStagedBytes,
    formatMediaSize,
    handleRemoveStagedFile,
    imageUploadPolicy,
    uploadCompressVideos,
    setUploadCompressVideos,
    handleConfirmStagedUpload,
    viewingCompressionMedia,
    setViewingCompressionMedia,
    mediaImages,
    mediaVideos,
    activeMediaColor,
    compressionTab,
    compressionPreviews,
    selectedCompressionIds,
    setSelectedCompressionIds,
    previewingCompression,
    handleOpenImagePreview,
  } = useAddJewelryProductContext();

  return (
    <>
      {/* ─── Staged Media Upload & Compression Modal ───────────── */}
      {showUploadModal &&
        createPortal(
          <div
            className="fixed inset-0 z-[75] flex items-center justify-center overflow-y-auto bg-slate-950/80 p-2 sm:p-4 md:p-6 backdrop-blur-sm cursor-pointer"
            onClick={handleCloseUploadModal}
          >
            <div
              className="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl sm:rounded-3xl border border-stone-200 bg-white shadow-2xl cursor-default"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3.5 sm:px-6 sm:py-4 border-b border-stone-100 bg-[#fdfcfb]">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-xl sm:rounded-2xl bg-gradient-to-br from-[#b38e63] to-[#8b6f4e] text-white shadow-xs">
                    <IoSparklesOutline className="h-5 w-5" />
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base sm:text-lg font-bold text-slate-900">
                        {stagedUploadType === 'silver-swatch'
                          ? 'Optimize & Upload Swatch Icon'
                          : 'Optimize & Upload Media'}
                      </h3>
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#f6eee2] text-[#8b6f4e] border border-[#dfcfbd]">
                        {stagedUploadColor || 'General'}
                        {stagedUploadType === 'silver-swatch' ? ' • Swatch Icon' : ''}
                      </span>
                    </div>
                    <p className="text-[11px] sm:text-xs text-slate-500">
                      Images follow the global compression policy from System Settings.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleCloseUploadModal}
                  disabled={isProcessingUpload}
                  className="flex h-9 w-9 items-center justify-center rounded-xl border border-stone-200 text-stone-600 hover:bg-stone-50 transition cursor-pointer disabled:opacity-40"
                  aria-label="Close upload modal"
                >
                  <HiOutlineX className="h-4 w-4" />
                </button>
              </div>

              {/* Progress Bar during processing */}
              {isProcessingUpload && (
                <div className="bg-[#faf5ee] border-b border-[#ebdccb] px-4 py-2.5 sm:px-6">
                  <div className="flex items-center justify-between text-xs font-semibold text-stone-700 mb-1.5">
                    <span className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#8b6f4e] animate-ping" />
                      {uploadProcessingStep || 'Processing upload...'}
                    </span>
                    <span className="text-[#8b6f4e] font-bold">{uploadProcessingPercent}%</span>
                  </div>
                  <div className="w-full bg-stone-200 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-[#b38e63] to-[#8b6f4e] h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProcessingPercent}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Modal Body */}
              <div className="flex-1 overflow-y-auto max-h-[calc(92vh-190px)] p-4 sm:p-6 space-y-6">
                {/* Staged Files Preview Grid */}
                <div>
                  <div className="flex items-center justify-between mb-2.5">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-stone-600">
                      Files Loaded in Memory ({stagedUploadFiles.length})
                    </h4>
                    <span className="text-xs font-semibold text-stone-500">
                      Raw Total: {formatMediaSize(totalStagedBytes)}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {stagedUploadFiles.map((item) => (
                      <div
                        key={item.id}
                        className="relative rounded-xl border border-stone-200 bg-stone-50 overflow-hidden group shadow-2xs flex flex-col"
                      >
                        {/* Media Preview */}
                        <div className="h-28 w-full bg-stone-100 flex items-center justify-center overflow-hidden relative">
                          {item.isVideo ? (
                            <video
                              src={item.previewUrl}
                              className="w-full h-full object-cover"
                              muted
                              playsInline
                            />
                          ) : (
                            <img
                              src={item.previewUrl}
                              alt={item.name}
                              className="w-full h-full object-cover"
                            />
                          )}

                          {/* Media Type Tag */}
                          <span className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-black/60 text-white backdrop-blur-xs">
                            {item.isVideo ? 'Video' : 'Image'}
                          </span>

                          {/* Status Indicator */}
                          {item.status === 'compressing' && (
                            <span className="absolute inset-0 bg-black/40 flex items-center justify-center text-white text-[10px] font-semibold animate-pulse">
                              Compressing...
                            </span>
                          )}
                          {item.status === 'uploading' && (
                            <span className="absolute inset-0 bg-blue-900/50 flex items-center justify-center text-white text-[10px] font-semibold animate-pulse">
                              Uploading R2...
                            </span>
                          )}
                          {item.status === 'done' && (
                            <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-600 text-white flex items-center gap-1 shadow-xs">
                              <HiOutlineCheck className="w-3 h-3" /> Done
                            </span>
                          )}

                          {!isProcessingUpload && (
                            <button
                              type="button"
                              onClick={() => handleRemoveStagedFile(item.id)}
                              className="absolute top-1.5 right-1.5 p-1 rounded-full bg-black/50 hover:bg-red-600 text-white opacity-80 hover:opacity-100 transition shadow-xs cursor-pointer"
                              title="Remove from upload batch"
                            >
                              <HiOutlineX className="w-3 h-3" />
                            </button>
                          )}
                        </div>

                        {/* File Meta */}
                        <div className="p-2 bg-white flex flex-col justify-between flex-1 border-t border-stone-100">
                          <p className="text-[11px] font-medium text-stone-800 truncate" title={item.name}>
                            {item.name}
                          </p>
                          <div className="flex items-center justify-between text-[10px] text-stone-500 mt-1">
                            <span>{item.formattedSize}</span>
                            <span className="text-[9.5px] uppercase text-stone-400 font-mono">
                              {item.file.name.split('.').pop()}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Global Image Compression Policy */}
                <div className="border border-[#ecd9c6] bg-[#fbf9f6] rounded-2xl p-4 sm:p-5 space-y-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-stone-800">
                        Automatic image compression
                      </h4>
                      <p className="mt-1 text-[11px] text-stone-600">
                        {imageUploadPolicy.enabled
                          ? `${imageUploadPolicy.format === 'image/webp' ? 'WebP' : 'JPEG'} at ${imageUploadPolicy.quality}% quality`
                          : 'Disabled in System Settings; images will upload at their original size.'}
                      </p>
                    </div>
                    <span className="shrink-0 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold text-emerald-700">
                      Set globally in Settings
                    </span>
                  </div>

                  {stagedUploadFiles.some((f) => f.isVideo) && (
                    <div className="flex items-center justify-between border-t border-[#ebdccb] pt-3">
                      <div>
                        <p className="text-xs font-bold text-stone-800">Encode videos to WebM VP9</p>
                        <p className="text-[10.5px] text-stone-500">Compress videos in the browser before upload.</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={uploadCompressVideos}
                          onChange={(e) => setUploadCompressVideos(e.target.checked)}
                          disabled={isProcessingUpload}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-stone-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#8b6f4e]" />
                      </label>
                    </div>
                  )}
                </div>

                {/* Upload behavior */}
                <p className="text-[11px] text-stone-500 text-center italic">
                  💡 Images use the saved global quality and dimension limit automatically. The original image is kept only when optimization would make it larger.
                </p>
              </div>

              {/* Footer Actions */}
              <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-3 px-4 py-3.5 sm:px-6 sm:py-4 border-t border-stone-200 bg-stone-50">
                <button
                  type="button"
                  disabled={isProcessingUpload}
                  onClick={handleCloseUploadModal}
                  className="w-full sm:w-auto px-4 py-2.5 text-xs font-semibold text-stone-600 hover:text-stone-900 hover:bg-stone-200/60 rounded-xl transition cursor-pointer disabled:opacity-40"
                >
                  Cancel &amp; Discard
                </button>

                <div className="w-full sm:w-auto flex items-center gap-2">
                  <button
                    type="button"
                    disabled={isProcessingUpload || stagedUploadFiles.length === 0}
                    onClick={handleConfirmStagedUpload}
                    className="flex-1 sm:flex-none px-5 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-[#b38e63] to-[#8b6f4e] hover:from-[#a07c52] hover:to-[#7a6042] rounded-xl shadow-md transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2 disabled:opacity-40"
                  >
                    <IoSparklesOutline className="w-4 h-4" />
                    <span>
                      {isProcessingUpload
                        ? 'Optimizing & Uploading...'
                        : `Upload to Cloudflare (${stagedUploadFiles.length})`}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* ─── Compression Media Detail Popup Modal ─────────────── */}
      {viewingCompressionMedia &&
        createPortal(
          <div
            className="fixed inset-0 z-[80] flex items-center justify-center bg-black/75 backdrop-blur-xs p-3 sm:p-6 animate-fadeIn"
            onClick={() => setViewingCompressionMedia(null)}
          >
            <div
              className={`relative flex flex-col max-h-[92vh] w-full ${
                viewingCompressionMedia.mediaType === 'video' ||
                viewingCompressionMedia.url?.match(/\.(mp4|webm|mov|m4v)/i)
                  ? 'max-w-3xl'
                  : 'max-w-2xl'
              } overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-2xl`}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              {(() => {
                const isVideo =
                  viewingCompressionMedia.mediaType === 'video' ||
                  viewingCompressionMedia.url?.match(/\.(mp4|webm|mov|m4v)/i);

                return (
                  <div className="flex items-center justify-between border-b border-stone-100 px-5 py-3.5 sm:px-6">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-[#faf5ee] text-[#8b6f4e] flex items-center justify-center shrink-0">
                        {isVideo ? <HiOutlineVideoCamera className="w-4 h-4" /> : <HiOutlinePhotograph className="w-4 h-4" />}
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-sm font-bold text-stone-900 truncate">
                          {viewingCompressionMedia.name ||
                            viewingCompressionMedia.title ||
                            (isVideo ? 'Product Video' : 'Product Image')}
                        </h4>
                        <p className="text-[10px] text-stone-400">
                          {isVideo
                            ? 'High-definition video inspection'
                            : 'Compression details and high-resolution inspection'}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setViewingCompressionMedia(null)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-stone-200 text-stone-500 hover:bg-stone-50 transition cursor-pointer"
                      aria-label="Close"
                    >
                      <HiOutlineX className="h-4 w-4" />
                    </button>
                  </div>
                );
              })()}

              {/* Main Image / Video View Area */}
              {(() => {
                const isVideo =
                  viewingCompressionMedia.mediaType === 'video' ||
                  viewingCompressionMedia.url?.match(/\.(mp4|webm|mov|m4v)/i);
                const mediaSrc = getMediaUrl(viewingCompressionMedia.url) || viewingCompressionMedia.url;

                return (
                  <div
                    className={`relative flex-1 bg-[#fdfcfb] p-4 flex flex-col items-center justify-center overflow-hidden ${
                      isVideo ? 'min-h-[320px] max-h-[75vh]' : 'min-h-[260px] max-h-[52vh]'
                    }`}
                  >
                    {isVideo ? (
                      <video
                        src={mediaSrc}
                        controls
                        autoPlay
                        muted
                        playsInline
                        className="max-h-[70vh] w-auto max-w-full rounded-xl shadow-xs"
                      />
                    ) : (
                      <img
                        src={mediaSrc}
                        alt={viewingCompressionMedia.name || 'Preview'}
                        className="max-h-[48vh] w-auto max-w-full object-contain rounded-xl shadow-xs"
                      />
                    )}

                    {/* Previous / Next Arrows */}
                    {(() => {
                      const allMediaItems = [
                        ...(mediaImages[activeMediaColor] || []).map((img) => ({ ...img, mediaType: 'image' })),
                        ...(mediaVideos[activeMediaColor] || []).map((vid) => ({ ...vid, mediaType: 'video' })),
                      ];
                      const list =
                        compressionTab === 'images'
                          ? allMediaItems.filter((m) => m.mediaType === 'image')
                          : compressionTab === 'videos'
                          ? allMediaItems.filter((m) => m.mediaType === 'video')
                          : allMediaItems;

                      const currentIndex = list.findIndex((item) => item.id === viewingCompressionMedia.id);
                      const hasPrev = currentIndex > 0;
                      const hasNext = currentIndex >= 0 && currentIndex < list.length - 1;

                      return (
                        <>
                          {hasPrev && (
                            <button
                              type="button"
                              onClick={() => setViewingCompressionMedia(list[currentIndex - 1])}
                              className="absolute left-3 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-stone-700 shadow-md border border-stone-200 hover:bg-white transition cursor-pointer"
                              title="Previous"
                            >
                              <HiOutlineChevronLeft className="w-4 h-4" />
                            </button>
                          )}
                          {hasNext && (
                            <button
                              type="button"
                              onClick={() => setViewingCompressionMedia(list[currentIndex + 1])}
                              className="absolute right-3 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-stone-700 shadow-md border border-stone-200 hover:bg-white transition cursor-pointer"
                              title="Next"
                            >
                              <HiOutlineChevronRight className="w-4 h-4" />
                            </button>
                          )}
                        </>
                      );
                    })()}
                  </div>
                );
              })()}

              {/* Stats Breakdown and Actions */}
              {(() => {
                const isVideo =
                  viewingCompressionMedia.mediaType === 'video' ||
                  viewingCompressionMedia.url?.match(/\.(mp4|webm|mov|m4v)/i);
                if (isVideo) return null;

                const preview = compressionPreviews[viewingCompressionMedia.id];
                const origSize = preview?.originalSize || viewingCompressionMedia.fileSize || 0;
                const compSize = preview?.compressedSize || 0;
                const savings =
                  origSize && compSize ? Math.max(0, Math.round((1 - compSize / origSize) * 100)) : 0;
                const isSelected = selectedCompressionIds.includes(viewingCompressionMedia.id);

                return (
                  <div className="border-t border-stone-100 bg-white p-4 sm:p-5 space-y-3">
                    <div className="grid grid-cols-3 gap-2.5 rounded-2xl bg-stone-50 p-3 border border-stone-100 text-center">
                      <div>
                        <span className="block text-[10px] font-semibold text-stone-400 uppercase tracking-wider">
                          Original Size
                        </span>
                        <strong className="text-xs sm:text-sm font-bold text-stone-800">
                          {origSize ? formatMediaSize(origSize) : viewingCompressionMedia.size || '—'}
                        </strong>
                      </div>
                      <div className="border-x border-stone-200 px-2">
                        <span className="block text-[10px] font-semibold text-stone-400 uppercase tracking-wider">
                          Compressed
                        </span>
                        <strong className="text-xs sm:text-sm font-bold text-emerald-600">
                          {compSize
                            ? formatMediaSize(compSize)
                            : isVideo
                            ? 'Direct asset'
                            : previewingCompression
                            ? 'Calculating…'
                            : 'Ready'}
                        </strong>
                      </div>
                      <div>
                        <span className="block text-[10px] font-semibold text-stone-400 uppercase tracking-wider">
                          Savings
                        </span>
                        <strong
                          className={`text-xs sm:text-sm font-bold ${
                            savings > 0 ? 'text-emerald-600' : 'text-stone-600'
                          }`}
                        >
                          {savings > 0 ? `~${savings}%` : 'Optimal'}
                        </strong>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-1 flex-wrap">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedCompressionIds((ids) =>
                            ids.includes(viewingCompressionMedia.id)
                              ? ids.filter((id) => id !== viewingCompressionMedia.id)
                              : [...ids, viewingCompressionMedia.id]
                          );
                        }}
                        className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                          isSelected
                            ? 'border-[#a58054] bg-[#faf5ee] text-[#8b6f4e]'
                            : 'border-stone-200 bg-white text-stone-600 hover:bg-stone-50'
                        }`}
                      >
                        <HiOutlineCheck
                          className={`w-4 h-4 ${isSelected ? 'text-[#8b6f4e]' : 'text-stone-400'}`}
                        />
                        <span>{isSelected ? 'Selected for compression' : 'Include in compression'}</span>
                      </button>

                      <div className="flex items-center gap-2">
                        {!isVideo && (
                          <button
                            type="button"
                            onClick={() => {
                              const allUrls = (mediaImages[activeMediaColor] || []).map((img) => img.url);
                              handleOpenImagePreview(viewingCompressionMedia.url, allUrls);
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-stone-700 bg-stone-100 hover:bg-stone-200 transition cursor-pointer"
                          >
                            <HiOutlineEye className="w-3.5 h-3.5" />
                            <span>Full Zoom</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setViewingCompressionMedia(null)}
                          className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#a58054] hover:bg-[#8b6f4e] transition cursor-pointer"
                        >
                          Done
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
