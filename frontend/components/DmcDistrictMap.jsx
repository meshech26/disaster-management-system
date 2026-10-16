import React, { useMemo, useEffect, useRef } from 'react';
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
  interactive = false,
  showRadius = true,
  editable = false,
  affectedGeometry = null,
  onAreaChange
}) {
  const frameRef = useRef(null);
  const geometryRef = useRef(affectedGeometry);
  geometryRef.current = affectedGeometry;
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const receive = (event) => {
      if (event.source !== frameRef.current?.contentWindow) return;
      if (event.data?.type === 'dmc-map-ready') {
        frameRef.current.contentWindow.postMessage({ type: 'dmc-area-sync', geometry: geometryRef.current }, '*');
      }
      if (editable && event.data?.type === 'dmc-area-changed') onAreaChange?.(event.data.geometry);
    };
    window.addEventListener('message', receive);
    return () => window.removeEventListener('message', receive);
  }, [editable, onAreaChange]);
  useEffect(() => {
    if (Platform.OS === 'web') frameRef.current?.contentWindow?.postMessage({ type: 'dmc-area-sync', geometry: affectedGeometry }, '*');
  }, [affectedGeometry]);
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
          if (${showRadius}) L.circle([lat, lng], {
            color: '#DC2626',
            fillColor: '#F87171',
            fillOpacity: 0.28,
            weight: 2,
            radius: 8500
          }).addTo(map);

          const areaLayer = L.featureGroup().addTo(map);
          const draftLayer = L.featureGroup().addTo(map);
          let points = [];
          let drawing = false;
          const areaStyle = { color: '#DC2626', fillColor: '#F87171', fillOpacity: 0.28, weight: 3 };
          function renderArea(geometry) {
            areaLayer.clearLayers();
            if (geometry) {
              const boundary = L.geoJSON(geometry, { style: areaStyle }).addTo(areaLayer);
              if (!${editable} && boundary.getBounds().isValid()) {
                map.closePopup();
                map.fitBounds(boundary.getBounds(), { padding: [28, 28], maxZoom: 16 });
              }
            }
          }
          function publish(geometry) {
            renderArea(geometry);
            window.parent.postMessage({ type: 'dmc-area-changed', geometry }, '*');
          }
          window.addEventListener('message', (event) => {
            if (event.source === window.parent && event.data?.type === 'dmc-area-sync') renderArea(event.data.geometry);
          });
          if (${editable}) {
            const tools = L.control({ position: 'topright' });
            tools.onAdd = () => {
              const box = L.DomUtil.create('div');
              box.style.cssText = 'padding:10px;background:white;border-radius:8px;max-width:260px;box-shadow:0 2px 8px #0003;font:14px/1.5 sans-serif';
              box.innerHTML = '<div style="display:flex;flex-wrap:wrap;gap:6px"><button id="area-draw">Draw area</button><button id="area-finish" disabled>Finish</button><button id="area-undo" disabled>Undo</button><button id="area-cancel" disabled>Cancel</button><button id="area-clear">Clear</button></div><div id="area-help" style="margin-top:6px">Draw the affected boundary on the map.</div>';
              L.DomEvent.disableClickPropagation(box);
              L.DomEvent.disableScrollPropagation(box);
              return box;
            };
            tools.addTo(map);
            const button = (name) => document.getElementById('area-' + name);
            const help = button('help');
            function updateTools() {
              button('finish').disabled = !drawing || points.length < 3;
              button('undo').disabled = !drawing || !points.length;
              button('cancel').disabled = !drawing;
              map.getContainer().style.cursor = drawing ? 'crosshair' : '';
            }
            function renderDraft() {
              draftLayer.clearLayers();
              if (points.length > 1) L.polyline(points, { color: '#DC2626', dashArray: '6 4' }).addTo(draftLayer);
              points.forEach((point) => L.circleMarker(point, { radius: 5, color: '#DC2626' }).addTo(draftLayer));
              updateTools();
            }
            function stop() { drawing = false; points = []; draftLayer.clearLayers(); updateTools(); }
            button('draw').onclick = () => { drawing = true; points = []; map.closePopup(); renderDraft(); help.textContent = 'Click at least 3 boundary points, then Finish.'; };
            button('finish').onclick = () => {
              if (points.length < 3) return;
              const geometry = L.polygon(points).toGeoJSON().geometry;
              stop(); publish(geometry); help.textContent = 'Affected area selected. It will be saved with this warning.';
            };
            button('undo').onclick = () => { points.pop(); renderDraft(); };
            button('cancel').onclick = () => { stop(); help.textContent = 'Drawing cancelled.'; };
            button('clear').onclick = () => { stop(); publish(null); help.textContent = 'Affected area cleared.'; };
            map.on('click', (event) => { if (drawing) { points.push(event.latlng); renderDraft(); } });
          }
          window.parent.postMessage({ type: 'dmc-map-ready' }, '*');

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
  }, [targetLat, targetLng, targetZoom, districtName, address, interactive, showRadius, editable]);

  if (Platform.OS === 'web') {
    return (
      <View style={[styles.container, { height }]}>
        <iframe
          ref={frameRef}
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
