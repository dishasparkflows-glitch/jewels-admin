import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  HiOutlinePhotograph,
  HiOutlineUpload,
  HiOutlineRefresh,
  HiOutlineEye,
  HiOutlineSparkles,
  HiOutlineArrowsExpand,
  HiOutlineCheck,
} from 'react-icons/hi';
import { compressImage, formatFileSize } from '../../utils/imageCompressor';

const QUALITY_PRESETS = [
  { value: 60, label: '60% Max Compression', tag: 'Smallest' },
  { value: 70, label: '70% High Savings', tag: 'Fast' },
  { value: 80, label: '80% Balanced', tag: 'Standard' },
  { value: 82, label: '82% Recommended', tag: 'Optimal', isDefault: true },
  { value: 90, label: '90% High Clarity', tag: 'Sharp' },
  { value: 95, label: '95% Ultra Fidelity', tag: 'Max' },
];

const DEFAULT_DEMO_URL = '/featured/raw_5mb_jewelry.jpg';

export default function ImageCompressionDemo({
  quality = 82,
  format = 'image/webp',
  enabled = true,
  onQualityChange,
}) {
  const [sourceFile, setSourceFile] = useState(null);
  const [originalStats, setOriginalStats] = useState({
    width: 5120,
    height: 2858,
    size: 4948396,
    url: DEFAULT_DEMO_URL,
    name: '5.0 MB Raw Jewelry Photo',
  });
  const [compressedStats, setCompressedStats] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);

  const originalUrlRef = useRef(null);
  const compressedUrlRef = useRef(null);
  const debounceTimerRef = useRef(null);

  // Helper to load the 5MB raw demo image as File/Blob
  const loadDemoFile = useCallback(async () => {
    try {
      const res = await fetch(DEFAULT_DEMO_URL);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      return new File([blob], 'raw_5mb_jewelry.jpg', { type: blob.type || 'image/jpeg' });
    } catch {
      // Fallback: draw image to canvas if direct fetch is blocked
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = img.naturalWidth || 5120;
          canvas.height = img.naturalHeight || 2858;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0);
          canvas.toBlob((blob) => {
            if (blob) {
              resolve(new File([blob], 'raw_5mb_jewelry.jpg', { type: 'image/jpeg' }));
            } else {
              reject(new Error('Canvas export failed'));
            }
          }, 'image/jpeg', 0.98);
        };
        img.onerror = reject;
        img.src = DEFAULT_DEMO_URL;
      });
    }
  }, []);

  // Load the 5MB demo file on mount
  useEffect(() => {
    let isCancelled = false;
    setIsProcessing(true);

    loadDemoFile()
      .then((file) => {
        if (!isCancelled) {
          setSourceFile(file);
        }
      })
      .catch((err) => {
        console.error('Failed to load demo image:', err);
      })
      .finally(() => {
        if (!isCancelled) setIsProcessing(false);
      });

    return () => {
      isCancelled = true;
    };
  }, [loadDemoFile]);

  // Update original stats and original preview URL
  useEffect(() => {
    if (!sourceFile) return;

    if (originalUrlRef.current) {
      URL.revokeObjectURL(originalUrlRef.current);
    }

    const origUrl = URL.createObjectURL(sourceFile);
    originalUrlRef.current = origUrl;

    const img = new Image();
    img.onload = () => {
      setOriginalStats({
        width: img.naturalWidth || 5120,
        height: img.naturalHeight || 2858,
        size: sourceFile.size,
        url: origUrl,
        name: '5.0 MB Raw Jewelry Photo',
      });
    };
    img.onerror = () => {
      setOriginalStats({
        width: 5120,
        height: 2858,
        size: sourceFile.size,
        url: origUrl,
        name: '5.0 MB Raw Jewelry Photo',
      });
    };
    img.src = origUrl;

    return () => {
      if (originalUrlRef.current) {
        URL.revokeObjectURL(originalUrlRef.current);
        originalUrlRef.current = null;
      }
    };
  }, [sourceFile]);

  // Run live compression with slight debounce whenever quality, format or source file changes
  useEffect(() => {
    if (!sourceFile) return;

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    setIsProcessing(true);

    debounceTimerRef.current = setTimeout(async () => {
      try {
        const qualityFraction = Math.min(Math.max(Number(quality) / 100, 0.05), 1.0);
        const result = await compressImage(sourceFile, {
          quality: qualityFraction,
          mimeType: format,
          maxWidth: 2400,
          maxHeight: 2400,
        });

        if (compressedUrlRef.current) {
          URL.revokeObjectURL(compressedUrlRef.current);
        }
        compressedUrlRef.current = result.previewUrl;

        setCompressedStats({
          url: result.previewUrl,
          size: result.size,
          width: result.width,
          height: result.height,
          savingsPercent: result.savingsPercent,
          savingsBytes: result.savingsBytes,
          format: format === 'image/webp' ? 'WebP' : 'JPEG',
        });
      } catch (err) {
        console.error('Demo compression failed:', err);
      } finally {
        setIsProcessing(false);
      }
    }, 80);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [sourceFile, quality, format]);

  // Clean up compressed preview URL on unmount
  useEffect(() => {
    return () => {
      if (compressedUrlRef.current) {
        URL.revokeObjectURL(compressedUrlRef.current);
      }
      if (originalUrlRef.current) {
        URL.revokeObjectURL(originalUrlRef.current);
      }
    };
  }, []);

  // Recommendation status text
  const getQualityGuidance = () => {
    if (quality <= 65) {
      return {
        tone: 'text-amber-800 bg-amber-50 border-amber-200',
        title: '⚡ 60% Maximum Compression (Smallest Files)',
        desc: 'Maximum reduction (~95% to 98% bandwidth savings). Ideal for ultra-fast storefront loading on mobile networks with minimal detail loss.',
      };
    }
    if (quality < 75) {
      return {
        tone: 'text-blue-800 bg-blue-50 border-blue-200',
        title: '🚀 70% High Savings (Fast)',
        desc: 'Significant size reduction (~90% to 94% saved). Clean product detail with great performance.',
      };
    }
    if (quality <= 85) {
      return {
        tone: 'text-emerald-800 bg-emerald-50 border-emerald-200',
        title: '✨ Recommended Sweet Spot for Fine Jewelry (75% - 85%)',
        desc: 'Optimal balance: Flawless diamond sparkle, crisp gold bevels, and ~85% to 92% bandwidth savings for fast storefront loading.',
      };
    }
    return {
      tone: 'text-stone-700 bg-stone-100 border-stone-200',
      title: 'Near-lossless clarity (Higher file size)',
      desc: 'Retains every micro-detail and gem reflection. Produces larger files which may slightly increase catalog loading times on mobile networks.',
    };
  };

  const guidance = getQualityGuidance();
  const originalUrl = originalStats?.url || DEFAULT_DEMO_URL;
  const compressedUrl = compressedStats?.url;

  return (
    <div className="mt-4 rounded-xl border border-stone-200 bg-[#fdfcfb] p-3.5 sm:p-4 transition-all">
      {/* Top Header / Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-stone-200/80 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#8f6d43]/15 text-[#8f6d43]">
              <HiOutlineEye className="h-3.5 w-3.5" />
            </span>
            <h3 className="text-xs font-bold text-stone-900 tracking-tight">
              Live Image Quality & Clarity Preview
            </h3>
            {isProcessing && (
              <span className="inline-flex items-center gap-1 rounded-full bg-stone-100 px-2 py-0.5 text-[10px] font-medium text-stone-600 animate-pulse">
                <HiOutlineRefresh className="h-3 w-3 animate-spin text-[#8f6d43]" />
                Encoding...
              </span>
            )}
          </div>
          <p className="mt-0.5 text-[11px] text-stone-500">
            Real-time side-by-side comparison using a <span className="font-semibold text-stone-700">5.0 MB</span> raw jewelry photo at <span className="font-semibold text-[#8f6d43]">{quality}%</span> quality.
          </p>
        </div>

        {/* 5MB Demo Badge & Zoom */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 rounded-lg border border-[#8f6d43]/30 bg-[#faf6f0] px-2.5 py-1 text-xs font-semibold text-[#8f6d43]">
            <span>📸</span>
            <span>5.0 MB Demo Image</span>
          </div>

          <button
            type="button"
            onClick={() => setIsZoomed((prev) => !prev)}
            className={`flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-semibold transition-all ${
              isZoomed
                ? 'border-[#8f6d43] bg-[#8f6d43]/10 text-[#8f6d43]'
                : 'border-stone-200 bg-white text-stone-600 hover:bg-stone-50'
            }`}
            title="Inspect diamond facets and metal sheen at 2x zoom"
          >
            <HiOutlineArrowsExpand className="h-3.5 w-3.5" />
            <span>{isZoomed ? '1x Normal' : '2x Detail Zoom'}</span>
          </button>
        </div>
      </div>

      {/* Metrics & Savings Strip */}
      <div className="my-3 grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
        <div className="rounded-lg border border-stone-200/90 bg-white p-2.5">
          <span className="block text-[10px] font-semibold uppercase tracking-wider text-stone-400">Original Size</span>
          <div className="mt-0.5 flex items-baseline gap-1">
            <span className="text-sm font-bold text-stone-800">
              {originalStats ? formatFileSize(originalStats.size) : '4.95 MB'}
            </span>
            <span className="text-[10px] text-stone-400">source</span>
          </div>
        </div>

        <div className="rounded-lg border border-stone-200/90 bg-white p-2.5">
          <span className="block text-[10px] font-semibold uppercase tracking-wider text-stone-400">
            {format === 'image/webp' ? 'WebP' : 'JPEG'} Output (@{quality}%)
          </span>
          <div className="mt-0.5 flex items-baseline gap-1">
            <span className="text-sm font-bold text-[#8f6d43]">
              {compressedStats ? formatFileSize(compressedStats.size) : '…'}
            </span>
            <span className="text-[10px] text-stone-400">compressed</span>
          </div>
        </div>

        <div className="rounded-lg border border-emerald-200/80 bg-emerald-50/60 p-2.5">
          <span className="block text-[10px] font-semibold uppercase tracking-wider text-emerald-700">Storage & Bandwidth Saved</span>
          <div className="mt-0.5 flex items-baseline gap-1">
            <span className="text-sm font-extrabold text-emerald-700">
              {compressedStats?.savingsPercent ? `-${compressedStats.savingsPercent}%` : '0%'}
            </span>
            {compressedStats?.savingsBytes > 0 && (
              <span className="text-[10px] text-emerald-600">
                ({formatFileSize(compressedStats.savingsBytes)})
              </span>
            )}
          </div>
        </div>

        <div className="rounded-lg border border-stone-200/90 bg-white p-2.5">
          <span className="block text-[10px] font-semibold uppercase tracking-wider text-stone-400">Resolution</span>
          <div className="mt-0.5 flex items-baseline gap-1">
            <span className="text-sm font-bold text-stone-800">
              {originalStats?.width ? `${originalStats.width} × ${originalStats.height}px` : '5120 × 2858px'}
            </span>
          </div>
        </div>
      </div>

      {/* Side-by-Side Comparison Container */}
      <div className="relative overflow-hidden rounded-xl border border-stone-200/90 bg-white select-none">
        {/* Disabled Compression Notification if enabled === false */}
        {!enabled && (
          <div className="bg-amber-500/95 py-1 text-center text-xs font-semibold text-white shadow-xs">
            Automatic compression is turned OFF. Images will be stored at original file size.
          </div>
        )}

        <div className="grid grid-cols-1 divide-y divide-stone-200 md:grid-cols-2 md:divide-y-0 md:divide-x">
          {/* Left: Original Photo */}
          <div className="p-3 bg-white flex flex-col">
            <div className="mb-2 flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-stone-800">Original Photo</span>
                <span className="rounded-md bg-stone-100 px-2 py-0.5 text-[10px] font-semibold text-stone-600">
                  5.0 MB Raw Image
                </span>
              </div>
              <span className="rounded bg-stone-100 px-2 py-0.5 text-[11px] font-bold text-stone-700">
                {originalStats ? formatFileSize(originalStats.size) : '4.95 MB'}
              </span>
            </div>
            <div className="relative h-64 sm:h-80 md:h-96 w-full overflow-hidden rounded-lg bg-stone-50 flex items-center justify-center border border-stone-100">
              <div
                className={`h-full w-full flex items-center justify-center transition-transform duration-200 ${
                  isZoomed ? 'scale-200 cursor-zoom-out' : 'scale-100 cursor-zoom-in'
                }`}
                onClick={() => setIsZoomed((prev) => !prev)}
              >
                <img
                  src={originalUrl}
                  alt="Original 5MB jewelry demo"
                  className="h-full w-full object-contain pointer-events-none"
                  onError={(e) => {
                    if (e.target.src !== DEFAULT_DEMO_URL) {
                      e.target.src = DEFAULT_DEMO_URL;
                    }
                  }}
                />
              </div>
              <div className="pointer-events-none absolute bottom-2 left-2 rounded-md bg-stone-900/70 px-2 py-0.5 text-[10px] font-medium text-white/90 backdrop-blur-xs">
                Original Photo (Uncompressed)
              </div>
            </div>
          </div>

          {/* Right: Optimized Photo */}
          <div className="p-3 bg-white flex flex-col">
            <div className="mb-2 flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-[#8f6d43]">
                  Optimized ({format === 'image/webp' ? 'WebP' : 'JPEG'} @ {quality}%)
                </span>
              </div>
              <span className="rounded bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-800">
                {compressedStats ? formatFileSize(compressedStats.size) : '…'}
                {compressedStats?.savingsPercent ? ` (-${compressedStats.savingsPercent}%)` : ''}
              </span>
            </div>
            <div className="relative h-64 sm:h-80 md:h-96 w-full overflow-hidden rounded-lg bg-stone-50 flex items-center justify-center border border-stone-100">
              <div
                className={`h-full w-full flex items-center justify-center transition-transform duration-200 ${
                  isZoomed ? 'scale-200 cursor-zoom-out' : 'scale-100 cursor-zoom-in'
                }`}
                onClick={() => setIsZoomed((prev) => !prev)}
              >
                {compressedUrl ? (
                  <img
                    src={compressedUrl}
                    alt="Optimized jewelry preview"
                    className="h-full w-full object-contain pointer-events-none"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center gap-2 text-stone-400">
                    <HiOutlineRefresh className="h-6 w-6 animate-spin text-[#8f6d43]" />
                    <span className="text-xs font-medium">Compressing demo photo...</span>
                  </div>
                )}
              </div>
              <div className="pointer-events-none absolute bottom-2 right-2 rounded-md bg-emerald-900/80 px-2 py-0.5 text-[10px] font-semibold text-emerald-100 backdrop-blur-xs">
                {compressedStats?.savingsBytes > 0
                  ? `${formatFileSize(compressedStats.savingsBytes)} saved per image`
                  : 'Optimized Output'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Quality Preset Buttons */}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-stone-200/80 pt-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] font-semibold text-stone-600 mr-1">Quick Presets:</span>
          {QUALITY_PRESETS.map((preset) => {
            const isActive = Number(quality) === preset.value;
            return (
              <button
                key={preset.value}
                type="button"
                onClick={() => onQualityChange && onQualityChange(preset.value)}
                className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-[#8f6d43] text-white shadow-xs'
                    : 'bg-white text-stone-700 border border-stone-200 hover:border-[#8f6d43]/50 hover:bg-[#faf6f0]'
                }`}
              >
                {isActive && <HiOutlineCheck className="h-3 w-3" />}
                <span>{preset.label}</span>
              </button>
            );
          })}
        </div>

        {/* Guidance Alert */}
        <div className={`w-full rounded-lg border px-3 py-2 text-xs transition-all ${guidance.tone}`}>
          <div className="flex items-start gap-1.5">
            <HiOutlineSparkles className="h-4 w-4 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold">{guidance.title}: </span>
              <span className="opacity-90">{guidance.desc}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
