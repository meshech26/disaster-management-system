import React, { useMemo } from 'react';
import { View, StyleSheet, Platform, Text } from 'react-native';

export default function DutyOfficerMap({ latitude = 6.9452, longitude = 79.8821, address = 'Kelanimulla, Colombo', height = 240 }) {
  const mapHtml = useMemo(() => {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        <style>
          body, html, #map { margin: 0; padding: 0; width: 100%; height: 100%; background: #F1F5F9; }
          .leaflet-popup-content-wrapper {
            background: #0F172A;
            color: #FFFFFF;
            border-radius: 8px;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            font-size: 12px;
          }
          .leaflet-popup-tip { background: #0F172A; }
        </style>
      </head>
      <body>
        <div id="map"></div>
        <script>
          const lat = ${latitude};
          const lng = ${longitude};
          const map = L.map('map', {
            center: [lat, lng],
            zoom: 14,
            zoomControl: true
          });

          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '© OpenStreetMap'
          }).addTo(map);

          const redIcon = L.icon({
            iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
            shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            shadowSize: [41, 41]
          });

          const marker = L.marker([lat, lng], { icon: redIcon }).addTo(map);
          marker.bindPopup("<b>Hazard Location</b><br/>${address.replace(/"/g, '&quot;')}").openPopup();
        </script>
      </body>
      </html>
    `;
  }, [latitude, longitude, address]);

  if (Platform.OS === 'web') {
    return (
      <View style={[styles.container, { height }]}>
        <iframe
          srcDoc={mapHtml}
          title="Hazard Location Map"
          style={{
            width: '100%',
            height: '100%',
            border: 'none',
            borderRadius: 12
          }}
        />
      </View>
    );
  }

  return (
    <View style={[styles.container, { height, justifyContent: 'center', alignItems: 'center', backgroundColor: '#E2E8F0' }]}>
      <Text style={{ color: '#64748B', fontSize: 13 }}>Map view available on Web / Desktop</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC'
  }
});
