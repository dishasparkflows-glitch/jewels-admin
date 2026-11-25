import { formatBytes } from './formatters.js';

/**
 * Universal Client-Side Image Compression Utility
 *
 * Single canvas decode/resize/encode engine shared across upload optimization
 * and Settings compression preview demos.
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
  products: {
    maxWidth: 2400,
    maxHeight: 2400,
    quality: 0.85,
    format: 'image/webp',
    minSizeToCompressBytes: 60 * 1024,
  },
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
    quality: 0.9,
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

export { formatBytes };
export const formatFileSize = formatBytes;

/**
 * Determine if a file is a candidate for raster image compression.
 */
export function isCompressibleImage(file) {
  if (!file) return false;
  const type = (file.type || '').toLowerCase();
  const name = (file.name || '').toLowerCase();

  if (type === 'image/svg+xml' || name.endsWith('.svg')) return false;
  if (type === 'image/gif' || name.endsWith('.gif')) return false;

  const isImageMime =
    type === 'image/jpeg' ||
    type === 'image/jpg' ||
    type === 'image/png' ||
    type === 'image/webp' ||
    type === 'image/bmp' ||
    type === 'image/avif';

  const hasImageExtension = /\.(jpe?g|png|webp|bmp|avif)$/i.test(name);
  return isImageMime || hasImageExtension;
}

/**
 * Measure an image File/Blob's natural dimensions in the browser.
 */
export function getImageDimensions(file) {
  return new Promise((resolve) => {
    if (!file || !file.type?.startsWith('image/')) {
      return resolve({ width: 0, height: 0 });
    }
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const dims = { width: img.naturalWidth || img.width, height: img.naturalHeight || img.height };
      URL.revokeObjectURL(url);
      resolve(dims);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve({ width: 0, height: 0 });
    };
    img.src = url;
  });
}

async function decodeImageSource(file) {
  if (typeof window !== 'undefined' && 'createImageBitmap' in window) {
    try {
      const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
      return {
        source: bitmap,
        width: bitmap.width,
        height: bitmap.height,
        close: () => bitmap.close?.(),
      };
    } catch {
      // Fallback to HTMLImageElement below
    }
  }

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

  return {
    source: img,
    width: img.naturalWidth || img.width,
    height: img.naturalHeight || img.height,
    close: () => {},
  };
}

async function renderToCompressedBlob(file, options = {}) {
  const {
    maxWidth = 2400,
    maxHeight = 2400,
    quality = 0.85,
    format = 'image/webp',
    fallbackToJpeg = true,
  } = options;

  const decoded = await decodeImageSource(file);
  const { source, width: originalWidth, height: originalHeight, close } = decoded;

  if (!originalWidth || !originalHeight) {
    close();
    return null;
  }

  let targetWidth = originalWidth;
  let targetHeight = originalHeight;
  if (maxWidth && maxHeight && (targetWidth > maxWidth || targetHeight > maxHeight)) {
    const ratio = Math.min(maxWidth / targetWidth, maxHeight / targetHeight);
    targetWidth = Math.max(1, Math.round(targetWidth * ratio));
    targetHeight = Math.max(1, Math.round(targetHeight * ratio));
  }

  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const ctx = canvas.getContext('2d', { alpha: true });
  if (!ctx) {
    close();
    return null;
  }

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  if (format === 'image/jpeg') {
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, targetWidth, targetHeight);
  }

  ctx.drawImage(source, 0, 0, targetWidth, targetHeight);
  close();

  const encodedQuality = format === 'image/png' ? undefined : Math.min(Math.max(quality, 0.05), 1);
  let blob = await new Promise((resolve) => {
    canvas.toBlob((b) => resolve(b), format, encodedQuality);
  });

  if (!blob && fallbackToJpeg && format !== 'image/jpeg') {
    blob = await new Promise((resolve) => {
      canvas.toBlob((b) => resolve(b), 'image/jpeg', encodedQuality);
    });
  }

  if (!blob) return null;

  return {
    blob,
    targetWidth,
    targetHeight,
    originalWidth,
    originalHeight,
    wasResized: targetWidth !== originalWidth || targetHeight !== originalHeight,
  };
}

