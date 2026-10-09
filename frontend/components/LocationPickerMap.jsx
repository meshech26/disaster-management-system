import React, { useEffect, useMemo, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export const LocationPickerMap = ({
  location,
  onSelectLocation,
  address,
  height = 230
}) => {
  const iframeRef = useRef(null);
  const lat = location?.latitude || 6.9271;
  const lng = location?.longitude || 79.8612;

  useEffect(() => {
    const handleMessage = (event) => {
      if (event.data && event.data.type === 'HAZARD_LOCATION_SELECTED') {
        const selectedLat = Number(event.data.lat);
        const selectedLng = Number(event.data.lng);
        if (!isNaN(selectedLat) && !isNaN(selectedLng)) {
          onSelectLocation({
            latitude: selectedLat,
            longitude: selectedLng
          });
        }
      }
    };

    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.addEventListener('message', handleMessage);
      return () => window.removeEventListener('message', handleMessage);
    }
  }, [onSelectLocation]);

  const snapToGps = () => {
    if (iframeRef.current && iframeRef.current.contentWindow) {
      iframeRef.current.contentWindow.postMessage(
        { type: 'PAN_TO', lat, lng },
        '*'
      );
    }
  };

  const mapHtml = useMemo(() => {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        <style>
          body, html, #map { margin: 0; padding: 0; width: 100%; height: 100%; background: #F1F5F9; }
          .leaflet-popup-content-wrapper {
            background: #0F172A;
            color: #FFFFFF;
            border-radius: 10px;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            font-size: 12px;
            padding: 4px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.25);
          }
          .leaflet-popup-tip { background: #0F172A; }
          .custom-hazard-pin {
            background-color: #DC2626;
            width: 22px;
            height: 22px;
            border-radius: 50% 50% 50% 0;
            transform: rotate(-45deg);
            border: 2px solid #FFFFFF;
            box-shadow: 0 2px 8px rgba(0,0,0,0.4);
          }
          .hint-banner {
            position: absolute;
            bottom: 8px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(15, 23, 42, 0.85);
            color: #FFFFFF;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 11px;
            font-family: sans-serif;
            font-weight: 600;
            z-index: 1000;
            pointer-events: none;
            white-space: nowrap;
          }
        </style>
      </head>
      <body>
        <div id="map"></div>
        <div class="hint-banner">👆 Tap map to place hazard pin</div>
        <script>
          var lat = ${lat};
          var lng = ${lng};

          var map = L.map('map', {
            zoomControl: true,
            attributionControl: false
          }).setView([lat, lng], 14);

          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19
          }).addTo(map);

          var hazardIcon = L.divIcon({
            className: 'custom-hazard-pin-container',
            html: '<div class="custom-hazard-pin"></div>',
            iconSize: [22, 22],
            iconAnchor: [11, 22],
            popupAnchor: [0, -22]
          });

          var marker = L.marker([lat, lng], {
            icon: hazardIcon,
            draggable: true
          }).addTo(map);

          var initialPopup = ${JSON.stringify(address || 'Hazard Site Pinned')};
          marker.bindPopup("<b>⚠️ Ground Hazard Location</b><br/>" + initialPopup).openPopup();

          function notifyLocation(newLat, newLng) {
            marker.setLatLng([newLat, newLng]);
            marker.bindPopup("<b>⚠️ Ground Hazard Location</b><br/>Pinned on Map").openPopup();
            window.parent.postMessage({
              type: 'HAZARD_LOCATION_SELECTED',
              lat: newLat,
              lng: newLng
            }, '*');
          }

          map.on('click', function(e) {
            notifyLocation(e.latlng.lat, e.latlng.lng);
          });

          marker.on('dragend', function(e) {
            var position = marker.getLatLng();
            notifyLocation(position.lat, position.lng);
          });

          window.addEventListener('message', function(event) {
            if (event.data && event.data.type === 'PAN_TO') {
              var pLat = Number(event.data.lat);
              var pLng = Number(event.data.lng);
              map.setView([pLat, pLng], 15);
              notifyLocation(pLat, pLng);
            }
          });
        </script>
      </body>
      </html>
    `;
  }, [lat, lng, address]);

  return (
    <View style={[styles.container, { height }]}>
      {/* Map iframe for Web / placeholder for Native */}
      {Platform.OS === 'web' ? (
        <iframe
          ref={iframeRef}
          srcDoc={mapHtml}
          title="Hazard Location Picker"
          style={{
            width: '100%',
            height: '100%',
            border: 'none',
            borderRadius: 14
          }}
        />
      ) : (
        <View style={styles.nativeFallback}>
          <Ionicons name="map" size={36} color="#C81E1E" />
          <Text style={styles.nativeFallbackText}>Interactive Location Picker</Text>
        </View>
      )}

      {/* Floating GPS Recenter Button */}
      <TouchableOpacity
        onPress={snapToGps}
        activeOpacity={0.85}
        style={styles.gpsSnapButton}
      >
        <Ionicons name="locate" size={16} color="#1E3A8A" style={{ marginRight: 4 }} />
        <Text style={styles.gpsSnapText}>Current GPS</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1.2,
    borderColor: '#CBD5E1',
    backgroundColor: '#F8FAFC',
    position: 'relative'
  },
  nativeFallback: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F1F5F9'
  },
  nativeFallbackText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 6
  },
  gpsSnapButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4
  },
  gpsSnapText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1E3A8A'
  }
});
