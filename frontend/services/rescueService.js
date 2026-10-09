import api from './api';

export const rescueService = {
  getTeams: async (params) => {
    return await api.get('/rescue/teams', { params });
  },

  getCategories: async (params) => {
    return await api.get('/rescue/categories', { params });
  },

  getMissions: async (params) => {
    return await api.get('/rescue/missions', { params });
  },

  getCurrentMission: async (params) => {
    return await api.get('/rescue/missions/current', { params });
  },

  assignTeam: async (data) => {
    return await api.post('/rescue/assign', data);
  },

  updateStatus: async (missionId, status, additionalData = {}) => {
    return await api.patch(`/rescue/missions/${missionId}/status`, { status, ...additionalData });
  },

  sendUpdateMessage: async (missionId, message, location = null) => {
    return await api.post(`/rescue/missions/${missionId}/update-message`, { message, location });
  }
};

export default rescueService;
