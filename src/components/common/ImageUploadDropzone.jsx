/* eslint-disable react/prop-types */
import React, { useRef } from 'react';
import {
  HiOutlinePhotograph,
  HiOutlineEye,
  HiOutlineUpload,
  HiOutlineTrash,
} from 'react-icons/hi';
import { getMediaUrl } from '../../utils/imageUrl';
import { useImagePreview } from '../../contexts/ImagePreviewContext';

export default function ImageUploadDropzone({
  label,
  required = false,
  value = '',
  alt = 'Media Preview',
  heightClass = 'h-28 sm:h-32',
  onFileSelect,
  onChooseGallery,
  onRemove,
  uploading = false,
  uploadProgress = 0,
  disabled = false,
  chooseButtonText = 'Choose Media',
  accept = 'image/jpeg,image/png,image/webp,image/*,video/mp4,video/webm',
  className = '',
}) {
  const fileInputRef = useRef(null);
  const { openImagePreview } = useImagePreview();

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (disabled || uploading) return;
    const file = e.dataTransfer?.files?.[0];
    if (file && onFileSelect) {
      onFileSelect(file);
    }
  };

  const handleFileInputChange = (e) => {
    const file = e.target?.files?.[0];
    if (file && onFileSelect) {
      onFileSelect(file);
    }
    // reset input value so same file can be reselected if needed
    if (e.target) e.target.value = '';
  };

  const handlePreviewClick = (e) => {
    e?.stopPropagation?.();
    if (!value) return;
    openImagePreview(getMediaUrl(value), {
      title: label || alt || 'Image Preview',
    });
  };

  const isVideo = typeof value === 'string' && /\.(mp4|webm|mov|m4v)(?:[?#]|$)/i.test(value);

  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <label className="block text-xs font-semibold text-stone-700">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}

      {value ? (
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 p-3 bg-stone-50/80 border border-stone-200/90 rounded-2xl shadow-2xs">
          {/* ─── Compact Image Box with Click-to-Preview ─── */}
          <div
            onClick={handlePreviewClick}
            className="w-32 h-32 sm:w-36 sm:h-36 rounded-xl border border-stone-200 bg-stone-900 overflow-hidden relative group cursor-pointer shrink-0 shadow-2xs hover:border-[var(--theme-primary,#8b6f4e)] hover:shadow-md transition-all"
            title="Click to view full preview"
          >
            {isVideo ? (
              <video
                src={getMediaUrl(value)}
                className="w-full h-full object-cover"
                autoPlay
                loop
                muted
                playsInline
              />
            ) : (
              <img
                src={getMediaUrl(value)}
                alt={alt}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            )}

            {/* Hover overlay with Eye Icon */}
            <div className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white gap-1 pointer-events-none">
              <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-xs flex items-center justify-center shadow-xs">
                <HiOutlineEye className="w-4 h-4 text-white" />
              </div>
              <span className="text-[10px] font-semibold tracking-wide">Preview</span>
            </div>
          </div>

          {/* ─── Image Details & Action Controls ─── */}
          <div className="flex-1 min-w-0 space-y-2.5">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                <span className="text-xs font-bold text-stone-800 truncate">
                  {label || 'Image'} Uploaded
                </span>
              </div>
              <p className="text-[11px] text-stone-500 mt-0.5">
                Click the image box to open a high-resolution preview.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-0.5">
              {/* Full Preview Button */}
              <button
                type="button"
                onClick={handlePreviewClick}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-stone-200 bg-white hover:bg-stone-50 text-xs font-semibold text-stone-700 hover:text-stone-900 shadow-2xs transition-colors cursor-pointer"
              >
                <HiOutlineEye className="w-3.5 h-3.5 text-stone-500" />
                <span>View Full Size</span>
              </button>

              {/* Choose from Media Gallery */}
              {onChooseGallery && (
                <button
                  type="button"
                  onClick={onChooseGallery}
                  style={{ backgroundColor: 'var(--theme-primary, #8a6d4b)' }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-white text-xs font-semibold hover:opacity-90 shadow-2xs transition-opacity cursor-pointer"
                >
                  <HiOutlinePhotograph className="w-3.5 h-3.5" />
                  <span>{chooseButtonText}</span>
                </button>
              )}

              {/* Replace / Upload New File */}
              {onFileSelect && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-stone-200 bg-white hover:bg-stone-50 text-xs font-semibold text-stone-700 hover:text-stone-900 shadow-2xs transition-colors cursor-pointer"
                >
                  <HiOutlineUpload className="w-3.5 h-3.5 text-stone-500" />
                  <span>Replace</span>
                </button>
              )}

              {/* Remove Image */}
              {onRemove && (
                <button
                  type="button"
                  onClick={onRemove}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-200 bg-red-50 hover:bg-red-100 text-xs font-semibold text-red-700 shadow-2xs transition-colors cursor-pointer"
                >
                  <HiOutlineTrash className="w-3.5 h-3.5" />
                  <span>Remove</span>
                </button>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          className={`border-2 border-dashed border-stone-300 hover:border-[var(--theme-primary,#8b6f4e)] bg-white hover:bg-[#f6faf9]/60 rounded-xl p-3 text-center transition-all ${heightClass} flex flex-col items-center justify-center group shadow-2xs ${
            disabled ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {uploading ? (
            <div className="space-y-1.5">
              <div
                className="w-5 h-5 border-2 border-stone-300 rounded-full animate-spin mx-auto"
                style={{ borderTopColor: 'var(--theme-primary, #8b6f4e)' }}
              />
              <p className="text-[11px] text-stone-500 font-medium">
                Uploading... {uploadProgress ? `${uploadProgress}%` : ''}
              </p>
            </div>
          ) : (
            <>
              <div
                onClick={() => !disabled && fileInputRef.current?.click()}
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-[#ecf7f7] border border-[#cbebeb] flex items-center justify-center text-[#1c7878] group-hover:scale-105 mb-1 transition-transform cursor-pointer shadow-2xs"
              >
                <HiOutlinePhotograph className="w-4 h-4 stroke-[1.8]" />
              </div>
              <p
                onClick={() => !disabled && fileInputRef.current?.click()}
                className="text-[11px] sm:text-xs font-semibold text-stone-800 cursor-pointer"
              >
                Click to upload <span className="font-normal text-stone-500">or drag and drop</span>
              </p>

              {onChooseGallery && (
                <button
                  type="button"
                  onClick={onChooseGallery}
                  className="mt-1.5 inline-flex items-center gap-1.5 px-3 py-1 rounded-lg border border-stone-300 bg-white hover:bg-stone-50 text-[11px] sm:text-xs font-semibold text-stone-700 shadow-2xs hover:border-[var(--theme-primary,#8b6f4e)] hover:text-[var(--theme-primary,#8b6f4e)] transition-all cursor-pointer"
                >
                  <HiOutlinePhotograph className="w-3.5 h-3.5" />
                  <span>{chooseButtonText}</span>
                </button>
              )}
            </>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept={accept}
            onChange={handleFileInputChange}
            className="hidden"
            disabled={disabled || uploading}
          />
        </div>
      )}
    </div>
  );
}
