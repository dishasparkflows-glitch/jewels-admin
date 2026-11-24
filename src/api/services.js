import api from './axios';

// ─── Auth ─────────────────────────────────────────
export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  getMe: () => api.get('/auth/me'),
  changePassword: (data) => api.post('/auth/change-password', data),
};

// ─── Products ─────────────────────────────────────
export const productsAPI = {
  getAll: (params) => api.get('/products', { params }),
  getById: (id) => api.get(`/products/${id}`),
  create: (data) => api.post('/products', data),
  update: (id, data) => api.put(`/products/${id}`, data),
  delete: (id) => api.delete(`/products/${id}`),
  bulkDelete: (ids) => api.post('/products/bulk-delete', { ids }),
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
  delete: (key) => api.delete('/upload', { data: typeof key === 'object' ? key : { key } }),
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
};

// ─── Theme management ─────────────────────────
export const themesAPI = {
  getAll: (params) => api.get('/themes', { params }),
  getById: (id) => api.get(`/themes/${id}`),
  create: (data) => api.post('/themes', data),
  update: (id, data) => api.put(`/themes/${id}`, data),
  duplicate: (id) => api.post(`/themes/${id}/duplicate`),
  preview: (id) => api.get(`/themes/${id}/preview`),
  publish: (id, data = {}) => api.post(`/themes/${id}/publish`, data),
  rollback: (id) => api.post(`/themes/${id}/rollback`),
  archive: (id) => api.post(`/themes/${id}/archive`),
  remove: (id) => api.delete(`/themes/${id}`),
  // Theme Media Mapping & Activation
  getModules: () => api.get('/themes/modules'),
  getMappingRecords: (themeId, params) => api.get(`/themes/${themeId}/media-mapping/records`, { params }),
  getMappingSummary: (themeId) => api.get(`/themes/${themeId}/media-mapping/summary`),
  getMappings: (themeId, params) => api.get(`/themes/${themeId}/media-mappings`, { params }),
  saveMapping: (themeId, data) => api.put(`/themes/${themeId}/media-mappings`, data),
  saveMappingsBulk: (themeId, data) => api.put(`/themes/${themeId}/media-mappings/bulk`, data),
  deleteMapping: (themeId, mappingId) => api.delete(`/themes/${themeId}/media-mappings/${mappingId}`),
  deleteMappingByTarget: (themeId, params) => api.delete(`/themes/${themeId}/media-mappings`, { params }),
  activateTheme: (themeId) => api.post(`/themes/${themeId}/activate`),
  getHistory: (themeId) => api.get('/themes/history', { params: themeId ? { themeId } : {} }),
  getLookup: () => api.get('/themes/lookup'),
  getMediaLibrary: (themeId) => api.get(`/themes/${themeId}/media-library`),
  saveMedia: (themeId, data) => api.put(`/themes/${themeId}/media`, data),
};
export const websiteThemesAPI = themesAPI;

// ─── Top Announcements ────────────────────────────
export const topAnnouncementsAPI = {
  getAll: (params) => api.get('/top-announcements', { params }),
  getById: (id) => api.get(`/top-announcements/${id}`),
  getSettings: () => api.get('/settings'),
  updateSettings: (data) => api.put('/settings', { topAnnouncement: data }),
  create: (data) => api.post('/top-announcements', data),
  update: (id, data) => api.put(`/top-announcements/${id}`, data),
  delete: (id) => api.delete(`/top-announcements/${id}`),
  toggleStatus: (id) => api.patch(`/top-announcements/${id}/toggle-status`),
  reorder: (items) => api.put('/top-announcements/reorder', { items }),
  getPublic: () => api.get('/top-announcements/public'),
};

// ─── Diamonds ─────────────────────────────────────
export const diamondsAPI = {
  getAll: (params) => api.get('/diamonds', { params }),
  getById: (id) => api.get(`/diamonds/${id}`),
  getBySku: (sku) => api.get(`/diamonds/sku/${sku}`),
  getAttributes: () => api.get('/diamonds/attributes'),
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
  bulkDelete: (ids) => api.post('/blog-categories/bulk-delete', { ids }),
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
  bulkDelete: (ids) => api.post('/blogs/bulk-delete', { ids }),
  update: (id, data) => api.put(`/blogs/${id}`, data),
  delete: (id) => api.delete(`/blogs/${id}`),
};

// ─── Banners & Sections ───────────────────────────
export const bannersAPI = {
  getAll: (params) => api.get('/banners', { params }),
  getLookup: (params) => api.get('/banners/lookup', { params }),
  getThemeLookup: (params) => api.get('/banners/lookup', { params }),
  getById: (id) => api.get(`/banners/${id}`),
  create: (data) => api.post('/banners', data),
  update: (id, data) => api.put(`/banners/${id}`, data),
  delete: (id) => api.delete(`/banners/${id}`),
  getCounts: () => api.get('/banners/counts'),
  getThemesLookup: () => api.get('/themes/lookup'),
  getThemeImages: (params) => api.get('/gallery', { params }),
};

