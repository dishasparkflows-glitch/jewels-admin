import api from '../api/axios';
import { VITE_FRONT_URL } from '../config/env';
import { slugify } from './formatters';

export const getFrontBaseUrl = () => {
  if (typeof window !== 'undefined' && window.location?.hostname) {
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return `${window.location.protocol}//${window.location.hostname}:5173`;
    }
  }
  if (VITE_FRONT_URL) return VITE_FRONT_URL.replace(/\/$/, '');
  if (typeof window !== 'undefined') {
    return `${window.location.protocol}//${window.location.hostname}:5173`;
  }
  return 'http://localhost:5173';
};

export const getProductPreviewUrl = (product) => {
  if (!product) return null;
  const slug =
    product?.basicInfo?.slug ||
    product?.slug ||
    slugify(product?.basicInfo?.title || product?.title);

  if (!slug) return null;
  return `${getFrontBaseUrl()}/product/${encodeURIComponent(slug)}`;
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
    const url = `${getFrontBaseUrl()}/product/${encodeURIComponent(slug)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
    return true;
  }
  return false;
};

export const getDiamondPreviewUrl = (diamond) => {
  if (!diamond) return null;
  const target =
    typeof diamond === 'object'
      ? diamond?.sku || diamond?.slug || diamond?.stockNumber || diamond?._id || diamond?.id
      : diamond;

  if (!target) return null;
  return `${getFrontBaseUrl()}/diamond/${encodeURIComponent(target)}`;
};

export const openDiamondPreview = (diamond) => {
  if (!diamond) return false;
  const url = getDiamondPreviewUrl(diamond);
  if (url) {
    window.open(url, '_blank', 'noopener,noreferrer');
    return true;
  }
  return false;
};
