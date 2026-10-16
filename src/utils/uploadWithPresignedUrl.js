import axios from 'axios';
import api from '../api/axios.js';

/**
 * Upload file using Cloudflare R2 / S3 Presigned URL
 * 1. Calls backend /api/upload/presigned-url to obtain a presigned PUT URL
 * 2. Uploads binary data directly to Cloudflare R2 via HTTP PUT
 * 3. Returns the public fileUrl
 */
export async function uploadWithPresignedUrl(file, moduleName = 'banner', onProgress = null) {
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

