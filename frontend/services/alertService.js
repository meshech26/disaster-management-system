import { broadcastService } from './broadcastService';

export const alertService = {
  getActiveAlerts: async () => {
    return await broadcastService.getActiveBroadcasts();
  },
  ...broadcastService
};

export default alertService;