function buildCompressedFile(originalFile, blob) {
  const originalName = originalFile.name || 'image';
  const stem = originalName.replace(/\.[^/.]+$/, '');
  const extension =
    blob.type === 'image/webp' ? 'webp' : blob.type === 'image/png' ? 'png' : 'jpg';
  const compressedFile = new File([blob], `${stem}.${extension}`, {
    type: blob.type,
    lastModified: Date.now(),
  });

  compressedFile.originalSize = originalFile.size;
  compressedFile.compressedSize = compressedFile.size;
  compressedFile.wasCompressed = true;
  compressedFile.savingsPercent = originalFile.size
    ? Math.max(0, Math.round((1 - compressedFile.size / originalFile.size) * 100))
    : 0;
  compressedFile.originalName = originalName;
  return compressedFile;
}

/**
 * Compress a single image File or Blob at upload time.
 */
export async function compressImageFile(file, customOptions = {}) {
  if (!file) return file;
  if (file.wasCompressed) return file;
  if (!isCompressibleImage(file)) return file;

  const options = { ...DEFAULT_COMPRESSION_CONFIG, ...customOptions };

  if (file.size && file.size < options.minSizeToCompressBytes) {
    return file;
  }

  try {
    const rendered = await renderToCompressedBlob(file, {
      maxWidth: options.maxWidth,
      maxHeight: options.maxHeight,
      quality: options.quality,
      format: options.format,
    });
    if (!rendered) return file;

    if (
      options.alwaysKeepOriginalIfSmaller &&
      rendered.blob.size >= file.size &&
      !rendered.wasResized
    ) {
      return file;
    }

    return buildCompressedFile(file, rendered.blob);
  } catch (err) {
    console.warn(`[imageCompression] Compression skipped for "${file?.name}":`, err);
    return file;
  }
}

/**
 * Compress an image and return detailed dimension/size telemetry & object preview URL
 * (used by Settings -> Media Compression interactive demo).
 */
export async function compressImage(file, options = {}) {
  const {
    quality = 0.82,
    maxWidth = 1920,
    maxHeight = 1920,
    mimeType = 'image/webp',
  } = options;

  if (!file || !file.type?.startsWith('image/') || file.type === 'image/svg+xml') {
    const previewUrl = file ? URL.createObjectURL(file) : '';
    return {
      file,
      blob: file,
      previewUrl,
      width: 0,
      height: 0,
      originalWidth: 0,
      originalHeight: 0,
      size: file?.size || 0,
      originalSize: file?.size || 0,
      savingsBytes: 0,
      savingsPercent: 0,
      mimeType: file?.type || 'unknown',
    };
  }

  const rendered = await renderToCompressedBlob(file, {
    maxWidth,
    maxHeight,
    quality,
    format: mimeType,
    fallbackToJpeg: false,
  });

  if (!rendered) {
    throw new Error('Canvas compression produced empty data');
  }

  const compressedFile = buildCompressedFile(file, rendered.blob);
  const previewUrl = URL.createObjectURL(rendered.blob);
  const originalSize = file.size;
  const compressedSize = rendered.blob.size;
  const savingsBytes = originalSize - compressedSize;
  const savingsPercent =
    originalSize > 0 ? Math.max(0, Math.round((savingsBytes / originalSize) * 100)) : 0;

  return {
    file: compressedFile,
    blob: rendered.blob,
    previewUrl,
    width: rendered.targetWidth,
    height: rendered.targetHeight,
    originalWidth: rendered.originalWidth,
    originalHeight: rendered.originalHeight,
    size: compressedSize,
    originalSize,
    savingsBytes,
    savingsPercent,
    mimeType: rendered.blob.type,
  };
}

/**
 * Compress an array of files concurrently.
 */
export async function compressImageFiles(files, options = {}) {
  const list = Array.from(files || []);
  if (!list.length) return [];
  return Promise.all(list.map((file) => compressImageFile(file, options)));
}
