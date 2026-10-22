/**
 * Utility for client-side image compression, dimension scaling, and optimization
 * Uses hardware-accelerated HTML5 Canvas API in the browser.
 */

export function formatFileSize(bytes) {
  if (bytes == null || isNaN(bytes) || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

export function getImageDimensions(file) {
  return new Promise((resolve, reject) => {
    if (!file || !file.type.startsWith('image/')) {
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

/**
 * Compress an image file using HTML5 Canvas
 * @param {File|Blob} file - Original image file
 * @param {Object} options - Compression options
 * @param {number} [options.quality=0.82] - Compression quality (0.1 to 1.0)
 * @param {number} [options.maxWidth=1920] - Maximum width constraint
 * @param {number} [options.maxHeight=1920] - Maximum height constraint
 * @param {string} [options.mimeType='image/webp'] - Output format ('image/webp' | 'image/jpeg' | 'image/png')
 * @returns {Promise<Object>} Compressed result with file, previewUrl, dimensions, and savings
 */
export async function compressImage(file, options = {}) {
  const {
    quality = 0.82,
    maxWidth = 1920,
    maxHeight = 1920,
    mimeType = 'image/webp',
  } = options;

  if (!file || !file.type?.startsWith('image/')) {
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

  // If SVG, canvas compression is not suitable; return SVG directly
  if (file.type === 'image/svg+xml') {
    const previewUrl = URL.createObjectURL(file);
    return {
      file,
      blob: file,
      previewUrl,
      width: 0,
      height: 0,
      originalWidth: 0,
      originalHeight: 0,
      size: file.size,
      originalSize: file.size,
      savingsBytes: 0,
      savingsPercent: 0,
      mimeType: 'image/svg+xml',
    };
  }

  const objectUrl = URL.createObjectURL(file);
  const img = new Image();

  await new Promise((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error('Failed to load image for compression'));
    img.src = objectUrl;
  });

  const originalWidth = img.naturalWidth || img.width;
  const originalHeight = img.naturalHeight || img.height;

  // Calculate target dimensions keeping aspect ratio
  let targetWidth = originalWidth;
  let targetHeight = originalHeight;

  if (maxWidth && maxHeight && (targetWidth > maxWidth || targetHeight > maxHeight)) {
    const ratio = Math.min(maxWidth / targetWidth, maxHeight / targetHeight);
    targetWidth = Math.max(1, Math.round(targetWidth * ratio));
    targetHeight = Math.max(1, Math.round(targetHeight * ratio));
  }

  // Render on canvas
  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const ctx = canvas.getContext('2d');

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // Fill white background only for JPEG since JPEG does not support transparency
  if (mimeType === 'image/jpeg') {
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, targetWidth, targetHeight);
  }

  ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
  URL.revokeObjectURL(objectUrl);

  // Convert canvas to blob
  const targetQuality = mimeType === 'image/png' ? undefined : Math.min(Math.max(quality, 0.05), 1);
  const blob = await new Promise((resolve) => {
    canvas.toBlob(
      (b) => resolve(b),
      mimeType,
      targetQuality
    );
  });

  if (!blob) {
    throw new Error('Canvas compression produced empty data');
  }

  // Derive file extension
  const extMap = {
    'image/webp': '.webp',
    'image/jpeg': '.jpg',
    'image/png': '.png',
  };
  const targetExt = extMap[mimeType] || '.webp';
  const baseName = (file.name || 'image').replace(/\.[^/.]+$/, '');
  const newFileName = `${baseName}${targetExt}`;

  const compressedFile = new File([blob], newFileName, {
    type: blob.type,
    lastModified: Date.now(),
  });

  const previewUrl = URL.createObjectURL(blob);
  const originalSize = file.size;
  const compressedSize = blob.size;
  const savingsBytes = originalSize - compressedSize;
  const savingsPercent =
    originalSize > 0 ? Math.max(0, Math.round((savingsBytes / originalSize) * 100)) : 0;

  return {
    file: compressedFile,
    blob,
    previewUrl,
    width: targetWidth,
    height: targetHeight,
    originalWidth,
    originalHeight,
    size: compressedSize,
    originalSize,
    savingsBytes,
    savingsPercent,
    mimeType: blob.type,
  };
}
