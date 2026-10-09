import api from './api';

export const broadcastService = {
  // Get active emergency alerts (for citizen/volunteer live alert feed)
  getActiveBroadcasts: async () => {
    return await api.get('/broadcasts');
  },

  // Get active immediate emergency alerts (for login/app launch emergency modal)
  getActiveImmediateAlerts: async (district) => {
    return await api.get('/broadcasts/active-immediate', {
      params: { district }
    });
  },

  // Get all broadcasts with filter (draft, active, completed) for DMC Officer
  getAllBroadcasts: async (params = {}) => {
    return await api.get('/broadcasts/all', { params });
  },

  // Get summary dashboard statistics (Verified, Drafts, Active, Completed)
  getBroadcastStats: async () => {
    return await api.get('/broadcasts/stats');
  },

  // Create new warning (as draft or published active warning)
  createBroadcast: async (data) => {
    return await api.post('/broadcasts', data);
  },

  // Update existing warning or draft
  updateBroadcast: async (id, data) => {
    return await api.put(`/broadcasts/${id}`, data);
  },

  // Broadcast warning to all citizens and volunteers
  broadcastWarning: async (id) => {
    return await api.post(`/broadcasts/${id}/broadcast`);
  },

  // Trigger high-priority immediate emergency alert for affected district (10s auto-dismiss modal)
  sendImmediateAlert: async (id) => {
    return await api.post(`/broadcasts/${id}/immediate-alert`);
  },

  // Mark disaster event as completed (moves to completed warnings & triggers post-event analysis)
  completeWarning: async (id, postEventAnalysis = null) => {
    return await api.patch(`/broadcasts/${id}/complete`, { postEventAnalysis });
  },

  // Deactivate warning
  deactivateBroadcast: async (id) => {
    return await api.patch(`/broadcasts/${id}/deactivate`);
  }
};
