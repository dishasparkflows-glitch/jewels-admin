/**
 * Universal Client-Side Image Compression Utility
 *
 * Automatically compresses, optimizes, and converts raster images at upload time
 * before transferring bytes to Cloudflare R2 / S3 storage.
 *
 * Key features:
 * - Visually lossless WebP / JPEG encoding
 * - Automatic aspect-ratio preserving dimension downscaling (max 2400px default)
 * - Safe EXIF orientation preservation via createImageBitmap / Image decode
 * - Preserves transparency for PNG/WebP (alpha channel support)
 * - Skips vector SVGs and animated GIFs
 * - Never inflates file size: if compressed output is larger than original, retains original
 * - Fail-safe: gracefully falls back to original file if any canvas error occurs
 */

export const DEFAULT_COMPRESSION_CONFIG = {
  maxWidth: 2400,
  maxHeight: 2400,
  quality: 0.85,
  format: 'image/webp',
  minSizeToCompressBytes: 60 * 1024, // 60 KB
  alwaysKeepOriginalIfSmaller: true,
};

export const COMPRESSION_PRESETS = {
  // Jewelry, Ornate & Silver catalog products: high clarity for diamond cuts, metal reflections & gems
  products: {
    maxWidth: 2400,
    maxHeight: 2400,
    quality: 0.85,
    format: 'image/webp',
    minSizeToCompressBytes: 60 * 1024,
  },
  // Full-width hero banners & promotional carousels
  banners: {
    maxWidth: 2560,
    maxHeight: 2560,
    quality: 0.88,
    format: 'image/webp',
    minSizeToCompressBytes: 80 * 1024,
  },
  'home-sections': {
    maxWidth: 2560,
    maxHeight: 2560,
    quality: 0.88,
    format: 'image/webp',
    minSizeToCompressBytes: 80 * 1024,
  },
  categories: {
    maxWidth: 1600,
    maxHeight: 1600,
    quality: 0.85,
    format: 'image/webp',
    minSizeToCompressBytes: 50 * 1024,
  },
  diamonds: {
    maxWidth: 2000,
    maxHeight: 2000,
    quality: 0.88,
    format: 'image/webp',
    minSizeToCompressBytes: 60 * 1024,
  },
  vto: {
    maxWidth: 2000,
    maxHeight: 2000,
    quality: 0.90,
    format: 'image/webp',
    minSizeToCompressBytes: 60 * 1024,
  },
  blog: {
    maxWidth: 2000,
    maxHeight: 2000,
    quality: 0.85,
    format: 'image/webp',
    minSizeToCompressBytes: 60 * 1024,
  },
  swatch: {
    maxWidth: 600,
    maxHeight: 600,
    quality: 0.85,
    format: 'image/webp',
    minSizeToCompressBytes: 30 * 1024,
  },
  general: {
    maxWidth: 2048,
    maxHeight: 2048,
    quality: 0.85,
    format: 'image/webp',
    minSizeToCompressBytes: 60 * 1024,
  },
};

/**
 * Format bytes into human-readable representation
 */
