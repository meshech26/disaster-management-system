import React, { useMemo } from 'react';
import { View, StyleSheet, Platform, Text } from 'react-native';

export const SRI_LANKA_DISTRICTS = [
  { name: 'Colombo', province: 'Western', lat: 6.9271, lng: 79.8612, zoom: 12 },
  { name: 'Gampaha', province: 'Western', lat: 7.084, lng: 79.9943, zoom: 11 },
  { name: 'Kalutara', province: 'Western', lat: 6.5854, lng: 79.9607, zoom: 11 },
  { name: 'Kandy', province: 'Central', lat: 7.2906, lng: 80.6337, zoom: 11 },
  { name: 'Matale', province: 'Central', lat: 7.4675, lng: 80.6234, zoom: 11 },
  { name: 'Nuwara Eliya', province: 'Central', lat: 6.9497, lng: 80.7891, zoom: 11 },
  { name: 'Galle', province: 'Southern', lat: 6.0535, lng: 80.221, zoom: 11 },
  { name: 'Matara', province: 'Southern', lat: 5.9549, lng: 80.555, zoom: 11 },
  { name: 'Hambantota', province: 'Southern', lat: 6.1429, lng: 81.1212, zoom: 11 },
  { name: 'Jaffna', province: 'Northern', lat: 9.6615, lng: 80.0255, zoom: 11 },
  { name: 'Kilinochchi', province: 'Northern', lat: 9.3803, lng: 80.377, zoom: 11 },
  { name: 'Mannar', province: 'Northern', lat: 8.981, lng: 79.9044, zoom: 11 },
  { name: 'Vavuniya', province: 'Northern', lat: 8.7542, lng: 80.4982, zoom: 11 },
  { name: 'Mullaitivu', province: 'Northern', lat: 9.2671, lng: 80.8142, zoom: 11 },
  { name: 'Batticaloa', province: 'Eastern', lat: 7.731, lng: 81.6747, zoom: 11 },
  { name: 'Ampara', province: 'Eastern', lat: 7.2912, lng: 81.6724, zoom: 11 },
  { name: 'Trincomalee', province: 'Eastern', lat: 8.5874, lng: 81.2152, zoom: 11 },
  { name: 'Kurunegala', province: 'North Western', lat: 7.4863, lng: 80.3623, zoom: 11 },
  { name: 'Puttalam', province: 'North Western', lat: 8.0408, lng: 79.8394, zoom: 11 },
  { name: 'Anuradhapura', province: 'North Central', lat: 8.3114, lng: 80.4037, zoom: 11 },
  { name: 'Polonnaruwa', province: 'North Central', lat: 7.9403, lng: 81.0188, zoom: 11 },
  { name: 'Badulla', province: 'Uva', lat: 6.9934, lng: 81.055, zoom: 11 },
  { name: 'Monaragala', province: 'Uva', lat: 6.8728, lng: 81.3507, zoom: 11 },
  { name: 'Ratnapura', province: 'Sabaragamuwa', lat: 6.7056, lng: 80.3847, zoom: 11 },
  { name: 'Kegalle', province: 'Sabaragamuwa', lat: 7.2513, lng: 80.3464, zoom: 11 }
];

export default function DmcDistrictMap({
  districtName = 'Colombo',
  latitude,
  longitude,
  address = 'Colombo District',
  height = 240,
  interactive = false
}) {
  const selectedDistrictInfo = useMemo(() => {
    const found = SRI_LANKA_DISTRICTS.find(
      (d) => d.name.toLowerCase() === (districtName || '').toLowerCase()
    );
    return found || SRI_LANKA_DISTRICTS[0];
  }, [districtName]);

  const targetLat = latitude !== undefined && latitude !== null ? latitude : selectedDistrictInfo.lat;
  const targetLng = longitude !== undefined && longitude !== null ? longitude : selectedDistrictInfo.lng;
  const targetZoom = latitude !== undefined && latitude !== null ? 14 : selectedDistrictInfo.zoom;

  const mapHtml = useMemo(() => {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        <style>
          body, html, #map { margin: 0; padding: 0; width: 100%; height: 100%; background: #EFF6FF; }
          .leaflet-popup-content-wrapper {
            background: #0F172A;
            color: #FFFFFF;
            border-radius: 8px;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            font-size: 12px;
          }
          .leaflet-popup-tip { background: #0F172A; }
          .district-label {
            background: rgba(220, 38, 38, 0.9);
            color: #ffffff;
            font-weight: 800;
            font-size: 11px;
            padding: 3px 8px;
            border-radius: 4px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.3);
            border: 1px solid #FFFFFF;
          }
        </style>
      </head>
      <body>
        <div id="map"></div>
        <script>
          const lat = ${targetLat};
          const lng = ${targetLng};
          const zoom = ${targetZoom};
          const map = L.map('map', {
            center: [lat, lng],
            zoom: zoom,
            zoomControl: true,
            scrollWheelZoom: ${interactive}
          });

          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '© OpenStreetMap | DMC Sri Lanka'
          }).addTo(map);

          // Danger circle highlighting affected district radius
          const dangerCircle = L.circle([lat, lng], {
            color: '#DC2626',
            fillColor: '#F87171',
            fillOpacity: 0.28,
            weight: 2,
            radius: 8500
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
          marker.bindPopup("<b>${(districtName || address).replace(/"/g, '&quot;')}</b><br/>${address.replace(/"/g, '&quot;')}").openPopup();
        </script>
      </body>
      </html>
    `;
  }, [targetLat, targetLng, targetZoom, districtName, address, interactive]);

  if (Platform.OS === 'web') {
    return (
      <View style={[styles.container, { height }]}>
        <iframe
          srcDoc={mapHtml}
          style={{ width: '100%', height: '100%', border: 'none', borderRadius: 12 }}
          title="DMC District Map"
        />
      </View>
    );
  }

  return (
    <View style={[styles.container, styles.nativeFallback, { height }]}>
      <Text style={styles.fallbackTitle}>📍 {districtName} District Map</Text>
      <Text style={styles.fallbackSubtitle}>{address}</Text>
      <Text style={styles.fallbackCoords}>
        Coordinates: {Number(targetLat).toFixed(4)}° N, {Number(targetLng).toFixed(4)}° E
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#EFF6FF'
  },
  nativeFallback: {
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16
  },
  fallbackTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1E3A8A',
    marginBottom: 4
  },
  fallbackSubtitle: {
    fontSize: 12,
    color: '#475569',
    textAlign: 'center',
    marginBottom: 4
  },
  fallbackCoords: {
    fontSize: 11,
    color: '#64748B',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace'
  }
});
