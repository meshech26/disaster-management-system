const isPosition = (value) => Array.isArray(value) && value.length === 2 &&
  value.every(Number.isFinite) && Math.abs(value[0]) <= 180 && Math.abs(value[1]) <= 90;

export const getWarningLocation = (warning) => {
  const area = warning?.affectedArea;
  const incidentLocation = warning?.incidentId?.location;
  const coordinates = [area?.coordinates, incidentLocation?.coordinates, area?.geometry?.coordinates?.[0]?.[0]]
    .find(isPosition) || null;
  return {
    coordinates,
    address: area?.address || incidentLocation?.address || warning?.affectedDistrict || 'Location unavailable'
  };
};

export const getWarningImage = (warning) => warning?.incidentId?.mediaUrls
  ?.find((media) => media.url && media.resourceType !== 'video')?.url || null;

export const mergeActiveWarning = (warnings, warning) => {
  if (!warning?._id) return warnings;
  const remaining = warnings.filter((item) => item._id !== warning._id);
  return warning.status === 'active' && warning.isActive !== false
    ? [warning, ...remaining]
    : remaining;
};
