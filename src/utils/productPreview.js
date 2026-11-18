import api from '../api/axios';
import { VITE_FRONT_URL } from '../config/env';

const slugify = (text) =>
  String(text || '')
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-');

export const getProductPreviewUrl = (product) => {
  if (!product) return null;
  const slug =
    product?.basicInfo?.slug ||
    product?.slug ||
    slugify(product?.basicInfo?.title || product?.title);

  if (!slug) return null;
  return `${VITE_FRONT_URL}/product/${encodeURIComponent(slug)}`;
};

export const openProductPreview = async (product) => {
  if (!product) return false;

  let slug =
    typeof product === 'object'
      ? product?.basicInfo?.slug ||
        product?.slug ||
        slugify(product?.basicInfo?.title || product?.title)
      : '';

  const id = typeof product === 'string' ? product : (product?._id || product?.id);

  if (!slug && id) {
    try {
      const res = await api.get(`/products/${id}`);
      const data = res.data?.data;
      slug =
        data?.basicInfo?.slug ||
        data?.slug ||
        slugify(data?.basicInfo?.title || data?.title);
    } catch {
      // ignore
    }
  }

  if (slug) {
    const url = `${VITE_FRONT_URL}/product/${encodeURIComponent(slug)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
    return true;
  }
  return false;
};
