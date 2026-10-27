import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  HiOutlineX,
  HiOutlineCheck,
  HiOutlineSparkles,
  HiOutlinePhotograph,
  HiOutlineArrowsExpand,
  HiOutlineRefresh,
  HiOutlineUpload,
  HiOutlineEye,
} from 'react-icons/hi';
import { compressImage, formatFileSize, getImageDimensions } from '../../utils/imageCompressor';

export default function ImageCompressCompareModal({
  isOpen,
  file,
  onClose,
  onConfirm,
  moduleTitle = 'Image',
  defaultQuality = 0.82,
  defaultMaxDimension = 1920,
}) {
  // Compression Settings
  const [quality, setQuality] = useState(defaultQuality);
  const [maxDimension, setMaxDimension] = useState(defaultMaxDimension);
  const [format, setFormat] = useState('image/webp'); // 'image/webp' | 'image/jpeg' | 'image/png'

  // Comparison & State
  const [viewMode, setViewMode] = useState('sideBySide'); // 'sideBySide' | 'toggle'
  const [toggleActive, setToggleActive] = useState('compressed'); // 'original' | 'compressed'
  const [originalStats, setOriginalStats] = useState({ width: 0, height: 0, size: 0, previewUrl: '' });
  const [compressedStats, setCompressedStats] = useState(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const prevCompressedUrl = useRef(null);
  const prevOriginalUrl = useRef(null);

  // Initialize on file change
  useEffect(() => {
    if (!isOpen || !file) {
      if (prevCompressedUrl.current) URL.revokeObjectURL(prevCompressedUrl.current);
      if (prevOriginalUrl.current) URL.revokeObjectURL(prevOriginalUrl.current);
      prevCompressedUrl.current = null;
      prevOriginalUrl.current = null;
      setCompressedStats(null);
      return;
    }

    const origUrl = URL.createObjectURL(file);
    if (prevOriginalUrl.current) URL.revokeObjectURL(prevOriginalUrl.current);
    prevOriginalUrl.current = origUrl;

    getImageDimensions(file).then((dims) => {
      setOriginalStats({
        width: dims.width,
        height: dims.height,
        size: file.size,
        previewUrl: origUrl,
      });
    });

    // Default icon dimension recommendation if file is small or square-ish
    if (file.size < 200 * 1024) {
      setQuality(0.85);
    }
  }, [isOpen, file]);

  // Run compression whenever quality, maxDimension, or format changes
  useEffect(() => {
    if (!isOpen || !file) return;

    let isCancelled = false;
    setIsCompressing(true);

    const timer = setTimeout(async () => {
      try {
        const result = await compressImage(file, {
          quality,
          maxWidth: maxDimension === 'original' ? Infinity : Number(maxDimension),
          maxHeight: maxDimension === 'original' ? Infinity : Number(maxDimension),
          mimeType: format,
        });

        if (isCancelled) return;

        if (prevCompressedUrl.current) {
          URL.revokeObjectURL(prevCompressedUrl.current);
        }
        prevCompressedUrl.current = result.previewUrl;
        setCompressedStats(result);
      } catch (err) {
        console.error('Failed to compress image:', err);
      } finally {
        if (!isCancelled) setIsCompressing(false);
      }
    }, 120); // brief debounce for smooth slider feel

    return () => {
      isCancelled = true;
      clearTimeout(timer);
    };
  }, [isOpen, file, quality, maxDimension, format]);

  if (!isOpen || !file) return null;

  const handleConfirmCompressed = async () => {
    if (!compressedStats?.file || isUploading) return;
    try {
      setIsUploading(true);
      await onConfirm(compressedStats.file, true, compressedStats);
      onClose();
    } catch (err) {
      console.error('Upload failed:', err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleConfirmOriginal = async () => {
    if (isUploading) return;
    try {
      setIsUploading(true);
      await onConfirm(file, false, {
        size: file.size,
        originalSize: file.size,
        savingsPercent: 0,
        width: originalStats.width,
        height: originalStats.height,
      });
      onClose();
    } catch (err) {
      console.error('Upload failed:', err);
    } finally {
      setIsUploading(false);
    }
  };

  const savingsPercent = compressedStats?.savingsPercent ?? 0;
  const isActuallySmaller = compressedStats && compressedStats.size < originalStats.size;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-5 bg-stone-900/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={!isUploading ? onClose : undefined}
    >
      <div
        className="bg-white rounded-3xl max-w-4xl w-full p-5 sm:p-6 shadow-2xl border border-stone-200 space-y-4 max-h-[94vh] flex flex-col animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ─── 1. Header ─── */}
        <div className="flex items-center justify-between pb-3 border-b border-stone-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#faf5ed] border border-[#e8d8c0] flex items-center justify-center text-[#8b6f4e] shadow-2xs">
              <HiOutlineSparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-stone-900">Image Compression & Preview</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#faf5ed] text-[#8b6f4e] border border-[#e8d8c0]">
                  {moduleTitle}
                </span>
              </div>
              <p className="text-xs text-stone-500 mt-0.5">
                Compare original upload vs compressed version before final save.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isUploading}
            className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
          >
            <HiOutlineX className="w-5 h-5" />
          </button>
        </div>

        {/* ─── 2. Main Content (Scrollable) ─── */}
        <div className="overflow-y-auto space-y-4 pr-1 flex-1">
          {/* Controls Bar */}
          <div className="p-3.5 bg-stone-50/90 rounded-2xl border border-stone-200/80 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <span className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
                <HiOutlinePhotograph className="w-4 h-4 text-[#8b6f4e]" />
                <span>Compression Settings</span>
              </span>

              {/* View Mode Switcher */}
              <div className="flex items-center bg-stone-200/70 p-0.5 rounded-xl border border-stone-300/60 self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setViewMode('sideBySide')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    viewMode === 'sideBySide'
                      ? 'bg-white text-stone-900 shadow-2xs'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  Side by Side
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('toggle')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    viewMode === 'toggle'
                      ? 'bg-white text-stone-900 shadow-2xs'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  Quick Flip
                </button>
              </div>
            </div>

            {/* Sliders & Option Selectors */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              {/* Quality Slider */}
              <div className="space-y-1">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-stone-700">Quality</span>
                  <span className="font-bold text-[#8b6f4e] font-mono">{Math.round(quality * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0.2"
                  max="1"
                  step="0.05"
                  value={quality}
                  disabled={format === 'image/png'}
                  onChange={(e) => setQuality(parseFloat(e.target.value))}
                  className="w-full accent-[#8b6f4e] cursor-pointer disabled:opacity-40"
                />
                <div className="flex justify-between text-[10px] text-stone-400">
                  <span>Small File</span>
                  <span>Optimal (80%)</span>
                  <span>Max (100%)</span>
                </div>
              </div>

              {/* Max Dimension */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-stone-700 block">Max Resolution</label>
                <select
                  value={maxDimension}
                  onChange={(e) => setMaxDimension(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-stone-200 rounded-xl text-stone-800 font-medium focus:outline-none focus:border-[#8b6f4e]"
                >
                  <option value="original">Original (No Resize)</option>
                  <option value="1920">1920px (Full HD Banner)</option>
                  <option value="1200">1200px (Content / Card)</option>
                  <option value="800">800px (Icon / Thumbnail)</option>
                  <option value="500">500px (Compact)</option>
                </select>
                <span className="text-[10px] text-stone-400 block truncate">
                  Preserves aspect ratio
                </span>
              </div>

              {/* Output Format */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-stone-700 block">Output Format</label>
                <select
                  value={format}
                  onChange={(e) => setFormat(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-stone-200 rounded-xl text-stone-800 font-medium focus:outline-none focus:border-[#8b6f4e]"
                >
                  <option value="image/webp">WebP (Recommended - Smallest)</option>
                  <option value="image/jpeg">JPEG (Universal)</option>
                  <option value="image/png">PNG (Lossless / Transparent)</option>
                </select>
                <span className="text-[10px] text-stone-400 block truncate">
                  {format === 'image/webp' ? 'Preserves transparency' : format === 'image/png' ? 'Full PNG quality' : 'White background'}
                </span>
              </div>
            </div>
          </div>

          {/* ─── 3. Comparison View ─── */}
          {viewMode === 'sideBySide' ? (
            /* Side-by-Side View */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Original Card */}
              <div className="bg-stone-50/60 border border-stone-200 rounded-2xl p-3.5 space-y-2.5 flex flex-col justify-between shadow-2xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-stone-400" />
                    <span className="text-xs font-bold text-stone-800 uppercase tracking-wide">Original Upload</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-md text-[11px] font-mono font-bold bg-stone-200 text-stone-700">
                    {formatFileSize(originalStats.size)}
                  </span>
                </div>

                <div className="h-56 w-full rounded-xl border border-stone-200 bg-white overflow-hidden flex items-center justify-center p-2 relative group bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:12px_12px]">
                  {originalStats.previewUrl ? (
                    <img
                      src={originalStats.previewUrl}
                      alt="Original"
                      className="max-h-full max-w-full object-contain"
                    />
                  ) : (
                    <div className="text-stone-300 text-xs">Loading original...</div>
                  )}
                </div>

                <div className="text-[11px] text-stone-500 flex justify-between items-center pt-1 border-t border-stone-200/60 font-mono">
                  <span className="truncate max-w-[160px]" title={file.name}>{file.name}</span>
                  <span>{originalStats.width ? `${originalStats.width} × ${originalStats.height} px` : '—'}</span>
                </div>
              </div>

              {/* Compressed Card */}
              <div className={`border rounded-2xl p-3.5 space-y-2.5 flex flex-col justify-between shadow-2xs transition-all ${
                isActuallySmaller ? 'bg-[#faf7f2]/70 border-[#e8d8c0]' : 'bg-stone-50/60 border-stone-200'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xs font-bold text-stone-900 uppercase tracking-wide">
                      Compressed Preview
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {isActuallySmaller && (
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200">
                        -{savingsPercent}%
                      </span>
                    )}
                    <span className="px-2 py-0.5 rounded-md text-[11px] font-mono font-bold bg-[#8b6f4e]/10 text-[#8b6f4e]">
                      {compressedStats ? formatFileSize(compressedStats.size) : '...'}
                    </span>
                  </div>
                </div>

                <div className="h-56 w-full rounded-xl border border-stone-200 bg-white overflow-hidden flex items-center justify-center p-2 relative group bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:12px_12px]">
                  {isCompressing ? (
                    <div className="flex flex-col items-center gap-2 text-stone-400">
                      <HiOutlineRefresh className="w-6 h-6 animate-spin text-[#8b6f4e]" />
                      <span className="text-xs font-semibold">Optimizing image...</span>
                    </div>
                  ) : compressedStats?.previewUrl ? (
                    <img
                      src={compressedStats.previewUrl}
                      alt="Compressed"
                      className="max-h-full max-w-full object-contain"
                    />
                  ) : (
                    <div className="text-stone-300 text-xs">Generating preview...</div>
                  )}
                </div>

                <div className="text-[11px] text-stone-600 flex justify-between items-center pt-1 border-t border-stone-200/60 font-mono">
                  <span className="truncate max-w-[160px] text-[#8b6f4e] font-semibold">
                    {compressedStats?.file?.name || 'compressed.webp'}
                  </span>
                  <span>
                    {compressedStats?.width ? `${compressedStats.width} × ${compressedStats.height} px` : '—'}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            /* Toggle / Flip View */
            <div className="bg-stone-50 border border-stone-200 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-stone-800">Showing:</span>
                  <div className="inline-flex rounded-xl bg-stone-200 p-0.5 border border-stone-300">
                    <button
                      type="button"
                      onClick={() => setToggleActive('original')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        toggleActive === 'original'
                          ? 'bg-white text-stone-900 shadow-2xs'
                          : 'text-stone-600 hover:text-stone-900'
                      }`}
                    >
                      Original ({formatFileSize(originalStats.size)})
                    </button>
                    <button
                      type="button"
                      onClick={() => setToggleActive('compressed')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                        toggleActive === 'compressed'
                          ? 'bg-[#8b6f4e] text-white shadow-2xs'
                          : 'text-stone-600 hover:text-stone-900'
                      }`}
                    >
                      <span>Compressed ({compressedStats ? formatFileSize(compressedStats.size) : '...'})</span>
                      {isActuallySmaller && (
                        <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-emerald-500 text-white font-extrabold">
                          -{savingsPercent}%
                        </span>
                      )}
                    </button>
                  </div>
                </div>

                <span className="text-[11px] font-mono text-stone-500">
                  {toggleActive === 'original'
                    ? `${originalStats.width} × ${originalStats.height} px`
                    : `${compressedStats?.width || 0} × ${compressedStats?.height || 0} px`}
                </span>
              </div>

              <div className="h-72 w-full rounded-2xl border border-stone-200 bg-white overflow-hidden flex items-center justify-center p-3 relative bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:12px_12px]">
                {toggleActive === 'original' ? (
                  <img
                    src={originalStats.previewUrl}
                    alt="Original"
                    className="max-h-full max-w-full object-contain"
                  />
                ) : isCompressing ? (
                  <div className="flex flex-col items-center gap-2 text-stone-400">
                    <HiOutlineRefresh className="w-6 h-6 animate-spin text-[#8b6f4e]" />
                    <span className="text-xs font-semibold">Updating compression...</span>
                  </div>
                ) : (
                  <img
                    src={compressedStats?.previewUrl}
                    alt="Compressed"
                    className="max-h-full max-w-full object-contain"
                  />
                )}
              </div>
            </div>
          )}

          {/* Savings Highlight Box */}
          {compressedStats && isActuallySmaller ? (
            <div className="p-3 bg-emerald-50/80 border border-emerald-200 rounded-2xl flex items-center justify-between text-xs text-emerald-900">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 font-bold">
                  ✓
                </span>
                <span>
                  <strong>Great optimization!</strong> File size reduced from{' '}
                  <span className="font-mono font-bold">{formatFileSize(originalStats.size)}</span> down to{' '}
                  <span className="font-mono font-bold text-emerald-700">{formatFileSize(compressedStats.size)}</span>.
                </span>
              </div>
              <span className="font-bold font-mono px-2.5 py-1 bg-white rounded-xl border border-emerald-200 text-emerald-700 shrink-0 shadow-2xs">
                Saved {formatFileSize(compressedStats.savingsBytes)} (-{savingsPercent}%)
              </span>
            </div>
          ) : compressedStats ? (
            <div className="p-2.5 bg-stone-100 border border-stone-200 rounded-2xl text-xs text-stone-600 flex items-center justify-between">
              <span>Original image is already small. Compression offers minimal difference.</span>
              <span className="font-semibold text-stone-500 font-mono">Size: {formatFileSize(originalStats.size)}</span>
            </div>
          ) : null}
        </div>

        {/* ─── 4. Footer Actions ─── */}
        <div className="pt-3 border-t border-stone-100 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={isUploading}
            className="w-full sm:w-auto px-4 py-2 text-xs font-semibold text-stone-600 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 rounded-xl transition-all cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            {/* Upload Original Option */}
            <button
              type="button"
              onClick={handleConfirmOriginal}
              disabled={isUploading}
              className="px-4 py-2 text-xs font-semibold text-stone-700 bg-white border border-stone-300 hover:border-stone-400 hover:bg-stone-50 rounded-xl transition-all shadow-2xs cursor-pointer disabled:opacity-50"
            >
              Upload Original ({formatFileSize(originalStats.size)})
            </button>

            {/* Upload Compressed (Primary) */}
            <button
              type="button"
              onClick={handleConfirmCompressed}
              disabled={isUploading || isCompressing || !compressedStats}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-5 py-2 text-xs font-bold text-white bg-[#8b6f4e] hover:bg-[#785e40] active:scale-[0.98] rounded-xl transition-all shadow-sm cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
            >
              {isUploading ? (
                <>
                  <HiOutlineRefresh className="w-4 h-4 animate-spin" />
                  <span>Uploading to R2...</span>
                </>
              ) : (
                <>
                  <HiOutlineUpload className="w-4 h-4" />
                  <span>
                    Upload Compressed {isActuallySmaller ? `(Save ${savingsPercent}%)` : ''}
                  </span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
