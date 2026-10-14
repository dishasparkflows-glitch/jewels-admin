import api from '../api/axios.js';

/**
 * Upload file using Cloudflare R2 / S3 Presigned URL
 * 1. Calls backend /api/upload/presigned-url to obtain a presigned PUT URL
 * 2. Uploads binary data directly via HTTP PUT
 * 3. Returns the public fileUrl
 */
export async function uploadWithPresignedUrl(file, folder = 'banners', onProgress = null) {
  if (!file) throw new Error('No file selected for upload');

  // Request Upload Key & fileUrl from backend
  const res = await api.post('/upload/presigned-url', {
    filename: file.name,
    contentType: file.type || (file.name.endsWith('.mp4') ? 'video/mp4' : 'image/jpeg'),
    folder,
  });

  const uploadData = res.data?.data;
  if (!uploadData?.key) {
    throw new Error('Failed to obtain upload key from server');
  }

  const { fileUrl, key } = uploadData;

  // Stream binary upload via backend direct-put endpoint (avoids Cloudflare R2 browser CORS preflight rejection)
  const proxyRes = await api.put(`/upload/direct-put?key=${encodeURIComponent(key)}`, file, {
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

  const finalUrl = proxyRes.data?.data?.fileUrl || proxyRes.data?.data?.url || fileUrl;
  return { fileUrl: finalUrl, key };
}

