import axios from 'axios';
import api from '../api/axios.js';
import {
  compressImageFile,
  isCompressibleImage,
  COMPRESSION_PRESETS,
  formatBytes,
} from './imageCompression.js';

export {
  compressImageFile,
  isCompressibleImage,
  COMPRESSION_PRESETS,
  formatBytes,
};

export function createProductId() {
  const bytes = new Uint8Array(12);
  globalThis.crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

function getUploadedObjectKey(asset) {
  if (typeof asset === 'object' && asset?.key) return asset.key;
  const value = typeof asset === 'string' ? asset : asset?.url;
  if (!value || typeof value !== 'string') return '';

  try {
    const parsed = new URL(value, window.location.origin);
    const proxyPrefix = '/api/upload/file/';
    if (parsed.pathname.includes(proxyPrefix)) {
      return decodeURIComponent(parsed.pathname.split(proxyPrefix).pop());
    }
    if (parsed.hostname.endsWith('.r2.dev') || parsed.hostname.endsWith('.r2.cloudflarestorage.com')) {
      return decodeURIComponent(parsed.pathname.replace(/^\/+/, ''));
    }
  } catch {
    return '';
  }
  return '';
}

export async function deleteUploadedFile(asset) {
  const key = getUploadedObjectKey(asset);
  if (!key) return false;
  await api.delete('/upload', { data: { key } });
  return true;
}

/**
 * Upload file using Cloudflare R2 / S3 Presigned URL with automatic upload-time image compression.
 * 1. Automatically optimizes & compresses images client-side before upload
 * 2. Calls backend /api/upload/presigned-url to obtain a presigned PUT URL
 * 3. Uploads binary data directly to Cloudflare R2 via HTTP PUT
 * 4. Returns the public fileUrl, key, and compression savings statistics
 */
export async function uploadWithPresignedUrl(file, moduleName = 'banner', onProgress = null, options = {}) {
  if (!file) throw new Error('No file selected for upload');

  // Upload-time client-side image compression
  let fileToUpload = file;
  const shouldCompress = options.compress !== false && options.compression !== false;

  if (shouldCompress && isCompressibleImage(file)) {
    try {
      const preset = COMPRESSION_PRESETS[moduleName] || COMPRESSION_PRESETS.general;
      const compressionOpts = {
        ...preset,
        ...(options.compressionOptions || {}),
      };
      options.onCompressionStart?.(file);
      fileToUpload = await compressImageFile(file, compressionOpts);
      if (fileToUpload.wasCompressed) {
        options.onCompressionDone?.({
          originalSize: fileToUpload.originalSize,
          compressedSize: fileToUpload.compressedSize,
          savingsPercent: fileToUpload.savingsPercent,
        }, fileToUpload, file);
      }
    } catch (compressErr) {
      console.warn('[uploadWithPresignedUrl] Image compression skipped due to error:', compressErr);
      fileToUpload = file;
    }
  }

  // Infer safe content type from (possibly compressed) file
  const contentType =
    fileToUpload.type ||
    (fileToUpload.name.endsWith('.png')
      ? 'image/png'
      : fileToUpload.name.endsWith('.webp')
      ? 'image/webp'
      : fileToUpload.name.endsWith('.mp4')
      ? 'video/mp4'
      : 'image/jpeg');

  // Request Upload Key & uploadUrl from backend using logical module and contentType
  const res = await api.post('/upload/presigned-url', {
    module: moduleName,
    contentType,
    ...(options.productId ? { productId: options.productId } : {}),
    ...(options.subfolder ? { subfolder: options.subfolder } : {}),
  });

  const uploadData = res.data?.data;
  if (!uploadData?.uploadUrl || !uploadData?.key) {
    throw new Error('Failed to obtain upload URL from server');
  }

  const { uploadUrl, fileUrl, url, key, contentType: verifiedType } = uploadData;

  // Direct PUT upload to Cloudflare R2 using the presigned URL and exact Content-Type
  await axios.put(uploadUrl, fileToUpload, {
    headers: {
      'Content-Type': verifiedType || contentType,
    },
    onUploadProgress: (progressEvent) => {
      if (onProgress && progressEvent.total) {
        const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        onProgress(percent);
      }
    },
  });

  const finalUrl = fileUrl || url;
  return {
    url: finalUrl,
    fileUrl: finalUrl,
    key,
    size: fileToUpload.size,
    originalSize: fileToUpload.originalSize || file.size,
    compressedSize: fileToUpload.size,
    wasCompressed: Boolean(fileToUpload.wasCompressed),
    savingsPercent: fileToUpload.savingsPercent || 0,
    name: fileToUpload.name,
  };
}

/** Request upload URLs for a selection in one backend call with parallel upload-time compression, then PUT files to R2. */
export async function uploadFilesWithPresignedUrls(files, moduleName = 'products', onProgress = null, options = {}) {
  const rawFiles = Array.from(files || []);
  if (!rawFiles.length) return [];

  const shouldCompress = options.compress !== false && options.compression !== false;
  const preset = COMPRESSION_PRESETS[moduleName] || COMPRESSION_PRESETS.general;
  const compressionOpts = {
    ...preset,
    ...(options.compressionOptions || {}),
  };

  // Parallel upload-time compression before requesting presigned URLs
  const selectedFiles = await Promise.all(
    rawFiles.map(async (file) => {
      if (shouldCompress && isCompressibleImage(file)) {
        try {
          return await compressImageFile(file, compressionOpts);
        } catch (err) {
          console.warn('[uploadFilesWithPresignedUrls] Batch image compression error:', err);
          return file;
        }
      }
      return file;
    })
  );

  const fileContentType = (file) => file.type || (
    /\.png$/i.test(file.name) ? 'image/png'
      : /\.webp$/i.test(file.name) ? 'image/webp'
        : /\.mp4$/i.test(file.name) ? 'video/mp4'
          : /\.webm$/i.test(file.name) ? 'video/webm'
            : /\.(mov|m4v)$/i.test(file.name) ? 'video/quicktime'
              : 'image/jpeg'
  );

  const response = await api.post('/upload/presigned-url', {
    module: moduleName,
    files: selectedFiles.map((file) => ({ name: file.name, contentType: fileContentType(file) })),
    ...(options.productId ? { productId: options.productId } : {}),
    ...(options.subfolder ? { subfolder: options.subfolder } : {}),
  });
  const uploads = response.data?.data;
  if (!Array.isArray(uploads) || uploads.length !== selectedFiles.length) {
    throw new Error('Server did not return an upload URL for every selected file');
  }

  return Promise.all(selectedFiles.map(async (file, index) => {
    const upload = uploads[index];
    if (!upload?.uploadUrl || !upload?.key) {
      throw new Error(`Failed to obtain upload URL for ${file.name}`);
    }
    await axios.put(upload.uploadUrl, file, {
      headers: { 'Content-Type': upload.contentType || fileContentType(file) },
      onUploadProgress: (event) => {
        if (onProgress && event.total) onProgress(index, Math.round((event.loaded * 100) / event.total));
      },
    });
    const finalUrl = upload.fileUrl || upload.url;
    const originalFile = rawFiles[index];
    const result = {
      url: finalUrl,
      fileUrl: finalUrl,
      key: upload.key,
      name: file.name,
      size: file.size,
      originalSize: file.originalSize || originalFile?.size || file.size,
      compressedSize: file.size,
      wasCompressed: Boolean(file.wasCompressed),
      savingsPercent: file.savingsPercent || 0,
    };
    options.onFileUploaded?.(result, file, index, originalFile);
    return result;
  }));
}


