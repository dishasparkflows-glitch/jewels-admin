import axios from 'axios';
import api from '../api/axios.js';

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
 * Upload file using Cloudflare R2 / S3 Presigned URL
 * 1. Calls backend /api/upload/presigned-url to obtain a presigned PUT URL
 * 2. Uploads binary data directly to Cloudflare R2 via HTTP PUT
 * 3. Returns the public fileUrl
 */
export async function uploadWithPresignedUrl(file, moduleName = 'banner', onProgress = null, options = {}) {
  if (!file) throw new Error('No file selected for upload');

  // Infer safe content type
  const contentType =
    file.type ||
    (file.name.endsWith('.png')
      ? 'image/png'
      : file.name.endsWith('.webp')
      ? 'image/webp'
      : file.name.endsWith('.mp4')
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
  await axios.put(uploadUrl, file, {
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
  return { url: finalUrl, fileUrl: finalUrl, key };
}

/** Request upload URLs for a selection in one backend call, then PUT files to R2. */
export async function uploadFilesWithPresignedUrls(files, moduleName = 'products', onProgress = null, options = {}) {
  const selectedFiles = Array.from(files || []);
  if (!selectedFiles.length) return [];

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
    const result = { url: finalUrl, fileUrl: finalUrl, key: upload.key, name: file.name };
    options.onFileUploaded?.(result, file, index);
    return result;
  }));
}

