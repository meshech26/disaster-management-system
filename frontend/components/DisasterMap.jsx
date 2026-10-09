import React, { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export const DisasterMap = ({
  userLocation,
  incidents = [],
  shelters = [],
  sosAlerts = []
}) => {
  const [filter, setFilter] = useState('all');

  const mapHtml = useMemo(() => {
    const markers = [];

    // User location marker
    markers.push(`
      L.circleMarker([${userLocation.latitude}, ${userLocation.longitude}], {
        radius: 9,
        fillColor: '#38BDF8',
        color: '#FFFFFF',
        weight: 3,
        opacity: 1,
        fillOpacity: 0.95
      }).addTo(map).bindPopup("<b>📍 Your Current Location</b>");
    `);

    // Incidents
    if (filter === 'all' || filter === 'incidents') {
      incidents.forEach((inc) => {
        const [lng, lat] = inc.location.coordinates;
        const color =
          inc.severity === 'critical'
            ? '#EF4444'
            : inc.severity === 'high'
            ? '#F97316'
            : '#EAB308';
        markers.push(`
          L.circleMarker([${lat}, ${lng}], {
            radius: 8,
            fillColor: '${color}',
            color: '#FFFFFF',
            weight: 2,
            opacity: 1,
            fillOpacity: 0.9
          }).addTo(map).bindPopup("<b>⚠️ ${inc.title.replace(/"/g, '\\"')}</b><br/>Type: ${inc.disasterType}<br/>Severity: ${inc.severity}<br/><small>${(inc.location.address || '').replace(/"/g, '\\"')}</small>");
        `);
      });
    }

    // Shelters
    if (filter === 'all' || filter === 'shelters') {
      shelters.forEach((sh) => {
        const [lng, lat] = sh.location.coordinates;
        markers.push(`
          L.circleMarker([${lat}, ${lng}], {
            radius: 8,
            fillColor: '#10B981',
            color: '#FFFFFF',
            weight: 2,
            opacity: 1,
            fillOpacity: 0.9
          }).addTo(map).bindPopup("<b>🛡️ ${sh.name.replace(/"/g, '\\"')}</b><br/>Status: ${sh.status}<br/>Capacity: ${sh.currentOccupancy}/${sh.totalCapacity}<br/><small>${(sh.location.address || '').replace(/"/g, '\\"')}</small>");
        `);
      });
    }

    // SOS Alerts
    if (filter === 'all' || filter === 'sos') {
      sosAlerts.forEach((sos) => {
        const [lng, lat] = sos.location.coordinates;
        markers.push(`
          L.circleMarker([${lat}, ${lng}], {
            radius: 11,
            fillColor: '#DC2626',
            color: '#FEE2E2',
            weight: 3,
            opacity: 1,
            fillOpacity: 1
          }).addTo(map).bindPopup("<b>🚨 EMERGENCY SOS</b><br/>Victim: ${(sos.userId?.name || 'Citizen').replace(/"/g, '\\"')}<br/>People: ${sos.peopleCount}<br/><small>${(sos.location?.address || '').replace(/"/g, '\\"')}</small>");
        `);
      });
    }

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        <style>
          body, html, #map { margin: 0; padding: 0; width: 100%; height: 100%; background: #0F172A; }
          .leaflet-popup-content-wrapper {
            background: #1E293B;
            color: #F8FAFC;
            border: 1px solid #334155;
            border-radius: 12px;
            font-family: system-ui, -apple-system, sans-serif;
          }
          .leaflet-popup-tip { background: #1E293B; }
          .leaflet-tile { filter: brightness(0.85) invert(1) contrast(3) hue-rotate(200deg) saturate(0.35); }
        </style>
      </head>
      <body>
        <div id="map"></div>
        <script>
          var map = L.map('map', {
            zoomControl: false,
            attributionControl: false
          }).setView([${userLocation.latitude}, ${userLocation.longitude}], 13);

          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19
          }).addTo(map);

          L.control.zoom({ position: 'topright' }).addTo(map);

          ${markers.join('\n')}
        </script>
      </body>
      </html>
    `;
  }, [userLocation, incidents, shelters, sosAlerts, filter]);

  return (
    <View className="flex-1 bg-slate-950 relative">
      {/* Filter Tabs overlay */}
      <View className="absolute top-3 left-3 right-3 z-20 flex-row bg-slate-900/90 p-1 rounded-2xl border border-slate-800 shadow-xl">
        {[
          { id: 'all', label: 'All Markers' },
          { id: 'incidents', label: `Disasters (${incidents.length})` },
          { id: 'shelters', label: `Shelters (${shelters.length})` },
          { id: 'sos', label: `SOS (${sosAlerts.length})` }
        ].map((tab) => (
          <TouchableOpacity
            key={tab.id}
            onPress={() => setFilter(tab.id)}
            className={`flex-1 py-1.5 rounded-xl items-center ${
              filter === tab.id ? 'bg-red-600' : 'bg-transparent'
            }`}
          >
            <Text
              className={`text-xs font-bold ${
                filter === tab.id ? 'text-white' : 'text-slate-400'
              }`}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Map Renderer (Web iframe or Webview component) */}
      <View className="flex-1">
        {Platform.OS === 'web' ? (
          <iframe
            srcDoc={mapHtml}
            title="OpenStreetMap Disaster Map"
            style={{
              width: '100%',
              height: '100%',
              border: 'none'
            }}
          />
        ) : (
          <View className="flex-1 bg-slate-900 justify-center items-center p-6">
            <Ionicons name="map" size={48} color="#38BDF8" />
            <Text className="text-white font-bold text-base mt-3">Interactive OSM Map</Text>
            <Text className="text-slate-400 text-xs text-center mt-1">
              Active Incidents: {incidents.length} | Shelters: {shelters.length} | SOS Beacons: {sosAlerts.length}
            </Text>
          </View>
        )}
      </View>

      {/* Map Legend overlay */}
      <View className="absolute bottom-4 left-4 bg-slate-900/90 p-2.5 rounded-xl border border-slate-800 z-10 flex-row items-center space-x-3">
        <View className="flex-row items-center mr-3">
          <View className="w-2.5 h-2.5 rounded-full bg-sky-400 mr-1.5" />
          <Text className="text-slate-300 text-xs">You</Text>
        </View>
        <View className="flex-row items-center mr-3">
          <View className="w-2.5 h-2.5 rounded-full bg-red-500 mr-1.5" />
          <Text className="text-slate-300 text-xs">Disaster</Text>
        </View>
        <View className="flex-row items-center mr-3">
          <View className="w-2.5 h-2.5 rounded-full bg-emerald-400 mr-1.5" />
          <Text className="text-slate-300 text-xs">Shelter</Text>
        </View>
        <View className="flex-row items-center">
          <View className="w-2.5 h-2.5 rounded-full bg-red-600 mr-1.5" />
          <Text className="text-slate-300 text-xs font-bold">SOS</Text>
        </View>
      </View>
    </View>
  );
};
