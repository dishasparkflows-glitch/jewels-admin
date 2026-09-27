import api from '../api/axios.js';
import axios from 'axios';

/**
 * Upload file using Cloudflare R2 / S3 Presigned URL
 * 1. Calls backend /api/upload/presigned-url to obtain a presigned PUT URL
 * 2. Uploads binary data directly to Cloudflare R2 via HTTP PUT
 * 3. Returns the public fileUrl
 */
export async function uploadWithPresignedUrl(file, folder = 'banners', onProgress = null) {
  if (!file) throw new Error('No file selected for upload');

  // Step 1: Request presigned upload URL from backend
  const res = await api.post('/upload/presigned-url', {
    filename: file.name,
    contentType: file.type || (file.name.endsWith('.mp4') ? 'video/mp4' : 'image/jpeg'),
    folder,
  });

  const { uploadUrl, fileUrl, key, method } = res.data.data;

  // Step 2: Resolve target upload destination
  // If uploadUrl is relative (local fallback), prepend backend base URL
  const targetUrl = uploadUrl.startsWith('http')
    ? uploadUrl
    : `${api.defaults.baseURL.replace(/\/api\/?$/, '')}${uploadUrl}`;

  // Step 3: Direct PUT binary stream upload to Cloudflare R2 (or local fallback)
  const isCloudflareOrS3 = targetUrl.includes('r2.cloudflarestorage.com') || targetUrl.includes('amazonaws.com');
  const headers = {
    'Content-Type': file.type || 'application/octet-stream',
  };

  // Only attach Bearer token if uploading to local backend (Cloudflare R2 rejects Bearer tokens in presigned PUT)
  const token = localStorage.getItem('token');
  if (!isCloudflareOrS3 && token) {
    headers.Authorization = `Bearer ${token}`;
  }

  await axios({
    method: method || 'PUT',
    url: targetUrl,
    data: file,
    headers,
    onUploadProgress: (progressEvent) => {
      if (onProgress && progressEvent.total) {
        const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        onProgress(percent);
      }
    },
  });

  return { fileUrl, key };
}
