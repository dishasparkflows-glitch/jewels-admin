import api from '../api/axios.js';
import axios from 'axios';

/**
 * Upload file using Cloudflare R2 / S3 Presigned URL
 * 1. Calls backend /api/upload/presigned-url to obtain a presigned PUT URL
 * 2. Uploads binary data directly via HTTP PUT
 * 3. Returns the public fileUrl
 */
export async function uploadWithPresignedUrl(file, folder = 'banners', onProgress = null) {
  if (!file) throw new Error('No file selected for upload');

  // Request Presigned Upload URL from backend (backend/src/modules/upload/upload.routes.js:L14)
  const res = await api.post('/upload/presigned-url', {
    filename: file.name,
    contentType: file.type || (file.name.endsWith('.mp4') ? 'video/mp4' : 'image/jpeg'),
    folder,
  });

  const uploadData = res.data?.data;
  if (!uploadData?.uploadUrl) {
    throw new Error('Failed to obtain presigned upload URL from server');
  }

  const { uploadUrl, fileUrl, key, method } = uploadData;
  const targetUrl = uploadUrl.startsWith('http')
    ? uploadUrl
    : `${api.defaults.baseURL.replace(/\/api\/?$/, '')}${uploadUrl}`;

  const isCloudflareOrS3 = targetUrl.includes('r2.cloudflarestorage.com') || targetUrl.includes('amazonaws.com');
  const headers = {
    'Content-Type': file.type || 'application/octet-stream',
  };

  const token = localStorage.getItem('token');
  if (!isCloudflareOrS3 && token) {
    headers.Authorization = `Bearer ${token}`;
  }

  try {
    // Attempt 1: Upload directly via HTTP PUT (Cloudflare R2 / S3)
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

    // Resolve URL to the active backend baseURL so images load cleanly
    let resolvedUrl = fileUrl;
    const base = (api.defaults?.baseURL || 'http://localhost:5001/api').replace(/\/api\/?$/, '');
    if (resolvedUrl && resolvedUrl.includes('/api/upload/file/')) {
      const keyPart = resolvedUrl.split('/api/upload/file/')[1];
      resolvedUrl = `${base}/api/upload/file/${keyPart}`;
    } else if (resolvedUrl && resolvedUrl.startsWith('/')) {
      resolvedUrl = `${base}${resolvedUrl}`;
    }

    return { fileUrl: resolvedUrl, key };
  } catch (directErr) {
    console.warn(
      '[Upload] Direct PUT to storage provider failed (CORS or network error). Relaying via backend server proxy...',
      directErr.message
    );

    // Attempt 2: Seamless backend relay PUT (uploads to Cloudflare R2 on server side without CORS)
    const base = (api.defaults?.baseURL || 'http://localhost:5001/api').replace(/\/api\/?$/, '');
    const proxyUrl = `${base}/api/upload/direct-put?key=${encodeURIComponent(key)}`;

    const proxyHeaders = {
      'Content-Type': file.type || 'application/octet-stream',
    };
    if (token) {
      proxyHeaders.Authorization = `Bearer ${token}`;
    }

    const proxyRes = await axios({
      method: 'PUT',
      url: proxyUrl,
      data: file,
      headers: proxyHeaders,
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percent);
        }
      },
    });

    const relayedUrl = proxyRes.data?.data?.fileUrl || proxyRes.data?.data?.url || fileUrl;
    let resolvedUrl = relayedUrl;
    if (resolvedUrl && resolvedUrl.includes('/api/upload/file/')) {
      const keyPart = resolvedUrl.split('/api/upload/file/')[1];
      resolvedUrl = `${base}/api/upload/file/${keyPart}`;
    } else if (resolvedUrl && resolvedUrl.startsWith('/')) {
      resolvedUrl = `${base}${resolvedUrl}`;
    }

    return { fileUrl: resolvedUrl, key };
  }
}

