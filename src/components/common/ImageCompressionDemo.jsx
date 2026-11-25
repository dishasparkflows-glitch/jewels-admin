import { useState, useEffect, useRef, useCallback } from 'react';
import {
  HiOutlineRefresh,
  HiOutlineEye,
  HiOutlineUpload,
  HiOutlineX,
} from 'react-icons/hi';
import { compressImage, formatFileSize } from '../../utils/imageCompression';
import { useImagePreview } from '../../contexts/ImagePreviewContext';

const STORAGE_KEY = 'neirah_compression_test_image';
const DEFAULT_DEMO_PATH = '/demo-jewelry/diamond-ring.jpg';

// Helper to convert base64 dataUrl back to a File
function dataUrlToFile(dataUrl, filename, mimeType) {
  try {
    const arr = dataUrl.split(',');
    const mime = mimeType || arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename || 'custom_test.jpg', { type: mime });
  } catch (err) {
    console.error('Failed to convert dataUrl to File:', err);
    return null;
  }
}

// Fallback generator in case network/file fetch fails
function createFallbackCanvasFile() {
  const canvas = document.createElement('canvas');
  canvas.width = 1200;
  canvas.height = 800;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#1c1917';
    ctx.fillRect(0, 0, 1200, 800);
    ctx.fillStyle = '#8f6d43';
    ctx.font = 'bold 36px serif';
    ctx.textAlign = 'center';
    ctx.fillText('Neirah Luxury Jewelry Sample', 600, 400);
  }
  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      resolve(new File([blob], 'demo_fallback.jpg', { type: 'image/jpeg' }));
    }, 'image/jpeg', 0.9);
  });
}

