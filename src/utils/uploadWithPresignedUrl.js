import axios from 'axios';
import api from '../api/axios.js';

/**
 * Upload file using Cloudflare R2 / S3 Presigned URL
 * 1. Calls backend /api/upload/presigned-url to obtain a presigned PUT URL
 * 2. Uploads binary data directly to Cloudflare R2 via HTTP PUT
 * 3. Returns the public fileUrl
 */
export async function uploadWithPresignedUrl(file, folder = 'banners', onProgress = null) {
  if (!file) throw new Error('No file selected for upload');

  // Request Upload Key & uploadUrl from backend
  const res = await api.post('/upload/presigned-url', {
    filename: file.name,
    contentType: file.type || (file.name.endsWith('.mp4') ? 'video/mp4' : 'image/jpeg'),
    folder,
  });

  const uploadData = res.data?.data;
  if (!uploadData?.uploadUrl || !uploadData?.key) {
    throw new Error('Failed to obtain upload URL from server');
  }

  const { uploadUrl, fileUrl, url, key } = uploadData;

  // Direct PUT upload to Cloudflare R2 using the presigned URL
  await axios.put(uploadUrl, file, {
    headers: {
      'Content-Type': file.type || 'application/octet-stream',
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

