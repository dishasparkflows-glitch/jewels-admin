import api from '../api/axios';

/**
 * Resolves any image URL (Cloudflare R2 private S3 URL, local relative path, or external CDN)
 * into a fully loadable public URL that browser <img> tags can render without auth issues.
 */
export function getMediaUrl(url) {
  if (!url || typeof url !== 'string') return '';

  const trimmed = url.trim();
  if (!trimmed || trimmed.includes('example.com')) return '';

  const backendBase = (api.defaults?.baseURL || 'http://localhost:5001/api').replace(/\/api\/?$/, '');

  // If it's a proxy streaming endpoint from Cloudflare R2 (e.g. /api/upload/file/<key> or https://api.neirah.in/api/upload/file/<key>)
  if (trimmed.includes('/api/upload/file/')) {
    const key = trimmed.split('/api/upload/file/')[1];
    return `${backendBase}/api/upload/file/${key}`;
  }

  // If it's a private Cloudflare R2 S3 API URL (e.g. https://telecrm...r2.cloudflarestorage.com/<key>)
  if (trimmed.includes('r2.cloudflarestorage.com/')) {
    const key = trimmed.split('r2.cloudflarestorage.com/')[1];
    return `${backendBase}/api/upload/file/${key}`;
  }

  // If it's a relative URL (/api/upload/... or /uploads/... or /featured/...)
  if (trimmed.startsWith('/')) {
    return `${backendBase}${trimmed}`;
  }

  return trimmed;
}

export default getMediaUrl;