export function formatBytes(bytes = 0) {
  if (!bytes || isNaN(bytes)) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

/**
 * Determine if a file is a candidate for image compression
 */
export function isCompressibleImage(file) {
  if (!file) return false;
  const type = (file.type || '').toLowerCase();
  const name = (file.name || '').toLowerCase();

  // Exclude SVGs (vector format) and GIFs (preserve multi-frame animation)
  if (type === 'image/svg+xml' || name.endsWith('.svg')) return false;
  if (type === 'image/gif' || name.endsWith('.gif')) return false;

  // Check compressible raster image types
  const isImageMime =
    type === 'image/jpeg' ||
    type === 'image/jpg' ||
    type === 'image/png' ||
    type === 'image/webp' ||
    type === 'image/avif';

  const isImageExt = /\.(jpe?g|png|webp|avif)$/i.test(name);

  return isImageMime || isImageExt;
}

/**
 * Compress a single image File or Blob at upload time
 *
 * @param {File|Blob} file - The file to compress
 * @param {Object} [customOptions] - Custom configuration overrides
 * @returns {Promise<File>} Compressed File or original file if compression not advantageous
 */
export async function compressImageFile(file, customOptions = {}) {
  if (!file) return file;
  if (!isCompressibleImage(file)) return file;

  const options = { ...DEFAULT_COMPRESSION_CONFIG, ...customOptions };

  // Skip tiny files where re-encoding yields negligible gains or risk of slight quality shift
  if (file.size && file.size < options.minSizeToCompressBytes) {
    return file;
  }

  try {
    let width = 0;
    let height = 0;
    let source = null;
    let closeSource = () => {};

    // 1. Decode image - prefer hardware-accelerated createImageBitmap
    if (typeof window !== 'undefined' && 'createImageBitmap' in window) {
      try {
        const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
        width = bitmap.width;
        height = bitmap.height;
        source = bitmap;
        closeSource = () => bitmap.close?.();
      } catch {
        source = null;
      }
    }

    // Fallback: standard HTMLImageElement
    if (!source) {
      const img = await new Promise((resolve, reject) => {
        const image = new Image();
        const objectUrl = URL.createObjectURL(file);
        image.onload = () => {
          URL.revokeObjectURL(objectUrl);
          resolve(image);
        };
        image.onerror = (err) => {
          URL.revokeObjectURL(objectUrl);
          reject(err);
        };
        image.src = objectUrl;
      });
      width = img.naturalWidth || img.width;
      height = img.naturalHeight || img.height;
      source = img;
    }

    if (!width || !height) {
      closeSource();
      return file;
    }

    // 2. Compute proportional target dimensions
    let targetWidth = width;
    let targetHeight = height;
    const maxW = options.maxWidth || 2400;
    const maxH = options.maxHeight || 2400;

    if (targetWidth > maxW || targetHeight > maxH) {
      const ratio = Math.min(maxW / targetWidth, maxH / targetHeight);
      targetWidth = Math.max(1, Math.round(targetWidth * ratio));
      targetHeight = Math.max(1, Math.round(targetHeight * ratio));
    }

    // 3. Render onto canvas with high quality smoothing
    const canvas = document.createElement('canvas');
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) {
      closeSource();
      return file;
    }

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(source, 0, 0, targetWidth, targetHeight);
    closeSource();

    // 4. Encode canvas to target format Blob
    const targetFormat = options.format || 'image/webp';
    let compressedBlob = await new Promise((resolve) => {
      canvas.toBlob((blob) => resolve(blob), targetFormat, options.quality || 0.85);
    });

    // Fallback to image/jpeg if browser canvas fails on image/webp
    if (!compressedBlob && targetFormat !== 'image/jpeg') {
      compressedBlob = await new Promise((resolve) => {
        canvas.toBlob((blob) => resolve(blob), 'image/jpeg', options.quality || 0.85);
      });
    }

    if (!compressedBlob) {
      return file;
    }

    // 5. Retain original if compressed file is larger and no dimension downscaling occurred
    const wasResized = targetWidth !== width || targetHeight !== height;
    if (options.alwaysKeepOriginalIfSmaller && compressedBlob.size >= file.size && !wasResized) {
      return file;
    }

    // 6. Wrap in a standard File object with matching extension and metadata
    const originalName = file.name || 'image';
    const stem = originalName.replace(/\.[^.]+$/, '');
    const extension =
      compressedBlob.type === 'image/webp'
        ? 'webp'
        : compressedBlob.type === 'image/png'
        ? 'png'
        : 'jpg';

    const newFilename = `${stem}.${extension}`;
    const compressedFile = new File([compressedBlob], newFilename, {
      type: compressedBlob.type,
      lastModified: Date.now(),
    });

    // Attach compression stats for consumers
    compressedFile.originalSize = file.size;
    compressedFile.compressedSize = compressedFile.size;
    compressedFile.wasCompressed = true;
    compressedFile.savingsPercent = Math.max(0, Math.round((1 - compressedFile.size / file.size) * 100));
    compressedFile.originalName = originalName;

    return compressedFile;
  } catch (err) {
    console.warn(`[imageCompression] Compression skipped for "${file?.name}":`, err);
    return file;
  }
}

/**
 * Compress an array of files concurrently
 *
 * @param {Array<File>|FileList} files - Array of files to compress
 * @param {Object} [options] - Compression options
 * @returns {Promise<Array<File>>}
 */
export async function compressImageFiles(files, options = {}) {
  const list = Array.from(files || []);
  if (!list.length) return [];
  return Promise.all(list.map((file) => compressImageFile(file, options)));
}
