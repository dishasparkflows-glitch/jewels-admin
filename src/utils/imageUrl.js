/**
 * Returns the media/image URL directly as provided by Cloudflare.
 * @param {string|object} url
 * @returns {string}
 */
export function getMediaUrl(url) {
  if (!url) return '';
  if (typeof url === 'object') {
    return (url.url || url.src || '').trim();
  }
  if (typeof url !== 'string') return '';
  return url.trim();
}

export const getImageUrl = getMediaUrl;

export default getMediaUrl;
