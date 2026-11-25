import axios from 'axios';
import { getAdminPageSize } from '../utils/adminPagination';

const API_BASE_URL = import.meta.env.VITE_API_URL;

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - attach token & default pagination limit
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Default pagination limit to admin's selected size if page is set without limit
    if (config.method?.toLowerCase() === 'get') {
      const adminLimit = getAdminPageSize(10);
      if (config.params && config.params.page !== undefined && config.params.limit === undefined) {
        config.params.limit = adminLimit;
      }
      if (typeof config.url === 'string') {
        const hasPage = /[?&]page=\d+/.test(config.url);
        const hasLimit = /[?&]limit=\d+/.test(config.url);
        if (hasPage && !hasLimit) {
          const sep = config.url.includes('?') ? '&' : '?';
          config.url = `${config.url}${sep}limit=${adminLimit}`;
        }
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');

      // Do NOT trigger hard redirect / reload if calling auth endpoints or if already on an auth page
      const isAuthUrl =
        error.config?.url?.includes('/auth/login') ||
        error.config?.url?.includes('/auth/register') ||
        error.config?.url?.includes('/auth/forgot-password') ||
        error.config?.url?.includes('/auth/reset-password');
      const isAuthPage =
        window.location.pathname === '/login' ||
        window.location.pathname === '/forgot-password' ||
        window.location.pathname === '/reset-password';

      if (!isAuthUrl && !isAuthPage) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
