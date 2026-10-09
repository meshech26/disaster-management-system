/**
 * Geocoding Service for Sri Lanka
 * Reverse geocodes coordinates to clean "Area/Town, District" format
 * (e.g. "Malabe, Colombo", "Kelanimulla, Colombo", "Kandy", "Galle")
 */

const SRI_LANKA_KEY_TOWNS = [
  // Colombo District
  { name: 'Colombo', district: 'Colombo', lat: 6.9271, lon: 79.8612 },
  { name: 'Malabe', district: 'Colombo', lat: 6.9042, lon: 79.9542 },
  { name: 'Kaduwela', district: 'Colombo', lat: 6.9333, lon: 79.9833 },
  { name: 'Battaramulla', district: 'Colombo', lat: 6.8990, lon: 79.9200 },
  { name: 'Kelanimulla', district: 'Colombo', lat: 6.9452, lon: 79.9100 },
  { name: 'Rajagiriya', district: 'Colombo', lat: 6.9092, lon: 79.8967 },
  { name: 'Nugegoda', district: 'Colombo', lat: 6.8649, lon: 79.8997 },
  { name: 'Maharagama', district: 'Colombo', lat: 6.8480, lon: 79.9265 },
  { name: 'Kottawa', district: 'Colombo', lat: 6.8419, lon: 79.9653 },
  { name: 'Dehiwala', district: 'Colombo', lat: 6.8511, lon: 79.8659 },
  { name: 'Mount Lavinia', district: 'Colombo', lat: 6.8344, lon: 79.8647 },
  { name: 'Moratuwa', district: 'Colombo', lat: 6.7730, lon: 79.8816 },
  { name: 'Piliyandala', district: 'Colombo', lat: 6.8018, lon: 79.9227 },
  { name: 'Homagama', district: 'Colombo', lat: 6.8414, lon: 80.0033 },
  { name: 'Kolonnawa', district: 'Colombo', lat: 6.9300, lon: 79.8833 },
  { name: 'Avissawella', district: 'Colombo', lat: 6.9536, lon: 80.2106 },

  // Gampaha District
  { name: 'Kelaniya', district: 'Gampaha', lat: 6.9553, lon: 79.9197 },
  { name: 'Wattala', district: 'Gampaha', lat: 6.9897, lon: 79.8920 },
  { name: 'Peliyagoda', district: 'Gampaha', lat: 6.9678, lon: 79.8887 },
  { name: 'Kiribathgoda', district: 'Gampaha', lat: 6.9806, lon: 79.9292 },
  { name: 'Kadawatha', district: 'Gampaha', lat: 7.0019, lon: 79.9536 },
  { name: 'Ragama', district: 'Gampaha', lat: 7.0250, lon: 79.9230 },
  { name: 'Ja-Ela', district: 'Gampaha', lat: 7.0754, lon: 79.8913 },
  { name: 'Negombo', district: 'Gampaha', lat: 7.2008, lon: 79.8736 },
  { name: 'Gampaha', district: 'Gampaha', lat: 7.0917, lon: 79.9997 },
  { name: 'Nittambuwa', district: 'Gampaha', lat: 7.1444, lon: 80.0967 },
  { name: 'Minuwangoda', district: 'Gampaha', lat: 7.1681, lon: 79.9511 },

  // Kalutara District
  { name: 'Panadura', district: 'Kalutara', lat: 6.7132, lon: 79.9074 },
  { name: 'Kalutara', district: 'Kalutara', lat: 6.5854, lon: 79.9607 },
  { name: 'Horana', district: 'Kalutara', lat: 6.7144, lon: 80.0633 },
  { name: 'Beruwala', district: 'Kalutara', lat: 6.4789, lon: 79.9828 },
  { name: 'Aluthgama', district: 'Kalutara', lat: 6.4328, lon: 79.9983 },

  // Kandy District
  { name: 'Kandy', district: 'Kandy', lat: 7.2906, lon: 80.6337 },
  { name: 'Peradeniya', district: 'Kandy', lat: 7.2600, lon: 80.5960 },
  { name: 'Katugastota', district: 'Kandy', lat: 7.3248, lon: 80.6214 },
  { name: 'Gampola', district: 'Kandy', lat: 7.1643, lon: 80.5694 },
  { name: 'Nawalapitiya', district: 'Kandy', lat: 7.0500, lon: 80.5333 },

  // Matale & Nuwara Eliya
  { name: 'Matale', district: 'Matale', lat: 7.4675, lon: 80.6234 },
  { name: 'Dambulla', district: 'Matale', lat: 7.8742, lon: 80.6511 },
  { name: 'Nuwara Eliya', district: 'Nuwara Eliya', lat: 6.9497, lon: 80.7891 },
  { name: 'Hatton', district: 'Nuwara Eliya', lat: 6.8917, lon: 80.5956 },

  // Galle, Matara, Hambantota
  { name: 'Galle', district: 'Galle', lat: 6.0535, lon: 80.2210 },
  { name: 'Hikkaduwa', district: 'Galle', lat: 6.1400, lon: 80.1008 },
  { name: 'Karapitiya', district: 'Galle', lat: 6.0680, lon: 80.2285 },
  { name: 'Ambalangoda', district: 'Galle', lat: 6.2361, lon: 80.0542 },
  { name: 'Matara', district: 'Matara', lat: 5.9549, lon: 80.5550 },
  { name: 'Weligama', district: 'Matara', lat: 5.9722, lon: 80.4286 },
  { name: 'Mirissa', district: 'Matara', lat: 5.9483, lon: 80.4578 },
  { name: 'Hambantota', district: 'Hambantota', lat: 6.1429, lon: 81.1212 },
  { name: 'Tangalle', district: 'Hambantota', lat: 6.0244, lon: 80.7941 },

  // Northern & Eastern
  { name: 'Jaffna', district: 'Jaffna', lat: 9.6615, lon: 80.0255 },
  { name: 'Kilinochchi', district: 'Kilinochchi', lat: 9.3803, lon: 80.3770 },
  { name: 'Mannar', district: 'Mannar', lat: 8.9810, lon: 79.9044 },
  { name: 'Vavuniya', district: 'Vavuniya', lat: 8.7542, lon: 80.4982 },
  { name: 'Mullaitivu', district: 'Mullaitivu', lat: 9.2671, lon: 80.8142 },
  { name: 'Batticaloa', district: 'Batticaloa', lat: 7.7310, lon: 81.6747 },
  { name: 'Ampara', district: 'Ampara', lat: 7.2912, lon: 81.6724 },
  { name: 'Kalmunai', district: 'Ampara', lat: 7.4167, lon: 81.8333 },
  { name: 'Trincomalee', district: 'Trincomalee', lat: 8.5874, lon: 81.2152 },

  // North Western & North Central
  { name: 'Kurunegala', district: 'Kurunegala', lat: 7.4863, lon: 80.3623 },
  { name: 'Kuliyapitiya', district: 'Kurunegala', lat: 7.4689, lon: 80.0401 },
  { name: 'Puttalam', district: 'Puttalam', lat: 8.0362, lon: 79.8283 },
  { name: 'Chilaw', district: 'Puttalam', lat: 7.5758, lon: 79.7953 },
  { name: 'Anuradhapura', district: 'Anuradhapura', lat: 8.3114, lon: 80.4037 },
  { name: 'Polonnaruwa', district: 'Polonnaruwa', lat: 7.9403, lon: 81.0188 },

  // Uva & Sabaragamuwa
  { name: 'Badulla', district: 'Badulla', lat: 6.9934, lon: 81.0550 },
  { name: 'Bandarawela', district: 'Badulla', lat: 6.8333, lon: 80.9833 },
  { name: 'Monaragala', district: 'Monaragala', lat: 6.8728, lon: 81.3507 },
  { name: 'Wellawaya', district: 'Monaragala', lat: 6.7389, lon: 81.1022 },
  { name: 'Ratnapura', district: 'Ratnapura', lat: 6.6828, lon: 80.4034 },
  { name: 'Balangoda', district: 'Ratnapura', lat: 6.6500, lon: 80.7000 },
  { name: 'Embilipitiya', district: 'Ratnapura', lat: 6.2994, lon: 80.8522 },
  { name: 'Kegalle', district: 'Kegalle', lat: 7.2513, lon: 80.3464 },
  { name: 'Mawanella', district: 'Kegalle', lat: 7.2528, lon: 80.4467 }
];

