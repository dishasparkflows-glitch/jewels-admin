const STOREFRONT_URL = (import.meta.env.VITE_WEBSITE_URL || 'http://localhost:5174').replace(/\/$/, '');

export const getProductPreviewUrl = (product) => {
  const identifier =
    product?.basicInfo?.slug || product?.slug || product?._id || product?.id;
  if (!identifier) return null;

  return `${STOREFRONT_URL}/product/${encodeURIComponent(identifier)}`;
};

export const openProductPreview = (product) => {
  const url = getProductPreviewUrl(product);
  if (url) window.open(url, '_blank', 'noopener,noreferrer');
  return Boolean(url);
};
