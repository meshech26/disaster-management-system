import React, { createContext, useContext, useEffect, useState } from 'react';
import { socketService } from '../services/socketService';
import { useAuth } from './AuthContext';

const SocketContext = createContext(undefined);

export const SocketProvider = ({ children }) => {
  const { user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [activeSosAlerts, setActiveSosAlerts] = useState([]);
  const [latestBroadcast, setLatestBroadcast] = useState(null);

  useEffect(() => {
    const socket = socketService.connect();

    const onConnect = () => {
      setIsConnected(true);
      if (user) {
        socketService.joinRole(user.role, user.id || user._id);
      }
    };

    const onDisconnect = () => {
      setIsConnected(false);
    };

    const onSosBeacon = (sos) => {
      setActiveSosAlerts((prev) => [sos, ...prev.filter((item) => item._id !== sos._id)]);
    };

    const onSosStatusChanged = (updatedSos) => {
      setActiveSosAlerts((prev) => {
        if (updatedSos.status === 'RESOLVED' || updatedSos.status === 'CANCELLED') {
          return prev.filter((item) => item._id !== updatedSos._id);
        }
        return prev.map((item) => (item._id === updatedSos._id ? updatedSos : item));
      });
    };

    const onEmergencyAlertBroadcast = (broadcast) => {
      setLatestBroadcast(broadcast);
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('emergency_sos_beacon', onSosBeacon);
    socket.on('sos_status_changed', onSosStatusChanged);
    socket.on('emergency_alert_broadcast', onEmergencyAlertBroadcast);

    if (socket.connected) {
      onConnect();
    }

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('emergency_sos_beacon', onSosBeacon);
      socket.off('sos_status_changed', onSosStatusChanged);
      socket.off('emergency_alert_broadcast', onEmergencyAlertBroadcast);
    };
  }, [user]);

  const dismissBroadcast = () => {
    setLatestBroadcast(null);
  };

  const addSosAlert = (sos) => {
    setActiveSosAlerts((prev) => [sos, ...prev.filter((i) => i._id !== sos._id)]);
  };

  const removeSosAlert = (sosId) => {
    setActiveSosAlerts((prev) => prev.filter((i) => i._id !== sosId));
  };

  return (
    <SocketContext.Provider
      value={{
        isConnected,
        activeSosAlerts,
        latestBroadcast,
        dismissBroadcast,
        addSosAlert,
        removeSosAlert
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};
