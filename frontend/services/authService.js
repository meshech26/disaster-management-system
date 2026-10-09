import api from './api';

export const authService = {
  register: async (data) => {
    return await api.post('/auth/register', data);
  },

  login: async (credentials) => {
    return await api.post('/auth/login', credentials);
  },

  getMe: async () => {
    return await api.get('/auth/me');
  },

  updateLocation: async (lat, lon, address) => {
    return await api.put('/auth/location', {
      latitude: lat,
      longitude: lon,
      address
    });
  },

  updatePushToken: async (expoPushToken) => {
    return await api.put('/auth/push-token', { expoPushToken });
  },

  addEmergencyContact: async (contact) => {
    return await api.post('/auth/emergency-contacts', contact);
  }
};
