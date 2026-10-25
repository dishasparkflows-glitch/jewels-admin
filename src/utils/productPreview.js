import api from '../api/axios';

const STOREFRONT_URL = (import.meta.env.VITE_WEBSITE_URL || 'http://localhost:5174').replace(/\/$/, '');

const slugify = (text) =>
  String(text || '')
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-');

export const getProductPreviewUrl = (product) => {
  const slug =
    product?.basicInfo?.slug ||
    product?.slug ||
    slugify(product?.basicInfo?.title || product?.title || product?.name);

  if (!slug) return null;
  return `${STOREFRONT_URL}/product/${encodeURIComponent(slug)}`;
};

export const openProductPreview = async (product) => {
  let slug =
    product?.basicInfo?.slug ||
    product?.slug ||
    slugify(product?.basicInfo?.title || product?.title || product?.name);

  const id = product?._id || product?.id;

  if (!slug && id) {
    try {
      const res = await api.get(`/products/${id}`);
      const data = res.data?.data;
      slug =
        data?.basicInfo?.slug ||
        data?.slug ||
        slugify(data?.basicInfo?.title || data?.title || data?.name);
    } catch (_) {}
  }

  if (slug) {
    const url = `${STOREFRONT_URL}/product/${encodeURIComponent(slug)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
    return true;
  }
  return false;
};
