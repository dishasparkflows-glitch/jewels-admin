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
  seedDefaults: () => api.post('/home-sections/seed'),
  getPublic: (params) => api.get('/home-sections/public', { params }),
};