/**
 * Fallback nearest Sri Lankan town & district
 */
export const getNearestSriLankanLocation = (lat, lon) => {
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

/**
 * Format address object from OpenStreetMap Nominatim
 */
export const formatSriLankanAddress = (addr) => {
  if (!addr) return null;
  // Area/town: prioritize town/city/municipality over suburb, then suburb/village
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

// In-memory cache for fast lookups
const geocodeCache = new Map();

/**
 * Reverse geocode coordinates to human-readable "area/town, district"
 */
export const reverseGeocode = async (lat, lon) => {
  if (typeof lat !== 'number' || typeof lon !== 'number' || isNaN(lat) || isNaN(lon)) {
    return 'Colombo, Western Province';
  }

  const cacheKey = `${lat.toFixed(4)},${lon.toFixed(4)}`;
  if (geocodeCache.has(cacheKey)) {
    return geocodeCache.get(cacheKey);
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2500);

    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=16&addressdetails=1`;
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'DisasterManagementApp/1.0',
        Accept: 'application/json'
      },
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      const formatted = formatSriLankanAddress(data.address);
      if (formatted) {
        geocodeCache.set(cacheKey, formatted);
        return formatted;
      }
    }
  } catch (error) {
    // Timeout or network error - use offline nearest location
  }

  const fallback = getNearestSriLankanLocation(lat, lon);
  geocodeCache.set(cacheKey, fallback);
  return fallback;
};

export default {
  reverseGeocode,
  formatSriLankanAddress,
  getNearestSriLankanLocation
};
