import api from './api';

export const shelterService = {
  getShelters: async (params) => {
    return await api.get('/shelters', { params });
  },

  getShelterById: async (id) => {
    return await api.get(`/shelters/${id}`);
  },

  createShelter: async (data) => {
    return await api.post('/shelters', data);
  },

  updateOccupancy: async (id, data) => {
    return await api.patch(`/shelters/${id}/occupancy`, data);
  },

  getBroadcasts: async () => {
    return await api.get('/broadcasts');
  }
};
