import api from './axios';

// ─── Auth ─────────────────────────────────────────
export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  getMe: () => api.get('/auth/me'),
  changePassword: (data) => api.post('/auth/change-password', data),
};

// ─── Users ────────────────────────────────────────
export const usersAPI = {
  getAll: (params) => api.get('/users', { params }),
  getById: (id) => api.get(`/users/${id}`),
  create: (data) => api.post('/users', data),
  update: (id, data) => api.put(`/users/${id}`, data),
  delete: (id) => api.delete(`/users/${id}`),
  toggleStatus: (id) => api.patch(`/users/${id}/toggle-status`),
  getMe: () => api.get('/users/me'),
  updateMe: (data) => api.put('/users/me', data),
};

// ─── Notifications ────────────────────────────────
export const notificationsAPI = {
  getAll: (params) => api.get('/notifications', { params }),
  getUnreadCount: () => api.get('/notifications/unread-count'),
  markAsRead: (id) => api.patch(`/notifications/${id}/read`),
  markAllAsRead: () => api.patch('/notifications/read-all'),
  delete: (id) => api.delete(`/notifications/${id}`),
};

// ─── Upload ───────────────────────────────────────
export const uploadAPI = {
  getPresignedUrl: (data) => api.post('/upload/presigned-url', data),
  delete: (filepath) => api.delete('/upload', { data: { filepath } }),
};

// ─── Home Sections ────────────────────────────────
export const homeSectionsAPI = {
  getAll: (params) => api.get('/home-sections', { params }),
  getById: (id) => api.get(`/home-sections/${id}`),
  create: (data) => api.post('/home-sections', data),
  update: (id, data) => api.put(`/home-sections/${id}`, data),
  delete: (id) => api.delete(`/home-sections/${id}`),
  toggleStatus: (id) => api.patch(`/home-sections/${id}/toggle-status`),
  reorder: (items) => api.put('/home-sections/reorder', { items }),
  bulkDelete: (ids) => api.post('/home-sections/bulk-delete', { ids }),
  getPublic: (params) => api.get('/home-sections/public', { params }),
};

// ─── Website theme management ─────────────────────────
export const websiteThemesAPI = {
  getAll: (params) => api.get('/website/themes', { params }),
  getById: (id) => api.get(`/website/themes/${id}`),
  create: (data) => api.post('/website/themes', data),
  update: (id, data) => api.put(`/website/themes/${id}`, data),
  duplicate: (id) => api.post(`/website/themes/${id}/duplicate`),
  preview: (id) => api.get(`/website/themes/${id}/preview`),
  publish: (id, data = {}) => api.post(`/website/themes/${id}/publish`, data),
  rollback: (id) => api.post(`/website/themes/${id}/rollback`),
  archive: (id) => api.post(`/website/themes/${id}/archive`),
  remove: (id) => api.delete(`/website/themes/${id}`),
  getHistory: (themeId) => api.get('/website/themes/history', { params: themeId ? { themeId } : {} }),
  getMediaLibrary: (themeId) => api.get(`/website/themes/${themeId}/media-library`),
  saveMedia: (themeId, data) => api.put(`/website/themes/${themeId}/media`, data),
};

// ─── Top Announcements ────────────────────────────
export const topAnnouncementsAPI = {
  getAll: (params) => api.get('/top-announcements', { params }),
  getById: (id) => api.get(`/top-announcements/${id}`),
  getSettings: () => api.get('/top-announcements/settings'),
  updateSettings: (data) => api.put('/top-announcements/settings', data),
  create: (data) => api.post('/top-announcements', data),
  update: (id, data) => api.put(`/top-announcements/${id}`, data),
  delete: (id) => api.delete(`/top-announcements/${id}`),
  toggleStatus: (id) => api.patch(`/top-announcements/${id}/toggle-status`),
  duplicate: (id) => api.post(`/top-announcements/${id}/duplicate`),
  reorder: (items) => api.put('/top-announcements/reorder', { items }),
  getPublic: () => api.get('/top-announcements/public'),
};

// ─── Diamonds ─────────────────────────────────────
export const diamondsAPI = {
  getAll: (params) => api.get('/diamonds', { params }),
  getById: (id) => api.get(`/diamonds/${id}`),
  getBySku: (sku) => api.get(`/diamonds/sku/${sku}`),
  getAttributes: () => api.get('/diamonds/attributes'),
  getOptions: () => api.get('/diamonds/attributes'),
  getLookup: (params) => api.get('/diamonds/lookup', { params }),
  create: (data) => api.post('/diamonds', data),
  bulkCreate: (items) => api.post('/diamonds/bulk', { items }),
  update: (id, data) => api.put(`/diamonds/${id}`, data),
  delete: (id) => api.delete(`/diamonds/${id}`),
};

// ─── Blog Categories ──────────────────────────────
export const blogCategoriesAPI = {
  getAll: (params) => api.get('/blog-categories', { params }),
  getLookup: () => api.get('/blog-categories/lookup'),
  getById: (id) => api.get(`/blog-categories/${id}`),
  getBySlug: (slug) => api.get(`/blog-categories/slug/${slug}`),
  create: (data) => api.post('/blog-categories', data),
  update: (id, data) => api.put(`/blog-categories/${id}`, data),
  delete: (id) => api.delete(`/blog-categories/${id}`),
};

// ─── Blogs ────────────────────────────────────────
export const blogsAPI = {
  getAll: (params) => api.get('/blogs', { params }),
  getById: (id) => api.get(`/blogs/${id}`),
  getBySlug: (slug) => api.get(`/blogs/slug/${slug}`),
  getRecent: (limit = 4) => api.get(`/blogs/recent?limit=${limit}`),
  create: (data) => api.post('/blogs', data),
  update: (id, data) => api.put(`/blogs/${id}`, data),
  delete: (id) => api.delete(`/blogs/${id}`),
};

// ─── Banners & Sections ───────────────────────────
export const bannersAPI = {
  getAll: (params) => api.get('/banners', { params }),
  getById: (id) => api.get(`/banners/${id}`),
  create: (data) => api.post('/banners', data),
  update: (id, data) => api.put(`/banners/${id}`, data),
  delete: (id) => api.delete(`/banners/${id}`),
};

// ─── Featured (Celebrate & Gifts) ─────────────────
export const featuredAPI = {
  getAll: (params) => api.get('/featured', { params }),
  getById: (id) => api.get(`/featured/${id}`),
  create: (data) => api.post('/featured', data),
  update: (id, data) => api.put(`/featured/${id}`, data),
  delete: (id) => api.delete(`/featured/${id}`),
};

// ─── Categories ───────────────────────────────────
export const categoriesAPI = {
  getAll: (params) => api.get('/categories', { params }),
  getLookup: (params) => api.get('/categories/lookup', { params }),
  getById: (id) => api.get(`/categories/${id}`),
};

