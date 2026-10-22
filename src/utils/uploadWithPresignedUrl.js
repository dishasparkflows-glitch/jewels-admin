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

export const DEFAULT_UPLOAD_COMPRESSION_SETTINGS = {
  enabled: true,
  quality: 82,
  maxDimension: 2400,
  format: 'image/webp',
};

let uploadCompressionSettingsCache = null;
let uploadCompressionSettingsFetchedAt = 0;
let uploadCompressionSettingsRequest = null;
const UPLOAD_COMPRESSION_SETTINGS_TTL = 60_000;

const normalizeUploadCompressionSettings = (settings = {}) => ({
  enabled: settings.enabled !== false,
  quality: Math.min(100, Math.max(50, Number(settings.quality) || DEFAULT_UPLOAD_COMPRESSION_SETTINGS.quality)),
  maxDimension: Math.min(4000, Math.max(600, Number(settings.maxDimension) || DEFAULT_UPLOAD_COMPRESSION_SETTINGS.maxDimension)),
  format: settings.format === 'image/jpeg' ? 'image/jpeg' : 'image/webp',
});

export function setUploadCompressionSettings(settings) {
  uploadCompressionSettingsCache = normalizeUploadCompressionSettings(settings);
  uploadCompressionSettingsFetchedAt = Date.now();
  return uploadCompressionSettingsCache;
}

export async function getUploadCompressionSettings() {
  if (uploadCompressionSettingsCache && Date.now() - uploadCompressionSettingsFetchedAt < UPLOAD_COMPRESSION_SETTINGS_TTL) {
    return uploadCompressionSettingsCache;
  }
  if (!uploadCompressionSettingsRequest) {
    uploadCompressionSettingsRequest = api.get('/settings')
      .then((response) => setUploadCompressionSettings(response.data?.data?.mediaCompression))
      .catch((error) => {
        console.warn('[uploadWithPresignedUrl] Could not load global image compression settings; using defaults:', error?.message);
        return setUploadCompressionSettings(DEFAULT_UPLOAD_COMPRESSION_SETTINGS);
      })
      .finally(() => {
        uploadCompressionSettingsRequest = null;
      });
  }
  return uploadCompressionSettingsRequest;
}

const getGlobalCompressionOptions = (preset, settings) => ({
  ...preset,
  quality: settings.quality / 100,
  maxWidth: settings.maxDimension,
  maxHeight: settings.maxDimension,
  format: settings.format,
});

export function createProductId() {
  const bytes = new Uint8Array(12);
  globalThis.crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

export function getUploadedObjectKey(asset) {
  const knownPrefixRegex = /(products|categories|users|banners|navigation|diamonds|reviews|vto|birthstones|celebrate-gifts|settings|website-themes|general|ornateproducts)\/.*$/i;

  if (typeof asset === 'object' && asset !== null) {
    if (asset.key && typeof asset.key === 'string') {
      const rawKey = asset.key.replace(/^\/+/, '').split(/[?#]/)[0];
      const match = rawKey.match(knownPrefixRegex);
      return decodeURIComponent(match ? match[0] : rawKey);
    }
    if (asset.url && typeof asset.url === 'string') {
      return getUploadedObjectKey(asset.url);
    }
    return '';
  }

  const value = typeof asset === 'string' ? asset : '';
  if (!value) return '';

  const cleanVal = value.trim();

  // 1. Raw relative path containing a known R2 folder
  const relMatch = cleanVal.replace(/^\/+/, '').split(/[?#]/)[0].match(knownPrefixRegex);
  if (relMatch) {
    return decodeURIComponent(relMatch[0]);
  }

  try {
    const parsed = new URL(cleanVal, window.location.origin);

    // 2. Query param '?key=products/...' or '?filepath=...'
    const queryKey = parsed.searchParams.get('key') || parsed.searchParams.get('filepath');
    if (queryKey) {
      const qMatch = queryKey.replace(/^\/+/, '').split(/[?#]/)[0].match(knownPrefixRegex);
      return decodeURIComponent(qMatch ? qMatch[0] : queryKey.replace(/^\/+/, '').split(/[?#]/)[0]);
    }

    // 3. Proxy prefix '/api/upload/file/'
    const proxyPrefix = '/api/upload/file/';
    if (parsed.pathname.includes(proxyPrefix)) {
      const pKey = parsed.pathname.split(proxyPrefix).pop().replace(/^\/+/, '').split(/[?#]/)[0];
      const pMatch = pKey.match(knownPrefixRegex);
      return decodeURIComponent(pMatch ? pMatch[0] : pKey);
    }

    // 4. Any hostname with a path matching a known R2 folder
    const cleanPath = parsed.pathname.replace(/^\/+/, '').split(/[?#]/)[0];
    const pathMatch = cleanPath.match(knownPrefixRegex);
    if (pathMatch) {
      return decodeURIComponent(pathMatch[0]);
    }

    if (
      parsed.hostname.endsWith('.r2.dev') ||
      parsed.hostname.endsWith('.r2.cloudflarestorage.com')
    ) {
      return decodeURIComponent(cleanPath);
    }
  } catch {
    return '';
  }
  return '';
}

export async function deleteUploadedFile(asset) {
  const key = getUploadedObjectKey(asset);
  if (!key) return false;
  try {
    await api.delete('/upload', { data: { key } });
    console.log(`[deleteUploadedFile] Deleted original file from Cloudflare R2: ${key}`);
    return true;
  } catch (err) {
    console.warn(`[deleteUploadedFile] Failed to delete ${key} from storage:`, err.response?.data?.message || err.message);
    return false;
  }
}

export async function deleteUploadedFiles(assets) {
  if (!Array.isArray(assets) || !assets.length) return true;
  const keys = assets.map((a) => getUploadedObjectKey(a)).filter(Boolean);
  if (!keys.length) return true;
  try {
    await api.delete('/upload', { data: { keys } });
    console.log(`[deleteUploadedFiles] Batch deleted ${keys.length} original files from Cloudflare R2`);
    return true;
  } catch (err) {
    console.warn(`[deleteUploadedFiles] Failed to delete files from storage:`, err.response?.data?.message || err.message);
    return false;
  }
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
  const uploadSettings = await getUploadCompressionSettings();
  const shouldCompress = options.compress !== false && options.compression !== false && uploadSettings.enabled;

  if (shouldCompress && isCompressibleImage(file)) {
    try {
      const preset = COMPRESSION_PRESETS[moduleName] || COMPRESSION_PRESETS.general;
      const compressionOpts = {
        ...getGlobalCompressionOptions(preset, uploadSettings),
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
    (/\.png$/i.test(fileToUpload.name)
      ? 'image/png'
      : /\.webp$/i.test(fileToUpload.name)
      ? 'image/webp'
      : /\.mp4$/i.test(fileToUpload.name)
      ? 'video/mp4'
      : /\.webm$/i.test(fileToUpload.name)
      ? 'video/webm'
      : /\.(mov|m4v)$/i.test(fileToUpload.name)
      ? 'video/quicktime'
      : /\.avif$/i.test(fileToUpload.name)
      ? 'image/avif'
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

  const uploadSettings = await getUploadCompressionSettings();
  const shouldCompress = options.compress !== false && options.compression !== false && uploadSettings.enabled;
  const preset = COMPRESSION_PRESETS[moduleName] || COMPRESSION_PRESETS.general;
  const compressionOpts = {
    ...getGlobalCompressionOptions(preset, uploadSettings),
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


