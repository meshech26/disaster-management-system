/**
 * Reverse geocode latitude and longitude to human-readable address
 * Formatted as "Area/Town, District" (e.g. "Malabe, Colombo", "Kandy", "Galle")
 */

const SRI_LANKA_KEY_TOWNS = [
  { name: 'Colombo', district: 'Colombo', lat: 6.9271, lon: 79.8612 },
  { name: 'Malabe', district: 'Colombo', lat: 6.9042, lon: 79.9542 },
  { name: 'Kaduwela', district: 'Colombo', lat: 6.9333, lon: 79.9833 },
  { name: 'Battaramulla', district: 'Colombo', lat: 6.8990, lon: 79.9200 },
  { name: 'Kelanimulla', district: 'Colombo', lat: 6.9452, lon: 79.9100 },
  { name: 'Nugegoda', district: 'Colombo', lat: 6.8649, lon: 79.8997 },
  { name: 'Maharagama', district: 'Colombo', lat: 6.8480, lon: 79.9265 },
  { name: 'Dehiwala', district: 'Colombo', lat: 6.8511, lon: 79.8659 },
  { name: 'Moratuwa', district: 'Colombo', lat: 6.7730, lon: 79.8816 },
  { name: 'Homagama', district: 'Colombo', lat: 6.8414, lon: 80.0033 },
  { name: 'Negombo', district: 'Gampaha', lat: 7.2008, lon: 79.8736 },
  { name: 'Gampaha', district: 'Gampaha', lat: 7.0917, lon: 79.9997 },
  { name: 'Kelaniya', district: 'Gampaha', lat: 6.9553, lon: 79.9197 },
  { name: 'Wattala', district: 'Gampaha', lat: 6.9897, lon: 79.8920 },
  { name: 'Kalutara', district: 'Kalutara', lat: 6.5854, lon: 79.9607 },
  { name: 'Panadura', district: 'Kalutara', lat: 6.7132, lon: 79.9074 },
  { name: 'Kandy', district: 'Kandy', lat: 7.2906, lon: 80.6337 },
  { name: 'Peradeniya', district: 'Kandy', lat: 7.2600, lon: 80.5960 },
  { name: 'Matale', district: 'Matale', lat: 7.4675, lon: 80.6234 },
  { name: 'Nuwara Eliya', district: 'Nuwara Eliya', lat: 6.9497, lon: 80.7891 },
  { name: 'Galle', district: 'Galle', lat: 6.0535, lon: 80.2210 },
  { name: 'Matara', district: 'Matara', lat: 5.9549, lon: 80.5550 },
  { name: 'Hambantota', district: 'Hambantota', lat: 6.1429, lon: 81.1212 },
  { name: 'Jaffna', district: 'Jaffna', lat: 9.6615, lon: 80.0255 },
  { name: 'Batticaloa', district: 'Batticaloa', lat: 7.7310, lon: 81.6747 },
  { name: 'Trincomalee', district: 'Trincomalee', lat: 8.5874, lon: 81.2152 },
  { name: 'Kurunegala', district: 'Kurunegala', lat: 7.4863, lon: 80.3623 },
  { name: 'Anuradhapura', district: 'Anuradhapura', lat: 8.3114, lon: 80.4037 },
  { name: 'Badulla', district: 'Badulla', lat: 6.9934, lon: 81.0550 },
  { name: 'Ratnapura', district: 'Ratnapura', lat: 6.6828, lon: 80.4034 }
];

const getNearestSriLankanLocation = (lat, lon) => {
  if (typeof lat !== 'number' || typeof lon !== 'number' || isNaN(lat) || isNaN(lon)) {
    return 'Colombo, Western Province';
  }
  let minD = Infinity;
  let closest = SRI_LANKA_KEY_TOWNS[0];
  for (const t of SRI_LANKA_KEY_TOWNS) {
    const dLat = t.lat - lat;
    const dLon = (t.lon - lon) * Math.cos((lat * Math.PI) / 180);
    const dist = dLat * dLat + dLon * dLon;
    if (dist < minD) {
      minD = dist;
      closest = t;
    }
  }
  if (closest.name.toLowerCase() === closest.district.toLowerCase()) {
    return closest.district;
  }
  return `${closest.name}, ${closest.district}`;
};

const formatSriLankanAddress = (addr) => {
  if (!addr) return null;
  const town =
    addr.town ||
    addr.city ||
    addr.municipality ||
    addr.suburb ||
    addr.neighbourhood ||
    addr.village ||
    addr.hamlet;

  let district = addr.state_district || addr.district || addr.county || addr.state;
  if (district) {
    district = district.replace(/\s+District$/i, '').trim();
  }

  if (town && district) {
    if (town.toLowerCase() === district.toLowerCase()) {
      return district;
    }
    return `${town}, ${district}`;
  }
  return town || district || null;
};

const reverseGeocode = async (lat, lon) => {
  const numLat = Number(lat);
  const numLon = Number(lon);
  if (isNaN(numLat) || isNaN(numLon)) {
    return 'Colombo, Western Province';
  }

  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${numLat}&lon=${numLon}&zoom=16&addressdetails=1`;
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'DisasterManagementApp/1.0',
        Accept: 'application/json'
      }
    });

    if (response.ok) {
      const data = await response.json();
      const formatted = formatSriLankanAddress(data.address);
      if (formatted) {
        return formatted;
      }
    }
  } catch (error) {
    console.warn('[Geocoding] OSM reverse geocode failed, using nearest fallback:', error.message);
  }

  return getNearestSriLankanLocation(numLat, numLon);
};

module.exports = {
  reverseGeocode,
  formatSriLankanAddress,
  getNearestSriLankanLocation
};
