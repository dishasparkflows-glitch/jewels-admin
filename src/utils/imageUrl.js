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

/**
 * Standardized helper to extract the primary image/thumbnail from any product object
 * (Jewelry product, Ornate product, or catalog record).
 * @param {Object} p - Product object
 * @returns {string} URL of the primary image or empty string
 */
export function getProductThumbnail(p) {
  if (!p) return '';
  if (p.images && p.images[0]) {
    const img = p.images[0];
    return typeof img === 'string' ? img : (img.url || img.src || '');
  }
  if (p.ornate?.ornateImages && p.ornate.ornateImages[0]) {
    const img = p.ornate.ornateImages[0];
    return typeof img === 'string' ? img : (img.url || img.src || '');
  }
  if (p.colorImages && p.colorImages[0]?.images?.[0]) {
    const img = p.colorImages[0].images[0];
    return typeof img === 'string' ? img : (img.url || img.src || '');
  }
  return '';
}

export const getImageUrl = getMediaUrl;
export const getProductImage = getProductThumbnail;

export default getMediaUrl;