// ─── Featured (Celebrate & Gifts) ─────────────────
export const featuredAPI = {
  getAll: (params) => api.get('/featured', { params }),
  getLookup: (params) => api.get('/featured/lookup', { params }),
  getThemeLookup: (params) => api.get('/featured/lookup', { params: { theme: true, ...params } }),
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

// ─── Static Pages ─────────────────────────────────
export const staticPagesAPI = {
  getAll: (params) => api.get('/static-pages', { params }),
  getById: (id) => api.get(`/static-pages/${id}`),
  getBySlug: (slug) => api.get(`/static-pages/slug/${slug}`),
  create: (data) => api.post('/static-pages', data),
  bulkDelete: (ids) => api.post('/static-pages/bulk-delete', { ids }),
  update: (id, data) => api.put(`/static-pages/${id}`, data),
  delete: (id) => api.delete(`/static-pages/${id}`),
};


// ─── VTO Masters ──────────────────────────────────
export const vtoMastersAPI = {
  getAll: (params) => api.get('/vto-masters', { params }),
  getLookup: (params) => api.get('/vto-masters/lookup', { params }),
  getById: (id) => api.get(`/vto-masters/${id}`),
  getByBodyPart: (bodyPart) => api.get(`/vto-masters/part/${bodyPart}`),
  create: (data) => api.post('/vto-masters', data),
  update: (id, data) => api.put(`/vto-masters/${id}`, data),
  delete: (id) => api.delete(`/vto-masters/${id}`),
};

// --- Media & Theme Gallery -------------------------
export const galleryAPI = {
  getLookup: (params) => api.get('/gallery/lookup', { params }),
  getAll: (params) => api.get('/gallery', { params }),
  getOne: (id) => api.get('/gallery/' + id),
  create: (data) => api.post('/gallery', data),
  uploadAssign: (data) => api.post('/gallery/upload-assign', data),
  update: (id, data) => api.put('/gallery/' + id, data),
  toggleStatus: (id) => api.patch('/gallery/' + id + '/status'),
  getThemes: () => api.get('/themes/lookup'),
  getBanners: (params) => api.get('/gallery/banners', { params }),
  getFeatureds: (params) => api.get('/gallery/featured', { params }),
  deleteItem: (id, params) => api.delete('/gallery/' + id, { params }),
};

// ─── Currencies ───────────────────────────────────
export const currenciesAPI = {
  getAll: (params) => api.get('/currencies', { params }),
  getById: (id) => api.get(`/currencies/${id}`),
  getByCode: (code) => api.get(`/currencies/code/${code}`),
  create: (data) => api.post('/currencies', data),
  bulkDelete: (ids) => api.post('/currencies/bulk-delete', { ids }),
  update: (id, data) => api.put(`/currencies/${id}`, data),
  delete: (id) => api.delete(`/currencies/${id}`),
  syncLiveRates: () => api.post('/currencies/sync-rates'),
  syncOneRate: (id) => api.post(`/currencies/${id}/sync`),
};

// ─── Shiprocket Logistics ──────────────────────────
export const logisticsAPI = {
  getCourierRates: (orderId) => api.get(`/shiprocket/rates/${orderId}`),
  createShipment: (orderId, data) => api.post(`/shiprocket/create-shipment/${orderId}`, data),
  assignAwb: (orderId, data) => api.post(`/shiprocket/assign-awb/${orderId}`, data),
  getLabel: (orderId) => api.get(`/shiprocket/label/${orderId}`),
  getManifest: (orderId) => api.get(`/shiprocket/manifest/${orderId}`),
  trackOrder: (orderId) => api.get(`/shiprocket/track/${orderId}`),
  cancelShipment: (orderId) => api.post('/shiprocket/cancel', { orderId }),
  createReturnShipment: (returnId, data) => api.post(`/shiprocket/create-return-shipment/${returnId}`, data),
  getReturnLabel: (returnId) => api.get(`/shiprocket/return-label/${returnId}`),
  trackReturn: (returnId) => api.get(`/shiprocket/track-return/${returnId}`),
};

// ─── Analytics ────────────────────────────────────
export const analyticsAPI = {
  getOverview: (params) => api.get('/analytics/overview', { params }),
  getDashboard: (params) => api.get('/analytics/dashboard', { params }),
  getDashboardSales: () => api.get('/analytics/dashboard-sales'),
  getAddToCartReport: (params) => api.get('/analytics/products/add-to-cart', { params }),
  getWishlistReport: (params) => api.get('/analytics/products/wishlist', { params }),
  getViewsReport: (params) => api.get('/analytics/products/views', { params }),
  getStatus: () => api.get('/analytics/status'),
  getHealth: () => api.get('/analytics/health'),
};

// ─── Dashboard ────────────────────────────────────
export const dashboardAPI = {
  getCounts: () => api.get('/dashboard/stats'),
  getSales: () => api.get('/dashboard/sales'),
};

// ─── Metal Colors ─────────────────────────────────
export const metalColorsAPI = {
  getLookup: () => api.get('/metal-colors/lookup'),
  getAll: (params) => api.get('/metal-colors', { params }),
};

