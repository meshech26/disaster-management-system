import api from './api';

export const sosService = {
  triggerSos: async (data) => {
    return await api.post('/sos', data);
  },

  getActiveSosAlerts: async () => {
    return await api.get('/sos');
  },

  getMyActiveSos: async () => {
    return await api.get('/sos/me');
  },

  getSosById: async (id) => {
    return await api.get(`/sos/${id}`);
  },

  updateSosStatus: async (id, status, notes) => {
    return await api.patch(`/sos/${id}/status`, { status, notes });
  }
};
