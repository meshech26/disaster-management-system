const crypto = require('crypto');

// Stable stringify: sorts object keys so the same data always produces the same hash.
function canonicalStringify(value) {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (value instanceof Date) return JSON.stringify(value.toISOString());
  if (Array.isArray(value)) return `[${value.map(canonicalStringify).join(',')}]`;
  const keys = Object.keys(value).sort();
  return `{${keys.map((k) => `${JSON.stringify(k)}:${canonicalStringify(value[k])}`).join(',')}}`;
}

function sha256Of(value) {
  // JSON round-trip first so Dates / ObjectIds become the same strings that get stored & re-read.
  const plain = JSON.parse(JSON.stringify(value));
  return crypto.createHash('sha256').update(canonicalStringify(plain)).digest('hex');
}

module.exports = { canonicalStringify, sha256Of };
