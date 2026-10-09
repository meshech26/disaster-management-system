import api from './api';

export const incidentService = {
  getIncidents: async (params) => {
    return await api.get('/incidents', { params });
  },

  getIncidentById: async (id) => {
    return await api.get(`/incidents/${id}`);
  },

  createIncident: async (formData) => {
    return await api.post('/incidents', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  },

  updateIncidentStatus: async (id, data) => {
    return await api.patch(`/incidents/${id}/status`, data);
  },

  updateStatus: async (id, status, severity) => {
    return await api.patch(`/incidents/${id}/status`, { status, severity });
  },

  assignResponders: async (id, responderIds) => {
    return await api.post(`/incidents/${id}/assign`, { responderIds });
  }
};
