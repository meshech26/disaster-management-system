import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Header } from '../../components/Header';
import { DisasterMap } from '../../components/DisasterMap';
import { useLocation } from '../../hooks/useLocation';
import { useSocket } from '../../context/SocketContext';
import { incidentService } from '../../services/incidentService';
import { shelterService } from '../../services/shelterService';

export default function MapScreen() {
  const { location, loading: locationLoading } = useLocation();
  const { activeSosAlerts } = useSocket();

  const [incidents, setIncidents] = useState([]);
  const [shelters, setShelters] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    const loadMapData = async () => {
      try {
        const [incRes, shelterRes] = await Promise.all([
          incidentService.getIncidents(),
          shelterService.getShelters()
        ]);
        setIncidents(incRes.data || []);
        setShelters(shelterRes.data || []);
      } catch (err) {
        console.warn('Failed to load map data:', err);
      } finally {
        setDataLoading(false);
      }
    };

    loadMapData();
  }, []);

  if (locationLoading || dataLoading) {
    return (
      <View className="flex-1 bg-slate-950 justify-center items-center">
        <ActivityIndicator size="large" color="#EF4444" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-slate-950">
      <Header title="LIVE CRISIS MAP" />
      <View className="flex-1">
        <DisasterMap
          userLocation={location}
          incidents={incidents}
          shelters={shelters}
          sosAlerts={activeSosAlerts}
        />
      </View>
    </View>
  );
}
