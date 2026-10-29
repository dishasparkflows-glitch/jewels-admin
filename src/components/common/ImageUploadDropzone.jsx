/* eslint-disable react/prop-types */
import React, { useRef } from 'react';
import { HiOutlinePhotograph } from 'react-icons/hi';
import { getMediaUrl } from '../../utils/imageUrl';

export default function ImageUploadDropzone({
  label,
  required = false,
  value = '',
  alt = 'Image Preview',
  heightClass = 'h-28 sm:h-32',
  onFileSelect,
  onChooseGallery,
  onRemove,
  uploading = false,
  uploadProgress = 0,
  disabled = false,
  chooseButtonText = 'Choose Image',
  accept = 'image/jpeg,image/png,image/webp,image/*',
  className = '',
}) {
  const fileInputRef = useRef(null);

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

  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <label className="block text-xs font-semibold text-stone-700">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}

      {value ? (
        <div
          className={`relative rounded-xl border border-stone-200 overflow-hidden bg-stone-900 ${heightClass} group shadow-2xs`}
        >
          <img
            src={getMediaUrl(value)}
            alt={alt}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-2">
            {onChooseGallery && (
              <button
                type="button"
                onClick={onChooseGallery}
                style={{ backgroundColor: 'var(--theme-primary, #8a6d4b)' }}
                className="px-3 py-1.5 rounded-lg text-white text-xs font-semibold hover:opacity-90 transition-opacity cursor-pointer shadow-2xs"
              >
                {chooseButtonText}
              </button>
            )}
            {onRemove && (
              <button
                type="button"
                onClick={onRemove}
                className="px-3 py-1.5 rounded-lg bg-red-700 text-white text-xs font-semibold hover:bg-red-800 shadow-xs shadow-red-900/20 transition-colors cursor-pointer shadow-2xs"
              >
                Remove
              </button>
            )}
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
                Uploading & compressing... {uploadProgress}%
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

