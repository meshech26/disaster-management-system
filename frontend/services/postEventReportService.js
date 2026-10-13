import api from './api';

// `api` already unwraps axios responses to the server's { success, message, data } body,
// so each helper returns `.data` (the payload) directly.
export const postEventReportService = {
  // Step 1: completed warnings (disaster events) that can be audited
  getEvents: async (params = {}) => (await api.get('/post-event-reports/events', { params })).data,

  // Start compiling a report -> { reportId, status }
  generate: async (payload) => (await api.post('/post-event-reports/generate', payload)).data,

  // Poll while compiling -> { status, progress, stages, error }
  getStatus: async (id) => (await api.get(`/post-event-reports/${id}/status`)).data,

  // Full compiled report
  getReport: async (id) => (await api.get(`/post-event-reports/${id}`)).data,

  // Re-computes the SHA-256 seal -> { valid, stored, recomputed }
  verify: async (id) => (await api.get(`/post-event-reports/${id}/verify`)).data,

  archive: async (id) => (await api.patch(`/post-event-reports/${id}/archive`)).data
};
