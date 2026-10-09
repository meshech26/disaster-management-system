import { useState, useEffect } from 'react';
import { sosService } from '../services/sosService';
import { useSocket } from '../context/SocketContext';

export const useSos = () => {
  const [activeSos, setActiveSos] = useState(null);
  const [isActivating, setIsActivating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { addSosAlert, removeSosAlert } = useSocket();

  useEffect(() => {
    checkActiveSos();
  }, []);

  const checkActiveSos = async () => {
    try {
      const res = await sosService.getMyActiveSos();
      if (res.data) {
        setActiveSos(res.data);
      }
    } catch {
      // not logged in or no active SOS
    } finally {
      setIsLoading(false);
    }
  };

  const triggerSos = async (params) => {
    setIsActivating(true);
    try {
      const res = await sosService.triggerSos(params);
      setActiveSos(res.data);
      addSosAlert(res.data);
      return res.data;
    } finally {
      setIsActivating(false);
    }
  };

  const cancelSos = async () => {
    if (!activeSos) return;
    try {
      await sosService.updateSosStatus(activeSos._id, 'CANCELLED', 'Cancelled by user');
      removeSosAlert(activeSos._id);
      setActiveSos(null);
    } catch (e) {
      console.warn('Failed to cancel SOS:', e);
    }
  };

  return {
    activeSos,
    isActivating,
    isLoading,
    triggerSos,
    cancelSos,
    checkActiveSos
  };
};