export default function ImageCompressionDemo({
  quality = 82,
  format = 'image/webp',
  enabled = true,
}) {
  const [activePreset, setActivePreset] = useState('ring');
  const [customFileMeta, setCustomFileMeta] = useState(null);
  const [sourceFile, setSourceFile] = useState(null);
  const [originalStats, setOriginalStats] = useState(null);
  const [compressedStats, setCompressedStats] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const { openImagePreview } = useImagePreview();
  const fileInputRef = useRef(null);
  const originalUrlRef = useRef(null);
  const compressedUrlRef = useRef(null);
  const debounceTimerRef = useRef(null);

  // Clean up localStorage when leaving page or unmounting
  useEffect(() => {
    const cleanup = () => {
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch {
        // ignore storage cleanup error
      }
    };

    window.addEventListener('beforeunload', cleanup);
    window.addEventListener('pagehide', cleanup);

    return () => {
      cleanup();
      window.removeEventListener('beforeunload', cleanup);
      window.removeEventListener('pagehide', cleanup);
    };
  }, []);

  // Fetch local preset file and convert to File
  const loadPresetFile = useCallback(async () => {
    try {
      const res = await fetch(DEFAULT_DEMO_PATH);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      const filename = DEFAULT_DEMO_PATH.split('/').pop() || 'diamond-ring.jpg';
      return new File([blob], filename, { type: blob.type || 'image/jpeg' });
    } catch (err) {
      console.warn('Failed to load demo image from public path, generating fallback:', err);
      return await createFallbackCanvasFile();
    }
  }, []);

  // Load image on mount: check localStorage first, else load default preset
  useEffect(() => {
    let isCancelled = false;
    setIsProcessing(true);

    try {
      const cached = localStorage.getItem(STORAGE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed?.dataUrl) {
          const restoredFile = dataUrlToFile(parsed.dataUrl, parsed.name, parsed.type);
          if (restoredFile && !isCancelled) {
            setSourceFile(restoredFile);
            setActivePreset('custom');
            setCustomFileMeta({ name: parsed.name, size: parsed.size });
            setIsProcessing(false);
            return;
          }
        }
      }
    } catch (err) {
      console.warn('Error reading test image from localStorage:', err);
    }

    // Default to diamond ring
    loadPresetFile()
      .then((file) => {
        if (!isCancelled) {
          setSourceFile(file);
          setActivePreset('ring');
          setCustomFileMeta(null);
        }
      })
      .catch((err) => {
        console.error('Failed to load preset:', err);
      })
      .finally(() => {
        if (!isCancelled) setIsProcessing(false);
      });

    return () => {
      isCancelled = true;
    };
  }, [loadPresetFile]);

  // Switch demo preset
  const handleResetToDefault = async () => {
    setIsProcessing(true);
    try {
      localStorage.removeItem(STORAGE_KEY);
      setCustomFileMeta(null);
      setActivePreset('ring');
      const file = await loadPresetFile();
      setSourceFile(file);
    } catch (err) {
      console.error('Failed to reset to demo image:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle custom file selection / upload
  const handleCustomFileUpload = (file) => {
    if (!file) return;

    if (!file.type || !file.type.startsWith('image/')) {
      alert('Please upload a valid image file (JPG, PNG, or WebP).');
      return;
    }

    // Limit to 12MB
    if (file.size > 12 * 1024 * 1024) {
      alert('Please select an image smaller than 12MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result;
      if (dataUrl && typeof dataUrl === 'string') {
        try {
          // If within typical localStorage quota (~5MB)
          if (dataUrl.length < 5 * 1024 * 1024) {
            localStorage.setItem(
              STORAGE_KEY,
              JSON.stringify({
                name: file.name,
                type: file.type,
                size: file.size,
                dataUrl,
              })
            );
          }
        } catch (storageErr) {
          console.warn('Could not cache file into localStorage (quota limit):', storageErr);
        }
      }
    };
    reader.readAsDataURL(file);

    setActivePreset('custom');
    setCustomFileMeta({ name: file.name, size: file.size });
    setSourceFile(file);
  };

  // Update original stats and original preview URL whenever sourceFile changes
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
        width: img.naturalWidth || img.width,
        height: img.naturalHeight || img.height,
        size: sourceFile.size,
        url: origUrl,
        name: sourceFile.name || 'Test Jewelry Image',
      });
    };
    img.onerror = () => {
      setOriginalStats({
        width: 1600,
        height: 1067,
        size: sourceFile.size,
        url: origUrl,
        name: sourceFile.name || 'Test Jewelry Image',
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

  // Live compression with slight debounce
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
        console.error('Compression error:', err);
      } finally {
        setIsProcessing(false);
      }
    }, 70);

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

  const originalUrl = originalStats?.url || '';
  const compressedUrl = compressedStats?.url;

  // Handlers to open full-resolution inspection modal
  const handlePreviewOriginal = (e) => {
    e?.stopPropagation?.();
    if (!originalUrl) return;
    const gallery = [
      {
        url: originalUrl,
        title: `Original Photo (${originalStats ? formatFileSize(originalStats.size) : 'Uncompressed'})`,
      },
      ...(compressedUrl
        ? [
            {
              url: compressedUrl,
              title: `Optimized Output (WebP @ ${quality}% - ${compressedStats ? formatFileSize(compressedStats.size) : ''})`,
            },
          ]
        : []),
    ];
    openImagePreview(originalUrl, {
      gallery,
      title: `Original Photo (${originalStats ? formatFileSize(originalStats.size) : 'Uncompressed'})`,
      initialIndex: 0,
    });
  };

  const handlePreviewOptimized = (e) => {
    e?.stopPropagation?.();
    if (!compressedUrl) return;
    const gallery = [
      {
        url: originalUrl,
        title: `Original Photo (${originalStats ? formatFileSize(originalStats.size) : 'Uncompressed'})`,
      },
      {
        url: compressedUrl,
        title: `Optimized Output (WebP @ ${quality}% - ${compressedStats ? formatFileSize(compressedStats.size) : ''})`,
      },
    ];
    openImagePreview(compressedUrl, {
      gallery,
      title: `Optimized Output (WebP @ ${quality}% - ${compressedStats ? formatFileSize(compressedStats.size) : ''})`,
      initialIndex: 1,
    });
  };

  return (
    <div className="rounded-xl border border-stone-200 bg-[#fdfcfb] p-3 sm:p-4 transition-all">
      {/* Top Bar: Title, Presets, Upload & Zoom */}
      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between border-b border-stone-200/80 pb-2.5">
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
            Compare clarity, sparkle, and facets between original and compressed output at{' '}
            <span className="font-semibold text-[#8f6d43]">{quality}%</span> quality.
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {activePreset === 'custom' ? (
            <button
              type="button"
              onClick={handleResetToDefault}
              className="flex items-center gap-1 rounded-lg border border-stone-200 bg-white px-2.5 py-1 text-xs font-medium text-stone-600 hover:text-stone-900 hover:bg-stone-50 transition-colors"
              title="Reset to Diamond Ring sample"
            >
              <HiOutlineX className="h-3.5 w-3.5" />
              <span>Reset to Sample</span>
            </button>
          ) : (
            <div className="flex items-center gap-1.5 rounded-lg border border-[#8f6d43]/30 bg-[#faf6f0] px-2.5 py-1 text-xs font-semibold text-[#8f6d43]">
              <span>💍</span>
              <span>Diamond Ring</span>
            </div>
          )}

          {/* Upload Custom Image Button */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleCustomFileUpload(file);
              e.target.value = '';
            }}
          />

          <button
            type="button"
            data-upload-trigger="true"
            onClick={() => fileInputRef.current?.click()}
            className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-semibold transition-all ${
              activePreset === 'custom'
                ? 'border-[#8f6d43] bg-[#8f6d43] text-white shadow-xs'
                : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-50'
            }`}
            title="Upload your own jewelry image to test compression"
          >
            <HiOutlineUpload className="h-3.5 w-3.5" />
            <span>Upload Test Photo</span>
          </button>
        </div>
      </div>

      {/* Custom Uploaded Active Indicator */}
      {activePreset === 'custom' && customFileMeta && (
        <div className="mt-2 flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50/70 px-3 py-1.5 text-xs text-amber-900">
          <div className="flex items-center gap-1.5 truncate">
            <span className="text-amber-700 font-bold">📸 Custom Test Photo:</span>
            <span className="font-medium truncate max-w-[240px] sm:max-w-md">{customFileMeta.name}</span>
            <span className="text-amber-700 text-[11px]">({formatFileSize(customFileMeta.size)})</span>
            <span className="text-[10px] text-amber-600 italic hidden sm:inline">
              • Cleaned automatically when leaving page
            </span>
          </div>
          <button
            type="button"
            onClick={handleResetToDefault}
            className="flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[11px] font-semibold text-amber-800 hover:bg-amber-100 transition-colors ml-2 shrink-0"
            title="Reset to sample jewelry photos"
          >
            <HiOutlineX className="h-3.5 w-3.5" />
            <span>Reset</span>
          </button>
        </div>
      )}

      {/* Metrics & Savings Strip */}
      <div className="my-2.5 grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-2.5">
        <div className="rounded-lg border border-stone-200/90 bg-white p-2">
          <span className="block text-[10px] font-semibold uppercase tracking-wider text-stone-400">
            Original Size
          </span>
          <div className="mt-0.5 flex items-baseline gap-1">
            <span className="text-sm font-bold text-stone-800">
              {originalStats ? formatFileSize(originalStats.size) : '…'}
            </span>
            <span className="text-[10px] text-stone-400">source</span>
          </div>
        </div>

        <div className="rounded-lg border border-stone-200/90 bg-white p-2">
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

        <div className="rounded-lg border border-emerald-200/80 bg-emerald-50/70 p-2">
          <span className="block text-[10px] font-semibold uppercase tracking-wider text-emerald-700">
            Storage & Bandwidth Saved
          </span>
          <div className="mt-0.5 flex items-baseline gap-1">
            <span className="text-sm font-extrabold text-emerald-700">
              {compressedStats?.savingsPercent ? `-${compressedStats.savingsPercent}%` : '0%'}
            </span>
            {compressedStats?.savingsBytes > 0 && (
              <span className="text-[10px] text-emerald-600 font-medium">
                ({formatFileSize(compressedStats.savingsBytes)})
              </span>
            )}
          </div>
        </div>

        <div className="rounded-lg border border-stone-200/90 bg-white p-2">
          <span className="block text-[10px] font-semibold uppercase tracking-wider text-stone-400">
            Resolution
          </span>
          <div className="mt-0.5 flex items-baseline gap-1">
            <span className="text-sm font-bold text-stone-800">
              {originalStats?.width ? `${originalStats.width} × ${originalStats.height}px` : '…'}
            </span>
          </div>
        </div>
      </div>

      {/* Side-by-Side Comparison Container with Drag-and-Drop */}
      <div
        className={`relative overflow-hidden rounded-xl border bg-white select-none transition-colors ${
          isDragging ? 'border-[#8f6d43] ring-2 ring-[#8f6d43]/30' : 'border-stone-200/90'
        }`}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          const file = e.dataTransfer.files?.[0];
          if (file) handleCustomFileUpload(file);
        }}
      >
        {/* Disabled Compression Notification */}
        {!enabled && (
          <div className="bg-amber-500/95 py-1 text-center text-xs font-semibold text-white shadow-xs">
            Automatic compression is turned OFF. Images will be stored at original file size.
          </div>
        )}

        <div className="grid grid-cols-1 divide-y divide-stone-200 md:grid-cols-2 md:divide-y-0 md:divide-x">
          {/* Left: Original Photo */}
          <div className="p-2.5 sm:p-3 bg-white flex flex-col">
            <div className="mb-2 flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 truncate">
                <span className="font-bold text-stone-800">Original Photo</span>
                <span className="rounded-md bg-stone-100 px-1.5 py-0.5 text-[10px] font-semibold text-stone-600 truncate max-w-[140px]">
                  {activePreset === 'custom' ? 'Custom Upload' : 'Raw Jewelry'}
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handlePreviewOriginal}
                  className="inline-flex items-center gap-1 rounded-md border border-stone-200 bg-white hover:bg-stone-50 px-2 py-0.5 text-[11px] font-semibold text-stone-700 shadow-2xs transition-colors cursor-pointer"
                  title="View full-resolution image preview"
                >
                  <HiOutlineEye className="w-3.5 h-3.5 text-[#8f6d43]" />
                  <span>View Preview</span>
                </button>
                <span className="rounded bg-stone-100 px-2 py-0.5 text-[11px] font-bold text-stone-700">
                  {originalStats ? formatFileSize(originalStats.size) : '…'}
                </span>
              </div>
            </div>

            <div
              onClick={handlePreviewOriginal}
              className="group relative h-56 sm:h-64 md:h-72 w-full overflow-hidden rounded-lg bg-stone-900 flex items-center justify-center border border-stone-100 cursor-pointer"
              title="Click to open full-resolution preview"
            >
              <div className="h-full w-full flex items-center justify-center">
                {originalUrl ? (
                  <img
                    src={originalUrl}
                    alt="Original jewelry demo"
                    className="h-full w-full object-contain pointer-events-none group-hover:scale-102 transition-transform duration-200"
                  />
                ) : (
                  <div className="flex items-center justify-center text-stone-400 text-xs">
                    Loading sample...
                  </div>
                )}
              </div>
              {/* Hover overlay with Eye Icon & Click to View */}
              <div className="absolute inset-0 bg-stone-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white gap-1 pointer-events-none">
                <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-xs flex items-center justify-center shadow-md">
                  <HiOutlineEye className="w-4 h-4 text-white" />
                </div>
                <span className="text-[11px] font-semibold tracking-wide drop-shadow-xs">Click to view full preview</span>
              </div>
              <div className="pointer-events-none absolute bottom-2 left-2 rounded-md bg-stone-900/80 px-2 py-0.5 text-[10px] font-medium text-white/90 backdrop-blur-xs">
                Original (Uncompressed)
              </div>
            </div>
          </div>

          {/* Right: Optimized Photo */}
          <div className="p-2.5 sm:p-3 bg-white flex flex-col">
            <div className="mb-2 flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 truncate">
                <span className="font-bold text-[#8f6d43]">
                  Optimized ({format === 'image/webp' ? 'WebP' : 'JPEG'} @ {quality}%)
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handlePreviewOptimized}
                  disabled={!compressedUrl}
                  className="inline-flex items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-800 shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
                  title="View full-resolution optimized preview"
                >
                  <HiOutlineEye className="w-3.5 h-3.5 text-emerald-700" />
                  <span>View Preview</span>
                </button>
                <span className="rounded bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-800">
                  {compressedStats ? formatFileSize(compressedStats.size) : '…'}
                  {compressedStats?.savingsPercent ? ` (-${compressedStats.savingsPercent}%)` : ''}
                </span>
              </div>
            </div>

            <div
              onClick={handlePreviewOptimized}
              className="group relative h-56 sm:h-64 md:h-72 w-full overflow-hidden rounded-lg bg-stone-900 flex items-center justify-center border border-stone-100 cursor-pointer"
              title="Click to open full-resolution preview"
            >
              <div className="h-full w-full flex items-center justify-center">
                {compressedUrl ? (
                  <img
                    src={compressedUrl}
                    alt="Optimized jewelry preview"
                    className="h-full w-full object-contain pointer-events-none group-hover:scale-102 transition-transform duration-200"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center gap-2 text-stone-400">
                    <HiOutlineRefresh className="h-6 w-6 animate-spin text-[#8f6d43]" />
                    <span className="text-xs font-medium">Encoding preview...</span>
                  </div>
                )}
              </div>
              {/* Hover overlay with Eye Icon & Click to View */}
              <div className="absolute inset-0 bg-stone-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white gap-1 pointer-events-none">
                <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-xs flex items-center justify-center shadow-md">
                  <HiOutlineEye className="w-4 h-4 text-white" />
                </div>
                <span className="text-[11px] font-semibold tracking-wide drop-shadow-xs">Click to view full preview</span>
              </div>
              <div className="pointer-events-none absolute bottom-2 right-2 rounded-md bg-emerald-900/85 px-2 py-0.5 text-[10px] font-semibold text-emerald-100 backdrop-blur-xs">
                {compressedStats?.savingsBytes > 0
                  ? `${formatFileSize(compressedStats.savingsBytes)} saved per image`
                  : 'Optimized Output'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
